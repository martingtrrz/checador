import { useState } from 'react';
import api from '../services/api';
import { useSesion } from '../context/SesionContext';
import TecladoTV from '../components/TecladoTV';
import { useControlRemoto } from '../hooks/useControlRemoto';

export default function LoginTV({ onExito }) {
  const [paso, setPaso] = useState('numero');
  const [numero, setNumero] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { setToken } = useSesion();

  const valor = paso === 'numero' ? numero : pin;
  const setValor = paso === 'numero' ? setNumero : setPin;

  function agregarDigito(d) {
    setError('');
    setValor((v) => (v.length < 10 ? v + d : v));
  }
  function borrar() {
    setError('');
    setValor((v) => v.slice(0, -1));
  }

  async function aceptar() {
    if (paso === 'numero') {
      if (!numero) return;
      setPaso('pin');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const { data } = await api.post('/auth/admin/login', { numero_empleado: numero, pin });
      setToken(data.token);
      onExito();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
      setPin('');
    } finally {
      setCargando(false);
    }
  }

  useControlRemoto({
    onBack: () => {
      if (paso === 'pin') {
        setPaso('numero');
        setPin('');
        setError('');
      }
    },
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-8 tv-safe">
      <div className="flex flex-col items-center gap-3 mb-4">
        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-white">
          {paso === 'numero' ? 'Número de empleado' : 'PIN de administrador'}
        </h1>
        {paso === 'pin' && (
          <p className="text-2xl text-slate-400">Empleado: {numero}</p>
        )}
      </div>
      <TecladoTV
        valor={valor}
        oculto={paso === 'pin'}
        onDigito={agregarDigito}
        onBorrar={borrar}
        onAceptar={aceptar}
        aceptarHabilitado={valor.length > 0}
        cargando={cargando}
      />
      {error && <p className="text-red-400 text-2xl text-center max-w-lg">{error}</p>}
      <p className="text-slate-500 text-xl mt-4">
        {paso === 'pin' ? 'Back/Escape: regresar al número de empleado' : 'Flechas para navegar · Enter para seleccionar'}
      </p>
    </div>
  );
}
