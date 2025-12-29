import React, { useState } from "react";
import { formatDate } from "../../../../../../../../../../../../utils/formatters";
import "./HistorialAsistencias.css";
import { DelateIcon } from "../../../../../../../../../../../../assets/icons/Icons";

const HistorialAsistencias = ({ asistencias, employees, onDateSelect, onDelete }) => {
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Agrupar asistencias por mes
  const asistenciasFiltradas = asistencias
    .filter((a) => a.fecha.startsWith(filterMonth))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const getEstadisticasPorFecha = (asistencia) => {
    const total = asistencia.registros.length;
    const presentes = asistencia.registros.filter((r) => r.asistio).length;
    const porcentaje = Math.round((presentes / total) * 100);

    return { total, presentes, ausentes: total - presentes, porcentaje };
  };

  const getEmpleadoInfo = (empleadoId) => {
    return (
      employees.find((emp) => emp.id === empleadoId) || {
        nombre: "Empleado no encontrado",
        cedula: "N/A",
        cargo: "N/A",
      }
    );
  };

  if (asistencias.length === 0) {
    return (
      <div className="empty-historial">
        <div className="empty-icon">📊</div>
        <h4>No hay registros de asistencia</h4>
        <p>Comienza registrando la asistencia del día actual</p>
      </div>
    );
  }

  return (
    <div className="historial-asistencias">
      <div className="historial-header">
        <h3>Historial de Asistencias</h3>
        <div className="filter-controls">
          <label>Filtrar por mes:</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="historial-list">
        {asistenciasFiltradas.map((asistencia) => {
          const stats = getEstadisticasPorFecha(asistencia);

          return (
            <div key={asistencia.id} className="historial-item">
              <div className="historial-date">
                <div className="date-main">{formatDate(asistencia.fecha)}</div>
                <div className="date-actions">
                  <button
                    className="btn-view"
                    onClick={() => onDateSelect(asistencia.fecha)}
                  >
                    Ver Detalles
                  </button>
                  <button
                    className="btn-delete-asistencia"
                    onClick={() => onDelete(asistencia.id)}
                    title="Eliminar registro de asistencia"
                  >
                    <div className="delete-icon-asistencia">
                    <DelateIcon/>
                  </div>
                  </button>
                </div>
              </div>

              <div className="historial-stats">
                <div className="stat">
                  <span className="number">{stats.presentes}</span>
                  <span className="label">Presentes</span>
                </div>
                <div className="stat">
                  <span className="number">{stats.ausentes}</span>
                  <span className="label">Ausentes</span>
                </div>
                <div className="stat">
                  <span className="number">{stats.porcentaje}%</span>
                  <span className="label">Asistencia</span>
                </div>
              </div>

              <div className="historial-details">
                <div className="details-toggle">
                  <span>Ver lista de empleados ↓</span>
                </div>
                <div className="employees-list-detailed">
                  {asistencia.registros.map((registro) => {
                    const empleado = getEmpleadoInfo(registro.empleadoId);
                    return (
                      <div
                        key={registro.empleadoId}
                        className="employee-detail"
                      >
                        <span className="employee-name-historial">{registro.nombre}</span>
                        <span className="employee-cedula-historial">
                          C.I. {registro.cedula}
                        </span>
                        <span
                          className={`attendance-status ${
                            registro.asistio ? "present" : "absent"
                          }`}
                        >
                          {registro.asistio ? "✅ Presente" : "❌ Ausente"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {asistenciasFiltradas.length === 0 && (
        <div className="no-results">
          <p>No hay registros de asistencia para el mes seleccionado</p>
        </div>
      )}
    </div>
  );
};

export default HistorialAsistencias;
