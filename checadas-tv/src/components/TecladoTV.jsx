import { useState } from 'react';
import { useControlRemoto } from '../hooks/useControlRemoto';

const TECLAS = ['1','2','3','4','5','6','7','8','9','borrar','0','ok'];

export default function TecladoTV({ valor, onDigito, onBorrar, onAceptar, aceptarHabilitado, cargando, oculto }) {
  const [foco, setFoco] = useState(0);

  useControlRemoto({
    onUp: () => setFoco((f) => (f - 3 + 12) % 12),
    onDown: () => setFoco((f) => (f + 3) % 12),
    onLeft: () => setFoco((f) => (f - 1 + 12) % 12),
    onRight: () => setFoco((f) => (f + 1) % 12),
    onSelect: () => activar(TECLAS[foco]),
  });

  function activar(tecla) {
    if (tecla === 'borrar') onBorrar();
    else if (tecla === 'ok') { if (aceptarHabilitado && !cargando) onAceptar(); }
    else onDigito(tecla);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Value display */}
      <div className="text-7xl tracking-[0.5em] font-mono text-white min-h-[6rem] bg-slate-800 rounded-2xl px-12 py-4 min-w-[28rem] text-center">
        {oculto ? '•'.repeat(valor.length) || '\u00A0' : (valor || '\u00A0')}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-3 gap-5">
        {TECLAS.map((t, i) => (
          <button
            key={i}
            tabIndex={-1}
            onClick={() => activar(t)}
            className={`w-32 h-32 rounded-2xl flex items-center justify-center text-4xl font-bold transition-all duration-100 border-2 ${
              i === foco
                ? 'bg-blue-600 text-white scale-110 border-white shadow-xl'
                : t === 'ok'
                ? 'bg-green-800 text-green-200 border-green-700 hover:bg-green-700'
                : t === 'borrar'
                ? 'bg-slate-700 text-red-300 border-slate-600'
                : 'bg-slate-700 text-slate-100 border-slate-600'
            }`}
          >
            {t === 'borrar' ? '⌫' : t === 'ok' ? (cargando ? '...' : 'OK') : t}
          </button>
        ))}
      </div>
    </div>
  );
}
