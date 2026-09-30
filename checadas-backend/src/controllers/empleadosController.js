const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { verificarPin, hashPin } = require('../utils/pin');
require('dotenv').config();

async function identificar(req, res) {
  const { numero_empleado } = req.body;
  if (!numero_empleado) {
    return res.status(400).json({ error: 'numero_empleado es requerido' });
  }

  const [rows] = await pool.query(
    `SELECT e.id, e.nombre, e.activo,
            EXISTS(SELECT 1 FROM webauthn_credenciales w WHERE w.empleado_id = e.id) AS tiene_webauthn
     FROM empleados e WHERE e.numero_empleado = ?`,
    [numero_empleado]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Numero de empleado no encontrado' });
  }
  const empleado = rows[0];
  if (!empleado.activo) {
    return res.status(403).json({ error: 'Empleado inactivo' });
  }

  res.json({
    empleadoId: empleado.id,
    nombre: empleado.nombre,
    tieneWebAuthn: !!empleado.tiene_webauthn,
  });
}

async function loginPin(req, res) {
  const { empleadoId, pin } = req.body;
  if (!empleadoId || !pin) {
    return res.status(400).json({ error: 'empleadoId y pin son requeridos' });
  }

  const [rows] = await pool.query(
    'SELECT id, pin_hash, activo FROM empleados WHERE id = ?',
    [empleadoId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
  const empleado = rows[0];
  if (!empleado.activo) return res.status(403).json({ error: 'Empleado inactivo' });

  const valido = await verificarPin(pin, empleado.pin_hash);
  if (!valido) return res.status(401).json({ error: 'PIN incorrecto' });

  const token = jwt.sign(
    { tipo: 'checada', empleadoId: empleado.id, metodo: 'pin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_CHECADA_EXPIRES }
  );
  res.json({ token });
}

async function loginAdmin(req, res) {
  const { numero_empleado, pin } = req.body;
  if (!numero_empleado || !pin) {
    return res.status(400).json({ error: 'numero_empleado y pin son requeridos' });
  }

  const [rows] = await pool.query(
    'SELECT id, pin_hash, rol, activo FROM empleados WHERE numero_empleado = ?',
    [numero_empleado]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  const empleado = rows[0];
  if (!empleado.activo || empleado.rol !== 'rh_supervisor') {
    return res.status(403).json({ error: 'No tienes permisos de administrador' });
  }

  const valido = await verificarPin(pin, empleado.pin_hash);
  if (!valido) return res.status(401).json({ error: 'PIN incorrecto' });

  const token = jwt.sign(
    { tipo: 'admin', empleadoId: empleado.id, rol: empleado.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ADMIN_EXPIRES }
  );
  res.json({ token });
}

const ROLES_VALIDOS = ['empleado', 'rh_supervisor'];

async function crearEmpleado(req, res) {
  const { numero_empleado, nombre, pin, rol } = req.body;

  if (!numero_empleado || !nombre || !pin) {
    return res.status(400).json({ error: 'numero_empleado, nombre y pin son requeridos' });
  }
  const rolFinal = rol || 'empleado';
  if (!ROLES_VALIDOS.includes(rolFinal)) {
    return res.status(400).json({ error: `rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}` });
  }
  if (String(pin).length < 4) {
    return res.status(400).json({ error: 'El PIN debe tener al menos 4 digitos' });
  }

  const pinHash = await hashPin(pin);

  try {
    const [resultado] = await pool.query(
      'INSERT INTO empleados (numero_empleado, nombre, rol, pin_hash) VALUES (?, ?, ?, ?)',
      [numero_empleado, nombre, rolFinal, pinHash]
    );
    res.status(201).json({
      id: resultado.insertId,
      numero_empleado,
      nombre,
      rol: rolFinal,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese numero_empleado ya existe' });
    }
    throw err;
  }
}

async function listarEmpleados(req, res) {
  const [rows] = await pool.query(
    'SELECT id, numero_empleado, nombre, rol, activo, creado_en FROM empleados ORDER BY nombre'
  );
  res.json({ empleados: rows });
}

async function loginLocal(req, res) {
  const { empleadoId } = req.body;
  if (!empleadoId) return res.status(400).json({ error: 'empleadoId es requerido' });

  const [rows] = await pool.query(
    'SELECT id, activo FROM empleados WHERE id = ?',
    [empleadoId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
  if (!rows[0].activo) return res.status(403).json({ error: 'Empleado inactivo' });

  const token = jwt.sign(
    { tipo: 'checada', empleadoId: rows[0].id, metodo: 'local_biometria' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_CHECADA_EXPIRES }
  );
  res.json({ token });
}

async function actualizarEmpleado(req, res) {
  const { id } = req.params;
  const { nombre, rol } = req.body;
  if (!nombre && !rol) return res.status(400).json({ error: 'Se requiere al menos nombre o rol' });
  const valid_roles = ['empleado', 'rh_supervisor'];
  if (rol && !valid_roles.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
  try {
    const [rows] = await pool.query('SELECT id FROM empleados WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
    const updates = [];
    const values = [];
    if (nombre) { updates.push('nombre = ?'); values.push(nombre); }
    if (rol) { updates.push('rol = ?'); values.push(rol); }
    values.push(id);
    await pool.query(`UPDATE empleados SET ${updates.join(', ')}, actualizado_en = NOW() WHERE id = ?`, values);
    const [updated] = await pool.query('SELECT id, numero_empleado, nombre, rol, activo FROM empleados WHERE id = ?', [id]);
    res.json({ empleado: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
}

async function toggleActivo(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id, activo FROM empleados WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
    const nuevoEstado = rows[0].activo ? 0 : 1;
    await pool.query('UPDATE empleados SET activo = ?, actualizado_en = NOW() WHERE id = ?', [nuevoEstado, id]);
    res.json({ id: parseInt(id), activo: nuevoEstado === 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
}

async function cambiarPin(req, res) {
  const { id } = req.params;
  const { pin } = req.body;
  if (!pin || pin.toString().length < 4) return res.status(400).json({ error: 'El PIN debe tener al menos 4 dígitos' });
  try {
    const [rows] = await pool.query('SELECT id FROM empleados WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
    const { hashPin } = require('../utils/pin');
    const pin_hash = await hashPin(pin.toString());
    await pool.query('UPDATE empleados SET pin_hash = ?, actualizado_en = NOW() WHERE id = ?', [pin_hash, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar PIN' });
  }
}

module.exports = { identificar, loginPin, loginAdmin, crearEmpleado, listarEmpleados, loginLocal, actualizarEmpleado, toggleActivo, cambiarPin };
