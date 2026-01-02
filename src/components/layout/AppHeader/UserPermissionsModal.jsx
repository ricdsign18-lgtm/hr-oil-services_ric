import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Modal from "../../common/Modal/Modal";
import supabase from "../../../api/supaBase";
import { ROLES } from "../../../config/permissions";
import "./UserPermissionsModal.css";

const UserPermissionsModal = ({ isOpen, onClose }) => {
  const { userData: currentUser } = useAuth();
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
      // Verificar rol para definir el filtrado
      const isDirectorOrAdmin = currentUser?.role === 'DIRECTOR_GENERAL' || currentUser?.role === 'admin';
      
      let query = supabase.from("users").select("*");

      if (!isDirectorOrAdmin && currentUser?.id) {
        // Si es un Jefe de Módulo, solo ve a sus asignados
        const { data: assignments, error: assignmentError } = await supabase
           .from("user_assignments")
           .select("employee_id")
           .eq("supervisor_id", currentUser.id);

        if (assignmentError) throw assignmentError;

        const employeeIds = assignments.map(a => a.employee_id);
        
        if (employeeIds.length === 0) {
            setUsers([]);
            return;
        }

        query = query.in('id', employeeIds);
      }

      const { data, error } = await query.order("username");

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
          <div className="col-role-header">
            <span className="role-icon">📋</span> CARGO / ROL
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

                <div className="col-role-select">
                  <select 
                    className="role-select"
                    value={user.role || ""} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="" disabled>Sin Rol Asignado</option>
                    {Object.entries(ROLES).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
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
