// components/ejecucion/DiasEjecucion.jsx
import { useState, useEffect, useCallback } from 'react';
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

  // Logic to align days to Monday
  const getDaysWithPlaceholders = () => {
    if (!diasDeLaSemana.length) return [];

    const firstDayDate = new Date(diasDeLaSemana[0].fecha + 'T00:00:00');
    let startDay = firstDayDate.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Convert to 0 = Monday, 6 = Sunday
    let normalizedStartDay = startDay === 0 ? 6 : startDay - 1;

    const placeholders = Array(normalizedStartDay).fill(null);
    return [...placeholders, ...diasDeLaSemana];
  };

  const daysGrid = getDaysWithPlaceholders();
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  if (loading && diasDeLaSemana.length === 0) {
    return <div className="planning-no-content">Cargando días...</div>;
  }

  return (
    <div className="planning-dias-wrapper">
      {/* Column Headers */}
      <div className="planning-days-header-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', padding: '0 12px', marginBottom: '8px' }}>
        {weekDays.map(day => (
          <div key={day} className="day-column-header" style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>{day}</div>
        ))}
      </div>

      <div className="ejecucion-dias-container">
        {selectedDia ? (
          <DiaEjecucion
            dia={selectedDia}
            onBack={() => setSelectedDia(null)}
          />
        ) : (
          daysGrid.map((dia, index) => {
            if (!dia) {
              return <div key={`placeholder-${index}`} className="ejecucion-dia-placeholder"></div>;
            }

            const isToday = new Date().toDateString() === new Date(dia.fecha + 'T00:00:00').toDateString();

            return (
              <div
                key={dia.id}
                className={`ejecucion-dia-item ${isToday ? 'is-today' : ''}`}
                onClick={() => setSelectedDia(dia)}
                style={{
                  borderColor: isToday ? 'var(--primary-color)' : '',
                  backgroundColor: isToday ? '#f0f9ff' : ''
                }}
              >
                <div className="ejecucion-dia-header">
                  <h4>
                    {new Date(dia.fecha + 'T00:00:00').getDate()}
                  </h4>
                  <span>
                    {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                </div>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>🔨 Actividades:</span>
                    <strong>{dia.cantidad_actividades || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>💰 Plan:</span>
                    <strong>${(dia.monto_planificado || 0).toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '600', marginTop: 'auto' }}>
                  Ver Ejecución →
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};