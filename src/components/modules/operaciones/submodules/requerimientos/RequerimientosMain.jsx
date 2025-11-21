import React, { useState, useEffect, useMemo } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import ModuleDescription from '../../../_core/ModuleDescription/ModuleDescription';
import './RequerimientosMain.css';

const RequerimientosMain = () => {
  const { 
    addRequerimiento, 
    loading, 
    productos, 
    requerimientos, 
    cancelRequerimientoItem,
    getLowStockItems // 1. Get low stock items function
  } = useOperaciones();
  
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    fecha_requerimiento: new Date().toISOString().split('T')[0],
    items: [{
      nombre_producto: '',
      categoria_producto: '',
      unidad: '',
      cantidad_requerida: '',
      precio_unitario_usd_aprox: '',
      monto_dolares_aprox: '',
    }],
  });
  const [filterStatus, setFilterStatus] = useState('all');

  const lowStockItems = useMemo(() => getLowStockItems ? getLowStockItems() : [], [getLowStockItems]);

  // 2. Handle using a suggestion
  const handleUseSuggestion = (suggestion) => {
    const quantityToRequest = (suggestion.stock_objetivo || 0) - (suggestion.cantidad_disponible || 0);

    const newItem = {
      nombre_producto: suggestion.nombre_producto,
      categoria_producto: suggestion.categoria_producto,
      unidad: suggestion.unidad,
      cantidad_requerida: quantityToRequest > 0 ? Math.ceil(quantityToRequest) : '', // Suggest reorder quantity
      precio_unitario_usd_aprox: '',
      monto_dolares_aprox: ''
    };

    const isFormEmpty = formData.items.length === 1 && !formData.items[0].nombre_producto;

    if (isFormEmpty) {
      setFormData(prev => ({ ...prev, items: [newItem] }));
    } else {
      setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
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

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    const currentItem = { ...newItems[index], [name]: value };

    if (name === 'cantidad_requerida' || name === 'precio_unitario_usd_aprox') {
      const cantidad = name === 'cantidad_requerida' ? parseFloat(value) : parseFloat(currentItem.cantidad_requerida) || 0;
      const precio = name === 'precio_unitario_usd_aprox' ? parseFloat(value) : parseFloat(currentItem.precio_unitario_usd_aprox) || 0;
      currentItem.monto_dolares_aprox = (cantidad * precio).toFixed(2);
    }

    if (name === 'nombre_producto' && productos) {
      const selectedProduct = productos.find(p => p.nombre_producto === value);
      if (selectedProduct) {
        currentItem.categoria_producto = selectedProduct.categoria_producto;
        currentItem.unidad = selectedProduct.unidad;
      } else {
        currentItem.categoria_producto = '';
        currentItem.unidad = '';
      }
    }
    
    newItems[index] = currentItem;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        nombre_producto: '',
        categoria_producto: '',
        unidad: '',
        cantidad_requerida: '',
        precio_unitario_usd_aprox: '',
        monto_dolares_aprox: ''
      }],
    }));
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      showToast('Debe agregar al menos un item al requerimiento.', 'warning');
      return;
    }

    const incompleteItems = formData.items.filter(item => 
      !item.nombre_producto || !item.cantidad_requerida || item.cantidad_requerida <= 0
    );

    if (incompleteItems.length > 0) {
      showToast('Por favor complete todos los campos de los items.', 'warning');
      return;
    }

    const itemsWithRequiredFields = formData.items.map(item => ({
      ...item,
      cantidad_requerida: parseInt(item.cantidad_requerida)
    }));
    
    await addRequerimiento({
      ...formData,
      items: itemsWithRequiredFields
    });
    
    setFormData({
      fecha_requerimiento: new Date().toISOString().split('T')[0],
      items: [{
        nombre_producto: '',
        categoria_producto: '',
        unidad: '',
        cantidad_requerida: '',
        precio_unitario_usd_aprox: '',
        monto_dolares_aprox: ''
      }],
    });
    showToast('Requerimiento registrado exitosamente', 'success');
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

      {/* 3. Suggestions Section UI */}
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

      <form onSubmit={handleSubmit} className="requerimientos-form">
        <div className="form-group">
          <label>Fecha del Requerimiento *</label>
          <input
            type="date"
            name="fecha_requerimiento"
            value={formData.fecha_requerimiento}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha_requerimiento: e.target.value }))}
            required
          />
        </div>

        <h4>Items del Requerimiento</h4>
        
        {formData.items.map((item, index) => (
          <div key={index} className="requerimiento-item-grid">
            <div className="form-group">
              <label>Producto *</label>
              <input
                list={`productos-datalist-${index}`}
                type="text"
                name="nombre_producto"
                value={item.nombre_producto}
                onChange={(e) => handleInputChange(e, index)}
                required
                placeholder="Seleccione o escriba un producto"
              />
              <datalist id={`productos-datalist-${index}`}>
                {productos && productos.map(p => (
                  <option key={p.id} value={p.nombre_producto} />
                ))}
              </datalist>
            </div>
            
            <div className="form-group">
              <label>Categoría *</label>
              <input
                type="text"
                name="categoria_producto"
                value={item.categoria_producto}
                onChange={(e) => handleInputChange(e, index)}
                required
                placeholder="Categoría del producto"
              />
            </div>
            
            <div className="form-group">
              <label>Unidad *</label>
              <input
                type="text"
                name="unidad"
                value={item.unidad}
                onChange={(e) => handleInputChange(e, index)}
                required
                placeholder="Unidad de medida"
              />
            </div>
            
            <div className="form-group">
              <label>Cantidad Requerida *</label>
              <input
                type="number"
                name="cantidad_requerida"
                value={item.cantidad_requerida}
                onChange={(e) => handleInputChange(e, index)}
                required
                min="1"
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label>Precio Unitario (USD Aprox)</label>
              <input
                type="number"
                name="precio_unitario_usd_aprox"
                value={item.precio_unitario_usd_aprox}
                onChange={(e) => handleInputChange(e, index)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Monto en dolares aproximado</label>
              <input
                type="number"
                name="monto_dolares_aprox"
                value={item.monto_dolares_aprox}
                readOnly
                placeholder="0.00"
              />
            </div>
            
            {formData.items.length > 1 && (
              <button 
                type="button" 
                onClick={() => handleRemoveItem(index)} 
                className="btn-remove-item"
                title="Eliminar item"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        
        <button type="button" onClick={handleAddItem} className="btn-add-item">
          + Agregar Item
        </button>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Requerimiento'}
        </button>
      </form>

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
                
                {req.requerimiento_items && req.requerimiento_items.length > 0 ? (
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
                      {req.requerimiento_items.map(item => (
                        <tr key={item.id} className={`status-${item.status}`}>
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
                            {(item.status === 'pendiente' || item.status === 'en_progreso') && (
                              <button 
                                onClick={() => handleCancelItem(item.id)} 
                                className="btn-cancel-item"
                                title="Cancelar este item"
                              >
                                Cancelar
                              </button>
                            )}
                            {item.status === 'cancelado' && (
                              <span className="canceled-text">Cancelado</span>
                            )}
                            {item.status === 'completado' && (
                              <span className="completed-text">Completado</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-items">No hay items en este requerimiento</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequerimientosMain;
