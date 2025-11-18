// components/ejecucion/DiaEjecucion.jsx
import { useState, useEffect } from 'react';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { useExecution } from '../../../../../../contexts/ExecutionContext';
import { ActividadEjecucion } from './ActividadEjecucion';

export const DiaEjecucion = ({ dia, onBack }) => {
  const { getActividadesPorDia, actividades } = usePlanning();
  const { getSubactividades } = useExecution();
  const [actividadesExpandidas, setActividadesExpandidas] = useState({});

  useEffect(() => {
    if (dia?.id) {
      getActividadesPorDia(dia.id);
    }
  }, [dia?.id, getActividadesPorDia]);

  const toggleActividad = async (actividadId) => {
    if (actividadesExpandidas[actividadId]) {
      setActividadesExpandidas(prev => ({ ...prev, [actividadId]: false }));
    } else {
      await getSubactividades(actividadId);
      setActividadesExpandidas(prev => ({ ...prev, [actividadId]: true }));
    }
  };

  const actividadesCompletadas = actividades.filter(a => a.estado === 'completada').length;
  const avanceGeneral = actividades.length > 0 ? (actividadesCompletadas / actividades.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ← Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {new Date(dia.fecha).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h1>
            <p className="text-gray-600">
              {actividadesCompletadas}/{actividades.length} actividades completadas ({avanceGeneral.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Actividades */}
      <div className="space-y-4">
        {actividades.map((actividad) => (
          <ActividadEjecucion
            key={actividad.id}
            actividad={actividad}
            expandida={!!actividadesExpandidas[actividad.id]}
            onToggle={() => toggleActividad(actividad.id)}
          />
        ))}
      </div>

      {actividades.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay actividades para este día
        </div>
      )}
    </div>
  );
};