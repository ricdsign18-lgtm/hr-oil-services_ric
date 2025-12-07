// src/components/modules/administracion/submodules/ingresos-comisiones/submodules/ingresos-pagos/components/InvoicesList.jsx
import React, { useState, useMemo } from 'react'
import { useIncome } from '../../../../../../../../contexts/IncomeContext'
import { useValuation } from '../../../../../../../../contexts/ValuationContext'
import { useNotification } from '../../../../../../../../contexts/NotificationContext'
import './InvoicesList.css'

const InvoicesList = ({ invoices, companyDeductions, selectedDate, onDateChange, onEdit }) => {
  const { deleteInvoice } = useIncome()
  const { valuations } = useValuation()
  const { showToast } = useNotification()

  const [selectedValuationId, setSelectedValuationId] = useState(null) // null = showing summary view
  const [viewMode, setViewMode] = useState('summary') // 'summary' or 'detail'

  // Agrupar facturas por valuación
  const groupedInvoices = useMemo(() => {
    const groups = {}

    // Inicializar grupos con las valuaciones existentes
    valuations.forEach(val => {
      groups[val.id] = {
        id: val.id,
        name: `${val.numero} - ${val.periodoInicio} al ${val.periodoFin}`,
        invoices: [],
        stats: {
          totalCount: 0,
          paidCount: 0,
          unpaidCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0
        }
      }
    })

    // Grupo para facturas sin valuación
    groups['no-valuation'] = {
      id: 'no-valuation',
      name: 'Sin Valuación Asignada',
      invoices: [],
      stats: {
        totalCount: 0,
        paidCount: 0,
        unpaidCount: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0
      }
    }

    // Distribuir facturas en los grupos
    invoices.forEach(invoice => {
      const groupId = invoice.valuation_id || 'no-valuation'
      if (groups[groupId]) {
        groups[groupId].invoices.push(invoice)

        // Actualizar estadísticas
        const amount = parseFloat(invoice.total_amount)
        const isPaid = invoice.status === 'cobrada'

        groups[groupId].stats.totalCount++
        groups[groupId].stats.totalAmount += amount

        if (isPaid) {
          groups[groupId].stats.paidCount++
          groups[groupId].stats.paidAmount += amount
        } else {
          groups[groupId].stats.unpaidCount++
          groups[groupId].stats.unpaidAmount += amount
        }
      }
    })

    return Object.values(groups).filter(g => g.invoices.length > 0 || g.id !== 'no-valuation')
  }, [invoices, valuations])

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.')) {
      try {
        await deleteInvoice(id)
        showToast('Factura eliminada exitosamente', 'success')
      } catch (error) {
        console.error('Error al eliminar factura:', error)
        showToast('Error al eliminar la factura', 'error')
      }
    }
  }

  const calculateInvoiceTotals = (invoice) => {
    const clientDeductionsTotal = invoice.income_client_deductions?.reduce(
      (sum, deduction) => sum + parseFloat(deduction.amount), 0
    ) || 0

    const bankAmount = parseFloat(invoice.taxable_base) - clientDeductionsTotal
    const bankAmountUSD = bankAmount / parseFloat(invoice.exchange_rate)

    return {
      clientDeductionsTotal,
      bankAmount,
      bankAmountUSD
    }
  }

  const handleCardClick = (groupId) => {
    setSelectedValuationId(groupId)
    setViewMode('detail')
  }

  const handleBackToSummary = () => {
    setSelectedValuationId(null)
    setViewMode('summary')
  }

  // Vista Resumen (Tarjetas de Valuación)
  if (viewMode === 'summary') {
    return (
      <div className="invoices-list summary-view">
        <h2>📊 Resumen por Valuación</h2>
        <div className="valuation-cards-grid">
          {groupedInvoices.map(group => (
            <div
              key={group.id}
              className="valuation-summary-card"
              onClick={() => handleCardClick(group.id)}
            >
              <div className="card-header">
                <h3>{group.name}</h3>
                <span className="invoice-count">{group.stats.totalCount} Facturas</span>
              </div>

              <div className="card-stats">
                <div className="stat-row">
                  <span>Total Facturado:</span>
                  <strong>Bs {group.stats.totalAmount.toFixed(2)}</strong>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-row success">
                  <span>Cobradas ({group.stats.paidCount}):</span>
                  <span>Bs {group.stats.paidAmount.toFixed(2)}</span>
                </div>
                <div className="stat-row warning">
                  <span>Por Cobrar ({group.stats.unpaidCount}):</span>
                  <span>Bs {group.stats.unpaidAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vista Detalle (Lista de Facturas)
  const selectedGroup = groupedInvoices.find(g => g.id === selectedValuationId)

  return (
    <div className="invoices-list detail-view">
      <div className="detail-header">
        <button onClick={handleBackToSummary} className="back-btn">← Volver al Resumen</button>
        <h2>{selectedGroup?.name}</h2>
      </div>

      <div className="invoices-grid">
        {selectedGroup?.invoices.map((invoice) => {
          const totals = calculateInvoiceTotals(invoice)
          const isPaid = invoice.status === 'cobrada'

          return (
            <div key={invoice.id} className={`invoice-card ${isPaid ? 'paid' : 'unpaid'}`}>
              <div className="invoice-header">
                <div className="header-top">
                  <h3>{invoice.description || 'Sin descripción'}</h3>
                  <span className={`status-badge ${isPaid ? 'paid' : 'unpaid'}`}>
                    {isPaid ? '✅ Cobrada' : '⏳ Por Cobrar'}
                  </span>
                </div>
                <div className="header-actions">
                  <span className="invoice-date">{invoice.invoice_date}</span>
                  <div className="card-actions">
                    <button
                      className="edit-btn"
                      onClick={() => onEdit(invoice)}
                      title="Editar Factura"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(invoice.id)}
                      title="Eliminar Factura"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <div className="invoice-details">
                <div className="detail-row">
                  <span>Cliente:</span>
                  <span>{invoice.client_name}</span>
                </div>
                <div className="detail-row">
                  <span>RIF:</span>
                  <span>{invoice.client_rif}</span>
                </div>
                <div className="detail-row">
                  <span>Base Imponible:</span>
                  <span>Bs {parseFloat(invoice.taxable_base).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span>Exento:</span>
                  <span>Bs {parseFloat(invoice.exempt_amount).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span>IVA 16%:</span>
                  <span>Bs {parseFloat(invoice.iva_amount).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span>Tasa Cambio:</span>
                  <span>Bs {parseFloat(invoice.exchange_rate).toFixed(4)}/USD</span>
                </div>
                <div className="detail-row total">
                  <span>Total Factura:</span>
                  <span>Bs {parseFloat(invoice.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Deducciones del Cliente */}
              {invoice.income_client_deductions && invoice.income_client_deductions.length > 0 && (
                <div className="client-deductions">
                  <h4>Deducciones del Cliente</h4>
                  {invoice.income_client_deductions.map((deduction, index) => (
                    <div key={deduction.id || index} className="deduction-item">
                      <span>{deduction.description}</span>
                      <span>{parseFloat(deduction.percentage).toFixed(2)}%</span>
                      <span>Bs {parseFloat(deduction.amount).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="deduction-total">
                    <span>Total Deducciones:</span>
                    <span>Bs {totals.clientDeductionsTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Montos Finales */}
              <div className="final-amounts">
                <div className="final-amount">
                  <span>Monto al Banco:</span>
                  <span>Bs {totals.bankAmount.toFixed(2)}</span>
                </div>
                <div className="final-amount">
                  <span>Monto al Banco USD:</span>
                  <span>USD {totals.bankAmountUSD.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InvoicesList