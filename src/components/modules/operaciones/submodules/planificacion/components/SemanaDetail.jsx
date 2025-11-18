// components/planificacion/SemanaDetail.jsx
import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../../../../api/supaBase';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { DiasList } from './DiasList';
import { RequerimientosForm } from './RequerimientosForm';
import { RequerimientosList } from './RequerimientosList';

export const SemanaDetail = ({ semana, onBack }) => {
  const { getSemanaById, recalcularMontoRequerimientosSemana } = usePlanning();
  const [showRequerimientos, setShowRequerimientos] = useState(false);
  const [requerimientos, setRequerimientos] = useState([]);
  const [loadingReq, setLoadingReq] = useState(false);

  const getRequerimientosPorSemana = useCallback(async () => {
    if (!semana.id) return;
    setLoadingReq(true);
    const { data, error } = await supabase
      .from('planificacion_requerimientos')
      .select('*')
      .eq('semana_id', semana.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requerimientos:', error);
    } else {
      setRequerimientos(data || []);
    }
    setLoadingReq(false);
  }, [semana.id]);

  useEffect(() => {
    getRequerimientosPorSemana();
  }, [getRequerimientosPorSemana]);

  const handleCloseRequerimientosForm = async (refrescar) => {
    if (refrescar) {
      await getRequerimientosPorSemana();
      await recalcularMontoRequerimientosSemana(semana.id);
      await getSemanaById(semana.id); // Recargar datos de la semana para la UI
    }
  };

  return (
    <>
      {/* Header */}
      <div className="planning-header">
        <div className="planning-semana-header" style={{ marginBottom: 0, cursor: 'default' }}>
          <button 
            onClick={onBack}
            className="btn-secondary" // Asumiendo que tienes una clase global para botones secundarios
          >
            ← Volver
          </button>
          <div>
            <h2>Semana {semana.numero_semana}</h2>
            <p className="planning-semana-dates" style={{ marginTop: '5px' }}>
              {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="planning-actions">
          <button
            onClick={() => setShowRequerimientos(!showRequerimientos)}
            className={showRequerimientos ? "btn-secondary" : "btn-primary"}>
            {showRequerimientos ? 'Ver Días' : 'Ver/Agregar Requerimientos'}
          </button>
        </div>
      </div>

      {/* Contenido */}
      {showRequerimientos ? (
        <>
          <RequerimientosList requerimientos={requerimientos} loading={loadingReq} />
          <RequerimientosForm 
            semanaId={semana.id} 
            onClose={handleCloseRequerimientosForm} 
          />
        </>
      ) : (
        <DiasList semanaId={semana.id} />
      )}
    </>
  );
};

export default SemanaDetail;