import { useState, useEffect } from 'react';
import { SesionProvider, useSesion } from './context/SesionContext';
import LoginTV from './screens/LoginTV';
import PantallaEspera from './screens/PantallaEspera';
import Menu from './screens/Menu';
import ListaEmpleados from './screens/ListaEmpleados';
import HistorialChecadas from './screens/HistorialChecadas';
import TableroAvisos from './screens/TableroAvisos';

function Contenido() {
  const { token, setToken } = useSesion();
  const [pantalla, setPantalla] = useState('espera');

  useEffect(() => {
    const onLogout = () => {
      setToken(null);
      setPantalla('espera');
    };
    window.addEventListener('checadas:logout', onLogout);
    return () => window.removeEventListener('checadas:logout', onLogout);
  }, [setToken]);

  if (!token) {
    return <LoginTV onExito={() => setPantalla('espera')} />;
  }

  if (pantalla === 'espera') {
    return <PantallaEspera onAbrirMenu={() => setPantalla('menu')} />;
  }
  if (pantalla === 'menu') {
    return (
      <Menu
        onVolver={() => setPantalla('espera')}
        onSeleccionar={(id) => {
          if (id === 'resumen') setPantalla('espera');
          else if (id === 'logout') { setToken(null); setPantalla('espera'); }
          else setPantalla(id);
        }}
      />
    );
  }
  if (pantalla === 'empleados') {
    return <ListaEmpleados onVolver={() => setPantalla('menu')} />;
  }
  if (pantalla === 'historico') {
    return <HistorialChecadas onVolver={() => setPantalla('menu')} />;
  }
  if (pantalla === 'tablero') {
    return <TableroAvisos onVolver={() => setPantalla('menu')} />;
  }

  return null;
}

export default function App() {
  return (
    <SesionProvider>
      <Contenido />
    </SesionProvider>
  );
}
