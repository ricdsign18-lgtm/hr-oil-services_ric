// src/components/modules/administracion/submodules/gastos-administrativos/submodules/compra-facturacion/submodules/compras-sin-factura/components/ComprasSinFacturaList.jsx
import { useState, useEffect } from 'react'
import supabase from '../../../../../../../../../../api/supaBase'
import { useNotification } from '../../../../../../../../../../contexts/NotificationContext'
import FeedbackModal from '../../../../../../../../../common/FeedbackModal/FeedbackModal'
import { ClipBoardIcon, SackDollarIcon } from '../../../../../../../../../../assets/icons/Icons'

const ComprasSinFacturaList = ({ projectId, onEditCompra, refreshTrigger, parentFilters, onCategoriesLoaded }) => {
  const { showToast } = useNotification();
  const [compras, setCompras] = useState([])

  // Destructure parent filters with default values to avoid crashes
  const {
    filtroCategoria = '',
    filtroProveedor = '',
    fechaInicio = '',
    fechaFin = ''
  } = parentFilters || {};

  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    cargarCompras()
  }, [projectId, refreshTrigger])

  useEffect(() => {
    if (compras.length > 0 && onCategoriesLoaded) {
      const uniqueCategories = [...new Set(compras.map(c => c.categoria))].filter(Boolean).sort();
      onCategoriesLoaded(uniqueCategories);
    }
  }, [compras, onCategoriesLoaded]);

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

  const comprasFiltrados = compras.filter(compra => {
    const cumpleProveedor = !filtroProveedor ||
      (compra.proveedor && compra.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase())) ||
      (compra.rif && compra.rif.includes(filtroProveedor))

    // Exact match for category unless it's empty ("Todas")
    const cumpleCategoria = !filtroCategoria || compra.categoria === filtroCategoria

    const cumpleFechaInicio = !fechaInicio || compra.fechaCompra >= fechaInicio
    const cumpleFechaFin = !fechaFin || compra.fechaCompra <= fechaFin

    return cumpleProveedor && cumpleCategoria && cumpleFechaInicio && cumpleFechaFin
  })

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
      {/* Removed local section header with filters */}

      <div className="list-summary-card">
        <div className="list-card-icon-wrapper">
          <SackDollarIcon />
          <span className="list-card-label">TOTAL DÓLARES</span>
        </div>
        <strong className="list-card-value">
          $ {comprasFiltrados.reduce((sum, item) => sum + (item.totalDolares || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </strong>
      </div>

      <div className="facturas-table"> {/* Updated class to match new CSS */}
        <table>
          <thead>
            <tr>
              <th>Fecha Compra</th>
              <th>Fecha Recibida</th>
              <th>Proveedor</th>
              <th>RIF</th>
              <th>N° Nota Entrega</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Subcategorías</th>
              <th>Total ($)</th>
              <th>Tasa (Bs/$)</th>
              <th>Pago (Bs)</th>
              <th>Método Pago</th>
              <th>Contrato</th>
              <th>Valuación</th>
              <th>Observaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comprasFiltrados.length === 0 ? (
              <tr>
                <td colSpan="16" style={{ textAlign: 'center', padding: '20px' }}>
                  No hay datos registrados
                </td>
              </tr>
            ) : (
              comprasFiltrados.map((compra, index) => (
                <tr key={compra.id}>
                  <td>{compra.fechaCompra}</td>
                  <td>{compra.fechaRecibida || '-'}</td>
                  <td>{compra.proveedor}</td>
                  <td>{compra.tipoRif}{compra.rif}</td>
                  <td>{compra.numeroNotaEntrega || '-'}</td>
                  <td>{compra.descripcion || '-'}</td>
                  <td>{compra.categoria}</td>
                  <td>{formatSubcategorias(compra)}</td>
                  <td className="total-importante">$ {compra.totalDolares?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                  <td>Bs {compra.tasaPago?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                  <td>Bs {compra.pagoBolivares?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</td>
                  <td>{compra.modoPago || '-'}</td>
                  <td>{compra.contrato || '-'}</td>
                  <td>{compra.valuacion || '-'}</td>
                  <td className="observaciones-cell">
                    {compra.observaciones ? (
                      <div className="observaciones-tooltip">
                        <span className="observaciones-icon">
                          <ClipBoardIcon fill="var(--primary-color)" style={{ width: '20px', height: '20px' }} />
                        </span>
                        <div className="observaciones-content">
                          {compra.observaciones}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex' }}>
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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