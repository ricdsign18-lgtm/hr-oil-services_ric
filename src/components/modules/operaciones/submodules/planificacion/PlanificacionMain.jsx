// components/planificacion/PlanificacionMain.jsx
import { useState, useEffect } from 'react';
import { usePlanning } from '../../../../../contexts/PlanningContext';
import { useGeneradorSemanas } from '../../../../../hooks/useGeneradorSemanas';
import { useProjects } from '../../../../../contexts/ProjectContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import { SemanasList } from './components/SemanasList';
import { SemanaDetail } from './components/SemanaDetail';
import supabase from '../../../../../api/supaBase';
import './Planning.css';


const PlanificacionMain = () => {
  const { semanas, loading, guardarSemanasGeneradas, getSemanasPlanificacion } = usePlanning();
  const { generarSemanasProyecto } = useGeneradorSemanas();
  const { selectedProject } = useProjects();
  const { showToast } = useNotification();
  const [selectedSemana, setSelectedSemana] = useState(null);

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
            <div className="planning-header">
              <h2>Planificación del Proyecto</h2>
              <div className="planning-semana-dates">
                {semanas.length > 0 
                  ? `${semanas.length} semanas planificadas`
                  : "No hay planificación generada."
                }
              </div>
            </div>
            
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
    </div>
  );
};
export default PlanificacionMain;