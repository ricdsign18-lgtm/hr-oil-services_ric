import { useState } from "react";
import { useAuth } from "../../../../../../../../../../../../contexts/AuthContext"; // Import useAuth
import "./PersonalList.css";

const PersonalList = ({ employees, onEdit, onDelete, onStatusChange }) => {
  const { hasPermissionSync } = useAuth(); // Destructure hasPermissionSync
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);

  const handleDeleteClick = (employee) => {
    setDeleteConfirm(employee);
  };

  const confirmDelete = () => {
    onDelete(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleStatusClick = (employee) => {
    setStatusConfirm({
      employee,
      newStatus: employee.estado === "Inactivo" ? "Activo" : "Inactivo",
    });
  };

  const confirmStatusChange = () => {
    if (statusConfirm) {
      onStatusChange(statusConfirm.employee, statusConfirm.newStatus);
      setStatusConfirm(null);
    }
  };

  const cancelStatusChange = () => {
    setStatusConfirm(null);
  };

  const formatCurrency = (amount) => {
    return `$ ${parseFloat(amount || 0).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getDetallesSalario = (employee) => {
    if (
      employee.tipoNomina === "Ejecucion" ||
      employee.tipoNomina === "Administrativa"
    ) {
      return `Base: ${formatCurrency(employee.montoLey)} + Bono: ${formatCurrency(
        employee.bonificacionEmpresa
      )}`;
    }
    return null;
  };

  const getSalarioDisplay = (employee) => {
    if (
      employee.tipoNomina === "Ejecucion" ||
      employee.tipoNomina === "Administrativa"
    ) {
      const total =
        parseFloat(employee.montoLey || 0) +
        parseFloat(employee.bonificacionEmpresa || 0);
      return formatCurrency(total);
    }
    return formatCurrency(employee.montoSalario);
  };

  if (employees.length === 0) {
    return (
      <div className="empty-state-dark">
        <div className="empty-icon">👥</div>
        <h4>No hay personal registrado</h4>
        <p>Comienza agregando el primer empleado al sistema</p>
      </div>
    );
  }

  const getInitials = (nombre, apellido) => {
    return `${nombre?.charAt(0) || ""}${apellido?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <div className="personal-list-container">
      <div className="list-header">
        <span>Empleados Registrados: {employees.length}</span>
      </div>

      <div className="employees-grid">
        {employees.map((employee) => (
          <div key={employee.id} className={`employee-card-dark ${employee.estado === "Inactivo" ? "inactive-card" : ""}`}>
            <div className="card-header-compact">
              <div className="header-main">
                <div className="profile-section">
                  <div className="avatar-initials">
                    {getInitials(employee.nombre, employee.apellido)}
                  </div>
                  <div className="name-info">
                    <h4>{employee.nombre} {employee.apellido}</h4>
                    <span className="employee-id">C.I. {employee.cedula}</span>
                  </div>
                </div>
                {(hasPermissionSync("administracion", "write") || hasPermissionSync("administracion", "delete")) && (
                  <div className="actions-top">
                    {hasPermissionSync("administracion", "write") && (
                      <button className="icon-btn-edit" onClick={() => onEdit(employee)} title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                    )}
                    {hasPermissionSync("administracion", "delete") && (
                      <button className="icon-btn-delete" onClick={() => handleDeleteClick(employee)} title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="header-sub">
                <span className="role-badge">{employee.cargo}</span>
                <button
                  className={`status-text ${employee.estado === "Inactivo" ? "status-inactive" : "status-active"}`}
                  onClick={() => hasPermissionSync("administracion", "write") && handleStatusClick(employee)}
                  style={{ cursor: hasPermissionSync("administracion", "write") ? "pointer" : "default" }}
                >
                  {employee.estado || "Activo"}
                </button>
              </div>
            </div>

            <div className="card-body-compact">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Nómina</span>
                  <span className="value text-wrap">{employee.tipoNomina}</span>
                </div>
                <div className="info-item">
                  <span className="label">Frecuencia</span>
                  <span className="value">{employee.frecuenciaPago}</span>
                </div>
                <div className="info-item">
                  <span className="label">Salario ({employee.tipoSalario})</span>
                  <span className="value highlight">{getSalarioDisplay(employee)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Ingreso</span>
                  <span className="value">{new Date(employee.fechaIngreso + 'T00:00:00').toLocaleDateString()}</span>
                </div>
              </div>
              
              {getDetallesSalario(employee) && (
                <div className="salary-details-compact">
                  {getDetallesSalario(employee)}
                </div>
              )}

              {employee.estado === "Inactivo" && employee.fechaInactivo && (
                <div className="inactive-date-compact">
                  Inactivo: {new Date(employee.fechaInactivo + 'T00:00:00').toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modales (Delete / Status) */}
      {deleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h4>Confirmar Eliminación</h4>
            <p>
              ¿Estás seguro de que deseas eliminar al empleado{" "}
              <strong>
                {deleteConfirm.nombre} {deleteConfirm.apellido}
              </strong>
              ?
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelDelete}>
                Cancelar
              </button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {statusConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal status-modal">
            <h4>Confirmar Cambio de Estado</h4>
            <p>
              ¿Cambiar estado de <strong>{statusConfirm.employee.nombre}</strong> a{" "}
              <strong>{statusConfirm.newStatus}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelStatusChange}>
                Cancelar
              </button>
              <button
                className={`btn-confirm-status ${
                  statusConfirm.newStatus === "Activo"
                    ? "btn-activate"
                    : "btn-deactivate"
                }`}
                onClick={confirmStatusChange}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalList;
