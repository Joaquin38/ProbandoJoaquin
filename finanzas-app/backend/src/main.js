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

function parseFecha(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : value;
}

function esNumeroPositivo(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
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

  if (!hogarId) {
    return res.status(400).json({ error: 'hogar_id es obligatorio' });
  }

  if ((req.query.desde && !desde) || (req.query.hasta && !hasta)) {
    return res.status(400).json({ error: 'desde/hasta deben tener formato YYYY-MM-DD' });
  }

  try {
    const params = [hogarId];
    const filtros = ['m.hogar_id = $1'];

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
        creado_por_usuario_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
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
      WHERE id = $4
      RETURNING id, fecha, descripcion, categoria_id, cuenta_id
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
    const { rowCount } = await pool.query('DELETE FROM movimientos WHERE id = $1', [movimientoId]);

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

  if (!hogarId) {
    return res.status(400).json({ error: 'hogar_id es obligatorio' });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN tm.codigo = 'ingreso' THEN m.monto_ars END), 0) AS ingresos,
        COALESCE(SUM(CASE WHEN tm.codigo = 'egreso' THEN m.monto_ars END), 0) AS egresos,
        COALESCE(SUM(CASE WHEN tm.codigo = 'ahorro' THEN m.monto_ars END), 0) AS ahorros,
        COALESCE(COUNT(m.id), 0) AS cantidad_movimientos
      FROM movimientos m
      JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id
      WHERE m.hogar_id = $1
      `,
      [hogarId]
    );

    const resumen = rows[0] || { ingresos: 0, egresos: 0, ahorros: 0, cantidad_movimientos: 0 };
    const balance = Number(resumen.ingresos) - Number(resumen.egresos);

    return res.status(200).json({
      ingresos: Number(resumen.ingresos),
      egresos: Number(resumen.egresos),
      ahorros: Number(resumen.ahorros),
      balance,
      cantidad_movimientos: Number(resumen.cantidad_movimientos)
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

app.get('/gastos-fijos', async (req, res) => {
  const hogarId = Number(req.query.hogar_id);

  if (!hogarId) {
    return res.status(400).json({ error: 'hogar_id es obligatorio' });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT gf.id, gf.descripcion, gf.moneda, gf.monto_base, gf.dia_vencimiento, c.nombre AS categoria
      FROM gastos_fijos gf
      JOIN categorias c ON c.id = gf.categoria_id
      WHERE gf.hogar_id = $1 AND gf.activo = true
      ORDER BY gf.id DESC
      `,
      [hogarId]
    );

    return res.status(200).json({ total: rows.length, items: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Error consultando gastos fijos', detalle: error.message });
  }
});

app.post('/gastos-fijos', async (req, res) => {
  const { hogar_id, categoria_id, descripcion, moneda, monto_base, dia_vencimiento } = req.body;

  if (!hogar_id || !categoria_id || !descripcion || !moneda || !monto_base) {
    return res.status(400).json({ error: 'hogar_id, categoria_id, descripcion, moneda y monto_base son obligatorios' });
  }

  if (!['ARS', 'USD'].includes(moneda)) {
    return res.status(400).json({ error: 'moneda debe ser ARS o USD' });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO gastos_fijos (hogar_id, categoria_id, descripcion, moneda, monto_base, dia_vencimiento)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, hogar_id, categoria_id, descripcion, moneda, monto_base, dia_vencimiento
      `,
      [hogar_id, categoria_id, descripcion, moneda, monto_base, dia_vencimiento || null]
    );

    return res.status(201).json({ ok: true, gasto_fijo: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Error creando gasto fijo', detalle: error.message });
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
