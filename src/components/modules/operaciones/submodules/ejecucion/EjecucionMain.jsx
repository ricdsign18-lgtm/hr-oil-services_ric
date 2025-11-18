// components/ejecucion/EjecucionMain.jsx
import { useState, useEffect } from 'react';
import { usePlanning } from '../../../../../contexts/PlanningContext';
import { EjecucionDashboard } from './components/EjecucionDashboard';
import { SemanasEjecucion } from './components/SemanasEjecucion';
import { SemanaEjecucion } from './components/SemanaEjecucion';

const EjecucionMain = () => {
  const { semanas, getSemanasPlanificacion, actividades, loading } = usePlanning();
  const [selectedSemana, setSelectedSemana] = useState(null);

  useEffect(() => {
    getSemanasPlanificacion();
  }, [getSemanasPlanificacion]);

  if (loading) {
    return <div className="text-center py-8">Cargando ejecución...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
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
          
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Semanas de Ejecución</h2>
            <SemanasEjecucion 
              semanas={semanas}
              onSelectSemana={setSelectedSemana}
            />
          </div>
        </>
      )}
    </div>
  );
};
export default EjecucionMain;