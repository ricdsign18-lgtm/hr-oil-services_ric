import './ActivityList.css'

const ActivityList = ({ activities }) => {
  return (
    <div className="activity-list">
      {activities.map((activity, index) => (
        <div key={activity.id || index} className="activity-item">
          <div className="activity-content">
            <div className="activity-action">{activity.action}</div>
            <div className="activity-meta">
              <span className="activity-user">{activity.user}</span>
              <span className="activity-time">{activity.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityList