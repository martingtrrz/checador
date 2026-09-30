import { createContext, useContext, useState, useCallback } from 'react';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [token, setTokenState] = useState(() => sessionStorage.getItem('adminToken'));

  const setToken = useCallback((t) => {
    if (t) {
      sessionStorage.setItem('adminToken', t);
    } else {
      sessionStorage.removeItem('adminToken');
    }
    setTokenState(t);
  }, []);

  return (
    <SesionContext.Provider value={{ token, setToken }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return ctx;
}
