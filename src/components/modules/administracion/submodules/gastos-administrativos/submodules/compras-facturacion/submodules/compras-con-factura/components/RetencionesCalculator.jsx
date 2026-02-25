// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-con-factura/components/RetencionesCalculator.jsx
import React, { useState, useEffect, useCallback } from 'react'

const RetencionesCalculator = ({ formData, onRetencionesChange }) => {
  const [retenciones, setRetenciones] = useState({
    retencionIva: '',
    conceptoIslr: '',
    retencionIslr: 0,
    totalPagar: 0,
    totalPagarDolares: 0,
    pagado: '',
    montoPagado: 0,
    pagadoDolares: 0,
    retencionPorCobrar: 0,
    retencionCobrada: 0,
    retencionIvaPendiente: 0,
    retencionIslrPendiente: 0,
    retencionIvaCobrada: 0,
    retencionIslrCobrada: 0
  })

  const [unidadTributaria, setUnidadTributaria] = useState(43)

  const conceptosNaturales = [
    { concepto: 'HONORARIOS PROFESIONALES', porcentaje: 3 },
    { concepto: 'COMISION VENTA INMUEBLES', porcentaje: 3 },
    { concepto: 'OTRAS COMISIONES', porcentaje: 3 },
    { concepto: 'INTERESES', porcentaje: 3 },
    { concepto: 'ALQUILER DE BIENES INMUEBLES', porcentaje: 3 },
    { concepto: 'ALQUILER DE BIENES MUEBLES', porcentaje: 3 },
    { concepto: 'CONTRATISTAS Y SERVICIOS', porcentaje: 1 },
    { concepto: 'FLETES NACIONALES', porcentaje: 1 },
    { concepto: 'ADQUISICION FONDOS DE COMERCIO', porcentaje: 3 },
    { concepto: 'PUBLICIDAD Y PROPAGANDA', porcentaje: 3 },
    { concepto: 'PUBLICIDAD Y PROPAGANDA RADIAL', porcentaje: 0 },
    { concepto: 'VENTA DE ACCIONES Y/O CUOTAS', porcentaje: 3 }
  ]

  const conceptosJuridicos = [
    { concepto: 'HONORARIOS PROFESIONALES', porcentaje: 5 },
    { concepto: 'COMISION VENTA INMUEBLES', porcentaje: 5 },
    { concepto: 'OTRAS COMISIONES', porcentaje: 5 },
    { concepto: 'INTERESES', porcentaje: 5 },
    { concepto: 'CONTRATISTAS Y SERVICIOS', porcentaje: 2 },
    { concepto: 'CANONES DE ARRENDAMIENTOS', porcentaje: 5 },
    { concepto: 'ARRENDAMIENTO DE BIENES MUEBLES', porcentaje: 5 },
    { concepto: 'FLETES NACIONALES', porcentaje: 3 },
    { concepto: 'ADQUISICION FONDOS DE COMERCIO', porcentaje: 5 },
    { concepto: 'PUBLICIDAD Y PROPAGANDA', porcentaje: 5 },
    { concepto: 'PUBLICIDAD Y PROPAGANDA RADIAL', porcentaje: 3 },
    { concepto: 'VENTA DE ACCIONES Y/O CUOTAS', porcentaje: 5 }
  ]

  const opcionesPago = [
    { value: 'COMPLETO_TOTAL', label: 'COMPLETO (TOTAL A PAGAR)' },
    { value: 'COMPLETO_TOTAL_RETENCIONES', label: 'COMPLETO (TOTAL A PAGAR) + RETENCION IVA + RETENCION ISLR' },
    { value: 'COMPLETO_TOTAL_RETENCION_IVA', label: 'COMPLETO (TOTAL A PAGAR) + RETENCION IVA' },
    { value: 'COMPLETO_TOTAL_RETENCION_ISLR', label: 'COMPLETO (TOTAL A PAGAR) + RETENCION ISLR' }
  ]

  // Calcular retenciones
  const calcularRetenciones = useCallback((currentRetenciones) => {
    // Usar valores por defecto si formData no tiene las propiedades
    const iva = formData?.iva || 0
    const baseImponible = formData?.baseImponible || 0
    const subTotalPagar = formData?.subTotalPagar || 0
    const tasaPago = formData?.tasaPago || 0
    const tipoRif = formData?.tipoRif || 'J-'

    let retencionIvaMonto = 0
    let retencionIslrMonto = 0

    // Calcular retención IVA
    if (currentRetenciones.retencionIva === 'IVA 75%') {
      retencionIvaMonto = iva * 0.75
    } else if (currentRetenciones.retencionIva === 'IVA 100%') {
      retencionIvaMonto = iva
    }

    // Calcular retención ISLR según tabla correspondiente
    const esPersonaNatural = tipoRif === 'V-' || tipoRif === 'E-'
    const conceptos = esPersonaNatural ? conceptosNaturales : conceptosJuridicos

    const conceptoSeleccionado = conceptos
      .find(concepto => concepto.concepto === currentRetenciones.conceptoIslr)

    if (conceptoSeleccionado && conceptoSeleccionado.porcentaje > 0) {
      if (esPersonaNatural) {
        // Para personas naturales - fórmula específica
        const pagosMayoresA = 83.3333 * unidadTributaria
        const baseSustraendo = (conceptoSeleccionado.porcentaje / 100) * pagosMayoresA
        retencionIslrMonto = ((conceptoSeleccionado.porcentaje / 100) * baseImponible) - baseSustraendo

        // Asegurar que no sea negativo
        retencionIslrMonto = Math.max(0, retencionIslrMonto)
      } else {
        // Para personas jurídicas - porcentaje sobre el total
        retencionIslrMonto = (conceptoSeleccionado.porcentaje / 100) * baseImponible
      }
    }

    const totalPagar = subTotalPagar - retencionIvaMonto - retencionIslrMonto
    const totalPagarDolares = tasaPago > 0 ? totalPagar / tasaPago : 0

    // Calcular montos según opción de pago seleccionada
    let montoPagado = 0
    let retencionPorCobrar = 0
    let retencionCobrada = 0
    let retencionIvaPendiente = 0
    let retencionIslrPendiente = 0
    let retencionIvaCobrada = 0
    let retencionIslrCobrada = 0

    switch (currentRetenciones.pagado) {
      case 'COMPLETO_TOTAL':
        montoPagado = totalPagar
        retencionPorCobrar = 0
        retencionCobrada = retencionIvaMonto + retencionIslrMonto
        retencionIvaCobrada = retencionIvaMonto
        retencionIslrCobrada = retencionIslrMonto
        break
      case 'COMPLETO_TOTAL_RETENCIONES':
        montoPagado = totalPagar + retencionIvaMonto + retencionIslrMonto
        retencionPorCobrar = retencionIvaMonto + retencionIslrMonto
        retencionCobrada = 0
        retencionIvaPendiente = retencionIvaMonto
        retencionIslrPendiente = retencionIslrMonto
        break
      case 'COMPLETO_TOTAL_RETENCION_IVA':
        montoPagado = totalPagar + retencionIvaMonto
        retencionPorCobrar = retencionIvaMonto
        retencionCobrada = retencionIslrMonto
        retencionIvaPendiente = retencionIvaMonto
        retencionIslrCobrada = retencionIslrMonto
        break
      case 'COMPLETO_TOTAL_RETENCION_ISLR':
        montoPagado = totalPagar + retencionIslrMonto
        retencionPorCobrar = retencionIslrMonto
        retencionCobrada = retencionIvaMonto
        retencionIslrPendiente = retencionIslrMonto
        retencionIvaCobrada = retencionIvaMonto
        break
      default:
        montoPagado = 0
        retencionPorCobrar = retencionIvaMonto + retencionIslrMonto
        retencionCobrada = 0
        retencionIvaPendiente = retencionIvaMonto
        retencionIslrPendiente = retencionIslrMonto
    }

    const pagadoDolares = tasaPago > 0 ? montoPagado / tasaPago : 0

    return {
      ...currentRetenciones,
      retencionIslr: retencionIslrMonto,
      totalPagar,
      totalPagarDolares,
      montoPagado,
      pagadoDolares,
      retencionPorCobrar,
      retencionCobrada,
      retencionIvaPendiente,
      retencionIslrPendiente,
      retencionIvaCobrada,
      retencionIslrCobrada
    }
  }, [formData?.iva, formData?.tipoRif, formData?.baseImponible, formData?.subTotalPagar, formData?.tasaPago, unidadTributaria])

  // Efecto para sincronizar el estado interno con formData cuando se carga una factura para editar
  useEffect(() => {
    if (formData?.id) {
      // Cargar TODOS los valores de retenciones desde formData para modo edición
      setRetenciones({
        retencionIva: formData.retencionIva || '',
        conceptoIslr: formData.conceptoIslr || '',
        retencionIslr: formData.retencionIslr || 0,
        totalPagar: formData.totalPagar || 0,
        totalPagarDolares: formData.totalPagarDolares || 0,
        pagado: formData.pagado || '',
        montoPagado: formData.montoPagado || 0,
        pagadoDolares: formData.pagadoDolares || 0,
        retencionPorCobrar: formData.retencionPorCobrar || 0,
        retencionCobrada: formData.retencionCobrada || 0,
        retencionIvaPendiente: formData.retencionIvaPendiente || 0,
        retencionIslrPendiente: formData.retencionIslrPendiente || 0,
        retencionIvaCobrada: formData.retencionIvaCobrada || 0,
        retencionIslrCobrada: formData.retencionIslrCobrada || 0
      })
    }
  }, [formData?.id])

  // Efecto para calcular retenciones cuando cambien los datos del formulario
  useEffect(() => {
    // Calcular si tenemos datos válidos (sea edición o creación)
    // El problema previo era que formData?.id bloqueaba el recálculo al editar la tasa de pago
    if (formData?.subTotalPagar > 0 || formData?.iva > 0 || formData?.tasaPago > 0) {
      const nuevasRetenciones = calcularRetenciones(retenciones)

      // Comparamos el objeto completo para evitar omitir algún campo como montoPagado
      if (JSON.stringify(nuevasRetenciones) !== JSON.stringify(retenciones)) {
        setRetenciones(nuevasRetenciones)
        if (typeof onRetencionesChange === 'function') {
          onRetencionesChange(nuevasRetenciones)
        }
      }
    }
  }, [
    formData?.iva,
    formData?.subTotalPagar,
    formData?.tasaPago,
    unidadTributaria,
    calcularRetenciones
  ])

  const handleRetencionChange = (name, value) => {
    const nuevasRetenciones = {
      ...retenciones,
      [name]: value
    }

    const retencionesCalculadas = calcularRetenciones(nuevasRetenciones)
    setRetenciones(retencionesCalculadas)

    // Verificar que onRetencionesChange sea una función antes de llamarla
    if (typeof onRetencionesChange === 'function') {
      onRetencionesChange(retencionesCalculadas)
    }
  }

  const handleUnidadTributariaChange = (value) => {
    const nuevaUnidad = parseFloat(value) || 0
    setUnidadTributaria(nuevaUnidad)
  }

  const esPersonaNatural = formData?.tipoRif === 'V-' || formData?.tipoRif === 'E-'
  const conceptosDisponibles = esPersonaNatural ? conceptosNaturales : conceptosJuridicos

  // Calcular retención IVA actual para mostrar en el campo
  const retencionIvaActual = retenciones.retencionIva === 'IVA 75%' ? (formData?.iva || 0) * 0.75 :
    retenciones.retencionIva === 'IVA 100%' ? (formData?.iva || 0) : 0

  return (
    <div className="ccf-retenciones-calculator">
      <div className="ccf-form-section">
        <h3>Cálculo de Retenciones (Montos en Bolívares)</h3>

        <div className="ccf-form-grid">
          <div className="ccf-form-group">
            <label>RETENCIÓN DEL IVA</label>
            <select
              value={retenciones.retencionIva}
              onChange={(e) => handleRetencionChange('retencionIva', e.target.value)}
            >
              <option value="">Seleccionar retención IVA</option>
              <option value="IVA 75%">IVA 75%</option>
              <option value="IVA 100%">IVA 100%</option>
            </select>
          </div>

          <div className="ccf-form-group">
            <label>CONCEPTO ISLR ({esPersonaNatural ? 'NATURAL' : 'JURÍDICA'})</label>
            <select
              value={retenciones.conceptoIslr}
              onChange={(e) => handleRetencionChange('conceptoIslr', e.target.value)}
            >
              <option value="">Seleccionar concepto</option>
              {conceptosDisponibles.map(concepto => (
                <option key={concepto.concepto} value={concepto.concepto}>
                  {concepto.concepto} ({concepto.porcentaje}%)
                </option>
              ))}
            </select>
          </div>

          <div className="ccf-form-group">
            <label>RETENCIÓN IVA (Bs)</label>
            <div className="ccf-readonly-value">
              {retencionIvaActual.toFixed(2)}
            </div>
          </div>

          <div className="ccf-form-group">
            <label>RETENCIÓN ISLR (Bs)</label>
            <div className="ccf-readonly-value">
              {retenciones.retencionIslr.toFixed(2)}
            </div>
          </div>

          <div className="ccf-form-group">
            <label>TOTAL A PAGAR (Bs)</label>
            <div className="ccf-readonly-value ccf-total-importante">
              {retenciones.totalPagar.toFixed(2)}
            </div>
          </div>

          <div className="ccf-form-group">
            <label>PAGADO</label>
            <select
              value={retenciones.pagado}
              onChange={(e) => handleRetencionChange('pagado', e.target.value)}
            >
              <option value="">Seleccionar opción de pago</option>
              {opcionesPago.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
          </div>

          <div className="ccf-form-group">
            <label>MONTO PAGADO (Bs)</label>
            <div className="ccf-readonly-value">
              {retenciones.montoPagado.toFixed(2)}
            </div>
          </div>

          <div className="ccf-form-group">
            <label>PAGADO EN DÓLARES ($)</label>
            <div className="ccf-readonly-value">
              {retenciones.pagadoDolares.toFixed(2)}
            </div>
          </div>

          <div className="ccf-form-group">
            <label>UNIDAD TRIBUTARIA (Bs)</label>
            <input
              type="number"
              step="0.01"
              value={unidadTributaria}
              onChange={(e) => handleUnidadTributariaChange(e.target.value)}
            />
          </div>

          {/* Detalle de retenciones por tipo */}
          <div className="ccf-form-group full-width">
            <label>DETALLE DE RETENCIONES</label>
            <div className="ccf-retenciones-detalle-grid">
              <div className="ccf-retencion-tipo">
                <h4>IVA</h4>
                <div className="ccf-retencion-item">
                  <span>Por Cobrar:</span>
                  <span className="ccf-estado-pendiente">
                    Bs {retenciones.retencionIvaPendiente.toFixed(2)}
                  </span>
                </div>
                <div className="ccf-retencion-item">
                  <span>Cobrado:</span>
                  <span className="ccf-estado-bueno">
                    Bs {retenciones.retencionIvaCobrada.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="ccf-retencion-tipo">
                <h4>ISLR</h4>
                <div className="ccf-retencion-item">
                  <span>Por Cobrar:</span>
                  <span className="ccf-estado-pendiente">
                    Bs {retenciones.retencionIslrPendiente.toFixed(2)}
                  </span>
                </div>
                <div className="ccf-retencion-item">
                  <span>Cobrado:</span>
                  <span className="ccf-estado-bueno">
                    Bs {retenciones.retencionIslrCobrada.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="ccf-retencion-total">
                <div className="ccf-total-item">
                  <strong>Total por Cobrar:</strong>
                  <strong className="ccf-estado-pendiente">
                    Bs {retenciones.retencionPorCobrar.toFixed(2)}
                  </strong>
                </div>
                <div className="ccf-total-item">
                  <strong>Total Cobrado:</strong>
                  <strong className="ccf-estado-bueno">
                    Bs {retenciones.retencionCobrada.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetencionesCalculator