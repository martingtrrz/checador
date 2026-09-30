const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

const empleados = [
  { numero: '1002', nombre: 'Ana Martinez', pin: '1111', rol: 'empleado' },
  { numero: '1003', nombre: 'Carlos Lopez', pin: '2222', rol: 'empleado' },
  { numero: '1004', nombre: 'Diana Torres', pin: '3333', rol: 'empleado' },
  { numero: '1005', nombre: 'Eduardo Ramirez', pin: '4444', rol: 'empleado' },
  { numero: '1006', nombre: 'Fernanda Gutierrez', pin: '5555', rol: 'empleado' },
  { numero: '1007', nombre: 'Gabriel Hernandez', pin: '6666', rol: 'empleado' },
  { numero: '1008', nombre: 'Hilda Sanchez', pin: '7777', rol: 'empleado' },
  { numero: '1009', nombre: 'Ivan Morales', pin: '8888', rol: 'empleado' },
  { numero: '1010', nombre: 'Jessica Flores', pin: '9999', rol: 'empleado' },
  { numero: '1011', nombre: 'Kevin Ruiz', pin: '0000', rol: 'empleado' },
];

async function seedEmpleados() {
  console.log('Insertando empleados...');
  for (const e of empleados) {
    const pin_hash = await bcrypt.hash(e.pin, 10);
    try {
      await pool.query(
        `INSERT INTO empleados (numero_empleado, nombre, rol, pin_hash, activo)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), pin_hash = VALUES(pin_hash)`,
        [e.numero, e.nombre, e.rol, pin_hash]
      );
      console.log(`  OK: ${e.nombre} (#${e.numero}) PIN: ${e.pin}`);
    } catch (err) {
      console.error(`  ERROR: ${e.nombre} — ${err.message}`);
    }
  }
  console.log('\nEmpleados insertados. Resumen de PINs:');
  for (const e of empleados) {
    console.log(`  #${e.numero} ${e.nombre.padEnd(22)} PIN: ${e.pin}`);
  }
  await pool.end();
}

seedEmpleados().catch((err) => { console.error(err); process.exit(1); });
