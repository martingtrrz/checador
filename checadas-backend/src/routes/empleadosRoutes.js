const express = require('express');
const router = express.Router();

const empleadosController = require('../controllers/empleadosController');
const { requiereAdmin } = require('../middleware/auth');

router.post('/', requiereAdmin, empleadosController.crearEmpleado);
router.get('/', requiereAdmin, empleadosController.listarEmpleados);
router.put('/:id', requiereAdmin, empleadosController.actualizarEmpleado);
router.patch('/:id/activo', requiereAdmin, empleadosController.toggleActivo);
router.put('/:id/pin', requiereAdmin, empleadosController.cambiarPin);

module.exports = router;
