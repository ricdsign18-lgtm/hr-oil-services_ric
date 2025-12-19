import React from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../contexts/ProjectContext";
import ModuleDescription from "../_core/ModuleDescription/ModuleDescription";
// import "./ContratoMain.css";
import "../_core/ModuleDashboard/ModuleDashboard.css";
import { PagesIcon, SackDollarIcon } from "../../../assets/icons/Icons";

const ContratoMain = ({ projectId }) => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();

  const mainCards = [
    {
      id: "valuaciones",
      title: "VALUACIONES",
      description: "Administración y control de valuaciones del proyecto",
      icon: <PagesIcon />,
      path: "valuaciones",
    },
    {
      id: "presupuesto",
      title: "PRESUPUESTO",
      description: "Administración de presupuesto y partidas del contrato",
      icon: <SackDollarIcon />,
      path: "presupuesto",
    },
  ];

  const handleCardClick = (path) => {
    console.log("Navegando desde proyecto:", projectId, "a:", path);
    navigate(path);
  };

  return (
    <main className="modules-main">
      <ModuleDescription
        title="Módulo de Contrato"
        description={`Gestión integral de la documentación contractual del proyecto ${
          selectedProject?.name || ""
        }`}
      />

      <div className="modules-main-grid">
        {mainCards.map((card) => (
          <div
            key={card.id}
            className="modules-main-card"
            onClick={() => handleCardClick(card.path)}
          >
            <div className="modules-main-card-icon">{card.icon}</div>
            <div className="modules-main-card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <small>Proyecto: {selectedProject?.name || ""}</small>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default ContratoMain;
