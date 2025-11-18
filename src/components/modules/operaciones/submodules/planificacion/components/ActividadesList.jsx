// components/planificacion/ActividadesList.jsx
export const ActividadesList = ({ actividades, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="planning-no-content" style={{ marginTop: '20px' }}>
        Cargando actividades...
      </div>
    );
  }

  if (actividades.length === 0) {
    return (
      <div className="planning-no-content" style={{ marginTop: '20px' }}>
        No hay actividades planificadas para este día.
      </div>
    );
  }

  return (
    <div className="planning-actividades-container" style={{ marginTop: '20px' }}>
      {actividades.map((actividad) => (
        <div key={actividad.id} className="planning-actividad-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p><strong>{actividad.equipos?.nombre}</strong> ({actividad.equipos?.tag_serial})</p>
              <p>{actividad.budget_items?.description}</p>
              <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                Cant: {actividad.cantidad} {actividad.budget_items?.unit} • 
                P/U: ${actividad.precio_unitario?.toLocaleString()} • 
                Total: <strong>${actividad.monto_total?.toLocaleString()}</strong>
              </p>
            </div>
            <div className="planning-actividad-actions">
              <button onClick={() => onEdit(actividad)} className="btn-icon">
                ✏️
              </button>
              <button onClick={() => onDelete(actividad.id)} className="btn-icon btn-icon-danger">
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};