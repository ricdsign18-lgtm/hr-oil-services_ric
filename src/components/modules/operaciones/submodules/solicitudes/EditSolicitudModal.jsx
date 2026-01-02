import React, { useState, useEffect } from 'react';
import './SolicitudesMain.css'; // Reutilizamos estilos

const EditSolicitudModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    cantidad_requerida: '',
    nombre_producto: '',
    observaciones: '' // Si existe en el item
  });

  useEffect(() => {
    if (item) {
      setFormData({
        cantidad_requerida: item.cantidad_requerida || 0,
        nombre_producto: item.nombre_producto || '',
        observaciones: item.observaciones || ''
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Solo enviamos la cantidad, ya que 'observaciones' no existe en la BD y 'nombre_producto' no se edita
    onSave(item.id, {
        cantidad_requerida: formData.cantidad_requerida
    });
  };

  if (!item) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Editar Solicitud</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Producto:</label>
            <input 
              type="text" 
              name="nombre_producto" 
              value={formData.nombre_producto} 
              onChange={handleChange}
              disabled // Generalmente no queremos cambiar el producto totalmente, pero si se requiere se habilita
              className="form-control"
            />
             <small className="help-text">El nombre del producto no se puede cambiar en esta etapa. Rechace y cree uno nuevo si es incorrecto.</small>
          </div>
          
          <div className="form-group">
            <label>Cantidad Requerida:</label>
            <input 
              type="number" 
              name="cantidad_requerida" 
              value={formData.cantidad_requerida} 
              onChange={handleChange}
              min="1"
              step="1"
              className="form-control"
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
            <button type="submit" className="btn-save">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSolicitudModal;
