// src/components/modules/administracion/submodules/gastos-administrativos/submodules/nomina-personal/submodules/nomina/submodules/pagos-nomina/components/ResumenPagos.jsx
import React from "react";
import * as XLSX from "xlsx";
import "./ResumenPagos.css";

const ResumenPagos = ({
  pagosCalculados,
  fechaPago,
  tasaCambio,
  onGuardar,
  onVolver,
  selectedProject,
}) => {
  // Calcular período de pago
  const calcularPeriodoPago = (pago) => {
    const { empleado, diasTrabajados } = pago;
    const fecha = new Date(fechaPago.replace(/-/g, '\/'));

    // Calcular fechas base (Lunes, Viernes, Sábado) de la semana de pago
    const lunes = new Date(fecha);
    const diaSemana = fecha.getDay();
    const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    lunes.setDate(fecha.getDate() + diffLunes);

    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);

    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() - 2);

    // CASO 1: Semanal con más de 5 días trabajados -> Mostrar semana completa (Sábado a Viernes)
    if (empleado.frecuenciaPago === "Semanal" && diasTrabajados > 5) {
      return `Semana del ${sabado.toLocaleDateString("es-ES")} al ${viernes.toLocaleDateString("es-ES")}`;
    }

    // CASO 2: Rango de periodo específico (Para "Solo Extras" Quincenal que debe mostrarse como semanal, o Semanal normal)
    if (empleado.rangoPeriodo && empleado.rangoPeriodo.inicio && empleado.rangoPeriodo.fin) {
      const inicio = new Date(empleado.rangoPeriodo.inicio);
      const fin = new Date(empleado.rangoPeriodo.fin);
      return `Semana del ${inicio.toLocaleDateString("es-ES")} al ${fin.toLocaleDateString("es-ES")}`;
    }

    // CASO 3: Defaults
    if (empleado.frecuenciaPago === "Semanal") {
      return `Semana del ${lunes.toLocaleDateString("es-ES")} al ${viernes.toLocaleDateString("es-ES")}`;
    } else {
      // Pago quincenal estándar
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

  // Separar pagos por frecuencia
  const pagosSemanal = pagosCalculados.filter(p => p.empleado.frecuenciaPago === "Semanal");
  const pagosQuincenal = pagosCalculados.filter(p => p.empleado.frecuenciaPago === "Quincenal");

  const exportToExcel = () => {
    // Función auxiliar para formatear datos
    const formatPagoData = (pago, includeLegalDeductions) => {
      const periodoPago = calcularPeriodoPago(pago);
      const datos = {
        "Nombre del Trabajador": `${pago.empleado.nombre} ${pago.empleado.apellido} `,
        Cédula: pago.empleado.cedula,
        Cargo: pago.empleado.cargo,
        "Tipo Nómina": pago.empleado.tipoNomina,
        "Días Trab.": pago.diasTrabajados,
        "Monto Diario ($)": pago.montoDiarioCalculado?.toFixed(2) || "0.00",
        "H. Extra D.": pago.horasExtras.diurna,
        "H. Extra N.": pago.horasExtras.nocturna,
        "Monto H. Extra Total ($)": pago.totalHorasExtrasUSD.toFixed(2),
        "Deducciones ($)": pago.deduccionesManualesUSD.toFixed(2),
        "Adelantos ($)": (pago.adelantosUSD || 0).toFixed(2),
        "Total a Pagar ($)": pago.subtotalUSD.toFixed(2),
        "Monto Extra (Bs)": pago.montoExtraBs?.toFixed(2) || "0.00",
        "Monto Extra ($)": pago.montoExtraUSD?.toFixed(2) || "0.00",
        "Monto Total ($)": pago.montoTotalUSD?.toFixed(2) || "0.00",
        "Tasa del Día": parseFloat(tasaCambio).toFixed(4),
        "Total Pagar (Bs)": pago.totalPagarBs.toFixed(2),
        "Pagado por": pago.bancoPago || "No especificado",
        "Periodo de Pago": periodoPago,
        "Nombre del Contrato": selectedProject?.name || "No especificado",
        Observaciones: pago.observaciones || "",
      };

      // Si se deben incluir deducciones de ley (porque hay empleados administrativos en la lista)
      if (includeLegalDeductions) {
        const esAdministrativo = ["Administrativa", "Ejecucion"].includes(pago.empleado.tipoNomina);

        datos["Porcentaje ISLR Individual (%)"] = esAdministrativo ? (pago.empleado.porcentajeIslr || "0") : "";
        datos["Deducciones Ley IVSS (Bs)"] = esAdministrativo ? (pago.desgloseDeduccionesLey?.ivss?.toFixed(2) || "0.00") : "";
        datos["Deducciones Ley Paro Forzoso (Bs)"] = esAdministrativo ? (pago.desgloseDeduccionesLey?.paroForzoso?.toFixed(2) || "0.00") : "";
        datos["Deducciones Ley FAOV (Bs)"] = esAdministrativo ? (pago.desgloseDeduccionesLey?.faov?.toFixed(2) || "0.00") : "";
        datos["Deducciones Ley ISLR (Bs)"] = esAdministrativo ? (pago.desgloseDeduccionesLey?.islr?.toFixed(2) || "0.00") : "";
        datos["Total Deducciones Ley (Bs)"] = esAdministrativo ? (pago.deduccionesLeyBs?.toFixed(2) || "0.00") : "";
      }

      return datos;
    };

    const wb = XLSX.utils.book_new();

    // Helper para determinar si una lista tiene empleados administrativos
    const hasAdmin = (lista) => lista.some(p => ["Administrativa", "Ejecucion"].includes(p.empleado.tipoNomina));

    // Hoja 1: Resumen General
    const generalHasAdmin = hasAdmin(pagosCalculados);
    const generalData = pagosCalculados.map(p => formatPagoData(p, generalHasAdmin));
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

    const fileName = `pagos_nomina_${fechaPago}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const calcularTotales = (pagos) => {
    return pagos.reduce(
      (totales, pago) => ({
        totalHorasExtras: totales.totalHorasExtras + pago.totalHorasExtrasUSD,
        totalDeduccionesManuales:
          totales.totalDeduccionesManuales + pago.deduccionesManualesUSD,
        totalAdelantos: totales.totalAdelantos + (pago.adelantosUSD || 0),
        totalUSD: totales.totalUSD + pago.subtotalUSD,
        totalMontoExtraBs: totales.totalMontoExtraBs + (pago.montoExtraBs || 0),
        totalMontoExtraUSD: totales.totalMontoExtraUSD + (pago.montoExtraUSD || 0),
        totalMontoTotalUSD: totales.totalMontoTotalUSD + (pago.montoTotalUSD || 0),
        totalPagar: totales.totalPagar + pago.totalPagarBs,
        // Totales de deducciones de ley
        totalIvss: totales.totalIvss + (pago.desgloseDeduccionesLey?.ivss || 0),
        totalParoForzoso:
          totales.totalParoForzoso +
          (pago.desgloseDeduccionesLey?.paroForzoso || 0),
        totalFaov: totales.totalFaov + (pago.desgloseDeduccionesLey?.faov || 0),
        totalIslr: totales.totalIslr + (pago.desgloseDeduccionesLey?.islr || 0),
        totalDeduccionesLey:
          totales.totalDeduccionesLey + pago.deduccionesLeyBs,
      }),
      {
        totalHorasExtras: 0,
        totalDeduccionesManuales: 0,
        totalAdelantos: 0,
        totalUSD: 0,
        totalMontoExtraBs: 0,
        totalMontoExtraUSD: 0,
        totalMontoTotalUSD: 0,
        totalPagar: 0,
        totalIvss: 0,
        totalParoForzoso: 0,
        totalFaov: 0,
        totalIslr: 0,
        totalDeduccionesLey: 0,
      }
    );
  };

  const totalesGeneral = calcularTotales(pagosCalculados);
  const totalesSemanal = calcularTotales(pagosSemanal);
  const totalesQuincenal = calcularTotales(pagosQuincenal);

  const handleGuardar = async () => {
    try {
      await onGuardar(pagosCalculados);
    } catch (error) {
      console.error("Error guardando pagos:", error);
    }
  };

  const RenderTable = ({ pagos, title, totales }) => {
    // Determinar si esta tabla específica tiene empleados administrativos
    const showLegalDeductions = pagos.some((pago) =>
      ["Administrativa", "Ejecucion"].includes(pago.empleado.tipoNomina)
    );

    return (
      <div className="pagos-table-container">
        <h4>{title}</h4>
        <table className="pagos-table">
          <thead>
            <tr>
              <th>Nombre del Trabajador</th>
              <th>Cédula</th>
              <th>Cargo</th>
              <th>Tipo Nómina</th>
              <th>Días Trab.</th>
              <th>Monto Diario ($)</th>
              <th>H. Extra D.</th>
              <th>H. Extra N.</th>
              <th>Monto H. Extra Total ($)</th>
              <th>Deducciones ($)</th>
              <th>Adelantos ($)</th>
              <th>Total a Pagar ($)</th>
              <th>Monto Extra (Bs)</th>
              <th>Monto Extra ($)</th>
              <th>Monto Total ($)</th>
              <th>Tasa del Día</th>
              <th>Total Pagar (Bs)</th>
              <th>Pagado por</th>
              <th>Periodo de Pago</th>
              <th>Nombre del Contrato</th>
              <th>Observaciones</th>
              {/* Columnas para deducciones de ley */}
              {showLegalDeductions && (
                <>
                  <th>% ISLR</th>
                  <th>Ded. IVSS (Bs)</th>
                  <th>Ded. Paro (Bs)</th>
                  <th>Ded. FAOV (Bs)</th>
                  <th>Ded. ISLR (Bs)</th>
                  <th>Total Ded. Ley (Bs)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago, index) => {
              const periodoPago = calcularPeriodoPago(pago);
              const esAdministrativo = ["Administrativa", "Ejecucion"].includes(pago.empleado.tipoNomina);

              return (
                <tr key={pago.empleado.id} className={index % 2 === 0 ? "even" : "odd"}>
                  <td className="employee-name">{pago.empleado.nombre} {pago.empleado.apellido}</td>
                  <td>{pago.empleado.cedula}</td>
                  <td>{pago.empleado.cargo}</td>
                  <td>
                    <span className={`nomina - badge ${pago.empleado.tipoNomina.replace(/\s+/g, "-")} `}>
                      {pago.empleado.tipoNomina}
                    </span>
                  </td>
                  <td className="text-center">{pago.diasTrabajados}</td>
                  <td className="text-right">${pago.montoDiarioCalculado?.toFixed(2) || "0.00"}</td>
                  <td className="text-center">{pago.horasExtras.diurna}</td>
                  <td className="text-center">{pago.horasExtras.nocturna}</td>
                  <td className="text-right">${pago.totalHorasExtrasUSD.toFixed(2)}</td>
                  <td className="text-right">${pago.deduccionesManualesUSD.toFixed(2)}</td>
                  <td className="text-right">${(pago.adelantosUSD || 0).toFixed(2)}</td>
                  <td className="text-right">${pago.subtotalUSD.toFixed(2)}</td>
                  <td className="text-right">Bs {(pago.montoExtraBs || 0).toFixed(2)}</td>
                  <td className="text-right">${(pago.montoExtraUSD || 0).toFixed(2)}</td>
                  <td className="text-right"><strong>${(pago.montoTotalUSD || 0).toFixed(2)}</strong></td>
                  <td className="text-right">Bs {parseFloat(tasaCambio).toFixed(4)}</td>
                  <td className="text-right total-pagar"><strong>Bs {pago.totalPagarBs.toFixed(2)}</strong></td>
                  <td>{pago.bancoPago || "No especificado"}</td>
                  <td className="periodo-pago">{periodoPago}</td>
                  <td>{selectedProject?.name || "No especificado"}</td>
                  <td className="observaciones">{pago.observaciones || ""}</td>

                  {/* Celdas para deducciones de ley */}
                  {showLegalDeductions && (
                    <>
                      <td className="text-center">
                        {esAdministrativo ? (pago.empleado.porcentajeIslr || "0") + "%" : ""}
                      </td>
                      <td className="text-right">
                        {esAdministrativo ? (pago.desgloseDeduccionesLey?.ivss?.toFixed(2) || "0.00") : ""}
                      </td>
                      <td className="text-right">
                        {esAdministrativo ? (pago.desgloseDeduccionesLey?.paroForzoso?.toFixed(2) || "0.00") : ""}
                      </td>
                      <td className="text-right">
                        {esAdministrativo ? (pago.desgloseDeduccionesLey?.faov?.toFixed(2) || "0.00") : ""}
                      </td>
                      <td className="text-right">
                        {esAdministrativo ? (pago.desgloseDeduccionesLey?.islr?.toFixed(2) || "0.00") : ""}
                      </td>
                      <td className="text-right deducciones-ley-total">
                        <strong>
                          {esAdministrativo ? (pago.deduccionesLeyBs?.toFixed(2) || "0.00") : ""}
                        </strong>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="table-totals">
              <td colSpan="8" className="text-right"><strong>TOTALES:</strong></td>
              <td className="text-right"><strong>${totales.totalHorasExtras.toFixed(2)}</strong></td>
              <td className="text-right"><strong>${totales.totalDeduccionesManuales.toFixed(2)}</strong></td>
              <td className="text-right"><strong>${totales.totalAdelantos.toFixed(2)}</strong></td>
              <td className="text-right"><strong>${totales.totalUSD.toFixed(2)}</strong></td>
              <td className="text-right"><strong>Bs {totales.totalMontoExtraBs.toFixed(2)}</strong></td>
              <td className="text-right"><strong>${totales.totalMontoExtraUSD.toFixed(2)}</strong></td>
              <td className="text-right"><strong>${totales.totalMontoTotalUSD.toFixed(2)}</strong></td>
              <td></td>
              <td className="text-right total-pagar"><strong>Bs {totales.totalPagar.toFixed(2)}</strong></td>
              <td colSpan="4"></td>

              {/* Totales de deducciones de ley */}
              {showLegalDeductions && (
                <>
                  <td></td>
                  <td className="text-right"><strong>{totales.totalIvss.toFixed(2)}</strong></td>
                  <td className="text-right"><strong>{totales.totalParoForzoso.toFixed(2)}</strong></td>
                  <td className="text-right"><strong>{totales.totalFaov.toFixed(2)}</strong></td>
                  <td className="text-right"><strong>{totales.totalIslr.toFixed(2)}</strong></td>
                  <td className="text-right deducciones-ley-total"><strong>{totales.totalDeduccionesLey.toFixed(2)}</strong></td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="resumen-pagos">
      <div className="resumen-header">
        <h3>
          Resumen de Pagos -{" "}
          {new Date(fechaPago.replace(/-/g, '\/')).toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h3>
        <div className="resumen-info">
          <span>
            <strong>Tasa de Cambio:</strong> Bs{" "}
            {parseFloat(tasaCambio).toFixed(4)}/$
          </span>
          <span>
            <strong>Total Empleados:</strong> {pagosCalculados.length}
          </span>
          <span>
            <strong>Contrato:</strong>{" "}
            {selectedProject?.name || "No especificado"}
          </span>
        </div>
      </div>

      {pagosSemanal.length > 0 && (
        <RenderTable
          pagos={pagosSemanal}
          title="Nómina Semanal"
          totales={totalesSemanal}
        />
      )}

      {pagosQuincenal.length > 0 && (
        <RenderTable
          pagos={pagosQuincenal}
          title="Nómina Quincenal"
          totales={totalesQuincenal}
        />
      )}

      <div className="separator-line" style={{ margin: "2rem 0", borderTop: "2px dashed #e5e7eb" }}></div>

      <RenderTable
        pagos={pagosCalculados}
        title="Resumen General de Pagos"
        totales={totalesGeneral}
      />

      <div className="resumen-actions">
        <button className="btn-outline" onClick={onVolver}>
          ← Volver a Calculadora
        </button>
        <div className="action-group">
          <button className="btn-secondary" onClick={exportToExcel}>
            📊 Exportar a Excel
          </button>
          <button className="btn-primary" onClick={handleGuardar}>
            💾 Guardar Pagos
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumenPagos;
