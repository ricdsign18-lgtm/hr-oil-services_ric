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

  // Efecto para consultar solicitudes pendientes (Solo Jefes de Operaciones)
  useEffect(() => {
    const fetchPending = async () => {
      // 1. Validación de Roles: Solo Operaciones puede ver esto
      // Si soy Admin (scope '*') o Consultor, NO debo ver estas notificaciones según requerimiento estricto.
      if (!userData?.role || !selectedProject) return;

      const userConfig = ROLES[userData.role];
      const isOperaciones = userConfig?.scope === "operaciones";

      if (!isOperaciones) {
        setPendingCount(0);
        return;
      }

      // Solo jefes o encargados (level >= 50) ven notificaciones de aprobación
      if ((userConfig?.level || 0) < 50) return;

      try {
        // 2. Obtener Jerarquía (Subordinados)
        // Consultamos a quién superviso para filtrar sus solicitudes
        const { data: staffData, error: staffError } = await supabase
          .from("user_assignments")
          .select("employee_id")
          .eq("supervisor_id", userData.id);

        const myStaffIds = staffData ? staffData.map((s) => s.employee_id) : [];
        const visibleUserIds = [userData.id, ...myStaffIds];

        // 3. Consultar Requerimientos FILTRADOS por Jerarquía
        const { data: reqs, error: reqError } = await supabase
          .from("requerimientos")
          .select("id")
          .eq("project_id", selectedProject.id)
          .in("user_id", visibleUserIds); // FILTRO CLAVE

        if (reqError || !reqs) return;

        const reqIds = reqs.map((r) => r.id);

        if (reqIds.length > 0) {
          const { data: items, error: countError } = await supabase
            .from("requerimiento_items")
            .select("requerimiento_id")
            .in("requerimiento_id", reqIds)
            .eq("status", "por_aprobar");

          if (!countError && items) {
            const uniqueReqs = new Set(items.map((i) => i.requerimiento_id));
            setPendingCount(uniqueReqs.size);
          } else {
            setPendingCount(0);
          }
        } else {
          setPendingCount(0);
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
      badge: pendingCount, // Pasamos el conteo aquí
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
