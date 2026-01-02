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
    rejectRequerimientoItem,
    updateRequerimientoItem, // Necesario para guardar edición
    loading
  } = useOperaciones();

  const { userData: user } = useAuth();

  const [editingItem, setEditingItem] = useState(null); // Estado para item en edición

  // Filtrar SOLO los items por aprobar
  const itemsPorAprobar = useMemo(() => {
    const items = [];
    requerimientos.forEach(req => {
      if (req.requerimiento_items) {
        req.requerimiento_items.forEach(item => {
          if (item.status === 'por_aprobar') {
            items.push({ ...item, fecha_req: req.fecha_requerimiento });
          }
        });
      }
    });
    return items;
  }, [requerimientos]);

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
    <div className="solicitudes-main">
      <ModuleDescription
        title="Bandeja de Solicitudes"
        description="Gestione y apruebe las solicitudes pendientes de operaciones."
        action={<button className="btn-info-circle"><InfoIcon /></button>}
      />

      <div className="solicitudes-container">
        {loading && <p>Cargando solicitudes...</p>}
        
        {!loading && itemsPorAprobar.length === 0 && (
          <div className="empty-state">
            <p>No hay solicitudes pendientes de aprobación.</p>
          </div>
        )}

        {!loading && itemsPorAprobar.length > 0 && (
          <table className="solicitudes-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cant. Requerida</th>
                <th>Monto Aprox. (USD)</th>
                <th>Solicitante</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsPorAprobar.map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.fecha_req).toLocaleDateString()}</td>
                  <td>
                    <strong>{item.nombre_producto}</strong>
                    <br />
                    <small>{item.categoria_producto} - {item.unidad}</small>
                  </td>
                  <td>{item.cantidad_requerida}</td>
                  <td>${(item.cantidad_requerida * (item.precio_unitario_usd_aprox || 0)).toFixed(2)}</td>
                  <td>Auxiliar Operaciones</td> 
                  <td>
                    <div className="actions-cell">
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn-edit"
                        title="Editar"
                      >
                       <EditIcon />
                      </button>
                      <button 
                        onClick={() => handleApprove(item.id)}
                        className="btn-approve"
                        title="Aprobar"
                      >
                       <CheckCircleIcon />
                      </button>
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
    </div>
  );
};

export default SolicitudesMain;
