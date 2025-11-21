import React, { useState } from 'react';
import { useOperaciones } from '../../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../../contexts/NotificationContext';
import './RetiroForm.css';

const RetiroForm = () => {
  const { inventory, withdrawInventory, loading } = useOperaciones();
  const { showToast } = useNotification();
  const [formData, setFormData] = useState({
    inventario_id: '',
    cantidad_retirada: 0,
    retirado_por: '',
    observaciones: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.inventario_id || formData.cantidad_retirada <= 0) {
      showToast('Por favor, seleccione un ítem y una cantidad válida.', 'warning');
      return;
    }
    await withdrawInventory(formData);
    setFormData({
      inventario_id: '',
      cantidad_retirada: 0,
      retirado_por: '',
      observaciones: ''
    });
    showToast('Retiro registrado exitosamente', 'success');
  };

  return (
    <form onSubmit={handleSubmit} className="retiro-form">
      <h3>Retiro de Materiales</h3>
      <div className="form-group">
        <label>Seleccionar Ítem</label>
        <select name="inventario_id" value={formData.inventario_id} onChange={handleChange} required>
          <option value="">-- Seleccione un ítem --</option>
          {inventory.map(item => (
            <option key={item.id} value={item.id}>{item.nombre_producto}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Cantidad a Retirar</label>
        <input type="number" name="cantidad_retirada" value={formData.cantidad_retirada} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Retirado por</label>
        <input type="text" name="retirado_por" value={formData.retirado_por} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Observaciones</label>
        <textarea name="observaciones" value={formData.observaciones} onChange={handleChange}></textarea>
      </div>
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Procesando...' : 'Registrar Retiro'}
      </button>
    </form>
  );
};

export default RetiroForm;
