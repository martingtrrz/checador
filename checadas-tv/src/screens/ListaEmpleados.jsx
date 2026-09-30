import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useSesion } from '../context/SesionContext';
import { useControlRemoto } from '../hooks/useControlRemoto';

const ESTATUS_LABEL = {
  entrada: 'Presente',
  entrada_descanso: 'Presente',
  salida_descanso: 'En descanso',
  salida: 'Fuera',
};
const ESTATUS_COLOR = {
  entrada: 'text-green-400',
  entrada_descanso: 'text-green-400',
  salida_descanso: 'text-yellow-400',
  salida: 'text-red-400',
};
const ESTATUS_BG = {
  entrada: 'bg-green-900/20 border-green-800',
  entrada_descanso: 'bg-green-900/20 border-green-800',
  salida_descanso: 'bg-yellow-900/20 border-yellow-800',
  salida: 'bg-red-900/20 border-red-800',
};

export default function ListaEmpleados({ onVolver }) {
  const { token } = useSesion();
  const [empleados, setEmpleados] = useState([]);
  const [foco, setFoco] = useState(0);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const filaRefs = useRef([]);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/reportes/resumen-hoy');
      setEmpleados(data.empleados);
      setError('');
    } catch {
      setError('No se pudo cargar la lista');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 20000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  // Scroll focused row into view
  useEffect(() => {
    filaRefs.current[foco]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [foco]);

  useControlRemoto({
    onUp: () => setFoco((f) => Math.max(0, f - 1)),
    onDown: () => setFoco((f) => Math.min(empleados.length - 1, f + 1)),
    onBack: onVolver,
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col tv-safe">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl font-bold text-slate-100">Empleados</h1>
        <span className="text-2xl text-slate-400">{empleados.length} total</span>
      </div>

      {error && <p className="text-red-400 text-2xl mb-4">{error}</p>}

      {cargando ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-3xl text-slate-400 animate-pulse">Cargando empleados...</p>
        </div>
      ) : empleados.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-3xl text-slate-500">Sin empleados registrados</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-3" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {empleados.map((e, i) => {
            const estatus = e.ultimo_estatus ? ESTATUS_LABEL[e.ultimo_estatus] : 'Fuera';
            const color = e.ultimo_estatus ? ESTATUS_COLOR[e.ultimo_estatus] : 'text-red-400';
            const bg = e.ultimo_estatus ? ESTATUS_BG[e.ultimo_estatus] : 'bg-red-900/20 border-red-800';
            return (
              <div
                key={e.id}
                ref={(el) => (filaRefs.current[i] = el)}
                className={`flex justify-between items-center px-8 py-5 rounded-2xl border transition-all duration-100 ${
                  i === foco ? `${bg} scale-[1.02] ring-2 ring-white` : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div>
                  <span className="text-3xl font-semibold">{e.nombre}</span>
                  <span className="text-slate-400 text-xl ml-4">#{e.numero_empleado}</span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${color}`}>{estatus}</span>
                  {e.ultima_hora && (
                    <p className="text-slate-400 text-xl">
                      {new Date(e.ultima_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-slate-500 text-xl text-center mt-6">↑↓ Navegar · Back Regresar</p>
    </div>
  );
}
