const express = require('express');
const router = express.Router();

const empleadosController = require('../controllers/empleadosController');
const webauthnController = require('../controllers/webauthnController');

// Paso 1 del checador: numero de empleado
router.post('/identificar', empleadosController.identificar);

// Fallback por PIN, login "local" (Expo, tras expo-local-authentication) y admin
router.post('/pin/login', empleadosController.loginPin);
router.post('/local/login', empleadosController.loginLocal);
router.post('/admin/login', empleadosController.loginAdmin);

// WebAuthn: se deja por si en algun momento usas el checador desde web
router.post('/webauthn/registro/opciones', webauthnController.opcionesRegistro);
router.post('/webauthn/registro/verificar', webauthnController.verificarRegistro);
router.post('/webauthn/login/opciones', webauthnController.opcionesLogin);
router.post('/webauthn/login/verificar', webauthnController.verificarLogin);

module.exports = router;
