import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../contexts/PersonalContext";
import ModuleDescription from "../../../../../../../../../_core/ModuleDescription/ModuleDescription";
import AsistenciaForm from "./components/AsistenciaForm";
import HistorialAsistencias from "./components/HistorialAsistencias";
import "./AsistenciaDiariaMain.css";

const AsistenciaDiariaMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();
  const {
    getEmployeesByProject,
    saveAsistencia,
    getAsistenciaByFechaAndProject,
    getAsistenciasByProject,
  } = usePersonal();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentView, setCurrentView] = useState("registrar");
  const [employees, setEmployees] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar empleados y asistencias del proyecto actual
  useEffect(() => {
    loadData();
  }, [selectedProject?.id]);

  const loadData = async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    try {
      const [employeesData, asistenciasData] = await Promise.all([
        getEmployeesByProject(selectedProject.id),
        getAsistenciasByProject(selectedProject.id),
      ]);
      setEmployees(employeesData);
      setAsistencias(asistenciasData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSaveAsistencia = async (asistenciaData) => {
    try {
      await saveAsistencia({
        fecha: selectedDate,
        registros: asistenciaData,
        projectId: selectedProject?.id,
      });
      await loadData(); // Recargar datos
      alert("Asistencia guardada exitosamente");
    } catch (error) {
      alert("Error al guardar asistencia: " + error.message);
    }
  };

  const getAsistenciaDelDia = async () => {
    if (!selectedProject?.id) return null;
    return await getAsistenciaByFechaAndProject(
      selectedDate,
      selectedProject.id
    );
  };

  const estadisticasDelDia = () => {
    // Para estadísticas en tiempo real, usamos los empleados cargados
    // ya que la asistencia del día se maneja en el estado local del formulario
    return {
      total: employees.length,
      presentes: 0,
      ausentes: 0,
      porcentaje: 0,
    };
  };

  const stats = estadisticasDelDia();

  return (
    <div className="asistencia-diaria-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Nómina
      </button>

      <ModuleDescription
        title="Asistencia Diaria"
        description={`Control de asistencia y horarios del personal - ${
          selectedProject?.name || ""
        }`}
      />

      <div className="asistencia-controls">
        <div className="date-selector-asistencia">
          <label>Fecha de Asistencia:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            disabled={loading}
          />
        </div>

        <div className="view-toggle">
          <button
            className={currentView === "registrar" ? "active" : ""}
            onClick={() => setCurrentView("registrar")}
            disabled={loading}
          >
            Registrar Asistencia
          </button>
          <button
            className={currentView === "historial" ? "active" : ""}
            onClick={() => setCurrentView("historial")}
            disabled={loading}
          >
            Ver Historial
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Cargando datos...</p>
        </div>
      ) : employees.length > 0 ? (
        <>
          <div className="stats-cards-asistencia">
            <div className="stat-card total-asistencia">
              <div className="stat-number-asistencia">{stats.total}</div>
              <div className="stat-label-asistencia">Total Empleados</div>
            </div>
            <div className="stat-card present-asistencia">
              <div className="stat-number-asistencia">{stats.presentes}</div>
              <div className="stat-label-asistencia">Presentes</div>
            </div>
            <div className="stat-card absent-asistencia">
              <div className="stat-number-asistencia">{stats.ausentes}</div>
              <div className="stat-label-asistencia">Ausentes</div>
            </div>
            <div className="stat-card percentage-asistencia">
              <div className="stat-number-asistencia">{stats.porcentaje}%</div>
              <div className="stat-label-asistencia">Asistencia</div>
            </div>
          </div>

          <div className="module-content">
            {currentView === "registrar" ? (
              <AsistenciaForm
                employees={employees}
                selectedDate={selectedDate}
                getExistingAsistencia={getAsistenciaDelDia}
                onSave={handleSaveAsistencia}
              />
            ) : (
              <HistorialAsistencias
                asistencias={asistencias}
                employees={employees}
                onDateSelect={(fecha) => {
                  setSelectedDate(fecha);
                  setCurrentView("registrar");
                }}
              />
            )}
          </div>
        </>
      ) : (
        <div className="no-employees-warning">
          <div className="warning-icon">👥</div>
          <h4>No hay empleados registrados</h4>
          <p>
            Para registrar asistencias, primero debes agregar empleados en el
            módulo de Registro de Personal.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate("../registro-personal")}
          >
            Ir a Registro de Personal
          </button>
        </div>
      )}
    </div>
  );
};

export default AsistenciaDiariaMain;
