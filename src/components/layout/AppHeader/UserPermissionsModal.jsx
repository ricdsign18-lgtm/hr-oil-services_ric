import { useState, useEffect } from "react";
import Modal from "../../common/Modal/Modal";
import supabase from "../../../api/supaBase";
import "./UserPermissionsModal.css";

const UserPermissionsModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("username");

      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    // Optimistic update
    const previousUsers = [...users];
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));

    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating role:", err);
      // Revert on error
      setUsers(previousUsers);
      alert("Error al actualizar el rol.");
    }
  };

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : "??";
  };

  const getRandomColor = (username) => {
    const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722'];
    let hash = 0;
    if (username) {
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Permisos">
      <div className="permissions-container">
        <div className="permissions-header">
          <div className="col-user">USUARIO</div>
          <div className="col-role-header admin">
            <span className="role-icon">🛡️</span> ADMIN
          </div>
          <div className="col-role-header editor">
            <span className="role-icon">✏️</span> EDITOR
          </div>
          <div className="col-role-header viewer">
            <span className="role-icon">👁️</span> VIEWER
          </div>
        </div>

        {loading && <p className="loading-text">Cargando usuarios...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="permissions-list">
            {users.map((user) => (
              <div key={user.id} className="permission-row">
                <div className="col-user-info">
                  <div className="user-avatar-small" style={{ backgroundColor: getRandomColor(user.username) }}>
                    {getInitials(user.username)}
                  </div>
                  <div className="user-details-small">
                    <span className="user-name-small">{user.username}</span>
                  </div>
                </div>

                <div className="col-role-toggle">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={user.role === 'admin'} 
                      onChange={() => handleRoleChange(user.id, 'admin')}
                    />
                    <span className="slider round admin-slider"></span>
                  </label>
                </div>

                <div className="col-role-toggle">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={user.role === 'editor'} 
                      onChange={() => handleRoleChange(user.id, 'editor')}
                    />
                    <span className="slider round editor-slider"></span>
                  </label>
                </div>

                <div className="col-role-toggle">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={user.role === 'viewer'} 
                      onChange={() => handleRoleChange(user.id, 'viewer')}
                    />
                    <span className="slider round viewer-slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserPermissionsModal;
