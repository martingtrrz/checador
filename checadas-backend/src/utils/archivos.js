const path = require('path');

function nombreArchivoFoto(empleadoId, nombreOriginal) {
  const ext = path.extname(nombreOriginal || '.jpg') || '.jpg';
  return `${empleadoId}_${Date.now()}${ext}`;
}

module.exports = { nombreArchivoFoto };
