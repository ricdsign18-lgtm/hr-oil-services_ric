import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../../../../../../../../contexts/ProjectContext'
import { AuthContext } from '../../../../../../../../../contexts/AuthContext'
import ModuleDescription from '../../../../../../../_core/ModuleDescription/ModuleDescription'
import CompraSinFacturaForm from './components/ComprasSinFacturaForm'
import ComprasSinFacturaList from './components/ComprasSinFacturaList'
import ProveedoresSinFacturaList from './components/ProveedoresSinFacturaList'
import { BackIcon, ClipBoardIcon, AddIcon, MultiUsersIcon, ConfigIcon, SearchIcons } from '../../../../../../../../../assets/icons/Icons'

import './ComprasSinFacturaMain.css'
import Configuraciones from '../../components/Configuraciones'

const ComprasSinFacturaMain = ({ projectId }) => {
  const { selectedProject } = useProjects()
  const { userData } = useContext(AuthContext)
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lista-compras')
  const [compraEdit, setCompraEdit] = useState(null)
  const [refreshData, setRefreshData] = useState(0)

  // Estados para filtros (Lifted State)
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);

  const isViewer = userData?.role === 'viewer'

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
    <div className="csf-main-container">
      <button className="csf-back-button" onClick={handleBack}>
        <BackIcon fill="white" style={{ width: '20px', height: '20px', marginRight: '5px' }} /> Volver a Compra & Facturación
      </button>
      <ModuleDescription
        title="COMPRAS SIN FACTURA"
        description={`Gestión de compras informales y gastos menores para el proyecto ${selectedProject?.name || ''}`}
      />

      <div className="csf-mobile-dropdown">
        <label htmlFor="mobile-tab-select" className="csf-mobile-label">Ver:</label>
        <select
          id="mobile-tab-select"
          className="csf-mobile-select"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="lista-compras">Lista de Compras</option>
          {!isViewer && (
            <option value="nueva-compra">{compraEdit ? 'Editar Compra' : 'Nueva Compra'}</option>
          )}
          <option value="proveedores">Proveedores</option>
          {!isViewer && (
            <option value="configuraciones">Configuraciones</option>
          )}
        </select>
      </div>

      <div className="csf-tabs-container">
        <button
          className={`csf-tab-btn ${activeTab === 'lista-compras' ? 'active' : ''}`}
          onClick={() => setActiveTab('lista-compras')}
        >
          <span className="tab-icon"><ClipBoardIcon fill="white" style={{ width: '20px', height: '20px' }} /></span> Lista de Compras
        </button>
        
        {!isViewer && (
          <button
            className={`csf-tab-btn ${activeTab === 'nueva-compra' ? 'active' : ''}`}
            onClick={() => setActiveTab('nueva-compra')}
          >
            <span className="tab-icon"><AddIcon fill="white" style={{ width: '20px', height: '20px' }} /></span> {compraEdit ? 'Editar Compra' : 'Nueva Compra'}
          </button>
        )}

        <button
          className={`csf-tab-btn ${activeTab === 'proveedores' ? 'active' : ''}`}
          onClick={() => setActiveTab('proveedores')}
        >
          <span className="tab-icon"><MultiUsersIcon fill="white" style={{ width: '20px', height: '20px' }} /></span> Proveedores
        </button>
        
        {!isViewer && (
          <button
            className={`csf-tab-btn ${activeTab === 'configuraciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('configuraciones')}
          >
            <span className="tab-icon"><ConfigIcon fill="white" style={{ width: '20px', height: '20px' }} /></span> Configuraciones
          </button>
        )}
      </div>

      {(activeTab === 'lista-compras' || activeTab === 'proveedores') && (
        <div className="csf-filters-row">
          <div className="csf-search-wrapper">
            <span className="search-icon"><SearchIcons fill="white" style={{ width: '16px', height: '16px' }} /></span>
            <input
              type="text"
              placeholder="Buscar proveedor, RIF..."
              className="csf-search-input"
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
            />
          </div>

          <select 
            className="csf-filter-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="csf-date-wrapper">
            <div className="csf-date-field">
              <label>Desde</label>
              <input 
                type="date" 
                className="csf-date-input" 
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="csf-date-field">
              <label>Hasta</label>
              <input 
                type="date" 
                className="csf-date-input" 
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="csf-content-area">
        {activeTab === 'lista-compras' && (
          <ComprasSinFacturaList
            projectId={projectId}
            onEditCompra={handleEditCompra}
            refreshTrigger={refreshData}
            parentFilters={{
              filtroCategoria,
              filtroProveedor,
              fechaInicio,
              fechaFin
            }}
            onCategoriesLoaded={setAvailableCategories}
          />
        )}
        {activeTab === 'nueva-compra' && !isViewer && (
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
            refreshTrigger={refreshData} // Added this to trigger refresh
            parentFilters={{
              filtroProveedor
            }}
          />
        )}
        {activeTab === 'configuraciones' && !isViewer && (
          <Configuraciones projectId={projectId} />
        )}
      </div>
    </div>
  )
}

export default ComprasSinFacturaMain