import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useSesion } from '../context/SesionContext';
import { useControlRemoto } from '../hooks/useControlRemoto';

const RANGOS = ['hoy', '7dias', 'mes', 'personalizado'];
const RANGO_LABEL = { hoy: 'Hoy', '7dias': 'Ultimos 7 dias', mes: 'Este mes', personalizado: 'Personalizado' };
const PAGE_SIZE = 8;
const TABLE_PAGE_SIZE = 12;

function formatoFecha(d) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatoISO(d) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : d;
}
function sumarDias(d, n) {
  const copia = new Date(d);
  copia.setDate(copia.getDate() + n);
  return copia;
}
function calcularRangoPreset(rango) {
  const hoy = new Date();
  const hasta = formatoISO(hoy);
  let desde;
  if (rango === 'mes') {
    desde = formatoISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  } else {
    const dias = rango === '7dias' ? 6 : 0;
    desde = formatoISO(sumarDias(hoy, -dias));
  }
  return { desde, hasta };
}

const TIPO_LABEL = {
  entrada: 'Entrada',
  salida: 'Salida',
  salida_descanso: 'Salida a descanso',
  entrada_descanso: 'Entrada de descanso',
};
const TIPO_COLOR = {
  entrada: 'text-green-400',
  salida: 'text-red-400',
  salida_descanso: 'text-yellow-400',
  entrada_descanso: 'text-blue-400',
};
const TIPO_BG_ROW = {
  entrada: 'bg-green-950/40',
  salida: 'bg-red-950/40',
  salida_descanso: 'bg-yellow-950/40',
  entrada_descanso: 'bg-blue-950/40',
};

export default function HistorialChecadas({ onVolver }) {
  const { token } = useSesion();
  const [paso, setPaso] = useState('filtros');

  const [rango, setRango] = useState('hoy');
  const [fechaDesde, setFechaDesde] = useState(new Date());
  const [fechaHasta, setFechaHasta] = useState(new Date());
  const [empleados, setEmpleados] = useState([]);
  const [empleadoIdx, setEmpleadoIdx] = useState(0);
  const [focoCampo, setFocoCampo] = useState(0);

  const [checadas, setChecadas] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [filaFoco, setFilaFoco] = useState(0);
  const [fotoModal, setFotoModal] = useState(null);
  const [resumenFiltro, setResumenFiltro] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [paginaTabla, setPaginaTabla] = useState(0);
  const [filaTabla, setFilaTabla] = useState(0);

  useEffect(() => {
    api
      .get('/empleados')
      .then(({ data }) => setEmpleados(data.empleados))
      .catch(() => setError('No se pudo cargar la lista de empleados'));
  }, [token]);

  const campos = useMemo(() => {
    const base = ['rango'];
    if (rango === 'personalizado') base.push('desde', 'hasta');
    base.push('empleado', 'buscar');
    return base;
  }, [rango]);

  const focoCampoSeguro = Math.min(focoCampo, campos.length - 1);

  async function buscar() {
    setCargando(true);
    setError('');
    try {
      let desde, hasta;
      if (rango === 'personalizado') {
        const d = formatoISO(fechaDesde);
        const h = formatoISO(fechaHasta);
        desde = d <= h ? d : h;
        hasta = d <= h ? h : d;
      } else {
        ({ desde, hasta } = calcularRangoPreset(rango));
      }
      const empleado = empleadoIdx > 0 ? empleados[empleadoIdx - 1] : null;
      const params = { desde, hasta };
      if (empleado) params.empleado_id = empleado.id;

      const { data } = await api.get('/reportes/rango', { params });
      setChecadas(data.checadas);
      setResumenFiltro(
        `${RANGO_LABEL[rango]}${rango === 'personalizado' ? ` (${formatoFecha(desde)} - ${formatoFecha(hasta)})` : ''} · ${
          empleado ? empleado.nombre : 'Todos'
        }`
      );
      setPaso('resultados');
      setPagina(0);
      setFilaFoco(0);
    } catch {
      setError('No se pudo cargar el historial');
    } finally {
      setCargando(false);
    }
  }

  function cambiarValor(delta) {
    const campo = campos[focoCampoSeguro];
    if (campo === 'rango') {
      const i = RANGOS.indexOf(rango);
      setRango(RANGOS[(i + delta + RANGOS.length) % RANGOS.length]);
    } else if (campo === 'desde') {
      setFechaDesde((d) => sumarDias(d, delta));
    } else if (campo === 'hasta') {
      setFechaHasta((d) => sumarDias(d, delta));
    } else if (campo === 'empleado') {
      const total = empleados.length + 1;
      setEmpleadoIdx((i) => (i + delta + total) % total);
    }
  }

  const totalPaginas = Math.ceil(checadas.length / PAGE_SIZE);
  const checadasPagina = checadas.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE);

  const totalPaginasTabla = Math.ceil(checadas.length / TABLE_PAGE_SIZE);
  const checadasTabla = checadas.slice(paginaTabla * TABLE_PAGE_SIZE, (paginaTabla + 1) * TABLE_PAGE_SIZE);

  useControlRemoto({
    onUp: () => {
      if (paso === 'filtros') setFocoCampo((f) => Math.max(0, f - 1));
      else if (paso === 'resultados' && !fotoModal) setFilaFoco((f) => Math.max(-1, f - 1));
      else if (paso === 'tabla') setFilaTabla((f) => Math.max(0, f - 1));
    },
    onDown: () => {
      if (paso === 'filtros') setFocoCampo((f) => Math.min(campos.length - 1, f + 1));
      else if (paso === 'resultados' && !fotoModal) setFilaFoco((f) => Math.min(checadasPagina.length - 1, f + 1));
      else if (paso === 'tabla') setFilaTabla((f) => Math.min(checadasTabla.length - 1, f + 1));
    },
    onLeft: () => {
      if (paso === 'filtros') cambiarValor(-1);
      else if (paso === 'resultados' && !fotoModal) { setPagina((p) => Math.max(0, p - 1)); setFilaFoco(0); }
      else if (paso === 'tabla') { setPaginaTabla((p) => Math.max(0, p - 1)); setFilaTabla(0); }
    },
    onRight: () => {
      if (paso === 'filtros') cambiarValor(1);
      else if (paso === 'resultados' && !fotoModal) { setPagina((p) => Math.min(totalPaginas - 1, p + 1)); setFilaFoco(0); }
      else if (paso === 'tabla') { setPaginaTabla((p) => Math.min(totalPaginasTabla - 1, p + 1)); setFilaTabla(0); }
    },
    onSelect: () => {
      if (paso === 'filtros' && campos[focoCampoSeguro] === 'buscar' && !cargando) buscar();
      else if (paso === 'resultados' && !fotoModal) {
        if (filaFoco === -1) {
          setPaginaTabla(0);
          setFilaTabla(0);
          setPaso('tabla');
        } else {
          const c = checadasPagina[filaFoco];
          if (c?.foto_url) setFotoModal(c);
        }
      }
      else if (paso === 'tabla') {
        const c = checadasTabla[filaTabla];
        if (c?.foto_url) setFotoModal(c);
      }
    },
    onBack: () => {
      if (fotoModal) { setFotoModal(null); return; }
      if (paso === 'tabla') { setPaso('resultados'); return; }
      if (paso === 'resultados') { setPaso('filtros'); return; }
      onVolver();
    },
  });

  if (paso === 'filtros') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-5 tv-safe">
        <h1 className="text-5xl font-bold text-slate-100 mb-4">Historial de checadas</h1>

        <div className="w-full max-w-2xl flex flex-col gap-4">
          {campos.map((campo, i) => {
            const activo = i === focoCampoSeguro;
            let etiqueta = '';
            let valor = '';
            if (campo === 'rango') { etiqueta = 'Rango'; valor = RANGO_LABEL[rango]; }
            else if (campo === 'desde') { etiqueta = 'Desde'; valor = formatoFecha(fechaDesde); }
            else if (campo === 'hasta') { etiqueta = 'Hasta'; valor = formatoFecha(fechaHasta); }
            else if (campo === 'empleado') { etiqueta = 'Empleado'; valor = empleadoIdx > 0 ? (empleados[empleadoIdx - 1]?.nombre ?? 'Todos') : 'Todos'; }

            if (campo === 'buscar') {
              return (
                <div
                  key={campo}
                  className={`text-3xl font-bold px-12 py-6 rounded-2xl w-full text-center transition-all duration-100 ${
                    activo ? 'bg-blue-600 scale-105 shadow-xl' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {cargando ? 'Buscando...' : 'Buscar'}
                </div>
              );
            }

            return (
              <div
                key={campo}
                className={`flex items-center justify-between px-8 py-5 rounded-2xl transition-all duration-100 ${
                  activo ? 'bg-slate-700 ring-2 ring-white scale-[1.02]' : 'bg-slate-800'
                }`}
              >
                <span className="text-slate-400 text-2xl">{etiqueta}</span>
                <span className="text-3xl font-semibold flex items-center gap-3">
                  {activo && <span className="text-slate-400">◀</span>}
                  {valor}
                  {activo && <span className="text-slate-400">▶</span>}
                </span>
              </div>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-2xl">{error}</p>}
        <p className="text-slate-500 text-xl mt-4">↑↓ Campo · ◀▶ Valor · OK Buscar · Back Regresar</p>
      </div>
    );
  }

  if (paso === 'tabla') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col tv-safe">
        {fotoModal && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 gap-6 p-16">
            <div className="flex items-center justify-between w-full max-w-4xl mb-2">
              <div>
                <p className="text-3xl font-bold">{fotoModal.nombre}</p>
                <p className="text-2xl text-slate-400">
                  {TIPO_LABEL[fotoModal.tipo]} — {new Date(fotoModal.timestamp).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <span className="text-slate-500 text-xl">Back para cerrar</span>
            </div>
            <img
              src={fotoModal.foto_url}
              alt="Foto de checada"
              className="max-h-[70vh] max-w-full rounded-2xl object-contain border-2 border-slate-700"
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">{resumenFiltro}</h1>
            <p className="text-xl text-slate-400">{checadas.length} registros en total</p>
          </div>
          {totalPaginasTabla > 1 && (
            <span className="text-xl text-slate-400 bg-slate-800 px-4 py-2 rounded-xl">
              Pagina {paginaTabla + 1} / {totalPaginasTabla}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-slate-700">
          <div className="grid grid-cols-[110px_1fr_180px_130px_90px_100px] bg-slate-800 border-b border-slate-600">
            <div className="px-4 py-3 text-slate-400 text-lg font-semibold"># Empleado</div>
            <div className="px-4 py-3 text-slate-400 text-lg font-semibold">Nombre</div>
            <div className="px-4 py-3 text-slate-400 text-lg font-semibold">Tipo</div>
            <div className="px-4 py-3 text-slate-400 text-lg font-semibold">Fecha</div>
            <div className="px-4 py-3 text-slate-400 text-lg font-semibold">Hora</div>
            <div className="px-4 py-3 text-slate-400 text-lg font-semibold text-center">Foto</div>
          </div>

          <div className="flex-1 flex flex-col">
            {checadasTabla.map((c, i) => {
              const ts = new Date(c.timestamp);
              const esFoco = i === filaTabla;
              return (
                <div
                  key={c.id}
                  className={`grid grid-cols-[110px_1fr_180px_130px_90px_100px] border-b border-slate-700/50 transition-all duration-75 ${
                    esFoco
                      ? 'bg-slate-600 ring-2 ring-inset ring-white'
                      : (i % 2 === 0 ? 'bg-slate-800/60' : TIPO_BG_ROW[c.tipo] || 'bg-slate-800/40')
                  }`}
                >
                  <div className="px-4 py-3 text-slate-300 text-xl font-mono">{c.numero_empleado}</div>
                  <div className="px-4 py-3 text-white text-xl font-medium truncate">{c.nombre}</div>
                  <div className={`px-4 py-3 text-xl font-semibold ${TIPO_COLOR[c.tipo] || 'text-slate-300'}`}>
                    {TIPO_LABEL[c.tipo] || c.tipo}
                  </div>
                  <div className="px-4 py-3 text-slate-300 text-xl">
                    {ts.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="px-4 py-3 text-slate-300 text-xl tabular-nums">
                    {ts.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-center">
                    {c.foto_url ? (
                      <span className={`text-base px-2 py-1 rounded-lg font-semibold ${
                        esFoco ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'
                      }`}>
                        Ver
                      </span>
                    ) : (
                      <span className="text-slate-600 text-lg">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-slate-500 text-xl text-center mt-4">
          ↑↓ Fila · ◀▶ Pagina · OK Ver foto · Back Regresar a lista
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col tv-safe">
      {fotoModal && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 gap-6 p-16">
          <div className="flex items-center justify-between w-full max-w-4xl mb-2">
            <div>
              <p className="text-3xl font-bold">{fotoModal.nombre}</p>
              <p className="text-2xl text-slate-400">
                {TIPO_LABEL[fotoModal.tipo]} — {new Date(fotoModal.timestamp).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <span className="text-slate-500 text-xl">Back para cerrar</span>
          </div>
          <img
            src={fotoModal.foto_url}
            alt="Foto de checada"
            className="max-h-[70vh] max-w-full rounded-2xl object-contain border-2 border-slate-700"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-100">{resumenFiltro}</h1>
          <p className="text-2xl text-slate-400">{checadas.length} registro(s)</p>
        </div>
        <button
          onClick={() => { setPaginaTabla(0); setFilaTabla(0); setPaso('tabla'); }}
          className={`px-6 py-3 text-white text-xl font-semibold rounded-xl transition-all ${
            filaFoco === -1 ? 'bg-blue-500 ring-4 ring-white scale-105 shadow-xl' : 'bg-blue-700'
          }`}
        >
          Visualizar tabla
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3" style={{ minHeight: 0 }}>
        {checadasPagina.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-3xl text-slate-500">Sin checadas en este rango</p>
          </div>
        ) : (
          checadasPagina.map((c, i) => (
            <div
              key={c.id}
              className={`flex justify-between items-center px-8 py-4 rounded-2xl border transition-all duration-100 ${
                i === filaFoco
                  ? 'bg-slate-700 border-white ring-2 ring-white scale-[1.01]'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div>
                <span className="text-2xl font-semibold">{c.nombre}</span>
                <span className="text-slate-400 text-xl ml-4">#{c.numero_empleado}</span>
              </div>
              <span className={`text-2xl font-bold ${TIPO_COLOR[c.tipo] || 'text-slate-300'}`}>
                {TIPO_LABEL[c.tipo] || c.tipo}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-slate-300 text-xl">
                  {new Date(c.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                {c.foto_url ? (
                  <span className={`text-lg px-3 py-1 rounded-lg ${i === filaFoco ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                    Ver foto
                  </span>
                ) : (
                  <span className="text-lg text-slate-600 w-20 text-center">sin foto</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-8 mt-6">
          <span className={`text-3xl px-6 py-3 rounded-xl ${pagina === 0 ? 'text-slate-600' : 'text-white bg-slate-700'}`}>◀</span>
          <span className="text-2xl text-slate-300">Pagina {pagina + 1} de {totalPaginas}</span>
          <span className={`text-3xl px-6 py-3 rounded-xl ${pagina >= totalPaginas - 1 ? 'text-slate-600' : 'text-white bg-slate-700'}`}>▶</span>
        </div>
      )}

      <p className="text-slate-500 text-xl text-center mt-4">↑↓ Fila · ◀▶ Pagina · OK Ver foto · Back Regresar</p>
    </div>
  );
}
