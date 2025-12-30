import React, { useState } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import { EditIcon, SaveIcon, CancelIcon, PlusIcon, DelateIcon } from '../../../../../assets/icons/Icons'; // Ensure these are imported

const RequerimientosGroupList = ({ requerimientos, onDataChange }) => {
    const {
        productos,
        addRequerimientoItem,
        updateRequerimientoItem,
        cancelRequerimientoItem,
        deleteRequerimientoItem
    } = useOperaciones();

    const { showToast } = useNotification();

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
        if (onDataChange) onDataChange();
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        let updatedData = { ...editItemData, [name]: value };

        // Auto-fill logic
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
        if (onDataChange) onDataChange();
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('¿Está seguro de que desea eliminar permanentemente este ítem? Esta acción no se puede deshacer.')) {
            await deleteRequerimientoItem(itemId);
            showToast('Item eliminado permanentemente', 'info');
            if (onDataChange) onDataChange();
        }
    };

    const handleCancelItem = async (itemId) => {
        if (window.confirm('¿Está seguro de que desea cancelar este ítem del requerimiento?')) {
            await cancelRequerimientoItem(itemId);
            showToast('Item cancelado exitosamente', 'info');
            if (onDataChange) onDataChange();
        }
    };

    if (!requerimientos || requerimientos.length === 0) {
        return null;
    }

    return (
        <div className="requerimientos-table-container">
            {requerimientos.map(req => (
                <div key={req.id} className="requerimiento-group">
                    <div className="requerimiento-header">
                        <h4>Solicitud del {new Date(req.fecha_requerimiento.replace(/-/g, '/')).toLocaleDateString()}</h4>

                        <span className="total-amount">
                            Total: ${req.requerimiento_items.reduce((acc, item) => acc + (item.cantidad_requerida * item.precio_unitario_usd_aprox), 0).toFixed(2)}
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
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="btn-action-icon delete-forever"
                                                                title="Eliminar este item permanentemente"
                                                            >
                                                                <DelateIcon style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {item.status === 'cancelado' && (
                                                        <>
                                                            <span className="canceled-text">Cancelado</span>
                                                            <button
                                                                onClick={() => handleDeleteItem(item.id)}
                                                                className="btn-action-icon delete-forever"
                                                                title="Eliminar este item permanentemente"
                                                                style={{ marginLeft: '5px' }}
                                                            >
                                                                <DelateIcon style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
                                                            </button>
                                                        </>
                                                    )}
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
                                    <td>
                                        <input
                                            type="text"
                                            name="categoria_producto"
                                            value={newItemData.categoria_producto}
                                            onChange={handleNewItemChange}
                                            placeholder="Categoría"
                                            style={{ width: '100%' }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            name="unidad"
                                            value={newItemData.unidad}
                                            onChange={handleNewItemChange}
                                            placeholder="Unidad"
                                            style={{ width: '60px' }}
                                        />
                                    </td>
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
    );
};

export default RequerimientosGroupList;
