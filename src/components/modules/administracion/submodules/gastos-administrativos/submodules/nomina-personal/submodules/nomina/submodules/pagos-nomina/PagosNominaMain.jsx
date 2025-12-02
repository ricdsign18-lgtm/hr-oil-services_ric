// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/pagos-nomina/PagosNominaMain.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../contexts/PersonalContext";
import { useNotification } from "../../../../../../../../../../../contexts/NotificationContext";
import { useAuth } from "../../../../../../../../../../../contexts/AuthContext";
import ModuleDescription from "../../../../../../../../../_core/ModuleDescription/ModuleDescription";
import CalculadoraPagos from "./components/CalculadoraPagos";
import HistorialPagos from "./components/HistorialPagos";
import ResumenPagos from "./components/ResumenPagos";
import ReportesNomina from "./components/ReportesNomina";
import FeedbackModal from "../../../../../../../../../../../components/common/FeedbackModal/FeedbackModal";
import "./PagosNominaMain.css";

const PagosNominaMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();
  const { hasPermissionSync } = useAuth();
  const {
    getEmployeesByProject,
    getAsistenciasByProject,
    savePagos,
    getPagosByProject,
    deletePago,
  } = usePersonal();
  const { showToast } = useNotification();

  const [currentView, setCurrentView] = useState(
    hasPermissionSync("administracion", "write") ? "calculadora" : "historial"
  );
  const [fechaPago, setFechaPago] = useState("");
  const [tasaCambio, setTasaCambio] = useState("");
  const [pagosCalculados, setPagosCalculados] = useState([]);
  const [pagosGuardados, setPagosGuardados] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Cargar empleados, asistencias y pagos del proyecto
  useEffect(() => {
    loadData();
  }, [selectedProject?.id]);

  useEffect(() => {
    // Establecer fecha por defecto (próximo viernes)
    const hoy = new Date();
    const diasHastaViernes = (5 - hoy.getDay() + 7) % 7;
    const proximoViernes = new Date(hoy);
    proximoViernes.setDate(hoy.getDate() + diasHastaViernes);

    // Formatear la fecha a YYYY-MM-DD sin conversiones de zona horaria
    const year = proximoViernes.getFullYear();
    const month = String(proximoViernes.getMonth() + 1).padStart(2, "0");
    const day = String(proximoViernes.getDate()).padStart(2, "0");

    setFechaPago(`${year}-${month}-${day}`);
  }, []);

  const loadData = async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    try {
      const [employeesData, asistenciasData, pagosData] = await Promise.all([
        getEmployeesByProject(selectedProject.id),
        getAsistenciasByProject(selectedProject.id),
        getPagosByProject(selectedProject.id),
      ]);
      setEmployees(employeesData);
      setAsistencias(asistenciasData);
      setPagosGuardados(pagosData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      showToast("Error al cargar datos: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCalcularPagos = (pagosCalculados) => {
    setPagosCalculados(pagosCalculados);
    setCurrentView("resumen");
  };

  const handleGuardarPagos = async (pagosData) => {
    try {
      const nuevoPago = {
        fechaPago,
        tasaCambio: parseFloat(tasaCambio),
        pagos: pagosData,
        projectId: selectedProject?.id,
      };

      await savePagos(nuevoPago);
      await loadData(); // Recargar datos
      setCurrentView("historial");
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Pagos Guardados',
        message: 'Los pagos de nómina han sido guardados exitosamente.'
      });
    } catch (error) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Error al guardar pagos: ' + error.message
      });
    }
  };

  const handleDeletePago = async (id) => {
    try {
      await deletePago(id);
      await loadData(); // Recargar datos
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Pago Eliminado',
        message: 'El registro de pago ha sido eliminado exitosamente.'
      });
    } catch (error) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Error al eliminar pago: ' + error.message
      });
    }
  };

  return (
    <div className="pagos-nomina-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Nómina
      </button>

      <ModuleDescription
        title="Pagos Nómina"
        description={`Gestión de pagos, cálculos y liquidaciones de nómina - ${selectedProject?.name || ""
          }`}
      />

      <div className="pagos-controls">
        <div className="control-group">
          <div className="control-item">
            <label>Fecha de Pago (Viernes):</label>
            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="control-item">
            <label>Tasa de Cambio (Bs/$):</label>
            <input
              type="number"
              value={tasaCambio}
              onChange={(e) => setTasaCambio(e.target.value)}
              placeholder="0.0000"
              step="0.0001"
              min="0"
              disabled={loading}
            />
          </div>
        </div>

        <div className="view-toggle">
          {hasPermissionSync("administracion", "write") && (
            <button
              className={currentView === "calculadora" ? "active" : ""}
              onClick={() => setCurrentView("calculadora")}
              disabled={loading}
            >
              Calculadora
            </button>
          )}
          <button
            className={currentView === "resumen" ? "active" : ""}
            onClick={() => setCurrentView("resumen")}
            disabled={!pagosCalculados.length || loading}
          >
            Resumen
          </button>
          <button
            className={currentView === "historial" ? "active" : ""}
            onClick={() => setCurrentView("historial")}
            disabled={loading}
          >
            Historial
          </button>
          <button
            className={currentView === "reportes" ? "active" : ""}
            onClick={() => setCurrentView("reportes")}
            disabled={loading}
          >
            Reportes
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Cargando datos...</p>
        </div>
      ) : (
        <div className="module-content">
          {currentView === "calculadora" && (
            <CalculadoraPagos
              employees={employees}
              asistencias={asistencias}
              fechaPago={fechaPago}
              tasaCambio={tasaCambio}
              onCalcular={handleCalcularPagos}
              selectedProject={selectedProject}
            />
          )}

          {currentView === "resumen" && (
            <ResumenPagos
              pagosCalculados={pagosCalculados}
              fechaPago={fechaPago}
              tasaCambio={tasaCambio}
              onGuardar={handleGuardarPagos}
              onVolver={() => setCurrentView("calculadora")}
              selectedProject={selectedProject}
            />
          )}

          {currentView === "historial" && (
            <HistorialPagos
              pagosGuardados={pagosGuardados}
              employees={employees}
              onVerDetalles={(pago) => {
                setPagosCalculados(pago.pagos);
                setFechaPago(pago.fechaPago);
                setTasaCambio(pago.tasaCambio.toString());
                setCurrentView("resumen");
              }}
              onDeletePago={handleDeletePago}
              selectedProject={selectedProject}
            />
          )}

          {currentView === "reportes" && (
            <ReportesNomina
              pagosGuardados={pagosGuardados}
              employees={employees}
              asistencias={asistencias}
              selectedProject={selectedProject}
            />
          )}
        </div>
      )}

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={handleCloseFeedback}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
};

export default PagosNominaMain;
