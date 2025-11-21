import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../contexts/ProjectContext";
import { useBudget } from "../../../../../contexts/BudgetContext";
import { useValuation } from "../../../../../contexts/ValuationContext"; // NUEVO
import { useCurrency } from "../../../../../contexts/CurrencyContext";
import { useNotification } from "../../../../../contexts/NotificationContext"; // NUEVO
import { getMainCurrency } from "../../../../../utils/mainCurrency";

import ModuleDescription from "../../../_core/ModuleDescription/ModuleDescription";
import ValuacionForm from "./components/ValuacionForm";
import ValuacionesList from "./components/ValuacionesList";
import ValuacionDetail from "./components/ValuacionDetail";

import "./ValuacionesMain.css";

const ValuacionesMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();
  const { showToast } = useNotification();

  //TODO: A partir de aqui agarramos para la logica del tipo de moneda, se hace poniendo el contexto de moneda

  //*budet:presupuestoData lo que hace es proporcionar el presupuesto actual y su moneda
  //TODO: Para manejar la moneda del proyecto en el que estamos trabajando solo necesitamos el contexto de moneda
  //TODO: Se utiliza budget y con getMainCurrency se calcula cada vez el tipo de moneda que utiliza basandose en el tipo que predomina como correcion el tipo de moneda predominante se deberia de guardar en algun lado para poder acceder a ella facilmente y evitar el recalculo de cada vez que necesitemos esa info*/

  const { budget: presupuestoData } = useBudget(); // NUEVO: usar BudgetContext
  const {
    valuations,
    loading,
    error,
    saveValuation,
    deleteValuation,
    getNextValuationNumber,
  } = useValuation(); // NUEVO

  const { formatCurrency } = useCurrency();
  const mainCurrency = getMainCurrency(presupuestoData);

  const [currentView, setCurrentView] = useState("list");
  const [selectedValuacion, setSelectedValuacion] = useState(null);

  // Cargar datos al iniciar (ahora se hace automáticamente en el context)
  useEffect(() => {
    if (!presupuestoData) {
      console.log("No hay presupuesto cargado");
    }
  }, [presupuestoData]);

  const handleBack = () => {
    navigate("../../../contrato");
  };

  const handleCreateValuacion = () => {
    if (!presupuestoData || presupuestoData.items.length === 0) {
      showToast("No hay presupuesto cargado. Debes crear un presupuesto primero.", "warning");
      return;
    }
    setSelectedValuacion(null);
    setCurrentView("create");
  };

  const handleSaveValuacion = async (valuacionData) => {
    const isEditing = !!selectedValuacion;
    const result = await saveValuation(valuacionData);

    if (result.success) {
      setCurrentView("list");
      showToast(
        `✅ Valuación ${isEditing ? "actualizada" : "guardada"} exitosamente`,
        "success"
      );
    } else {
      showToast(`Error al guardar la valuación: ${result.error}`, "error");
    }
  };

  const handleViewValuacion = (valuacion) => {
    setSelectedValuacion(valuacion);
    setCurrentView("detail");
  };

  const handleEditValuacion = (valuacion) => {
    setSelectedValuacion(valuacion);
    setCurrentView("create");
  };

  const handleDeleteValuacion = async (valuacionId) => {
    if (
      !window.confirm("¿Estás seguro de que deseas eliminar esta valuación?")
    ) {
      return;
    }

    const result = await deleteValuation(valuacionId);

    if (result.success) {
      if (selectedValuacion?.id === valuacionId) {
        setSelectedValuacion(null);
        setCurrentView("list");
      }
      showToast("✅ Valuación eliminada exitosamente", "success");
    } else {
      showToast(`Error al eliminar la valuación: ${result.error}`, "error");
    }
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedValuacion(null);
  };

  // Calcular total acumulado de todas las valuaciones
  const calcularTotalAcumulado = () => {
    return valuations.reduce((total, valuacion) => {
      return total + (valuacion.totales?.total || 0);
    }, 0);
  };

  const totalAcumulado = calcularTotalAcumulado();

  if (loading) {
    return (
      <div className="valuaciones-main">
        <div className="loading-state">
          <p>Cargando valuaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="valuaciones-main">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="valuaciones-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Contrato
      </button>

      <ModuleDescription
        title="Valuaciones de Obra"
        description={`Seguimiento y control de ejecución de partidas presupuestarias - ${
          selectedProject?.name || ""
        }`}
      />

      {/* Información del contrato */}
      {presupuestoData && (
        <div className="contrato-info-card">
          <div className="contrato-header">
            <h4>Información del Contrato</h4>
          </div>
          <div className="contrato-details">
            <div className="contrato-field">
              <label>Contrato N°:</label>
              <span>{presupuestoData.contratoNumero}</span>
            </div>
            <div className="contrato-field">
              <label>Descripción:</label>
              <span>{presupuestoData.nombreContrato}</span>
            </div>
            <div className="contrato-field">
              <label>Partidas en Presupuesto:</label>
              <span>{presupuestoData.items?.length || 0} ítems</span>
            </div>

            <div className="contrato-field">
              <label>Total Acumulado Valuado:</label>
              <span className="total-acumulado">
                {formatCurrency(totalAcumulado, mainCurrency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal según la vista */}
      <div className="valuaciones-content">
        {currentView === "list" && (
          <ValuacionesList
            valuaciones={valuations}
            presupuestoData={presupuestoData}
            onCreateValuacion={handleCreateValuacion}
            onViewValuacion={handleViewValuacion}
            onEditValuacion={handleEditValuacion}
            onDeleteValuacion={handleDeleteValuacion}
          />
        )}

        {currentView === "create" && (
          <ValuacionForm
            presupuestoData={presupuestoData}
            valuacionEdit={selectedValuacion}
            nextValuationNumber={getNextValuationNumber()}
            onSave={handleSaveValuacion}
            onCancel={handleBackToList}
          />
        )}

        {currentView === "detail" && selectedValuacion && (
          <ValuacionDetail
            valuacion={selectedValuacion}
            presupuestoData={presupuestoData}
            onEdit={() => handleEditValuacion(selectedValuacion)}
            onDelete={() => handleDeleteValuacion(selectedValuacion.id)}
            onBack={handleBackToList}
          />
        )}
      </div>

      {!presupuestoData && (
        <div className="no-presupuesto-warning">
          <div className="warning-icon">⚠️</div>
          <h4>No hay presupuesto cargado</h4>
          <p>
            Para crear valuaciones, primero debes crear un presupuesto en el
            módulo de Presupuesto.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate("../presupuesto")}
          >
            Ir a Presupuesto
          </button>
        </div>
      )}
    </div>
  );
};

export default ValuacionesMain;
