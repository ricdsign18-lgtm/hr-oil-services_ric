// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-sin-factura/components/ComprasSinFacturaList.jsx
import React, { useState, useEffect } from 'react'
import supabase from '../../../../../../../../../../api/supaBase'
import { useNotification } from '../../../../../../../../../../contexts/NotificationContext'
import FeedbackModal from '../../../../../../../../../../common/FeedbackModal/FeedbackModal'

const ComprasSinFacturaList = ({ projectId, onEditCompra, refreshTrigger }) => {
  const { showToast } = useNotification();
  const [compras, setCompras] = useState([])
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    cargarCompras()
  }, [projectId, refreshTrigger])

  const cargarCompras = async () => {
    if (!projectId) return; // Prevent query if projectId is undefined
    try {
      const { data, error } = await supabase
        .from('compras_sin_factura')
        .select('*')
        .eq('projectId', projectId)
        .neq('status', 'deleted')
      
      if (error) throw error
      setCompras(data || [])
    } catch (error) {
      console.error('Error cargando compras sin factura:', error)
    }
  }

  const comprasFiltradas = compras.filter(compra => {
    const cumpleProveedor = !filtroProveedor || 
      compra.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase()) ||
      compra.rif.includes(filtroProveedor)
    const cumpleCategoria = !filtroCategoria || compra.categoria === filtroCategoria
    const cumpleFechaInicio = !fechaInicio || compra.fechaCompra >= fechaInicio
    const cumpleFechaFin = !fechaFin || compra.fechaCompra <= fechaFin

    return cumpleProveedor && cumpleCategoria && cumpleFechaInicio && cumpleFechaFin
  })

  const categoriasUnicas = [...new Set(compras.map(c => c.categoria))]

  // Función para formatear subcategorías
  const formatSubcategorias = (compra) => {
    if (Array.isArray(compra.subcategorias)) {
      const subcategoriasFiltradas = compra.subcategorias.filter(sub => sub && sub.trim() !== '')
      return subcategoriasFiltradas.length > 0 ? subcategoriasFiltradas.join(', ') : '-'
    }
    return compra.subcategoria || '-'
  }

  const handleCloseFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const handleDelete = async (compraId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta compra?')) {
      try {
        const { error } = await supabase
          .from('compras_sin_factura')
          .update({ status: 'deleted' })
          .eq('id', compraId)
        if (error) throw error
        // Recargar la lista para reflejar el cambio
        cargarCompras()
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'Compra Eliminada',
          message: 'La compra ha sido eliminada exitosamente.'
        });
      } catch (error) {
        console.error('Error al eliminar compra:', error)
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Error al eliminar la compra. ' + error.message
        });
      }
    }
  }

  return (
    <div className="compras-sin-factura-list">
      <div className="section-header">
        <h3>Lista de Compras Sin Factura</h3>
        
        <div className="filtros">
          <select 
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {categoriasUnicas.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar por proveedor o RIF..."
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="search-input"
          />

          <input
            type="date"
            placeholder="Fecha inicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="date-input"
          />

          <input
            type="date"
            placeholder="Fecha fin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      <div className="compras-table">
        <table>
          <thead>
            <tr>
              <th>Fecha Compra</th>
              <th>Fecha Recibida</th>
              <th>Proveedor</th>
              <th>RIF</th>
              <th>N° Nota Entrega</th>
              <th>Categoría</th>
              <th>Subcategorías</th>
              <th>Total ($)</th>
              <th>Tasa (Bs/$)</th>
              <th>Pago (Bs)</th>
              <th>Método Pago</th>
              <th>Contrato</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.map((compra, index) => (
              <tr key={compra.id}>
                <td>{compra.fechaCompra}</td>
                <td>{compra.fechaRecibida || '-'}</td>
                <td>{compra.proveedor}</td>
                <td>{compra.tipoRif}{compra.rif}</td>
                <td>{compra.numeroNotaEntrega || '-'}</td>
                <td>{compra.categoria}</td>
                <td>{formatSubcategorias(compra)}</td>
                <td>$ {compra.totalDolares?.toFixed(2) || '0.00'}</td>
                <td>Bs {compra.tasaPago?.toFixed(2) || '0.00'}</td>
                <td>Bs {compra.pagoBolivares?.toFixed(2) || '0.00'}</td>
                <td>{compra.modoPago || '-'}</td>
                <td>{compra.contrato || '-'}</td>
                <td className="observaciones-cell">
                  {compra.observaciones ? (
                    <div className="observaciones-tooltip">
                      <span className="observaciones-icon">📝</span>
                      <div className="observaciones-content">
                        {compra.observaciones}
                      </div>
                    </div>
                  ) : '-'}
                </td>
                <td>
                  <button 
                    className="btn-edit"
                    onClick={() => onEditCompra(compra)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(compra.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comprasFiltradas.length === 0 && (
        <div className="no-data">
          <p>No se encontraron compras registradas</p>
        </div>
      )}

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={handleCloseFeedback}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  )
}

export default ComprasSinFacturaList