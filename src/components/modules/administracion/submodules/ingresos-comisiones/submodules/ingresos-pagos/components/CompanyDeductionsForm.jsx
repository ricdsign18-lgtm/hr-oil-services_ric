// src/components/modules/administracion/submodules/ingresos-comisiones/submodules/ingresos-pagos/components/CompanyDeductionsForm.jsx
import React, { useState } from 'react'
import { useIncome } from '../../../../../../../../contexts/IncomeContext'
import { useNotification } from '../../../../../../../../contexts/NotificationContext'
import './CompanyDeductionsForm.css'

const CompanyDeductionsForm = ({ dailyTotals, selectedDate, onDeductionSubmit }) => {
  const { companyDeductions, deleteCompanyDeduction } = useIncome()
  const { showToast } = useNotification()
  const [deductions, setDeductions] = useState([{ description: '', percentage: '' }])
  const [deductionDate, setDeductionDate] = useState(selectedDate)
  const [saving, setSaving] = useState(false)

  // Filtrar deducciones existentes para la fecha seleccionada
  const existingDeductions = companyDeductions.filter(
    d => d.deduction_date === deductionDate
  )

  const handleDeleteExisting = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta deducción?')) {
      try {
        await deleteCompanyDeduction(id)
        showToast('Deducción eliminada', 'success')
      } catch (error) {
        showToast('Error al eliminar', 'error')
      }
    }
  }

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

  // CORREGIDO: Calcular montos en Bs
  const calculateDeductionAmountBs = (percentage) => {
    if (!percentage) return 0
    return (parseFloat(percentage) / 100) * dailyTotals.totalTaxableBase
  }

  // CORREGIDO: Calcular montos en USD usando la tasa de `income_invoices`
  const calculateDeductionAmountUsd = (percentage) => {
    if (!percentage) return 0
    const amountBs = calculateDeductionAmountBs(percentage)
    const exchangeRate = dailyTotals.exchangeRate || 36 // Fallback a 36 si no se provee
    if (exchangeRate === 0) return 0
    return amountBs / exchangeRate
  }

  const calculateTotalDeductionsBs = () => {
    return deductions.reduce((total, deduction) => {
      if (deduction.percentage) {
        return total + calculateDeductionAmountBs(deduction.percentage)
      }
      return total
    }, 0)
  }

  const calculateTotalDeductionsUsd = () => {
    return deductions.reduce((total, deduction) => {
      if (deduction.percentage) {
        return total + calculateDeductionAmountUsd(deduction.percentage)
      }
      return total
    }, 0)
  }

  // CORREGIDO: El ingreso final se calcula sobre el monto recibido al banco
  const calculateTotalIncomeBs = () => {
    return dailyTotals.totalReceivedBs - calculateTotalDeductionsBs()
  }

  const calculateTotalIncomeUsd = () => {
    return dailyTotals.totalReceivedUsd - calculateTotalDeductionsUsd()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Filtrar deducciones válidas
    const validDeductions = deductions.filter(deduction =>
      deduction.description && deduction.percentage
    )

    if (validDeductions.length === 0) {
      showToast('Por favor agrega al menos una deducción válida', 'warning')
      return
    }

    setSaving(true)
    try {
      // Guardar cada deducción individualmente
      for (const deduction of validDeductions) {
        const deductionData = {
          deductionDate: deductionDate,
          description: deduction.description,
          percentage: parseFloat(deduction.percentage),
          amount: calculateDeductionAmountBs(deduction.percentage), // Monto en Bs
          amount_usd: calculateDeductionAmountUsd(deduction.percentage) // Monto en USD
        }
        await onDeductionSubmit(deductionData)
      }

      showToast('✅ Deducciones de empresa guardadas exitosamente', 'success')

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
    return deductions.some(deduction => deduction.description && deduction.percentage) &&
      calculateTotalDeductionsBs() <= dailyTotals.totalTaxableBase
  }

  return (
    <div className="company-deductions-form">
      <h2>🏢 Deducciones de la Empresa</h2>

      <div className="daily-summary-card">
        <h3>Resumen del Día {selectedDate}</h3>
        <div className="summary-cards">
          <div className="summary-card primary">
            <label>SUMATORIA BASES IMPONIBLES:</label>
            <div className="amount-group">
              <span className="amount-bs">Bs {dailyTotals.totalTaxableBase.toFixed(2)}</span>
            </div>
            <small>Total de todas las bases imponibles de las facturas</small>
          </div>
          <div className="summary-card secondary">
            <label>MONTO RECIBIDO AL BANCO:</label>
            <div className="amount-group">
              <span className="amount-bs">Bs {dailyTotals.totalReceivedBs.toFixed(2)}</span>
              <span className="amount-usd">USD {dailyTotals.totalReceivedUsd.toFixed(2)}</span>
            </div>
            <small>Después de deducciones del cliente</small>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="date-selection">
          <label>Fecha de las Deducciones:</label>
          <input
            type="date"
            value={deductionDate}
            onChange={(e) => setDeductionDate(e.target.value)}
            required
          />
        </div>

        {/* Lista de Deducciones Existentes */}
        {existingDeductions.length > 0 && (
          <div className="existing-deductions">
            <h3>Deducciones Existentes ({deductionDate})</h3>
            <div className="existing-list">
              {existingDeductions.map(deduction => (
                <div key={deduction.id} className="existing-item">
                  <div className="info">
                    <strong>{deduction.description}</strong>
                    <span>{deduction.percentage}% - Bs {parseFloat(deduction.amount).toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    className="delete-btn-small"
                    onClick={() => handleDeleteExisting(deduction.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="deductions-section">
          <div className="section-header">
            <h3>Deducciones de la Empresa</h3>
            <button type="button" onClick={addDeduction} className="add-button">
              + Agregar Deducción
            </button>
          </div>

          <div className="info-message">
            <p>💡 <strong>Nota:</strong> Las deducciones de empresa se calculan sobre la <strong>sumatoria de todas las bases imponibles</strong> de las facturas del día.</p>
          </div>

          {deductions.map((deduction, index) => (
            <div key={index} className="deduction-row">
              <div className="deduction-inputs">
                <input
                  type="text"
                  placeholder="Descripción de la deducción"
                  value={deduction.description}
                  onChange={(e) => updateDeduction(index, 'description', e.target.value)}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Porcentaje %"
                  value={deduction.percentage}
                  onChange={(e) => updateDeduction(index, 'percentage', e.target.value)}
                  min="0"
                  max="100"
                  required
                />
                <span className="deduction-amount">
                  Bs {calculateDeductionAmountBs(deduction.percentage).toFixed(2)}
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
              <label>TOTAL DEDUCCIONES DE LA EMPRESA (Bs):</label>
              <span className="total-amount">
                Bs {calculateTotalDeductionsBs().toFixed(2)}
              </span>
            </div>
            <div className="total-item">
              <label>TOTAL DEDUCCIONES DE LA EMPRESA (USD):</label>
              <span className="total-amount">
                USD {calculateTotalDeductionsUsd().toFixed(2)}
              </span>
            </div>
            <div className="total-item highlight">
              <label>TOTAL INGRESO BS:</label>
              <span className="total-amount">
                Bs {calculateTotalIncomeBs().toFixed(2)}
              </span>
              <small>(Monto recibido al banco - Deducciones empresa)</small>
            </div>
            <div className="total-item highlight">
              <label>TOTAL INGRESO USD:</label>
              <span className="total-amount">
                USD {calculateTotalIncomeUsd().toFixed(2)}
              </span>
              <small>(Monto recibido al banco USD - Deducciones empresa USD)</small>
            </div>
          </div>

          <div className="save-section">
            <button
              type="submit"
              disabled={!isFormValid() || saving}
              className="submit-button"
            >
              {saving ? '💾 Guardando...' : '💾 Guardar Deducciones de Empresa'}
            </button>
            {!isFormValid() && (
              <p className="validation-message">
                {!deductions.some(d => d.description && d.percentage)
                  ? 'Agrega al menos una deducción válida'
                  : 'Las deducciones no pueden ser mayores a la sumatoria de bases imponibles'
                }
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default CompanyDeductionsForm