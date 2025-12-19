import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../../../contexts/ProjectContext'
import { useAuth } from '../../../contexts/AuthContext'
import ModuleDescription from '../_core/ModuleDescription/ModuleDescription'
import '../_core/ModuleDashboard/ModuleDashboard.css'
const CoordinacionesMain = ({ projectId }) => {
  const navigate = useNavigate()
  const { selectedProject } = useProjects()
  const { hasPermission } = useAuth()
  
  const mainCards = [
    { 
      id: 'reuniones', 
      title: 'REUNIONES', 
      description: 'Gestión de reuniones, agenda y participantes',
      icon: '📅',
      path: 'reuniones'
    },
    { 
      id: 'comunicaciones', 
      title: 'COMUNICACIONES', 
      description: 'Control de comunicaciones y correspondencia',
      icon: '✉️',
      path: 'comunicaciones'
    },
    { 
      id: 'coordinaciones', 
      title: 'COORDINACIONES', 
      description: 'Seguimiento de coordinaciones internas y externas',
      icon: '👥',
      path: 'coordinaciones'
    }
  ]

  const handleCardClick = (path) => {
    console.log('Navegando desde proyecto:', projectId, 'a:', path)
    navigate(path)
  }

  return (
    <div className="modules-main">
      <ModuleDescription 
        title="Módulo de Coordinaciones"
        description={`Gestión integral de comunicaciones y coordinaciones del proyecto ${selectedProject?.name || ''}`}
      />

      <div className="modules-main-grid">
        {mainCards.map(card => (
          <div 
            key={card.id}
            className="modules-main-card"
            onClick={() => handleCardClick(card.path)}
          >
            <div className="modules-main-card-icon">{card.icon}</div>
            <div className="modules-main-card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <small>Proyecto: {selectedProject?.name || ''}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas para usuarios con permisos */}
      {/* {hasPermission('coordinaciones', 'write') && (
        // <div className="quick-actions-section">
        //   <h3>Acciones Rápidas</h3>
        //   <div className="quick-actions-grid">
        //     <button className="quick-action-btn">
        //       <span className="action-icon">📅</span>
        //       <span>Programar Reunión</span>
        //     </button>
        //     <button className="quick-action-btn">
        //       <span className="action-icon">✉️</span>
        //       <span>Enviar Comunicado</span>
        //     </button>
        //     <button className="quick-action-btn">
        //       <span className="action-icon">👥</span>
        //       <span>Gestionar Participantes</span>
        //     </button>
        //   </div>
        // </div>
      )} */}
    </div>
  )
}

export default CoordinacionesMain