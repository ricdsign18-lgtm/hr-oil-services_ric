// components/planificacion/SemanasList.jsx

import { usePersonal } from "../../../../../../contexts/PersonalContext";
import { useProjects } from "../../../../../../contexts/ProjectContext";
import { calculateDailyLaborCost } from "../../../../../../utils/payrollCalculator";
import { useEffect, useState, useCallback, useMemo } from "react";
import { MultiUsersIcon } from "../../../../../../assets/icons/Icons";
import { usePlanning } from "../../../../../../contexts/PlanningContext";

export const SemanasList = ({ semanas, onSelectSemana }) => {
  const { getEmployeesByProject } = usePersonal();
  const { selectedProject } = useProjects();
  const { actividades } = usePlanning();
  const [employees, setEmployees] = useState([]);

  // Memoize active dates to avoid recalculating inside the loop
  const activeDates = useMemo(() => {
    if (!actividades) return new Set();
    const dates = new Set();
    actividades.forEach(a => {
      if (a.plan_dias && a.plan_dias.fecha) {
        dates.add(a.plan_dias.fecha.split('T')[0]);
      }
    });
    return dates;
  }, [actividades]);

  useEffect(() => {
    const loadEmps = async () => {
      if (selectedProject?.id) {
        const data = await getEmployeesByProject(selectedProject.id);
        setEmployees(data || []);
      }
    };
    loadEmps();
  }, [selectedProject, getEmployeesByProject]);

  const calculateWeeklyPayroll = useCallback((semana) => {
    if (!employees.length || !semana.fecha_inicio || !semana.fecha_fin) return 0;

    let total = 0;
    const startDate = new Date(semana.fecha_inicio + 'T12:00:00');
    const endDate = new Date(semana.fecha_fin + 'T12:00:00');

    // Iterate through each day of the week
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Only include in payroll if the day has activities
      if (activeDates.has(dateStr)) {
        employees.forEach(emp => {
          if (emp.estado === 'Activo' || emp.estado === 'Vacaciones' || emp.estado === 'Reposo') {
            total += calculateDailyLaborCost(emp, dateStr);
          }
        });
      }
    }
    return total;
  }, [employees, activeDates]);
  return (
    <div className="planning-semanas-container">
      {semanas.map((semana) => {
        const planificado = semana.monto_planificado || 0;
        const ejecutado = semana.monto_ejecutado || 0;
        const requerimientos = semana.monto_requerimientos || 0;
        const porcentajeEjecucion =
          planificado > 0 ? (ejecutado / planificado) * 100 : 0;
        const disponible = planificado - requerimientos;
        const payrollTotal = calculateWeeklyPayroll(semana);

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
                  {new Date(
                    semana.fecha_inicio + "T00:00:00",
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(
                    semana.fecha_fin + "T00:00:00",
                  ).toLocaleDateString()}
                </span>
              </div>
              {planificado > 0 && (
                <div
                  className={`semana-status-badge ${ejecutado > planificado ? "danger" : "success"}`}
                >
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
                  <span
                    className={`value ${ejecutado > planificado ? "text-danger" : ""}`}
                  >
                    ${ejecutado.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="progress-bar-container">
                <div
                  className={`progress-bar ${ejecutado > planificado ? "over-budget" : ""}`}
                  style={{ width: `${Math.min(porcentajeEjecucion, 100)}%` }}
                ></div>
              </div>

              <div className="financial-details">
                <div className="detail-item" title="Monto en Requerimientos">
                  <span className="icon">📋</span>
                  <span>Req: ${requerimientos.toLocaleString()}</span>
                </div>
                <div className="detail-item" title="Disponible para requerir">
                  <span className="icon">💰</span>
                  <span
                    style={{ color: disponible < 0 ? "#d32f2f" : "#388e3c" }}
                  >
                    Disp: ${disponible.toLocaleString()}
                  </span>
                </div>
                {payrollTotal > 0 && (
                  <div className="detail-item" title="Nómina Estimada Semanal" style={{ flexBasis: '100%', marginTop: '5px' }}>
                    <span className="icon" style={{ color: '#1976D2' }}><MultiUsersIcon /></span>
                    <span style={{ color: '#1976D2' }}>Nomina: ${payrollTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
