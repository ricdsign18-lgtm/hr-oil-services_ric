// components/planificacion/SemanasList.jsx

export const SemanasList = ({ semanas, onSelectSemana }) => {
  return (
    <div className="planning-semanas-container">
      {semanas.map((semana) => {
        const montoPlanificadoActividades = semana.monto_planificado || 0;
        const porEjecutar = montoPlanificadoActividades - (semana.monto_requerimientos || 0);

        return (
          <div 
            key={semana.id}
            className="planning-semana-item"
            onClick={() => onSelectSemana(semana)}
          >
            <div className="planning-semana-header">
              <h3>Semana {semana.numero_semana}</h3>
              <p className="planning-semana-dates">
                {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
              </p>
            </div>
            
            <div className="planning-semana-financials">
              <div>
                <p className="planning-financial-label">Planificado (Act.)</p>
                <p className="planning-financial-value">${montoPlanificadoActividades.toLocaleString()}</p>
              </div>
              <div>
                <p className="planning-financial-label">Gastos (Req.)</p>
                <p className="planning-financial-value">${(semana.monto_requerimientos || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="planning-financial-label">Por Ejecutar</p>
                <p className="planning-financial-value" style={{ color: porEjecutar < 0 ? '#d32f2f' : '#388e3c' }}>
                  ${porEjecutar.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="planning-financial-label">Monto Ejecutado</p>
                <p className="planning-financial-value">${(semana.monto_ejecutado || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};