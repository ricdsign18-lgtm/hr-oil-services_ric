// src/components/modules/operaciones/submodules/ejecucion/components/DiasEjecucion.jsx
import { useState, useEffect, useCallback } from "react";
import supabase from '../../../../../../api/supaBase';
import { DiaEjecucion } from './DiaEjecucion';

export const DiasEjecucion = ({ semanaId }) => {
  const [diasDeLaSemana, setDiasDeLaSemana] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDia, setSelectedDia] = useState(null);

  const getDiasPorSemana = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('planificacion_dias')
      .select('*')
      .eq('semana_id', id)
      .order('fecha');

    if (error) {
      console.error('Error fetching días de ejecución:', error);
    } else {
      setDiasDeLaSemana(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getDiasPorSemana(semanaId);
  }, [semanaId, getDiasPorSemana]);

  if (loading && diasDeLaSemana.length === 0) {
    return <div className="planning-no-content">Cargando días...</div>;
  }

  return (
    <div className="planning-dias-container">
      {selectedDia ? (
        <DiaEjecucion 
          dia={selectedDia} 
          onBack={() => setSelectedDia(null)}
        />
      ) : (
        diasDeLaSemana.map((dia) => (
          <div
            key={dia.id}
            className="planning-dia-item"
            onClick={() => setSelectedDia(dia)}
            style={{cursor: 'pointer'}}
          >
            <div className="planning-dia-header">
              <h4>
                {new Date(dia.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                })}
              </h4>
            </div>
            <p className="planning-semana-dates" style={{ margin: 0 }}>
              {dia.cantidad_actividades || 0} actividades • ${dia.monto_planificado?.toLocaleString() || 0}
            </p>
          </div>
        ))
      )}
    </div>
  );
};