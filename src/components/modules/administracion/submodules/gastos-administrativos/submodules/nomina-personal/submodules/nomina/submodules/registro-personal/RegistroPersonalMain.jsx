// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/registro-personal/RegistroPersonalMain.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../contexts/PersonalContext";
import { useNotification } from "../../../../../../../../../../../contexts/NotificationContext";
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

  const [employees, setEmployees] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);



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
    } catch (error) {
      console.error("Error cargando empleados:", error);
      showToast("Error al cargar empleados: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };



  const handleAddEmployee = async (employeeData) => {
    try {
      await addEmployee({
        ...employeeData,
        projectId: selectedProject?.id,
      });
      await loadEmployees(); // Recargar la lista
      setShowForm(false);

    } catch (error) {

    }
  };

  const handleEditEmployee = async (employeeData) => {
    try {
      await updateEmployee(editingEmployee.id, employeeData);
      await loadEmployees(); // Recargar la lista
      setEditingEmployee(null);
      setShowForm(false);

    } catch (error) {

    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    try {
      await deleteEmployee(employeeId);
      await loadEmployees(); // Recargar la lista
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleEditClick = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingEmployee(null);
    setShowForm(false);
  };

  return (
    <div className="registro-personal-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Nómina
      </button>

      <ModuleDescription
        title="Registro de Personal"
        description={`Gestión completa del registro y datos del personal - ${
          selectedProject?.name || ""
        }`}
      />

      <div className="module-content">
        {showForm ? (
          <PersonalForm
            employee={editingEmployee}
            onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
            onCancel={handleCancelForm}
          />
        ) : (
          <>
            <div className="content-header">
              <div className="header-actions">
                <h3>Lista de Personal Registrado</h3>
                <button
                // modificar al poner mejor los botones
                  className="btn-personal"
                  onClick={() => setShowForm(true)}
                  disabled={loading}
                >
                  {loading ? "Cargando..." : "+ Nuevo Empleado"}
                </button>
              </div>
              <p>Gestión integral de la información del personal</p>
            </div>

            {loading ? (
              <div className="loading-state">
                <p>Cargando empleados...</p>
              </div>
            ) : (
              <PersonalList
                employees={employees}
                onEdit={handleEditClick}
                onDelete={handleDeleteEmployee}
              />
            )}
          </>
        )}
      </div>


    </div>
  );
};

export default RegistroPersonalMain;
