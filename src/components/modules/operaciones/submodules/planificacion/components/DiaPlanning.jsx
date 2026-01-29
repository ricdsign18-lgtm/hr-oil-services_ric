// components/planificacion/DiaPlanning.jsx
import { useState, useEffect, useCallback } from 'react';
import supabase from '../../../../../../api/supaBase';
import { usePlanning } from '../../../../../../contexts/PlanningContext';
import { useBudget } from '../../../../../../contexts/BudgetContext';
import { useNotification } from '../../../../../../contexts/NotificationContext';
import { ActividadForm } from './ActividadForm';
import { ActividadesList } from './ActividadesList';
import Modal from '../../../../../common/Modal/Modal';

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
            .from('plan_actividades')
            .select(`
        *,
        subactividades:plan_subactividades(*),
        personal:plan_actividad_personal(*)
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
            .from('plan_dias')
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

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actividadToDelete, setActividadToDelete] = useState(null);

    const handleDelete = (actividadId) => {
        setActividadToDelete(actividadId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!actividadToDelete) return;
        try {
            await deleteActividad(actividadToDelete);
            // Refrescar datos después de eliminar
            handleSuccess();
            showToast('Actividad eliminada exitosamente', 'success');
        } catch (error) {
            showToast('No se pudo eliminar la actividad.', 'error');
        } finally {
            setShowDeleteModal(false);
            setActividadToDelete(null);
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
        <div className="planning-detail-container">
            {/* Header */}
            <div className="planning-detail-header">
                <div className="header-top">
                    <button
                        onClick={onBack}
                        className="btn-back"
                    >
                        ← Volver a la semana
                    </button>
                    <div className="header-actions">
                        <button
                            onClick={() => setShowActividadForm(true)}
                            disabled={!budget?.items?.length}
                            className="btn-primary"
                        >
                            + Agregar Actividad
                        </button>
                    </div>
                </div>

                <div className="header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={handlePrevDia}
                                disabled={!prevDia}
                                className="btn-icon-nav"
                                title="Día anterior"
                            >
                                ◀
                            </button>
                            <h2 style={{ margin: 0 }}>
                                {new Date(currentDia.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </h2>
                            <button
                                onClick={handleNextDia}
                                disabled={!nextDia}
                                className="btn-icon-nav"
                                title="Día siguiente"
                            >
                                ▶
                            </button>
                        </div>
                        <div className="date-badge" style={{ marginTop: '8px' }}>
                            {currentDia.cantidad_actividades || 0} actividades planificadas
                        </div>
                    </div>
                    <div className="summary-value" style={{ fontSize: '1.5rem' }}>
                        ${(currentDia.monto_planificado || 0).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Lista de Actividades */}
            <div className="planning-detail-content">
                <ActividadesList
                    loading={loading}
                    actividades={actividades}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modal de Formulario */}
            <Modal
                isOpen={showActividadForm}
                onClose={() => { setShowActividadForm(false); setActividadParaEditar(null); }}
                title={actividadParaEditar ? "Editar Actividad" : "Nueva Actividad"}
            >
                <ActividadForm
                    diaId={currentDia.id}
                    diaFecha={currentDia.fecha}
                    actividadAEditar={actividadParaEditar}
                    onClose={() => { setShowActividadForm(false); setActividadParaEditar(null); }}
                    onSuccess={handleSuccess}
                />
            </Modal>

            {/* Modal de Confirmación de Eliminación */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setActividadToDelete(null); }}
                title="Confirmar Eliminación"
            >
                <div style={{ padding: '20px' }}>
                    <p>¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer.</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="btn-danger"
                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px' }}
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};