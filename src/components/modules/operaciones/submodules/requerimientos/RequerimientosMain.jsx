import React, { useState, useEffect, useMemo } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import ModuleDescription from '../../../_core/ModuleDescription/ModuleDescription';
import { InfoIcon, EditIcon, SaveIcon, CancelIcon, PlusIcon } from '../../../../../assets/icons/Icons'; // Assuming these icons exist or will be replaced by text/generic
import Modal from '../../../../common/Modal/Modal';
import './RequerimientosMain.css';
import { RequerimientosForm } from './RequerimientosForm';

const RequerimientosMain = () => {
  const {
    addRequerimiento,
    loading,
    productos,
    requerimientos,
    cancelRequerimientoItem,
    getLowStockItems,
    addRequerimientoItem,
    updateRequerimientoItem
  } = useOperaciones();

  const { showToast } = useNotification();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // State for Editing Item
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemData, setEditItemData] = useState({});

  // State for Adding NEW Item to a Requirement Group
  const [addingItemToReqId, setAddingItemToReqId] = useState(null);
  const [newItemData, setNewItemData] = useState({
    nombre_producto: '',
    categoria_producto: '',
    unidad: '',
    cantidad_requerida: '',
    precio_unitario_usd_aprox: '',
    monto_dolares_aprox: ''
  });

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


  // --- Handlers for Editing ---
  const handleEditClick = (item) => {
    setEditingItemId(item.id);
    setEditItemData({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemData({});
  };

  const handleSaveEdit = async () => {
    // Validate
    if (!editItemData.cantidad_requerida || editItemData.cantidad_requerida <= 0) {
      showToast("La cantidad requerida debe ser mayor a 0", "warning");
      return;
    }
    if (!editItemData.nombre_producto) {
      showToast("El nombre del producto es obligatorio", "warning");
      return;
    }

    await updateRequerimientoItem(editItemData.id, {
      nombre_producto: editItemData.nombre_producto,
      categoria_producto: editItemData.categoria_producto,
      unidad: editItemData.unidad,
      cantidad_requerida: editItemData.cantidad_requerida,
      precio_unitario_usd_aprox: editItemData.precio_unitario_usd_aprox,
    });
    showToast("Item actualizado correctamente", "success");
    setEditingItemId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...editItemData, [name]: value };

    // If product name changes, maybe auto-fill category/unit if it matches a known product?
    // Optional: keep it simple for now, or add that logic.
    // Let's add simple auto-fill if they pick a known product from list
    if (name === 'nombre_producto' && productos) {
      const selectedProduct = productos.find(p => p.nombre_producto === value);
      if (selectedProduct) {
        updatedData.categoria_producto = selectedProduct.categoria_producto;
        updatedData.unidad = selectedProduct.unidad;
      }
    }

    setEditItemData(updatedData);
  };


  // --- Handlers for Adding New Item to Group ---
  const handleStartAdd = (reqId) => {
    setAddingItemToReqId(reqId);
    setNewItemData({
      nombre_producto: '',
      categoria_producto: '',
      unidad: '',
      cantidad_requerida: '',
      precio_unitario_usd_aprox: '',
      monto_dolares_aprox: ''
    });
  };

  const handleCancelAdd = () => {
    setAddingItemToReqId(null);
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    const updatedItem = { ...newItemData, [name]: value };

    // Auto-calc total
    if (name === 'cantidad_requerida' || name === 'precio_unitario_usd_aprox') {
      const cantidad = name === 'cantidad_requerida' ? parseFloat(value) : parseFloat(updatedItem.cantidad_requerida) || 0;
      const precio = name === 'precio_unitario_usd_aprox' ? parseFloat(value) : parseFloat(updatedItem.precio_unitario_usd_aprox) || 0;
      updatedItem.monto_dolares_aprox = (cantidad * precio).toFixed(2);
    }

    // Product lookup
    if (name === 'nombre_producto' && productos) {
      const selectedProduct = productos.find(p => p.nombre_producto === value);
      if (selectedProduct) {
        updatedItem.categoria_producto = selectedProduct.categoria_producto;
        updatedItem.unidad = selectedProduct.unidad;
      }
    }

    setNewItemData(updatedItem);
  };

  const handleSaveNewItem = async (reqId) => {
    if (!newItemData.nombre_producto || !newItemData.cantidad_requerida) {
      showToast("Complete los campos obligatorios", "warning");
      return;
    }

    await addRequerimientoItem({
      ...newItemData,
      requerimiento_id: reqId,
      cantidad_requerida: parseFloat(newItemData.cantidad_requerida),
      precio_unitario_usd_aprox: parseFloat(newItemData.precio_unitario_usd_aprox) || 0
    });

    showToast("Item agregado al requerimiento", "success");
    setAddingItemToReqId(null);
  };


  const handleCancelItem = async (itemId) => {
    if (window.confirm('¿Está seguro de que desea cancelar este ítem del requerimiento?')) {
      await cancelRequerimientoItem(itemId);
      showToast('Item cancelado exitosamente', 'info');
    }
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
          <div className="requerimientos-table-container">
            {filteredRequerimientos.map(req => (
              <div key={req.id} className="requerimiento-group">
                <div className="requerimiento-header">
                  <h4>Requerimiento del {new Date(req.fecha_requerimiento.replace(/-/g, '/')).toLocaleDateString()}</h4>

                  <span className="total-amount">
                    Monto Total: ${req.requerimiento_items.reduce((acc, item) => acc + (item.cantidad_requerida * item.precio_unitario_usd_aprox), 0).toFixed(2)}
                  </span>
                </div>

                <table className="requerimientos-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Unidad</th>
                      <th>Requerido</th>
                      <th>Comprado</th>
                      <th>Pendiente</th>
                      <th>Monto Aprox. (USD)</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* EXISTING ITEMS */}
                    {req.requerimiento_items.map(item => (
                      <tr key={item.id} className={`status-${item.status}`}>
                        {editingItemId === item.id ? (
                          // EDIT MODE ROW
                          <>
                            <td>
                              <input
                                list={`prod-datalist-edit-${item.id}`}
                                type="text"
                                name="nombre_producto"
                                value={editItemData.nombre_producto}
                                onChange={handleEditChange}
                                style={{ width: '100%' }}
                              />
                              <datalist id={`prod-datalist-edit-${item.id}`}>
                                {productos && productos.map(p => (
                                  <option key={p.id} value={p.nombre_producto} />
                                ))}
                              </datalist>
                            </td>
                            <td>
                              <input
                                type="text"
                                name="categoria_producto"
                                value={editItemData.categoria_producto}
                                onChange={handleEditChange}
                                style={{ width: '100%' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                name="unidad"
                                value={editItemData.unidad}
                                onChange={handleEditChange}
                                style={{ width: '60px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                name="cantidad_requerida"
                                value={editItemData.cantidad_requerida}
                                onChange={handleEditChange}
                                style={{ width: '60px' }}
                              />
                            </td>
                            <td>{item.cantidad_comprada || 0}</td>
                            <td> - </td>
                            <td>
                              <input
                                type="number"
                                name="precio_unitario_usd_aprox"
                                value={editItemData.precio_unitario_usd_aprox}
                                onChange={handleEditChange}
                                style={{ width: '80px' }}
                              />
                            </td>
                            <td>{item.status}</td>
                            <td>
                              <button onClick={handleSaveEdit} className="btn-action-icon save" title="Guardar">💾</button>
                              <button onClick={handleCancelEdit} className="btn-action-icon cancel" title="Cancelar">❌</button>
                            </td>
                          </>
                        ) : (
                          // VIEW MODE ROW
                          <>
                            <td>{item.nombre_producto}</td>
                            <td>{item.categoria_producto}</td>
                            <td>{item.unidad}</td>
                            <td>{item.cantidad_requerida}</td>
                            <td>{item.cantidad_comprada || 0}</td>
                            <td>{item.cantidad_requerida - (item.cantidad_comprada || 0)}</td>
                            <td>{`$${(item.cantidad_requerida * item.precio_unitario_usd_aprox).toFixed(2)}`}</td>
                            <td>
                              <span className={`status-badge ${item.status}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                {(item.status === 'pendiente' || item.status === 'en_progreso') && (
                                  <>
                                    <button onClick={() => handleEditClick(item)} className="btn-action-icon edit" title="Editar">✏️</button>
                                    <button
                                      onClick={() => handleCancelItem(item.id)}
                                      className="btn-action-icon delete"
                                      title="Cancelar este item"
                                    >
                                      🚫
                                    </button>
                                  </>
                                )}
                                {item.status === 'cancelado' && <span className="canceled-text">Cancelado</span>}
                                {item.status === 'completado' && <span className="completed-text">Completado</span>}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}

                    {/* NEW ITEM ROW (If active) */}
                    {addingItemToReqId === req.id && (
                      <tr className="adding-row" style={{ backgroundColor: '#e8f5e9' }}>
                        <td>
                          <input
                            list={`prod-datalist-new-${req.id}`}
                            type="text"
                            name="nombre_producto"
                            value={newItemData.nombre_producto}
                            onChange={handleNewItemChange}
                            placeholder="Producto..."
                            style={{ width: '100%' }}
                          />
                          <datalist id={`prod-datalist-new-${req.id}`}>
                            {productos && productos.map(p => (
                              <option key={p.id} value={p.nombre_producto} />
                            ))}
                          </datalist>
                        </td>
                        <td>{newItemData.categoria_producto}</td>
                        <td>{newItemData.unidad}</td>
                        <td>
                          <input
                            type="number"
                            name="cantidad_requerida"
                            value={newItemData.cantidad_requerida}
                            onChange={handleNewItemChange}
                            placeholder="Cant."
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td>0</td>
                        <td>-</td>
                        <td>
                          <input
                            type="number"
                            name="precio_unitario_usd_aprox"
                            value={newItemData.precio_unitario_usd_aprox}
                            onChange={handleNewItemChange}
                            placeholder="$$"
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td>Pendiente</td>
                        <td>
                          <button onClick={() => handleSaveNewItem(req.id)} className="btn-action-icon save" title="Agregar">✅</button>
                          <button onClick={handleCancelAdd} className="btn-action-icon cancel" title="Cancelar">❌</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="req-group-actions" style={{ marginTop: '10px', textAlign: 'left' }}>
                  {!addingItemToReqId && (
                    <button
                      onClick={() => handleStartAdd(req.id)}
                      className="btn-text-icon"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0288d1',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      + Agregar Item
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
