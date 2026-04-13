const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'finanzas_db',
  user: process.env.DB_USER || 'finanzas',
  password: process.env.DB_PASSWORD || 'finanzas_dev'
});
const COTIZACIONES_API_PUBLICA = 'https://dolarapi.com/v1/dolares';

function parseFecha(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : value;
}

function esNumeroPositivo(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

function resolveCiclo(ciclo, desde) {
  if (ciclo && /^\d{4}-\d{2}$/.test(ciclo)) return ciclo;
  if (desde) return String(desde).slice(0, 7);
  return new Date().toISOString().slice(0, 7);
}

function cicloEsValido(ciclo) {
  return /^\d{4}-\d{2}$/.test(ciclo || '');
}

function finDeCiclo(ciclo) {
  const [anioTexto, mesTexto] = String(ciclo).split('-');
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  return new Date(anio, mes, 0);
}

function aplicarAjustes(montoBase, ajustes) {
  return ajustes.reduce((acc, ajuste) => {
    if (ajuste.tipo_ajuste === 'porcentaje') {
      return acc * (1 + Number(ajuste.valor) / 100);
    }
    return acc + Number(ajuste.valor);
  }, Number(montoBase));
}

async function sincronizarCotizacionesDesdeApiPublica() {
  const response = await fetch(COTIZACIONES_API_PUBLICA);
  if (!response.ok) {
    throw new Error(`API pública respondió ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('La API pública no devolvió cotizaciones');
  }

  const cotizaciones = payload
    .filter((item) => item?.casa && Number(item?.venta) > 0)
    .map((item) => {
      const fechaBase = item.fechaActualizacion || item.fecha || new Date().toISOString();
      const fecha = String(fechaBase).slice(0, 10);

      return {
        fecha,
        fuente: String(item.casa).toLowerCase(),
        compra: item.compra ? Number(item.compra) : null,
        venta: Number(item.venta)
      };
    });

  for (const coti of cotizaciones) {
    await pool.query(
      `
      INSERT INTO cotizaciones_dolar (fecha, fuente, compra, venta)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (fecha, fuente)
      DO UPDATE SET compra = EXCLUDED.compra, venta = EXCLUDED.venta
      `,
      [coti.fecha, coti.fuente, coti.compra, coti.venta]
    );
  }
}

app.get('/salud', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ ok: true, servicio: 'finanzas-backend', db: 'ok' });
  } catch (error) {
    res.status(500).json({ ok: false, servicio: 'finanzas-backend', db: 'error', detalle: error.message });
  }
});

app.get('/movimientos', async (req, res) => {
  const hogarId = Number(req.query.hogar_id);
  const desde = parseFecha(req.query.desde);
  const hasta = parseFecha(req.query.hasta);
  const incluirEliminados = String(req.query.incluir_eliminados || 'false') === 'true';

  if (!hogarId) {
    return res.status(400).json({ error: 'hogar_id es obligatorio' });
  }

  if ((req.query.desde && !desde) || (req.query.hasta && !hasta)) {
    return res.status(400).json({ error: 'desde/hasta deben tener formato YYYY-MM-DD' });
  }

  try {
    const params = [hogarId];
    const filtros = ['m.hogar_id = $1'];

    if (!incluirEliminados) {
      filtros.push('m.activo = true');
    }

    if (desde) {
      params.push(desde);
      filtros.push(`m.fecha >= $${params.length}`);
    }

    if (hasta) {
      params.push(hasta);
      filtros.push(`m.fecha <= $${params.length}`);
    }

    const query = `
      SELECT
        m.id,
        m.fecha,
        m.descripcion,
        m.moneda_original,
        m.monto_original,
        m.cotizacion_aplicada,
        m.monto_ars,
        m.usa_ahorro,
        m.activo,
        m.eliminado_en,
        tm.codigo AS tipo_movimiento,
        c.nombre AS categoria
      FROM movimientos m
      JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id
      LEFT JOIN categorias c ON c.id = m.categoria_id
      WHERE ${filtros.join(' AND ')}
      ORDER BY m.fecha DESC, m.id DESC
    `;

    const { rows } = await pool.query(query, params);
    return res.status(200).json({ total: rows.length, items: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Error consultando movimientos', detalle: error.message });
  }
});

app.post('/movimientos', async (req, res) => {
  const {
    hogar_id,
    cuenta_id,
    tipo_movimiento_id,
    categoria_id,
    fecha,
    descripcion,
    moneda_original,
    monto_original,
    cotizacion_aplicada,
    monto_ars,
    usa_ahorro,
    creado_por_usuario_id
  } = req.body;

  if (!hogar_id || !tipo_movimiento_id || !fecha || !moneda_original || !monto_original || !monto_ars || !creado_por_usuario_id) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: hogar_id, tipo_movimiento_id, fecha, moneda_original, monto_original, monto_ars, creado_por_usuario_id'
    });
  }

  if (!['ARS', 'USD'].includes(moneda_original)) {
    return res.status(400).json({ error: 'moneda_original debe ser ARS o USD' });
  }

  if (!parseFecha(fecha)) {
    return res.status(400).json({ error: 'fecha debe tener formato YYYY-MM-DD' });
  }

  if (!esNumeroPositivo(monto_original) || !esNumeroPositivo(monto_ars)) {
    return res.status(400).json({ error: 'monto_original y monto_ars deben ser mayores a 0' });
  }

  try {
    const query = `
      INSERT INTO movimientos (
        hogar_id,
        cuenta_id,
        tipo_movimiento_id,
        categoria_id,
        fecha,
        descripcion,
        moneda_original,
        monto_original,
        cotizacion_aplicada,
        monto_ars,
        usa_ahorro,
        creado_por_usuario_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
      RETURNING id, fecha, moneda_original, monto_original, monto_ars
    `;

    const values = [
      hogar_id,
      cuenta_id || null,
      tipo_movimiento_id,
      categoria_id || null,
      fecha,
      descripcion || null,
      moneda_original,
      monto_original,
      cotizacion_aplicada || null,
      monto_ars,
      Boolean(usa_ahorro),
      creado_por_usuario_id
    ];

    const { rows } = await pool.query(query, values);
    return res.status(201).json({ ok: true, movimiento: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error creando movimiento', detalle: error.message });
  }
});

app.patch('/movimientos/:id', async (req, res) => {
  const movimientoId = Number(req.params.id);
  const { descripcion, categoria_id, cuenta_id } = req.body;

  if (!movimientoId) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE movimientos
      SET descripcion = COALESCE($1, descripcion),
          categoria_id = COALESCE($2, categoria_id),
          cuenta_id = COALESCE($3, cuenta_id)
      WHERE id = $4 AND activo = true
      RETURNING id, fecha, descripcion, categoria_id, cuenta_id, activo
      `,
      [descripcion ?? null, categoria_id ?? null, cuenta_id ?? null, movimientoId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }

    return res.status(200).json({ ok: true, movimiento: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error actualizando movimiento', detalle: error.message });
  }
});

app.delete('/movimientos/:id', async (req, res) => {
  const movimientoId = Number(req.params.id);

  if (!movimientoId) {
    return res.status(400).json({ error: 'id inválido' });
  }

  try {
    const { rowCount } = await pool.query(
      `
      UPDATE movimientos
      SET activo = false,
          eliminado_en = NOW()
      WHERE id = $1 AND activo = true
      `,
      [movimientoId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }

    return res.status(200).json({ ok: true, eliminado_id: movimientoId });
  } catch (error) {
    return res.status(500).json({ error: 'Error eliminando movimiento', detalle: error.message });
  }
});

app.get('/categorias', async (req, res) => {
  const hogarId = Number(req.query.hogar_id);

  if (!hogarId) {
    return res.status(400).json({ error: 'hogar_id es obligatorio' });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT c.id, c.nombre, tm.codigo AS tipo_movimiento
      FROM categorias c
      JOIN tipos_movimiento tm ON tm.id = c.tipo_movimiento_id
      WHERE c.hogar_id = $1 AND c.activo = true
      ORDER BY c.nombre ASC
      `,
      [hogarId]
    );

    return res.status(200).json({ total: rows.length, items: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Error consultando categorías', detalle: error.message });
  }
});

app.post('/categorias', async (req, res) => {
  const { hogar_id, nombre, tipo_movimiento_id } = req.body;

  if (!hogar_id || !nombre || !tipo_movimiento_id) {
    return res.status(400).json({ error: 'hogar_id, nombre y tipo_movimiento_id son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO categorias (hogar_id, nombre, tipo_movimiento_id)
      VALUES ($1, $2, $3)
      RETURNING id, hogar_id, nombre, tipo_movimiento_id
      `,
      [hogar_id, nombre.trim(), tipo_movimiento_id]
    );

    return res.status(201).json({ ok: true, categoria: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error creando categoría', detalle: error.message });
  }
});

app.get('/etiquetas', async (req, res) => {
  const hogarId = Number(req.query.hogar_id);

  if (!hogarId) {
    return res.status(400).json({ error: 'hogar_id es obligatorio' });
  }

  try {
    const { rows } = await pool.query('SELECT id, nombre FROM etiquetas WHERE hogar_id = $1 ORDER BY nombre ASC', [hogarId]);
    return res.status(200).json({ total: rows.length, items: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Error consultando etiquetas', detalle: error.message });
  }
});

app.post('/etiquetas', async (req, res) => {
  const { hogar_id, nombre } = req.body;

  if (!hogar_id || !nombre) {
    return res.status(400).json({ error: 'hogar_id y nombre son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO etiquetas (hogar_id, nombre)
      VALUES ($1, $2)
      ON CONFLICT (hogar_id, nombre) DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING id, hogar_id, nombre
      `,
      [hogar_id, nombre.trim()]
    );

    return res.status(201).json({ ok: true, etiqueta: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error creando etiqueta', detalle: error.message });
  }
});

app.get('/dashboard/resumen', async (req, res) => {
  const hogarId = Number(req.query.hogar_id);
  const ciclo = req.query.ciclo;

  if (!hogarId) {
    return res.status(400).json({ error: 'hogar_id es obligatorio' });
  }

  if (ciclo && !cicloEsValido(ciclo)) {
    return res.status(400).json({ error: 'ciclo debe tener formato YYYY-MM' });
  }

  const cicloConsulta = resolveCiclo(ciclo);
  const [anioTexto, mesTexto] = cicloConsulta.split('-');
  const desde = `${cicloConsulta}-01`;
  const hasta = `${cicloConsulta}-${String(new Date(Number(anioTexto), Number(mesTexto), 0).getDate()).padStart(2, '0')}`;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN tm.codigo = 'ingreso' AND m.fecha BETWEEN $2 AND $3 THEN m.monto_ars END), 0) AS ingresos,
        COALESCE(SUM(CASE WHEN tm.codigo = 'egreso' AND m.fecha BETWEEN $2 AND $3 THEN m.monto_ars END), 0) AS egresos,
        COALESCE(SUM(CASE WHEN tm.codigo = 'egreso' AND m.usa_ahorro = true AND m.fecha BETWEEN $2 AND $3 THEN m.monto_ars END), 0) AS egresos_desde_ahorro,
        COALESCE(SUM(CASE WHEN tm.codigo = 'ahorro' AND m.fecha <= $3 THEN m.monto_ars END), 0) AS ahorros_acumulados,
        COALESCE(SUM(CASE WHEN tm.codigo = 'egreso' AND m.usa_ahorro = true AND m.fecha <= $3 THEN m.monto_ars END), 0) AS egresos_desde_ahorro_acumulados,
        COALESCE(COUNT(CASE WHEN m.fecha BETWEEN $2 AND $3 THEN 1 END), 0) AS cantidad_movimientos
      FROM movimientos m
      JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id
      WHERE m.hogar_id = $1
        AND m.activo = true
      `,
      [hogarId, desde, hasta]
    );

    const resumen = rows[0] || { ingresos: 0, egresos: 0, egresos_desde_ahorro: 0, ahorros_acumulados: 0, egresos_desde_ahorro_acumulados: 0, cantidad_movimientos: 0 };
    const ahorrosNetos = Number(resumen.ahorros_acumulados) - Number(resumen.egresos_desde_ahorro_acumulados);
    const balance = Number(resumen.ingresos) - (Number(resumen.egresos) - Number(resumen.egresos_desde_ahorro));

    return res.status(200).json({
      ingresos: Number(resumen.ingresos),
      egresos: Number(resumen.egresos),
      egresos_desde_ahorro: Number(resumen.egresos_desde_ahorro),
      ahorros: ahorrosNetos,
      balance,
      cantidad_movimientos: Number(resumen.cantidad_movimientos),
      ciclo: cicloConsulta
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error consultando resumen', detalle: error.message });
  }
});

app.get('/cotizaciones', async (req, res) => {
  const { fecha } = req.query;

  try {
    if (fecha) {
      const { rows } = await pool.query(
        `
        SELECT fecha, fuente, compra, venta
        FROM cotizaciones_dolar
        WHERE fecha = $1
        ORDER BY fuente ASC
        `,
        [fecha]
      );

      return res.status(200).json({ total: rows.length, items: rows });
    }

    try {
      await sincronizarCotizacionesDesdeApiPublica();
    } catch (syncError) {
      console.warn('No se pudo sincronizar cotizaciones desde API pública:', syncError.message);
    }

    const { rows } = await pool.query(
      `
      SELECT DISTINCT ON (fuente)
        fecha,
        fuente,
        compra,
        venta
      FROM cotizaciones_dolar
      ORDER BY fuente, fecha DESC
      `
    );

    return res.status(200).json({ total: rows.length, items: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Error consultando cotizaciones', detalle: error.message });
  }
});

app.post('/cotizaciones', async (req, res) => {
  const { fecha, fuente, compra, venta } = req.body;

  if (!fecha || !fuente || !venta) {
    return res.status(400).json({ error: 'fecha, fuente y venta son obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO cotizaciones_dolar (fecha, fuente, compra, venta)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (fecha, fuente)
      DO UPDATE SET compra = EXCLUDED.compra, venta = EXCLUDED.venta
      RETURNING id, fecha, fuente, compra, venta
      `,
      [fecha, fuente, compra || null, venta]
    );

    return res.status(201).json({ ok: true, cotizacion: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error creando cotización', detalle: error.message });
  }
});

app.get('/gastos-fijos', async (req, res) => {
  const hogarId = Number(req.query.hogar_id);
  const ciclo = req.query.ciclo;

  if (!hogarId) {
    return res.status(400).json({ error: 'hogar_id es obligatorio' });
  }

  if (ciclo && !cicloEsValido(ciclo)) {
    return res.status(400).json({ error: 'ciclo debe tener formato YYYY-MM' });
  }

  const cicloConsulta = resolveCiclo(ciclo);

  try {
    const { rows: gastos } = await pool.query(
      `
      SELECT
        gf.id,
        gf.descripcion,
        gf.moneda,
        gf.monto_base,
        gf.dia_vencimiento,
        gf.categoria_id,
        gf.activo_desde_ciclo,
        gf.activo_hasta_ciclo,
        c.nombre AS categoria,
        tm.codigo AS tipo_movimiento
      FROM gastos_fijos gf
      JOIN categorias c ON c.id = gf.categoria_id
      JOIN tipos_movimiento tm ON tm.id = c.tipo_movimiento_id
      WHERE gf.hogar_id = $1
        AND gf.activo = true
        AND (gf.activo_desde_ciclo IS NULL OR gf.activo_desde_ciclo <= $2)
        AND (gf.activo_hasta_ciclo IS NULL OR gf.activo_hasta_ciclo >= $2)
      ORDER BY gf.id DESC
      `,
      [hogarId, cicloConsulta]
    );

    const fechaCorte = finDeCiclo(cicloConsulta).toISOString().slice(0, 10);
    const items = [];

    for (const gasto of gastos) {
      const { rows: ajustes } = await pool.query(
        `
        SELECT tipo_ajuste, valor
        FROM ajustes_gastos_fijos
        WHERE gasto_fijo_id = $1
          AND fecha_aplicacion <= $2
        ORDER BY fecha_aplicacion ASC, id ASC
        `,
        [gasto.id, fechaCorte]
      );

      const montoVigente = aplicarAjustes(gasto.monto_base, ajustes);
      items.push({
        ...gasto,
        ciclo: cicloConsulta,
        monto_vigente: Number(montoVigente.toFixed(2))
      });
    }

    return res.status(200).json({ total: items.length, items });
  } catch (error) {
    return res.status(500).json({ error: 'Error consultando gastos fijos', detalle: error.message });
  }
});

app.post('/gastos-fijos', async (req, res) => {
  const { hogar_id, categoria_id, descripcion, moneda, monto_base, dia_vencimiento, ciclo_desde } = req.body;

  if (!hogar_id || !categoria_id || !descripcion || !moneda || !monto_base) {
    return res.status(400).json({ error: 'hogar_id, categoria_id, descripcion, moneda y monto_base son obligatorios' });
  }

  if (!['ARS', 'USD'].includes(moneda)) {
    return res.status(400).json({ error: 'moneda debe ser ARS o USD' });
  }

  if (ciclo_desde && !cicloEsValido(ciclo_desde)) {
    return res.status(400).json({ error: 'ciclo_desde debe tener formato YYYY-MM' });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO gastos_fijos (hogar_id, categoria_id, descripcion, moneda, monto_base, dia_vencimiento, activo_desde_ciclo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, hogar_id, categoria_id, descripcion, moneda, monto_base, dia_vencimiento, activo_desde_ciclo
      `,
      [hogar_id, categoria_id, descripcion, moneda, monto_base, dia_vencimiento || null, ciclo_desde || resolveCiclo()]
    );

    return res.status(201).json({ ok: true, gasto_fijo: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error creando gasto fijo', detalle: error.message });
  }
});

app.patch('/gastos-fijos/:id', async (req, res) => {
  const gastoFijoId = Number(req.params.id);
  const { descripcion, categoria_id, moneda, monto_base, dia_vencimiento } = req.body;

  if (!gastoFijoId) {
    return res.status(400).json({ error: 'id inválido' });
  }

  if (moneda && !['ARS', 'USD'].includes(moneda)) {
    return res.status(400).json({ error: 'moneda debe ser ARS o USD' });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE gastos_fijos
      SET descripcion = COALESCE($1, descripcion),
          categoria_id = COALESCE($2, categoria_id),
          moneda = COALESCE($3, moneda),
          monto_base = COALESCE($4, monto_base),
          dia_vencimiento = COALESCE($5, dia_vencimiento),
          actualizado_en = NOW()
      WHERE id = $6 AND activo = true
      RETURNING id, descripcion, categoria_id, moneda, monto_base, dia_vencimiento
      `,
      [descripcion ?? null, categoria_id ?? null, moneda ?? null, monto_base ?? null, dia_vencimiento ?? null, gastoFijoId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Valor fijo no encontrado' });
    }

    return res.status(200).json({ ok: true, valor_fijo: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error actualizando valor fijo', detalle: error.message });
  }
});

app.delete('/gastos-fijos/:id', async (req, res) => {
  const gastoFijoId = Number(req.params.id);
  const ciclo = req.query.ciclo;

  if (!gastoFijoId) {
    return res.status(400).json({ error: 'id inválido' });
  }

  if (ciclo && !cicloEsValido(ciclo)) {
    return res.status(400).json({ error: 'ciclo debe tener formato YYYY-MM' });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE gastos_fijos
      SET activo_hasta_ciclo = $1,
          actualizado_en = NOW()
      WHERE id = $2 AND activo = true
      RETURNING id, activo_hasta_ciclo
      `,
      [ciclo || resolveCiclo(), gastoFijoId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Valor fijo no encontrado' });
    }

    return res.status(200).json({ ok: true, valor_fijo: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error eliminando valor fijo por ciclo', detalle: error.message });
  }
});

app.post('/gastos-fijos/:id/ajustes', async (req, res) => {
  const gastoFijoId = Number(req.params.id);
  const { fecha_aplicacion, tipo_ajuste, valor, nota } = req.body;

  if (!gastoFijoId || !fecha_aplicacion || !tipo_ajuste || !valor) {
    return res.status(400).json({ error: 'id, fecha_aplicacion, tipo_ajuste y valor son obligatorios' });
  }

  if (!['porcentaje', 'monto_fijo'].includes(tipo_ajuste)) {
    return res.status(400).json({ error: "tipo_ajuste debe ser 'porcentaje' o 'monto_fijo'" });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO ajustes_gastos_fijos (gasto_fijo_id, fecha_aplicacion, tipo_ajuste, valor, nota)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, gasto_fijo_id, fecha_aplicacion, tipo_ajuste, valor, nota
      `,
      [gastoFijoId, fecha_aplicacion, tipo_ajuste, valor, nota || null]
    );

    return res.status(201).json({ ok: true, ajuste: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error creando ajuste de gasto fijo', detalle: error.message });
  }
});

const port = Number(process.env.API_PORT || 3000);
app.listen(port, () => {
  console.log(`finanzas-backend escuchando en http://localhost:${port}`);
});
