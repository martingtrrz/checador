const jwt = require('jsonwebtoken');
require('dotenv').config();

function extraerToken(req) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  return token;
}

function requiereTokenChecada(req, res, next) {
  const token = extraerToken(req);
  if (!token) return res.status(401).json({ error: 'Falta token de checada' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== 'checada') {
      return res.status(401).json({ error: 'Token invalido para esta accion' });
    }
    req.empleadoId = payload.empleadoId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token de checada invalido o expirado' });
  }
}

function requiereAdmin(req, res, next) {
  const token = extraerToken(req);
  if (!token) return res.status(401).json({ error: 'Falta token de administrador' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== 'admin' || payload.rol !== 'rh_supervisor') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }
    req.empleadoId = payload.empleadoId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesion de administrador invalida o expirada' });
  }
}

module.exports = { requiereTokenChecada, requiereAdmin };
