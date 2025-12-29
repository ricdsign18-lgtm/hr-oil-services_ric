import React from 'react';
import './VistaFacturaNomina.css';

/**
 * VistaFacturaNomina
 * Renders a list of payroll payments (employees or contractors) in an invoice-style table.
 * 
 * @param {string} type - 'personal' or 'contratista'
 * @param {Array} data - The list of payment items (pagos array)
 * @param {object} totals - Pre-calculated totals { totalUSD, totalBs, count }
 * @param {number} tasaCambio - Exchange rate
 * @param {Function} onEdit - Handler for edit action
 * @param {Function} onExport - Handler for export action
 * @param {Function} onDelete - Handler for delete action
 */
const VistaFacturaNomina = ({ 
  type = 'personal', 
  title,
  data = [], 
  totals = { totalUSD: 0 },
  tasaCambio = 0,
  onEdit, 
  onExport, 
  onDelete 
}) => {
  const isPersonal = type === 'personal';

  return (
    <div className="vista-factura-nomina">
      {/* Header */}
      <div className="factura-header">
        <div className="factura-title">
          <h5>{title || (isPersonal ? "Nómina de Personal" : "Pagos a Contratistas")}</h5>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {data.length} {isPersonal ? 'empleados' : 'contratistas'}
          </span>
        </div>
        <div className="factura-meta">
          <div><strong>Tasa de Cambio:</strong> {parseFloat(tasaCambio).toFixed(4)} Bs/$</div>
        </div>
      </div>

      {/* Table */}
      <div className="factura-table-container">
        <table className="factura-table">
          <thead>
            <tr>
              <th className="text-left">{isPersonal ? "Empleado" : "Contratista"}</th>
              <th className="text-left">{isPersonal ? "Cargo" : "Descripción"}</th>
              <th>{isPersonal ? "Días" : "Empleados"}</th>
              <th>Monto Diario ($)</th>
              {isPersonal && <th>Extras/Deduc ($)</th>}
              <th>Subtotal ($)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              // Extract data based on type
              const id = isPersonal ? item.empleado.id : idx;
              const name = isPersonal 
                ? `${item.empleado.nombre} ${item.empleado.apellido}` 
                : item.nombre_contratista;
              
              const description = isPersonal 
                ? item.empleado.cargo 
                : item.descripcion_trabajo || "-";

              const days = isPersonal ? item.diasTrabajados : item.total_personal_dias;
              
              const dailyRate = isPersonal 
                ? (item.montoDiarioCalculado || 0) 
                : (item.monto_diario || 0);

              // Calculate extras for employees (Overtime - Deductions)
              // Note: Visual simplification for invoice view
              const extras = isPersonal 
                ? (item.totalHorasExtrasUSD - item.deduccionesManualesUSD)
                : 0;

              const total = isPersonal 
                ? (item.subtotalUSD || 0) 
                : (item.monto_total_usd || 0);

              return (
                <tr key={id}>
                  <td className="text-left"><strong>{name}</strong></td>
                  <td className="text-left">{description}</td>
                  <td>{days}</td>
                  <td>{parseFloat(dailyRate).toFixed(2)}</td>
                  {isPersonal && (
                    <td style={{ color: extras < 0 ? '#ef4444' : extras > 0 ? '#10b981' : 'inherit' }}>
                      {extras !== 0 ? extras.toFixed(2) : '-'}
                    </td>
                  )}
                  <td><strong>{parseFloat(total).toFixed(2)}</strong></td>
                </tr>
              );
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
             Eliminar
           </button>
        </div>

        <div className="factura-summary">
           <div className="summary-row total-main">
             <span>Total USD:</span>
             <span>$ {totals.totalUSD.toFixed(2)}</span>
           </div>
            {totals.totalBs > 0 && (
             <div className="summary-row secondary-value">
               <span>~ Bs {totals.totalBs.toFixed(2)}</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default VistaFacturaNomina;
