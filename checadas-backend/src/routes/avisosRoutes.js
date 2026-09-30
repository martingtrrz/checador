const express = require('express');
const multer = require('multer');
const path = require('path');
const { requiereAdmin } = require('../middleware/auth');
const { listarAvisos, listarTodosAvisos, crearAviso, actualizarAviso, eliminarAviso } = require('../controllers/avisosController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/avisos');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `aviso-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB for video
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Solo se permiten imágenes y videos'));
  }
});

// Public: get active avisos for TV display
router.get('/', listarAvisos);

// Admin: full CRUD
router.get('/todos', requiereAdmin, listarTodosAvisos);
router.post('/', requiereAdmin, upload.single('media'), crearAviso);
router.put('/:id', requiereAdmin, upload.single('media'), actualizarAviso);
router.delete('/:id', requiereAdmin, eliminarAviso);

module.exports = router;
