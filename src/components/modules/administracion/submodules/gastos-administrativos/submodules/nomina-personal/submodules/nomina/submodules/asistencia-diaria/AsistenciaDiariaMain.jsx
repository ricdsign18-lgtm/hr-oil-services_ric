import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../contexts/PersonalContext";
import ModuleDescription from "../../../../../../../../../_core/ModuleDescription/ModuleDescription";
import AsistenciaForm from "./components/AsistenciaForm";
import HistorialAsistencias from "./components/HistorialAsistencias";
import "./AsistenciaDiariaMain.css";

import { useAuth } from "../../../../../../../../../../../contexts/AuthContext"; // Import useAuth

const AsistenciaDiariaMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();
  const { hasPermissionSync } = useAuth(); // Destructure hasPermissionSync
  const {
    getEmployeesByProject,
    saveAsistencia,
    getAsistenciaByFechaAndProject,
    getAsistenciasByProject,
    deleteAsistencia,
  } = usePersonal();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [currentView, setCurrentView] = useState("registrar");
  const [employees, setEmployees] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);

  // ... (rest of the component logic remains the same until the button)

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
    if (!hasPermissionSync("administracion", "write")) {
        alert("No tienes permisos para realizar esta acción");
        return;
    }
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

  const handleDeleteAsistencia = async (id) => {
    if (!hasPermissionSync("administracion", "delete")) {
        alert("No tienes permisos para realizar esta acción");
        return;
    }
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro de asistencia?")) {
      try {
        await deleteAsistencia(id); // Asumiendo que deleteAsistencia está disponible en usePersonal
        await loadData(); // Recargar datos
        alert("Asistencia eliminada exitosamente");
      } catch (error) {
        alert("Error al eliminar asistencia: " + error.message);
      }
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

    return {
      total: employees.length,
      presentes: 0,
      ausentes: 0,
      porcentaje: 0,
    };
  };
  const stats = estadisticasDelDia();
  const statsCards =[
    {
      number: stats.total,
      label: "Total Empleados",
    },
    {
      number: stats.presentes,
      label: "Presentes",
    },
    {
      number: stats.ausentes,
      label: "Ausentes",
    },
    {
      number: stats.porcentaje,
      label: "Porcentaje",
    }
  ]

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
          {hasPermissionSync("administracion", "write") && (
            <button
                className={currentView === "registrar" ? "active" : ""}
                onClick={() => setCurrentView("registrar")}
                disabled={loading}
            >
                Registrar Asistencia
            </button>
          )}
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
      ) : (
        <>
            <div className="stats-cards-asistencia">
            {statsCards.map((stat, index) => (
              <div className="stat-card" key={index}>
                <div className="stat-number-asistencia">{stat.number}</div>
                <div className="stat-label-asistencia">{stat.label}</div>
              </div>
            ))}
          </div>


          <div className="module-content">
            {currentView === "registrar" ? (
              <AsistenciaForm
                employees={employees}
                selectedDate={selectedDate}
                getExistingAsistencia={getAsistenciaDelDia}
                onSave={handleSaveAsistencia}
                readOnly={!hasPermissionSync("administracion", "write")}
              />
            ) : (
              <HistorialAsistencias
                asistencias={asistencias}
                employees={employees}
                onDateSelect={(fecha) => {
                  setSelectedDate(fecha);
                  setCurrentView("registrar");
                }}
                onDelete={handleDeleteAsistencia}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AsistenciaDiariaMain;
