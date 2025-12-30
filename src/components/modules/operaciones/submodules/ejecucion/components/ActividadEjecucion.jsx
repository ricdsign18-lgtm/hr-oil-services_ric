// components/modules/operaciones/submodules/ejecucion/components/ActividadEjecucion.jsx
import { useState } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';
import { useNotification } from '../../../../../../contexts/NotificationContext';
import { SubactividadesList } from './SubactividadesList';
import Modal from '../../../../../common/Modal/Modal';

export const ActividadEjecucion = ({ actividadPlanificada, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { iniciarEjecucionActividad, finalizarActividad, loading } = useExecution();
  const { showToast } = useNotification();

  const estadoActual = actividadPlanificada.estado || 'pendiente';
  // Avance se basa en subactividades completadas ahora? O manual?
  // Por ahora, simple: 0 si pendiente, 50 en proceso, 100 completada. 
  // O mejor, calcular based on subactividades checklist if available.

  const subTotal = actividadPlanificada.subactividades?.length || 0;
  const subCompleted = actividadPlanificada.subactividades?.filter(s => s.completada).length || 0;

  // Prefer stored 'avance' if available (from DB update), otherwise fallback to live calculation
  const avanceFisico = actividadPlanificada.avance !== undefined
    ? actividadPlanificada.avance
    : (subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : (estadoActual === 'completada' ? 100 : (estadoActual === 'en_progreso' ? 10 : 0)));

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartClick = (e) => {
    e.stopPropagation();
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setShowStartModal(true);
  };

  const confirmStart = async () => {
    try {
      await iniciarEjecucionActividad(actividadPlanificada.id, selectedDate);
      setShowStartModal(false);
      onUpdate();
      showToast("Actividad iniciada exitosamente", "success");
      setIsExpanded(true);
    } catch (error) {
      showToast("Error al iniciar actividad", "error");
    }
  };

  const handleFinishClick = (e) => {
    e.stopPropagation();
    // Validar si todas las subactividades están listas? 
    // Por ahora flexible.
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setShowFinishModal(true);
  };

  const confirmFinish = async () => {
    try {
      await finalizarActividad(actividadPlanificada.id, selectedDate);
      setShowFinishModal(false);
      onUpdate();
      showToast("Actividad finalizada", "success");
      setIsExpanded(false);
    } catch (error) {
      showToast("Error al finalizar actividad", "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completada': return '#22c55e'; // Green
      case 'en_progreso': return '#3b82f6'; // Blue
      default: return '#94a3b8'; // Slate
    }
  };

  return (
    <div className={`execution-item status-${estadoActual}`} style={{ borderLeft: `4px solid ${getStatusColor(estadoActual)}`, marginBottom: '10px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

      {/* Header Row */}
      <div className="execution-item-header" onClick={handleToggleExpand} style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>

        {/* Info Blocks */}
        <div className="execution-item-info" style={{ flex: 2 }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{actividadPlanificada.descripcion}</h4>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {actividadPlanificada.nombre_partida || 'Sin partida asignada'}
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.8rem' }}>
            <span title="Personal">👥 {actividadPlanificada.personal?.length || 0}</span>
            <span title="Subactividades">✅ {subCompleted}/{subTotal}</span>
          </div>
        </div>

        {/* Progress & Status */}
        <div className="execution-item-status" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
          <div style={{ width: '100px', textAlign: 'right' }}>
            <small style={{ color: '#64748b' }}>{avanceFisico}%</small>
            <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '2px' }}>
              <div style={{ width: `${avanceFisico}%`, height: '100%', backgroundColor: getStatusColor(estadoActual), borderRadius: '2px' }}></div>
            </div>
          </div>
          <span className={`status-badge`} style={{
            backgroundColor: `${getStatusColor(estadoActual)}20`,
            color: getStatusColor(estadoActual),
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {estadoActual.replace('_', ' ')}
          </span>
        </div>

        {/* Actions Button */}
        <div className="execution-item-actions" style={{ marginLeft: '15px', minWidth: '120px', display: 'flex', justifyContent: 'flex-end' }}>
          {estadoActual === 'pendiente' && (
            <button
              onClick={handleStartClick}
              disabled={loading}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              ▶ Iniciar
            </button>
          )}
          {estadoActual === 'en_progreso' && (
            <button
              onClick={handleFinishClick}
              disabled={loading}
              className="btn-success"
              style={{ fontSize: '0.8rem', padding: '6px 12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              ✓ Finalizar
            </button>
          )}
          <div style={{ marginLeft: '10px', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: '#94a3b8' }}>
            ▼
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="execution-item-details" style={{ borderTop: '1px solid #dae1e7', padding: '15px', backgroundColor: '#f8fafc' }}>

          {/* Personal Section */}
          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personal Asignado</h5>
            {actividadPlanificada.personal && actividadPlanificada.personal.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {actividadPlanificada.personal.map(p => (
                  <span key={p.id} style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '1rem' }}>👤</span>
                    <span style={{ fontWeight: 500 }}>{p.nombre_personal}</span>
                    {p.rol_en_actividad && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>• {p.rol_en_actividad}</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No hay personal asignado.</p>
            )}
          </div>
          {estadoActual === 'pendiente' ? (
            <p className="text-center text-muted">Inicia la actividad para gestionar el checklist.</p>
          ) : (
            <div className="details-grid">
              <h5 style={{ marginBottom: '10px' }}>Checklist de Subactividades</h5>
              <SubactividadesList
                actividadId={actividadPlanificada.id}
                initialData={actividadPlanificada.subactividades}
                readOnly={estadoActual === 'completada'}
              />
            </div>
          )}
        </div>
      )}

      {/* Start Modal */}
      <Modal isOpen={showStartModal} onClose={() => setShowStartModal(false)} title="Iniciar Actividad">
        <div style={{ padding: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Fecha de Inicio Real:</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setShowStartModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={confirmStart} disabled={loading}>Confirmar Inicio</button>
          </div>
        </div>
      </Modal>

      {/* Finish Modal */}
      <Modal isOpen={showFinishModal} onClose={() => setShowFinishModal(false)} title="Finalizar Actividad">
        <div style={{ padding: '20px' }}>
          <p>¿Estás seguro de finalizar esta actividad?</p>
          <label style={{ display: 'block', marginBottom: '8px', marginTop: '15px' }}>Fecha de Culminación:</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => setShowFinishModal(false)}>Cancelar</button>
            <button className="btn-success" onClick={confirmFinish} disabled={loading} style={{ backgroundColor: '#22c55e', color: 'white' }}>Finalizar</button>
          </div>
        </div>
      </Modal>

    </div>
  );
};