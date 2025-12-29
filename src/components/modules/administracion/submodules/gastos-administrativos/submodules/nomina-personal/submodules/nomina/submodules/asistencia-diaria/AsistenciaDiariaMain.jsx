import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../contexts/PersonalContext";
import ModuleDescription from "../../../../../../../../../_core/ModuleDescription/ModuleDescription";
import AsistenciaForm from "./components/AsistenciaForm";
import HistorialAsistencias from "./components/HistorialAsistencias";
import AsistenciaContratistas from "./components/AsistenciaContratistas";
import supabase from "../../../../../../../../../../../api/supaBase";
import InventoryHeader from "../../../../../../../../../operaciones/submodules/inventario/InventoryHeader";
import "./AsistenciaDiariaMain.css";

import { useAuth } from "../../../../../../../../../../../contexts/AuthContext";

const AsistenciaDiariaMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();
  const { hasPermissionSync } = useAuth();
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

  // Cargar empleados y asistencias del proyecto actual
  useEffect(() => {
    loadData();
  }, [selectedProject?.id]);

  const loadData = async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    try {
      const [employeesData, asistenciasData, contratistasData] = await Promise.all([
        getEmployeesByProject(selectedProject.id),
        getAsistenciasByProject(selectedProject.id),
        supabase
          .from("asistencia_contratistas")
          .select("*, contratistas(nombre_contratista)")
          .eq("project_id", selectedProject.id)
          .order("fecha", { ascending: false })
      ]);

      setEmployees(employeesData.filter(e => !e.isContractor));

      // Group Contractor Attendance by Date to create History Cards
      const groupedByDate = {};
      (contratistasData.data || []).forEach(record => {
          if (!groupedByDate[record.fecha]) {
              groupedByDate[record.fecha] = [];
          }
          groupedByDate[record.fecha].push(record);
      });

      const contratistasHistory = Object.keys(groupedByDate).map(date => {
          const records = groupedByDate[date];
          return {
              id: `contractor-attendance-${date}`,
              fecha: date,
              registros: records.map(r => ({
                  empleadoId: r.contratista_id,
                  nombre: r.contratistas?.nombre_contratista || "Contratista",
                  cedula: "Contratista",
                  asistio: r.asistio, 
                  isContractor: true,
                  details: `Personal: ${r.cantidad_personal_asistente}` 
              })),
              isContractorRecord: true
          };
      });

      // Merge and sort
      const allAsistencias = [...asistenciasData, ...contratistasHistory]
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setAsistencias(allAsistencias);
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
    if (window.confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      try {
        // Check if it's a contractor record (ID Pattern: contractor-attendance-YYYY-MM-DD)
        if (typeof id === 'string' && id.startsWith('contractor-attendance-')) {
             const dateToDelete = id.replace('contractor-attendance-', '');
             const { error } = await supabase
                .from('asistencia_contratistas')
                .delete()
                .eq('project_id', selectedProject.id)
                .eq('fecha', dateToDelete);
             
             if (error) throw error;
        } else {
             // Regular employee attendance
             await deleteAsistencia(id); 
        }

        await loadData(); 
        alert("Registro eliminado exitosamente");
      } catch (error) {
        alert("Error al eliminar registro: " + error.message);
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
  ];

  return (
    <main className="asistencia-diaria-main">
      
      <button className="back-button" onClick={handleBack}>
        ← Volver a Nómina
      </button>

      <ModuleDescription
        title="Asistencia Diaria"
        description={`Control de asistencia y horarios del personal - ${
          selectedProject?.name || ""
        }`}
      />
      
      <section className="stats-cards-asistencia">
        {statsCards.map((stat, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-number-asistencia">{stat.number}</div>
            <div className="stat-label-asistencia">{stat.label}</div>
          </div>
        ))}
      </section>

    <section className="asistencia-content">
      <header>

        <InventoryHeader
        tabs={[
            { label: "Empleados", value: "registrar"},
            { label: "Contratistas", value: "contratistas"},
            { label: "Historial", value: "historial"},
        ]}

        activeTab={currentView}
        onTabChange={setCurrentView}
        />

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
      </header>
      {loading ? (
        <div className="loading-state">
          <p>Cargando datos...</p>
        </div>
      ) : (
        <>
          <section className="module-content">
            {currentView === "registrar" && (
              <AsistenciaForm
                employees={employees}
                selectedDate={selectedDate}
                getExistingAsistencia={getAsistenciaDelDia}
                onSave={handleSaveAsistencia}
                readOnly={!hasPermissionSync("administracion", "write")}
              />
            )}

            {currentView === "historial" && (
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
            
            {currentView === "contratistas" && (
             <AsistenciaContratistas
               projectId={selectedProject?.id}
               fecha={selectedDate}
               onGuardar={() => {
                 loadData();
               }}
             />
           )}
          </section>
        </>
      )}
    </section>
    </main>
  );
};

export default AsistenciaDiariaMain;
