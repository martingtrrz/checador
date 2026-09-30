const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const checadasController = require('../controllers/checadasController');
const { requiereTokenChecada } = require('../middleware/auth');
const { nombreArchivoFoto } = require('../utils/archivos');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/checadas'),
  filename: (req, file, cb) => {
    cb(null, nombreArchivoFoto(req.empleadoId, file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imagenes'));
    }
    cb(null, true);
  },
});

router.post('/', requiereTokenChecada, upload.single('foto'), checadasController.registrarChecada);
router.get('/ultima', requiereTokenChecada, checadasController.ultimaChecadaDelDia);

module.exports = router;
