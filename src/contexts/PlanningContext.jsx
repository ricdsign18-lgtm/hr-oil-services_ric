// contexts/PlanningContext.jsx
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import supabase from '../api/supaBase';
import { useProjects } from './ProjectContext';
import { useBudget } from './BudgetContext';

const PlanningContext = createContext();

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning debe usarse dentro de PlanningProvider');
  }
  return context;
};

export const PlanningProvider = ({ children }) => {
  const { selectedProject } = useProjects();
  const { budget } = useBudget();

  const [semanas, setSemanas] = useState([]);
  const [dias, setDias] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar semanas
  const getSemanasPlanificacion = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('planificacion_semanas')
      .select('*')
      .eq('project_id', selectedProject.id)
      .order('numero_semana');

    if (error) {
      console.error('Error fetching semanas:', error);
    } else {
      setSemanas(data || []);
    }
    setLoading(false);
  }, [selectedProject]);

  const getSemanaById = useCallback(async (semanaId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('planificacion_semanas')
      .select('*')
      .eq('id', semanaId)
      .single();

    if (error) {
      console.error('Error fetching semana by id:', error);
    } else if (data) {
      setSemanas(prevSemanas => prevSemanas.map(s => s.id === semanaId ? data : s));
    }
    setLoading(false);
  }, []);

  // Cargar equipos
  const getEquipos = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .eq('project_id', selectedProject.id)
      .order('nombre');

    if (error) {
      console.error('Error fetching equipos:', error);
    } else {
      setEquipos(data || []);
    }
    setLoading(false);
  }, [selectedProject]);

  const crearEquipo = useCallback(async (nombreEquipo, tipoEquipo) => {
    if (!selectedProject) throw new Error("No hay un proyecto seleccionado para crear el equipo.");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipos')
        .insert([{
          project_id: selectedProject.id,
          nombre: nombreEquipo,
          tag_serial: nombreEquipo.toUpperCase().replace(/\s/g, '-'), // Generar un tag simple
          tipo_equipo: tipoEquipo
        }])
        .select()
        .single();

      if (error) throw error;
      setEquipos(prev => [...prev, data]); // Actualizar estado local para que esté disponible inmediatamente
      return data;
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  // Crear actividad
  const crearActividadPlanificada = useCallback(async (actividadData) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('planificacion_actividades')
        .insert([actividadData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creando actividad:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateActividad = useCallback(async (actividadId, actividadData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('planificacion_actividades')
        .update(actividadData)
        .eq('id', actividadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando actividad:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteActividad = useCallback(async (actividadId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('planificacion_actividades')
        .delete()
        .eq('id', actividadId);

      if (error) throw error;
    } catch (error) {
      console.error('Error eliminando actividad:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const recalcularMontosSemana = useCallback(async (semanaId) => {
    const { data: dias, error: diasError } = await supabase
      .from('planificacion_dias')
      .select('monto_planificado, cantidad_actividades')
      .eq('semana_id', semanaId);

    if (diasError) {
      console.error('Error fetching dias para recalcular semana:', diasError);
      return;
    }

    const montoTotalSemana = dias.reduce((sum, dia) => sum + (dia.monto_planificado || 0), 0);
    const actividadesTotalesSemana = dias.reduce((sum, dia) => sum + (dia.cantidad_actividades || 0), 0);

    await supabase
      .from('planificacion_semanas')
      .update({ monto_planificado: montoTotalSemana, cantidad_actividades: actividadesTotalesSemana })
      .eq('id', semanaId);

  }, []);

  const recalcularMontoRequerimientosSemana = useCallback(async (semanaId) => {
    const { data: requerimientos, error } = await supabase
      .from('planificacion_requerimientos')
      .select('monto_total')
      .eq('semana_id', semanaId);

    if (error) {
      console.error('Error fetching requerimientos para recalcular:', error);
      return;
    }

    const montoTotalRequerimientos = requerimientos.reduce((sum, req) => sum + (req.monto_total || 0), 0);

    await supabase
      .from('planificacion_semanas')
      .update({ monto_requerimientos: montoTotalRequerimientos })
      .eq('id', semanaId);
  }, []);

  const crearRequerimiento = useCallback(async (requerimientoData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('planificacion_requerimientos')
        .insert([requerimientoData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando requerimiento:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const guardarSemanasGeneradas = useCallback(async (semanasGeneradas) => {
    if (!selectedProject) return;
    setLoading(true);
    console.log("Guardando semanas generadas:", semanasGeneradas);

    // 1. Preparar y guardar las semanas
    const semanasParaGuardar = semanasGeneradas.map(s => ({
      project_id: selectedProject.id,
      numero_semana: s.numeroSemana,
      fecha_inicio: s.fechaInicio,
      fecha_fin: s.fechaFin,
      estado: 'planificada'
    }));

    const { data: semanasGuardadas, error: errorSemanas } = await supabase
      .from('planificacion_semanas')
      .upsert(semanasParaGuardar, { onConflict: 'project_id, numero_semana' })
      .select();

    if (errorSemanas) {
      console.error('Error guardando semanas generadas:', errorSemanas);
      setLoading(false);
      return;
    }
    console.log("Semanas guardadas en DB:", semanasGuardadas);

    // 2. Preparar y guardar los días
    // Usamos map para asegurar que los días se asignen a la semana correcta
    const diasParaGuardar = semanasGuardadas.flatMap((semanaGuardada) => {
      // IMPORTANTE: Asegurar que la comparación de numero_semana sea correcta (ambos números)
      const semanaOriginal = semanasGeneradas.find(s => Number(s.numeroSemana) === Number(semanaGuardada.numero_semana));

      if (!semanaOriginal) {
        console.warn(`No se encontró la semana original para la semana guardada ${semanaGuardada.numero_semana}`);
        return [];
      }

      return semanaOriginal.dias.map(dia => ({
        semana_id: semanaGuardada.id,
        fecha: dia.toISOString(),
        estado: 'planificado'
      }));
    });

    console.log("Días preparados para guardar:", diasParaGuardar);

    if (diasParaGuardar.length === 0) {
      console.warn("No hay días para guardar. Verifique la generación de semanas.");
      setLoading(false);
      return;
    }

    const { error: errorDias } = await supabase
      .from('planificacion_dias')
      .upsert(diasParaGuardar, { onConflict: 'semana_id, fecha' });

    if (errorDias) {
      console.error('Error guardando días generados. Revirtiendo semanas...', errorDias);
      // Revertir: eliminar las semanas que acabamos de guardar
      const idsSemanasFallidas = semanasGuardadas.map(s => s.id);
      await supabase
        .from('planificacion_semanas')
        .delete()
        .in('id', idsSemanasFallidas);
      setLoading(false);
    } else {
      console.log("Días guardados exitosamente.");
      // 3. Actualizar el estado local
      getSemanasPlanificacion();
    }

    setLoading(false);
  }, [selectedProject, getSemanasPlanificacion]);

  const eliminarPlanificacion = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);

    // Eliminar semanas (Cascade debería eliminar días y actividades si está configurado, 
    // pero por seguridad intentamos limpiar todo lo relacionado al proyecto en este módulo)
    const { error } = await supabase
      .from('planificacion_semanas')
      .delete()
      .eq('project_id', selectedProject.id);

    if (error) {
      console.error("Error eliminando planificación:", error);
    } else {
      setSemanas([]);
      setDias([]);
      setActividades([]);
    }
    setLoading(false);
  }, [selectedProject]);

  // Inicializar datos
  useEffect(() => {
    if (selectedProject) {
      getSemanasPlanificacion();
      getEquipos();
    } else {
      setSemanas([]);
      setDias([]);
      setActividades([]);
      setEquipos([]);
    }
  }, [selectedProject, getSemanasPlanificacion, getEquipos]);

  const value = useMemo(() => ({
    semanas,
    dias,
    actividades,
    equipos,
    loading,
    getSemanasPlanificacion,
    getSemanaById,
    getEquipos,
    crearEquipo,
    crearActividadPlanificada,
    updateActividad,
    deleteActividad,
    crearRequerimiento,
    recalcularMontosSemana,
    recalcularMontoRequerimientosSemana,
    guardarSemanasGeneradas,
    eliminarPlanificacion
  }), [
    semanas, dias, actividades, equipos, loading,
    getSemanasPlanificacion, getSemanaById, getEquipos, crearEquipo,
    crearActividadPlanificada, updateActividad, deleteActividad,
    crearRequerimiento, recalcularMontosSemana, recalcularMontoRequerimientosSemana,
    guardarSemanasGeneradas, eliminarPlanificacion
  ]);

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
};