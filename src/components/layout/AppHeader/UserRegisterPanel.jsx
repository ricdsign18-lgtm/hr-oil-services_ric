// src/components/layout/AppHeader/UserRegisterPanel.jsx
import { AddIcon, OutIcon } from "../../../assets/icons/Icons";
import "./UserRegisterPanel.css";

export const UserRegisterPanel = ({ user, onLogout, onCreateUser, onManageUsers, onManagePermissions }) => {
  return (
    <div className="user-profile-panel">
      <div className="panel-header">
        <strong>{user?.username}</strong>
        <small>{user?.role}</small>
      </div>
      {(user?.role === "admin" || user?.role === "editor") && (
        <button className="panel-action-button" onClick={onCreateUser}>
          {/* Podríamos usar un ícono de "agregar usuario" aquí si lo tuviéramos */}
          <span>
            <AddIcon />
          </span>
          Crear Nuevo Usuario
        </button>
      )}
      {(user?.role === "admin" || user?.role === "editor") && (
        <button className="panel-action-button" onClick={onManageUsers}>
          <span>
            {/* Usamos un ícono genérico o uno específico si existe */}
            <AddIcon style={{ transform: "rotate(45deg)" }} /> 
          </span>
          Gestionar Usuarios
        </button>
      )}
      {(user?.role === "admin" || user?.role === "editor") && (
        <button className="panel-action-button" onClick={onManagePermissions}>
          <span>
            <AddIcon /> {/* Placeholder icon, maybe change to a lock or key icon later */}
          </span>
          Gestionar Permisos
        </button>
      )}
      <button className="logout-button" onClick={onLogout}>
        <OutIcon width={16} height={16} />
        Cerrar Sesión
      </button>
    </div>
  );
};
