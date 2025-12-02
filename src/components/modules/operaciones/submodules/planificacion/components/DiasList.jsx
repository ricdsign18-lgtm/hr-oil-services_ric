// components/planificacion/DiasList.jsx
import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../../../../api/supaBase';
import { DiaPlanning } from './DiaPlanning';

export const DiasList = ({ semanaId }) => {
  const [diasDeLaSemana, setDiasDeLaSemana] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDia, setSelectedDia] = useState(null);

  const getDiasPorSemana = useCallback(async (id) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('planificacion_dias')
      .select('*')
      .eq('semana_id', id)
      .order('fecha');

    if (error) {
      console.error('Error fetching días:', error);
    } else {
      setDiasDeLaSemana(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (semanaId) {
      getDiasPorSemana(semanaId);
    }
  }, [semanaId, getDiasPorSemana]);

  const handleBackFromDia = () => {
    setSelectedDia(null);
    // Refrescar la lista de días para ver los montos actualizados
    getDiasPorSemana(semanaId);
  };

  if (loading && diasDeLaSemana.length === 0) return <div className="planning-no-content">Cargando días...</div>;

  return (
    <>
      {selectedDia ? (
        <DiaPlanning
          dia={selectedDia}
          allDias={diasDeLaSemana}
          onNavigate={setSelectedDia}
          onBack={handleBackFromDia}
        />
      ) : (
        diasDeLaSemana.length > 0 ? (
          <div className="planning-dias-container">
            {diasDeLaSemana.map((dia) => (
              <div
                key={dia.id}
                className="planning-dia-item"
                onClick={() => setSelectedDia(dia)}
                style={{ cursor: 'pointer' }}
              >
                <div className="planning-dia-header">
                  <h4>
                    {new Date(dia.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h4>
                </div>
                <p className="planning-semana-dates" style={{ margin: 0 }}>
                  {dia.cantidad_actividades || 0} actividades • ${dia.monto_planificado?.toLocaleString() || 0}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="planning-no-content">
            No hay días planificados para esta semana.
          </div>
        )
      )}
    </>
  );
};