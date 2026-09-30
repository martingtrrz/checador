import { useState } from 'react';
import { useControlRemoto } from '../hooks/useControlRemoto';

const OPCIONES = [
  { id: 'resumen', label: 'Resumen en vivo', desc: 'Ver el panel principal de asistencia' },
  { id: 'tablero', label: 'Tablero de avisos', desc: 'Ver y gestionar avisos para la pantalla' },
  { id: 'empleados', label: 'Lista de empleados', desc: 'Ver estatus actual de todos los empleados' },
  { id: 'historico', label: 'Historial de checadas', desc: 'Consultar registros por fecha y empleado' },
  { id: 'logout', label: 'Cerrar sesion', desc: 'Salir de la sesion de administrador' },
];

export default function Menu({ onSeleccionar, onVolver }) {
  const [foco, setFoco] = useState(0);

  useControlRemoto({
    onUp: () => setFoco((f) => (f - 1 + OPCIONES.length) % OPCIONES.length),
    onDown: () => setFoco((f) => (f + 1) % OPCIONES.length),
    onSelect: () => onSeleccionar(OPCIONES[foco].id),
    onBack: onVolver,
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-5 tv-safe">
      <h1 className="text-5xl font-bold mb-6 text-slate-100">¿Qué quieres ver?</h1>
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {OPCIONES.map((op, i) => (
          <div
            key={op.id}
            className={`px-10 py-6 rounded-2xl w-full transition-all duration-100 ${
              i === foco
                ? 'bg-blue-600 scale-[1.03] shadow-2xl'
                : op.id === 'logout'
                ? 'bg-slate-800/60 text-slate-400'
                : 'bg-slate-800'
            }`}
          >
            <div className="text-3xl font-semibold">{op.label}</div>
            <div className={`text-xl mt-1 ${i === foco ? 'text-blue-100' : 'text-slate-400'}`}>{op.desc}</div>
          </div>
        ))}
      </div>
      <p className="text-slate-500 text-xl mt-8">↑↓ Navegar · OK Seleccionar · Back Regresar</p>
    </div>
  );
}
