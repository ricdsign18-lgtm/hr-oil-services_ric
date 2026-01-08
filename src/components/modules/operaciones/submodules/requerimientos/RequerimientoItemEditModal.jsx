import React, { useState, useEffect } from 'react';
import { SaveIcon, CancelIcon } from '../../../../../assets/icons/Icons';
import './RequerimientoItemEditModal.css';

const RequerimientoItemEditModal = ({ item, isOpen, onClose, onSave, productos }) => {
    const [formData, setFormData] = useState({
        id: '',
        nombre_producto: '',
        categoria_producto: '',
        unidad: '',
        cantidad_requerida: '',
        precio_unitario_usd_aprox: '',
        monto_dolares_aprox: ''
    });

    useEffect(() => {
        if (item) {
            setFormData({
                id: item.id,
                nombre_producto: item.nombre_producto || '',
                categoria_producto: item.categoria_producto || '',
                unidad: item.unidad || '',
                cantidad_requerida: item.cantidad_requerida || '',
                precio_unitario_usd_aprox: item.precio_unitario_usd_aprox || '',
                monto_dolares_aprox: item.monto_dolares_aprox || ''
            });
        }
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedData = { ...formData, [name]: value };

        // Auto-fill logic
        if (name === 'nombre_producto' && productos) {
            const selectedProduct = productos.find(p => p.nombre_producto === value);
            if (selectedProduct) {
                updatedData.categoria_producto = selectedProduct.categoria_producto;
                updatedData.unidad = selectedProduct.unidad;
            }
        }

        // Auto-calc total
        if (name === 'cantidad_requerida' || name === 'precio_unitario_usd_aprox') {
            const cantidad = name === 'cantidad_requerida' ? parseFloat(value) : parseFloat(updatedData.cantidad_requerida) || 0;
            const precio = name === 'precio_unitario_usd_aprox' ? parseFloat(value) : parseFloat(updatedData.precio_unitario_usd_aprox) || 0;
            updatedData.monto_dolares_aprox = (cantidad * precio).toFixed(2);
        }

        setFormData(updatedData);
    };

    const handleSave = () => {
        // Basic validation
        if (!formData.cantidad_requerida || formData.cantidad_requerida <= 0) {
            alert("La cantidad requerida debe ser mayor a 0");
            return;
        }
        if (!formData.nombre_producto) {
            alert("El nombre del producto es obligatorio");
            return;
        }

        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Editar Item</h3>
                    <button onClick={onClose} className="btn-close">×</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Producto:</label>
                        <input 
                            list="prod-datalist-modal"
                            name="nombre_producto"
                            value={formData.nombre_producto}
                            onChange={handleChange}
                            className="input-modal"
                        />
                         <datalist id="prod-datalist-modal">
                            {productos && productos.map(p => (
                                <option key={p.id} value={p.nombre_producto} />
                            ))}
                        </datalist>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoría:</label>
                            <input name="categoria_producto" value={formData.categoria_producto} onChange={handleChange} className="input-modal" />
                        </div>
                        <div className="form-group small">
                            <label>Unidad:</label>
                            <input name="unidad" value={formData.unidad} onChange={handleChange} className="input-modal" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group small">
                            <label>Cant. Req.:</label>
                            <input type="number" name="cantidad_requerida" value={formData.cantidad_requerida} onChange={handleChange} className="input-modal" />
                        </div>
                        <div className="form-group small">
                            <label>Precio Unit.:</label>
                            <input type="number" name="precio_unitario_usd_aprox" value={formData.precio_unitario_usd_aprox} onChange={handleChange} className="input-modal" />
                        </div>
                        <div className="form-group small total">
                            <label>Total:</label>
                            <span>${formData.monto_dolares_aprox}</span>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                     <button onClick={onClose} className="btn-modal-cancel">Cancelar</button>
                    <button onClick={handleSave} className="btn-modal-save">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

export default RequerimientoItemEditModal;
