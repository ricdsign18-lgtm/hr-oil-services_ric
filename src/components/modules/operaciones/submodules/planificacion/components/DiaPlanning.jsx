// components/planificacion/DiaPlanning.jsx
import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../../../../api/supaBase';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { useBudget } from '../../../../../../contexts/BudgetContext';
import { useNotification } from '../../../../../../contexts/NotificationContext';
import { ActividadForm } from './ActividadForm';
import { ActividadesList } from './ActividadesList';

export const DiaPlanning = ({ dia, onBack, allDias, onNavigate }) => {
    const { getSemanaById, recalcularMontosSemana, deleteActividad } = usePlanning();
    const { showToast } = useNotification();
    const [actividades, setActividades] = useState([]);
    const [currentDia, setCurrentDia] = useState(dia);
    const [loading, setLoading] = useState(false);
    const { budget } = useBudget();
    const [showActividadForm, setShowActividadForm] = useState(false);
    const [actividadParaEditar, setActividadParaEditar] = useState(null);

    // Actualizar currentDia cuando cambia la prop dia
    useEffect(() => {
        setCurrentDia(dia);
    }, [dia]);

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

    // Navegación entre días
    const currentIndex = allDias?.findIndex(d => d.id === currentDia.id);
    const prevDia = currentIndex > 0 ? allDias[currentIndex - 1] : null;
    const nextDia = currentIndex < allDias?.length - 1 ? allDias[currentIndex + 1] : null;

    const handlePrevDia = () => {
        if (prevDia && onNavigate) {
            onNavigate(prevDia);
        }
    };

    const handleNextDia = () => {
        if (nextDia && onNavigate) {
            onNavigate(nextDia);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="planning-header">
                <div className="planning-semana-header" style={{ marginBottom: 0, cursor: 'default', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={onBack}
                            className="btn-secondary"
                            title="Volver a la lista de días"
                        >
                            ← Volver
                        </button>

                        {/* Navegación de días */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '10px' }}>
                            <button
                                onClick={handlePrevDia}
                                disabled={!prevDia}
                                className="btn-icon"
                                style={{ opacity: !prevDia ? 0.3 : 1, cursor: !prevDia ? 'default' : 'pointer' }}
                                title="Día anterior"
                            >
                                ◀
                            </button>
                            <div style={{ textAlign: 'center', minWidth: '200px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                                    {new Date(currentDia.fecha).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h2>
                            </div>
                            <button
                                onClick={handleNextDia}
                                disabled={!nextDia}
                                className="btn-icon"
                                style={{ opacity: !nextDia ? 0.3 : 1, cursor: !nextDia ? 'default' : 'pointer' }}
                                title="Día siguiente"
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    <p className="planning-semana-dates" style={{ marginTop: '5px', marginLeft: '100px' }}>
                        {currentDia.cantidad_actividades || 0} actividades • ${currentDia.monto_planificado?.toLocaleString() || 0}
                    </p>
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