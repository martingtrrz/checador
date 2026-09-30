import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useSesion } from '../context/SesionContext';
import { useControlRemoto } from '../hooks/useControlRemoto';

export default function PantallaEspera({ onAbrirMenu }) {
  const { token } = useSesion();
  const [resumen, setResumen] = useState(null);
  const [hora, setHora] = useState(new Date());
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const prevResumenRef = useRef(null);
  const toastTimer = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/reportes/resumen-hoy');
      const nuevo = data.resumen;
      if (prevResumenRef.current !== null) {
        const prev = prevResumenRef.current;
        if (nuevo.presentes > prev.presentes) {
          showToast('Nueva entrada registrada');
        } else if (nuevo.fuera > prev.fuera) {
          showToast('Nueva salida registrada');
        } else if (nuevo.en_descanso > prev.en_descanso) {
          showToast('Empleado en descanso');
        }
      }
      prevResumenRef.current = nuevo;
      setResumen(nuevo);
      setError('');
    } catch {
      setError('No se pudo actualizar el resumen');
    }
  }, [token]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    if (token) {
      cargar();
      const intervalo = setInterval(cargar, 20000);
      return () => clearInterval(intervalo);
    }
  }, [cargar, token]);

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useControlRemoto({ onSelect: onAbrirMenu });

  const total = resumen?.total || 0;
  const totalEmpleados = resumen?.total_empleados || 0;
  const presentes = resumen?.presentes || 0;
  const pct = totalEmpleados > 0 ? Math.round((presentes / totalEmpleados) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col tv-safe">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-16 right-16 bg-slate-700 border border-slate-500 rounded-2xl px-8 py-4 text-2xl font-semibold z-50 shadow-2xl animate-pulse">
          {toast}
        </div>
      )}

      {/* Header: date and time */}
      <div className="text-center mb-10">
        <p className="text-3xl text-slate-400 capitalize">
          {hora.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className="text-8xl font-bold text-white tabular-nums">
          {hora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>

      {/* Summary cards */}
      {resumen ? (
        <>
          <div className="grid grid-cols-3 gap-8 w-full flex-1">
            <Tarjeta valor={resumen.presentes} label="Presentes" color="text-green-400" bg="bg-green-900/30" border="border-green-700" />
            <Tarjeta valor={resumen.en_descanso} label="En descanso" color="text-yellow-400" bg="bg-yellow-900/30" border="border-yellow-700" />
            <Tarjeta valor={resumen.fuera} label="Fuera" color="text-red-400" bg="bg-red-900/30" border="border-red-700" />
          </div>

          {totalEmpleados > 0 && (
            <div className="mt-8">
              <div className="flex justify-between text-xl text-slate-400 mb-2">
                <span>Asistencia hoy: {total} checaron de {totalEmpleados} empleados</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full h-6 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-3xl text-slate-400 animate-pulse">Cargando resumen...</p>
        </div>
      )}

      {error && <p className="text-red-400 text-2xl text-center mt-4">{error}</p>}

      <p className="text-slate-500 text-xl text-center mt-8">
        Presiona OK para ver opciones
      </p>
    </div>
  );
}

function Tarjeta({ valor, label, color, bg, border }) {
  return (
    <div className={`${bg} border ${border} rounded-3xl py-10 flex flex-col items-center gap-3`}>
      <span className={`text-8xl font-bold ${color}`}>{valor}</span>
      <span className="text-slate-300 text-2xl">{label}</span>
    </div>
  );
}
