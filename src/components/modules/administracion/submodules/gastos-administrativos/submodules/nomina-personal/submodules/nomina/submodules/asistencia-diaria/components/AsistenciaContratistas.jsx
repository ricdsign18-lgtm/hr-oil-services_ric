import React, { useState, useEffect } from "react";
import supabase from "../../../../../../../../../../../../api/supaBase";
import { usePersonal } from "../../../../../../../../../../../../contexts/PersonalContext";
import { useNotification } from "../../../../../../../../../../../../contexts/NotificationContext";
import "./CalculadoraContratistas.css"; // Reuse CSS for now

const AsistenciaContratistas = ({ projectId, fecha, onGuardar }) => {
    const { showToast } = useNotification();
    const [contratistas, setContratistas] = useState([]);
    const [loading, setLoading] = useState(false);

    // State to track personnel count per day per contractor.
    // We only need single day, but reusing structure for consistency or simpler refactor
    const [diasTrabajados, setDiasTrabajados] = useState({});
    const [activeDays, setActiveDays] = useState({});
    const [observaciones, setObservaciones] = useState({});

    // We only care about the specific day passed in props
    // We can just use a simple key like 'val' or the day name if we want to reuse logic?
    // Let's use a constant 'current' key or just direct mapping. 
    // Actually, distinct from Calculadora, here we only show 1 day always.
    
    useEffect(() => {
        if (projectId && fecha) {
            loadData();
        }
    }, [projectId, fecha]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Load Contractors
            const { data: cData, error: cError } = await supabase
                .from("contratistas")
                .select("*")
                .eq("project_id", projectId)
                .eq("activo", true)
                .order("nombre_contratista");
            
            if (cError) throw cError;
            setContratistas(cData || []);

            // 2. Load Attendance for this day
            const { data: aData, error: aError } = await supabase
                .from("asistencia_contratistas")
                .select("*")
                .eq("project_id", projectId)
                .eq("fecha", fecha);

            if (aError) throw aError;

            // Map to state
            const initialDias = {};
            const initialActive = {};
            const initialObs = {};

            // Init defaults
            (cData || []).forEach(c => {
                initialDias[c.id] = 0;
                initialActive[c.id] = false;
                initialObs[c.id] = "";
            });

            // Fill with fetched data
            (aData || []).forEach(record => {
                if (initialDias.hasOwnProperty(record.contratista_id)) {
                    initialDias[record.contratista_id] = record.cantidad_personal_asistente || 0;
                    initialActive[record.contratista_id] = record.asistio;
                    initialObs[record.contratista_id] = record.observaciones || "";
                }
            });

            setDiasTrabajados(initialDias);
            setActiveDays(initialActive);
            setObservaciones(initialObs);

        } catch (err) {
            console.error(err);
            showToast("Error cargando datos", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCheck = (id, checked) => {
        setActiveDays(prev => ({ ...prev, [id]: checked }));
        if (!checked) {
             // Reset count to 0 if unchecked? Or keep it? The previous logic reset it.
             setDiasTrabajados(prev => ({ ...prev, [id]: 0 }));
        }
    };

    const handleCountChange = (id, value) => {
        const num = parseInt(value) || 0;
        const contractor = contratistas.find(c => c.id === id);
        const max = contractor?.cantidad_personal || 999;
        
        if (num > max) {
            showToast(`Límite excedido (${max})`, "error");
            return;
        }
        setDiasTrabajados(prev => ({ ...prev, [id]: num }));
    };

    const handleObsChange = (id, val) => {
        setObservaciones(prev => ({ ...prev, [id]: val }));
    };

    const handleSave = async () => {
        const upsertPayload = contratistas.map(c => ({
            project_id: projectId,
            contratista_id: c.id,
            fecha: fecha,
            asistio: activeDays[c.id] || false,
            cantidad_personal_asistente: diasTrabajados[c.id] || 0,
            observaciones: observaciones[c.id] || ""
        }));

        try {
            const { error } = await supabase
                .from("asistencia_contratistas")
                .upsert(upsertPayload, { onConflict: 'project_id, contratista_id, fecha' });

            if (error) throw error;
            showToast("Asistencia guardada", "success");
            if (onGuardar) onGuardar();
        } catch (err) {
            console.error(err);
            showToast("Error guardando asistencia", "error");
        }
    };

    if (loading) return <div className="loading-text">Cargando...</div>;

    return (
        <div className="calculadora-contratistas">
            <h3>Asistencia de Contratistas - {fecha}</h3>
            <div className="table-responsive">
                <table className="contratistas-pay-table">
                    <thead>
                        <tr>
                            <th className="text-left">Contratista</th>
                            <th className="text-center">Personal Asistente</th>
                            <th className="text-left">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contratistas.map(c => {
                            const isChecked = activeDays[c.id];
                            const count = diasTrabajados[c.id];
                            return (
                                <tr key={c.id}>
                                    <td>
                                        <div className="c-name">{c.nombre_contratista}</div>
                                        <div className="c-desc">{c.descripcion_trabajo}</div>
                                        <div className="c-meta">Max Personal: {c.cantidad_personal}</div>
                                    </td>
                                    <td>
                                        <div className="day-input-group single-day-mode">
                                            <div className="check-input-stack">
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => handleCheck(c.id, e.target.checked)}
                                                    className="day-checkbox-small"
                                                />
                                                <input
                                                    type="number"
                                                    className={`day-number-input ${!isChecked ? 'dimmed' : ''}`}
                                                    value={(isChecked && count > 0) ? count : ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleCountChange(c.id, e.target.value)}
                                                    disabled={!isChecked}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="observacion-input"
                                            value={observaciones[c.id] || ""}
                                            onChange={(e) => handleObsChange(c.id, e.target.value)}
                                            placeholder="Observaciones..."
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="actions-footer">
                <button className="btn-save-pay" onClick={handleSave}>
                    Guardar Asistencia
                </button>
            </div>
        </div>
    );
};

export default AsistenciaContratistas;
