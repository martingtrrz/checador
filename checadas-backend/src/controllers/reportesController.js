const pool = require('../config/db');
const ExcelJS = require('exceljs');

async function resumenHoy(req, res) {
  const [rows] = await pool.query(`
    SELECT e.id, e.numero_empleado, e.nombre,
      (SELECT c.tipo FROM checadas c
       WHERE c.empleado_id = e.id AND DATE(c.timestamp) = CURDATE()
       ORDER BY c.timestamp DESC LIMIT 1) AS ultimo_estatus,
      (SELECT c.timestamp FROM checadas c
       WHERE c.empleado_id = e.id AND DATE(c.timestamp) = CURDATE()
       ORDER BY c.timestamp DESC LIMIT 1) AS ultima_hora,
      (SELECT c.foto_url FROM checadas c
       WHERE c.empleado_id = e.id AND DATE(c.timestamp) = CURDATE()
         AND c.tipo = 'entrada'
       ORDER BY c.timestamp ASC LIMIT 1) AS foto_entrada
    FROM empleados e
    WHERE e.rol = 'empleado' AND e.activo = 1
    ORDER BY e.nombre
  `);

  const conChecadaHoy = rows.filter((r) => r.ultimo_estatus !== null);

  const resumen = {
    presentes: conChecadaHoy.filter((r) => r.ultimo_estatus === 'entrada' || r.ultimo_estatus === 'entrada_descanso').length,
    en_descanso: conChecadaHoy.filter((r) => r.ultimo_estatus === 'salida_descanso').length,
    fuera: conChecadaHoy.filter((r) => r.ultimo_estatus === 'salida').length,
    total: conChecadaHoy.length,
    total_empleados: rows.length,
  };

  res.json({ resumen, empleados: conChecadaHoy });
}

async function reportePorRango(req, res) {
  const { desde, hasta, empleado_id } = req.query;
  if (!desde || !hasta) {
    return res.status(400).json({ error: 'desde y hasta son requeridos (YYYY-MM-DD)' });
  }

  const params = [desde, hasta];
  let filtroEmpleado = '';
  if (empleado_id) {
    filtroEmpleado = ' AND c.empleado_id = ?';
    params.push(empleado_id);
  }

  const [rows] = await pool.query(
    `SELECT c.id, c.empleado_id, e.numero_empleado, e.nombre, c.tipo,
            c.timestamp, c.foto_url, c.metodo_auth
     FROM checadas c
     JOIN empleados e ON e.id = c.empleado_id
     WHERE DATE(c.timestamp) BETWEEN ? AND ?${filtroEmpleado}
     ORDER BY c.timestamp DESC`,
    params
  );

  res.json({ checadas: rows });
}

async function exportarExcel(req, res) {
  const { desde, hasta, empleado_id } = req.query;
  if (!desde || !hasta) {
    return res.status(400).json({ error: 'desde y hasta son requeridos (YYYY-MM-DD)' });
  }

  const params = [desde, hasta];
  let filtroEmpleado = '';
  if (empleado_id) {
    filtroEmpleado = ' AND c.empleado_id = ?';
    params.push(empleado_id);
  }

  const [rows] = await pool.query(
    `SELECT c.id, e.numero_empleado, e.nombre, c.tipo,
            c.timestamp, c.metodo_auth, c.dispositivo_id
     FROM checadas c
     JOIN empleados e ON e.id = c.empleado_id
     WHERE DATE(c.timestamp) BETWEEN ? AND ?${filtroEmpleado}
     ORDER BY c.timestamp ASC`,
    params
  );

  const TIPO_LABEL = {
    entrada: 'Entrada',
    salida: 'Salida',
    salida_descanso: 'Salida a descanso',
    entrada_descanso: 'Entrada de descanso',
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Checadas';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Checadas', {
    pageSetup: { fitToPage: true, orientation: 'landscape' },
  });

  sheet.columns = [
    { header: 'No. Empleado', key: 'numero_empleado', width: 16 },
    { header: 'Nombre', key: 'nombre', width: 28 },
    { header: 'Tipo', key: 'tipo', width: 22 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Hora', key: 'hora', width: 10 },
    { header: 'Metodo Auth', key: 'metodo_auth', width: 18 },
    { header: 'Dispositivo', key: 'dispositivo_id', width: 26 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;

  for (const r of rows) {
    const ts = new Date(r.timestamp);
    sheet.addRow({
      numero_empleado: r.numero_empleado,
      nombre: r.nombre,
      tipo: TIPO_LABEL[r.tipo] || r.tipo,
      fecha: ts.toLocaleDateString('es-MX'),
      hora: ts.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      metodo_auth: r.metodo_auth || '',
      dispositivo_id: r.dispositivo_id || '',
    });
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D7E0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D7E0' } },
        left: { style: 'thin', color: { argb: 'FFD0D7E0' } },
        right: { style: 'thin', color: { argb: 'FFD0D7E0' } },
      };
    });
    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      });
    }
  });

  const nombreArchivo = `checadas_${desde}_${hasta}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { resumenHoy, reportePorRango, exportarExcel };

