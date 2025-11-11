// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/NominaPersonalMain.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../contexts/ProjectContext";
import ModuleDescription from "../../../../../_core/ModuleDescription/ModuleDescription";
import "./NominaPersonalMain.css";
import {
  CalendarIcon,
  MultiUsersIcon,
  CashIcon,
} from "../../../../../../../assets/icons/Icons";

const NominaPersonalMain = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();

  const submodules = [
    {
      id: "registro-personal",
      title: "Registro de Personal",
      description: "Administra altas, bajas y modificaciones de los empleados.",
      icon: <MultiUsersIcon />,
      path: "registro-personal",
    },
    {
      id: "asistencia-diaria",
      title: "Asistencia Diaria",
      description: "Registra y controla la asistencia diaria del personal.",
      icon: <CalendarIcon />,
      path: "asistencia-diaria",
    },
    {
      id: "pagos-nomina",
      title: "Pagos de Nómina",
      description: "Genera y gestiona los pagos de nómina.",
      icon: <CashIcon />,
      path: "pagos-nomina",
    },
  ];

  const handleCardClick = (path) => {
    navigate(path);
  };

  const handleBack = () => {
    navigate(-1); // Volver a Gastos Administrativos
  };

  return (
    <div className="nomina-personal-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Gastos Administrativos
      </button>
      <ModuleDescription
        title="Nómina & Personal"
        description={`Gestión integral de recursos humanos, nómina y bienestar del personal - ${
          selectedProject?.name || ""
        }`}
      />
      e
      <div className="nomina-personal-grid">
        {submodules.map((submodule) => (
          <div
            key={submodule.id}
            className="nomina-personal-card"
            onClick={() => handleCardClick(submodule.path)}
          >
            <div className="nomina-card-icon">{submodule.icon}</div>
            <div className="nomina-card-content">
              <h3>{submodule.title}</h3>
              <p>{submodule.description}</p>
              {selectedProject && (
                <div className="project-badge">{selectedProject.name}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NominaPersonalMain;
