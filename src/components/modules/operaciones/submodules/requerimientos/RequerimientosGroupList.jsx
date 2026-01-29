import React, { useState } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import { EditIcon, SaveIcon, CancelIcon, PlusIcon, DelateIcon } from '../../../../../assets/icons/Icons';
import { ROLES } from '../../../../../config/permissions';
import RequerimientoItemEditModal from './RequerimientoItemEditModal';
import './RequerimientosGroupList.css';

const RequerimientosGroupList = ({ requerimientos, onDataChange, user }) => {
    const {
        productos,
        addRequerimientoItem,
        updateRequerimientoItem,
        cancelRequerimientoItem,
        deleteRequerimientoItem,
        cancelRequerimiento
    } = useOperaciones();

    const { showToast } = useNotification();

    // State for Editing Item (Modal)
    const [editingItem, setEditingItem] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // State for Adding NEW Item to a Requirement Group
    const [addingItemToReqId, setAddingItemToReqId] = useState(null);

    // State for Card Edit Mode (Toggle visibility of item actions)
    const [editModeReqIds, setEditModeReqIds] = useState({});

    const toggleEditMode = (reqId) => {
        setEditModeReqIds(prev => ({
            ...prev,
            [reqId]: !prev[reqId]
        }));
    };

    const [newItemData, setNewItemData] = useState({
        nombre_producto: '',
        categoria_producto: '',
        unidad: '',
        cantidad_requerida: '',
        precio_unitario_usd_aprox: '',
        monto_dolares_aprox: ''
    });

    // --- Handlers for Editing (Modal) ---
    const handleEditClick = (item) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingItem(null);
        setIsEditModalOpen(false);
    };

    const handleSaveModal = async (updatedData) => {
        await updateRequerimientoItem(updatedData.id, {
            nombre_producto: updatedData.nombre_producto,
            categoria_producto: updatedData.categoria_producto,
            unidad: updatedData.unidad,
            cantidad_requerida: updatedData.cantidad_requerida,
            precio_unitario_usd_aprox: updatedData.precio_unitario_usd_aprox,
        });

        showToast("Item actualizado correctamente", "success");
        handleCloseModal();
        if (onDataChange) onDataChange();
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
            {requerimientos.map(req => {
                const isJefe = ROLES[user?.role]?.level >= 50;
                const showActionsColumn = isJefe || addingItemToReqId === req.id;
                const isEditMode = editModeReqIds[req.id];

                return (
                    <section key={req.id} className="requerimiento-card">
                        <header className="requerimiento-header">
                            <span>
                                Fecha: {new Date(req.fecha_requerimiento.replace(/-/g, '/')).toLocaleDateString()}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <h4>Solicitud #{req.id}</h4>
                                <span style={{ fontSize: '1em', fontWeight: 'bold', color: '#388E3C' }}>
                                    Total: ${req.requerimiento_items.reduce((acc, i) => acc + (parseFloat(i.monto_dolares_aprox) || 0), 0).toFixed(2)}
                                </span>
                            </div>
                            <h4 ><span className={req.status === 'pendiente' ? 'pendiente' : 'por_aprobar'}>{req.status}</span></h4>
                        </header>
                        <div className="requerimiento-items-wrapper">
                            {req.requerimiento_items.map(item => (
                                <div className='requerimiento-details' key={item.id}>
                                    <>
                                        <h3>Producto: <span>{item.nombre_producto}</span></h3>
                                        <h3>Categoria: <span>{item.categoria_producto}</span></h3>
                                        <h3>Unidad: <span>{item.unidad}</span></h3>
                                        <h3>Cantidad Comprada: <span>{item.cantidad_comprada}</span></h3>
                                        <h3>Cantidad Requerida: <span>{item.cantidad_requerida}</span></h3>
                                        <h3>Precio: <span>{item.precio_unitario_usd_aprox}</span></h3>
                                        <h3 className='total-line'> <span className="light-green">Total: ${item.monto_dolares_aprox}</span></h3>

                                        {/* Actions only if 'por_aprobar' AND in Edit Mode */}
                                        {req.status === 'por_aprobar' && isEditMode && (
                                            <div className="item-actions">
                                                <button onClick={() => handleEditClick(item)} className="btn-icon" title="Editar">
                                                    <EditIcon width="16" height="16" />
                                                </button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="btn-icon delete" title="Eliminar">
                                                    <DelateIcon width="16" height="16" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                </div>
                            ))}
                            {/* Esto debe ser otro componente */}
                            {addingItemToReqId === req.id && (
                                <div className="requerimiento-details adding-form">
                                    <h3>Producto:
                                        <input
                                            list={`prod-datalist-new-${req.id}`}
                                            name="nombre_producto"
                                            value={newItemData.nombre_producto}
                                            onChange={handleNewItemChange}
                                            placeholder="Buscar..."
                                            className="input-card"
                                        />
                                        <datalist id={`prod-datalist-new-${req.id}`}>
                                            {productos && productos.map(p => (
                                                <option key={p.id} value={p.nombre_producto} />
                                            ))}
                                        </datalist>
                                    </h3>
                                    <h3>Categoria: <input name="categoria_producto" value={newItemData.categoria_producto} onChange={handleNewItemChange} className="input-card" placeholder="Cat." /></h3>
                                    <h3>Unidad: <input name="unidad" value={newItemData.unidad} onChange={handleNewItemChange} className="input-card unidad" placeholder="Und." /></h3>
                                    <h3>Cant. Req.: <input type="number" name="cantidad_requerida" value={newItemData.cantidad_requerida} onChange={handleNewItemChange} className="input-card cantidad" placeholder="0" /></h3>
                                    <h3>Precio Unit.: <input type="number" name="precio_unitario_usd_aprox" value={newItemData.precio_unitario_usd_aprox} onChange={handleNewItemChange} className="input-card precio" placeholder="$0.00" /></h3>
                                    <h3 className='total-line'> <span className="light-green">Total: ${newItemData.monto_dolares_aprox || '0.00'}</span></h3>

                                    <div className="form-actions">
                                        <button onClick={() => handleSaveNewItem(req.id)} className="btn-save">Guardar</button>
                                        <button onClick={handleCancelAdd} className="btn-cancel">Cancelar</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions Wrapper */}
                        {req.status === 'por_aprobar' && (
                            <div className="card-footer-actions">
                                {/* Botón Para Agregar (Solo si no estamos agregando ya) */}
                                {!addingItemToReqId && (
                                    <button
                                        className="btn-footer-action add"
                                        onClick={() => handleStartAdd(req.id)}
                                    >
                                        + Agregar
                                    </button>
                                )}

                                {/* Botón EDITAR */}
                                {!addingItemToReqId && (
                                    <button
                                        className={`btn-footer-action edit ${isEditMode ? 'active' : ''}`}
                                        onClick={() => toggleEditMode(req.id)}
                                    >
                                        {isEditMode ? 'Terminar' : 'Editar'}
                                    </button>
                                )}

                                {/* Botón CANCELAR SOLICITUD */}
                                {!addingItemToReqId && !isEditMode && (
                                    <button
                                        className="btn-footer-action cancel"
                                        onClick={() => cancelRequerimiento(req.id)}
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        )}

                    </section>
                    // <div key={req.id} className="requerimiento-group">


                    //     <div className="requerimiento-header">
                    //         <div>
                    //             <h4>Solicitud #{req.id}</h4>
                    //             <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    //                 Fecha: {new Date(req.fecha_requerimiento.replace(/-/g, '/')).toLocaleDateString()}
                    //             </span>
                    //         </div>

                    //         <span className="total-amount">
                    //             Total: ${req.requerimiento_items.reduce((acc, item) => acc + (item.cantidad_requerida * item.precio_unitario_usd_aprox), 0).toFixed(2)}
                    //         </span>
                    //     </div>
                    //     {/* Aqui va un componente */}

                    //     <table className="requerimientos-table">
                    //         <thead>
                    //             <tr>
                    //                 <th>Producto</th>
                    //                 <th>Categoría</th>
                    //                 <th>Unidad</th>
                    //                 <th>Requerido</th>
                    //                 <th>Comprado</th>
                    //                 <th>Pendiente</th>
                    //                 <th>Monto Aprox. (USD)</th>
                    //                 <th>Estado</th>
                    //                 {showActionsColumn && <th>Acciones</th>}
                    //             </tr>
                    //         </thead>
                    //         <tbody>
                    //             {/* EXISTING ITEMS */}
                    //             {req.requerimiento_items.map(item => (
                    //                 <tr key={item.id} className={`status-${item.status}`}>
                    //                     {editingItemId === item.id ? (
                    //                         // EDIT MODE ROW
                    //                         <>
                    //                             <td>
                    //                                 <input
                    //                                     list={`prod-datalist-edit-${item.id}`}
                    //                                     type="text"
                    //                                     name="nombre_producto"
                    //                                     value={editItemData.nombre_producto}
                    //                                     onChange={handleEditChange}
                    //                                     style={{ width: '100%' }}
                    //                                 />
                    //                                 <datalist id={`prod-datalist-edit-${item.id}`}>
                    //                                     {productos && productos.map(p => (
                    //                                         <option key={p.id} value={p.nombre_producto} />
                    //                                     ))}
                    //                                 </datalist>
                    //                             </td>
                    //                             <td>
                    //                                 <input
                    //                                     type="text"
                    //                                     name="categoria_producto"
                    //                                     value={editItemData.categoria_producto}
                    //                                     onChange={handleEditChange}
                    //                                     style={{ width: '100%' }}
                    //                                 />
                    //                             </td>
                    //                             <td>
                    //                                 <input
                    //                                     type="text"
                    //                                     name="unidad"
                    //                                     value={editItemData.unidad}
                    //                                     onChange={handleEditChange}
                    //                                     style={{ width: '60px' }}
                    //                                 />
                    //                             </td>
                    //                             <td>
                    //                                 <input
                    //                                     type="number"
                    //                                     name="cantidad_requerida"
                    //                                     value={editItemData.cantidad_requerida}
                    //                                     onChange={handleEditChange}
                    //                                     style={{ width: '60px' }}
                    //                                 />
                    //                             </td>
                    //                             <td>{item.cantidad_comprada || 0}</td>
                    //                             <td> - </td>
                    //                             <td>
                    //                                 <input
                    //                                     type="number"
                    //                                     name="precio_unitario_usd_aprox"
                    //                                     value={editItemData.precio_unitario_usd_aprox}
                    //                                     onChange={handleEditChange}
                    //                                     style={{ width: '80px' }}
                    //                                 />
                    //                             </td>
                    //                             <td>{item.status}</td>
                    //                             {showActionsColumn && (
                    //                                 <td>
                    //                                     <button onClick={handleSaveEdit} className="btn-action-icon save" title="Guardar">💾</button>
                    //                                     <button onClick={handleCancelEdit} className="btn-action-icon cancel" title="Cancelar">❌</button>
                    //                                 </td>
                    //                             )}
                    //                         </>
                    //                     ) : (
                    //                         // VIEW MODE ROW
                    //                         <>
                    //                             <td>{item.nombre_producto}</td>
                    //                             <td>{item.categoria_producto}</td>
                    //                             <td>{item.unidad}</td>
                    //                             <td>{item.cantidad_requerida}</td>
                    //                             <td>{item.cantidad_comprada || 0}</td>
                    //                             <td>{item.cantidad_requerida - (item.cantidad_comprada || 0)}</td>
                    //                             <td>{`$${(item.cantidad_requerida * item.precio_unitario_usd_aprox).toFixed(2)}`}</td>
                    //                             <td>
                    //                                 <span className={`status-badge ${item.status}`}>
                    //                                     {item.status}
                    //                                 </span>
                    //                             </td>
                    //                             {showActionsColumn && (
                    //                             <td>
                    //                                 <div style={{ display: 'flex', gap: '5px' }}>
                    //                                     {isJefe && (item.status === 'pendiente' || item.status === 'en_progreso') && (
                    //                                         <>
                    //                                             <button onClick={() => handleEditClick(item)} className="btn-action-icon edit" title="Editar">✏️</button>
                    //                                             <button
                    //                                                 onClick={() => handleCancelItem(item.id)}
                    //                                                 className="btn-action-icon delete"
                    //                                                 title="Cancelar este item"
                    //                                             >
                    //                                                 🚫
                    //                                             </button>
                    //                                             <button
                    //                                                 onClick={() => handleDeleteItem(item.id)}
                    //                                                 className="btn-action-icon delete-forever"
                    //                                                 title="Eliminar este item permanentemente"
                    //                                             >
                    //                                                 <DelateIcon style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
                    //                                             </button>
                    //                                         </>
                    //                                     )}
                    //                                     {isJefe && item.status === 'cancelado' && (
                    //                                         <>
                    //                                             <span className="canceled-text">Cancelado</span>
                    //                                             <button
                    //                                                 onClick={() => handleDeleteItem(item.id)}
                    //                                                 className="btn-action-icon delete-forever"
                    //                                                 title="Eliminar este item permanentemente"
                    //                                                 style={{ marginLeft: '5px' }}
                    //                                             >
                    //                                                 <DelateIcon style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
                    //                                             </button>
                    //                                         </>
                    //                                     )}
                    //                                      {!isJefe && item.status === 'cancelado' && <span className="canceled-text">Cancelado</span>}
                    //                                     {item.status === 'completado' && <span className="completed-text">Completado</span>}
                    //                                 </div>
                    //                             </td>
                    //                             )}
                    //                         </>
                    //                     )}
                    //                 </tr>
                    //             ))}

                    //             {/* NEW ITEM ROW (If active) */}
                    //             {addingItemToReqId === req.id && (
                    //                 <tr className="adding-row" style={{ backgroundColor: '#e8f5e9' }}>
                    //                     <td>
                    //                         <input
                    //                             list={`prod-datalist-new-${req.id}`}
                    //                             type="text"
                    //                             name="nombre_producto"
                    //                             value={newItemData.nombre_producto}
                    //                             onChange={handleNewItemChange}
                    //                             placeholder="Producto..."
                    //                             style={{ width: '100%' }}
                    //                         />
                    //                         <datalist id={`prod-datalist-new-${req.id}`}>
                    //                             {productos && productos.map(p => (
                    //                                 <option key={p.id} value={p.nombre_producto} />
                    //                             ))}
                    //                         </datalist>
                    //                     </td>
                    //                     <td>
                    //                         <input
                    //                             type="text"
                    //                             name="categoria_producto"
                    //                             value={newItemData.categoria_producto}
                    //                             onChange={handleNewItemChange}
                    //                             placeholder="Categoría"
                    //                             style={{ width: '100%' }}
                    //                         />
                    //                     </td>
                    //                     <td>
                    //                         <input
                    //                             type="text"
                    //                             name="unidad"
                    //                             value={newItemData.unidad}
                    //                             onChange={handleNewItemChange}
                    //                             placeholder="Unidad"
                    //                             style={{ width: '60px' }}
                    //                         />
                    //                     </td>
                    //                     <td>
                    //                         <input
                    //                             type="number"
                    //                             name="cantidad_requerida"
                    //                             value={newItemData.cantidad_requerida}
                    //                             onChange={handleNewItemChange}
                    //                             placeholder="Cant."
                    //                             style={{ width: '60px' }}
                    //                         />
                    //                     </td>
                    //                     <td>0</td>
                    //                     <td>-</td>
                    //                     <td>
                    //                         <input
                    //                             type="number"
                    //                             name="precio_unitario_usd_aprox"
                    //                             value={newItemData.precio_unitario_usd_aprox}
                    //                             onChange={handleNewItemChange}
                    //                             placeholder="$$"
                    //                             style={{ width: '80px' }}
                    //                         />
                    //                     </td>
                    //                     <td>Pendiente</td>
                    //                     {showActionsColumn && (
                    //                         <td>
                    //                             <button onClick={() => handleSaveNewItem(req.id)} className="btn-action-icon save" title="Agregar">✅</button>
                    //                             <button onClick={handleCancelAdd} className="btn-action-icon cancel" title="Cancelar">❌</button>
                    //                         </td>
                    //                     )}
                    //                 </tr>
                    //             )}
                    //         </tbody>
                    //     </table>

                    //     <div className="req-group-actions" style={{ marginTop: '10px', textAlign: 'left' }}>
                    //         {!addingItemToReqId && (
                    //             <button
                    //                 onClick={() => handleStartAdd(req.id)}
                    //                 className="btn-text-icon"
                    //                 style={{
                    //                     background: 'none',
                    //                     border: 'none',
                    //                     color: '#0288d1',
                    //                     cursor: 'pointer',
                    //                     fontWeight: 'bold',
                    //                     display: 'flex',
                    //                     alignItems: 'center',
                    //                     gap: '5px'
                    //                 }}
                    //             >
                    //                 + Agregar Item
                    //             </button>
                    //         )}
                    //     </div>
                    // </div>
                );
            })}
            {/* Edit Modal */}
            <RequerimientoItemEditModal
                isOpen={isEditModalOpen}
                onClose={handleCloseModal}
                item={editingItem}
                onSave={handleSaveModal}
                productos={productos}
            />
        </div>
    );
};

export default RequerimientosGroupList;
