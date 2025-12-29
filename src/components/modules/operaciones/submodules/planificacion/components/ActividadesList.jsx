// components/planificacion/ActividadesList.jsx
import { useCurrency } from '../../../../../../contexts/CurrencyContext';

export const ActividadesList = ({ actividades, onEdit, onDelete, loading }) => {
  const { formatCurrency } = useCurrency();

  if (loading) {
    return (
      <div className="planning-no-content" style={{ marginTop: '20px' }}>
        Cargando actividades...
      </div>
    );
  }

  if (!actividades || actividades.length === 0) {
    return (
      <div className="planning-no-content" style={{ marginTop: '20px' }}>
        No hay actividades planificadas para este día.
      </div>
    );
  }

  return (
    <div className="planning-actividades-container" style={{ marginTop: '20px' }}>
      {actividades.map((actividad) => {
        const subCount = actividad.subactividades ? actividad.subactividades.length : 0;
        const persCount = actividad.personal ? actividad.personal.length : 0;

        return (
          <div key={actividad.id} className="planning-actividad-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, paddingRight: '10px' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>{actividad.descripcion || 'Sin descripción'}</h4>

                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                  {actividad.nombre_partida || actividad.budget_items?.description}
                </p>

                <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>

                  <span title="Cantidad Programada">
                    📊 <strong>{actividad.cantidad_programada}</strong> {actividad.unidad_medida}
                  </span>

                  <span title="Monto Programado">
                    💰 <strong>{formatCurrency(actividad.monto_programado, 'USD')}</strong>
                  </span>

                  {subCount > 0 && (
                    <span title="Subactividades">
                      ✅ {subCount} tareas
                    </span>
                  )}

                  {persCount > 0 && (
                    <span title="Personal Involucrado">
                      👥 {persCount} pers.
                    </span>
                  )}
                </div>
              </div>

              <div className="planning-actividad-actions" style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => onEdit(actividad)} className="btn-icon" title="Editar">
                  ✏️
                </button>
                <button onClick={() => onDelete(actividad.id)} className="btn-icon btn-icon-danger" title="Eliminar">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};