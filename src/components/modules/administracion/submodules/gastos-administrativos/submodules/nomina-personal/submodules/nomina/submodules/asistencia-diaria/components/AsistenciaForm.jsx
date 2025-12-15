import React, { useState, useEffect } from "react";

import { formatDate } from "../../../../../../../../../../../../utils/formatters";
import { useNotification } from "../../../../../../../../../../../../contexts/NotificationContext";
import "./AsistenciaForm.css";
import {
  CheckIcon,
  RepeatIcon,
  XIcon,
  InfoIcon,
} from "../../../../../../../../../../../../assets/icons/Icons";

const AsistenciaForm = ({
  employees,
  selectedDate,
  getExistingAsistencia,
  onSave,
  readOnly = false, // Default to false
}) => {

  const [asistencias, setAsistencias] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  const [showInstructions, setShowInstructions] = useState(false);

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
        // Inicializar con todos los empleados ACTIVOS como presentes por defecto
        const activeEmployees = employees.filter(emp => emp.estado !== "Inactivo");
        const inicialAsistencias = activeEmployees.map((emp) => ({
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
    if (readOnly) return;
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
    if (readOnly) return;
    setAsistencias((prev) =>
      prev.map((registro) => ({
        ...registro,
        asistio,
        horasTrabajadas: asistio ? 8 : 0,
      }))
    );
  };

  const handleHorasTrabajadasChange = (empleadoId, horas) => {
    if (readOnly) return;
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
    if (readOnly) return;
    setAsistencias((prev) =>
      prev.map((registro) =>
        registro.empleadoId === empleadoId
          ? { ...registro, observaciones }
          : registro
      )
    );
  };

  const handleSave = async () => {
    if (readOnly) return;
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
    if (readOnly) return;
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
          <div className="header-title-container">
            <h3>Registro de Asistencia</h3>
            <button
              className="btn-info-asistencia"
              onClick={() => setShowInstructions(true)}
              title="Ver instrucciones"
            >
              <InfoIcon />
            </button>
          </div>
          <h3>{formatDate(selectedDate)}</h3>
          {/* {isEditing && (
            <span className="edit-badge">📝 Editando registro existente</span>
          )} */}
        </div>
        {!readOnly && (
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
        )}
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
        {asistencias.length === 0 ? (
          <div className="no-employees-warning">
            <div className="warning-icon">👥</div>
            <h4>No hay empleados registrados</h4>
            <p>
              Para registrar asistencias, primero debes agregar empleados en el
              módulo de Registro de Personal.
            </p>

          </div>
        ) : (
          <>
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
                  className={`employee-row ${registro.asistio ? "present" : "absent"}`}
                >
                  <div className="employee-info">
                    <div className="employee-name">{registro.nombre}</div>
                    <div className="employee-details">
                      <span className="cedula-badge">C.I. {registro.cedula}</span>
                      <span className="cargo-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                        {registro.cargo}
                      </span>
                    </div>
                  </div>

                  <div className="card-section">
                    <div className="card-section-title">ASISTENCIA</div>
                    <div className="attendance-toggle-segmented">
                      <button 
                        className={`segment-option ${registro.asistio ? "active present" : ""}`}
                        onClick={() => !readOnly && !isFutureDate && registro.asistio !== true && handleToggleAsistencia(registro.empleadoId)}
                        disabled={readOnly || isFutureDate}
                      >
                         <div className="segment-icon">
                           {registro.asistio && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                         </div>
                         Presente
                      </button>
                      <button 
                        className={`segment-option ${!registro.asistio ? "active absent" : ""}`}
                        onClick={() => !readOnly && !isFutureDate && registro.asistio !== false && handleToggleAsistencia(registro.empleadoId)}
                        disabled={readOnly || isFutureDate}
                      >
                        Ausente
                        <div className="segment-icon">
                           {!registro.asistio && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="card-section">
                     <div className="card-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        HORAS TRABAJADAS
                     </div>
                     <div className="hours-stepper">
                        <button 
                          className="stepper-btn"
                          disabled={!registro.asistio || isFutureDate || readOnly || registro.horasTrabajadas <= 0}
                          onClick={() => handleHorasTrabajadasChange(registro.empleadoId, Math.max(0, (registro.horasTrabajadas || 0) - 0.5))}
                        >
                          −
                        </button>
                        <div className="stepper-value">
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
                              disabled={!registro.asistio || isFutureDate || readOnly}
                              className="stepper-input"
                            />
                            <span>hrs</span>
                        </div>
                        <button 
                          className="stepper-btn"
                          disabled={!registro.asistio || isFutureDate || readOnly || registro.horasTrabajadas >= 24}
                          onClick={() => handleHorasTrabajadasChange(registro.empleadoId, Math.min(24, (registro.horasTrabajadas || 0) + 0.5))}
                        >
                          +
                        </button>
                     </div>
                  </div>

                  <div className="card-section">
                    <div className="card-section-title">OBSERVACIONES</div>
                    <div className="observations-input-wrapper">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="input-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      <input
                        type="text"
                        value={registro.observaciones || ""}
                        onChange={(e) =>
                          handleObservacionesChange(
                            registro.empleadoId,
                            e.target.value
                          )
                        }
                        placeholder="Escribe una nota aquí..."
                        disabled={isFutureDate || readOnly}
                        className="custom-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {!readOnly && (
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
      )}

      {/* Modal de Instrucciones */}
      {showInstructions && (
        <div className="modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowInstructions(false)}
            >
              <XIcon />
            </button>
            <div className="form-help" style={{ marginTop: 0, border: 'none', background: 'transparent', padding: 0 }}>
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
        </div>
      )}
    </div>
  );
};

export default AsistenciaForm;
