import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useProjects } from "../../../contexts/ProjectContext";
import { DashboarddIcon } from "/src/assets/icons/Icons.jsx";
import { PortfolioIcon } from "/src/assets/icons/Icons.jsx";
import { AgreementIcon } from "/src/assets/icons/Icons.jsx";
import { ConfigIcon } from "/src/assets/icons/Icons.jsx";
import { ContractIcon } from "/src/assets/icons/Icons.jsx";
import Sidebar from "../../common/Sidebar/Sidebar";
// import AppHeader from "../AppHeader/AppHeader";
import { Header } from "../AppHeader/Header";

import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const { user } = useAuth();
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
