

// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/pagos-nomina/components/HistorialPagos.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./HistorialPagos.css";

const HistorialPagos = ({ pagosGuardados, employees, onVerDetalles, onDeletePago, selectedProject }) => {
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  const pagosFiltrados = pagosGuardados
    .filter((pago) => pago.fechaPago.startsWith(filterMonth))
    .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

  // Calcular período de pago (Helper function)
  const calcularPeriodoPago = (empleado, fechaPago) => {
    const fecha = new Date(fechaPago.replace(/-/g, '\/'));

    if (empleado.frecuenciaPago === "Semanal") {
      // Encontrar lunes de la semana del pago
      const lunes = new Date(fecha);
      const diaSemana = fecha.getDay();
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      lunes.setDate(fecha.getDate() + diffLunes);

      // Encontrar viernes de la semana del pago
      const viernes = new Date(lunes);
      viernes.setDate(lunes.getDate() + 4);

      return `Semana del ${lunes.toLocaleDateString(
        "es-ES"
      )} al ${viernes.toLocaleDateString("es-ES")}`;
    } else {
      // Pago quincenal
      const mes = fecha.getMonth();
      const año = fecha.getFullYear();

      const mitad =
        empleado.mitadPagoQuincenal || empleado.mitadPago || "primera";

      if (mitad === "primera") {
        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes, 15);
        return `Pago del ${primerDia.toLocaleDateString(
          "es-ES"
        )} al ${ultimoDia.toLocaleDateString("es-ES")}`;
      } else {
        const primerDia = new Date(año, mes, 16);
        const ultimoDia = new Date(año, mes + 1, 0);
        return `Pago del ${primerDia.toLocaleDateString(
          "es-ES"
        )} al ${ultimoDia.toLocaleDateString("es-ES")}`;
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

  const exportPagoToExcel = (pago) => {
    // Separar pagos por frecuencia
    const pagosSemanal = pago.pagos.filter(p => p.empleado.frecuenciaPago === "Semanal");
    const pagosQuincenal = pago.pagos.filter(p => p.empleado.frecuenciaPago === "Quincenal");

    // Función auxiliar para formatear datos
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

      // Si se deben incluir deducciones de ley
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

    // Helper para determinar si una lista tiene empleados administrativos
    const hasAdmin = (lista) => lista.some(p => ["Administrativa", "Ejecucion"].includes(p.empleado.tipoNomina));

    // Hoja 1: Resumen General
    const generalHasAdmin = hasAdmin(pago.pagos);
    const generalData = pago.pagos.map(p => formatPagoData(p, generalHasAdmin));
    const wsGeneral = XLSX.utils.json_to_sheet(generalData);
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Resumen General");

    // Hoja 2: Nómina Semanal (si hay)
    if (pagosSemanal.length > 0) {
      const semanalHasAdmin = hasAdmin(pagosSemanal);
      const semanalData = pagosSemanal.map(p => formatPagoData(p, semanalHasAdmin));
      const wsSemanal = XLSX.utils.json_to_sheet(semanalData);
      XLSX.utils.book_append_sheet(wb, wsSemanal, "Nómina Semanal");
    }

    // Hoja 3: Nómina Quincenal (si hay)
    if (pagosQuincenal.length > 0) {
      const quincenalHasAdmin = hasAdmin(pagosQuincenal);
      const quincenalData = pagosQuincenal.map(p => formatPagoData(p, quincenalHasAdmin));
      const wsQuincenal = XLSX.utils.json_to_sheet(quincenalData);
      XLSX.utils.book_append_sheet(wb, wsQuincenal, "Nómina Quincenal");
    }

    const fileName = `pagos_nomina_${pago.fechaPago}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const toggleExpand = (id) => {
    setExpandedPaymentId(expandedPaymentId === id ? null : id);
  };

  const handleDeleteClick = (pago) => {
    setPaymentToDelete(pago);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      onDeletePago(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setPaymentToDelete(null);
  };

  if (pagosGuardados.length === 0) {
    return (
      <div className="empty-historial">
        <div className="empty-icon">📋</div>
        <h4>No hay pagos guardados</h4>
        <p>Comienza calculando y guardando los pagos de nómina</p>
      </div>
    );
  }

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
        {pagosFiltrados.map((pago) => {
          const totales = calcularTotalesPago(pago);
          const isExpanded = expandedPaymentId === pago.id;

          return (
            <div key={pago.id} className="pago-item">
              <div className="pago-header">
                <div className="pago-info">
                  <h4>
                    Pago del{" "}
                    {new Date(pago.fechaPago.replace(/-/g, '\/')).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h4>
                  <div className="pago-details">
                    <span>
                      <strong>Tasa:</strong> Bs {pago.tasaCambio.toFixed(4)}/$
                    </span>
                    <span>
                      <strong>Empleados:</strong> {pago.pagos.length}
                    </span>
                    <span>
                      <strong>Guardado:</strong>{" "}
                      {new Date(pago.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="pago-totales">
                  <div className="pago-total">
                    <span className="label">Total USD</span>
                    <span className="value">
                      $ {totales.totalUSD.toFixed(2)}
                    </span>
                  </div>

                  <div className="pago-total highlight">
                    <span className="label">A Pagar</span>
                    <span className="value">
                      Bs {totales.totalPagar.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pago-actions">
                <button
                  className="btn-outline"
                  onClick={() => onVerDetalles(pago)}
                >
                  👁️ Ver Detalles
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => exportPagoToExcel(pago)}
                >
                  📊 Exportar Excel
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteClick(pago)}
                >
                  🗑️ Eliminar
                </button>
              </div>

              <div className="pago-employees-list">
                <div
                  className="employees-toggle-header"
                  onClick={() => toggleExpand(pago.id)}
                >
                  <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                  <span>Empleados incluidos en este pago ({pago.pagos.length})</span>
                </div>

                <div className={`employees-collapsible ${isExpanded ? 'expanded' : ''}`}>
                  <div className="employees-grid">
                    {pago.pagos.map((pagoEmp) => (
                      <div key={pagoEmp.empleado.id} className="employee-preview">
                        <span className="name">
                          {pagoEmp.empleado.nombre} {pagoEmp.empleado.apellido}
                        </span>
                        <div className="amounts">
                          {(pagoEmp.deduccionesManualesUSD > 0) && (
                            <span className="amount-deduc" style={{ color: '#ef4444', marginRight: '0.5rem', fontSize: '0.85rem' }}>
                              Ded: ${pagoEmp.deduccionesManualesUSD.toFixed(2)}
                            </span>
                          )}
                          {(pagoEmp.adelantosUSD > 0) && (
                            <span className="amount-adel" style={{ color: '#f59e0b', marginRight: '0.5rem', fontSize: '0.85rem' }}>
                              Adel: ${pagoEmp.adelantosUSD.toFixed(2)}
                            </span>
                          )}
                          <span className="amount-usd" style={{ fontWeight: 'bold' }}>
                            Total: $ {(pagoEmp.montoTotalUSD || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pagosFiltrados.length === 0 && (
        <div className="no-results">
          <p>No hay pagos guardados para el mes seleccionado</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {paymentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Eliminación</h3>
            <p>
              ¿Estás seguro de que deseas eliminar el registro de pago del{" "}
              <strong>
                {new Date(paymentToDelete.fechaPago.replace(/-/g, '\/')).toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </strong>
              ?
            </p>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={cancelDelete}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialPagos;
