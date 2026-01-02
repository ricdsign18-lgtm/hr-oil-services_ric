import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useProjects } from "../../../contexts/ProjectContext";
import { DashboarddIcon } from "/src/assets/icons/Icons.jsx";
import { PortfolioIcon } from "/src/assets/icons/Icons.jsx";
import { AgreementIcon } from "/src/assets/icons/Icons.jsx";
import { ConfigIcon } from "/src/assets/icons/Icons.jsx";
import { ContractIcon } from "/src/assets/icons/Icons.jsx";
import { MultiUsersIcon } from "/src/assets/icons/Icons.jsx";
import { ROLES } from "../../../config/permissions"; // Importante para logica de menu
import supabase from "../../../api/supaBase";
import Sidebar from "../../common/Sidebar/Sidebar";
// import AppHeader from "../AppHeader/AppHeader";
import { Header } from "../AppHeader/Header";

import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const { userData } = useAuth();
  const { selectedProject } = useProjects();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const handleToggleSidebar = (newState) =>
    setSidebarOpen(typeof newState === "boolean" ? newState : !isSidebarOpen);

  // Efecto para detectar si es móvil
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarItems = [
    {
      id: "resumen",
      label: "Resumen / Dashboard",
      icon: <DashboarddIcon className="sidebar-action-icon" />,
      path: "/resumen",
    },
    {
      id: "administracion",
      label: "Administración",
      icon: <PortfolioIcon className="sidebar-action-icon" />,
      path: "/administracion",
    },
    {
      id: "operaciones",
      label: "Operaciones",
      icon: <ConfigIcon className="sidebar-action-icon" />,
      path: "/operaciones",
    },
    {
      id: "contrato",
      label: "Contrato",
      icon: <ContractIcon className="sidebar-action-icon" />,
      path: "/contrato",
    },
    {
      id: "coordinaciones",
      label: "Coordinaciones",
      icon: <AgreementIcon className="sidebar-action-icon" />,
      path: "/coordinaciones",
    },
  ];

  // Agregar item de Solicitudes SOLO para Jefes (>= 50)
  // Necesitamos ROLES para comparar level, o hardcodear la logica si no queremos importar ROLES aqui
  // Pero lo correcto es usar permissions.
  // Importaremos ROLES arriba.
  // Estado para el badge de solicitudes
  const [pendingCount, setPendingCount] = useState(0);

  // Efecto para consultar solicitudes pendientes (Solo Jefes)
  useEffect(() => {
    const fetchPending = async () => {
      if (!userData?.role || ROLES[userData.role]?.level < 50 || !selectedProject) return;

      try {
        // Consultamos directamente los items "por_aprobar" en el proyecto actual
        // Necesitamos un join manual o consulta directa. 
        // Primero traemos requerimientos del proyecto
        const { data: reqs, error: reqError } = await supabase
          .from('requerimientos')
          .select('id')
          .eq('project_id', selectedProject.id);

        if (reqError || !reqs) return;
        
        const reqIds = reqs.map(r => r.id);
        
        if (reqIds.length > 0) {
          const { count, error: countError } = await supabase
            .from('requerimiento_items')
            .select('*', { count: 'exact', head: true })
            .in('requerimiento_id', reqIds)
            .eq('status', 'por_aprobar');
            
          if (!countError) {
            setPendingCount(count || 0);
          }
        }
      } catch (err) {
        console.error("Error fetching pending count:", err);
      }
    };

    fetchPending();
    
    // Intervalo para refrescar badge cada 30s (polling ligero)
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [userData, selectedProject]);

  if (userData?.role && ROLES[userData.role]?.level >= 50) {
     sidebarItems.splice(1, 0, { 
       id: "solicitudes",
       label: "Solicitudes",
       icon: <MultiUsersIcon className="sidebar-action-icon" />, 
       path: "/solicitudes",
       badge: pendingCount // Pasamos el conteo aquí
     });
  }

  return (
    <div
      className={`main-layout ${
        isSidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      <Sidebar
        items={sidebarItems}
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        isMobile={isMobile}
      />

      <div className="main-content">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          isMobile={isMobile}
        />

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
