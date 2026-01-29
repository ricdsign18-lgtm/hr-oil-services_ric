import {
  SackDollarIcon,
  HammerIcon,
  MultiUsersIcon
} from "../../../../../../assets/icons/Icons";
import "./PlanningDayItem.css";

export const PlanningDayItem = ({ dia, onClick, payrollEstimated }) => {
  const dateObj = new Date(dia.fecha + "T00:00:00");
  const isToday = new Date().toDateString() === dateObj.toDateString();

  return (
    <div
      className={`planning-dia-item ${isToday ? "is-today" : ""}`}
      onClick={() => onClick(dia)}
    >
      <header className="header-item-day">
        <section className="planning-dia-header">
          <span className="dia-name">
            {dateObj.toLocaleDateString("es-ES", { weekday: "long" })}
          </span>
          <span className="dia-number">{dateObj.getDate()}</span>
          <span className="dia-month">
            {dateObj.toLocaleDateString("es-ES", { month: "short" })}
          </span>
        </section>
      </header>

      <div className="dia-content">
        <div className="dia-stats">
          <div className="stat-row">
            <span className="stat-icon">
              <HammerIcon />
            </span>
            <span className="stat-value">{dia.cantidad_actividades || 0}</span>
          </div>
          <div className="stat-row">
            <span className="stat-icon">
              <SackDollarIcon />
            </span>
            <span className="stat-value">
              ${(dia.monto_planificado || 0).toLocaleString()}
            </span>
          </div>
          {dia.cantidad_actividades > 0 && payrollEstimated > 0 && (
            <div className="stat-row" title="Nómina Estimada del Día">
              <span className="stat-icon" style={{ color: '#1976D2' }}>
                <MultiUsersIcon />
              </span>
              <span className="stat-value" style={{ color: '#1976D2' }}>
                ${payrollEstimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="dia-hover-action">Ver Detalles →</div>
    </div>
  );
};
