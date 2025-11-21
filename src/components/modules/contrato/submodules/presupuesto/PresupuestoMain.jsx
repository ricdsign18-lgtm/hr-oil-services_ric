import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../contexts/ProjectContext";
import { useBudget } from "../../../../../contexts/BudgetContext"; // NUEVO
import { useNotification } from "../../../../../contexts/NotificationContext"; // NUEVO
import ModuleDescription from "../../../_core/ModuleDescription/ModuleDescription";
import PresupuestoForm from "./components/PresupuestoForm";
import ItemsTable from "./components/ItemsTable";
import ResumenPresupuesto from "./components/ResumenPresupuesto";
import AvancePresupuesto from "./components/AvancePresupuesto";
import "./PresupuestoMain.css";

const PresupuestoMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();
  const { showToast } = useNotification();
  const {
    budget,
    loading,
    error,
    saveBudget,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    finalizeBudget,
    resetBudget,
  } = useBudget(); // NUEVO

  const [currentStep, setCurrentStep] = useState("formulario");

  useEffect(() => {
    // Determinar el paso actual basado en el presupuesto cargado
    if (budget) {
      if (budget.contratoNumero && budget.items.length > 0) {
        setCurrentStep("items");
      } else if (budget.contratoNumero) {
        setCurrentStep("items");
      }
    }
  }, [budget]);

  const handleBack = () => {
    navigate("../../../contrato");
  };

  const handleContratoSubmit = async (contratoData) => {
    const budgetData = {
      ...contratoData,
      items: budget?.items || [],
      estado: "borrador",
    };

    const result = await saveBudget(budgetData);
    if (result.success) {
      setCurrentStep("items");
    } else {
      showToast("Error al guardar el contrato: " + result.error, "error");
    }
  };

  const handleAddItem = async (itemData) => {
    const result = await addBudgetItem(itemData);
    if (!result.success) {
      showToast("Error al agregar el ítem: " + result.error, "error");
    }
  };

  const handleEditItem = async (itemId, itemData) => {
    const result = await updateBudgetItem(itemId, itemData);
    if (!result.success) {
      showToast("Error al actualizar el ítem: " + result.error, "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
    const result = await deleteBudgetItem(itemId);
    if (!result.success) {
      showToast("Error al eliminar el ítem: " + result.error, "error");
    }
  };

  const handleFinalizarPresupuesto = async () => {
    const result = await finalizeBudget();
    if (result.success) {
      showToast("✅ Presupuesto finalizado exitosamente", "success");
    } else {
      showToast("Error al finalizar el presupuesto: " + result.error, "error");
    }
  };

  const handleReiniciar = async () => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas reiniciar todo el presupuesto?"
      )
    ) {
      await resetBudget();
      setCurrentStep("formulario");
    }
  };

  if (loading) {
    return (
      <div className="presupuesto-main">
        <div className="loading-state">
          <p>Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="presupuesto-main">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="presupuesto-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Contrato
      </button>

      <ModuleDescription
        title="Presupuesto de Contrato"
        description={`Creación y gestión del presupuesto del contrato - ${
          selectedProject?.name || ""
        }`}
      />

      <div className="steps-indicator">
        <div
          className={`step ${currentStep === "formulario" ? "active" : ""} ${
            budget?.contratoNumero ? "completed" : ""
          }`}
        >
          <div className="step-number">1</div>
          <div className="step-label">Datos del Contrato</div>
        </div>
        <div
          className={`step ${currentStep === "items" ? "active" : ""} ${
            budget?.items?.length > 0 ? "completed" : ""
          }`}
        >
          <div className="step-number">2</div>
          <div className="step-label">Agregar Ítems</div>
        </div>
      </div>

      <div className="presupuesto-content">
        {currentStep === "formulario" && (
          <PresupuestoForm
            presupuesto={budget || {}}
            onSubmit={handleContratoSubmit}
            onCancel={handleBack}
          />
        )}

        {currentStep === "items" && (
          <div className="items-section">
            <div className="section-header">
              <h3>Presupuesto del Contrato</h3>
              <div className="contrato-info">
                <strong>Contrato:</strong> {budget?.contratoNumero}
                {budget?.nombreContrato && ` - ${budget.nombreContrato}`}
              </div>
            </div>

            <PresupuestoForm
              presupuesto={budget || {}}
              onSubmit={handleContratoSubmit}
              onCancel={() => setCurrentStep("formulario")}
              showItemsForm={true}
              onAddItem={handleAddItem}
            />

            {budget?.items && budget.items.length > 0 && (
              <>
                <ItemsTable
                  items={budget.items}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                />

                <ResumenPresupuesto totales={budget} />
                <AvancePresupuesto
                  presupuestoData={budget}
                  projectId={selectedProject?.id}
                />

                <div className="actions-section">
                  <button
                    className="btn-primary large"
                    onClick={handleFinalizarPresupuesto}
                    disabled={budget.estado === "finalizado"}
                  >
                    {budget.estado === "finalizado"
                      ? "✅ Finalizado"
                      : "✅ Finalizar Presupuesto"}
                  </button>
                  <button className="btn-outline" onClick={handleReiniciar}>
                    🔄 Reiniciar Todo
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresupuestoMain;