import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../contexts/PersonalContext";
import { useNotification } from "../../../../../../../../../../../contexts/NotificationContext";
import { useAuth } from "../../../../../../../../../../../contexts/AuthContext"; // Import useAuth
import ModuleDescription from "../../../../../../../../../_core/ModuleDescription/ModuleDescription";
import PersonalForm from "./components/PersonalForm";
import PersonalList from "./components/PersonalList";

import "./RegistroPersonalMain.css";

const RegistroPersonalMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();
  const { getEmployeesByProject, addEmployee, updateEmployee, deleteEmployee } =
    usePersonal();
  const { showToast } = useNotification();
  const { hasPermissionSync } = useAuth(); // Destructure hasPermissionSync

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ... (rest of the component logic remains the same until the button)

  // Cargar empleados del proyecto actual
  useEffect(() => {
    loadEmployees();
  }, [selectedProject?.id]);

  const loadEmployees = async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    try {
      const employeesData = await getEmployeesByProject(selectedProject.id);
      setEmployees(employeesData);
      setFilteredEmployees(employeesData);
    } catch (error) {
      console.error("Error cargando empleados:", error);
      showToast("Error al cargar empleados: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = employees.filter(
        (emp) =>
          emp.nombre.toLowerCase().includes(lowerTerm) ||
          emp.apellido.toLowerCase().includes(lowerTerm) ||
          emp.cedula.includes(lowerTerm)
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddEmployee = async (employeeData) => {
    if (!hasPermissionSync("administracion", "write")) {
      showToast("No tienes permisos para realizar esta acción", "error");
      return;
    }
    try {
      await addEmployee({
        ...employeeData,
        projectId: selectedProject?.id,
      });
      await loadEmployees(); // Recargar la lista
      setShowForm(false);
      showToast("Empleado agregado exitosamente", "success");
    } catch (error) {
      showToast("Error al agregar empleado: " + error.message, "error");
    }
  };

  const handleEditEmployee = async (employeeData) => {
    if (!hasPermissionSync("administracion", "write")) {
        showToast("No tienes permisos para realizar esta acción", "error");
        return;
    }
    try {
      await updateEmployee(editingEmployee.id, employeeData);
      await loadEmployees(); // Recargar la lista
      setEditingEmployee(null);
      setShowForm(false);
      showToast("Empleado actualizado exitosamente", "success");
    } catch (error) {
      showToast("Error al actualizar empleado: " + error.message, "error");
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!hasPermissionSync("administracion", "delete")) {
        showToast("No tienes permisos para realizar esta acción", "error");
        return;
    }
    if (window.confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
      try {
        await deleteEmployee(employeeId);
        await loadEmployees(); // Recargar la lista
        showToast("Empleado eliminado exitosamente", "success");
      } catch (error) {
        console.error("Error deleting employee:", error);
        showToast("Error al eliminar empleado: " + error.message, "error");
      }
    }
  };

  const handleEditClick = (employee) => {
    if (!hasPermissionSync("administracion", "write")) return;
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingEmployee(null);
    setShowForm(false);
  };

  const handleStatusChange = async (employee, newStatus) => {
    try {
      const updateData = {
        ...employee,
        estado: newStatus,
        fechaInactivo: newStatus === "Inactivo" ? new Date().toISOString().split('T')[0] : employee.fechaInactivo,
        fechaReactivacion: newStatus === "Activo" ? new Date().toISOString().split('T')[0] : employee.fechaReactivacion,
      };

      await updateEmployee(employee.id, updateData);
      await loadEmployees();
      showToast(`Estado actualizado a ${newStatus}`, "success");
    } catch (error) {
      showToast("Error al actualizar estado: " + error.message, "error");
    }
  };

  return (
    <div className="registro-personal-main">
      <div className="registro-header">
        <div className="header-title-row">
          <div>
            <h1>Registro</h1>
            <p className="subtitle">
              Gestión de personal -{" "}
              <span className="project-name">
                {selectedProject?.name || "Proyecto"}
              </span>
            </p>
          </div>
          <button className="back-button-outline" onClick={handleBack}>
            ← Volver a Nómina
          </button>
        </div>

        <div className="controls-row">
          <div className="search-container-dark">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="search-icon"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-dark"
              disabled={loading}
            />
          </div>
          {hasPermissionSync("administracion", "write") && (
            <button
              className="btn-new-employee"
              onClick={() => setShowForm(true)}
            >
              + Nuevo
            </button>
          )}
        </div>
      </div>

      <div className="module-content">
        {loading ? (
          <div className="loading-state">
            <p>Cargando empleados...</p>
          </div>
        ) : (
          <PersonalList
            employees={filteredEmployees}
            onEdit={handleEditClick}
            onDelete={handleDeleteEmployee}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {showForm && (
        <div className="custom-registro-modal-overlay">
          <div className="custom-registro-modal-content">
            <button className="custom-registro-modal-close-btn" onClick={handleCancelForm}>
              ×
            </button>
            <PersonalForm
              employee={editingEmployee}
              onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroPersonalMain;
