import { useState, useMemo } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import ModuleDescription from '../../../_core/ModuleDescription/ModuleDescription';
import Modal from '../../../../common/Modal/Modal';
import RetirosTable from './RetirosTable';
import InventoryStats from './InventoryStats';
import './InventarioMain.css';

const InventarioMain = () => {
  const {
    inventory,
    loading,
    withdrawInventory,
    retiros,
    getLowStockItems,
    updateInventoryItem
  } = useOperaciones();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [withdrawData, setWithdrawData] = useState({
    cantidad_retirada: '',
    retirado_por: '',
    observaciones: '',
  });

  const lowStockItems = useMemo(() => getLowStockItems(), [getLowStockItems]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesCategory = filterCategory === 'all' || item.categoria_producto === filterCategory;
      const matchesSearch = item.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [inventory, filterCategory, searchTerm]);

  const categories = [...new Set(inventory.map(item => item.categoria_producto))];

  const groupedInventory = useMemo(() => {
    return filteredInventory.reduce((acc, item) => {
      const category = item.categoria_producto || 'Sin Categoría';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [filteredInventory]);

  const handleOpenWithdrawModal = (item) => {
    setSelectedItem(item);
    setShowWithdrawModal(true);
  };

  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
    setSelectedItem(null);
    setWithdrawData({
      cantidad_retirada: '',
      retirado_por: '',
      observaciones: '',
    });
  };

  const handleWithdrawChange = (e) => {
    const { name, value } = e.target;
    setWithdrawData(prev => ({ ...prev, [name]: value }));
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    await withdrawInventory({
      inventario_id: selectedItem.id,
      ...withdrawData,
    });

    handleCloseWithdrawModal();
  };

  const handleStockObjetivoChange = (itemId, value) => {
    const newTarget = parseInt(value, 10);
    if (!isNaN(newTarget) && newTarget >= 0) {
      updateInventoryItem(itemId, { stock_objetivo: newTarget });
    }
  };

  return (
    <div className="inventario-main">
      <ModuleDescription
        title="Inventario de Operaciones"
        description="Materiales, equipos y suministros disponibles en stock."
      />

      <InventoryStats
        inventory={inventory}
        lowStockItems={lowStockItems}
      />

      <div className="inventory-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="low-stock-alert">
          <h4>⚠️ Productos con Bajo Stock</h4>
          <div className="low-stock-items">
            {lowStockItems.map(item => (
              <span key={item.id} className="low-stock-badge">
                {item.nombre_producto} ({item.cantidad_disponible} {item.unidad})
              </span>
            ))}
          </div>
        </div>
      )}

      {loading && <p>Cargando inventario...</p>}

      {!loading && Object.keys(groupedInventory).map(category => (
        <div key={category} className="inventory-category">
          <h3>{category}
            <span className="category-count">
              ({groupedInventory[category].length} items)
            </span>
          </h3>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Unidad</th>
                <th>Stock Disponible</th>
                <th>Stock Objetivo</th>
                <th>Prioridad</th>
                <th>Precio Aprox. USD</th>
                <th>Estado</th>
                <th>Última Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groupedInventory[category].map(item => {
                const isLowStock = lowStockItems.some(lowItem => lowItem.id === item.id);
                const isOutOfStock = item.cantidad_disponible <= 0;
                return (
                  <tr key={item.id} className={isLowStock ? 'low-stock-row' : ''}>
                    <td>{item.nombre_producto}</td>
                    <td>{item.unidad}</td>
                    <td className={isLowStock ? 'low-stock' : ''}>
                      {item.cantidad_disponible}
                    </td>
                    <td>
                      <input
                        type="number"
                        defaultValue={item.stock_objetivo || 0}
                        onBlur={(e) => handleStockObjetivoChange(item.id, e.target.value)}
                        min="0"
                        className="stock-objetivo-input"
                      />
                    </td>
                    <td>
                      <select
                        value={item.prioridad || 'Media'}
                        onChange={(e) => updateInventoryItem(item.id, { prioridad: e.target.value })}
                        className="prioridad-select"
                      >
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </td>
                    <td>{`$${parseFloat(item.precio_unitario_usd_aprox || 0).toFixed(2)}`}</td>
                    <td>
                      {isOutOfStock ? (
                        <span className="status-badge danger">Sin Stock</span>
                      ) : isLowStock ? (
                        <span className="status-badge warning">Bajo Stock</span>
                      ) : (
                        <span className="status-badge success">Disponible</span>
                      )}
                    </td>
                    <td>{new Date(item.last_updated.replace(/-/g, '/')).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleOpenWithdrawModal(item)}
                        className="btn-withdraw"
                        disabled={isOutOfStock}
                      >
                        {isOutOfStock ? 'Sin Stock' : 'Retirar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {!loading && inventory.length === 0 && (
        <div className="empty-state">
          <p>No hay productos en el inventario para este proyecto.</p>
        </div>
      )}

      {showWithdrawModal && (
        <Modal isOpen={showWithdrawModal} title={`Retirar ${selectedItem?.nombre_producto}`} onClose={handleCloseWithdrawModal}>
          <form onSubmit={handleWithdrawSubmit} className="withdraw-form">
            <div className="form-group">
              <label>Cantidad a Retirar (Disponible: {selectedItem?.cantidad_disponible})</label>
              <input
                type="number"
                name="cantidad_retirada"
                value={withdrawData.cantidad_retirada}
                onChange={handleWithdrawChange}
                required
                min="1"
                max={selectedItem?.cantidad_disponible}
              />
            </div>
            <div className="form-group">
              <label>Retirado Por</label>
              <input
                type="text"
                name="retirado_por"
                value={withdrawData.retirado_por}
                onChange={handleWithdrawChange}
                required
                placeholder="Nombre de quien retira"
              />
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                name="observaciones"
                value={withdrawData.observaciones}
                onChange={handleWithdrawChange}
                placeholder="Motivo del retiro, área de uso, etc."
                rows="3"
              ></textarea>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Retiro'}
            </button>
          </form>
        </Modal>
      )}

      <RetirosTable retiros={retiros} />
    </div>
  );
};

export default InventarioMain;