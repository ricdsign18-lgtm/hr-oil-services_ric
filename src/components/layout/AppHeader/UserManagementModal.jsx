import { useState, useEffect, useRef } from "react";
import Modal from "../../common/Modal/Modal";
import supabase from "../../../api/supaBase";
import { DelateIcon, MoreVerticalIcon } from "../../../assets/icons/Icons";
import "./UserManagementModal.css";

const UserManagementModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuUserId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${username}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      // Actualizar la lista localmente
      setUsers(users.filter((user) => user.id !== userId));
      setActiveMenuUserId(null); // Close menu
      alert("Usuario eliminado correctamente.");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Error al eliminar el usuario.");
    }
  };

  const toggleMenu = (userId, e) => {
    e.stopPropagation();
    setActiveMenuUserId(activeMenuUserId === userId ? null : userId);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getRandomColor = (username) => {
    const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'editor': return 'Editor';
      default: return 'Viewer';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gestión de Usuarios`}>
       <div className="modal-subtitle">{users.length} usuarios activos</div>
      <div className="user-management-container">
        <div className="search-bar-container">
            <input 
                type="text" 
                placeholder="Buscar usuario..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="user-search-input"
            />
        </div>

        {loading && <p>Cargando usuarios...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!loading && !error && (
          <div className="users-list-container">
            <div className="users-list-header">
              <span>USUARIO</span>
            </div>
            <div className="users-list">
              {filteredUsers.map((user) => (
                <div key={user.id} className="user-row">
                  <div className="user-info-cell">
                    <div className="user-avatar" style={{ backgroundColor: getRandomColor(user.username) }}>
                      {getInitials(user.username)}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{user.username}</span>
                      <span className="user-role-text">{getRoleLabel(user.role)}</span>
                    </div>
                  </div>
                  
                  <div className="user-actions-cell">
                    <button
                      className="more-options-btn"
                      onClick={(e) => toggleMenu(user.id, e)}
                      title="Más opciones"
                    >
                      <MoreVerticalIcon width={20} height={20} />
                    </button>
                    
                    {activeMenuUserId === user.id && (
                      <div className="user-action-menu" ref={menuRef}>
                        <button 
                          className="menu-item delete"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                        >
                          <DelateIcon width={16} height={16} />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="no-users-message">
                  No se encontraron usuarios.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserManagementModal;
