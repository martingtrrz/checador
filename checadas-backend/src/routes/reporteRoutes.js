const express = require('express');
const router = express.Router();

const reportesController = require('../controllers/reportesController');
const { requiereAdmin } = require('../middleware/auth');

router.get('/resumen-hoy', requiereAdmin, reportesController.resumenHoy);
router.get('/rango', requiereAdmin, reportesController.reportePorRango);
router.get('/exportar', requiereAdmin, reportesController.exportarExcel);

module.exports = router;

