// components/planificacion/SemanaDetail.jsx
import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../../../../api/supaBase';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { DiasList } from './DiasList';
import { RequerimientosForm } from '../../requerimientos/RequerimientosForm'; // Use the shared component
import RequerimientosGroupList from '../../requerimientos/RequerimientosGroupList';
import Modal from '../../../../../common/Modal/Modal';

export const SemanaDetail = ({ semana, onBack }) => {
  const { getSemanaById, recalcularMontoRequerimientosSemana } = usePlanning();
  const [showRequerimientos, setShowRequerimientos] = useState(false);
  const [requerimientos, setRequerimientos] = useState([]);
  const [loadingReq, setLoadingReq] = useState(false);
  const [showReqForm, setShowReqForm] = useState(false);

  const getRequerimientosPorSemana = useCallback(async () => {
    if (!semana.id) return;
    setLoadingReq(true);
    // Now querying the main 'requerimientos' table
    const { data, error } = await supabase
      .from('requerimientos')
      .select(`
        *,
        requerimiento_items (*)
      `)
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
    setShowReqForm(false);
    if (refrescar) {
      await getRequerimientosPorSemana();
      await recalcularMontoRequerimientosSemana(semana.id);
      await getSemanaById(semana.id); // Recargar datos de la semana para la UI
    }
  };

  const handleDataChange = async () => {
    await getRequerimientosPorSemana();
    await recalcularMontoRequerimientosSemana(semana.id);
    await getSemanaById(semana.id);
  };

  return (
    <div className="planning-detail-container">
      {/* Header */}
      <div className="planning-detail-header">
        <div className="header-top">
          <button
            onClick={onBack}
            className="btn-back"
          >
            ← Volver a Planificación
          </button>
          <div className="header-actions">
            {showRequerimientos && (
              <button
                onClick={() => setShowReqForm(true)}
                className="btn-primary"
                style={{ marginRight: '10px' }}
              >
                + Agregar Requerimiento
              </button>
            )}
            <button
              onClick={() => setShowRequerimientos(!showRequerimientos)}
              className={`btn-toggle-view ${showRequerimientos ? 'active' : ''}`}>
              {showRequerimientos ? '📅 Ver Calendario' : '📋 Ver Requerimientos'}
            </button>
          </div>
        </div>

        <div className="header-info">
          <h2>Semana {semana.numero_semana}</h2>
          <div className="date-badge">
            {new Date(semana.fecha_inicio).toLocaleDateString()} - {new Date(semana.fecha_fin).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="planning-detail-content">
        {showRequerimientos ? (
          <RequerimientosGroupList
            requerimientos={requerimientos}
            loading={loadingReq}
            onDataChange={handleDataChange}
          />
        ) : (
          <DiasList semanaId={semana.id} />
        )}
      </div>

      {/* Modal Requerimientos */}
      <Modal
        isOpen={showReqForm}
        onClose={() => setShowReqForm(false)}
        title="Nuevo Requerimiento"
      >
        <RequerimientosForm
          semanaId={semana.id}
          onSuccess={() => handleCloseRequerimientosForm(true)}
          onCancel={() => handleCloseRequerimientosForm(false)}
        />
      </Modal>
    </div>
  );
};

export default SemanaDetail;