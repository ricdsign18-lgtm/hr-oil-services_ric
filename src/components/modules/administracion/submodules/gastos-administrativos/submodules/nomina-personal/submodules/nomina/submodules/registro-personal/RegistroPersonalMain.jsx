// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/registro-personal/RegistroPersonalMain.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../contexts/PersonalContext";
import { useNotification } from "../../../../../../../../../../../contexts/NotificationContext";
import ModuleDescription from "../../../../../../../../../_core/ModuleDescription/ModuleDescription";
import PersonalForm from "./components/PersonalForm";
import PersonalList from "./components/PersonalList";
import FeedbackModal from "../../../../../../../../../common/FeedbackModal/FeedbackModal";
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

  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

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

  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const handleAddEmployee = async (employeeData) => {
    try {
      await addEmployee({
        ...employeeData,
        projectId: selectedProject?.id,
      });
      await loadEmployees(); // Recargar la lista
      setShowForm(false);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Empleado Agregado',
        message: `El empleado ${employeeData.nombre} ${employeeData.apellido} ha sido registrado exitosamente.`
      });
    } catch (error) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Hubo un problema al registrar el empleado. ' + error.message
      });
    }
  };

  const handleEditEmployee = async (employeeData) => {
    try {
      await updateEmployee(editingEmployee.id, employeeData);
      await loadEmployees(); // Recargar la lista
      setEditingEmployee(null);
      setShowForm(false);
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Empleado Actualizado',
        message: `Los datos del empleado ${employeeData.nombre} ${employeeData.apellido} han sido actualizados.`
      });
    } catch (error) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Hubo un problema al actualizar el empleado. ' + error.message
      });
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
      try {
        await deleteEmployee(employeeId);
        await loadEmployees(); // Recargar la lista
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'Empleado Eliminado',
          message: 'El empleado ha sido eliminado exitosamente del sistema.'
        });
      } catch (error) {
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Hubo un problema al eliminar el empleado. ' + error.message
        });
      }
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

export default RegistroPersonalMain;
