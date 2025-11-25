// components/ejecucion/SemanasEjecucion.jsx
export const SemanasEjecucion = ({ semanas, onSelectSemana }) => {
  return (
    <div className="ejecucion-semanas-container">
      {semanas.map((semana) => (
        <div 
          key={semana.id}
          className="ejecucion-semana-item"
          onClick={() => onSelectSemana(semana)}
        >
          <div className="ejecucion-semana-header">
            <h3>Semana {semana.numero_semana}</h3>
            <EstadoBadge estado={semana.estado} />
          </div>
          
          <div style={{ padding: '0 16px' }}>
            <div className="ejecucion-semana-dates">
              {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
            </div>
          </div>

          <div className="ejecucion-semana-financials">
            <MetricaRow 
              label="Avance Físico" 
              valor={semana.avance_fisico || 0} 
              tipo="porcentaje" 
            />
            <MetricaRow 
              label="Actividades" 
              valor={`${semana.actividades_completadas || 0}/${semana.cantidad_actividades || 0}`} 
            />
            <MetricaRow 
              label="Monto Ejecutado" 
              valor={semana.monto_ejecutado || 0} 
              tipo="moneda" 
            />
          </div>

          <div className="ejecucion-semana-footer">
            <span className="ejecucion-view-details">
              Ver Detalles →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componentes internos
const EstadoBadge = ({ estado }) => {
  const getBadgeStyle = (estado) => {
    switch(estado) {
      case 'completada': return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'en_proceso': return { backgroundColor: '#fef9c3', color: '#854d0e' };
      default: return { backgroundColor: '#f1f5f9', color: '#1e293b' };
    }
  };

  const style = {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
    ...getBadgeStyle(estado)
  };

  return (
    <span style={style}>
      {estado}
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