import React, { useState, useEffect, useMemo } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import ModuleDescription from '../../../_core/ModuleDescription/ModuleDescription';
import { InfoIcon } from '../../../../../assets/icons/Icons';
import Modal from '../../../../common/Modal/Modal';
import './RequerimientosMain.css';
import { RequerimientosForm } from './RequerimientosForm';
import RequerimientosGroupList from './RequerimientosGroupList';

const RequerimientosMain = () => {
  const {
    getRequerimientos,
    loading,
    requerimientos,
    getLowStockItems
  } = useOperaciones();

  const { showToast } = useNotification();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const lowStockItems = useMemo(() => getLowStockItems ? getLowStockItems() : [], [getLowStockItems]);

  const handleUseSuggestion = (suggestion) => {
    showToast("Función de sugerencia pendiente de integración con el nuevo formulario", "info");
  };

  const getRequerimientoStats = () => {
    const stats = {
      total: 0,
      pendientes: 0,
      completados: 0,
      en_progreso: 0,
      cancelados: 0
    };

    requerimientos.forEach(req => {
      if (req.requerimiento_items && req.requerimiento_items.length > 0) {
        req.requerimiento_items.forEach(item => {
          stats.total++;
          if (item.status === 'pendiente') stats.pendientes++;
          if (item.status === 'completado') stats.completados++;
          if (item.status === 'en_progreso') stats.en_progreso++;
          if (item.status === 'cancelado') stats.cancelados++;
        });
      }
    });

    return stats;
  };

  const filteredRequerimientos = useMemo(() => {
    if (filterStatus === 'all') return requerimientos;

    return requerimientos.map(req => ({
      ...req,
      requerimiento_items: req.requerimiento_items?.filter(item => item.status === filterStatus) || []
    })).filter(req => req.requerimiento_items.length > 0);
  }, [requerimientos, filterStatus]);

  const handleDataChange = async () => {
    await getRequerimientos();
  };

  const stats = getRequerimientoStats();

  return (
    <div className="requerimientos-main">
      <ModuleDescription
        title="Gestión de Requerimientos"
        description="Registre y gestione los requerimientos de materiales para el proyecto."
        action={
          <button
            className="btn-info-circle"
            onClick={() => setShowInfoModal(true)}
            title="Ver información del módulo"
          >
            <InfoIcon />
          </button>
        }
      />

      <div className="requerimientos-stats">
        <div className="stat-card">
          <h4>Total Items</h4>
          <span className="stat-number">{stats.total}</span>
        </div>
        <div className="stat-card pending">
          <h4>Pendientes</h4>
          <span className="stat-number">{stats.pendientes}</span>
        </div>
        <div className="stat-card progress">
          <h4>En Progreso</h4>
          <span className="stat-number">{stats.en_progreso}</span>
        </div>
        <div className="stat-card completed">
          <h4>Completados</h4>
          <span className="stat-number">{stats.completados}</span>
        </div>
        <div className="stat-card canceled">
          <h4>Cancelados</h4>
          <span className="stat-number">{stats.cancelados}</span>
        </div>
      </div>

      {lowStockItems && lowStockItems.length > 0 && (
        <div className="suggestions-section">
          <h4>💡 Sugerencias de Requerimiento (por Bajo Stock)</h4>
          <div className="suggestions-list">
            {lowStockItems.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-item">
                <div className="suggestion-info">
                  <strong>{suggestion.nombre_producto}</strong>
                  <span> - Stock Actual: {suggestion.cantidad_disponible} {suggestion.unidad}</span>
                  <small> (Prioridad: {suggestion.prioridad}, Objetivo: {suggestion.stock_objetivo})</small>
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
        </div>
      )}

      <RequerimientosForm />

      <div className="filter-controls">
        <label>Filtrar por estado:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="en_progreso">En Progreso</option>
          <option value="completado">Completados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      <div className="requerimientos-list">
        <h3>Requerimientos Registrados</h3>
        <div className="total-amount-all">
          Monto Total de Todos los Requerimientos: ${
            filteredRequerimientos.reduce((acc, req) =>
              acc + req.requerimiento_items.reduce((acc, item) =>
                acc + (item.cantidad_requerida * item.precio_unitario_usd_aprox), 0), 0).toFixed(2)
          }
        </div>

        {loading && <div className="loading-state">Cargando requerimientos...</div>}

        {!loading && (!requerimientos || requerimientos.length === 0) && (
          <div className="empty-state">
            <p>No hay requerimientos registrados para este proyecto.</p>
          </div>
        )}

        {!loading && filteredRequerimientos && filteredRequerimientos.length > 0 && (
          <RequerimientosGroupList
            requerimientos={filteredRequerimientos}
            onDataChange={handleDataChange}
          />
        )}
      </div>

      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Información de Requerimientos"
      >
        <div className="modal-info-content">
          <p>Este módulo permite gestionar las solicitudes de materiales y servicios del proyecto.</p>

          <h3>Funcionalidades:</h3>
          <ul className="info-list">
            <li><strong>Registro:</strong> Cree nuevos requerimientos de materiales.</li>
            <li><strong>Seguimiento:</strong> Monitoree el estado de cada ítem (pendiente, comprado, etc.).</li>
            <li><strong>Edición:</strong> Edite items pendientes o agregue nuevos items a requerimientos existentes.</li>
            <li><strong>Sugerencias:</strong> Reciba alertas de stock bajo para reposición automática.</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default RequerimientosMain;
