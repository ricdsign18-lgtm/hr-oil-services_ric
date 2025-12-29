import React, { useState, useEffect } from "react";
import supabase from "../../../../../../../../api/supaBase";
import "./ContratistaForm.css";

const ContratistaForm = ({ projectId, contratista, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nombre_contratista: "",
        descripcion_trabajo: "",
        cantidad_personal: 1,
        frecuencia_pago: "Semanal",
        monto_diario: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (contratista) {
            setFormData({
                nombre_contratista: contratista.nombre_contratista,
                descripcion_trabajo: contratista.descripcion_trabajo || "",
                cantidad_personal: contratista.cantidad_personal || 1,
                frecuencia_pago: contratista.frecuencia_pago || "Semanal",
                monto_diario: contratista.monto_diario || "",
            });
        }
    }, [contratista]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                project_id: projectId,
                monto_diario: formData.monto_diario ? parseFloat(formData.monto_diario) : 0,
                cantidad_personal: parseInt(formData.cantidad_personal),
            };

            let error;
            if (contratista) {
                // Update
                const { error: updateError } = await supabase
                    .from("contratistas")
                    .update(payload)
                    .eq("id", contratista.id);
                error = updateError;
            } else {
                // Create
                const { error: insertError } = await supabase
                    .from("contratistas")
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;
            onSave(); // Trigger refresh in parent
            onClose(); // Close modal
        } catch (err) {
            console.error("Error saving contratista:", err);
            alert("Error al guardar el contratista: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="modal-overlay">
            <section className="modal-content">
                <h2>{contratista ? "Editar Contratista" : "Nuevo Contratista"}</h2>
                <form onSubmit={handleSubmit}>
                  
                        <label>Nombre del Contratista / Empresa:</label>
                        <input
                            type="text"
                            name="nombre_contratista"
                            value={formData.nombre_contratista}
                            onChange={handleChange}
                            required
                            placeholder="Ej. Servicios Eléctricos CA"
                        />
                

                    
                        <label>Descripción del Trabajo:</label>
                        <textarea
                            name="descripcion_trabajo"
                            value={formData.descripcion_trabajo}
                            onChange={handleChange}
                            rows="3"
                        />
                    

                    
                        <label>Cantidad de Personal:</label>
                        <input
                                type="number"
                                name="cantidad_personal"
                                value={formData.cantidad_personal}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        
                        <label>Frecuencia de Pago:</label>
                            <select
                                name="frecuencia_pago"
                                value={formData.frecuencia_pago}
                                onChange={handleChange}
                            >
                                <option value="Semanal">Semanal</option>
                                <option value="Quincenal">Quincenal</option>
                            </select>
                        
                    

                    
                        <label>Monto Diario ($):</label>
                        <input
                            type="number"
                            name="monto_diario"
                            value={formData.monto_diario}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            required
                        />
                    
                        <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
};

export default ContratistaForm;
