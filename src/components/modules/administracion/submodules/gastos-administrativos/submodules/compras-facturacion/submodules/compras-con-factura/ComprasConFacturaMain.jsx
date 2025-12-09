import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../../../../../../../../contexts/ProjectContext'
import { AuthContext } from '../../../../../../../../../contexts/AuthContext'
import ModuleDescription from '../../../../../../../_core/ModuleDescription/ModuleDescription'
import FacturaForm from './components/FacturaForm'
import FacturasList from './components/FacturasList'
import ProveedoresList from './components/ProveedoresList'
import { BackIcon, ClipBoardIcon, AddIcon, MultiUsersIcon, ConfigIcon, SearchIcons } from '../../../../../../../../../assets/icons/Icons'
import './ComprasConFacturaMain.css'

import Configuraciones from '../../components/Configuraciones'

const ComprasConFacturaMain = ({ projectId }) => {
  const { selectedProject } = useProjects()
  const { userData } = useContext(AuthContext)
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lista-facturas')
  const [facturaEdit, setFacturaEdit] = useState(null)
  const [refreshData, setRefreshData] = useState(0)
  
  // Estados para filtros (Lifted State)
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);

  const isViewer = userData?.role === 'viewer'

  const handleFacturaSaved = () => {
    setFacturaEdit(null)
    setRefreshData(prev => prev + 1)
    setActiveTab('lista-facturas')
  }

  const handleEditFactura = (factura) => {
    setFacturaEdit(factura)
    setActiveTab('nueva-factura')
  }

  const handleCancelEdit = () => {
    setFacturaEdit(null)
  }

  const handleBack = () => {
    navigate('../../gastos-administrativos/compra-facturacion'); // Ya es una ruta absoluta
  };

  console.log('🔄 ProjectId en ComprasFacturaMain:', projectId)
  return (
    <div className="ccf-main-container">
      <button className="ccf-back-button" onClick={handleBack}>
        <BackIcon fill="white" style={{ width: '20px', height: '20px', marginRight: '5px' }} /> Volver a Compra & Facturación
      </button>
      <ModuleDescription
        title="COMPRAS CON FACTURA"
        description={`Gestión de compras formales con factura para el proyecto ${selectedProject?.name || ''}`}
      />

      <div className="csf-mobile-dropdown" style={{ marginBottom: '24px', display: 'none' }}>
        <label htmlFor="mobile-tab-select" className="csf-mobile-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--gray-400)', fontSize: '0.9rem' }}>Ver:</label>
        <select
          id="mobile-tab-select"
          className="csf-mobile-select"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--gray-700)', backgroundColor: 'var(--gray-900)', color: 'var(--gray-200)', fontSize: '1rem', height: '48px' }}
        >
          <option value="lista-facturas">Lista de Facturas</option>
          {!isViewer && (
            <option value="nueva-factura">{facturaEdit ? 'Editar Factura' : 'Nueva Factura'}</option>
          )}
          <option value="proveedores">Proveedores y Retenciones</option>
          {!isViewer && (
            <option value="configuraciones">Configuraciones</option>
          )}
        </select>
      </div>

      <div className="ccf-tabs-container">
        <button
          className={`ccf-tab-btn ${activeTab === 'lista-facturas' ? 'active' : ''}`}
          onClick={() => setActiveTab('lista-facturas')}
        >
          <span className="tab-icon"><ClipBoardIcon fill="white" style={{ width: '20px', height: '20px' }} /></span> Lista de Facturas
        </button>
        
        {!isViewer && (
          <button
            className={`ccf-tab-btn ${activeTab === 'nueva-factura' ? 'active' : ''}`}
            onClick={() => setActiveTab('nueva-factura')}
          >
            <span className="tab-icon"><AddIcon fill="white" style={{ width: '20px', height: '20px' }} /></span> {facturaEdit ? 'Editar Factura' : 'Nueva Factura'}
          </button>
        )}

        <button
          className={`ccf-tab-btn ${activeTab === 'proveedores' ? 'active' : ''}`}
          onClick={() => setActiveTab('proveedores')}
        >
          <span className="tab-icon"><MultiUsersIcon fill="white" style={{ width: '20px', height: '20px' }} /></span> Proveedores y Retenciones
        </button>
        
        {!isViewer && (
          <button
            className={`ccf-tab-btn ${activeTab === 'configuraciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('configuraciones')}
          >
            <span className="tab-icon"><ConfigIcon fill="white" style={{ width: '20px', height: '20px' }} /></span> Configuraciones
          </button>
        )}
      </div>

      {(activeTab === 'lista-facturas' || activeTab === 'proveedores') && (
        <div className="ccf-filters-row">
          <div className="ccf-search-wrapper">
            <span className="search-icon"><SearchIcons fill="white" style={{ width: '16px', height: '16px' }} /></span>
            <input
              type="text"
              placeholder="Buscar proveedor, RIF..."
              className="ccf-search-input"
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
            />
          </div>

          <select 
            className="ccf-filter-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="ccf-date-wrapper">
            <div className="ccf-date-field">
              <label>Desde</label>
              <input 
                type="date" 
                className="ccf-date-input" 
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="ccf-date-field">
              <label>Hasta</label>
              <input 
                type="date" 
                className="ccf-date-input" 
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="ccf-content-area">
        {activeTab === 'lista-facturas' && (
          <FacturasList
            projectId={projectId}
            onEditFactura={handleEditFactura}
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
        {activeTab === 'nueva-factura' && !isViewer && (
          <FacturaForm
            projectId={projectId}
            onFacturaSaved={handleFacturaSaved}
            facturaEdit={facturaEdit}
            onCancelEdit={handleCancelEdit}
          />
        )}
        {activeTab === 'proveedores' && (
          <ProveedoresList
            projectId={projectId}
            refreshTrigger={refreshData}
          />
        )}
        {activeTab === 'configuraciones' && !isViewer && (
          <Configuraciones projectId={projectId} />
        )}
      </div>
    </div>
  )
}

export default ComprasConFacturaMain