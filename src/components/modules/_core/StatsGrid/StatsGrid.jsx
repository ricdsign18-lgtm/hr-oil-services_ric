import './StatsGrid.css'

const StatsGrid = ({ stats }) => {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-info">
            <h3>{stat.title}</h3>
            <div className="stat-value">{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsGrid