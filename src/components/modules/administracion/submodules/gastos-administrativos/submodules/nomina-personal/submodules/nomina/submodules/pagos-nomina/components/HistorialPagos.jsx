import React, { useState } from "react";
import * as XLSX from "xlsx";
import supabase from "../../../../../../../../../../../../api/supaBase";
import { useNotification } from "../../../../../../../../../../../../contexts/NotificationContext";
import "./HistorialPagos.css";
import { DelateIcon, EditIcon, EyesIcon, ExportIcon } from "../../../../../../../../../../../../assets/icons/Icons";
import Modal from "../../../../../../../../../../../../components/common/Modal/Modal";

const HistorialPagos = ({ pagosGuardados, pagosContratistas, employees, onVerDetalles, onDeletePago, onEditarPago, selectedProject, onRefresh, onVerFactura }) => {
  const { showToast } = useNotification();
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // --- Helper Functions ---
  const calcularPeriodoPago = (empleado, fechaPago) => {
    const fecha = new Date(fechaPago.replace(/-/g, '\/')); 

    if (empleado.frecuenciaPago === "Semanal") {
      const lunes = new Date(fecha);
      const diaSemana = fecha.getDay();
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      lunes.setDate(fecha.getDate() + diffLunes);

      const viernes = new Date(lunes);
      viernes.setDate(lunes.getDate() + 4);

      return `Semana del ${lunes.toLocaleDateString("es-ES")} al ${viernes.toLocaleDateString("es-ES")}`;
    } else {
      const mes = fecha.getMonth();
      const año = fecha.getFullYear();
      const mitad = empleado.mitadPagoQuincenal || empleado.mitadPago || "primera";

      if (mitad === "primera") {
        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes, 15);
        return `Pago del ${primerDia.toLocaleDateString("es-ES")} al ${ultimoDia.toLocaleDateString("es-ES")}`;
      } else {
        const primerDia = new Date(año, mes, 16);
        const ultimoDia = new Date(año, mes + 1, 0);
        return `Pago del ${primerDia.toLocaleDateString("es-ES")} al ${ultimoDia.toLocaleDateString("es-ES")}`;
      }
    }
  };

  const calcularTotalesPago = (pago) => {
    if (!pago || !pago.pagos) return { totalUSD: 0, totalBs: 0, totalPagar: 0 };
    return pago.pagos.reduce(
      (totales, pagoEmp) => ({
        totalUSD: totales.totalUSD + (pagoEmp.montoTotalUSD || 0),
        totalBs: totales.totalBs + pagoEmp.subtotalBs,
        totalPagar: totales.totalPagar + pagoEmp.totalPagarBs + (pagoEmp.montoExtraBs || 0),
      }),
      { totalUSD: 0, totalBs: 0, totalPagar: 0 }
    );
  };

  const calculateContractorTotals = (pago) => {
    if (!pago || !pago.pagos) return { totalUSD: 0, totalBs: 0, count: 0 };
    const totalUSD = (pago.pagos || []).reduce((acc, p) => acc + (p.monto_total_usd || 0), 0);
    return {
      totalUSD: totalUSD,
      totalBs: totalUSD * (pago.tasa_cambio || 0),
      count: (pago.pagos || []).length
    };
  };

  // --- Refactored Export Logic ---
  
  const addEmployeeSheets = (wb, pago) => {
    const pagosSemanal = pago.pagos.filter(p => p.empleado.frecuenciaPago === "Semanal");
    const pagosQuincenal = pago.pagos.filter(p => p.empleado.frecuenciaPago === "Quincenal");

    const formatPagoData = (pagoEmp, includeLegalDeductions) => {
      const periodoPago = calcularPeriodoPago(pagoEmp.empleado, pago.fechaPago);
      const datos = {
        "Nombre del Trabajador": `${pagoEmp.empleado.nombre} ${pagoEmp.empleado.apellido}`,
        Cédula: pagoEmp.empleado.cedula,
        Cargo: pagoEmp.empleado.cargo,
        "Tipo Nómina": pagoEmp.empleado.tipoNomina,
        "Días Trab.": pagoEmp.diasTrabajados,
        "Monto Diario ($)": pagoEmp.montoDiarioCalculado?.toFixed(2) || "0.00",
        "H. Extra D.": pagoEmp.horasExtras.diurna,
        "H. Extra N.": pagoEmp.horasExtras.nocturna,
        "Monto H. Extra Total ($)": pagoEmp.totalHorasExtrasUSD.toFixed(2),
        "Deducciones ($)": pagoEmp.deduccionesManualesUSD.toFixed(2),
        "Total a Pagar ($)": pagoEmp.subtotalUSD.toFixed(2),
        "Tasa del Día": parseFloat(pago.tasaCambio).toFixed(4),
        "Total Pagar (Bs)": pagoEmp.totalPagarBs.toFixed(2),
        "Pagado por": pagoEmp.bancoPago || "No especificado",
        "Periodo de Pago": periodoPago,
        "Nombre del Contrato": selectedProject?.name || "No especificado",
        Observaciones: pagoEmp.observaciones || "",
      };

      if (includeLegalDeductions) {
        const esAdministrativo = ["Administrativa", "Ejecucion"].includes(pagoEmp.empleado.tipoNomina);
        datos["Porcentaje ISLR Individual (%)"] = esAdministrativo ? (pagoEmp.empleado.porcentajeIslr || "0") : "";
        datos["Deducciones Ley IVSS (Bs)"] = esAdministrativo ? (pagoEmp.desgloseDeduccionesLey?.ivss?.toFixed(2) || "0.00") : "";
        datos["Deducciones Ley Paro Forzoso (Bs)"] = esAdministrativo ? (pagoEmp.desgloseDeduccionesLey?.paroForzoso?.toFixed(2) || "0.00") : "";
        datos["Deducciones Ley FAOV (Bs)"] = esAdministrativo ? (pagoEmp.desgloseDeduccionesLey?.faov?.toFixed(2) || "0.00") : "";
        datos["Deducciones Ley ISLR (Bs)"] = esAdministrativo ? (pagoEmp.desgloseDeduccionesLey?.islr?.toFixed(2) || "0.00") : "";
        datos["Total Deducciones Ley (Bs)"] = esAdministrativo ? (pagoEmp.deduccionesLeyBs?.toFixed(2) || "0.00") : "";
      }

      return datos;
    };

    const hasAdmin = (lista) => lista.some(p => ["Administrativa", "Ejecucion"].includes(p.empleado.tipoNomina));

    // Sheet 1: General Summary
    const generalHasAdmin = hasAdmin(pago.pagos);
    const generalData = pago.pagos.map(p => formatPagoData(p, generalHasAdmin));
    const wsGeneral = XLSX.utils.json_to_sheet(generalData);
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Personal - General");

    // Sheet 2: Semanal (if any)
    if (pagosSemanal.length > 0) {
      const semanalHasAdmin = hasAdmin(pagosSemanal);
      const semanalData = pagosSemanal.map(p => formatPagoData(p, semanalHasAdmin));
      const wsSemanal = XLSX.utils.json_to_sheet(semanalData);
      XLSX.utils.book_append_sheet(wb, wsSemanal, "Personal - Semanal");
    }

    // Sheet 3: Quincenal (if any)
    if (pagosQuincenal.length > 0) {
      const quincenalHasAdmin = hasAdmin(pagosQuincenal);
      const quincenalData = pagosQuincenal.map(p => formatPagoData(p, quincenalHasAdmin));
      const wsQuincenal = XLSX.utils.json_to_sheet(quincenalData);
      XLSX.utils.book_append_sheet(wb, wsQuincenal, "Personal - Quincenal");
    }
  };

  const addContractorSheet = (wb, pago) => {
    const formatContractorData = (c) => ({
      "Contratista": c.nombre_contratista,
      "Descripción": c.descripcion_trabajo || "",
      "Total Días": c.total_personal_dias,
      "Monto Diario ($)": parseFloat(c.monto_diario).toFixed(2),
      "Total ($)": parseFloat(c.monto_total_usd).toFixed(2),
      "Tasa Cambio": parseFloat(pago.tasa_cambio).toFixed(4),
      "Total (Bs)": parseFloat(c.monto_total_bs).toFixed(2),
      "Banco": c.banco_pago || "",
      "Observaciones": c.observaciones || ""
    });

    const data = (pago.pagos || []).map(formatContractorData);
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Contratistas");
  };

  const exportUnifiedToExcel = (group) => {
      const wb = XLSX.utils.book_new();
      
      if (group.employeeData) {
          addEmployeeSheets(wb, group.employeeData);
      }
      
      if (group.contractorData) {
          addContractorSheet(wb, group.contractorData);
      }

      // Fallback filename date
      const dateStr = group.date || new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Nomina_Unificada_${dateStr}.xlsx`);
  };

  // Kept for backward compatibility if needed, currently unused in card view
  const exportPagoToExcel = (pago) => {
    const wb = XLSX.utils.book_new();
    addEmployeeSheets(wb, pago);
    XLSX.writeFile(wb, `pagos_nomina_${pago.fechaPago}.xlsx`);
  };

  const exportContractorToExcel = (pago) => {
    const wb = XLSX.utils.book_new();
    addContractorSheet(wb, pago);
    XLSX.writeFile(wb, `pagos_contratistas_${pago.fecha_pago}.xlsx`);
  };


  const handleDeleteClick = (pago, type = "personal") => {
    setPaymentToDelete({ ...pago, type });
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      if (paymentToDelete.type === "personal") {
        onDeletePago(paymentToDelete.id);
      } else {
        // Delete Contractor Payment
        try {
          const { error } = await supabase.from('pagos_contratistas').delete().eq('id', paymentToDelete.id);
          if (error) throw error;
          showToast("Pago de contratistas eliminado", "success");
          if (onRefresh) onRefresh();
        } catch (err) {
          console.error(err);
          showToast("Error eliminando pago", "error");
        }
      }
      setPaymentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setPaymentToDelete(null);
  };

  // --- Grouping Logic ---
  const groupPaymentsByDate = () => {
    const grouped = {};

    // Group Employees
    (pagosGuardados || []).forEach(pago => {
      if (filterMonth && !pago.fechaPago.startsWith(filterMonth)) return;
      const date = pago.fechaPago;
      if (!grouped[date]) grouped[date] = { date, employeeData: null, contractorData: null, id: date };
      grouped[date].employeeData = pago;
    });

    // Group Contractors
    (pagosContratistas || []).forEach(pago => {
        if (filterMonth && !pago.fecha_pago.startsWith(filterMonth)) return;
        
        // Ensure we handle date string format carefully
        const date = pago.fecha_pago; 
        
        if (!grouped[date]) grouped[date] = { date, employeeData: null, contractorData: null, id: date };
        grouped[date].contractorData = pago;
    });

    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const groupedPayments = groupPaymentsByDate();

  return (
    <div className="historial-pagos">
      <div className="historial-header">
        <h3>Historial de Pagos</h3>
        <div className="filter-controls">
          <label>Filtrar por mes:</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="pagos-list">
          {groupedPayments.length === 0 ? (
            <div className="no-results"><p>No hay pagos para el mes seleccionado</p></div>
          ) : (
            groupedPayments.map((group) => {
              const { date, employeeData, contractorData } = group;

              // Calculate overall totals for preview card
              const empTotals = employeeData ? calcularTotalesPago(employeeData) : { totalUSD: 0, totalPagar: 0 };
              const contTotals = contractorData ? calculateContractorTotals(contractorData) : { totalUSD: 0, totalBs: 0 };
              
              const grandTotalUSD = empTotals.totalUSD + contTotals.totalUSD;
              
              const tasaDisplay = employeeData?.tasaCambio || contractorData?.tasa_cambio || 0;

              return (
                <div key={group.id} className="pago-item">
                  {/* UNIFIED HEADER */}
                  <div className="pago-header">
                    <div className="pago-info">
                      <h4>{new Date(date.replace(/-/g, '\/')).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h4>
                      <div className="pago-details">
                        <span><strong>Tasa:</strong> Bs {parseFloat(tasaDisplay).toFixed(4)}/$</span>
                        {employeeData && <span><strong>Personal:</strong> {employeeData.pagos.length}</span>}
                        {contractorData && <span><strong>Contratistas:</strong> {(contractorData.pagos || []).length}</span>}
                      </div>
                    </div>
                    <div className="pago-totales">
                      <div className="pago-total highlight"><span className="label">Total Global USD</span><span className="value">$ {grandTotalUSD.toFixed(2)}</span></div>
                    </div>
                  </div>

                  {/* UNIFIED EXPANSION AREA REPLACED BY ACTION BUTTON */}
                  <div className="pago-employees-list" style={{ display: 'flex', justifyContent: 'center', padding: '1rem', borderTop: '1px solid #374151', gap: '1rem' }}>
                     <button 
                        className="btn-primary" 
                        onClick={() => onVerFactura(group)}
                        style={{ flex: 1, maxWidth: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                     >
                        <EyesIcon /> 
                        Ver Pagos
                     </button>
                     <button 
                        className="btn-historial-pagos" 
                        onClick={() => exportUnifiedToExcel(group)}
                        style={{ flex: 1, maxWidth: '200px', backgroundColor: '#10b981', borderColor: '#10b981', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                     >
                        <ExportIcon /> 
                        Ver Excel
                     </button>
                  </div>
                </div>
              );
            })
          )}
      </div>

      {paymentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar este registro de {paymentToDelete.type === 'personal' ? 'nómina personal' : 'pagos a contratistas'}?</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={cancelDelete}>Cancelar</button>
              <button className="btn-danger" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialPagos;
