import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ArrowIcon, ConfigIcon } from "../../../assets/icons/Icons.jsx";
import { OutIcon } from "../../../assets/icons/Icons.jsx";
import SidebarItem from "./SidebarItem";
import "./Sidebar.css";

const Sidebar = ({ items, isOpen, onToggle, isMobile }) => {
  const { hasPermissionSync, logout, userData: currentUser } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Lógica de filtrado ajustada según el rol del usuario
  const getMenuItems = () => {
    // Si no hay items o usuario, no mostrar nada.
    if (!items || !currentUser) return [];

    // Filtramos los módulos del proyecto según los permisos de lectura del usuario.
    return items
      ? items
          .filter((item) => hasPermissionSync(item.id, "read"))
          .map((item) => ({
            ...item,
            path: `/project/${projectId}${item.path}`,
          }))
      : [];
  };
  const filteredItems = getMenuItems();

  const handleOverlayClick = () => {
    onToggle(false);
  };

  const handleItemClick = () => {
    if (isMobile) {
      onToggle(false);
    }
  };

  const handleBackToProjects = () => {
    navigate("/");
    if (isMobile) {
      onToggle(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (isMobile) {
      onToggle(false);
    }
  };

  const handleOpenSidebar = () => {};

  return (
    <>
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={handleOverlayClick} />
      )}

      <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="sidebar-header-content">
              <img
                src="/logo-hyr.png"
                alt="H&R Oil Services"
                className="sidebar-logo"
              />
              <div className="sidebar-title-container">
                <h3 className="sidebar-title">H&R OS C.A.</h3>
                <p className="sidebar-subtitle">Sistema de Gestión</p>
              </div>
            </div>

            {isMobile && (
              <button
                className="sidebar-toggle"
                onClick={() => onToggle(false)}
                aria-label="Cerrar menú"
              >
                <div className="hamburger-icon">
                  <div className="hamburger-line"></div>
                  <div className="hamburger-line"></div>
                  <div className="hamburger-line"></div>
                </div>
              </button>
            )}
          </div>

          <nav className="sidebar-nav" aria-label="Navegación principal">
            <ul className="sidebar-menu">
              {filteredItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (location.pathname.startsWith(item.path) &&
                    item.path !== "/" &&
                    // Ensure we don't match if there's a longer matching path in the list
                    !filteredItems.some(
                      (otherItem) =>
                        otherItem.path.length > item.path.length &&
                        location.pathname.startsWith(otherItem.path)
                    ));

                return (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isActive={isActive}
                    onItemClick={handleItemClick}
                  />
                );
              })}

              {/* Admin Section */}
              {currentUser?.role === "editor" && (
                <SidebarItem
                  item={{
                    id: "permissions",
                    label: "Gestionar Permisos",
                    path: "/admin/permissions",
                    icon: <ConfigIcon />,
                  }}
                  isActive={location.pathname.startsWith("/admin/permissions")}
                  onItemClick={handleItemClick}
                />
              )}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <button
              className="sidebar-action-btn back-to-projects"
              onClick={handleBackToProjects}
            >
              <span className="sidebar-action-icon">
                <ArrowIcon className="sidebar-action-icon" />
              </span>
              <span className="sidebar-action-label">Volver a Proyectos</span>
            </button>

            <button
              className="sidebar-action-btn logout-btn"
              onClick={handleLogout}
            >
              <span className="sidebar-action-icon">
                <OutIcon className="sidebar-action-icon" />
              </span>
              <span className="sidebar-action-label">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* {isMobile && !isOpen && (
        <button
          className="sidebar-floating-toggle"
          onClick={() => onToggle(true)}
          aria-label="Abrir menú"
        >
          <div className="hamburger-icon">
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </div>
        </button>
      )} */}
    </>
  );
};

export default Sidebar;
