import React, { useState, useEffect, useCallback } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import ModuleDescription from '../../../_core/ModuleDescription/ModuleDescription';
import Modal from '../../../../common/Modal/Modal';
import ComprasTable from './ComprasTable';
import ComprasHeader from './components/ComprasHeader';
import './ComprasMain.css';
import supabase from '../../../../../api/supaBase';

const ComprasMain = () => {
  const { addPurchase, loading, productos, compras, updateCompra, requerimientos } = useOperaciones();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('nueva-compra');
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    fecha_compra: new Date().toISOString().split('T')[0],
    nro_factura: '',
    proveedor: '',
    nombre_producto: '',
    categoria_producto: '',
    unidad: '',
    cantidad: '',
    precio_unitario: '',
    aplica_iva: true,
    tasa_cambio: '',
    observaciones: '',
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Proveedores
        const { data: provData, error: provError } = await supabase.from('proveedores').select('*');
        if (provError) console.error('Error fetching providers:', provError);
        else setProveedores(provData || []);

        // Fetch Categorias
        const { data: catData, error: catError } = await supabase.from('categorias_compras').select('*');
        if (catError) console.error('Error fetching categories:', catError);
        else setCategorias(catData || []);

      } catch (error) {
        console.error('Error fetching global data:', error);
      }
    };
    fetchData();
  }, []);

  // Obtener productos sugeridos basados en requerimientos pendientes
  const getSuggestedProducts = useCallback(() => {
    if (!requerimientos) return [];

    const pendingItems = [];
    requerimientos.forEach(req => {
      if (req.requerimiento_items && req.requerimiento_items.length > 0) {
        req.requerimiento_items.forEach(item => {
          if (item.status === 'pendiente' || item.status === 'en_progreso') {
            const pendingQty = item.cantidad_requerida - (item.cantidad_comprada || 0);
            if (pendingQty > 0) {
              pendingItems.push({
                ...item,
                pendingQty,
                requerimiento_id: req.id,
                fecha_requerimiento: req.fecha_requerimiento
              });
            }
          }
        });
      }
    });

    return pendingItems;
  }, [requerimientos]);

  // Usar sugerencia para auto-completar formulario
  const handleUseSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      nombre_producto: suggestion.nombre_producto,
      categoria_producto: suggestion.categoria_producto,
      unidad: suggestion.unidad,
      cantidad: suggestion.pendingQty,
      observaciones: `Compra para requerimiento del ${new Date(suggestion.fecha_requerimiento.replace(/-/g, '/')).toLocaleDateString()}`
    }));
  };

  // Auto-completar categoría y unidad cuando se selecciona un producto
  useEffect(() => {
    if (formData.nombre_producto && productos) {
      const selectedProduct = productos.find(item => item.nombre_producto === formData.nombre_producto);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          categoria_producto: selectedProduct.categoria_producto,
          unidad: selectedProduct.unidad,
        }));
      }
    }
  }, [formData.nombre_producto, productos]);

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Enviar formulario de compra
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre_producto || !formData.cantidad || !formData.precio_unitario || !formData.tasa_cambio) {
      showToast('Por favor complete todos los campos requeridos.', 'warning');
      return;
    }

    if (parseFloat(formData.cantidad) <= 0 || parseFloat(formData.precio_unitario) <= 0 || parseFloat(formData.tasa_cambio) <= 0) {
      showToast('La cantidad, precio unitario y tasa de cambio deben ser mayores a cero.', 'warning');
      return;
    }

    // Calcular totales
    const iva = formData.aplica_iva ? parseFloat(formData.precio_unitario) * parseFloat(formData.cantidad) * 0.16 : 0;
    const total_bs = (parseFloat(formData.precio_unitario) * parseFloat(formData.cantidad)) + iva;
    const total_usd = total_bs / parseFloat(formData.tasa_cambio);

    const purchaseData = {
      ...formData,
      total_bs: total_bs.toFixed(2),
      total_usd: total_usd.toFixed(2),
      iva: iva.toFixed(2),
      precio_unitario: parseFloat(formData.precio_unitario).toFixed(2),
      cantidad: parseInt(formData.cantidad)
    };

    await addPurchase(purchaseData);

    // Resetear formulario después de enviar
    setFormData({
      fecha_compra: new Date().toISOString().split('T')[0],
      nro_factura: '',
      proveedor: '',
      nombre_producto: '',
      categoria_producto: '',
      unidad: '',
      cantidad: '',
      precio_unitario: '',
      aplica_iva: true,
      tasa_cambio: '',
      observaciones: '',
    });
    showToast('Compra registrada exitosamente', 'success');
  };

  // Editar compra
  const handleEdit = (compra) => {
    setSelectedCompra({
      ...compra,
      fecha_compra: compra.fecha_compra.split('T')[0] // Formatear fecha para input
    });
    setShowEditModal(true);
  };

  // Actualizar compra
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedCompra) return;

    // Validaciones
    if (!selectedCompra.nombre_producto || !selectedCompra.cantidad || !selectedCompra.precio_unitario || !selectedCompra.tasa_cambio) {
      showToast('Por favor complete todos los campos requeridos.', 'warning');
      return;
    }

    // Calcular totales actualizados
    const iva = selectedCompra.aplica_iva ? parseFloat(selectedCompra.precio_unitario) * parseFloat(selectedCompra.cantidad) * 0.16 : 0;
    const total_bs = (parseFloat(selectedCompra.precio_unitario) * parseFloat(selectedCompra.cantidad)) + iva;
    const total_usd = total_bs / parseFloat(selectedCompra.tasa_cambio);

    const updatedPurchase = {
      ...selectedCompra,
      total_bs: total_bs.toFixed(2),
      total_usd: total_usd.toFixed(2),
      iva: iva.toFixed(2),
      precio_unitario: parseFloat(selectedCompra.precio_unitario).toFixed(2),
      cantidad: parseInt(selectedCompra.cantidad)
    };

    await updateCompra(selectedCompra.id, updatedPurchase);
    setShowEditModal(false);
    setSelectedCompra(null);
    showToast('Compra actualizada exitosamente', 'success');
  };

  // Calcular totales en tiempo real
  const totalBs = () => {
    if (!formData.precio_unitario || !formData.cantidad) return 0;
    const iva = formData.aplica_iva ? parseFloat(formData.precio_unitario) * parseFloat(formData.cantidad) * 0.16 : 0;
    return (parseFloat(formData.precio_unitario) * parseFloat(formData.cantidad)) + iva;
  };

  const totalUsd = () => {
    if (!formData.tasa_cambio || totalBs() === 0) return 0;
    return totalBs() / parseFloat(formData.tasa_cambio);
  };

  const suggestedProducts = getSuggestedProducts();

  return (
    <div className="compras-main">
      <ModuleDescription
        title="Registro de Compras"
        description="Registre las compras de materiales y suministros para las operaciones."
      />

      <ComprasHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'nueva-compra' && (
        <>
          {/* Sección de sugerencias */}
          {suggestedProducts.length > 0 && (
            <div className="suggestions-section">
              <h4>🛒 Compras Sugeridas (Basadas en Requerimientos Pendientes)</h4>
              <div className="suggestions-list">
                {suggestedProducts.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    <div className="suggestion-info">
                      <strong>{suggestion.nombre_producto}</strong>
                      <span> - Pendiente: {suggestion.pendingQty} {suggestion.unidad}</span>
                      <small> (Requerimiento: {new Date(suggestion.fecha_requerimiento.replace(/-/g, '/')).toLocaleDateString()})</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUseSuggestion(suggestion)}
                      className="btn-use-suggestion"
                    >
                      Usar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario de compra */}
          <form onSubmit={handleSubmit} className="compras-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Fecha de Compra *</label>
                <input
                  type="date"
                  name="fecha_compra"
                  value={formData.fecha_compra}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nro. Factura (Opcional)</label>
                <input
                  type="text"
                  name="nro_factura"
                  value={formData.nro_factura}
                  onChange={handleInputChange}
                  placeholder="Número de factura"
                />
              </div>

              <div className="form-group">
                <label>Proveedor (Opcional)</label>
                <input
                  type="text"
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleInputChange}
                  placeholder="Nombre del proveedor"
                  list="proveedores-list"
                  autoComplete="off"
                />
                <datalist id="proveedores-list">
                  {proveedores.map((prov, index) => (
                    <option key={index} value={prov.nombre} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input
                  list="productos"
                  type="text"
                  name="nombre_producto"
                  value={formData.nombre_producto}
                  onChange={handleInputChange}
                  required
                  placeholder="Seleccione o escriba un producto"
                />
                <datalist id="productos">
                  {productos && productos.map(item => (
                    <option key={item.id} value={item.nombre_producto} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label>Categoría del Producto *</label>
                <input
                  type="text"
                  name="categoria_producto"
                  value={formData.categoria_producto}
                  onChange={handleInputChange}
                  required
                  placeholder="Categoría del producto"
                  list="categorias-list"
                  autoComplete="off"
                />
                <datalist id="categorias-list">
                  {categorias.map((cat, index) => (
                    <option key={index} value={cat.nombre} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label>Unidad *</label>
                <input
                  type="text"
                  name="unidad"
                  value={formData.unidad}
                  onChange={handleInputChange}
                  required
                  placeholder="Unidad de medida"
                />
              </div>

              <div className="form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Precio Unitario (Bs. sin IVA) *</label>
                <input
                  type="number"
                  name="precio_unitario"
                  value={formData.precio_unitario}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Tasa de Cambio (Bs/USD) *</label>
                <input
                  type="number"
                  name="tasa_cambio"
                  value={formData.tasa_cambio}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group iva-checkbox">
                <label htmlFor="aplica_iva">
                  <input
                    type="checkbox"
                    id="aplica_iva"
                    name="aplica_iva"
                    checked={formData.aplica_iva}
                    onChange={handleInputChange}
                  />
                  ¿Aplica IVA (16%)?
                </label>
              </div>

              <div className="form-group full-width">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Observaciones adicionales sobre la compra..."
                ></textarea>
              </div>
            </div>

            <div className="form-summary">
              <p>Subtotal: <strong>{(parseFloat(formData.precio_unitario || 0) * parseFloat(formData.cantidad || 0)).toFixed(2)} Bs.</strong></p>
              <p>IVA (16%): <strong>{(formData.aplica_iva ? parseFloat(formData.precio_unitario || 0) * parseFloat(formData.cantidad || 0) * 0.16 : 0).toFixed(2)} Bs.</strong></p>
              <p>Total en Bolívares: <strong>{totalBs().toFixed(2)} Bs.</strong></p>
              <p>Total en Dólares: <strong>{totalUsd().toFixed(2)} $</strong></p>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Compra'}
            </button>
          </form>
        </>
      )}

      {/* Tabla de compras */}
      {activeTab === 'historial' && (
        <ComprasTable compras={compras} onEdit={handleEdit} />
      )}

      {/* Modal de edición */}
      {showEditModal && selectedCompra && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Compra">
          <form onSubmit={handleUpdate} className="compras-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Fecha de Compra *</label>
                <input
                  type="date"
                  name="fecha_compra"
                  value={selectedCompra.fecha_compra}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, fecha_compra: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nro. Factura (Opcional)</label>
                <input
                  type="text"
                  name="nro_factura"
                  value={selectedCompra.nro_factura}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, nro_factura: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Proveedor (Opcional)</label>
                <input
                  type="text"
                  name="proveedor"
                  value={selectedCompra.proveedor}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, proveedor: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  name="nombre_producto"
                  value={selectedCompra.nombre_producto}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, nombre_producto: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoría del Producto *</label>
                <input
                  type="text"
                  name="categoria_producto"
                  value={selectedCompra.categoria_producto}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, categoria_producto: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Unidad *</label>
                <input
                  type="text"
                  name="unidad"
                  value={selectedCompra.unidad}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, unidad: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  name="cantidad"
                  value={selectedCompra.cantidad}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, cantidad: e.target.value })}
                  required
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Precio Unitario (Bs. sin IVA) *</label>
                <input
                  type="number"
                  name="precio_unitario"
                  value={selectedCompra.precio_unitario}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, precio_unitario: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Tasa de Cambio (Bs/USD) *</label>
                <input
                  type="number"
                  name="tasa_cambio"
                  value={selectedCompra.tasa_cambio}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, tasa_cambio: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group iva-checkbox">
                <label htmlFor="aplica_iva_edit">
                  <input
                    type="checkbox"
                    id="aplica_iva_edit"
                    name="aplica_iva"
                    checked={selectedCompra.aplica_iva}
                    onChange={(e) => setSelectedCompra({ ...selectedCompra, aplica_iva: e.target.checked })}
                  />
                  ¿Aplica IVA (16%)?
                </label>
              </div>

              <div className="form-group full-width">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={selectedCompra.observaciones}
                  onChange={(e) => setSelectedCompra({ ...selectedCompra, observaciones: e.target.value })}
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Actualizar Compra
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ComprasMain;