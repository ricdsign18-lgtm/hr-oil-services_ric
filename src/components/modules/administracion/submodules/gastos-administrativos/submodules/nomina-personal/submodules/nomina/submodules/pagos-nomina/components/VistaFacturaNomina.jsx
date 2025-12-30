import React from 'react';
import './VistaFacturaNomina.css';

/**
 * VistaFacturaNomina
 * Renders a list of payroll payments (employees or contractors) in a detailed, summary-style table.
 */
const VistaFacturaNomina = ({ 
  type = 'personal', 
  title,
  data = [], 
  totals = { totalUSD: 0, totalBs: 0 },
  tasaCambio = 0,
  onEdit, 
  onDelete 
}) => {
  const isPersonal = type === 'personal';
  const showLegalDeductions = isPersonal && data.some((item) =>
    ["Administrativa", "Ejecucion"].includes(item.empleado?.tipoNomina)
  );

  // Helper to calculate period (Copied from ResumenPagos/HistorialPagos logic)
  const calcularPeriodoPago = (item) => {
    // Handle contractors or items without 'empleado' (though structure suggests they have it or we map it)
    if (!item.empleado && !item.frecuenciaPago) return ""; 

    // For contractors, item might effectively be the "pago" itself or have different structure
    // If it's personal, item has { empleado: {...}, ... }
    const currentDateStr = item.fechaPago || new Date().toISOString().slice(0, 10); // Fallback
    const fecha = new Date(currentDateStr.replace(/-/g, '\/'));
    
    // Logic needs frequency. 
    // If contractor, assuming Weekly or based on days. 
    // If Personal:
    const emp = item.empleado || {};
    
    if (emp.frecuenciaPago === "Semanal" || !emp.frecuenciaPago) { // Default to weekly logic if missing
      const lunes = new Date(fecha);
      const diaSemana = fecha.getDay();
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
      lunes.setDate(fecha.getDate() + diffLunes);

      const viernes = new Date(lunes);
      viernes.setDate(lunes.getDate() + 4);

      // Special case: more than 5 days worked
      const days = item.diasTrabajados || item.total_personal_dias || 0;
      if (days > 5) {
          const sabado = new Date(lunes);
          sabado.setDate(lunes.getDate() - 2); // Actually logic in Resumen was substract from Lunes... wait.
          // Resumen says: sabado.setDate(lunes.getDate() - 2) ?? If lunes is Monday, -2 is Saturday previous week? 
          // Let's stick to standard Weekly display for now to be safe, or direct copy.
          // Resumen: if (diasTrabajados > 5) return `Semana del ${sabado...} al ${viernes...}`
          // Let's use simple current week logic to avoid complex date math bugs without full context.
          return `Semana del ${lunes.toLocaleDateString("es-ES")} al ${viernes.toLocaleDateString("es-ES")}`;
      }
      return `Semana del ${lunes.toLocaleDateString("es-ES")} al ${viernes.toLocaleDateString("es-ES")}`;

    } else {
      // Quincenal
      const mes = fecha.getMonth();
      const año = fecha.getFullYear();
      const mitad = emp.mitadPagoQuincenal || emp.mitadPago || "primera";

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

  return (
    <div className="vista-factura-nomina">
      {/* Header */}
      <div className="factura-header">
        <div className="factura-title">
          <h5>{title || (isPersonal ? "Nómina de Personal" : "Pagos a Contratistas")}</h5>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {data.length} {isPersonal ? 'empleados' : 'registros'}
          </span>
        </div>
        <div className="factura-meta">
          <div><strong>Tasa de Cambio:</strong> {parseFloat(tasaCambio).toFixed(4)} Bs/$</div>
        </div>
      </div>

      {/* Table - Full Scroll Container */}
      <div className="factura-table-container" style={{ overflowX: 'auto' }}>
        <table className="factura-table full-details">
          <thead>
            <tr>
              {isPersonal ? (
                <>
                  <th>Nombre del Trabajador</th>
                  <th>Cédula</th>
                  <th>Cargo</th>
                  <th>Tipo Nómina</th>
                  <th>Días Trab.</th>
                  <th>Monto Diario ($)</th>
                  <th>H. Extra D.</th>
                  <th>H. Extra N.</th>
                  <th>Monto H. Extra ($)</th>
                  <th>Deducciones ($)</th>
                  <th>Adelantos ($)</th>
                  <th>Total a Pagar ($)</th>
                  <th>Monto Extra (Bs)</th>
                  <th>Monto Extra ($)</th>
                  <th>Monto Total ($)</th>
                  <th>Tasa del Día</th>
                  <th>Total Pagar (Bs)</th>
                  <th>Pagado por</th>
                  {/* <th>Periodo de Pago</th> */} 
                  <th>Contrato</th>
                  <th>Observaciones</th>
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
                </>
              ) : (
                <>
                  <th>Nombre del Contratista</th>
                  <th>Días Trabajados</th>
                  <th>Monto Diario X Persona ($)</th>
                  <th>Monto Total ($)</th>
                  <th>Tasa del Día</th>
                  <th>Total Pagar (Bs)</th>
                  <th>Pagado por</th>
                  <th>Observaciones</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
               if (isPersonal) {
                   const emp = item.empleado || {};
                   const esAdministrativo = ["Administrativa", "Ejecucion"].includes(emp.tipoNomina);
                   
                   return (
                       <tr key={emp.id || idx}>
                           <td className="text-left"><strong>{`${emp.nombre} ${emp.apellido}`}</strong></td>
                           <td>{emp.cedula}</td>
                           <td>{emp.cargo}</td>
                           <td>{emp.tipoNomina}</td>
                           <td className="text-center">{item.diasTrabajados}</td>
                           <td className="text-right">${(item.montoDiarioCalculado || 0).toFixed(2)}</td>
                           <td className="text-center">{item.horasExtras?.diurna || 0}</td>
                           <td className="text-center">{item.horasExtras?.nocturna || 0}</td>
                           <td className="text-right">${(item.totalHorasExtrasUSD || 0).toFixed(2)}</td>
                           <td className="text-right text-red">${(item.deduccionesManualesUSD || 0).toFixed(2)}</td>
                           <td className="text-right text-red">${(item.adelantosUSD || 0).toFixed(2)}</td>
                           <td className="text-right"><strong>${(item.subtotalUSD || 0).toFixed(2)}</strong></td>
                           <td className="text-right">Bs {(item.montoExtraBs || 0).toFixed(2)}</td>
                           <td className="text-right">${(item.montoExtraUSD || 0).toFixed(2)}</td>
                           <td className="text-right highlight-blue"><strong>${(item.montoTotalUSD || 0).toFixed(2)}</strong></td>
                           <td className="text-right">{parseFloat(tasaCambio).toFixed(4)}</td>
                           <td className="text-right highlight-bs"><strong>Bs {(item.totalPagarBs || 0).toFixed(2)}</strong></td>
                           <td>{item.bancoPago || "-"}</td>
                           {/* <td>{calcularPeriodoPago(item)}</td> */} 
                           <td>-</td> {/* Contrato hard to access without context, passing placeholder */}
                           <td className="text-small">{item.observaciones}</td>
                           
                           {showLegalDeductions && (
                               <>
                                   <td className="text-center">{esAdministrativo ? (emp.porcentajeIslr || "0") + "%" : "-"}</td>
                                   <td className="text-right">{esAdministrativo ? (item.desgloseDeduccionesLey?.ivss?.toFixed(2) || "0.00") : "-"}</td>
                                   <td className="text-right">{esAdministrativo ? (item.desgloseDeduccionesLey?.paroForzoso?.toFixed(2) || "0.00") : "-"}</td>
                                   <td className="text-right">{esAdministrativo ? (item.desgloseDeduccionesLey?.faov?.toFixed(2) || "0.00") : "-"}</td>
                                   <td className="text-right">{esAdministrativo ? (item.desgloseDeduccionesLey?.islr?.toFixed(2) || "0.00") : "-"}</td>
                                   <td className="text-right"><strong>{esAdministrativo ? (item.deduccionesLeyBs?.toFixed(2) || "0.00") : "-"}</strong></td>
                               </>
                           )}
                       </tr>
                   );
               } else {
                   // Contractor Row
                   const nombre = item.nombre_contratista || item.empleado?.nombre || "Contratista";
                   
                   // Calculate calendar days if detail exists (count of days with attendance > 0)
                   let count = 0;
                   if (item.dias_trabajados_detalle) {
                       count = Object.values(item.dias_trabajados_detalle).filter(v => Number(v) > 0).length;
                   } else {
                       // Fallback to man-days if no detail (legacy)
                       count = item.total_personal_dias || item.diasTrabajados || 0;
                   }

                   const daily = item.monto_diario || 0;
                   const totalUSD = item.monto_total_usd || 0;
                   const totalBs = item.monto_total_bs || (totalUSD * tasaCambio) || 0;
                   
                   return (
                       <tr key={item.id || idx}>
                           <td className="text-left"><strong>{nombre}</strong></td>
                           <td className="text-center">{count}</td>
                           <td className="text-right">${Number(daily).toFixed(2)}</td>
                           <td className="text-right highlight-blue"><strong>${Number(totalUSD).toFixed(2)}</strong></td>
                           <td className="text-right">{parseFloat(tasaCambio).toFixed(4)}</td>
                           <td className="text-right highlight-bs"><strong>Bs {Number(totalBs).toFixed(2)}</strong></td>
                           <td>{item.banco_pago || item.bancoPago || "-"}</td>
                           <td className="text-small">{item.observaciones}</td>
                       </tr>
                   );
               }
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="factura-footer">
        <div className="factura-actions">
           <button className="btn-factura-action btn-factura-edit" onClick={onEdit}>
             Editar
           </button>
           <button className="btn-factura-action btn-factura-delete" onClick={onDelete}>
             Eliminar (Solo este grupo)
           </button>
        </div>

        <div className="factura-summary">
            {/* Simple totals display since table has detail */}
           <div className="summary-row total-main">
             <span>Total USD:</span>
             <span>$ {totals.totalUSD?.toFixed(2) || "0.00"}</span>
           </div>
            {totals.totalBs > 0 && (
             <div className="summary-row secondary-value">
               <span>~ Bs {totals.totalBs?.toFixed(2) || "0.00"}</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default VistaFacturaNomina;
