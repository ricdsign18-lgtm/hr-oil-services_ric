

import React, { useState } from "react";
import * as XLSX from "xlsx";
import supabase from "../../../../../../../../../../../../api/supaBase";
import { useNotification } from "../../../../../../../../../../../../contexts/NotificationContext";
import "./HistorialPagos.css";
import { DelateIcon, EditIcon, EyesIcon, ExportIcon } from "../../../../../../../../../../../../assets/icons/Icons";
import Modal from "../../../../../../../../../../../../components/common/Modal/Modal";

const HistorialPagos = ({ pagosGuardados, pagosContratistas, employees, onVerDetalles, onDeletePago, onEditarPago, selectedProject, onRefresh }) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState("personal"); // 'personal' or 'contratistas'
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // Filter Logic
  const filteredPersonal = (pagosGuardados || [])
    .filter((pago) => pago.fechaPago.startsWith(filterMonth))
    .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

  const filteredContratistas = (pagosContratistas || [])
    .filter((pago) => pago.fecha_pago.startsWith(filterMonth))
    .sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));

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
    const totalUSD = (pago.pagos || []).reduce((acc, p) => acc + (p.monto_total_usd || 0), 0);
    return {
      totalUSD: totalUSD,
      totalBs: totalUSD * (pago.tasa_cambio || 0),
      count: (pago.pagos || []).length
    };
  };

  const exportPagoToExcel = (pago) => {
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

    const wb = XLSX.utils.book_new();
    const hasAdmin = (lista) => lista.some(p => ["Administrativa", "Ejecucion"].includes(p.empleado.tipoNomina));

    const generalHasAdmin = hasAdmin(pago.pagos);
    const generalData = pago.pagos.map(p => formatPagoData(p, generalHasAdmin));
    const wsGeneral = XLSX.utils.json_to_sheet(generalData);
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Resumen General");

    if (pagosSemanal.length > 0) {
      const semanalHasAdmin = hasAdmin(pagosSemanal);
      const semanalData = pagosSemanal.map(p => formatPagoData(p, semanalHasAdmin));
      const wsSemanal = XLSX.utils.json_to_sheet(semanalData);
      XLSX.utils.book_append_sheet(wb, wsSemanal, "Nómina Semanal");
    }

    if (pagosQuincenal.length > 0) {
      const quincenalHasAdmin = hasAdmin(pagosQuincenal);
      const quincenalData = pagosQuincenal.map(p => formatPagoData(p, quincenalHasAdmin));
      const wsQuincenal = XLSX.utils.json_to_sheet(quincenalData);
      XLSX.utils.book_append_sheet(wb, wsQuincenal, "Nómina Quincenal");
    }

    const fileName = `pagos_nomina_${pago.fechaPago}.xlsx`;
    XLSX.writeFile(wb, fileName);
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

      {/* TABS */}
      <div className="historial-tabs">
        <button
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Nómina Personal
        </button>
        <button
          className={`tab-btn ${activeTab === 'contratistas' ? 'active' : ''}`}
          onClick={() => setActiveTab('contratistas')}
        >
          Contratistas
        </button>
      </div>

      <div className="pagos-list">
        {activeTab === 'personal' ? (
          filteredPersonal.length === 0 ? (
            <div className="no-results"><p>No hay pagos de personal para el mes seleccionado</p></div>
          ) : (
            filteredPersonal.map((pago) => {
              const totales = calcularTotalesPago(pago);
              const isExpanded = expandedPaymentId === pago.id;
              return (
                <div key={pago.id} className="pago-item">
                  <div className="pago-header">
                    <div className="pago-info">
                      <h4>Pago Personal: {new Date(pago.fechaPago.replace(/-/g, '\/')).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h4>
                      <div className="pago-details">
                        <span><strong>Tasa:</strong> Bs {pago.tasaCambio.toFixed(4)}/$</span>
                        <span><strong>Empleados:</strong> {pago.pagos.length}</span>
                      </div>
                    </div>
                    <div className="pago-totales">
                      <div className="pago-total"><span className="label">Total USD</span><span className="value">$ {totales.totalUSD.toFixed(2)}</span></div>
                      <div className="pago-total highlight"><span className="label">A Pagar</span><span className="value">Bs {totales.totalPagar.toFixed(2)}</span></div>
                    </div>
                  </div>
                  <div className="pago-actions">
                    <button className="btn-outline" onClick={() => onVerDetalles(pago)}>👁️ Ver Detalles</button>
                    <button className="btn-secondary" onClick={() => onEditarPago(pago)} style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: 'white' }}>✏️ Editar</button>
                    <button className="btn-secondary" onClick={() => exportPagoToExcel(pago)}>📊 Excel</button>
                    <button className="btn-danger" onClick={() => handleDeleteClick(pago, "personal")}>🗑️ Eliminar</button>
                  </div>

                  {/* Personal Details Expansion */}
                  <div className="pago-employees-list">
                    <div className="employees-toggle-header" onClick={() => toggleExpand(pago.id)}>
                      <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                      <span>Empleados incluidos ({pago.pagos.length})</span>
                    </div>
                    {isExpanded && (
                      <div className="employees-grid">
                        {pago.pagos.map((pagoEmp) => (
                          <div key={pagoEmp.empleado.id} className="employee-preview">
                            <span className="name">{pagoEmp.empleado.nombre} {pagoEmp.empleado.apellido}</span>
                            <div className="amounts">
                              <span className="amount-usd" style={{ fontWeight: 'bold' }}>Total: $ {(pagoEmp.montoTotalUSD || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          // CONTRACTOR LIST RENDERING
          filteredContratistas.length === 0 ? (
            <div className="no-results"><p>No hay pagos de contratistas para el mes seleccionado</p></div>
          ) : (
            filteredContratistas.map((pago) => {
              const totals = calculateContractorTotals(pago);
              const isExpanded = expandedPaymentId === pago.id;
              return (
                <div key={pago.id} className="pago-item">
                  <div className="pago-header">
                    <div className="pago-info">
                      <h4>Pago Contratistas: {new Date(pago.fecha_pago.replace(/-/g, '\/')).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h4>
                      <div className="pago-details">
                        <span><strong>Tasa:</strong> Bs {pago.tasa_cambio.toFixed(4)}/$</span>
                        <span><strong>Contratistas:</strong> {totals.count}</span>
                      </div>
                    </div>
                    <div className="pago-totales">
                      <div className="pago-total"><span className="label">Total USD</span><span className="value">$ {totals.totalUSD.toFixed(2)}</span></div>
                      <div className="pago-total highlight"><span className="label">Total Bs</span><span className="value">Bs {totals.totalBs.toFixed(2)}</span></div>
                    </div>
                  </div>
                  <div className="pago-actions">
                    <button className="btn-secondary" onClick={() => onEditarPago(pago, "contratista")} style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: 'white' }}>✏️ Editar</button>
                    <button className="btn-secondary" onClick={() => exportContractorToExcel(pago)}>📊 Excel</button>
                    <button className="btn-danger" onClick={() => handleDeleteClick(pago, "contratista")}>🗑️ Eliminar</button>
                  </div>

                  {/* Contractor Details Expansion */}
                  <div className="pago-employees-list">
                    <div className="employees-toggle-header" onClick={() => toggleExpand(pago.id)}>
                      <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                      <span>Contratistas incluidos ({totals.count})</span>
                    </div>
                    {isExpanded && (
                      <div className="employees-grid">
                        {(pago.pagos || []).map((c, idx) => (
                          <div key={idx} className="employee-preview">
                            <span className="name">{c.nombre_contratista}</span>
                            <div className="amounts">
                              <span className="amount-usd">Total: $ {parseFloat(c.monto_total_usd).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {paymentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar este registro?</p>
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
