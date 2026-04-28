import { useState, useEffect } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import './RequerimientosForm.css'

export const RequerimientosForm = ({ onSuccess, onCancel, semanaId = null, prefilledProduct = null }) => {
    const { addRequerimiento, loading, productos } = useOperaciones();
    const { showToast } = useNotification();

    const [fechaRequerimiento, setFechaRequerimiento] = useState(new Date().toISOString().split('T')[0]);

    const [itemsList, setItemsList] = useState([]);

    const initialItemState = {
        nombre_producto: '',
        categoria_producto: '',
        unidad: '',
        cantidad_requerida: '',
        precio_unitario_usd_aprox: '',
        monto_dolares_aprox: '',
    };
    const [currentItem, setCurrentItem] = useState(initialItemState);

    useEffect(() => {
        if (prefilledProduct) {
            let recommendedQty = parseFloat(prefilledProduct.cantidad_sugerida);
            if (!recommendedQty && prefilledProduct.stock_objetivo) {
                 recommendedQty = parseFloat(prefilledProduct.stock_objetivo) - parseFloat(prefilledProduct.cantidad_disponible || 0);
            }
            if (!recommendedQty || recommendedQty < 0) recommendedQty = 0;

            const existingPrice = parseFloat(prefilledProduct.precio_unitario || 0);

            let category = prefilledProduct.categoria_producto || '';
            let unit = prefilledProduct.unidad || '';

            if (productos) {
                const fullProd = productos.find(p => p.nombre_producto === prefilledProduct.nombre_producto);
                if (fullProd) {
                    category = fullProd.categoria_producto || category;
                    unit = fullProd.unidad || unit;
                }
            }

            setCurrentItem({
                nombre_producto: prefilledProduct.nombre_producto,
                categoria_producto: category,
                unidad: unit,
                cantidad_requerida: recommendedQty > 0 ? recommendedQty : '',
                precio_unitario_usd_aprox: existingPrice > 0 ? existingPrice : '',
                monto_dolares_aprox: (recommendedQty * existingPrice).toFixed(2)
            });

            showToast(`Producto sugerido cargado: ${prefilledProduct.nombre_producto}`, 'info');
        }
    }, [prefilledProduct, productos]);

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
            {/* Item Input Section */}
            <section className="requerimiento-item-grid">
            
            <div>
                
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

                   <div className="form-actions">

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
            </div>
             {/* Aqui va un componente y ver lo de no hay items agregados */}
            <div className='preview-item'>
                {itemsList.length > 0 && (
                    <div className="total-requerimiento-summary" style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', textAlign: 'right', border: '1px solid #ddd' }}>
                        <h3 style={{ margin: 0, color: '#333' }}>
                            Total del Requerimiento: <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>${itemsList.reduce((sum, item) => sum + (parseFloat(item.monto_dolares_aprox) || 0), 0).toFixed(2)}</span>
                        </h3>
                    </div>
                )}

                {!itemsList.length > 0 ?

                <h4>No hay items agregados</h4>
                
                :
                 (
               

                    
                     
                    <div className="items-list-container">
                            {itemsList.map((item, idx) => (
                                <div key={idx} className="item-card">
                                    <div className="item-info">
                                        <h4 className="product-name">{item.nombre_producto}</h4>
                                        <h4 className="product-details">{item.categoria_producto} - {item.unidad}</h4>
                                        <span className="badge-qty">Cant: {item.cantidad_requerida}</span>
                                    </div>
                                    
                                    <div className="item-values">
                                        <span className="price-tag">TOTAL:${item.monto_dolares_aprox}</span>
                                    </div>

                                    <button
                                        onClick={() => handleRemoveItemFromList(idx)}
                                        className="btn-remove-item"
                                        title="Eliminar"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                       
                  
                    </div>
                )}
               
               
            </div>

                

               
            </section>
         
        </main>
    );
};
