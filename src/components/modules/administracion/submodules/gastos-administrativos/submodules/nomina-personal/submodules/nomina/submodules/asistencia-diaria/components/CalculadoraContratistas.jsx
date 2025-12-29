import React, { useState, useEffect } from "react";
import supabase from "../../../../../../../../../../../../api/supaBase";
import { usePersonal } from "../../../../../../../../../../../../contexts/PersonalContext";
import { useNotification } from "../../../../../../../../../../../../contexts/NotificationContext";
import "./CalculadoraContratistas.css";

const CalculadoraContratistas = ({ projectId, fechaPago, tasaCambio, onGuardar, onCalcular, initialData, showAmounts = true, visibleDay = null }) => {
    const { showToast } = useNotification();
    const { getBancos, addBanco } = usePersonal();

    const [contratistas, setContratistas] = useState([]);
    const [loading, setLoading] = useState(false);

    // State to track personnel count per day per contractor.
    // Format: { [contractorId]: { sab: 5, dom: 5, lun: 5, ... } }
    const [diasTrabajados, setDiasTrabajados] = useState({});
    // State to track if a day is active (checked) explicitly, independent of value
    const [activeDays, setActiveDays] = useState({});

    // Banks and Observations State
    const [listaBancos, setListaBancos] = useState([]);
    const [bancosPago, setBancosPago] = useState({});
    const [observaciones, setObservaciones] = useState({});

    // Modal state for adding new bank
    const [showBancoModal, setShowBancoModal] = useState(false);
    const [nuevoBanco, setNuevoBanco] = useState("");
    const [empleadoBancoPending, setEmpleadoBancoPending] = useState(null);

    // Days in order: S D L M M J V
    const allDaysOrder = ['sab', 'dom', 'lun', 'mar', 'mie', 'jue', 'vie'];
    // Filter days if visibleDay is provided
    const daysOrder = visibleDay ? allDaysOrder.filter(d => d === visibleDay) : allDaysOrder;
    
    // NEW STATE: Track existing record ID for updates
    const [existingRecordId, setExistingRecordId] = useState(null);

    const dayLabels = {
        sab: 'S', dom: 'D', lun: 'L', mar: 'M', mie: 'M', jue: 'J', vie: 'V'
    };

    // Load banks and contractors
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const bancos = await getBancos();
                setListaBancos(bancos || []);

                if (projectId) {
                    await fetchContratistas();
                }
            } catch (err) {
                console.error(err);
                showToast("Error iniciando datos", "error");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [projectId, getBancos]);

    // NEW EFFECT: Fetch Daily Attendance (From 'asistencia_contratistas')
    useEffect(() => {
        const fetchDailyAttendance = async () => {
             // Only fetch if we are in Payroll mode (showAmounts=true), have a project, date, and NOT editing historical payroll
             // OR if we are in Daily Mode (visibleDay is present)
             if ((!showAmounts && !visibleDay) || !projectId || !fechaPago || initialData) return;

             setLoading(true);
             try {
                 let attendanceData = [];
                 
                 if (visibleDay) {
                    // DAILY MODE: Fetch specific day
                    const { data, error } = await supabase
                        .from("asistencia_contratistas")
                        .select("*")
                        .eq("project_id", projectId)
                        .eq("fecha", fechaPago); // Exact match for the day
                    
                    if (error) throw error;
                    attendanceData = data || [];
                    
                    setExistingRecordId(null); 

                 } else {
                     // WEEKLY/PAYROLL MODE
                     const fechaPagoDate = new Date(fechaPago + "T12:00:00"); 
                     const diaSemana = fechaPagoDate.getDay(); 
                     
                     const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
                     const lunesSemana = new Date(fechaPagoDate);
                     lunesSemana.setDate(fechaPagoDate.getDate() + diffLunes);
                     
                     const startOfWeek = new Date(lunesSemana);
                     startOfWeek.setDate(lunesSemana.getDate() - 2);

                     const startDateStr = startOfWeek.toISOString().split('T')[0];
                     const endDateStr = fechaPago; 

                     console.log("Fetching Contractor Attendance for Range:", startDateStr, "to", endDateStr);

                     const { data, error } = await supabase
                        .from("asistencia_contratistas")
                        .select("*")
                        .eq("project_id", projectId)
                        .gte("fecha", startDateStr)
                        .lte("fecha", endDateStr);
                     
                     if (error) throw error;
                     attendanceData = data || [];
                 }

                 // Aggregate Data
                 const aggregatedDays = {};
                 const aggregatedObs = {};
                 const aggregatedActive = {}; 
                 
                 attendanceData.forEach(record => {
                     // Determine day key
                     const rDate = new Date(record.fecha + "T12:00:00");
                     const rDayMap = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
                     const dayKey = rDayMap[rDate.getDay()]; 
                     const cId = record.contratista_id;

                     if (!aggregatedDays[cId]) {
                         aggregatedDays[cId] = { sab: 0, dom: 0, lun: 0, mar: 0, mie: 0, jue: 0, vie: 0 };
                     }
                     if (!aggregatedActive[cId]) {
                         aggregatedActive[cId] = { sab: false, dom: false, lun: false, mar: false, mie: false, jue: false, vie: false };
                     }

                     const count = record.cantidad_personal_asistente || 0;
                     const asistio = record.asistio;

                     aggregatedDays[cId][dayKey] = count;
                     // Only mark as active if asistio is true? Or if record exists?
                     // If asistio is false but record exists, technically "active" means "checkbox checked" in UI which usually implies attendance.
                     // The user requirement "asistio boolean not null default false" implies unchecked = false.
                     if (asistio) {
                         aggregatedActive[cId][dayKey] = true;
                     }

                     if (visibleDay && record.observaciones) {
                         aggregatedObs[cId] = record.observaciones;
                     }
                 });

                 setDiasTrabajados(prev => {
                     const updated = { ...prev };
                     Object.keys(aggregatedDays).forEach(cId => {
                         updated[cId] = { ...updated[cId], ...aggregatedDays[cId] };
                     });
                     return updated;
                 });
                 
                 setActiveDays(prev => {
                     const updated = { ...prev };
                     Object.keys(aggregatedActive).forEach(cId => {
                         if (!updated[cId]) updated[cId] = {};
                         Object.keys(aggregatedActive[cId]).forEach(day => {
                             if (aggregatedActive[cId][day]) {
                                 updated[cId][day] = true;
                             }
                         });
                     });
                     return updated;
                 });

                 if (visibleDay) {
                     setObservaciones(prev => ({ ...prev, ...aggregatedObs }));
                 }

             } catch (err) {
                 console.error("Error fetching daily attendance:", err);
                 showToast("Error cargando asistencia de contratistas", "error");
             } finally {
                 setLoading(false);
             }
        };

        fetchDailyAttendance();
    }, [projectId, fechaPago, showAmounts, initialData, visibleDay]);


    // Populate form if editing (Existing Effect)
    useEffect(() => {
        if (initialData && initialData.pagos && contratistas.length > 0) {
            const newDias = { ...diasTrabajados };
            const newActive = { ...activeDays };
            const newBancos = {};
            const newObs = {};

            initialData.pagos.forEach(p => {
                // Check if contractor still exists/is active implicitly by checking if key exists or just set it
                // We'll set it regardless, assuming historical data is valid
                if (p.contratista_id) {
                    newDias[p.contratista_id] = p.dias_trabajados_detalle || {};
                    // Initialize active state based on existing values > 0
                    newActive[p.contratista_id] = {};
                    daysOrder.forEach(day => {
                        const val = p.dias_trabajados_detalle?.[day];
                        newActive[p.contratista_id][day] = val > 0;
                    });

                    newBancos[p.contratista_id] = p.banco_pago || "";
                    newObs[p.contratista_id] = p.observaciones || "";
                }
            });

            setDiasTrabajados(prev => ({ ...prev, ...newDias }));
            setActiveDays(prev => ({ ...prev, ...newActive }));
            setBancosPago(newBancos);
            setObservaciones(newObs);

            // Note: date and rate are handled by parent state passed in as props
        }
    }, [initialData, contratistas]);

    const fetchContratistas = async () => {
        try {
            const { data, error } = await supabase
                .from("contratistas")
                .select("*")
                .eq("project_id", projectId)
                .eq("activo", true)
                .order("nombre_contratista");

            if (error) throw error;
            setContratistas(data || []);

            // Initialize count state
            const initialDias = {};
            const initialActive = {};
            (data || []).forEach(c => {
                initialDias[c.id] = {};
                initialActive[c.id] = {};
                daysOrder.forEach(day => {
                    initialDias[c.id][day] = 0;
                    initialActive[c.id][day] = false;
                });
            });
            // Don't overwrite if we already have aggregated data!!
            setDiasTrabajados(prev => { 
                // Only initialize if empty to avoid wiping fetched attendance
                if (Object.keys(prev).length === 0) return initialDias;
                return prev;
            });
             setActiveDays(prev => { 
                if (Object.keys(prev).length === 0) return initialActive;
                return prev;
            });

        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const handleBancoChange = (id, valor) => {
        if (valor === "Otro") {
            setEmpleadoBancoPending(id);
            setNuevoBanco("");
            setShowBancoModal(true);
        } else {
            setBancosPago(prev => ({ ...prev, [id]: valor }));
        }
    };

    const handleAddBanco = async () => {
        if (!nuevoBanco.trim()) return;
        try {
            const added = await addBanco(nuevoBanco.trim());
            setListaBancos(prev => [...prev, added].sort());
            if (empleadoBancoPending) {
                setBancosPago(prev => ({ ...prev, [empleadoBancoPending]: added }));
            }
            setShowBancoModal(false);
            setEmpleadoBancoPending(null);
            setNuevoBanco("");
        } catch (error) {
            showToast("Error agregando banco", "error");
        }
    };

    const handleObservacionChange = (id, valor) => {
        setObservaciones(prev => ({ ...prev, [id]: valor }));
    };

    const handleDayCheck = (id, day, isChecked, maxVal) => {
        setActiveDays(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [day]: isChecked
            }
        }));
        
        setDiasTrabajados(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [day]: 0 // Start with 0 (empty placeholder) instead of maxVal
            }
        }));
    };

    const handleDayChange = (id, day, value) => {
        const numValue = parseInt(value) || 0;
        
        // Find Contractor limit
        const contractor = contratistas.find(c => c.id === id);
        const maxLimit = contractor ? (contractor.cantidad_personal || 999) : 999;

        if (numValue > maxLimit) {
            showToast(`El límite de personal para ${contractor?.nombre_contratista || 'este contratista'} es ${maxLimit}`, "error");
            // Do not update state if exceeds
            return;
        }

        setDiasTrabajados(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [day]: numValue
            }
        }));
    };

    const calculateTotalPersonnelDays = (id) => {
        const days = diasTrabajados[id];
        if (!days) return 0;
        return daysOrder.reduce((acc, day) => acc + (days[day] || 0), 0);
    };

    const calculateTotalUSD = (contratista) => {
        const totalPersonnelDays = calculateTotalPersonnelDays(contratista.id);
        return totalPersonnelDays * (parseFloat(contratista.monto_diario) || 0);
    };

    const calculateTotalBs = (totalUSD) => {
        return totalUSD * (parseFloat(tasaCambio) || 0);
    };

    const handleGuardar = async () => {
        console.log("handleGuardar triggered");
        console.log("Props:", { projectId, fechaPago, tasaCambio, showAmounts, onCalcular: !!onCalcular });

        if (!fechaPago || (showAmounts && (!tasaCambio || parseFloat(tasaCambio) <= 0))) {
            if(!fechaPago) {
                 showToast("Complete la fecha de pago", "warning");
                 return;
            }
            if(showAmounts && (!tasaCambio || parseFloat(tasaCambio) <= 0)) {
                showToast("Por favor ingrese una tasa de cambio válida para calcular los pagos en Bolívares", "warning");
                return;
            }
        }
        
        // 1. PAYROLL MODE: Process Data for Summary (JSON style)
        if (onCalcular) {
             const pagosDetalle = contratistas.map(c => {
                 const diasC = diasTrabajados[c.id];
                 const totalPersonnel = calculateTotalPersonnelDays(c.id);
                 if (totalPersonnel === 0) return null;
                 
                 return {
                     contratista_id: c.id,
                     nombre_contratista: c.nombre_contratista,
                     dias_trabajados_detalle: diasC, 
                     total_personal_dias: totalPersonnel,
                     monto_diario: c.monto_diario,
                     monto_total_usd: calculateTotalUSD(c),
                     monto_total_bs: calculateTotalBs(calculateTotalUSD(c)),
                     banco_pago: bancosPago[c.id] || "",
                     observaciones: observaciones[c.id] || ""
                 };
             }).filter(p => p !== null);

             console.log("Delegating to onCalcular...", pagosDetalle);
             
             if (pagosDetalle.length === 0) {
                 // Even if empty, we might want to proceed to see 0 totals
                 onCalcular([]);
                 return;
             }
             
             onCalcular(pagosDetalle);
             return; // Stop here, do NOT save to DB yet
        }

        // 2. DAILY MODE: Direct Save to DB (asistencia_contratistas)
        // We do UPSERT based on unique constraint (project_id, contratista_id, fecha)
        if (visibleDay) {
            const upsertPayload = contratistas.map(c => {
                const isChecked = activeDays[c.id]?.[visibleDay] || false;
                const quantity = diasTrabajados[c.id]?.[visibleDay] || 0;
                const obs = observaciones[c.id] || "";
                
                return {
                    project_id: projectId,
                    contratista_id: c.id,
                    fecha: fechaPago,
                    asistio: isChecked,
                    cantidad_personal_asistente: quantity,
                    observaciones: obs
                };
            });

            console.log("Saving to asistencia_contratistas... Payload:", upsertPayload);

            try {
                const { error } = await supabase
                    .from("asistencia_contratistas")
                    .upsert(upsertPayload, { onConflict: 'project_id, contratista_id, fecha' });

                if (error) throw error;

                showToast("Asistencia guardada exitosamente", "success");
                if (onGuardar) onGuardar();

            } catch (err) {
                console.error(err);
                showToast("Error al guardar asistencia: " + err.message, "error");
            }
        } else {
             // 3. EDIT PAYMENT MODE: Update Snapshot in 'pagos_contratistas'
             // This runs when !visibleDay and !onCalcular (Editing an existing payment record)
             // We MUST NOT touch 'asistencia_contratistas' here, enabling independence.
             
             // Re-map pagosDetalle (already computed above)
             const payload = {
                project_id: projectId,
                fecha_pago: fechaPago,
                tasa_cambio: parseFloat(tasaCambio),
                pagos: pagosDetalle // The calculated snapshot
            };
            console.log("Updating Payment Snapshot (pagos_contratistas)... Payload:", payload);

            try {
                // If we are here, we expect 'initialData' or 'existingRecordId' to be present for an UPDATE.
                const idToUpdate = initialData?.id || existingRecordId;

                if (!idToUpdate) {
                     // Should not happen in standard flow, but handle safety
                     showToast("Error: No se identificó el registro para actualizar.", "error");
                     return;
                }

                const { error } = await supabase
                    .from("pagos_contratistas")
                    .update(payload)
                    .eq("id", idToUpdate);
                
                if (error) throw error;

                showToast("Pago de contratistas actualizado exitosamente", "success");
                if (onGuardar) onGuardar();

            } catch (err) {
                console.error(err);
                showToast("Error al actualizar pago: " + err.message, "error");
            }
        }
    };

    // Helper to render total row
    const totalGeneralUSD = contratistas.reduce((acc, c) => acc + calculateTotalUSD(c), 0);
    const totalGeneralBs = calculateTotalBs(totalGeneralUSD);

    if (loading) return <div className="loading-text">Cargando...</div>;

    return (
        <div className="calculadora-contratistas">
            <h3>{visibleDay ? "Asistencia de Contratistas" : "Nómina de Contratistas"}</h3>

            <div className="table-responsive">
                <table className="contratistas-pay-table">
                    <thead>
                        <tr>
                            <th className="text-left">Contratista</th>
                            <th className="text-center">{showAmounts ? "Detalle Asistencia (Personas x Día)" : "Personal por Día"}</th>
                            {showAmounts && (
                                <>
                                    <th className="text-right">Monto Diario ($)</th>
                                    <th className="text-right">Total ($)</th>
                                    <th className="text-right">Total (Bs)</th>
                                    <th className="text-left">Banco</th>
                                </>
                            )}
                            <th className="text-left">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contratistas.map(c => (
                            <tr key={c.id}>
                                <td>
                                    <div className="c-name">{c.nombre_contratista}</div>
                                    <div className="c-desc">{c.descripcion_trabajo}</div>
                                    <div className="c-meta">Max Personal: {c.cantidad_personal}</div>
                                </td>
                                <td>
                                    {showAmounts ? (
                                         <div className="daily-breakdown-readonly">
                                            {daysOrder.map(day => {
                                                const val = diasTrabajados[c.id]?.[day] || 0;
                                                // Only show days with values or all? User said "cantidad de personas por dia".
                                                // Showing all keeps alignment.
                                                return (
                                                    <div key={day} className="day-val-item">
                                                        <span className="day-label-sm">{dayLabels[day]}</span>
                                                        <span className={`day-val-num ${val > 0 ? 'has-val' : ''}`}>{val}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="days-inputs">
                                            {daysOrder.map(day => {
                                                const currentVal = diasTrabajados[c.id]?.[day] || 0;
                                                const isChecked = activeDays[c.id]?.[day] || false;
                                                return (
                                                    <div key={day} className={`day-input-group ${visibleDay ? 'single-day-mode' : ''}`}>
                                                        {!visibleDay && <span className="day-label">{dayLabels[day]}</span>}
                                                        <div className="check-input-stack">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => handleDayCheck(c.id, day, e.target.checked, c.cantidad_personal)}
                                                                className="day-checkbox-small"
                                                            />
                                                            <input
                                                                type="number"
                                                                className={`day-number-input ${!isChecked ? 'dimmed' : ''}`}
                                                                value={(isChecked && currentVal > 0) ? currentVal : ''}
                                                                placeholder="0"
                                                                onChange={(e) => handleDayChange(c.id, day, e.target.value)}
                                                                min="0"
                                                                max={c.cantidad_personal || 999}
                                                                disabled={!isChecked}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </td>
                                {showAmounts && (
                                    <>
                                        {/* <td className="text-center font-bold stats-total-dias">
                                            {calculateTotalPersonnelDays(c.id)}
                                        </td> */}
                                        <td className="text-right">$ {parseFloat(c.monto_diario).toFixed(2)}</td>
                                        <td className="text-right font-bold">$ {calculateTotalUSD(c).toFixed(2)}</td>
                                        <td className="text-right font-bold">Bs {calculateTotalBs(calculateTotalUSD(c)).toFixed(2)}</td>
                                        <td>
                                            <select
                                                className="banco-select"
                                                value={bancosPago[c.id] || ""}
                                                onChange={(e) => handleBancoChange(c.id, e.target.value)}
                                            >
                                                <option value="">Seleccionar...</option>
                                                {listaBancos.map((b) => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                                <option value="Otro">+ Nuevo Banco</option>
                                            </select>
                                        </td>
                                    </>
                                )}
                                <td>
                                    <input
                                        type="text"
                                        className="observacion-input"
                                        placeholder="Observaciones..."
                                        value={observaciones[c.id] || ""}
                                        onChange={(e) => handleObservacionChange(c.id, e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {showAmounts && (
                        <tfoot>
                            <tr>
                                <td colSpan="3" className="text-right label-total">TOTALES:</td>
                                <td className="text-right val-total">$ {totalGeneralUSD.toFixed(2)}</td>
                                <td className="text-right val-total">Bs {totalGeneralBs.toFixed(2)}</td>
                                <td colSpan="2"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <div className="actions-footer">
                <button className="btn-save-pay" onClick={handleGuardar}>
                    {onCalcular ? "Reservar y Ver Resumen Total" : (existingRecordId ? "Actualizar Asistencia" : (initialData ? "Actualizar Pagos" : (visibleDay ? "Guardar Asistencia" : "Guardar Pagos de Contratistas")))}
                </button>
            </div>

            {/* Modal para agregar banco */}
            {showBancoModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>Agregar Nuevo Banco</h4>
                        <input
                            type="text"
                            value={nuevoBanco}
                            onChange={(e) => setNuevoBanco(e.target.value)}
                            placeholder="Nombre del banco"
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShowBancoModal(false)}>Cancelar</button>
                            <button className="confirm-btn" onClick={handleAddBanco}>Agregar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalculadoraContratistas;
