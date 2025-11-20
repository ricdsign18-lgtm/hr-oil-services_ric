// components/modules/operaciones/submodules/ejecucion/components/ActividadEjecucion.jsx
import { useState } from 'react';
import { useExecution } from '../../../../../../contexts/ExecutionContext';
import { SubactividadesList } from './SubactividadesList';
import { TiempoTracker } from './TiempoTracker';

export const ActividadEjecucion = ({ actividadPlanificada, onUpdate, onFinalizar }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { iniciarEjecucionActividad, finalizarActividad, loading } = useExecution();

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
      // Opcional: Iniciar la actividad al primer clic
      console.log("Iniciar actividad primero");
    }
  };

  const handleIniciarClick = async (e) => {
    e.stopPropagation(); // Evitar que se expanda/colapse al hacer clic en el botón
    try {
      await iniciarEjecucionActividad(actividadPlanificada); // Pasamos el objeto completo
      onUpdate(); // Llama a la función del padre para refrescar la lista
    } catch (error) {
      alert("No se pudo iniciar la actividad.");
    }
  };

  const handleFinalizarClick = async (e) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que quieres finalizar esta actividad?')) {
      try {
        await finalizarActividad(ejecucionId, actividadPlanificada.id);
        onUpdate();
      } catch (error) {
        alert("No se pudo finalizar la actividad.");
      }
    }
  };

  return (
    <div className={`execution-item status-${estadoActual}`}>
      <div className="execution-item-header" onClick={handleToggleExpand}>
        <div className="execution-item-info">
          <p><strong>{actividadPlanificada.equipos?.nombre}</strong> ({actividadPlanificada.equipos?.tag_serial})</p>
          <p className="execution-item-description">{actividadPlanificada.budget_items?.description}</p>
        </div>
        <div className="execution-item-status">
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${avanceFisico}%` }}
            ></div>
          </div>
          <span className="progress-text">{avanceFisico}%</span>
          <span className={`status-badge status-${estadoActual}`}>{estadoActual}</span>
        </div>
        <div className="execution-item-actions">
          {estadoActual === 'pendiente' && (
            <button 
              onClick={handleIniciarClick} 
              disabled={loading}
              className="btn-primary btn-sm"
            >
              {loading ? 'Iniciando...' : 'Iniciar'}
            </button>
          )}
          {estadoActual === 'en_proceso' && (
            <button 
              onClick={handleFinalizarClick}
              disabled={loading}
              className="btn-success btn-sm"
            >
              {loading ? 'Finalizando...' : 'Finalizar'}
            </button>
          )}
        </div>
      </div>

      {isExpanded && ejecucionId && (
        <div className="execution-item-details">
          <div className="details-grid">
            <div className="details-section">
              <h4>Subactividades</h4>
              <SubactividadesList 
                ejecucionActividadId={ejecucionId}
              />
            </div>
            <div className="details-section">
              <h4>Control de Tiempos</h4>
              <TiempoTracker 
                ejecucionActividadId={ejecucionId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};