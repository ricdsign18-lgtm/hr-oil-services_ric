import { BoxIcon, BudgetIcon, ClassificationIcon, WarningIcon, XIcon } from '../../../../../assets/icons/Icons';
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
      icon: <BoxIcon />,
      title: 'Total de Productos',
      number: totalItems,
    },
    {
      icon: <BudgetIcon />,
      title: 'Valor Total Estimado',
      number: `$${totalValue.toFixed(2)}`,
    },
    {
      icon: <ClassificationIcon />,
      title: 'Categorías',
      number: categories,
    },
    {
      icon: <WarningIcon />,
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
        <div className="stat-Card" key={index}>
          <h4>{card.title}</h4>
          <div className="stat-icon">
            {card.icon}
            <span className="stat-number">{card.number}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryStats;