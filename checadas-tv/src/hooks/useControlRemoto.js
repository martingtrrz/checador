import { useEffect } from 'react';

// Imita los eventos de un control remoto de TV (equivalentes a
// onKeyEvent en BrightScript: up/down/left/right/OK/back), para que
// la logica de navegacion se traduzca facil cuando migremos a Roku.
export function useControlRemoto({ onUp, onDown, onLeft, onRight, onSelect, onBack }) {
  useEffect(() => {
    function handler(e) {
      switch (e.key) {
        case 'ArrowUp': onUp?.(); break;
        case 'ArrowDown': onDown?.(); break;
        case 'ArrowLeft': onLeft?.(); break;
        case 'ArrowRight': onRight?.(); break;
        case 'Enter': onSelect?.(); break;
        case 'Escape':
        case 'Backspace': onBack?.(); break;
        default: break;
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUp, onDown, onLeft, onRight, onSelect, onBack]);
}
