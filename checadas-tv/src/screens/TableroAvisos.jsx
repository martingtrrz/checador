import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useSesion } from '../context/SesionContext';
import { useControlRemoto } from '../hooks/useControlRemoto';

export default function TableroAvisos({ onVolver }) {
  const { token } = useSesion();
  const [avisos, setAvisos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [modo, setModo] = useState('ver');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const cargarAvisos = useCallback(async () => {
    try {
      const { data } = await api.get('/avisos/todos');
      setAvisos(data.avisos);
      setError('');
    } catch {
      try {
        const { data } = await api.get('/avisos');
        setAvisos(data.avisos);
        setError('');
      } catch {
        setError('No se pudieron cargar los avisos');
      }
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarAvisos();
    const intervalo = setInterval(cargarAvisos, 30000);
    return () => clearInterval(intervalo);
  }, [cargarAvisos]);

  useEffect(() => {
    if (avisos.length <= 1 || modo !== 'ver') return;
    const duracion = (avisos[indice]?.duracion_segundos || 10) * 1000;
    timerRef.current = setTimeout(() => {
      setIndice((i) => (i + 1) % avisos.length);
    }, duracion);
    return () => clearTimeout(timerRef.current);
  }, [indice, avisos, modo]);

  useControlRemoto({
    onLeft: () => {
      if (modo === 'ver') setIndice((i) => (i - 1 + avisos.length) % avisos.length);
    },
    onRight: () => {
      if (modo === 'ver') setIndice((i) => (i + 1) % avisos.length);
    },
    onSelect: () => {
      if (modo === 'ver') setModo('admin');
      else setModo('ver');
    },
    onBack: () => {
      if (modo === 'admin') setModo('ver');
      else onVolver();
    },
  });

  const aviso = avisos[indice];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col tv-safe">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-5xl font-bold">Tablero de Avisos</h1>
        <div className="flex items-center gap-4">
          <span className="text-2xl text-slate-400">{avisos.length} aviso(s)</span>
          <span
            className={`text-xl px-4 py-2 rounded-lg ${
              modo === 'admin' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {modo === 'admin' ? 'Modo admin' : 'Vista'}
          </span>
        </div>
      </div>

      {cargando ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-3xl text-slate-400 animate-pulse">Cargando avisos...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-2xl text-red-400">{error}</p>
        </div>
      ) : avisos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <p className="text-3xl text-slate-400">No hay avisos configurados</p>
          <p className="text-2xl text-slate-500">Presiona OK para crear el primer aviso</p>
        </div>
      ) : modo === 'ver' ? (
        <>
          <div
            className="flex-1 rounded-3xl flex flex-col items-center justify-center p-12 relative overflow-hidden"
            style={{
              backgroundColor: aviso.color_fondo || '#1E293B',
              color: aviso.color_texto || '#FFFFFF',
            }}
          >
            {aviso.tipo === 'imagen' && aviso.media_url ? (
              <img
                src={aviso.media_url}
                alt={aviso.titulo}
                className="max-h-full max-w-full object-contain rounded-2xl"
              />
            ) : aviso.tipo === 'video' && aviso.media_url ? (
              <video
                key={aviso.id}
                src={aviso.media_url}
                autoPlay
                muted
                className="max-h-full max-w-full object-contain rounded-2xl"
                onEnded={() => setIndice((i) => (i + 1) % avisos.length)}
              />
            ) : (
              <div className="text-center">
                <h2 className="text-6xl font-bold mb-6">{aviso.titulo}</h2>
                {aviso.contenido && (
                  <p className="text-4xl leading-relaxed opacity-90">{aviso.contenido}</p>
                )}
              </div>
            )}
          </div>

          {avisos.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              {avisos.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === indice ? 'w-8 h-4 bg-white' : 'w-4 h-4 bg-slate-600'
                  }`}
                />
              ))}
            </div>
          )}

          <p className="text-slate-500 text-xl text-center mt-4">
            ◀▶ Navegar avisos · OK Gestionar · Back Regresar
          </p>
        </>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {avisos.map((a, i) => (
              <div
                key={a.id}
                className={`flex items-center justify-between px-8 py-5 rounded-2xl border ${
                  i === indice ? 'bg-slate-700 border-white ring-2 ring-white' : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-mono px-2 py-1 rounded bg-slate-600 text-slate-300`}>
                    {a.tipo}
                  </span>
                  <div>
                    <p className="text-2xl font-semibold">{a.titulo}</p>
                    {a.contenido && <p className="text-slate-400 text-xl">{a.contenido.slice(0, 60)}{a.contenido.length > 60 ? '...' : ''}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xl px-3 py-1 rounded-lg ${
                    a.activo ? 'bg-green-800 text-green-300' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {a.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="text-slate-500 text-lg">{a.duracion_segundos}s</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xl text-center mt-4">
            OK Volver a vista · Back Regresar al menu
          </p>
        </>
      )}
    </div>
  );
}
