// components/planificacion/RequerimientosList.jsx

export const RequerimientosList = ({ requerimientos, loading }) => {
  if (loading) {
    return <div className="planning-no-content">Cargando requerimientos...</div>;
  }

  if (!requerimientos || requerimientos.length === 0) {
    return (
      <div className="planning-no-content" style={{ marginBottom: '20px' }}>
        No hay requerimientos para esta semana. Agrega uno nuevo a continuación.
      </div>
    );
  }

  // Helper to calculate total value of a requirement
  const calculateTotal = (reqItems) => {
    return reqItems?.reduce((acc, item) => {
      return acc + (item.cantidad_requerida * (item.precio_unitario_usd_aprox || 0));
    }, 0) || 0;
  };

  return (
    <div className="planning-actividades-container" style={{ marginBottom: '20px', gap: '15px' }}>
      <h3>Requerimientos de la Semana</h3>
      {requerimientos.map((req) => (
        <div key={req.id} className="planning-week-card" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>
              Solicitud del {new Date(req.fecha_requerimiento).toLocaleDateString()}
            </span>
            <span style={{ fontWeight: 'bold', color: '#00695c' }}>
              Total: ${calculateTotal(req.requerimiento_items).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {req.requerimiento_items && req.requerimiento_items.length > 0 ? (
            <div className="req-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {req.requerimiento_items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                  <div style={{ flex: 2 }}>
                    <strong>{item.nombre_producto}</strong>
                    <span style={{ color: '#777', marginLeft: '8px' }}>({item.categoria_producto})</span>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    {item.cantidad_requerida} {item.unidad}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    ${(item.cantidad_requerida * (item.precio_unitario_usd_aprox || 0)).toFixed(2)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <span className={`status-badge status-${item.status || 'pendiente'}`} style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
                      {item.status || 'pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#999', fontStyle: 'italic' }}>Sin items en esta solicitud</div>
          )}
        </div>
      ))}
    </div>
  );
};