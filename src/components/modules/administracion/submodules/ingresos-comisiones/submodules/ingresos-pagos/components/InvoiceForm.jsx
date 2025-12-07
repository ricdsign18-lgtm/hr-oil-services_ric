// src/components/modules/administracion/submodules/ingresos-comisiones/submodules/ingresos-pagos/components/InvoiceForm.jsx
import React, { useState, useEffect } from 'react'
import { useValuation } from '../../../../../../../../contexts/ValuationContext'
import './InvoiceForm.css'

const InvoiceForm = ({ onSubmit, initialData = null, isEditing = false, onCancel }) => {
  const { valuations } = useValuation()

  const [formData, setFormData] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    clientName: '',
    clientRif: '',
    clientAddress: '',
    description: '',
    exemptAmount: '',
    taxableBase: '',
    exchangeRate: '',
    valuationId: '',
    status: 'por_cobrar' // Nuevo campo por defecto
  })

  const [calculatedValues, setCalculatedValues] = useState({
    subtotal: 0,
    ivaAmount: 0,
    totalAmount: 0
  })

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        invoiceDate: initialData.invoice_date,
        clientName: initialData.client_name,
        clientRif: initialData.client_rif,
        clientAddress: initialData.client_address || '',
        description: initialData.description || '',
        exemptAmount: initialData.exempt_amount,
        taxableBase: initialData.taxable_base,
        exchangeRate: initialData.exchange_rate,
        valuationId: initialData.valuation_id || '',
        status: initialData.status || 'por_cobrar'
      })
    }
  }, [initialData, isEditing])

  // Calcular valores automáticamente
  useEffect(() => {
    const exempt = parseFloat(formData.exemptAmount) || 0
    const taxable = parseFloat(formData.taxableBase) || 0
    const exchange = parseFloat(formData.exchangeRate) || 1

    const subtotal = exempt + taxable
    const ivaAmount = taxable * 0.16
    const totalAmount = subtotal + ivaAmount

    setCalculatedValues({
      subtotal,
      ivaAmount,
      totalAmount
    })
  }, [formData.exemptAmount, formData.taxableBase, formData.exchangeRate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const invoiceData = {
      ...formData,
      exemptAmount: parseFloat(formData.exemptAmount) || 0,
      taxableBase: parseFloat(formData.taxableBase),
      exchangeRate: parseFloat(formData.exchangeRate),
      subtotal: calculatedValues.subtotal,
      ivaAmount: calculatedValues.ivaAmount,
      totalAmount: calculatedValues.totalAmount,
      valuationId: formData.valuationId || null,
      status: formData.status
    }

    onSubmit(invoiceData)
  }

  return (
    <div className="invoice-form">
      <div className="form-header">
        <h2>{isEditing ? '✏️ Editar Factura' : '📄 Nueva Factura'}</h2>
        {isEditing && (
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancelar Edición
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Fecha de la Factura *</label>
            <input
              type="date"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Estado de la Factura *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`status-select ${formData.status}`}
              required
            >
              <option value="por_cobrar">⏳ Por Cobrar</option>
              <option value="cobrada">✅ Cobrada</option>
            </select>
          </div>

          <div className="form-group">
            <label>Vincular Valuación (Opcional)</label>
            <select
              name="valuationId"
              value={formData.valuationId}
              onChange={handleChange}
              className="valuation-select"
            >
              <option value="">-- Seleccionar Valuación --</option>
              {valuations.map(val => (
                <option key={val.id} value={val.id}>
                  {val.numero} - {val.periodoInicio} al {val.periodoFin}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nombre del Cliente *</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Ingrese nombre del cliente"
              required
            />
          </div>

          <div className="form-group">
            <label>RIF *</label>
            <input
              type="text"
              name="clientRif"
              value={formData.clientRif}
              onChange={handleChange}
              placeholder="Ej: J-123456789"
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Dirección</label>
            <input
              type="text"
              name="clientAddress"
              value={formData.clientAddress}
              onChange={handleChange}
              placeholder="Dirección del cliente"
            />
          </div>

          <div className="form-group full-width">
            <label>Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción de los servicios o productos"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Exento (Bs) *</label>
            <input
              type="number"
              step="0.01"
              name="exemptAmount"
              value={formData.exemptAmount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Base Imponible (Bs) *</label>
            <input
              type="number"
              step="0.01"
              name="taxableBase"
              value={formData.taxableBase}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Tasa de Cambio (Bs/USD) *</label>
            <input
              type="number"
              step="0.0001"
              name="exchangeRate"
              value={formData.exchangeRate}
              onChange={handleChange}
              placeholder="0.0000"
              required
            />
          </div>
        </div>

        {/* Valores Calculados */}
        <div className="calculated-values">
          <h3>Valores Calculados</h3>
          <div className="calculated-grid">
            <div className="calculated-item">
              <label>Subtotal (Bs):</label>
              <span className="value">{calculatedValues.subtotal.toFixed(2)}</span>
            </div>
            <div className="calculated-item">
              <label>IVA 16% (Bs):</label>
              <span className="value">{calculatedValues.ivaAmount.toFixed(2)}</span>
            </div>
            <div className="calculated-item total">
              <label>TOTAL FACTURA (Bs):</label>
              <span className="value">{calculatedValues.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button type="submit" className="submit-button">
          {isEditing ? '💾 Actualizar Factura' : '💾 Guardar Factura y Continuar'}
        </button>
      </form>
    </div>
  )
}

export default InvoiceForm