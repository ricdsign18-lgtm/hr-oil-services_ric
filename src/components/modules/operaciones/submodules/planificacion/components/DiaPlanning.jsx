// components/planificacion/DiaPlanning.jsx
import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../../../../api/supaBase';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { useBudget } from '../../../../../../contexts/BudgetContext';
import { useNotification } from '../../../../../../contexts/NotificationContext';
import { ActividadForm } from './ActividadForm';
import { ActividadesList } from './ActividadesList';

export const DiaPlanning = ({ dia, onBack }) => {
  const { getSemanaById, recalcularMontosSemana, deleteActividad } = usePlanning();
  const { showToast } = useNotification();
  const [actividades, setActividades] = useState([]);
  const [currentDia, setCurrentDia] = useState(dia);
  const [loading, setLoading] = useState(false);
  const { budget } = useBudget();
  const [showActividadForm, setShowActividadForm] = useState(false);
  const [actividadParaEditar, setActividadParaEditar] = useState(null);

  const getActividadesPorDia = useCallback(async (diaId) => {
    if (!diaId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('planificacion_actividades')
      .select(`
        *,
        equipos (tag_serial, nombre, tipo_equipo),
        budget_items (item_number, description, unit, currency, unit_price)
      `)
      .eq('dia_id', diaId)
      .order('created_at');

    if (error) {
      console.error('Error fetching actividades:', error);
    } else {
      setActividades(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentDia?.id) {
      getActividadesPorDia(currentDia.id);
    }
  }, [currentDia?.id, getActividadesPorDia]);

  const getDiaData = async (diaId) => {
    const { data, error } = await supabase
      .from('planificacion_dias')
      .select('*')
      .eq('id', diaId)
      .single();
    if (data) {
      setCurrentDia(data);
    }
  };

  const handleSuccess = async () => {
    setActividadParaEditar(null);
    setShowActividadForm(false);
    // Refrescar todo para ver los montos actualizados por el trigger
    await getActividadesPorDia(currentDia.id);
    await getDiaData(currentDia.id);
    await getSemanaById(currentDia.semana_id);
    await recalcularMontosSemana(currentDia.semana_id);
  };

  const handleEdit = (actividad) => {
    setActividadParaEditar(actividad);
    setShowActividadForm(true);
  };

  const handleDelete = async (actividadId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
      try {
        await deleteActividad(actividadId);
        // Refrescar datos después de eliminar
        handleSuccess();
        showToast('Actividad eliminada exitosamente', 'success');
      } catch (error) {
        showToast('No se pudo eliminar la actividad.', 'error');
      }
    }
  };

  return (
    <>
      {/* Header */}
      <div className="planning-header">
        <div className="planning-semana-header" style={{ marginBottom: 0, cursor: 'default' }}>
          <button 
            onClick={onBack}
            className="btn-secondary" // Asumiendo clase global para botón secundario
          >
            ← Volver
          </button>
          <div>
            <h2>
              {new Date(currentDia.fecha).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <p className="planning-semana-dates" style={{ marginTop: '5px' }}>
              {currentDia.cantidad_actividades || 0} actividades • ${currentDia.monto_planificado?.toLocaleString() || 0}
            </p>
          </div>
        </div>
        <div className="planning-actions">
          <button
            onClick={() => setShowActividadForm(true)}
            disabled={!budget?.items?.length}
            className="btn-primary"
          >
            + Agregar Actividad
          </button>
        </div>
      </div>

      {/* Formulario o Lista */}
      {showActividadForm ? (
        <ActividadForm 
          diaId={currentDia.id}
          actividadAEditar={actividadParaEditar}
          onClose={() => { setShowActividadForm(false); setActividadParaEditar(null); }}
          onSuccess={handleSuccess}
        />
      ) : (
        <ActividadesList 
          loading={loading}
          actividades={actividades}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};