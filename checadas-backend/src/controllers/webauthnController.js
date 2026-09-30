const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const RP_NAME = process.env.RP_NAME;
const RP_ID = process.env.RP_ID;
const ORIGIN = process.env.ORIGIN;
const CHALLENGE_TTL_MIN = 5;

async function guardarChallenge(empleadoId, challenge, tipo) {
  const expira = new Date(Date.now() + CHALLENGE_TTL_MIN * 60 * 1000);
  await pool.query(
    'INSERT INTO webauthn_challenges (empleado_id, challenge, tipo, expira_en) VALUES (?, ?, ?, ?)',
    [empleadoId, challenge, tipo, expira]
  );
}

async function tomarChallenge(empleadoId, tipo) {
  const [rows] = await pool.query(
    `SELECT id, challenge FROM webauthn_challenges
     WHERE empleado_id = ? AND tipo = ? AND expira_en > NOW()
     ORDER BY id DESC LIMIT 1`,
    [empleadoId, tipo]
  );
  if (rows.length === 0) return null;
  await pool.query('DELETE FROM webauthn_challenges WHERE id = ?', [rows[0].id]);
  return rows[0].challenge;
}

async function opcionesRegistro(req, res) {
  const { empleadoId } = req.body;
  const [rows] = await pool.query(
    'SELECT id, numero_empleado, nombre FROM empleados WHERE id = ?',
    [empleadoId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
  const empleado = rows[0];

  const [credRows] = await pool.query(
    'SELECT credential_id FROM webauthn_credenciales WHERE empleado_id = ?',
    [empleadoId]
  );

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(String(empleado.id)),
    userName: empleado.numero_empleado,
    userDisplayName: empleado.nombre,
    attestationType: 'none',
    excludeCredentials: credRows.map((c) => ({ id: c.credential_id })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
  });

  await guardarChallenge(empleadoId, options.challenge, 'registro');
  res.json(options);
}

async function verificarRegistro(req, res) {
  const { empleadoId, respuesta } = req.body;
  const challenge = await tomarChallenge(empleadoId, 'registro');
  if (!challenge) return res.status(400).json({ error: 'Challenge expirado, intenta de nuevo' });

  let verificacion;
  try {
    verificacion = await verifyRegistrationResponse({
      response: respuesta,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch (err) {
    return res.status(400).json({ error: 'No se pudo verificar el registro', detalle: err.message });
  }

  if (!verificacion.verified || !verificacion.registrationInfo) {
    return res.status(400).json({ error: 'Registro no verificado' });
  }

  const { credential } = verificacion.registrationInfo;
  await pool.query(
    `INSERT INTO webauthn_credenciales (empleado_id, credential_id, public_key, contador, device_type)
     VALUES (?, ?, ?, ?, ?)`,
    [
      empleadoId,
      credential.id,
      Buffer.from(credential.publicKey).toString('base64url'),
      credential.counter,
      verificacion.registrationInfo.credentialDeviceType,
    ]
  );

  res.json({ verificado: true });
}

async function opcionesLogin(req, res) {
  const { empleadoId } = req.body;
  const [credRows] = await pool.query(
    'SELECT credential_id FROM webauthn_credenciales WHERE empleado_id = ?',
    [empleadoId]
  );
  if (credRows.length === 0) {
    return res.status(404).json({ error: 'Este empleado no tiene huella/Face ID registrada' });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'required',
    allowCredentials: credRows.map((c) => ({ id: c.credential_id })),
  });

  await guardarChallenge(empleadoId, options.challenge, 'login');
  res.json(options);
}

async function verificarLogin(req, res) {
  const { empleadoId, respuesta } = req.body;
  const challenge = await tomarChallenge(empleadoId, 'login');
  if (!challenge) return res.status(400).json({ error: 'Challenge expirado, intenta de nuevo' });

  const [credRows] = await pool.query(
    'SELECT credential_id, public_key, contador FROM webauthn_credenciales WHERE empleado_id = ? AND credential_id = ?',
    [empleadoId, respuesta.id]
  );
  if (credRows.length === 0) return res.status(404).json({ error: 'Credencial no encontrada' });
  const cred = credRows[0];

  let verificacion;
  try {
    verificacion = await verifyAuthenticationResponse({
      response: respuesta,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: cred.credential_id,
        publicKey: Buffer.from(cred.public_key, 'base64url'),
        counter: cred.contador,
      },
    });
  } catch (err) {
    return res.status(400).json({ error: 'No se pudo verificar el login', detalle: err.message });
  }

  if (!verificacion.verified) {
    return res.status(401).json({ error: 'Verificacion fallida' });
  }

  await pool.query(
    'UPDATE webauthn_credenciales SET contador = ? WHERE credential_id = ?',
    [verificacion.authenticationInfo.newCounter, cred.credential_id]
  );

  const token = jwt.sign(
    { tipo: 'checada', empleadoId: Number(empleadoId), metodo: 'webauthn' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_CHECADA_EXPIRES }
  );
  res.json({ token });
}

module.exports = { opcionesRegistro, verificarRegistro, opcionesLogin, verificarLogin };
