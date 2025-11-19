import { useProjects } from "../../../contexts/ProjectContext";
import { Notification } from "./Notification";
import { UserRegister } from "./UserRegister";
import { useAuth } from "../../../contexts/AuthContext";

import { MenuIcon } from "../../../assets/icons/Icons";
import "./Header.css";

export const Header = ({ isSidebarOpen, onToggleSidebar, isMobile }) => {
  const { selectedProject } = useProjects();
  const { userData } = useAuth();
  const handleSidebar = () => {
    // Llama a la función para alternar el estado de la sidebar
    onToggleSidebar();
  };

  return (
    <header className="app-header">
      <article className="sidebar-content-header">
        {isMobile && (
          <button className="sidebar-toggle-button" onClick={handleSidebar}>
            <MenuIcon />
          </button>
        )}
      </article>
      <article className="info-users">
        <h2 className="info-welcome">Bienvenido, {userData.username}</h2>
        <h2 className="project-title">
          {isMobile
            ? `${selectedProject?.name || "No seleccionado"}`
            : `Proyecto: ${selectedProject?.name || "No seleccionado"}`}
        </h2>
      </article>
      <div className="header-actions">
        <Notification />
        <UserRegister />
      </div>
    </header>
  );
};
