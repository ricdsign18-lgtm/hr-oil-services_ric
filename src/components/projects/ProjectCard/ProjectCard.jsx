import React, { useState } from "react";
import Button from "../../common/Button/Button";
import { DelateIcon, EditIcon, ConstructionIcon } from "../../../assets/icons/Icons";
import "./ProjectCard.css";

const ProjectCard = ({ project, onEdit, onDelete, onSelect }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(project.id);
    setShowDeleteConfirm(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(project);
  };

  const formatCurrency = (amount, currency) => {
    const symbols = {
      USD: "$",
      BS: "Bs",
      EUR: "€",
    };
    // Format: € 1M (simplified for space)
    if (amount >= 1000000) {
        return `${symbols[currency] || ""} ${(amount / 1000000).toFixed(1)}M`;
    }
    return `${symbols[currency] || ""} ${amount?.toLocaleString() || "0"}`;
  };

  const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString.replace(/-/g, "/"));
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  }

  return (
    <div className="project-card" onClick={() => onSelect(project)}>
      <div className="project-card-top">
        <span className={`project-status-badge ${project.status === 'active' ? 'active' : 'inactive'}`}>
          {project.status === "active" ? "ACTIVO" : "INACTIVO"}
        </span>
        
        <div className="project-card-top-actions">
             <button className="icon-btn edit-btn" onClick={handleEdit} title="Editar">
                <EditIcon />
            </button>
            <button className="icon-btn delete-btn" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} title="Eliminar">
                <DelateIcon />
            </button>
            <div className="project-icon-container">
                <ConstructionIcon />
            </div>
        </div>
      </div>

      <div className="project-card-header">
        <h3 className="project-name">{project.name}</h3>
        <p className="project-client">Cliente: {project.client}</p>
      </div>

      <div className="project-card-divider"></div>

      <div className="project-card-details">
        <div className="detail-item">
            <span className="detail-label">PRESUPUESTO</span>
            <span className="detail-value-card">{formatCurrency(project.budget, project.currency)}</span>
        </div>
        <div className="detail-item">
            <span className="detail-label">INICIO</span>
            <span className="detail-value-card">{formatDate(project.startDate)}</span>
        </div>
        <div className="detail-item">
            <span className="detail-label">FIN</span>
            <span className="detail-value-card">{formatDate(project.endDate)}</span>
        </div>
      </div>

      <div className="project-card-footer">
        <Button onClick={(e) => { e.stopPropagation(); onSelect(project); }} className="btn-access">
          Acceder
        </Button>
      </div>

      {showDeleteConfirm && (
        <div className="project-card-delete-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="project-card-delete-modal">
            <h4>Confirmar Eliminación</h4>
            <p>
              ¿Estás seguro de que deseas eliminar el proyecto "{project.name}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="project-card-confirm-actions">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline"
              >
                Cancelar
              </Button>
              <Button onClick={handleDelete} className="btn-danger">
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
