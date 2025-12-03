// components/modules/operaciones/submodules/ejecucion/components/DiaEjecucion.jsx
import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../../../../api/supaBase';
import { ActividadEjecucion } from './ActividadEjecucion';

export const DiaEjecucion = ({ dia, onBack }) => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);

  const getActividadesPorDia = useCallback(async (diaId) => {
    if (!diaId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('planificacion_actividades')
      .select(`
        *,
        equipos (nombre, tag_serial),
        budget_items (description, unit),
        ejecucion_actividades ( id, estado, avance_fisico )
      `)
      .eq('dia_id', diaId)
      .order('created_at');

    if (error) {
      console.error('Error fetching actividades para ejecución:', error);
    } else {
      setActividades(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (dia?.id) {
      getActividadesPorDia(dia.id);
    }
  }, [dia, getActividadesPorDia]);

  return (
    <div className="planning-detail-container">
      {/* Header */}
      <div className="planning-detail-header">
        <div className="header-top">
          <button onClick={onBack} className="btn-back">
            ← Volver a la semana
          </button>
        </div>

        <div className="header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ margin: 0 }}>
              {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </h2>
            <div className="date-badge" style={{ marginTop: '8px' }}>
              {actividades.length} actividades programadas
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Actividades a Ejecutar */}
      <div className="execution-list-container">
        {loading ? (
          <div className="planning-no-content">Cargando actividades...</div>
        ) : actividades.length > 0 ? (
          actividades.map(actividad => (
            <ActividadEjecucion
              key={actividad.id}
              actividadPlanificada={actividad}
              onFinalizar={() => getActividadesPorDia(dia.id)}
              onUpdate={() => getActividadesPorDia(dia.id)}
            />
          ))
        ) : (
          <div className="planning-no-content">
            <p>No hay actividades planificadas para este día.</p>
          </div>
        )}
      </div>
    </div>
  );
};