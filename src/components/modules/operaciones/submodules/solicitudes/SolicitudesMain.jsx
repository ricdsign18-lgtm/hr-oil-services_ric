import { useMemo, useState } from 'react';
import { useOperaciones } from '../../../../../contexts/OperacionesContext';
import { useAuth } from '../../../../../contexts/AuthContext';
import ModuleDescription from '../../../_core/ModuleDescription/ModuleDescription';
import { CheckCircleIcon, XCircleIcon, InfoIcon, EditIcon } from '../../../../../assets/icons/Icons';
import EditSolicitudModal from './EditSolicitudModal'; // Importar modal
import './SolicitudesMain.css';

const SolicitudesMain = () => {
  const {
    requerimientos,
    approveRequerimientoItem,
    approveRequerimiento,
    rejectRequerimientoItem,
    cancelRequerimiento, // Importar cancelRequerimiento
    updateRequerimientoItem, // Necesario para guardar edición
    loading
  } = useOperaciones();

  const { userData: user } = useAuth();

  const [editingItem, setEditingItem] = useState(null); // Estado para item en edición

  // Filtrar y AGRUPAR los items por aprobar por Requerimiento ID
  const itemsPorAprobar = useMemo(() => {
    const groups = {};
    
    requerimientos.forEach(req => {
      if (req.requerimiento_items) { // Check if items exist
          // Filter items specific to THIS requirement that are 'por_aprobar'
          const pendingItems = req.requerimiento_items.filter(item => item.status === 'por_aprobar');
          
          if (pendingItems.length > 0) {
             groups[req.id] = {
                 reqId: req.id,
                 date: req.fecha_requerimiento,
                 items: pendingItems
             };
          }
      }
    });
    return groups;
  }, [requerimientos]);

  const handleApproveGroup = async (reqId) => {
    if (window.confirm("¿Aprobar TODA la solicitud? Esto aprobará todos los items pendientes en este bloque.")) {
        await approveRequerimiento(reqId);
    }
  };

  const handleCancelGroup = async (reqId) => {
    if (window.confirm("¿Está seguro de CANCELAR toda esta solicitud? Esto cambiará el estado de la solicitud a 'cancelado'.")) {
        await cancelRequerimiento(reqId);
    }
  };

  const handleApprove = async (itemId) => {
    await approveRequerimientoItem(itemId);
  };

  const handleReject = async (itemId) => {
    if (window.confirm("¿Está seguro de rechazar esta solicitud?")) {
      await rejectRequerimientoItem(itemId);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleSaveEdit = async (itemId, newData) => {
    if (window.confirm(`¿Confirmar cambios para este item?`)) {
        await updateRequerimientoItem(itemId, newData);
        setEditingItem(null);
    }
  };

  return (
    <main className="solicitudes-main">
      <ModuleDescription
        title="Bandeja de Solicitudes"
        description="Gestione y apruebe las solicitudes pendientes de operaciones."
       
      />

      <div className="solicitudes-container">
        {loading && <p>Cargando solicitudes...</p>}
        
        {!loading && Object.keys(itemsPorAprobar).length === 0 && (
          <div className="empty-state">
            <p>No hay solicitudes pendientes de aprobación.</p>
          </div>
        )}

        {!loading && Object.keys(itemsPorAprobar).length > 0 && (
          <div className="solicitudes-groups-container">
            {Object.values(itemsPorAprobar).map(group => (
              <div key={group.reqId} className="solicitud-group-card">
                 <div className="solicitud-header">
                    <div>
                        <h4>Solicitud #{group.reqId}</h4>
                        <span className="date-badge">{new Date(group.date).toLocaleDateString()}</span>
                    </div>
                    <div className='button-container'>
                    <button
                        onClick={() => handleApproveGroup(group.reqId)}
                        className="btn-approve-group"
                    >
                        <CheckCircleIcon /> Aprobar Solicitud
                    </button>
                    <button
                        onClick={() => handleCancelGroup(group.reqId)}
                        className="btn-cancel-group"
                        style={{ marginLeft: '10px' }}
                    >
                        <XCircleIcon /> Cancelar Solicitud
                    </button>
                    </div>
                 </div>
                 
                 <table className="solicitudes-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant. Requerida</th>
                        <th>Monto Aprox. (USD)</th>
                        <th>Solicitante</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(item => (
                        <tr key={item.id}>
                          <td data-label="Producto">
                            <strong>{item.nombre_producto}</strong>
                            <br />
                            <small>{item.categoria_producto} - {item.unidad}</small>
                          </td>
                          <td data-label="Cant. Requerida">{item.cantidad_requerida}</td>
                          <td data-label="Monto Aprox.">${(item.cantidad_requerida * (item.precio_unitario_usd_aprox || 0)).toFixed(2)}</td>
                          <td data-label="Solicitante">Auxiliar Operaciones</td>
                          <td data-label="Acciones">
                            <div className="actions-cell">
                              <button
                                onClick={() => handleEdit(item)}
                                className="btn-edit"
                                title="Editar"
                              >
                               <EditIcon />
                              </button>
                              {/* Item Approval Removed - Bulk Action Only */}
                              <button 
                                onClick={() => handleReject(item.id)}
                                className="btn-reject"
                                title="Rechazar"
                              >
                               <XCircleIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {editingItem && (
        <EditSolicitudModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={handleSaveEdit}
        />
      )}
    </main>
  );
};

export default SolicitudesMain;
