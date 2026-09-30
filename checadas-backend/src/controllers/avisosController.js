const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

async function listarAvisos(req, res) {
  try {
    const ahora = new Date();
    const [rows] = await pool.query(
      `SELECT * FROM avisos 
       WHERE activo = 1 
         AND (fecha_inicio IS NULL OR fecha_inicio <= ?)
         AND (fecha_fin IS NULL OR fecha_fin >= ?)
       ORDER BY prioridad DESC, id ASC`,
      [ahora, ahora]
    );
    res.json({ avisos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener avisos' });
  }
}

async function listarTodosAvisos(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM avisos ORDER BY prioridad DESC, id ASC');
    res.json({ avisos: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener avisos' });
  }
}

async function crearAviso(req, res) {
  const { titulo, contenido, tipo, color_fondo, color_texto, prioridad, duracion_segundos, fecha_inicio, fecha_fin } = req.body;
  if (!titulo) return res.status(400).json({ error: 'El título es requerido' });
  try {
    let media_url = null;
    if (req.file) {
      media_url = `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/avisos/${req.file.filename}`;
    }
    const [result] = await pool.query(
      `INSERT INTO avisos (titulo, contenido, tipo, media_url, color_fondo, color_texto, prioridad, duracion_segundos, fecha_inicio, fecha_fin) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        contenido || null,
        tipo || 'texto',
        media_url,
        color_fondo || '#1E293B',
        color_texto || '#FFFFFF',
        prioridad || 0,
        duracion_segundos || 10,
        fecha_inicio || null,
        fecha_fin || null
      ]
    );
    const [rows] = await pool.query('SELECT * FROM avisos WHERE id = ?', [result.insertId]);
    res.status(201).json({ aviso: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear aviso' });
  }
}

async function actualizarAviso(req, res) {
  const { id } = req.params;
  const { titulo, contenido, tipo, color_fondo, color_texto, prioridad, duracion_segundos, activo, fecha_inicio, fecha_fin } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM avisos WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Aviso no encontrado' });
    let media_url = rows[0].media_url;
    if (req.file) {
      media_url = `${process.env.BASE_URL || 'http://localhost:4000'}/uploads/avisos/${req.file.filename}`;
    }
    await pool.query(
      `UPDATE avisos SET 
        titulo = COALESCE(?, titulo),
        contenido = COALESCE(?, contenido),
        tipo = COALESCE(?, tipo),
        media_url = ?,
        color_fondo = COALESCE(?, color_fondo),
        color_texto = COALESCE(?, color_texto),
        prioridad = COALESCE(?, prioridad),
        duracion_segundos = COALESCE(?, duracion_segundos),
        activo = COALESCE(?, activo),
        fecha_inicio = ?,
        fecha_fin = ?,
        actualizado_en = NOW()
       WHERE id = ?`,
      [titulo, contenido, tipo, media_url, color_fondo, color_texto, prioridad, duracion_segundos, activo !== undefined ? activo : null, fecha_inicio || null, fecha_fin || null, id]
    );
    const [updated] = await pool.query('SELECT * FROM avisos WHERE id = ?', [id]);
    res.json({ aviso: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar aviso' });
  }
}

async function eliminarAviso(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM avisos WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Aviso no encontrado' });
    await pool.query('DELETE FROM avisos WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar aviso' });
  }
}

module.exports = { listarAvisos, listarTodosAvisos, crearAviso, actualizarAviso, eliminarAviso };
