import React, { useState, useEffect, useMemo } from "react";
import { useOperaciones } from "../../../../../contexts/OperacionesContext";
import { useNotification } from "../../../../../contexts/NotificationContext.jsx";
import { useAuth } from "../../../../../contexts/AuthContext"; // Importar Auth
import { ROLES } from "../../../../../config/permissions"; // Importar ROLES
import ModuleDescription from "../../../_core/ModuleDescription/ModuleDescription";
import Modal from "../../../../common/Modal/Modal";
import StatsCard from "../../../../common/StatsCard/StatsCard";

import "./RequerimientosMain.css";
import { RequerimientosForm } from "./RequerimientosForm";
import RequerimientosGroupList from "./RequerimientosGroupList";

const RequerimientosMain = () => {
  const {
    getRequerimientos,
    loading,
    requerimientos,
    cancelRequerimientoItem,
    approveRequerimientoItem,
    rejectRequerimientoItem,
    getLowStockItems,
    addRequerimientoItem,
    updateRequerimientoItem,
  } = useOperaciones();

  const { userData: user } = useAuth();

  const { showToast } = useNotification();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [suggestionToFill, setSuggestionToFill] = useState(null);

  const lowStockItems = useMemo(
    () => (getLowStockItems ? getLowStockItems() : []),
    [getLowStockItems],
  );

  const handleUseSuggestion = (suggestion) => {
    setSuggestionToFill({ ...suggestion, _timestamp: Date.now() });

    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Cargando sugerencia en el formulario...", "info");
  };

  const getRequerimientoStats = () => {
    const stats = {
      total: 0,
      pendientes: 0,
      completados: 0,
      en_progreso: 0,
      cancelados: 0,
      por_aprobar: 0,
    };

    requerimientos.forEach((req) => {
      if (req.requerimiento_items && req.requerimiento_items.length > 0) {
        req.requerimiento_items.forEach((item) => {
          stats.total++;
          if (item.status === "pendiente") stats.pendientes++;
          if (item.status === "completado") stats.completados++;
          if (item.status === "en_progreso") stats.en_progreso++;
          if (item.status === "cancelado") stats.cancelados++;
          if (item.status === "por_aprobar") stats.por_aprobar++;
        });
      }
    });

    return stats;
  };

  const filteredRequerimientos = useMemo(() => {
    if (filterStatus === "all") return requerimientos;

    return requerimientos
      .map((req) => ({
        ...req,
        requerimiento_items:
          req.requerimiento_items?.filter(
            (item) => item.status === filterStatus,
          ) || [],
      }))
      .filter((req) => req.requerimiento_items.length > 0);
  }, [requerimientos, filterStatus]);

  const handleDataChange = async () => {
    await getRequerimientos();
  };

  const stats = getRequerimientoStats();

  return (
    <main className="requerimientos-main">
      <ModuleDescription
        title="Gestión de Requerimientos"
        description="Registre y gestione los requerimientos de materiales para el proyecto."
      />

      <section className="requerimientos-stats">
        <StatsCard title="Total Items" value={stats.total} variant="primary" />
        <StatsCard
          title="Por Aprobar"
          value={stats.por_aprobar}
          variant="warning"
        />
        <StatsCard
          title="Pendientes"
          value={stats.pendientes}
          variant="pending"
        />
        <StatsCard
          title="En Progreso"
          value={stats.en_progreso}
          variant="info"
        />
        <StatsCard
          title="Completados"
          value={stats.completados}
          variant="success"
        />
      </section>

      {lowStockItems && lowStockItems.length > 0 && (
        <section className="suggestions-section">
          <h4>💡 Sugerencias de Requerimiento (por Bajo Stock)</h4>
          <div className="suggestions-list">
            {lowStockItems.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-item">
                <div className="suggestion-info">
                  <strong>{suggestion.nombre_producto}</strong>
                  <span>
                    {" "}
                    - Stock Actual: {suggestion.cantidad_disponible}{" "}
                    {suggestion.unidad}
                  </span>
                  <small>
                    {" "}
                    (Prioridad: {suggestion.prioridad}, Objetivo:{" "}
                    {suggestion.stock_objetivo})
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => handleUseSuggestion(suggestion)}
                  className="btn-use-suggestion"
                >
                  Requerir
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <RequerimientosForm prefilledProduct={suggestionToFill} />

      <div className="filter-controls">
        <label>Filtrar por estado:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="por_aprobar">Por Aprobar</option>
          <option value="pendiente">Pendientes</option>
          <option value="en_progreso">En Progreso</option>
          <option value="completado">Completados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      <div className="requerimientos-list">
        <h3>Requerimientos Registrados</h3>
        <div className="total-amount-all" style={{ color: "#fff" }}>
          Monto Total de Todos los Requerimientos: $
          {filteredRequerimientos
            .reduce(
              (acc, req) =>
                acc +
                req.requerimiento_items.reduce(
                  (acc, item) =>
                    acc +
                    item.cantidad_requerida * item.precio_unitario_usd_aprox,
                  0,
                ),
              0,
            )
            .toFixed(2)}
        </div>

        {loading && (
          <div className="loading-state">Cargando requerimientos...</div>
        )}

        {!loading && (!requerimientos || requerimientos.length === 0) && (
          <div className="empty-state">
            <p>No hay requerimientos registrados para este proyecto.</p>
          </div>
        )}

        {!loading &&
          filteredRequerimientos &&
          filteredRequerimientos.length > 0 && (
            <RequerimientosGroupList
              requerimientos={filteredRequerimientos}
              onDataChange={handleDataChange}
              user={user}
            />
          )}
      </div>

      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Información de Requerimientos"
      >
        <div className="modal-info-content">
          <p>
            Este módulo permite gestionar las solicitudes de materiales y
            servicios del proyecto.
          </p>

          <h3>Funcionalidades:</h3>
          <ul className="info-list">
            <li>
              <strong>Registro:</strong> Cree nuevos requerimientos de
              materiales.
            </li>
            <li>
              <strong>Seguimiento:</strong> Monitoree el estado de cada ítem
              (pendiente, comprado, etc.).
            </li>
            <li>
              <strong>Edición:</strong> Edite items pendientes o agregue nuevos
              items a requerimientos existentes.
            </li>
            <li>
              <strong>Sugerencias:</strong> Reciba alertas de stock bajo para
              reposición automática.
            </li>
          </ul>
        </div>
      </Modal>
    </main>
  );
};

export default RequerimientosMain;
