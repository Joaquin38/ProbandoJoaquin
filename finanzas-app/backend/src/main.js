const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
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

const port = Number(process.env.API_PORT || 3000);
app.listen(port, () => {
  console.log(`finanzas-backend escuchando en http://localhost:${port}`);
});
