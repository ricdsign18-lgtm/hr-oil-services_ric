// components/ejecucion/SemanasEjecucion.jsx
export const SemanasEjecucion = ({ semanas, onSelectSemana }) => {
  return (
    <div className="ejecucion-semanas-container">
      {semanas.map((semana) => {
        const porcentajeEjecutado = semana.monto_planificado > 0
          ? Math.min(100, (semana.monto_ejecutado / semana.monto_planificado) * 100)
          : 0;

        return (
          <div
            key={semana.id}
            className="ejecucion-semana-item"
            onClick={() => onSelectSemana(semana)}
          >
            <div className="ejecucion-semana-header">
              <div className="semana-info">
                <h3>Semana {semana.numero_semana}</h3>
                <span className="ejecucion-semana-dates">
                  {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
                </span>
              </div>
              <EstadoBadge estado={semana.estado} />
            </div>

            <div className="ejecucion-semana-financials">
              <MetricaRow
                label="Avance Físico"
                valor={semana.avance_fisico || 0}
                tipo="porcentaje"
              />

              <div className="progress-bar-container" style={{ margin: '8px 0' }}>
                <div
                  className="progress-bar"
                  style={{ width: `${semana.avance_fisico || 0}%` }}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="ejecucion-metric-label" style={{ fontSize: '0.75rem' }}>EJECUTADO</span>
                  <span className="ejecucion-metric-value" style={{ color: '#16a34a' }}>
                    ${(semana.monto_ejecutado || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="ejecucion-metric-label" style={{ fontSize: '0.75rem' }}>PLANIFICADO</span>
                  <span className="ejecucion-metric-value">
                    ${(semana.monto_planificado || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="ejecucion-semana-footer">
              <span className="ejecucion-view-details">
                Ver Detalles y Días →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Componentes internos
const EstadoBadge = ({ estado }) => {
  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'completada': return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'en_proceso': return { backgroundColor: '#fef9c3', color: '#854d0e' };
      default: return { backgroundColor: '#f1f5f9', color: '#1e293b' };
    }
  };

  const style = {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    ...getBadgeStyle(estado)
  };

  return (
    <span style={style}>
      {estado?.replace('_', ' ')}
    </span>
  );
};

const MetricaRow = ({ label, valor, tipo = 'text' }) => (
  <div className="ejecucion-metric-row">
    <span className="ejecucion-metric-label">{label}</span>
    <span className="ejecucion-metric-value">
      {tipo === 'porcentaje' ? `${valor}%` :
        tipo === 'moneda' ? `$${valor.toLocaleString()}` : valor}
    </span>
  </div>
);