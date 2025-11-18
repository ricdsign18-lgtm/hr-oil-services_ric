
// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/pagos-nomina/components/HistorialPagos.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./HistorialPagos.css";

const HistorialPagos = ({ pagosGuardados, employees, onVerDetalles }) => {
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const pagosFiltrados = pagosGuardados
    .filter((pago) => pago.fechaPago.startsWith(filterMonth))
    .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

  const calcularTotalesPago = (pago) => {
    return pago.pagos.reduce(
      (totales, pagoEmp) => ({
        totalUSD: totales.totalUSD + pagoEmp.subtotalUSD,
        totalBs: totales.totalBs + pagoEmp.subtotalBs,
        totalPagar: totales.totalPagar + pagoEmp.totalPagarBs,
      }),
      { totalUSD: 0, totalBs: 0, totalPagar: 0 }
    );
  };

  const exportPagoToExcel = (pago) => {
    const excelData = pago.pagos.map((pagoEmp) => ({
      Nombre: `${pagoEmp.empleado.nombre} ${pagoEmp.empleado.apellido}`,
      Cédula: pagoEmp.empleado.cedula,
      Cargo: pagoEmp.empleado.cargo,
      "Tipo Nómina": pagoEmp.empleado.tipoNomina,
      "Días Trabajados": pagoEmp.diasTrabajados,
      "Monto Diario (USD$)": pagoEmp.montoDiarioCalculado.toFixed(2),
      "Salario Base (USD$)": pagoEmp.salarioBase.toFixed(2),
      "Horas Extra Diurna": pagoEmp.horasExtras.diurna,
      "Horas Extra Nocturna": pagoEmp.horasExtras.nocturna,
      "Total Horas Extra (USD$)": pagoEmp.totalHorasExtrasUSD.toFixed(2),
      "Deducciones Manuales (USD$)": pagoEmp.deduccionesManualesUSD.toFixed(2),
      "Sub Total (USD$)": pagoEmp.subtotalUSD.toFixed(2),
      "Sub Total (Bs)": pagoEmp.subtotalBs.toFixed(2),
      "Deducciones Ley (Bs)": pagoEmp.deduccionesLeyBs.toFixed(2),
      "Total a Pagar (Bs)": pagoEmp.totalPagarBs.toFixed(2),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Pagos Nómina");

    const fileName = `pagos_nomina_${pago.fechaPago}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
                  <div className="pago-total">
                    <span className="label">Total Bs</span>
                    <span className="value">
                      Bs {totales.totalBs.toFixed(2)}
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
              </div>

              <div className="pago-employees-preview">
                <div className="preview-header">
                  <span>Empleados incluidos en este pago:</span>
                </div>
                <div className="employees-grid">
                  {pago.pagos.slice(0, 5).map((pagoEmp) => (
                    <div key={pagoEmp.empleado.id} className="employee-preview">
                      <span className="name">
                        {pagoEmp.empleado.nombre} {pagoEmp.empleado.apellido}
                      </span>
                      <span className="amount">
                        Bs {pagoEmp.totalPagarBs.toFixed(2)}
                      </span>
                      <span className="amount">
                        $ {(pagoEmp.subtotalUSD).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {pago.pagos.length > 5 && (
                    <div className="more-employees">
                      + {pago.pagos.length - 5} empleados más...
                    </div>
                  )}
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
    </div>
  );
};

export default HistorialPagos;
