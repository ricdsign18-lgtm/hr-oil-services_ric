// components/ejecucion/TiempoTracker.jsx
import { useState, useEffect } from 'react';
import { useEjecucion } from '../../../../../../hooks/useEjecucion';

export const TiempoTracker = ({ actividadId, visible }) => {
  const { getTiempoActividad } = useEjecucion();
  const [tiempo, setTiempo] = useState({ productivo: 0, total: 0, enPausa: false });

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setTiempo(getTiempoActividad(actividadId));
    }, 1000);

    return () => clearInterval(interval);
  }, [actividadId, visible, getTiempoActividad]);

  if (!visible) return null;

  const formatTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-green-600 font-semibold">{formatTiempo(tiempo.productivo)}</div>
          <div className="text-green-500 text-xs">Productivo</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-gray-600 font-semibold">{formatTiempo(tiempo.total)}</div>
          <div className="text-gray-500 text-xs">Total</div>
        </div>
      </div>

      {tiempo.enPausa && (
        <div className="text-center text-orange-600 text-sm bg-orange-50 py-1 rounded">
          ⏸️ En pausa
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Eficiencia: {tiempo.total > 0 ? Math.round((tiempo.productivo / tiempo.total) * 100) : 0}%
      </div>
    </div>
  );
};