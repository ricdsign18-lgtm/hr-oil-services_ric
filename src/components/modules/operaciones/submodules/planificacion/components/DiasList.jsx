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
    getDiasPorSemana(semanaId);
  };

  // Logic to align days to Monday
  const getDaysWithPlaceholders = () => {
    if (!diasDeLaSemana.length) return [];

    const firstDayDate = new Date(diasDeLaSemana[0].fecha + 'T00:00:00'); // Ensure local time
    let startDay = firstDayDate.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Convert to 0 = Monday, 6 = Sunday
    let normalizedStartDay = startDay === 0 ? 6 : startDay - 1;

    const placeholders = Array(normalizedStartDay).fill(null);
    return [...placeholders, ...diasDeLaSemana];
  };

  const daysGrid = getDaysWithPlaceholders();
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
          <div className="planning-dias-wrapper">
            {/* Column Headers */}
            <div className="planning-days-header-row">
              {weekDays.map(day => (
                <div key={day} className="day-column-header">{day}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="planning-dias-container">
              {daysGrid.map((dia, index) => {
                if (!dia) {
                  return <div key={`placeholder-${index}`} className="planning-dia-placeholder"></div>;
                }

                const isToday = new Date().toDateString() === new Date(dia.fecha + 'T00:00:00').toDateString();

                return (
                  <div
                    key={dia.id}
                    className={`planning-dia-item ${isToday ? 'is-today' : ''}`}
                    onClick={() => setSelectedDia(dia)}
                  >
                    <div className="planning-dia-header">
                      <span className="dia-number">
                        {new Date(dia.fecha + 'T00:00:00').getDate()}
                      </span>
                      <span className="dia-month">
                        {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                      </span>
                    </div>

                    <div className="dia-content">
                      <div className="dia-stats">
                        <div className="stat-row">
                          <span className="stat-icon">🔨</span>
                          <span className="stat-value">{dia.cantidad_actividades || 0}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-icon">💰</span>
                          <span className="stat-value">${(dia.monto_planificado || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="dia-hover-action">
                      Ver Detalles →
                    </div>
                  </div>
                );
              })}
            </div>
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