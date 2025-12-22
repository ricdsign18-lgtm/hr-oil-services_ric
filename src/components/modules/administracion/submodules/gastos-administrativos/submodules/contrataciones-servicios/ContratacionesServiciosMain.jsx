import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjects } from "../../../../../../../contexts/ProjectContext";
import supabase from "../../../../../../../api/supaBase";
import ModuleDescription from "../../../../../_core/ModuleDescription/ModuleDescription";
import "./ContratacionesServiciosMain.css";
import ContratistasList from "./components/ContratistasList";
import ContratistaForm from "./components/ContratistaForm";

const ContratacionesServiciosMain = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedProject } = useProjects();
    const projectId = location.state?.projectId || selectedProject?.id;

    const [showForm, setShowForm] = useState(false);
    const [selectedContratista, setSelectedContratista] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    const handleBack = () => {
        navigate(-1);
    };

    const handleEdit = (contratista) => {
        setSelectedContratista(contratista);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedContratista(null);
    };

    const handleSave = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div className="contrataciones-main">
            <div className="contrataciones-header">
                <div className="header-title-row">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h1 style={{ margin: 0 }}>Contrataciones y Servicios</h1>
                        </div>
                        <p className="subtitle">
                            Gestión de contratistas -{" "}
                            <span className="project-name">
                                {selectedProject?.name || "Proyecto"}
                            </span>
                        </p>
                    </div>
                    <button className="back-button-outline" onClick={handleBack}>
                        ← Volver
                    </button>
                </div>

                <div className="controls-row">
                    <div className="search-container-dark">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="search-icon"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar contratista..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-dark"
                        />
                    </div>

                    <button
                        className="btn-primary-new"
                        onClick={() => setShowForm(true)}
                    >
                        + Nuevo Contratista
                    </button>
                </div>
            </div>

            <div className="contrataciones-content">
                <ContratistasList
                    projectId={projectId}
                    onEdit={handleEdit}
                    refreshTrigger={refreshTrigger}
                    searchTerm={searchTerm}
                />
            </div>

            {showForm && (
                <ContratistaForm
                    projectId={projectId}
                    contratista={selectedContratista}
                    onClose={handleCloseForm}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default ContratacionesServiciosMain;
