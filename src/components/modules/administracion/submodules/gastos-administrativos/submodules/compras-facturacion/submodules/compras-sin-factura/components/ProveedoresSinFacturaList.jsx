// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-sin-factura/components/ProveedoresSinFacturaList.jsx
import { useState, useEffect } from 'react'
import supabase from '../../../../../../../../../../api/supaBase'
import { MultiUsersIcon, ClipBoardIcon, SackDollarIcon } from '../../../../../../../../../../assets/icons/Icons'

const ProveedoresSinFacturaList = ({ projectId, refreshTrigger, parentFilters }) => {
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  
  const { filtroProveedor = '' } = parentFilters || {};

  useEffect(() => {
    cargarCompras()
  }, [projectId, refreshTrigger])

  useEffect(() => {
    procesarProveedores()
  }, [compras])

  const cargarCompras = async () => {
    if (!projectId) return
    try {
      const { data, error } = await supabase
        .from('compras_sin_factura')
        .select('*')
        .eq('projectId', projectId)
        .neq('status', 'deleted')
      if (error) throw error
      setCompras(data || [])
    } catch (error) {
      console.error('Error cargando compras para proveedores (sin factura):', error)
    }
  }

  const procesarProveedores = () => {
    const proveedoresMap = {}

    compras.forEach(compra => {
      const key = `${compra.proveedor}_${compra.tipoRif}_${compra.rif || 'NA'}`
      if (!proveedoresMap[key]) {
        proveedoresMap[key] = {
          proveedor: compra.proveedor,
          tipoRif: compra.tipoRif,
          rif: compra.rif,
          direccion: compra.direccion,
          compras: [],
          totalCompras: 0,
          totalDolares: 0,
          totalBolivares: 0,
          primeraCompra: compra.fechaCompra,
          ultimaCompra: compra.fechaCompra
        }
      }

      proveedoresMap[key].compras.push(compra)
      proveedoresMap[key].totalCompras += 1
      proveedoresMap[key].totalDolares += compra.totalDolares || 0
      proveedoresMap[key].totalBolivares += compra.pagoBolivares || 0

      // Actualizar fechas
      if (compra.fechaCompra < proveedoresMap[key].primeraCompra) {
        proveedoresMap[key].primeraCompra = compra.fechaCompra
      }
      if (compra.fechaCompra > proveedoresMap[key].ultimaCompra) {
        proveedoresMap[key].ultimaCompra = compra.fechaCompra
      }
    })

    setProveedores(Object.values(proveedoresMap))
  }

  const proveedoresFiltrados = proveedores.filter(proveedor =>
    !filtroProveedor ||
    proveedor.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase()) ||
    (proveedor.rif && proveedor.rif.includes(filtroProveedor))
  )

  return (
    <div className="proveedores-sin-factura-list"> {/* Keeps generic wrapper */}
       {/* Removed internal header with search */}

      <div className="resumen-totales">
        <h3 className="section-title">Resumen General</h3>
        <div className="resumen-grid">
          <div className="resumen-card-item">
            <div className="card-icon">
              <MultiUsersIcon />
            </div>
            <div className="card-content">
              <span className="card-label">Total Proveedores</span>
              <strong className="card-value">{proveedores.length}</strong>
            </div>
          </div>
          <div className="resumen-card-item">
            <div className="card-icon">
               <ClipBoardIcon />
            </div>
             <div className="card-content">
              <span className="card-label">Total Compras</span>
              <strong className="card-value">{compras.length}</strong>
            </div>
          </div>
          <div className="resumen-card-item">
             <div className="card-icon">
               <SackDollarIcon />
            </div>
            <div className="card-content">
              <span className="card-label">Total en Dólares</span>
              <strong className="card-value">$ {proveedores.reduce((sum, p) => sum + p.totalDolares, 0).toFixed(2)}</strong>
            </div>
          </div>
          <div className="resumen-card-item">
             <div className="card-icon">
               <SackDollarIcon />
            </div>
            <div className="card-content">
              <span className="card-label">Total en Bolívares</span>
              <strong className="card-value">Bs {proveedores.reduce((sum, p) => sum + p.totalBolivares, 0).toFixed(2)}</strong>
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
              <div className="proveedor-stats">
                <span className="compras-count">{proveedor.totalCompras} compras</span>
              </div>
            </div>

            <div className="proveedor-info">
              <p><strong>Dirección:</strong> {proveedor.direccion || 'No especificada'}</p>
              <p><strong>Primera Compra:</strong> {proveedor.primeraCompra}</p>
              <p><strong>Última Compra:</strong> {proveedor.ultimaCompra}</p>
              <p><strong>Tipo:</strong> {proveedor.tipoRif === 'V-' || proveedor.tipoRif === 'E-' ? 'Persona Natural' : 'Persona Jurídica'}</p>
            </div>

            <div className="proveedor-totales">
              <h5>Totales del Proveedor</h5>

              <div className="proveedor-totales-grid">
                <div className="total-item-card">
                  <span>Total Compras</span>
                  <span>{proveedor.totalCompras}</span>
                </div>

                <div className="total-item-card">
                  <span>Total en Dólares</span>
                  <span>$ {proveedor.totalDolares.toFixed(2)}</span>
                </div>

                <div className="total-item-card">
                  <span>Total en Bolívares</span>
                  <span>Bs {proveedor.totalBolivares.toFixed(2)}</span>
                </div>

                <div className="total-item-card">
                  <span>Promedio ($)</span>
                  <span>$ {(proveedor.totalDolares / proveedor.totalCompras).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="proveedor-categorias">
              <h5>Categorías Principales</h5>
              {(() => {
                const categoriasCount = {}
                proveedor.compras.forEach(compra => {
                  categoriasCount[compra.categoria] = (categoriasCount[compra.categoria] || 0) + 1
                })
                return Object.entries(categoriasCount)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([categoria, count]) => (
                    <div key={categoria} className="categoria-item">
                      <span>{categoria}:</span>
                      <span>{count} compras</span>
                    </div>
                  ))
              })()}
            </div>
          </div>
        ))}
      </div>

      {proveedoresFiltrados.length === 0 && (
        <div className="no-data">
          <p>No se encontraron proveedores</p>
        </div>
      )}
    </div>
  )
}

export default ProveedoresSinFacturaList