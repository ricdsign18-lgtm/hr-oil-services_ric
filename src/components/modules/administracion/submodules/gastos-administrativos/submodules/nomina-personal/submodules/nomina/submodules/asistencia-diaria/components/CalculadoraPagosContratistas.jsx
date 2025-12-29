import React, { useState, useEffect } from "react";
import supabase from "../../../../../../../../../../../../api/supaBase";
import { usePersonal } from "../../../../../../../../../../../../contexts/PersonalContext";
import { useNotification } from "../../../../../../../../../../../../contexts/NotificationContext";
import "./CalculadoraContratistas.css"; 

const CalculadoraPagosContratistas = ({ projectId, fechaPago, tasaCambio, onGuardar, onCalcular, initialData }) => {
    const { showToast } = useNotification();
    const { getBancos, addBanco } = usePersonal();

    const [contratistas, setContratistas] = useState([]);
    const [loading, setLoading] = useState(false);

    // Aggregated Data
    const [diasTrabajados, setDiasTrabajados] = useState({}); // { cid: { lun: 5, ... } }
    
    // Payment Data
    const [bancosPago, setBancosPago] = useState({});
    const [observaciones, setObservaciones] = useState({});

    // Modal
    const [listaBancos, setListaBancos] = useState([]);
    const [showBancoModal, setShowBancoModal] = useState(false);
    const [nuevoBanco, setNuevoBanco] = useState("");
    const [empleadoBancoPending, setEmpleadoBancoPending] = useState(null);

    const allDaysOrder = ['sab', 'dom', 'lun', 'mar', 'mie', 'jue', 'vie'];
    const dayLabels = { sab: 'S', dom: 'D', lun: 'L', mar: 'M', mie: 'M', jue: 'J', vie: 'V' };

    // Load Initial (Banks, Contractors)
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const bancos = await getBancos();
                setListaBancos(bancos || []);
                if (projectId) await fetchContratistas();
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [projectId, getBancos]);

    // Fetch Attendance or load Initial Data (Edit Mode)
    useEffect(() => {
        if (!projectId || !fechaPago) return;
        
        const loadLogic = async () => {
             setLoading(true);
             try {
                // If editing historical payment (initialData present)
                if (initialData && initialData.pagos) {
                    const newDias = {};
                    const newBancos = {};
                    const newObs = {};

                    initialData.pagos.forEach(p => {
                        newDias[p.contratista_id] = p.dias_trabajados_detalle || {};
                        newBancos[p.contratista_id] = p.banco_pago || "";
                        newObs[p.contratista_id] = p.observaciones || "";
                    });
                    setDiasTrabajados(newDias);
                    setBancosPago(newBancos);
                    setObservaciones(newObs);
                } else {
                    // New Calculation -> Fetch Range from asistencia_contratistas
                     const fechaPagoDate = new Date(fechaPago + "T12:00:00"); 
                     const diaSemana = fechaPagoDate.getDay(); 
                     const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
                     const lunesSemana = new Date(fechaPagoDate);
                     lunesSemana.setDate(fechaPagoDate.getDate() + diffLunes);
                     const startOfWeek = new Date(lunesSemana);
                     startOfWeek.setDate(lunesSemana.getDate() - 2); // Start from Saturday

                     // Manual YYYY-MM-DD to avoid UTC shifts
                     const dateToYMD = (d) => {
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                     };

                     const startDateStr = dateToYMD(startOfWeek);
                     const endDateStr = fechaPago; // Already YYYY-MM-DD from input

                     console.log("Fetching Contractor Range:", startDateStr, "to", endDateStr);

                     const { data, error } = await supabase
                        .from("asistencia_contratistas")
                        .select("*")
                        .eq("project_id", projectId)
                        .gte("fecha", startDateStr)
                        .lte("fecha", endDateStr);

                     if (error) throw error;

                     // Aggregate
                     const agg = {};
                     (data || []).forEach(record => {
                          const rDate = new Date(record.fecha + "T12:00:00");
                          const dayKey = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][rDate.getDay()];
                          const cid = record.contratista_id;
                          
                          if (!agg[cid]) agg[cid] = { sab: 0, dom: 0, lun: 0, mar: 0, mie: 0, jue: 0, vie: 0 };
                          agg[cid][dayKey] = (agg[cid][dayKey] || 0) + (record.cantidad_personal_asistente || 0);
                     });
                     
                     // Replace diasTrabajados with fresh aggregated data
                     setDiasTrabajados(agg);
                }
             } catch (err) {
                 console.error(err);
                 showToast("Error cargando datos de pago", "error");
             } finally {
                 setLoading(false);
             }
        };

        loadLogic();
    }, [projectId, fechaPago, initialData]);

    const fetchContratistas = async () => {
        const { data } = await supabase.from("contratistas").select("*").eq("project_id", projectId).eq("activo", true).order("nombre_contratista");
        setContratistas(data || []);
    };

    // Calculations
    const calculateTotalPersonnelDays = (id) => {
        const days = diasTrabajados[id] || {};
        return allDaysOrder.reduce((acc, day) => acc + (days[day] || 0), 0);
    };
    const calculateTotalUSD = (c) => calculateTotalPersonnelDays(c.id) * (parseFloat(c.monto_diario) || 0);
    const calculateTotalBs = (usd) => usd * (parseFloat(tasaCambio) || 0);

    // Handlers
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
            if (empleadoBancoPending) setBancosPago(prev => ({ ...prev, [empleadoBancoPending]: added }));
            setShowBancoModal(false);
            setNuevoBanco("");
        } catch (e) { showToast("Error", "error"); }
    };

    const handleGuardar = async () => {
        // Validate
        if (!fechaPago) { showToast("Falta fecha pago", "warning"); return; }
        if (!tasaCambio || parseFloat(tasaCambio) <= 0) { showToast("Tasa de cambio inválida", "warning"); return; }

        const pagosDetalle = contratistas.map(c => {
             const diasC = diasTrabajados[c.id] || {};
             const total = calculateTotalPersonnelDays(c.id);
             if (total === 0) return null;

             return {
                 contratista_id: c.id,
                 nombre_contratista: c.nombre_contratista,
                 dias_trabajados_detalle: diasC,
                 total_personal_dias: total,
                 monto_diario: c.monto_diario,
                 monto_total_usd: calculateTotalUSD(c),
                 monto_total_bs: calculateTotalBs(calculateTotalUSD(c)),
                 banco_pago: bancosPago[c.id] || "",
                 observaciones: observaciones[c.id] || ""
             };
        }).filter(p => p !== null);

        if (pagosDetalle.length === 0) {
            if (onCalcular) { onCalcular([]); return; }
            showToast("No hay datos", "warning"); return;
        }

        // 1. Calculated Summary (New Payment Flow)
        if (onCalcular) {
            onCalcular(pagosDetalle);
            return;
        }

        // 2. Update Direct (Edit Mode)
        // Only update 'pagos_contratistas', NEVER 'asistencia_contratistas'
        const idToUpdate = initialData?.id;
        if (!idToUpdate) {
            showToast("Error: No hay ID para actualizar", "error");
            return;
        }

        const payload = {
            project_id: projectId,
            fecha_pago: fechaPago,
            tasa_cambio: parseFloat(tasaCambio),
            pagos: pagosDetalle
        };

        try {
            const { error } = await supabase
                .from("pagos_contratistas")
                .update(payload)
                .eq("id", idToUpdate);
            
            if (error) throw error;
            showToast("Pago actualizado", "success");
            if (onGuardar) onGuardar();

        } catch (err) {
            console.error(err);
            showToast("Error actualizando", "error");
        }
    };

    const totalGeneralUSD = contratistas.reduce((acc, c) => acc + calculateTotalUSD(c), 0);
    const totalGeneralBs = calculateTotalBs(totalGeneralUSD);

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="calculadora-contratistas">
            <h3>Nómina de Contratistas</h3>
            <div className="table-responsive">
                <table className="contratistas-pay-table">
                    <thead>
                        <tr>
                            <th className="text-left">Contratista</th>
                            <th className="text-center">Detalle Asistencia (Personas x Día)</th>
                            <th className="text-right">Monto Diario ($)</th>
                            <th className="text-right">Total ($)</th>
                            <th className="text-right">Total (Bs)</th>
                            <th className="text-left">Banco</th>
                            <th className="text-left">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contratistas.map(c => (
                            <tr key={c.id}>
                                <td>
                                    <div className="c-name">{c.nombre_contratista}</div>
                                    <div className="c-desc">{c.descripcion_trabajo}</div>
                                </td>
                                <td>
                                    <div className="daily-breakdown-readonly">
                                        {allDaysOrder.map(day => {
                                             const val = diasTrabajados[c.id]?.[day] || 0;
                                             return (
                                                 <div key={day} className="day-val-item">
                                                     <span className="day-label-sm">{dayLabels[day]}</span>
                                                     <span className={`day-val-num ${val > 0 ? 'has-val' : ''}`}>{val}</span>
                                                 </div>
                                             );
                                        })}
                                    </div>
                                </td>
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
                                        {listaBancos.map(b => <option key={b} value={b}>{b}</option>)}
                                        <option value="Otro">+ Nuevo</option>
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className="observacion-input"
                                        value={observaciones[c.id] || ""}
                                        onChange={(e) => setObservaciones(prev => ({...prev, [c.id]: e.target.value}))}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="text-right label-total">TOTALES:</td>
                            <td className="text-right val-total">$ {totalGeneralUSD.toFixed(2)}</td>
                            <td className="text-right val-total">Bs {totalGeneralBs.toFixed(2)}</td>
                            <td colSpan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="actions-footer">
                <button className="btn-save-pay" onClick={handleGuardar}>
                    {onCalcular ? "Reservar y Ver Resumen Total" : "Actualizar Pagos"}
                </button>
            </div>
            {/* Modal skipped for brevity but logic is there */}
            {showBancoModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>Agregar Banco</h4>
                        <input value={nuevoBanco} onChange={e => setNuevoBanco(e.target.value)} autoFocus />
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

export default CalculadoraPagosContratistas;
