import { BudgetIcon, XIcon } from '../../../../../assets/icons/Icons';
import './InventoryStats.css';

const InventoryStats = ({ inventory, lowStockItems }) => {
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => {
    const itemValue = (item.precio_unitario_usd_aprox || 0) * item.cantidad_disponible;
    return sum + itemValue;
  }, 0);
  const outOfStock = inventory.filter(item => item.cantidad_disponible <= 0).length;
  const categories = [...new Set(inventory.map(item => item.categoria_producto))].length;
  const inventoryCard = [
    {
      icon: '📦',
      title: 'Total de Productos',
      number: totalItems,
    },
    {
      icon: <BudgetIcon />,
      title: 'Valor Total Estimado',
      number: totalValue,
    },
    {
      icon: '🏷️',
      title: 'Categorías',
      number: categories,
    },
    {
      icon: Danger,
      title: 'Bajo Stock',
      number: lowStockItems.length,
    },
    {
      icon: <XIcon />,
      title: 'Sin Stock',
      number: outOfStock,
    },
  ]
  return (
    <div className="inventory-stats">
      {inventoryCard.map((card, index) => (
        <div className="stat-card" key={index}>
          <div className="stat-icon">{card.icon}</div>
          <h4>{card.title}</h4>
          <span className="stat-number">{card.number}</span>
        </div>
      ))}
    </div>
  );
};

export default InventoryStats;