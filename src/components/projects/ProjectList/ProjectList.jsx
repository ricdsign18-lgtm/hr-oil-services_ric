import React, { useRef } from 'react'
import ProjectCard from '../ProjectCard/ProjectCard'
import { AddIcon } from '../../../assets/icons/Icons'
import './ProjectList.css'

const ProjectList = ({ projects, onEdit, onDelete, onSelect, onAdd }) => {
  const listRef = useRef(null);

  const scrollLeft = () => {
    if (listRef.current) {
      listRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (listRef.current) {
      listRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const AddCard = () => (
    <div className="project-card-add" onClick={onAdd}>
      <div className="add-card-icon">
        <AddIcon />
      </div>
      <h3>Crear nuevo proyecto</h3>
    </div>
  );

  if (projects.length === 0) {
    return (
      <div className="project-list-container">
        <div className="project-list" ref={listRef}>
          <AddCard />
        </div>
      </div>
    );
  }

  return (
    <div className="project-list-container">
      {/* Botones de navegación para móvil */}
      <button className="carousel-nav-btn prev-btn" onClick={scrollLeft} aria-label="Anterior">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div className="project-list" ref={listRef}>
        <AddCard />
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
          />
        ))}
      </div>

      <button className="carousel-nav-btn next-btn" onClick={scrollRight} aria-label="Siguiente">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
};

export default ProjectList;