// src/components/layout/AppHeader/UserRegister.jsx
import Modal from "../../common/Modal/Modal";
import { useAuth } from "../../../contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import "./UserRegister.css";
import { UserIcon, OutIcon, ArrowDown } from "../../../assets/icons/Icons";
import { UserRegisterPanel } from "./UserRegisterPanel";
import UserManagementModal from "./UserManagementModal";
import UserPermissionsModal from "./UserPermissionsModal";
import bcrypt from "bcryptjs";
import supabase from "../../../api/supaBase";
import FeedbackModal from "../../common/FeedbackModal/FeedbackModal";
import { ROLES } from "../../../config/permissions"; // Importar configuración de roles

export const UserRegister = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageUsersModalOpen, setIsManageUsersModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { registerUser, userData: currentUser, logout } = useAuth();
  
  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [userData, setUserData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "", // Rol debe ser seleccionado explícitamente
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const panelRef = useRef(null);

  // Cierra el panel si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    
    // Determinar rol por defecto según quien crea
    let defaultRole = "";
    const myRole = currentUser?.role;

    if (myRole === "JEFE_ADMINISTRACION") defaultRole = "AUXILIAR_ADMINISTRACION";
    else if (myRole === "JEFE_OPERACIONES") defaultRole = "AUXILIAR_OPERACIONES";
    else if (myRole === "JEFE_CONTRATO") defaultRole = "AUXILIAR_CONTRATO";
    else if (myRole === "JEFE_COORDINACIONES") defaultRole = "AUXILIAR_COORDINACIONES";

    setUserData({ 
      username: "", 
      password: "", 
      confirmPassword: "", 
      role: defaultRole 
    });
    
    setShowPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserData({ username: "", password: "", confirmPassword: "", role: "" });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userData.username || !userData.password || !userData.confirmPassword || !userData.role) {
      setFeedback({
        isOpen: true,
        type: 'warning',
        title: 'Campos Incompletos',
        message: 'Por favor, completa todos los campos requeridos, incluyendo el cargo.'
      });
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Contraseñas No Coinciden',
        message: 'La contraseña y la confirmación deben ser iguales.'
      });
      return;
    }

    const passwordHashed = await bcrypt.hash(userData.password, 12);
    const payload = {
      username: userData.username,
      password: passwordHashed,
      role: userData.role,
    };

    console.log("Intentando crear usuario con payload:", payload);

    // 1. Insertar el usuario principal
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      console.error("Error detallado al crear usuario:", insertError);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error al Crear Usuario',
        message: `Detalle del error: ${insertError.message || 'Error desconocido'}`
      });
      return;
    }

    // 2. Asignación automática de jerarquía (Opción A)
    // El usuario que crea (Jefe) se asigna como supervisor del nuevo usuario.
    if (currentUser?.id && newUser?.id) {
      const { error: assignmentError } = await supabase
        .from("user_assignments")
        .insert({
          supervisor_id: currentUser.id,
          employee_id: newUser.id
        });

      if (assignmentError) {
        console.error("Error al asignar supervisor:", assignmentError);
        // Podríamos mostrar un warning, pero el usuario ya se creó.
      }
    }
    
    handleCloseModal();
    setFeedback({
      isOpen: true,
      type: 'success',
      title: 'Usuario Creado',
      message: `El usuario ${userData.username} ha sido creado y asignado a tu equipo exitosamente.`
    });
  };

  return (
    <div className="user-profile-container" ref={panelRef}>
      <button
        className="info-user-container"
        onClick={() => setIsPanelOpen((prev) => !prev)}
      >
        <div className="user-icon">
          <UserIcon className="user-icon-svg" />
        </div>
      </button>
      {isPanelOpen && (
        <UserRegisterPanel
          user={currentUser}
          onLogout={logout}
          onCreateUser={handleOpenModal}
          onManageUsers={() => setIsManageUsersModalOpen(true)}
          onManagePermissions={() => setIsPermissionsModalOpen(true)}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Crear Nuevo Usuario"
      >
        <form onSubmit={handleSubmit} className="user-register-form">
          <div className="form-group">
            <label htmlFor="username">Nombre de Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={userData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={userData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={userData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-btn"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="role">Cargo / Rol</label>
            {/* Lógica de Selección de Rol:
                - Si es Nivel 100 (Director/Admin): Puede elegir cualquier rol.
                - Si es Nivel 50 (Jefe): Se asigna automático su auxiliar y se muestra como texto fijo.
            */}
            {(ROLES[currentUser?.role]?.level >= 100) ? (
              <select
                name="role"
                id="role"
                value={userData.role}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar Cargo...</option>
                {Object.entries(ROLES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="fixed-role-display">
                <input 
                  type="hidden" 
                  name="role" 
                  value={userData.role} 
                />
                <span className="role-badge">
                  {ROLES[userData.role]?.label || "Asignando cargo..."}
                </span>
                <small className="role-helper-text">
                  * Como Jefe de Módulo, solo puedes crear personal auxiliar para tu área.
                </small>
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary">
            Crear Usuario
          </button>
        </form>
      </Modal>

      <UserManagementModal
        isOpen={isManageUsersModalOpen}
        onClose={() => setIsManageUsersModalOpen(false)}
      />

      <UserPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />

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
