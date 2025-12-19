import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../../../contexts/AuthContext";
import "./ModulePage.css";

const ModulePage = ({
  children,
  moduleName,
  moduleDescription,
  moduleId,
  showSubRoutes = false,
  customContent = null,
}) => {
  
  const { hasPermissionSync } = useAuth();
  const hasAccess = hasPermissionSync(moduleId, "read");

  if (!hasAccess) {
    return (
      <div className="module-container">
        <div className="permission-denied">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder al módulo de {moduleName}.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (customContent) {
      return customContent;
    }

    if (showSubRoutes) {
      return (
        <Routes>
          <Route path="*" element={children} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      );
    }

    return children;
  };

  return (
    <div className="module-container">
      <div className="module-content">{renderContent()}</div>
    </div>
  );
};

export default ModulePage;
