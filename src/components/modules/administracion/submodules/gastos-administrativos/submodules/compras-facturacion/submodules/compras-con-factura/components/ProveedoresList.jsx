import { useState, useEffect } from 'react'
import supabase from '../../../../../../../../../../api/supaBase'
import { useNotification } from '../../../../../../../../../../contexts/NotificationContext'
import { MultiUsersIcon, CheckCircleIcon, AlertTriangleIcon, SackDollarIcon } from '../../../../../../../../../../assets/icons/Icons'
import './ProveedoresList.css'

const ProveedoresList = ({ projectId, refreshTrigger }) => {
  const { showToast } = useNotification();
  const [facturas, setFacturas] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [allProveedores, setAllProveedores] = useState([])
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [pagosTemp, setPagosTemp] = useState({})

  useEffect(() => {
    cargarFacturas()
    cargarProveedoresGlobales()
  }, [projectId, refreshTrigger])

  useEffect(() => {
    procesarProveedores()
  }, [facturas, allProveedores])

  const cargarProveedoresGlobales = async () => {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
      if (error) throw error
      setAllProveedores(data || [])
    } catch (error) {
      console.error('Error cargando proveedores globales:', error)
    }
  }

  const cargarFacturas = async () => {
    try {
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('projectId', projectId)
        .neq('status', 'deleted')
      if (error) throw error
      setFacturas(data || [])
    } catch (error) {
      console.error('Error cargando facturas para proveedores:', error)
    }
  }

  const procesarProveedores = () => {
    const proveedoresMap = {}

    // 1. Inicializar con todos los proveedores globales
    allProveedores.forEach(p => {
      // Normalizar clave para coincidir con facturas
      const key = `${p.nombre}_${p.tiporif}_${p.rif || 'NA'}`
      proveedoresMap[key] = {
        proveedor: p.nombre,
        tipoRif: p.tiporif,
        rif: p.rif,
        direccion: p.direccion,
        facturas: [],
        totalBaseImponible: 0,
        totalIva: 0,
        totalExcento: 0,
        totalSubTotalPagar: 0,
        totalRetencionIva: 0,
        totalRetencionIslr: 0,
        totalPagar: 0,
        totalMontoPagado: 0,
        totalPagarDolares: 0,
        totalPagadoDolares: 0,
        totalRetencionPorCobrar: 0,
        totalRetencionCobrada: 0,
        retencionIvaPendiente: 0,
        retencionIslrPendiente: 0,
        retencionIvaCobrada: 0,
        retencionIslrCobrada: 0,
        estadoRetenciones: 'al-dia'
      }
    })

    // 2. Procesar facturas y sumarizar
    facturas.forEach(factura => {
      const key = `${factura.proveedor}_${factura.tipoRif}_${factura.rif || 'NA'}`

      if (!proveedoresMap[key]) {
        proveedoresMap[key] = {
          proveedor: factura.proveedor,
          tipoRif: factura.tipoRif,
          rif: factura.rif,
          direccion: factura.direccion,
          facturas: [],
          totalBaseImponible: 0,
          totalIva: 0,
          totalExcento: 0,
          totalSubTotalPagar: 0,
          totalRetencionIva: 0,
          totalRetencionIslr: 0,
          totalPagar: 0,
          totalMontoPagado: 0,
          totalPagarDolares: 0,
          totalPagadoDolares: 0,
          totalRetencionPorCobrar: 0,
          totalRetencionCobrada: 0,
          retencionIvaPendiente: 0,
          retencionIslrPendiente: 0,
          retencionIvaCobrada: 0,
          retencionIslrCobrada: 0,
          estadoRetenciones: 'al-dia'
        }
      }

      proveedoresMap[key].facturas.push(factura)

      // Sumar todos los montos en Bolívares
      proveedoresMap[key].totalBaseImponible += factura.baseImponible || 0
      proveedoresMap[key].totalIva += factura.iva || 0
      proveedoresMap[key].totalExcento += factura.excento || 0
      proveedoresMap[key].totalSubTotalPagar += factura.subTotalPagar || 0

      // Calcular retenciones IVA
      let retencionIvaFactura = 0
      if (factura.retencionIva === 'IVA 75%') {
        retencionIvaFactura = factura.iva * 0.75
      } else if (factura.retencionIva === 'IVA 100%') {
        retencionIvaFactura = factura.iva
      }
      proveedoresMap[key].totalRetencionIva += retencionIvaFactura

      // Retención ISLR
      proveedoresMap[key].totalRetencionIslr += factura.retencionIslr || 0

      // Totales de pago
      proveedoresMap[key].totalPagar += factura.totalPagar || 0
      proveedoresMap[key].totalMontoPagado += factura.montoPagado || 0
      // Calcular y sumar el total a pagar en dólares por factura
      if (factura.tasaPago > 0) {
        proveedoresMap[key].totalPagarDolares += (factura.totalPagar || 0) / factura.tasaPago
      }
      proveedoresMap[key].totalPagadoDolares += factura.pagadoDolares || 0
      proveedoresMap[key].totalRetencionPorCobrar += factura.retencionPorCobrar || 0
      proveedoresMap[key].totalRetencionCobrada += factura.retencionCobrada || 0

      // CALCULO CORREGIDO: Usar los valores específicos de la factura
      proveedoresMap[key].retencionIvaPendiente += factura.retencionIvaPendiente || 0
      proveedoresMap[key].retencionIslrPendiente += factura.retencionIslrPendiente || 0
      proveedoresMap[key].retencionIvaCobrada += factura.retencionIvaCobrada || 0
      proveedoresMap[key].retencionIslrCobrada += factura.retencionIslrCobrada || 0
    })

    // Calcular estado de retenciones por proveedor
    Object.keys(proveedoresMap).forEach(key => {
      if (proveedoresMap[key].totalRetencionPorCobrar > 0) {
        proveedoresMap[key].estadoRetenciones = 'pendiente'
      } else {
        proveedoresMap[key].estadoRetenciones = 'al-dia'
      }
    })

    setProveedores(Object.values(proveedoresMap))
  }

  const proveedoresFiltrados = proveedores.filter(proveedor => {
    const cumpleNombre = proveedor.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase()) ||
      (proveedor.rif && proveedor.rif.includes(filtroProveedor))

    const cumpleEstado = filtroEstado === 'todos' || proveedor.estadoRetenciones === filtroEstado

    return cumpleNombre && cumpleEstado
  })

  const getEstadoBadge = (estado) => {
    if (estado === 'al-dia') {
      return <span className="estado-badge estado-bueno">Al Día</span>
    } else {
      return <span className="estado-badge estado-pendiente">Pendiente</span>
    }
  }

  const handleMarcarPago = (proveedor) => {
    setProveedorSeleccionado(proveedor)

    // Identificar facturas pendientes de este proveedor
    const facturasPendientes = proveedor.facturas.filter(f => f.retencionPorCobrar > 0)

    // Inicializar estado temporal de pagos
    const initialTemp = {}
    facturasPendientes.forEach(f => {
      initialTemp[f.id] = {
        pagoIva: 0,
        pagoIslr: 0,
        maxIva: f.retencionIvaPendiente || 0,
        maxIslr: f.retencionIslrPendiente || 0
      }
    })
    setPagosTemp(initialTemp)
    setMostrarModalPago(true)
  }

  const handlePagoChange = (facturaId, field, value) => {
    let numericValue = 0
    if (value !== '') {
      numericValue = parseFloat(value)
    }

    setPagosTemp(prev => {
      const current = prev[facturaId]
      const max = field === 'pagoIva' ? current.maxIva : current.maxIslr

      // Validar que no exceda el monto pendiente
      if (numericValue > max) return prev
      if (numericValue < 0) return prev

      return {
        ...prev,
        [facturaId]: {
          ...current,
          [field]: numericValue
        }
      }
    })
  }

  const handlePagarTodoFactura = (facturaId) => {
    setPagosTemp(prev => ({
      ...prev,
      [facturaId]: {
        ...prev[facturaId],
        pagoIva: prev[facturaId].maxIva,
        pagoIslr: prev[facturaId].maxIslr
      }
    }))
  }

  const procesarPago = async () => {
    const actualizaciones = []

    console.log("Iniciando procesamiento de pagos:", pagosTemp)

    Object.keys(pagosTemp).forEach(facturaId => {
      const pago = pagosTemp[facturaId]
      const totalPagar = (pago.pagoIva || 0) + (pago.pagoIslr || 0)

      if (totalPagar > 0) {
        // Buscar factura original - Usar == para permitir coincidencia string/numero
        const facturaOriginal = facturas.find(f => f.id == facturaId)

        if (!facturaOriginal) {
          console.error(`Factura no encontrada para ID: ${facturaId}`)
          return
        }

        let nuevaRetencionIvaPendiente = (facturaOriginal.retencionIvaPendiente || 0) - (pago.pagoIva || 0)
        let nuevaRetencionIslrPendiente = (facturaOriginal.retencionIslrPendiente || 0) - (pago.pagoIslr || 0)
        let nuevaRetencionIvaCobrada = (facturaOriginal.retencionIvaCobrada || 0) + (pago.pagoIva || 0)
        let nuevaRetencionIslrCobrada = (facturaOriginal.retencionIslrCobrada || 0) + (pago.pagoIslr || 0)

        // Asegurar no negativos por redondeo
        if (nuevaRetencionIvaPendiente < 0) nuevaRetencionIvaPendiente = 0
        if (nuevaRetencionIslrPendiente < 0) nuevaRetencionIslrPendiente = 0

        let nuevaRetencionPorCobrar = nuevaRetencionIvaPendiente + nuevaRetencionIslrPendiente
        let nuevaRetencionCobrada = nuevaRetencionIvaCobrada + nuevaRetencionIslrCobrada

        actualizaciones.push({
          id: facturaOriginal.id,
          update: {
            retencionPorCobrar: nuevaRetencionPorCobrar,
            retencionCobrada: nuevaRetencionCobrada,
            retencionIvaPendiente: nuevaRetencionIvaPendiente,
            retencionIslrPendiente: nuevaRetencionIslrPendiente,
            retencionIvaCobrada: nuevaRetencionIvaCobrada,
            retencionIslrCobrada: nuevaRetencionIslrCobrada,
            updatedAt: new Date().toISOString()
          }
        })
      }
    })

    if (actualizaciones.length === 0) {
      showToast('No hay montos ingresados para procesar.', 'warning')
      return
    }

    if (!window.confirm(`¿Está seguro de que desea procesar pagos para ${actualizaciones.length} factura(s)?`)) {
      return
    }

    try {
      const promises = actualizaciones.map(item =>
        supabase.from('facturas').update(item.update).eq('id', item.id)
      )

      const results = await Promise.all(promises)
      results.forEach(res => { if (res.error) throw res.error })

      showToast('Pagos de retenciones procesados exitosamente', 'success')
      cargarFacturas()
      setMostrarModalPago(false)
      setProveedorSeleccionado(null)
    } catch (error) {
      console.error('Error al procesar pagos:', error)
      showToast(`Error al procesar pagos: ${error.message}`, 'error')
    }
  }

  return (
    <div className="proveedores-list">
      <div className="section-header-proveedores">
        <h3>Proveedores y Retenciones</h3>
        <div className="filtros" style={{ display: 'flex', gap: '10px' }}>
          <select
            className="search-input"
            style={{ width: 'auto', minWidth: '150px' }}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los Estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="al-dia">Al Día</option>
          </select>
          <input
            type="text"
            placeholder="Buscar por proveedor o RIF..."
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="proveedores-summary-container">
        <div className="summary-header-proveedores">
          <h3>Resumen General</h3>
        </div>

        <div className="summary-grid">
          <div className="summary-card-proveedores">
            <div className="card-icon-wrapper icon-users">
              <MultiUsersIcon />
              <span className="card-label">TOTAL PROVEEDORES</span>
            </div>
            <strong className="card-value">{proveedores.length}</strong>
          </div>

          <div className="summary-card-proveedores">
            <div className="card-icon-wrapper icon-check">
              <CheckCircleIcon />
              <span className="card-label">PROVEEDORES AL DÍA</span>
            </div>
            <strong className="card-value">
              {proveedores.filter(p => p.estadoRetenciones === 'al-dia').length}
            </strong>
          </div>

          <div className="summary-card-proveedores">
            <div className="card-icon-wrapper icon-alert">
              <AlertTriangleIcon />
              <span className="card-label">PROVEEDORES PENDIENTES</span>
            </div>
            <strong className="card-value">
              {proveedores.filter(p => p.estadoRetenciones === 'pendiente').length}
            </strong>
          </div>

          <div className="summary-card-proveedores">
            <div className="card-icon-wrapper icon-money">
              <SackDollarIcon />
              <span className="card-label">TOTAL RET. POR COBRAR</span>
            </div>
            <strong className="card-value">
              $ {proveedores.reduce((sum, p) => sum + (p.totalRetencionPorCobrar / 50), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="summary-card-proveedores">
            <div className="card-icon-wrapper icon-money">
              <SackDollarIcon />
              <span className="card-label">TOTAL EN DÓLARES</span>
            </div>
            <strong className="card-value">
              $ {proveedores.reduce((sum, p) => sum + (p.totalPagarDolares || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      <div className="proveedores-grid">
        {proveedoresFiltrados.map((proveedor, index) => (
          <div key={index} className="proveedor-card">
            <div className="proveedor-header">
              <div className="proveedor-info-main">
                <h4>{proveedor.proveedor}</h4>
                <span className="rif">{proveedor.tipoRif}{proveedor.rif}</span>
              </div>
              <div className="proveedor-actions">
                {getEstadoBadge(proveedor.estadoRetenciones)}
                {proveedor.estadoRetenciones === 'pendiente' && (
                  <button
                    className="btn-pagar"
                    onClick={() => handleMarcarPago(proveedor)}
                  >
                    Marcar Pago
                  </button>
                )}
              </div>
            </div>

            <div className="proveedor-info">
              <p><strong>Dirección:</strong> {proveedor.direccion || 'No especificada'}</p>
              <p><strong>Total Facturas:</strong> {proveedor.facturas.length}</p>
              <p><strong>Tipo:</strong> {proveedor.tipoRif === 'V-' || proveedor.tipoRif === 'E-' ? 'Persona Natural' : 'Persona Jurídica'}</p>
            </div>

            {proveedor.facturas && proveedor.facturas.length > 0 ? (
              <>
                <div className="proveedor-totales">
                  <h5>Totales en Bolívares</h5>

                  <div className="total-item">
                    <span>Base Imponible:</span>
                    <span>Bs {(Number(proveedor.totalBaseImponible) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="total-item">
                    <span>Excento:</span>
                    <span>Bs {(Number(proveedor.totalExcento) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="total-item">
                    <span>IVA:</span>
                    <span>Bs {(Number(proveedor.totalIva) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="total-item">
                    <span>Total a Pagar:</span>
                    <span>Bs {(Number(proveedor.totalPagar) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="total-item">
                    <span>Pagado:</span>
                    <span>Bs {(Number(proveedor.totalMontoPagado) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="proveedor-totales">
                  <h5>Totales en Dólares</h5>

                  <div className="total-item">
                    <span>Total a Pagar:</span>
                    <span>$ {(Number(proveedor.totalPagarDolares) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="total-item">
                    <span>Pagado:</span>
                    <span>$ {(Number(proveedor.totalPagadoDolares) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="retenciones-detalle">
                  <h5>Detalle de Retenciones</h5>

                  <div className="retencion-tipo">
                    <h6>IVA</h6>
                    <div className="retencion-item">
                      <span>Por Cobrar:</span>
                      <span className="estado-pendiente">
                        Bs {(Number(proveedor.retencionIvaPendiente) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="retencion-item">
                      <span>Cobrado:</span>
                      <span className="estado-bueno">
                        Bs {(Number(proveedor.retencionIvaCobrada) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="retencion-tipo">
                    <h6>ISLR</h6>
                    <div className="retencion-item">
                      <span>Por Cobrar:</span>
                      <span className="estado-pendiente">
                        Bs {(Number(proveedor.retencionIslrPendiente) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="retencion-item">
                      <span>Cobrado:</span>
                      <span className="estado-bueno">
                        Bs {(Number(proveedor.retencionIslrCobrada) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="retencion-total">
                    <div className="total-item">
                      <strong>Total por Cobrar:</strong>
                      <strong className="estado-pendiente">
                        Bs {(Number(proveedor.totalRetencionPorCobrar) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="total-item">
                      <strong>Total Cobrado:</strong>
                      <strong className="estado-bueno">
                        Bs {(Number(proveedor.totalRetencionCobrada) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="proveedor-info" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic', color: '#6b7280' }}>
                Sin movimientos registrados
              </div>
            )}
          </div>
        ))}
      </div>

      {mostrarModalPago && proveedorSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <h3>Marcar Pago de Retenciones</h3>
            <p className="modal-subtitle">Facturas pendientes para {proveedorSeleccionado.proveedor}</p>

            <div className="modal-table-container">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Fecha</th>
                    <th className="text-right">Pendiente Total</th>
                    <th className="text-center">Abonar IVA (Bs)</th>
                    <th className="text-center">Abonar ISLR (Bs)</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedorSeleccionado.facturas
                    .filter(f => f.retencionPorCobrar > 0)
                    .map(factura => (
                      <tr key={factura.id}>
                        <td>
                          <strong>#{factura.numeroFactura}</strong>
                          <div className="control-num">{factura.numeroControl}</div>
                        </td>
                        <td>{factura.fechaFactura}</td>
                        <td className="text-right">
                          Bs {factura.retencionPorCobrar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>
                          <div className="input-group-sm">
                            <label className="input-label-sm">
                              Max: {pagosTemp[factura.id]?.maxIva.toFixed(2)}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={pagosTemp[factura.id]?.maxIva}
                              step="0.01"
                              value={pagosTemp[factura.id]?.pagoIva === 0 ? '' : pagosTemp[factura.id]?.pagoIva}
                              onChange={(e) => handlePagoChange(factura.id, 'pagoIva', e.target.value)}
                              className="input-sm"
                            />
                          </div>
                        </td>
                        <td>
                          <div className="input-group-sm">
                            <label className="input-label-sm">
                              Max: {pagosTemp[factura.id]?.maxIslr.toFixed(2)}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={pagosTemp[factura.id]?.maxIslr}
                              step="0.01"
                              value={pagosTemp[factura.id]?.pagoIslr === 0 ? '' : pagosTemp[factura.id]?.pagoIslr}
                              onChange={(e) => handlePagoChange(factura.id, 'pagoIslr', e.target.value)}
                              className="input-sm"
                            />
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn-link"
                            onClick={() => handlePagarTodoFactura(factura.id)}
                          >
                            Pagar Todo
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setMostrarModalPago(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={procesarPago}
              >
                Procesar Pagos
              </button>
            </div>
          </div>
        </div>
      )}

      {proveedoresFiltrados.length === 0 && (
        <div className="no-data">
          <p>No se encontraron proveedores</p>
        </div>
      )}
    </div>
  )
}

export default ProveedoresList