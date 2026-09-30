const pool = require('../config/db');
require('dotenv').config();

const TIPOS_VALIDOS = ['entrada', 'salida', 'salida_descanso', 'entrada_descanso'];

async function registrarChecada(req, res) {
  const empleadoId = req.empleadoId;
  const { tipo, dispositivo_id, metodo_auth } = req.body;

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ error: `tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` });
  }

  let fotoUrl = null;
  if (tipo === 'entrada') {
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere foto para checar entrada' });
    }
    fotoUrl = `${process.env.BASE_URL}/uploads/checadas/${req.file.filename}`;
  }

  const [resultado] = await pool.query(
    `INSERT INTO checadas (empleado_id, tipo, foto_url, dispositivo_id, metodo_auth)
     VALUES (?, ?, ?, ?, ?)`,
    [empleadoId, tipo, fotoUrl, dispositivo_id || null, metodo_auth || 'webauthn']
  );

  res.status(201).json({
    id: resultado.insertId,
    empleadoId,
    tipo,
    fotoUrl,
    timestamp: new Date().toISOString(),
  });
}

async function ultimaChecadaDelDia(req, res) {
  const empleadoId = req.empleadoId;
  const [rows] = await pool.query(
    `SELECT tipo, timestamp FROM checadas
     WHERE empleado_id = ? AND DATE(timestamp) = CURDATE()
     ORDER BY timestamp DESC LIMIT 1`,
    [empleadoId]
  );
  res.json({ ultima: rows[0] || null });
}

module.exports = { registrarChecada, ultimaChecadaDelDia };
