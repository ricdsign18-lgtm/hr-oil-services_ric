// src/components/modules/administracion/AdministracionMain.jsx
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../../contexts/ProjectContext";
import ModuleDescription from "../_core/ModuleDescription/ModuleDescription";
// import "./AdministracionMain.css";
import "../_core/ModuleDashboard/ModuleDashboard.css";
import {
  BankIcon,
  BudgetIcon,
  DashboarddIcon,
  SackDollarIcon,
  MultiUsersIcon,
} from "../../../assets/icons/Icons";
const AdministracionMain = ({ projectId }) => {
  const navigate = useNavigate();
  const { selectedProject } = useProjects();

  const mainCards = [
    {
      id: "gastos-administrativos",
      title: "GASTOS ADMINISTRATIVOS",
      description:
        "Gestión de nómina, logística, suministros y servicios generales",
      icon: <SackDollarIcon />,
      path: "gastos-administrativos",
    },
    {
      id: "ingresos-comisiones",
      title: "INGRESOS & COMISIONES",
      description: "Facturación, comisiones y distribución de dividendos",
      icon: <DashboarddIcon />,
      path: "ingresos-comisiones",
    },
    {
      id: "gastos-financieros",
      title: "GASTOS FINANCIEROS & BANCARIOS",
      description: "Conciliación bancaria y control de gastos financieros",
      icon: <BankIcon />,
      path: "gastos-financieros",
    },
    // {
    //   id: "gestion-usuarios",
    //   title: "GESTIÓN DE USUARIOS",
    //   description: "Administración de usuarios, roles y permisos",
    //   icon: <MultiUsersIcon />,
    //   path: "gestion-usuarios",
    // },
  ];

  const handleCardClick = (path) => {
    console.log("Navegando desde proyecto:", projectId, "a:", path);
    navigate(path);
  };

  return (
    <main className="modules-main">

      <ModuleDescription
        title="Módulo de Administración"
        description={`Gestión integral de los aspectos administrativos y financieros del proyecto ${selectedProject?.name || ""
          }`}
      />

      <section className="modules-main-grid">
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
      </section>
    </main>
  );
};

export default AdministracionMain;
