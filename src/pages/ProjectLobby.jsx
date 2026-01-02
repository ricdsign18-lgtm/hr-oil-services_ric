import { useParams, Routes, Route, Navigate } from "react-router-dom";
import { useProjects } from "../contexts/ProjectContext";
import MainLayout from "../components/layout/MainLayout/MainLayout";
import ResumenPage from "./ResumenPage";
import AdministracionPage from "./AdministracionPage";
import OperacionesPage from "./OperacionesPage";
import ContratoPage from "./ContratoPage";
import CoordinacionesPage from "./CoordinacionesPage";
import GestionRutasPermisos from "../components/modules/administracion/submodules/gestion-de-usuarios/GestionRutasPermisos";
import SolicitudesMain from "../components/modules/operaciones/submodules/solicitudes/SolicitudesMain"; // Importar
// import ProjectDashboard from '../components/projects/ProjectDashboard/ProjectDashboard'
import "./ProjectLobby.css";

const ProjectLobby = () => {
  const { projectId } = useParams();
  const { selectedProject, loading } = useProjects();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando proyecto...</p>
      </div>
    );
  }

  // Si no hay proyecto seleccionado, redirigir a selección
  if (!selectedProject || selectedProject.id !== projectId) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <Routes>
        {/* Ruta por defecto para el dashboard del proyecto, ahora redirige a resumen */}
        <Route path="/" element={<Navigate to="resumen" replace />} />
        <Route path="/resumen/*" element={<ResumenPage />} />
        <Route path="/administracion/*" element={<AdministracionPage />} />
        <Route path="/operaciones/*" element={<OperacionesPage />} />
        <Route path="/contrato/*" element={<ContratoPage />} />
        <Route path="/coordinaciones/*" element={<CoordinacionesPage />} />
        <Route path="/solicitudes" element={<SolicitudesMain />} />
        <Route path="/permissions" element={<GestionRutasPermisos />} />
        <Route path="*" element={<Navigate to="resumen" replace />} />
      </Routes>
    </MainLayout>
  );
};
export default ProjectLobby;
