// components/planificacion/SemanasList.jsx

export const SemanasList = ({ semanas, onSelectSemana }) => {
  return (
    <div className="planning-semanas-container">
      {semanas.map((semana) => {
        const planificado = semana.monto_planificado || 0;
        const ejecutado = semana.monto_ejecutado || 0;
        const requerimientos = semana.monto_requerimientos || 0;
        const porcentajeEjecucion = planificado > 0 ? (ejecutado / planificado) * 100 : 0;
        const disponible = planificado - ejecutado;

        return (
          <div
            key={semana.id}
            className="planning-semana-card"
            onClick={() => onSelectSemana(semana)}
          >
            <div className="semana-card-header">
              <div className="semana-info">
                <h3>Semana {semana.numero_semana}</h3>
                <span className="semana-dates">
                  {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
                </span>
              </div>
              {planificado > 0 && (
                <div className={`semana-status-badge ${ejecutado > planificado ? 'danger' : 'success'}`}>
                  {Math.round(porcentajeEjecucion)}%
                </div>
              )}
            </div>

            <div className="semana-card-body">
              <div className="financial-row">
                <div className="financial-item">
                  <span className="label">Planificado</span>
                  <span className="value">${planificado.toLocaleString()}</span>
                </div>
                <div className="financial-item right-align">
                  <span className="label">Ejecutado</span>
                  <span className={`value ${ejecutado > planificado ? 'text-danger' : ''}`}>
                    ${ejecutado.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="progress-bar-container">
                <div
                  className={`progress-bar ${ejecutado > planificado ? 'over-budget' : ''}`}
                  style={{ width: `${Math.min(porcentajeEjecucion, 100)}%` }}
                ></div>
              </div>

              <div className="financial-details">
                <div className="detail-item" title="Monto en Requerimientos">
                  <span className="icon">📋</span>
                  <span>Req: ${requerimientos.toLocaleString()}</span>
                </div>
                <div className="detail-item" title="Disponible por ejecutar">
                  <span className="icon">💰</span>
                  <span style={{ color: disponible < 0 ? '#d32f2f' : '#388e3c' }}>
                    Disp: ${disponible.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};