// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/ComprasFacturacionMain.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import ModuleDescription from '../../../../../_core/ModuleDescription/ModuleDescription'
import { useProjects } from '../../../../../../../contexts/ProjectContext'
import ComprasConFacturaMain from './submodules/compras-con-factura/ComprasConFacturaMain'
import ComprasSinFacturaMain from './submodules/compras-sin-factura/ComprasSinFacturaMain'
import supabase from '../../../../../../../api/supaBase'
import './ComprasFacturacionMain.css'
import { ClipBoardIcon, CartShoppingIcon, InfoIcon } from '../../../../../../../assets/icons/Icons'
import Modal from '../../../../../../common/Modal/Modal'

const ComprasFacturacionMain = ({ projectId }) => {
  const navigate = useNavigate()
  const { selectedProject } = useProjects()
  const [activeSubmodule, setActiveSubmodule] = useState('compras-con-factura')
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [summaryData, setSummaryData] = useState({
    countFacturas: 0,
    countSinFactura: 0,
    countProveedores: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!projectId) return
      
      setLoading(true)
      try {
        console.log('Fetching summary data for project:', projectId)

        // CONSULTA CORREGIDA: Compras con factura - usando count() correctamente
        const { data: facturasData, error: errorFacturas, count: countFacturas } = await supabase
          .from('facturas')
          .select('*', { count: 'exact' })
          .eq('projectId', projectId) // Cambiado a projectId (snake_case)
          .neq('status', 'deleted')
        
        if (errorFacturas) {
          console.error('Error fetching facturas:', errorFacturas)
          // Intentar con projectId (camelCase) si projectId falla
          const { data: facturasDataAlt, error: errorFacturasAlt, count: countFacturasAlt } = await supabase
            .from('facturas')
            .select('*', { count: 'exact' })
            .eq('projectId', projectId)
            .neq('status', 'deleted')
          
          if (errorFacturasAlt) {
            throw errorFacturasAlt
          }
          console.log('Facturas count (camelCase):', countFacturasAlt)
        }

        // CONSULTA CORREGIDA: Compras sin factura
        const { data: sinFacturaData, error: errorSinFactura, count: countSinFactura } = await supabase
          .from('compras_sin_factura')
          .select('*', { count: 'exact' })
          .eq('projectId', projectId)
          .neq('status', 'deleted')
        
        if (errorSinFactura) {
          console.error('Error fetching compras sin factura:', errorSinFactura)
          // Intentar con projectId (camelCase)
          const { data: sinFacturaDataAlt, error: errorSinFacturaAlt, count: countSinFacturaAlt } = await supabase
            .from('compras_sin_factura')
            .select('*', { count: 'exact' })
            .eq('projectId', projectId)
            .neq('status', 'deleted')
          
          if (errorSinFacturaAlt) {
            throw errorSinFacturaAlt
          }
          console.log('Compras sin factura count (camelCase):', countSinFacturaAlt)
        }

        // CONSULTA CORREGIDA: Proveedores únicos - método más simple
        const { data: facturasProv, error: errorFacturasProv } = await supabase
          .from('facturas')
          .select('tipoRif, rif') // Cambiado a snake_case
          .eq('projectId', projectId)
          .neq('status', 'deleted')
        
        if (errorFacturasProv) {
          console.error('Error fetching proveedores facturas:', errorFacturasProv)
          // Intentar con camelCase
          const { data: facturasProvAlt, error: errorFacturasProvAlt } = await supabase
            .from('facturas')
            .select('tipoRif, rif')
            .eq('projectId', projectId)
            .neq('status', 'deleted')
          
          if (errorFacturasProvAlt) {
            throw errorFacturasProvAlt
          }
        }

        const { data: sinFacturaProv, error: errorSinFacturaProv } = await supabase
          .from('compras_sin_factura')
          .select('tipoRif, rif') // Cambiado a snake_case
          .eq('projectId', projectId)
          .neq('status', 'deleted')
        
        if (errorSinFacturaProv) {
          console.error('Error fetching proveedores sin factura:', errorSinFacturaProv)
          // Intentar con camelCase
          const { data: sinFacturaProvAlt, error: errorSinFacturaProvAlt } = await supabase
            .from('compras_sin_factura')
            .select('tipoRif, rif')
            .eq('projectId', projectId)
            .neq('status', 'deleted')
          
          if (errorSinFacturaProvAlt) {
            throw errorSinFacturaProvAlt
          }
        }

        // Usar datos alternativos si los originales fallaron
        const facturasFinal = facturasData || facturasDataAlt
        const sinFacturaFinal = sinFacturaData || sinFacturaDataAlt
        const facturasProvFinal = facturasProv || facturasProvAlt
        const sinFacturaProvFinal = sinFacturaProv || sinFacturaProvAlt

        const proveedores = new Set([
          ...(facturasProvFinal || []).map(f => `${f.tipoRif || f.tipoRif}${f.rif}`),
          ...(sinFacturaProvFinal || []).map(c => `${c.tipoRif || c.tipoRif}${c.rif}`)
        ])

        setSummaryData({
          countFacturas: facturasFinal?.length || 0,
          countSinFactura: sinFacturaFinal?.length || 0,
          countProveedores: proveedores.size
        })

      } catch (error) {
        console.error('Error fetching summary data:', error)
        // En caso de error, establecer valores por defecto
        setSummaryData({
          countFacturas: 0,
          countSinFactura: 0,
          countProveedores: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSummaryData()
  }, [projectId])

  const submodules = [
    { 
      id: 'compras-con-factura', 
      title: 'Compras con Factura', 
      description: 'Registro y control de compras con factura formal, cálculo de retenciones',
      icon: <ClipBoardIcon/>,
      path: 'compras-con-factura'
    },
    { 
      id: 'compras-sin-factura', 
      title: 'Compras sin Factura', 
      description: 'Registro de compras informales y gastos menores',
      icon: <CartShoppingIcon/>,
      path: 'compras-sin-factura'
    }
  ]

  const handleCardClick = (path) => {
    console.log('Navegando a:', path)
    setActiveSubmodule(path)
    navigate(path)
  }

  const handleBack = () => {
    navigate('..') // Volver a Gastos Administrativos
  }

  const handleSubmoduleChange = (submoduleId) => {
    setActiveSubmodule(submoduleId)
    navigate(submoduleId)
  }

  // Protección: No renderizar nada si no hay un proyecto seleccionado
  if (!projectId) {
    return (
      <div className="compras-facturacion-main">
        <ModuleDescription title="COMPRA & FACTURACIÓN" />
        <p>Por favor, seleccione un proyecto para gestionar las compras y facturas.</p>
      </div>
    )
  }

  // Si hay una ruta específica activa, mostrar el submodule correspondiente
  if (window.location.pathname.includes('compras-con-factura') || 
      window.location.pathname.includes('compras-sin-factura')) {
    return (
      <div className="compras-facturacion-main">
        <div className="submodule-navigation">
          <button 
            className={`submodule-nav-btn ${activeSubmodule === 'compras-con-factura' ? 'active' : ''}`}
            onClick={() => handleSubmoduleChange('compras-con-factura')}
          >
            📋 Compras con Factura
          </button>
          <button 
            className={`submodule-nav-btn ${activeSubmodule === 'compras-sin-factura' ? 'active' : ''}`}
            onClick={() => handleSubmoduleChange('compras-sin-factura')}
          >
            🛒 Compras sin Factura
          </button>
          <button className="back-button" onClick={handleBack}>
            ← Volver
          </button>
        </div>
        
        <Routes>
          <Route 
            path="compras-con-factura" 
            element={<ComprasConFacturaMain projectId={projectId} />} 
          />
          <Route 
            path="compras-sin-factura" 
            element={<ComprasSinFacturaMain projectId={projectId} />} 
          />
          <Route 
            path="/" 
            element={<ComprasConFacturaMain projectId={projectId} />} 
          />
        </Routes>
      </div>
    )
  }

  // Vista principal con cards de selección
  return (
    <div className="compras-facturacion-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Gastos Administrativos
      </button>

      <ModuleDescription 
        title="COMPRA & FACTURACIÓN"
        description={`Gestión integral de compras y facturación del proyecto ${selectedProject?.name || ''}`}
        action={
          <button 
            className="btn-info-circle"
            onClick={() => setShowInfoModal(true)}
            title="Ver información del módulo"
          >
            <InfoIcon/>
          </button>
        }
      />

      <div className="compras-facturacion-grid">
        {submodules.map(submodule => (
          <div 
            key={submodule.id}
            className="compras-facturacion-card"
            onClick={() => handleCardClick(submodule.path)}
          >
            <div className="compras-card-icon">{submodule.icon}</div>
            <div className="compras-card-content">
              <h3>{submodule.title}</h3>
              <p>{submodule.description}</p>
              <div className="compras-card-footer">
                <small>Proyecto: {selectedProject?.name || ''}</small>
                <span className="card-arrow">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      <div className="compras-info-section">
        <div className="info-card">
          <h4>📊 Resumen de Compras {loading && '(Cargando...)'}</h4>
          <div className="info-stats">
            <div className="stat-item">
              <span className="stat-label">Compras con Factura:</span>
              <span className="stat-value">{summaryData.countFacturas}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Compras sin Factura:</span>
              <span className="stat-value">{summaryData.countSinFactura}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Proveedores Registrados:</span>
              <span className="stat-value">{summaryData.countProveedores}</span>
            </div>
          </div>
        </div>

  
      </div>

      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Información del Módulo"
      >
        <div className="modal-info-content">
          <p>Este módulo permite la gestión integral de todas las compras y gastos del proyecto.</p>
          
          <h3>Funcionalidades Principales:</h3>
          <ul className="info-list">
            <li><strong>Compras con Factura:</strong> Registro de compras formales, cálculo automático de retenciones (IVA, ISLR) y gestión de proveedores.</li>
            <li><strong>Compras sin Factura:</strong> Control de gastos menores, caja chica y compras informales.</li>
          </ul>

          <h3>Características:</h3>
          <ul className="info-list">
            <li>✅ Conversión automática de divisas (Bs/USD)</li>
            <li>✅ Reportes detallados por tipo de gasto</li>
            <li>✅ Almacenamiento digital de comprobantes</li>
            <li>✅ Control de estatus de facturas</li>
          </ul>
        </div>
      </Modal>
    </div>
  )
}

export default ComprasFacturacionMain