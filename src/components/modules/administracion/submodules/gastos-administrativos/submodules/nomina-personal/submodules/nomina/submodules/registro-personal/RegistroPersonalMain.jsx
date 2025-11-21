

// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/registro-personal/RegistroPersonalMain.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../../../../../contexts/ProjectContext";
import { usePersonal } from "../../../../../../../../../../../contexts/PersonalContext";
import ModuleDescription from "../../../../../../../../../_core/ModuleDescription/ModuleDescription";
import PersonalForm from "./components/PersonalForm";
import PersonalList from "./components/PersonalList";
import "./RegistroPersonalMain.css";

const RegistroPersonalMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();
  const { getEmployeesByProject, addEmployee, updateEmployee, deleteEmployee, getPayrollSettings, updatePayrollSettings } =
    usePersonal();

  const [employees, setEmployees] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para configuración de nómina
  const [payrollSettings, setPayrollSettings] = useState({
    montoBaseIvss: 150,
    montoBaseParoForzoso: 150,
    montoBaseFaov: 1300,
    montoBaseIslr: 120,
  });
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Cargar empleados y configuración del proyecto actual
  useEffect(() => {
    loadEmployees();
    loadSettings();
  }, [selectedProject?.id]);

  const loadSettings = async () => {
    if (!selectedProject?.id) return;
    setLoadingSettings(true);
    try {
      const settings = await getPayrollSettings(selectedProject.id);
      if (settings) {
        setPayrollSettings(settings);
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadEmployees = async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    try {
      const employeesData = await getEmployeesByProject(selectedProject.id);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error cargando empleados:", error);
      alert("Error al cargar empleados: " + error.message);
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
      alert("Empleado agregado exitosamente");
    } catch (error) {
      alert("Error al agregar empleado: " + error.message);
    }
  };

  const handleEditEmployee = async (employeeData) => {
    try {
      await updateEmployee(editingEmployee.id, employeeData);
      await loadEmployees(); // Recargar la lista
      setEditingEmployee(null);
      setShowForm(false);
      alert("Empleado actualizado exitosamente");
    } catch (error) {
      alert("Error al actualizar empleado: " + error.message);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
      try {
        await deleteEmployee(employeeId);
        await loadEmployees(); // Recargar la lista
        alert("Empleado eliminado exitosamente");
      } catch (error) {
        alert("Error al eliminar empleado: " + error.message);
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

  // Handlers para configuración
  const handleEditSettings = () => {
    setTempSettings({ ...payrollSettings });
    setIsEditingSettings(true);
  };

  const handleCancelSettings = () => {
    setIsEditingSettings(false);
    setTempSettings({});
  };

  const handleSaveSettings = async () => {
    try {
      setLoadingSettings(true);
      const updated = await updatePayrollSettings(selectedProject.id, tempSettings);
      setPayrollSettings(updated);
      setIsEditingSettings(false);
    } catch (error) {
      console.error("Error guardando configuración:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setTempSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="registro-personal-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Nómina
      </button>

      <ModuleDescription
        title="Registro de Personal"
        description={`Gestión completa del registro y datos del personal - ${selectedProject?.name || ""
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

              {/* SECCIÓN DE CONFIGURACIÓN DE DEDUCCIONES */}
              <div className="payroll-settings-header">
                <div className="settings-title-row">
                  <h4>⚙️ Configuración Deducciones de Ley (Administrativa/Ejecución)</h4>
                  {!isEditingSettings ? (
                    <button
                      className="btn-edit-settings"
                      onClick={handleEditSettings}
                    >
                      ✏️ Editar Montos
                    </button>
                  ) : (
                    <div className="settings-actions">
                      <button
                        className="btn-cancel-settings"
                        onClick={handleCancelSettings}
                        disabled={loadingSettings}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn-save-settings"
                        onClick={handleSaveSettings}
                        disabled={loadingSettings}
                      >
                        {loadingSettings ? "Guardando..." : "💾 Guardar Cambios"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="settings-grid">
                  <div className="setting-item">
                    <label>Monto Base IVSS (Bs)</label>
                    {isEditingSettings ? (
                      <input
                        type="number"
                        name="montoBaseIvss"
                        value={tempSettings.montoBaseIvss}
                        onChange={handleSettingChange}
                        step="0.01"
                      />
                    ) : (
                      <span className="setting-value">{payrollSettings.montoBaseIvss} Bs</span>
                    )}
                  </div>
                  <div className="setting-item">
                    <label>Monto Base Paro Forzoso (Bs)</label>
                    {isEditingSettings ? (
                      <input
                        type="number"
                        name="montoBaseParoForzoso"
                        value={tempSettings.montoBaseParoForzoso}
                        onChange={handleSettingChange}
                        step="0.01"
                      />
                    ) : (
                      <span className="setting-value">{payrollSettings.montoBaseParoForzoso} Bs</span>
                    )}
                  </div>
                  <div className="setting-item">
                    <label>Monto Base FAOV (Bs)</label>
                    {isEditingSettings ? (
                      <input
                        type="number"
                        name="montoBaseFaov"
                        value={tempSettings.montoBaseFaov}
                        onChange={handleSettingChange}
                        step="0.01"
                      />
                    ) : (
                      <span className="setting-value">{payrollSettings.montoBaseFaov} Bs</span>
                    )}
                  </div>
                  <div className="setting-item">
                    <label>Monto Base ISLR (USD$)</label>
                    {isEditingSettings ? (
                      <input
                        type="number"
                        name="montoBaseIslr"
                        value={tempSettings.montoBaseIslr}
                        onChange={handleSettingChange}
                        step="0.01"
                      />
                    ) : (
                      <span className="setting-value usd">${payrollSettings.montoBaseIslr}</span>
                    )}
                  </div>
                </div>
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
