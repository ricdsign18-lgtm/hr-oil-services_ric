// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-con-factura/components/ProveedoresList.jsx
import React, { useState, useEffect } from 'react'
import supabase from '../../../../../../../../../../api/supaBase'

const ProveedoresList = ({ projectId, refreshTrigger }) => {
  const [facturas, setFacturas] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)
  const [mostrarModalPago, setMostrarModalPago] = useState(false)

  useEffect(() => {
    cargarFacturas()
  }, [projectId, refreshTrigger])

  useEffect(() => {
    procesarProveedores()
  }, [facturas])

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

    facturas.forEach(factura => {
      const key = `${factura.tipoRif}${factura.rif}`
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
          totalPagarDolares: 0, // Nuevo campo para el total a pagar en USD
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
      // en lugar de recalcular basado en retencionPorCobrar
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

  const proveedoresFiltrados = proveedores.filter(proveedor =>
    proveedor.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase()) ||
    proveedor.rif.includes(filtroProveedor)
  )

  const getEstadoBadge = (estado) => {
    if (estado === 'al-dia') {
      return <span className="estado-badge estado-bueno">Al Día</span>
    } else {
      return <span className="estado-badge estado-pendiente">Pendiente</span>
    }
  }

  const handleMarcarPago = (proveedor) => {
    setProveedorSeleccionado(proveedor)
    setMostrarModalPago(true)
  }

  const procesarPago = async (tipoPago) => {
    if (!proveedorSeleccionado) return

    const facturasAActualizar = facturas
      .filter(factura => 
        factura.tipoRif === proveedorSeleccionado.tipoRif && 
        factura.rif === proveedorSeleccionado.rif &&
        factura.retencionPorCobrar > 0
      )
      .map(factura => {
        let nuevaRetencionPorCobrar = factura.retencionPorCobrar || 0
        let nuevaRetencionCobrada = factura.retencionCobrada || 0
        let nuevaRetencionIvaPendiente = factura.retencionIvaPendiente || 0
        let nuevaRetencionIslrPendiente = factura.retencionIslrPendiente || 0
        let nuevaRetencionIvaCobrada = factura.retencionIvaCobrada || 0
        let nuevaRetencionIslrCobrada = factura.retencionIslrCobrada || 0

        if (tipoPago === 'todo' && nuevaRetencionIvaPendiente + nuevaRetencionIslrPendiente > 0) {
          nuevaRetencionCobrada += nuevaRetencionIvaPendiente + nuevaRetencionIslrPendiente
          nuevaRetencionPorCobrar -= (nuevaRetencionIvaPendiente + nuevaRetencionIslrPendiente)
          nuevaRetencionIvaCobrada += nuevaRetencionIvaPendiente
          nuevaRetencionIslrCobrada += nuevaRetencionIslrPendiente
          nuevaRetencionIvaPendiente = 0
          nuevaRetencionIslrPendiente = 0
        } else if (tipoPago === 'iva' && nuevaRetencionIvaPendiente > 0) {
          nuevaRetencionCobrada += nuevaRetencionIvaPendiente
          nuevaRetencionPorCobrar -= nuevaRetencionIvaPendiente
          nuevaRetencionIvaCobrada += nuevaRetencionIvaPendiente
          nuevaRetencionIvaPendiente = 0
        } else if (tipoPago === 'islr' && nuevaRetencionIslrPendiente > 0) {
          nuevaRetencionCobrada += nuevaRetencionIslrPendiente
          nuevaRetencionPorCobrar -= nuevaRetencionIslrPendiente
          nuevaRetencionIslrCobrada += nuevaRetencionIslrPendiente
          nuevaRetencionIslrPendiente = 0
        }

        return {
          id: factura.id,
          update: {
            retencionPorCobrar: nuevaRetencionPorCobrar,
            retencionCobrada: nuevaRetencionCobrada,
            retencionIvaPendiente: nuevaRetencionIvaPendiente,
            retencionIslrPendiente: nuevaRetencionIslrPendiente,
            retencionIvaCobrada: nuevaRetencionIvaCobrada,
            retencionIslrCobrada: nuevaRetencionIslrCobrada,
            updatedAt: new Date().toISOString()
          }
        }
      })

    if (facturasAActualizar.length === 0) {
      alert('No hay retenciones pendientes para procesar con esta opción.')
      return
    }

    try {
      const updates = facturasAActualizar.map(f =>
        supabase.from('facturas').update(f.update).eq('id', f.id)
      )
      const results = await Promise.all(updates)
      results.forEach(res => { if (res.error) throw res.error })

      alert('Pago procesado exitosamente')
      cargarFacturas() // Recargar datos
    } catch (error) {
      console.error('Error al procesar el pago:', error)
      alert(`Error al procesar el pago: ${error.message}`)
    } finally {
      setMostrarModalPago(false)
      setProveedorSeleccionado(null)
    }
  }

  return (
    <div className="proveedores-list">
      <div className="section-header">
        <h3>Proveedores y Retenciones</h3>
        <div className="filtros">
          <input
            type="text"
            placeholder="Buscar por proveedor o RIF..."
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="resumen-totales">
        <div className="resumen-card">
          <h4>Resumen General</h4>
          <div className="resumen-grid">
            <div className="resumen-item">
              <span>Total Proveedores:</span>
              <strong>{proveedores.length}</strong>
            </div>
            <div className="resumen-item">
              <span>Proveedores al Día:</span>
              <strong className="estado-bueno">
                {proveedores.filter(p => p.estadoRetenciones === 'al-dia').length}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Proveedores Pendientes:</span>
              <strong className="estado-pendiente">
                {proveedores.filter(p => p.estadoRetenciones === 'pendiente').length}
              </strong>
            </div>
            <div className="resumen-item">
              <span>Total Ret. por Cobrar:</span>
              <strong className="estado-pendiente">
                Bs {proveedores.reduce((sum, p) => sum + p.totalRetencionPorCobrar, 0).toFixed(2)}
              </strong>
            </div>
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

            <div className="proveedor-totales">
              <h5>Totales en Bolívares</h5>
              
              <div className="total-item">
                <span>Base Imponible:</span>
                <span>Bs {(Number(proveedor.totalBaseImponible) || 0).toFixed(2)}</span>
              </div>
              
              <div className="total-item">
                <span>Excento:</span>
                <span>Bs {(Number(proveedor.totalExcento) || 0).toFixed(2)}</span>
              </div>
              
              <div className="total-item">
                <span>IVA:</span>
                <span>Bs {(Number(proveedor.totalIva) || 0).toFixed(2)}</span>
              </div>
              
              <div className="total-item">
                <span>Total a Pagar:</span>
                <span>Bs {(Number(proveedor.totalPagar) || 0).toFixed(2)}</span>
              </div>
              
              <div className="total-item">
                <span>Pagado:</span>
                <span>Bs {(Number(proveedor.totalMontoPagado) || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="proveedor-totales">
              <h5>Totales en Dólares</h5>
              
              <div className="total-item">
                <span>Total a Pagar:</span>
                <span>$ {(Number(proveedor.totalPagarDolares) || 0).toFixed(2)}</span>
              </div>
              
              <div className="total-item">
                <span>Pagado:</span>
                <span>$ {proveedor.totalPagadoDolares.toFixed(2)}</span>
              </div>
            </div>

            <div className="retenciones-detalle">
              <h5>Detalle de Retenciones</h5>
              
              <div className="retencion-tipo">
                <h6>IVA</h6>
                <div className="retencion-item">
                  <span>Por Cobrar:</span>
                  <span className="estado-pendiente"> 
                    Bs {(Number(proveedor.retencionIvaPendiente) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="retencion-item">
                  <span>Cobrado:</span>
                  <span className="estado-bueno"> 
                    Bs {(Number(proveedor.retencionIvaCobrada) || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="retencion-tipo">
                <h6>ISLR</h6>
                <div className="retencion-item">
                  <span>Por Cobrar:</span>
                  <span className="estado-pendiente"> 
                    Bs {(Number(proveedor.retencionIslrPendiente) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="retencion-item">
                  <span>Cobrado:</span>
                  <span className="estado-bueno"> 
                    Bs {(Number(proveedor.retencionIslrCobrada) || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="retencion-total">
                <div className="total-item">
                  <strong>Total por Cobrar:</strong>
                  <strong className="estado-pendiente"> 
                    Bs {(Number(proveedor.totalRetencionPorCobrar) || 0).toFixed(2)}
                  </strong>
                </div>
                <div className="total-item">
                  <strong>Total Cobrado:</strong>
                  <strong className="estado-bueno"> 
                    Bs {(Number(proveedor.totalRetencionCobrada) || 0).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mostrarModalPago && proveedorSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Marcar Pago de Retenciones</h3>
            <p>Seleccione el tipo de pago para {proveedorSeleccionado.proveedor}:</p>
            
            <div className="detalle-pendiente">
              <p><strong>Retenciones Pendientes:</strong></p>
              <div className="detalle-montos">
                <span>IVA: Bs {proveedorSeleccionado.retencionIvaPendiente.toFixed(2)}</span>
                <span>ISLR: Bs {proveedorSeleccionado.retencionIslrPendiente.toFixed(2)}</span>
                <span><strong>Total: Bs {proveedorSeleccionado.totalRetencionPorCobrar.toFixed(2)}</strong></span>
              </div>
            </div>
            
            <div className="opciones-pago">
              <button 
                className="btn-pago-option"
                onClick={() => procesarPago('todo')}
              >
                Pagar Todo (IVA + ISLR)
              </button>
              <button 
                className="btn-pago-option"
                onClick={() => procesarPago('iva')}
              >
                Pagar Solo IVA (Bs {proveedorSeleccionado.retencionIvaPendiente.toFixed(2)})
              </button>
              <button 
                className="btn-pago-option"
                onClick={() => procesarPago('islr')}
              >
                Pagar Solo ISLR (Bs {proveedorSeleccionado.retencionIslrPendiente.toFixed(2)})
              </button>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setMostrarModalPago(false)}
              >
                Cancelar
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