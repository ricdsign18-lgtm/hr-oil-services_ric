// src/components/layout/AppHeader/UserRegister.jsx
import Modal from "../../common/Modal/Modal";
import { useAuth } from "../../../contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import "./UserRegister.css";
import { UserIcon, OutIcon, ArrowDown } from "../../../assets/icons/Icons";
import { UserRegisterPanel } from "./UserRegisterPanel";
import bcrypt from "bcryptjs";
import supabase from "../../../api/supaBase";

export const UserRegister = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { registerUser, userData: currentUser, logout } = useAuth();
  const [userData, setUserData] = useState({
    username: "",
    password: "",
    role: "viewer", // Rol por defecto
  });

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

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserData({ username: "", password: "", role: "viewer" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordHashed = await bcrypt.hash(userData.password, 12);
    if (!userData.username || !userData.password) {
      alert("Por favor, completa el nombre de usuario y la contraseña.");
      return;
    }
    const { error } = await supabase.from("users").insert({
      username: userData.username,
      password: passwordHashed,
      role: userData.role,
    });

    if (error) {
      alert("Error");
      return;
    }
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
            <input
              type="password"
              id="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Rol</label>
            <select
              name="role"
              id="role"
              value={userData.role}
              onChange={handleChange}
            >
              <option value="viewer">Lector (Viewer)</option>
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Crear Usuario
          </button>
        </form>
      </Modal>
    </div>
  );
};
