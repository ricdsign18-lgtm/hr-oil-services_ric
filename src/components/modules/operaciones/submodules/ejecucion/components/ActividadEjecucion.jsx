// components/modules/operaciones/submodules/ejecucion/components/ActividadEjecucion.jsx
import { useState } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';
import { useNotification } from '../../../../../../contexts/NotificationContext';
import { SubactividadesList } from './SubactividadesList';
import { TiempoTracker } from './TiempoTracker';

export const ActividadEjecucion = ({ actividadPlanificada, onUpdate, onFinalizar }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { iniciarEjecucionActividad, finalizarActividad, loading } = useExecution();
  const { showToast } = useNotification();

  // Manejo seguro de datos de ejecución que pueden no existir
  const ejecucion = Array.isArray(actividadPlanificada.ejecucion_actividades)
    ? actividadPlanificada.ejecucion_actividades[0]
    : actividadPlanificada.ejecucion_actividades;

  const ejecucionId = ejecucion?.id;
  const estadoActual = ejecucion?.estado || 'pendiente';
  const avanceFisico = ejecucion?.avance_fisico || 0;

  const handleToggleExpand = () => {
    // Solo expandir si la actividad ha iniciado
    if (estadoActual !== 'pendiente') {
      setIsExpanded(!isExpanded);
    } else {
      // If pending, clicking expands nothing but maybe we can show a toast or just do nothing
      // Or we can allow expanding to see details even if pending? 
      // Let's allow expanding to see what needs to be done.
      setIsExpanded(!isExpanded);
    }
  };

  const handleIniciarClick = async (e) => {
    e.stopPropagation(); // Evitar que se expanda/colapse al hacer clic en el botón
    try {
      await iniciarEjecucionActividad(actividadPlanificada); // Pasamos el objeto completo
      onUpdate(); // Llama a la función del padre para refrescar la lista
      showToast("Actividad iniciada exitosamente", "success");
      setIsExpanded(true); // Auto expand when started
    } catch (error) {
      showToast("No se pudo iniciar la actividad.", "error");
    }
  };

  const handleFinalizarClick = async (e) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que quieres finalizar esta actividad?')) {
      try {
        await finalizarActividad(ejecucionId, actividadPlanificada.id);
        onUpdate();
        showToast("Actividad finalizada exitosamente", "success");
        setIsExpanded(false);
      } catch (error) {
        showToast("No se pudo finalizar la actividad.", "error");
      }
    }
  };

  return (
    <div className={`execution-item status-${estadoActual}`}>
      <div className="execution-item-header" onClick={handleToggleExpand}>
        <div className="execution-item-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>
              {actividadPlanificada.equipos?.nombre}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
              {actividadPlanificada.equipos?.tag_serial}
            </span>
          </div>
          <p className="execution-item-description">{actividadPlanificada.budget_items?.description}</p>
        </div>

        <div className="execution-item-status">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Progreso</span>
              <span>{avanceFisico}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${avanceFisico}%` }}
              ></div>
            </div>
          </div>
          <span className={`status-badge status-${estadoActual}`}>
            {estadoActual.replace('_', ' ')}
          </span>
        </div>

        <div className="execution-item-actions">
          {estadoActual === 'pendiente' && (
            <button
              onClick={handleIniciarClick}
              disabled={loading}
              className="btn-primary"
              style={{ padding: '8px 16px' }}
            >
              {loading ? 'Iniciando...' : '▶ Iniciar'}
            </button>
          )}
          {estadoActual === 'en_proceso' && (
            <button
              onClick={handleFinalizarClick}
              disabled={loading}
              className="btn-primary"
              style={{ backgroundColor: '#22c55e', padding: '8px 16px' }}
            >
              {loading ? 'Finalizando...' : '✓ Finalizar'}
            </button>
          )}
          <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: '#94a3b8' }}>
            ▼
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="execution-item-details">
          {estadoActual === 'pendiente' ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
              <p>Inicia la actividad para registrar avances y tiempos.</p>
            </div>
          ) : (
            <div className="details-grid">
              <div className="details-section">
                <h4>📋 Subactividades</h4>
                <SubactividadesList
                  ejecucionActividadId={ejecucionId}
                />
              </div>
              <div className="details-section">
                <h4>⏱️ Control de Tiempos</h4>
                <TiempoTracker
                  ejecucionActividadId={ejecucionId}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};