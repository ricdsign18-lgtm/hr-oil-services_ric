// components/planificacion/RequerimientosList.jsx

export const RequerimientosList = ({ requerimientos, loading }) => {
  if (loading) {
    return <div className="planning-no-content">Cargando requerimientos...</div>;
  }

  if (requerimientos.length === 0) {
    return (
      <div className="planning-no-content" style={{ marginBottom: '20px' }}>
        No hay requerimientos para esta semana. Agrega uno nuevo a continuación.
      </div>
    );
  }

  return (
    <div className="planning-actividades-container" style={{ marginBottom: '20px' }}>
      <h3>Requerimientos de la Semana</h3>
      {requerimientos.map((req) => (
        <div key={req.id} className="planning-actividad-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p><strong>{req.nombre_suministro}</strong></p>
              <p>Categoría: {req.categoria}</p>
              <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                Cant: {req.cantidad_requerida} {req.unidad} • 
                P/U Aprox: ${req.precio_unitario_aprox?.toLocaleString()} • 
                Total: <strong>${req.monto_total?.toLocaleString()}</strong>
              </p>
            </div>
            <span className={`status-badge status-${req.status || 'pendiente'}`}>
              {req.status || 'pendiente'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};