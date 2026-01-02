import { useState } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import './RequerimientosForm.css'

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
        <main className="requerimientos-form-container">
            <header>
                <label>Fecha del Requerimiento</label>
                <input
                    type="date"
                    value={fechaRequerimiento}
                    onChange={(e) => setFechaRequerimiento(e.target.value)}
                    required
                    className="form-control"
                />
            </header>

            <h4>Agregar Nuevo Item</h4>

            <section className="requerimiento-item-grid">
                <div className="form-group">
                    <label>Producto

                    <input
                        list="productos-datalist"
                        type="text"
                        name="nombre_producto"
                        value={currentItem.nombre_producto}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Buscar producto..."
                        />

                    </label>
                    <datalist id="productos-datalist">
                        {productos && productos.map(p => (
                            <option key={p.id} value={p.nombre_producto} />
                        ))}
                    </datalist>
                </div>

                <div className="form-group">
                    <label>Categoría

                    <input
                        type="text"
                        name="categoria_producto"
                        value={currentItem.categoria_producto}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Categoría"
                        />
                    </label>
                </div>

                <div className="form-group">
                    <label>Unidad

                    <input
                        type="text"
                        name="unidad"
                        value={currentItem.unidad}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder="Unidad"
                        />
                        </label>
                </div>

                <div className="form-group">
                    <label>Cantidad 

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
                        </label>
                </div>

                <div className="form-group">
                    <label>Precio Unit. (Ref)

                    <input
                        type="number"
                        name="precio_unitario_usd_aprox"
                        value={currentItem.precio_unitario_usd_aprox}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        className="form-control"
                        />
                        </label>
                </div>

                <div className="form-group">
                    <label>Total Aprox.

                    <input
                        type="text"
                        value={`$${currentItem.monto_dolares_aprox || '0.00'}`}
                        readOnly
                        className="form-control input-readonly"
                        />
                        </label>
                </div>

               
            </section>

            {/* Temporary List Table */}
            {itemsList.length > 0 && (
                <div className="items-list-preview">
                    <h4>Items por Registrar ({itemsList.length})</h4>
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>Total Ref.</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsList.map((item, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="product-name">{item.nombre_producto}</div>
                                        <div className="product-details">{item.categoria_producto} - {item.unidad}</div>
                                    </td>
                                    <td>{item.cantidad_requerida}</td>
                                    <td>${item.monto_dolares_aprox}</td>
                                    <td>
                                        <button
                                            onClick={() => handleRemoveItemFromList(idx)}
                                            className="btn-remove"
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


            <div className="form-actions">

                {onCancel && (
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                )}

                <button
                    onClick={handleSubmit}
                    className="btn-submit-requerimiento"
                    disabled={loading || itemsList.length === 0}
                >
                    {loading ? 'Guardando...' : `Registrar Requerimiento (${itemsList.length})`}
                </button>

                <button
                    type="button"
                    onClick={handleAddItemToList}
                    className="btn-add-item-requerimiento"
                >
                    + Agregar a Lista
                </button>
              
                
            </div>
        </main>
    );
};
