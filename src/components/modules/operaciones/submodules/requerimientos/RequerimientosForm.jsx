import React, { useState } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';

export const RequerimientosForm = ({ onSuccess, onCancel, semanaId = null }) => {
    const { addRequerimiento, loading, productos } = useOperaciones();
    const { showToast } = useNotification();

    // 1. Requirement Header State
    const [fechaRequerimiento, setFechaRequerimiento] = useState(new Date().toISOString().split('T')[0]);

    // 2. Added Items List State
    const [itemsList, setItemsList] = useState([]);

    // 3. Current Item Editing State
    const initialItemState = {
        nombre_producto: '',
        categoria_producto: '',
        unidad: '',
        cantidad_requerida: '',
        precio_unitario_usd_aprox: '',
        monto_dolares_aprox: '',
    };
    const [currentItem, setCurrentItem] = useState(initialItemState);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newItem = { ...currentItem, [name]: value };

        if (name === 'cantidad_requerida' || name === 'precio_unitario_usd_aprox') {
            const cantidad = name === 'cantidad_requerida' ? parseFloat(value) : parseFloat(newItem.cantidad_requerida) || 0;
            const precio = name === 'precio_unitario_usd_aprox' ? parseFloat(value) : parseFloat(newItem.precio_unitario_usd_aprox) || 0;
            newItem.monto_dolares_aprox = (cantidad * precio).toFixed(2);
        }

        if (name === 'nombre_producto' && productos) {
            const selectedProduct = productos.find(p => p.nombre_producto === value);
            if (selectedProduct) {
                newItem.categoria_producto = selectedProduct.categoria_producto;
                newItem.unidad = selectedProduct.unidad;
            }
            // Note: We don't auto-clear here to allow free typing if needed, 
            // but could replicate original logic if strict validation is desired.
        }

        setCurrentItem(newItem);
    };

    const handleAddItemToList = () => {
        // Validation
        if (!currentItem.nombre_producto || !currentItem.cantidad_requerida || currentItem.cantidad_requerida <= 0) {
            showToast('Complete los campos obligatorios del producto (Nombre y Cantidad)', 'warning');
            return;
        }

        setItemsList([...itemsList, currentItem]);
        setCurrentItem(initialItemState); // Clear form
    };

    const handleRemoveItemFromList = (index) => {
        const newList = itemsList.filter((_, i) => i !== index);
        setItemsList(newList);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (itemsList.length === 0) {
            showToast('Debe agregar al menos un item a la lista antes de guardar.', 'warning');
            return;
        }

        const itemsWithRequiredFields = itemsList.map(item => ({
            ...item,
            cantidad_requerida: parseInt(item.cantidad_requerida),
            precio_unitario_usd_aprox: parseFloat(item.precio_unitario_usd_aprox) || 0
        }));

        const payload = {
            fecha_requerimiento: fechaRequerimiento,
            items: itemsWithRequiredFields,
        };

        if (semanaId) {
            payload.semana_id = semanaId;
        }

        await addRequerimiento(payload);

        // Reset all
        setItemsList([]);
        setCurrentItem(initialItemState);
        showToast('Requerimiento registrado exitosamente', 'success');
        if (onSuccess) onSuccess();
    };

    return (
        <div className="requerimientos-form-container">
            {/* Header Section */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Fecha del Requerimiento *</label>
                <input
                    type="date"
                    value={fechaRequerimiento}
                    onChange={(e) => setFechaRequerimiento(e.target.value)}
                    required
                    className="form-control"
                />
            </div>

            <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

            {/* Item Entry Section */}
            <h4 style={{ 
                color: '#ffffffff',
            
            }}>Agregar Nuevo Item</h4>
            <div className="requerimiento-item-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                backgroundColor: '#f9fafb',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
            }}>
                <div className="form-group">
                    <label>Producto *</label>
                    <input
                        list="productos-datalist"
                        type="text"
                        name="nombre_producto"
                        value={currentItem.nombre_producto}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Buscar producto..."
                    />
                    <datalist id="productos-datalist">
                        {productos && productos.map(p => (
                            <option key={p.id} value={p.nombre_producto} />
                        ))}
                    </datalist>
                </div>

                <div className="form-group">
                    <label>Categoría</label>
                    <input
                        type="text"
                        name="categoria_producto"
                        value={currentItem.categoria_producto}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Categoría"
                    />
                </div>

                <div className="form-group">
                    <label>Unidad</label>
                    <input
                        type="text"
                        name="unidad"
                        value={currentItem.unidad}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Unidad"
                    />
                </div>

                <div className="form-group">
                    <label>Cantidad *</label>
                    <input
                        type="number"
                        name="cantidad_requerida"
                        value={currentItem.cantidad_requerida}
                        onChange={handleInputChange}
                        min="0.01"
                        step="0.01"
                        className="form-control"
                        placeholder="0"
                    />
                </div>

                <div className="form-group">
                    <label>Precio Unit. (Ref)</label>
                    <input
                        type="number"
                        name="precio_unitario_usd_aprox"
                        value={currentItem.precio_unitario_usd_aprox}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Total Aprox.</label>
                    <input
                        type="text"
                        value={`$${currentItem.monto_dolares_aprox || '0.00'}`}
                        readOnly
                        className="form-control"
                        style={{ backgroundColor: '#f0f0f0' }}
                    />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={handleAddItemToList}
                        className="btn-primary"
                        style={{ width: '100%' }}
                    >
                        + Agregar a Lista
                    </button>
                </div>
            </div>

            {/* Temporary List Table */}
            {itemsList.length > 0 && (
                <div className="items-list-preview" style={{ marginTop: '20px' }}>
                    <h4>Items por Registrar ({itemsList.length})</h4>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '8px' }}>Producto</th>
                                <th style={{ padding: '8px' }}>Cant.</th>
                                <th style={{ padding: '8px' }}>Total Ref.</th>
                                <th style={{ padding: '8px' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsList.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{item.nombre_producto}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{item.categoria_producto} - {item.unidad}</div>
                                    </td>
                                    <td style={{ padding: '8px' }}>{item.cantidad_requerida}</td>
                                    <td style={{ padding: '8px' }}>${item.monto_dolares_aprox}</td>
                                    <td style={{ padding: '8px' }}>
                                        <button
                                            onClick={() => handleRemoveItemFromList(idx)}
                                            style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Final Actions */}
            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                {onCancel && (
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    className="btn-success"
                    disabled={loading || itemsList.length === 0}
                    style={{
                        backgroundColor: itemsList.length === 0 ? '#a5d6a7' : '#2e7d32',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: itemsList.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Guardando...' : `Registrar Requerimiento (${itemsList.length})`}
                </button>
            </div>
        </div>
    );
};
