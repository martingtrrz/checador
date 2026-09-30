const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const checadaRoutes = require('./routes/checadaRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const empleadosRoutes = require('./routes/empleadosRoutes');

const avisosRoutes = require('./routes/avisosRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/avisos', express.static(path.join(__dirname, '../uploads/avisos')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/checadas', checadaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/avisos', avisosRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor de checadas corriendo en http://localhost:${PORT}`);
});
