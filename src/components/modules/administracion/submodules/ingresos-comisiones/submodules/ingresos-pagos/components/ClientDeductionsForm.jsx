// src/components/modules/administracion/submodules/ingresos-comisiones/submodules/ingresos-pagos/components/ClientDeductionsForm.jsx
import React, { useState, useEffect } from 'react'
import { useIncome } from '../../../../../../../../contexts/IncomeContext'
import { useNotification } from '../../../../../../../../contexts/NotificationContext'
import './ClientDeductionsForm.css'

const ClientDeductionsForm = ({ invoices, selectedDate }) => {
  const { addClientDeductions } = useIncome()
  const { showToast } = useNotification()
  const [deductions, setDeductions] = useState([{ description: '', percentage: '' }])
  const [selectedInvoice, setSelectedInvoice] = useState('')
  const [invoiceDetails, setInvoiceDetails] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedInvoice) {
      const invoice = invoices.find(inv => inv.id === selectedInvoice)
      setInvoiceDetails(invoice)
      // Limpiar deducciones cuando cambia la factura
      setDeductions([{ description: '', percentage: '' }])
    }
  }, [selectedInvoice, invoices])

  const addDeduction = () => {
    setDeductions([...deductions, { description: '', percentage: '' }])
  }

  const removeDeduction = (index) => {
    setDeductions(deductions.filter((_, i) => i !== index))
  }

  const updateDeduction = (index, field, value) => {
    const updated = [...deductions]
    updated[index][field] = value
    setDeductions(updated)
  }

  const calculateDeductionAmount = (percentage) => {
    if (!invoiceDetails || !percentage) return 0
    return (parseFloat(percentage) / 100) * parseFloat(invoiceDetails.taxable_base)
  }

  const calculateTotalDeductions = () => {
    return deductions.reduce((total, deduction) => {
      if (deduction.percentage) {
        return total + calculateDeductionAmount(deduction.percentage)
      }
      return total
    }, 0)
  }

  const calculateBankAmount = () => {
    if (!invoiceDetails) return 0
    return parseFloat(invoiceDetails.taxable_base) - calculateTotalDeductions()
  }

  const calculateBankAmountUSD = () => {
    if (!invoiceDetails) return 0
    return calculateBankAmount() / parseFloat(invoiceDetails.exchange_rate)
  }

  const handleSaveDeductions = async () => {
    if (!selectedInvoice) {
      showToast('Por favor selecciona una factura', 'warning')
      return
    }

    // Filtrar deducciones válidas
    const validDeductions = deductions.filter(deduction => 
      deduction.description && deduction.percentage
    )

    if (validDeductions.length === 0) {
      showToast('Por favor agrega al menos una deducción válida', 'warning')
      return
    }

    // Validar que el total de deducciones no supere la base imponible
    if (calculateTotalDeductions() > parseFloat(invoiceDetails.taxable_base)) {
      showToast('El total de deducciones no puede ser mayor a la base imponible', 'warning')
      return
    }

    setSaving(true)
    try {
      // Preparar datos para guardar
      const deductionsData = validDeductions.map(deduction => ({
        description: deduction.description,
        percentage: parseFloat(deduction.percentage),
        amount: calculateDeductionAmount(deduction.percentage),
        amount_usd: calculateDeductionAmount(deduction.percentage) / parseFloat(invoiceDetails.exchange_rate)
      }))

      // Usar la función del contexto para guardar
      await addClientDeductions(selectedInvoice, deductionsData)

      showToast('✅ Deducciones guardadas exitosamente', 'success')
      
      // Limpiar formulario después de guardar
      setDeductions([{ description: '', percentage: '' }])
      
    } catch (error) {
      console.error('Error al guardar deducciones:', error)
      showToast('❌ Error al guardar las deducciones: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = () => {
    const hasValidDeductions = deductions.some(deduction => 
      deduction.description && deduction.percentage
    )
    const totalDeductionsValid = calculateTotalDeductions() <= parseFloat(invoiceDetails?.taxable_base || 0)
    
    return selectedInvoice && hasValidDeductions && totalDeductionsValid
  }

  return (
    <div className="client-deductions-form">
      <h2>💰 Deducciones del Cliente</h2>

      <div className="invoice-selection">
        <label>Seleccionar Factura:</label>
        <select 
          value={selectedInvoice} 
          onChange={(e) => setSelectedInvoice(e.target.value)}
        >
          <option value="">Seleccione una factura</option>
          {invoices.map(invoice => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.description} - {invoice.invoice_date} - Bs {parseFloat(invoice.total_amount).toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {invoiceDetails && (
        <>
          <div className="invoice-summary">
            <h3>Resumen de Factura</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <label>Cliente:</label>
                <span>{invoiceDetails.client_name}</span>
              </div>
              <div className="summary-item">
                <label>Base Imponible:</label>
                <span>Bs {parseFloat(invoiceDetails.taxable_base).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <label>Tasa de Cambio:</label>
                <span>Bs {parseFloat(invoiceDetails.exchange_rate).toFixed(4)}/USD</span>
              </div>
              <div className="summary-item">
                <label>Total Factura:</label>
                <span>Bs {parseFloat(invoiceDetails.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="deductions-section">
            <div className="section-header">
              <h3>Deducciones del Cliente</h3>
              <button type="button" onClick={addDeduction} className="add-button">
                + Agregar Deducción
              </button>
            </div>

            {deductions.map((deduction, index) => (
              <div key={index} className="deduction-row">
                <div className="deduction-inputs">
                  <input
                    type="text"
                    placeholder="Descripción de la deducción"
                    value={deduction.description}
                    onChange={(e) => updateDeduction(index, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Porcentaje %"
                    value={deduction.percentage}
                    onChange={(e) => updateDeduction(index, 'percentage', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <span className="deduction-amount">
                    Bs {calculateDeductionAmount(deduction.percentage).toFixed(2)}
                  </span>
                </div>
                {deductions.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeDeduction(index)}
                    className="remove-button"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <div className="deductions-totals">
              <div className="total-item">
                <label>TOTAL DEDUCCIONES CLIENTE:</label>
                <span className="total-amount">
                  Bs {calculateTotalDeductions().toFixed(2)}
                </span>
              </div>
              <div className="total-item">
                <label>TOTAL DEDUCCIONES CLIENTE USD:</label>
                <span className="total-amount">
                  USD {(calculateTotalDeductions() / parseFloat(invoiceDetails.exchange_rate)).toFixed(2)}
                </span>
              </div>
              <div className="total-item highlight">
                <label>MONTO RECIBIDO AL BANCO:</label>
                <span className="total-amount">
                  Bs {calculateBankAmount().toFixed(2)}
                </span>
              </div>
              <div className="total-item highlight">
                <label>MONTO RECIBIDO AL BANCO USD:</label>
                <span className="total-amount">
                  USD {calculateBankAmountUSD().toFixed(2)}
                </span>
              </div>
            </div>

            {/* BOTÓN PARA GUARDAR */}
            <div className="save-section">
              <button 
                onClick={handleSaveDeductions}
                disabled={!isFormValid() || saving}
                className="save-button"
              >
                {saving ? '💾 Guardando...' : '💾 Guardar Deducciones del Cliente'}
              </button>
              {!isFormValid() && selectedInvoice && (
                <p className="validation-message">
                  {!deductions.some(d => d.description && d.percentage) 
                    ? 'Agrega al menos una deducción válida' 
                    : 'Las deducciones no pueden ser mayores a la base imponible'
                  }
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedInvoice && (
        <div className="no-invoice-selected">
          <p>Selecciona una factura para gestionar sus deducciones</p>
        </div>
      )}
    </div>
  )
}

export default ClientDeductionsForm