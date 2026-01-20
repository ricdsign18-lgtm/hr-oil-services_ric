import "./StatsCard.css";
const StatsCard = ({ title, value, variant = "primary", icon }) => {
  return (
    <div className={`common-stat-card ${variant}`}>
      <h4>{title}</h4>
      <div className="stat-content">
        {icon && <div className="stat-icon">{icon}</div>}
        <span className="stat-number">{value}</span>
      </div>
    </div>
  );
};

export default StatsCard;
