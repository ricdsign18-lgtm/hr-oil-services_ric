// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/asistencia-diaria/components/AsistenciaForm.jsx
import React, { useState, useEffect } from "react";
import { formatDate } from "../../../../../../../../../../../../utils/formatters";
import { useNotification } from "../../../../../../../../../../../../contexts/NotificationContext";
import "./AsistenciaForm.css";
import {
  CheckIcon,
  RepeatIcon,
  XIcon,
} from "../../../../../../../../../../../../assets/icons/Icons";

const AsistenciaForm = ({
  employees,
  selectedDate,
  getExistingAsistencia,
  onSave,
}) => {
  const [asistencias, setAsistencias] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    loadExistingAsistencia();
  }, [employees, selectedDate]);

  const loadExistingAsistencia = async () => {
    setLoading(true);
    try {
      const existingAsistencia = await getExistingAsistencia();

      if (existingAsistencia) {
        setAsistencias(existingAsistencia.registros);
        setIsEditing(true);
      } else {
        // Inicializar con todos los empleados como presentes por defecto
        const inicialAsistencias = employees.map((emp) => ({
          empleadoId: emp.id,
          nombre: `${emp.nombre} ${emp.apellido}`,
          cedula: emp.cedula,
          cargo: emp.cargo,
          asistio: true,
          horasTrabajadas: 8, // Horas por defecto
          observaciones: "",
        }));
        setAsistencias(inicialAsistencias);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error cargando asistencia existente:", error);
     
      const inicialAsistencias = employees.map((emp) => ({
        empleadoId: emp.id,
        nombre: `${emp.nombre} ${emp.apellido}`,
        cedula: emp.cedula,
        cargo: emp.cargo,
        asistio: true,
        horasTrabajadas: 8,
        observaciones: "",
      }));
      setAsistencias(inicialAsistencias);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAsistencia = (empleadoId) => {
    setAsistencias((prev) =>
      prev.map((registro) =>
        registro.empleadoId === empleadoId
          ? {
              ...registro,
              asistio: !registro.asistio,
              horasTrabajadas: !registro.asistio ? 8 : 0,
            }
          : registro
      )
    );
  };

  const handleToggleAll = (asistio) => {
    setAsistencias((prev) =>
      prev.map((registro) => ({
        ...registro,
        asistio,
        horasTrabajadas: asistio ? 8 : 0,
      }))
    );
  };

  const handleHorasTrabajadasChange = (empleadoId, horas) => {
    const horasNum = parseFloat(horas) || 0;
    setAsistencias((prev) =>
      prev.map((registro) =>
        registro.empleadoId === empleadoId
          ? {
              ...registro,
              horasTrabajadas: horasNum,
              asistio: horasNum > 0, // Si tiene horas trabajadas, se considera presente
            }
          : registro
      )
    );
  };

  const handleObservacionesChange = (empleadoId, observaciones) => {
    setAsistencias((prev) =>
      prev.map((registro) =>
        registro.empleadoId === empleadoId
          ? { ...registro, observaciones }
          : registro
      )
    );
  };

  const handleSave = async () => {
    if (asistencias.length === 0) {
      showToast("No hay empleados para registrar asistencia", "warning");
      return;
    }

    // Validar que al menos haya algún empleado presente
    const presentes = asistencias.filter((r) => r.asistio).length;
    if (presentes === 0) {
      const confirmar = window.confirm(
        "No hay empleados marcados como presentes. ¿Estás seguro de que deseas guardar esta asistencia?"
      );
      if (!confirmar) return;
    }

    try {
      await onSave(asistencias);
      setIsEditing(true);
    } catch (error) {
      console.error("Error guardando asistencia:", error);
    }
  };

  const handleReset = () => {
    // Resetear a todos presentes
    const resetAsistencias = employees.map((emp) => ({
      empleadoId: emp.id,
      nombre: `${emp.nombre} ${emp.apellido}`,
      cedula: emp.cedula,
      cargo: emp.cargo,
      asistio: true,
      horasTrabajadas: 8,
      observaciones: "",
    }));
    setAsistencias(resetAsistencias);
  };

  const estadisticas = {
    total: asistencias.length,
    presentes: asistencias.filter((r) => r.asistio).length,
    ausentes: asistencias.filter((r) => !r.asistio).length,
    horasTotales: asistencias.reduce(
      (total, registro) => total + (registro.horasTrabajadas || 0),
      0
    ),
  };

  // Verificar si es una fecha futura
  const isFutureDate = new Date(selectedDate) > new Date();

  if (loading) {
    return (
      <div className="asistencia-form loading">
        <p>Cargando asistencia...</p>
      </div>
    );
  }

  return (
    <div className="asistencia-form">
      <div className="form-header">
        <div className="header-title">
          <h3>Registro de Asistencia</h3>
          <h3>{formatDate(selectedDate)}</h3>
          {/* {isEditing && (
            <span className="edit-badge">📝 Editando registro existente</span>
          )} */}
        </div>
        <div className="quick-actions">
          <button
            className="btn-asistencia-form-check"
            onClick={() => handleToggleAll(true)}
            disabled={isFutureDate}
          >
            <CheckIcon />
            Marcar Todos Presentes
          </button>
          <button
            className="btn-asistencia-form-x"
            onClick={() => handleToggleAll(false)}
            disabled={isFutureDate}
          >
            <XIcon />
            Marcar Todos Ausentes
          </button>
          <button
            className="btn-asistencia-form-repeat"
            onClick={handleReset}
            disabled={isFutureDate}
          >
            <RepeatIcon /> Reiniciar
          </button>
        </div>
      </div>

      {isFutureDate && (
        <div className="future-date-warning">
          ⚠️ No puedes modificar la asistencia de una fecha futura
        </div>
      )}

      <div className="stats-summary">
        <div className="stat-card present-form-asistencia">
          <div className="stat-number-form-asistencia">
            {estadisticas.presentes}
          </div>
          <div className="stat-label-form-asistencia">Presentes</div>
        </div>
        <div className="stat-card absent-form-asistencia">
          <div className="stat-number-form-asistencia">
            {estadisticas.ausentes}
          </div>
          <div className="stat-label-form-asistencia">Ausentes</div>
        </div>
        <div className="stat-card total-form-asistencia">
          <div className="stat-number-form-asistencia">
            {estadisticas.total}
          </div>
          <div className="stat-label-form-asistencia">Total</div>
        </div>
        <div className="stat-card hours-form-asistencia">
          <div className="stat-number-form-asistencia">
            {estadisticas.horasTotales}h
          </div>
          <div className="stat-label-form-asistencia">Horas Totales</div>
        </div>
      </div>

      <div className="employees-list-asistencia-form">
        <div className="list-header-asistencia-form">
          <span className="col-employee">Empleado</span>
          <span className="col-status">Estado</span>
          <span className="col-hours">Horas</span>
          <span className="col-observations">Observaciones</span>
        </div>

        <div className="employees-scroll-container-asistencia-form">
          {asistencias.map((registro) => (
            <div
              key={registro.empleadoId}
              className={`employee-row ${
                registro.asistio ? "present" : "absent"
              }`}
            >
              <div className="employee-info">
                <div className="employee-name">{registro.nombre}</div>
                <div className="employee-details">
                  <span className="cedula">C.I. {registro.cedula}</span>
                  <span className="separator">•</span>
                  <span className="cargo">{registro.cargo}</span>
                </div>
              </div>

              <div className="attendance-controls">
                <div className="attendance-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={registro.asistio}
                      onChange={() =>
                        handleToggleAsistencia(registro.empleadoId)
                      }
                      disabled={isFutureDate}
                    />
                    <span className="slider">
                      <span className="toggle-text">
                        {registro.asistio ? "✅ Presente" : "❌ Ausente"}
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="hours-control">
                <input
                  type="number"
                  value={registro.horasTrabajadas || 0}
                  onChange={(e) =>
                    handleHorasTrabajadasChange(
                      registro.empleadoId,
                      e.target.value
                    )
                  }
                  min="0"
                  max="24"
                  step="0.5"
                  disabled={!registro.asistio || isFutureDate}
                  className={!registro.asistio ? "disabled" : ""}
                />
                <span className="hours-label">horas</span>
              </div>

              <div className="observations-control">
                <input
                  type="text"
                  value={registro.observaciones || ""}
                  onChange={(e) =>
                    handleObservacionesChange(
                      registro.empleadoId,
                      e.target.value
                    )
                  }
                  placeholder="Observaciones..."
                  disabled={isFutureDate}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-save-asistencia-form"
          onClick={handleSave}
          disabled={asistencias.length === 0 || isFutureDate}
        >
          {isEditing
            ? "💾 Actualizar Asistencia"
            : "💾 Guardar Asistencia del Día"}
        </button>

        {isEditing && (
          <div className="saved-info">
            <p>
              ✅ <strong>Asistencia registrada anteriormente</strong>
            </p>
            <small>Puedes modificar los registros y guardar los cambios.</small>
          </div>
        )}
      </div>

      {/* Leyenda y ayuda */}
      <div className="form-help">
        <h4>📋 Instrucciones:</h4>
        <ul>
          <li>
            Usa los interruptores para marcar <strong>Presente</strong> o{" "}
            <strong>Ausente</strong>
          </li>
          <li>
            Para empleados presentes, ajusta las{" "}
            <strong>horas trabajadas</strong> (por defecto 8 horas)
          </li>
          <li>
            Agrega <strong>observaciones</strong> para casos especiales
            (licencias, permisos, etc.)
          </li>
          <li>
            Los botones de acción rápida te permiten marcar todos los empleados
            de una vez
          </li>
          <li>
            Puedes <strong>editar</strong> asistencias ya guardadas en cualquier
            momento
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AsistenciaForm;
