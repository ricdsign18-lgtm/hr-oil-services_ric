// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-sin-factura/ComprasSinFacturaMain.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../../../../../../../../contexts/ProjectContext'
import ModuleDescription from '../../../../../../../_core/ModuleDescription/ModuleDescription'
import CompraSinFacturaForm from './components/ComprasSinFacturaForm'
import ComprasSinFacturaList from './components/ComprasSinFacturaList'
import ProveedoresSinFacturaList from './components/ProveedoresSinFacturaList'

import './ComprasSinFacturaMain.css'
const ComprasSinFacturaMain = ({ projectId }) => {
  const { selectedProject } = useProjects()
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lista-compras')
  const [compraEdit, setCompraEdit] = useState(null)
  const [refreshData, setRefreshData] = useState(0)

  const handleCompraSaved = () => {
    setCompraEdit(null)
    setRefreshData(prev => prev + 1)
    setActiveTab('lista-compras')
  }

  const handleEditCompra = (compra) => {
    setCompraEdit(compra)
    setActiveTab('nueva-compra')
  }

  const handleCancelEdit = () => {
    setCompraEdit(null)
  }

  const handleBack = () => {
    navigate('../../gastos-administrativos/compra-facturacion'); // Ya es una ruta absoluta
  };

  console.log('🔄 ProjectId en ComprasSinFacturaMain:', projectId)
  return (
    <div className="compras-sin-factura-main">
      <button className="back-button" onClick={handleBack}>
        ← Volver a Compra & Facturación
      </button>
      <ModuleDescription 
        title="COMPRAS SIN FACTURA"
        description={`Gestión de compras informales y gastos menores para el proyecto ${selectedProject?.name || ''}`}
      />

      <div className="compra-tabs">
        <button 
          className={`tab-button ${activeTab === 'lista-compras' ? 'active' : ''}`}
          onClick={() => setActiveTab('lista-compras')}
        >
          Lista de Compras
        </button>
        <button 
          className={`tab-button ${activeTab === 'nueva-compra' ? 'active' : ''}`}
          onClick={() => setActiveTab('nueva-compra')}
        >
          {compraEdit ? 'Editar Compra' : 'Nueva Compra'}
        </button>
        <button 
          className={`tab-button ${activeTab === 'proveedores' ? 'active' : ''}`}
          onClick={() => setActiveTab('proveedores')}
        >
          Proveedores
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'lista-compras' && (
          <ComprasSinFacturaList 
            projectId={projectId}
            onEditCompra={handleEditCompra}
            refreshTrigger={refreshData}
          />
        )}
        
        {activeTab === 'nueva-compra' && (
          <CompraSinFacturaForm 
            projectId={projectId}
            onCompraSaved={handleCompraSaved}
            compraEdit={compraEdit}
            onCancelEdit={handleCancelEdit}
          />
        )}
        {activeTab === 'proveedores' && (
          <ProveedoresSinFacturaList 
            projectId={projectId}
            refreshTrigger={refreshData}
          />
        )}
      </div>
    </div>
  )
}

export default ComprasSinFacturaMain;