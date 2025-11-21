import React from 'react'
import './ModuleDescription.css'

const ModuleDescription = ({ title, description, action }) => {
  return (
    <div className="module-description">
      <div className="module-header-row">
        <h2>{title}</h2>
        {action && <div className="module-action">{action}</div>}
      </div>
      <p>{description}</p>
    </div>
  )
}

export default ModuleDescription