// components/planificacion/PlanificacionMain.jsx
import { useState, useEffect } from 'react';
import { usePlanning } from '../../../../../contexts/PlanningContext';
import { useGeneradorSemanas } from '../../../../../hooks/useGeneradorSemanas';
import { useProjects } from '../../../../../contexts/ProjectContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import { SemanasList } from './components/SemanasList';
import { SemanaDetail } from './components/SemanaDetail';
import supabase from '../../../../../api/supaBase';
import ModuleDescription from '../../../_core/ModuleDescription/ModuleDescription';
import { InfoIcon } from '../../../../../assets/icons/Icons';
import Modal from '../../../../common/Modal/Modal';
import './Planning.css';


const PlanificacionMain = () => {
  const { semanas, loading, guardarSemanasGeneradas, getSemanasPlanificacion } = usePlanning();
  const { generarSemanasProyecto } = useGeneradorSemanas();
  const { selectedProject } = useProjects();
  const { showToast } = useNotification();
  const [selectedSemana, setSelectedSemana] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      getSemanasPlanificacion();
    }
  }, [selectedProject, getSemanasPlanificacion]);

  const handleGenerarPlanificacion = async () => {
    if (!selectedProject) {
      showToast("Por favor, selecciona un proyecto primero.", "warning");
      return;
    }

    // Asegurarse de tener el objeto completo del proyecto con las fechas
    const { data: fullProject, error } = await supabase
      .from('projects')
      .select('start_date, end_date')
      .eq('id', selectedProject.id)
      .single();

    if (error || !fullProject) {
      console.error("No se pudieron obtener los detalles completos del proyecto:", error);
      return;
    }

    const semanasGeneradas = generarSemanasProyecto({
      fecha_inicio: fullProject.start_date,
      fecha_fin: fullProject.end_date
    });
    if (semanasGeneradas && semanasGeneradas.length > 0) {
      await guardarSemanasGeneradas(semanasGeneradas);
      showToast("Planificación generada exitosamente", "success");
    }
  };


  if (loading && semanas.length === 0) {
    return <div className="planning-no-content">Cargando planificación...</div>;
  }

  return (
    <div className="planning-container">
      {
        selectedSemana ? (
          <SemanaDetail 
            semana={selectedSemana}
            onBack={() => setSelectedSemana(null)}
          />
        ) : (
          <>
            <ModuleDescription 
              title="PLANIFICACIÓN DEL PROYECTO"
              description={semanas.length > 0 ? `${semanas.length} semanas planificadas` : "Gestión y generación de semanas de trabajo"}
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
            
            {semanas.length > 0 ? (
              <SemanasList 
                semanas={semanas}
                onSelectSemana={setSelectedSemana}
              />
            ) : (
              <div className="planning-no-content">
                <button onClick={handleGenerarPlanificacion} className="btn-primary">Generar Planificación Inicial</button>
              </div>
            )}
          </>
        )
      }

      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Información de Planificación"
      >
        <div className="modal-info-content">
          <p>Este módulo permite generar y visualizar la planificación semanal del proyecto.</p>
          
          <h3>Funcionalidades:</h3>
          <ul className="info-list">
            <li><strong>Generación Automática:</strong> Crea semanas de trabajo basadas en la fecha de inicio y fin del proyecto.</li>
            <li><strong>Gestión de Semanas:</strong> Visualiza el estado y detalles de cada semana.</li>
            <li><strong>Asignación de Actividades:</strong> (Próximamente) Asigna actividades específicas a cada semana.</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};
export default PlanificacionMain;