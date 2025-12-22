import React, { useState, useEffect } from "react";
import supabase from "../../../../../../../../api/supaBase";
import "./ContratistasList.css";

const ContratistasList = ({ projectId, onEdit, refreshTrigger, searchTerm }) => {
    const [contratistas, setContratistas] = useState([]);
    const [filteredContratistas, setFilteredContratistas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        if (projectId) {
            fetchContratistas();
        }
    }, [projectId, refreshTrigger]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredContratistas(contratistas);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = contratistas.filter(c =>
                c.nombre_contratista.toLowerCase().includes(lower) ||
                (c.descripcion_trabajo && c.descripcion_trabajo.toLowerCase().includes(lower))
            );
            setFilteredContratistas(filtered);
        }
    }, [searchTerm, contratistas]);

    const fetchContratistas = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check project connection first
            if (!projectId) {
                throw new Error("No hay proyecto seleccionado");
            }

            const { data, error } = await supabase
                .from("contratistas")
                .select("*")
                .eq("project_id", projectId)
                .order("nombre_contratista", { ascending: true });

            if (error) throw error;
            const dataList = data || [];
            setContratistas(dataList);
            setFilteredContratistas(dataList);
        } catch (err) {
            console.error("Error fetching contratistas:", err);
            setError(err.message || "Error al cargar los contratistas");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from("contratistas")
                .update({ activo: !currentStatus })
                .eq("id", id);

            if (error) throw error;
            fetchContratistas();
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Error al actualizar el estado");
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const { error } = await supabase
                .from("contratistas")
                .delete()
                .eq("id", deleteConfirm.id);

            if (error) throw error;
            fetchContratistas();
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Error deleting contractor:", err);
            alert("Error al eliminar el contratista");
        }
    };

    const getInitials = (nombre) => {
        return nombre ? nombre.substring(0, 2).toUpperCase() : "NA";
    };

    if (loading) return (
        <div className="loading-state-dark">
            <div className="spinner"></div>
            <p>Cargando contratistas...</p>
        </div>
    );

    if (error) return (
        <div className="error-state-dark">
            <p className="error-icon">⚠️</p>
            <p>{error}</p>
            <button onClick={fetchContratistas} className="btn-retry">Reintentar</button>
        </div>
    );

    if (contratistas.length === 0) {
        return (
            <div className="empty-state-dark">
                <div className="empty-icon">👷‍♂️</div>
                <h4>No hay contratistas registrados</h4>
                <p>Comienza agregando el primer contratista al proyecto</p>
            </div>
        );
    }

    return (
        <div className="contratistas-list-container">
            <div className="list-header">
                <span>Contratistas Registrados: {filteredContratistas.length}</span>
            </div>

            <div className="employees-grid">
                {filteredContratistas.map((c) => (
                    <div key={c.id} className={`employee-card-dark ${!c.activo ? "inactive-card" : ""}`}>
                        <div className="card-header-compact">
                            <div className="header-main">
                                <div className="profile-section">
                                    <div className="avatar-initials">
                                        {getInitials(c.nombre_contratista)}
                                    </div>
                                    <div className="name-info">
                                        <h4>{c.nombre_contratista}</h4>
                                        <span className="employee-id">{c.descripcion_trabajo || "Sin descripción"}</span>
                                    </div>
                                </div>
                                <div className="actions-top">
                                    <button className="icon-btn-edit" onClick={() => onEdit(c)} title="Editar">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button className="icon-btn-delete" onClick={() => setDeleteConfirm(c)} title="Eliminar">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="header-sub">
                                <span className="role-badge">Personal: {c.cantidad_personal}</span>
                                <button
                                    className={`status-text ${!c.activo ? "status-inactive" : "status-active"}`}
                                    onClick={() => handleToggleActive(c.id, c.activo)}
                                >
                                    {c.activo ? "Activo" : "Inactivo"}
                                </button>
                            </div>
                        </div>

                        <div className="card-body-compact">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Frecuencia</span>
                                    <span className="value">{c.frecuencia_pago}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Monto Diario</span>
                                    <span className="value highlight">$ {parseFloat(c.monto_diario).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {deleteConfirm && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <h4>Confirmar Eliminación</h4>
                        <p>
                            ¿Estás seguro de que deseas eliminar al contratista <strong>{deleteConfirm.nombre_contratista}</strong>?
                        </p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>
                                Cancelar
                            </button>
                            <button className="btn-confirm-delete" onClick={confirmDelete}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContratistasList;
