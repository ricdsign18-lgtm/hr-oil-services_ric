// components/ejecucion/EjecucionMain.jsx
import { useState, useEffect } from 'react';
import { usePlanning } from '../../../../../contexts/PlanningContext';
import { EjecucionDashboard } from './components/EjecucionDashboard';
import { SemanasEjecucion } from './components/SemanasEjecucion';
import { SemanaEjecucion } from './components/SemanaEjecucion';
import ModuleDescription from '../../../_core/ModuleDescription/ModuleDescription';
import { InfoIcon } from '../../../../../assets/icons/Icons';
import Modal from '../../../../common/Modal/Modal';
import './Ejecucion.css';

const EjecucionMain = () => {
  const { semanas, getSemanasPlanificacion, actividades, loading } = usePlanning();
  const [selectedSemana, setSelectedSemana] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    getSemanasPlanificacion();
  }, [getSemanasPlanificacion]);

  if (loading) {
    return <div className="text-center py-8">Cargando ejecución...</div>;
  }

  return (
    <div className="ejecucion-container">
      {selectedSemana ? (
        <SemanaEjecucion 
          semana={selectedSemana}
          onBack={() => setSelectedSemana(null)}
        />
      ) : (
        <>
          <EjecucionDashboard 
            semanas={semanas} 
            actividades={actividades} 
          />
          
          <div>
            <ModuleDescription 
              title="SEMANAS DE EJECUCIÓN"
              description="Seguimiento y control de la ejecución semanal del proyecto"
              action={
                <button 
                  className="btn-info-circle"
                  onClick={() => setShowInfoModal(true)}
                  title="Ver información del módulo"
                >
                  <InfoIcon/>
                </button>
              }
            />
            <SemanasEjecucion 
              semanas={semanas}
              onSelectSemana={setSelectedSemana}
            />
          </div>
        </>
      )}

      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Información de Ejecución"
      >
        <div className="modal-info-content">
          <p>Este módulo permite realizar el seguimiento de la ejecución de las actividades planificadas.</p>
          
          <h3>Funcionalidades:</h3>
          <ul className="info-list">
            <li><strong>Dashboard:</strong> Vista general del progreso del proyecto.</li>
            <li><strong>Registro de Avance:</strong> Actualiza el porcentaje de avance de las actividades.</li>
            <li><strong>Control de Costos:</strong> Monitorea los costos ejecutados vs planificados.</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};
export default EjecucionMain;