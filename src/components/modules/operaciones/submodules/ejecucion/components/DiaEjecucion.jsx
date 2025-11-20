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
    <>
      {/* Header */}
      <div className="planning-header">
        <div className="planning-semana-header" style={{ marginBottom: 0, cursor: 'default' }}>
          <button onClick={onBack} className="btn-secondary">
            ← Volver
          </button>
          <div>
            <h2>
              {new Date(dia.fecha).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <p className="planning-semana-dates" style={{ marginTop: '5px' }}>
              Ejecución de {actividades.length} actividades
            </p>
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
          <div className="planning-no-content">No hay actividades planificadas para este día.</div>
        )}
      </div>
    </>
  );
};