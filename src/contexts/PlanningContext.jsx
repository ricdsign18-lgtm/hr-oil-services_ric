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
      .from('plan_semanas')
      .select('*')
      .eq('project_id', selectedProject.id)
      .order('numero_semana');

    if (error) {
      console.error('Error fetching semanas:', error);
    } else {
      setSemanas(data || []);
    }
    setLoading(false);
    setLoading(false);
  }, [selectedProject]);

  // Cargar TODAS las actividades del proyecto (para métricas globales)
  const getAllActividades = useCallback(async () => {
    if (!selectedProject) return;
    // Don't set global loading true here to avoid flickering entire UI if running in background usually
    // But for initial load it might be needed. Let's keep it subtle or reuse main loading.

    const { data, error } = await supabase
      .from('plan_actividades')
      .select(`
        *,
        plan_dias!inner(
            semana_id,
            fecha,
            plan_semanas!inner(project_id)
        )
      `)
      .eq('plan_dias.plan_semanas.project_id', selectedProject.id);

    if (error) {
      console.error('Error fetching all actividades:', error);
    } else {
      setActividades(data || []);
    }
  }, [selectedProject]);

  const getSemanaById = useCallback(async (semanaId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plan_semanas')
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

  const recalcularMontosSemana = useCallback(async (semanaId) => {
    const { data: dias, error: diasError } = await supabase
      .from('plan_dias')
      .select('monto_planificado, monto_ejecutado, cantidad_actividades')
      .eq('semana_id', semanaId);

    if (diasError) {
      console.error('Error fetching dias para recalcular semana:', diasError);
      return;
    }

    const montoTotalSemana = dias.reduce((sum, dia) => sum + (dia.monto_planificado || 0), 0);
    const montoEjecutadoSemana = dias.reduce((sum, dia) => sum + (dia.monto_ejecutado || 0), 0);
    const actividadesTotalesSemana = dias.reduce((sum, dia) => sum + (dia.cantidad_actividades || 0), 0);

    await supabase
      .from('plan_semanas')
      .update({
        monto_planificado: montoTotalSemana,
        monto_ejecutado: montoEjecutadoSemana
      })
      .eq('id', semanaId);

  }, []);

  // Helper para recalcular totales del día
  const recalcularTotalesDia = useCallback(async (diaId) => {
    if (!diaId) return;

    // 1. Fetch activities for the day and get semana_id
    const { data: dayRecord } = await supabase
      .from('plan_dias')
      .select('semana_id')
      .eq('id', diaId)
      .single();

    if (!dayRecord) return;

    // 2. Fetch activities to aggregate
    const { data: actividades, error } = await supabase
      .from('plan_actividades')
      .select('monto_programado, estado')
      .eq('dia_id', diaId);

    if (error) {
      console.error("Error recalculando totales dia:", error);
      return;
    }

    // 3. Calculate totals (Planned & Executed)
    const cantidad = actividades.length;
    const montoPlanificado = actividades.reduce((sum, act) => sum + (act.monto_programado || 0), 0);
    // Executed: Sum of activities marked as 'completada'
    const montoEjecutado = actividades
      .filter(act => act.estado === 'completada')
      .reduce((sum, act) => sum + (act.monto_programado || 0), 0);

    // 4. Update day record
    await supabase
      .from('plan_dias')
      .update({
        cantidad_actividades: cantidad,
        monto_planificado: montoPlanificado,
        monto_ejecutado: montoEjecutado
      })
      .eq('id', diaId);

    // 5. Update week totals
    if (dayRecord.semana_id) {
      await recalcularMontosSemana(dayRecord.semana_id);
    }

  }, [recalcularMontosSemana]);

  // Crear actividad
  const crearActividadPlanificada = useCallback(async (actividadData) => {
    setLoading(true);

    // Separar datos de actividad principal y datos relacionados (subactividades, personal)
    // También excluir 'monto_programado' ya que es columna generada
    const { subactividades, personal, monto_programado, ...mainData } = actividadData;

    try {
      // 1. Insertar actividad principal
      const { data: actividad, error } = await supabase
        .from('plan_actividades')
        .insert([mainData])
        .select()
        .single();

      if (error) throw error;

      // 2. Insertar Subactividades si existen
      if (subactividades && subactividades.length > 0) {
        const subactividadesToInsert = subactividades.map(sub => ({
          actividad_id: actividad.id,
          descripcion: sub.descripcion,
          completada: false
        }));
        const { error: errorSub } = await supabase
          .from('plan_subactividades')
          .insert(subactividadesToInsert);
        if (errorSub) console.error("Error guardando subactividades:", errorSub);
      }

      // 3. Insertar Personal si existe
      if (personal && personal.length > 0) {
        const personalToInsert = personal.map(p => ({
          actividad_id: actividad.id,
          personal_id: p.id,
          nombre_personal: p.nombre, // Optimización para display
          rol_en_actividad: p.rol || 'General'
        }));
        const { error: errorPers } = await supabase
          .from('plan_actividad_personal')
          .insert(personalToInsert);
        if (errorPers) console.error("Error guardando personal:", errorPers);
      }

      // 4. Recalcular totales del día
      await recalcularTotalesDia(mainData.dia_id);

      return actividad;
    } catch (error) {
      console.error('Error creando actividad:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [recalcularTotalesDia]);

  const updateActividad = useCallback(async (actividadId, actividadData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plan_actividades')
        .update(actividadData)
        .eq('id', actividadId)
        .select()
        .single();

      if (error) throw error;

      // Recalcular montos (necesitamos dia_id, si no viene en data, habría que buscarlo, pero generalmente update viene del form con todo o no cambiamos dia)
      if (data.dia_id) {
        await recalcularTotalesDia(data.dia_id);
      }
      return data;
    } catch (error) {
      console.error('Error actualizando actividad:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [recalcularTotalesDia]);

  const deleteActividad = useCallback(async (actividadId) => {
    setLoading(true);
    try {
      // Primero obtener el dia_id para recalcular
      const { data: act } = await supabase
        .from('plan_actividades')
        .select('dia_id')
        .eq('id', actividadId)
        .single();

      const { error } = await supabase
        .from('plan_actividades')
        .delete()
        .eq('id', actividadId);

      if (error) throw error;

      if (act?.dia_id) {
        await recalcularTotalesDia(act.dia_id);
      }

    } catch (error) {
      console.error('Error eliminando actividad:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [recalcularTotalesDia]);

  // Funciones para Subactividades
  const getSubactividades = useCallback(async (actividadId) => {
    const { data, error } = await supabase
      .from('plan_subactividades')
      .select('*')
      .eq('actividad_id', actividadId)
      .order('created_at');
    if (error) {
      console.error("Error fetching subactividades", error);
      return [];
    }
    return data;
  }, []);

  const toggleSubactividad = useCallback(async (subId, completada) => {
    const { error } = await supabase
      .from('plan_subactividades')
      .update({
        completada: completada,
        fecha_completado: completada ? new Date() : null
      })
      .eq('id', subId);
    if (error) throw error;
  }, []);




  const recalcularMontoRequerimientosSemana = useCallback(async (semanaId) => {
    try {
      // Fetch requirements linked to this week
      const { data: reqs, error } = await supabase
        .from('requerimientos')
        .select(`
            id,
            requerimiento_items (
                cantidad_requerida,
                precio_unitario_usd_aprox
            )
        `)
        .eq('semana_id', semanaId)
        .neq('status', 'cancelado'); // Exclude cancelled reqs? Or check item status?

      if (error) {
        console.warn("Could not calculate requirements total (check if semana_id column exists in requerimientos):", error);
        return;
      }

      let totalSemana = 0;
      if (reqs) {
        reqs.forEach(req => {
          if (req.requerimiento_items) {
            const reqTotal = req.requerimiento_items.reduce((sum, item) => {
              // Only count active items? Or all? Assuming all for "Required Amount"
              // Maybe filter out cancelled items if status exists on item
              return sum + ((item.cantidad_requerida || 0) * (item.precio_unitario_usd_aprox || 0));
            }, 0);
            totalSemana += reqTotal;
          }
        });
      }

      await supabase
        .from('plan_semanas')
        .update({ monto_requerimientos: totalSemana })
        .eq('id', semanaId);

    } catch (e) {
      console.error("Error recalculating requirements week:", e);
    }
  }, []);

  const crearRequerimiento = useCallback(async (requerimientoData) => {
    setLoading(true);
    try {
      // Usar la tabla requerimientos estándar
      const { data, error } = await supabase
        .from('requerimientos')
        .insert([requerimientoData]) // Asegurarse de enviar semana_id aquí
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
    console.log("Guardando semanas generadas (Schema V2):", semanasGeneradas);

    // 1. Preparar y guardar las semanas
    const semanasParaGuardar = semanasGeneradas.map(s => ({
      project_id: selectedProject.id,
      numero_semana: s.numeroSemana,
      fecha_inicio: s.fechaInicio,
      fecha_fin: s.fechaFin,
      estado: 'planificada'
    }));

    const { data: semanasGuardadas, error: errorSemanas } = await supabase
      .from('plan_semanas')
      .upsert(semanasParaGuardar, { onConflict: 'project_id, numero_semana' })
      .select();

    if (errorSemanas) {
      console.error('Error guardando semanas generadas:', errorSemanas);
      setLoading(false);
      return;
    }

    // 2. Preparar y guardar los días
    const diasParaGuardar = semanasGuardadas.flatMap((semanaGuardada) => {
      const semanaOriginal = semanasGeneradas.find(s => Number(s.numeroSemana) === Number(semanaGuardada.numero_semana));

      if (!semanaOriginal) return [];

      return semanaOriginal.dias.map(dia => ({
        semana_id: semanaGuardada.id,
        fecha: dia.toISOString(),
        estado: 'pendiente' // Default state
      }));
    });

    if (diasParaGuardar.length === 0) {
      setLoading(false);
      return;
    }

    const { error: errorDias } = await supabase
      .from('plan_dias')
      .upsert(diasParaGuardar, { onConflict: 'semana_id, fecha' });

    if (errorDias) {
      console.error('Error guardando días generados:', errorDias);
      // Rollback is manual in Supabase via API, skipping for brevity but strictly should delete weeks
    } else {
      getSemanasPlanificacion();
    }

    setLoading(false);
  }, [selectedProject, getSemanasPlanificacion]);

  const eliminarPlanificacion = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);

    const { error } = await supabase
      .from('plan_semanas')
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

  // Helper para obtener disponibilidad de partida (Budget Integration)
  const getDisponibilidadPartida = useCallback(async (partidaId) => {
    // 1. Obtener total presupuestado para la partida
    // Nota: Esto asume que tenemos acceso al budget context o podemos hacer fetch
    if (!budget || !budget.items) return 0; // Fallback

    const partida = budget.items.find(item => item.id === partidaId);
    if (!partida) return 0;

    const totalPresupuestado = parseFloat(partida.cantidad); // Asumiendo 'cantidad' es la unidad

    // 2. Obtener total ya planificado (sumando plan_actividades)
    const { data: actividades, error } = await supabase
      .from('plan_actividades')
      .select('cantidad_programada')
      .eq('partida_id', partidaId);

    if (error) {
      console.error("Error fetching usage", error);
      return totalPresupuestado; // Fail safe
    }

    const totalPlanificado = actividades.reduce((acc, curr) => acc + (curr.cantidad_programada || 0), 0);

    return totalPresupuestado - totalPlanificado;

  }, [budget]);

  // Inicializar datos
  useEffect(() => {
    if (selectedProject) {
      getSemanasPlanificacion();
      getEquipos();
      getAllActividades();
    } else {
      setSemanas([]);
      setDias([]);
      setActividades([]);
      setEquipos([]);
    }
  }, [selectedProject, getSemanasPlanificacion, getEquipos]);

  /* 
     Función para Sincronizar/Recalcular TODOS los totales del proyecto.
     Útil para corrección de datos antiguos o inconsistencias.
  */
  const syncProjectTotals = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      console.log("Iniciando sincronización completa de totales...");

      // 1. Obtener todas las semanas del proyecto
      const { data: weeks, error: errWeeks } = await supabase
        .from('plan_semanas')
        .select('id')
        .eq('project_id', selectedProject.id);

      if (errWeeks) throw errWeeks;

      if (!weeks || weeks.length === 0) {
        setLoading(false);
        return;
      }

      const weekIds = weeks.map(w => w.id);

      // 2. Obtener todos los días de esas semanas
      const { data: days, error: errDays } = await supabase
        .from('plan_dias')
        .select('id')
        .in('semana_id', weekIds);

      if (errDays) throw errDays;

      // 3. Recalcular cada DÍA (sin actualizar semana aún para eficiencia)
      //    Iteramos secuencialmente para no saturar conexiones
      for (const day of days) {
        const { data: acts } = await supabase
          .from('plan_actividades')
          .select('monto_programado, estado')
          .eq('dia_id', day.id);

        const actsSafe = acts || [];
        const cantidad = actsSafe.length;
        const montoPlan = actsSafe.reduce((sum, a) => sum + (a.monto_programado || 0), 0);
        const montoExec = actsSafe
          .filter(a => a.estado === 'completada')
          .reduce((sum, a) => sum + (a.monto_programado || 0), 0);

        await supabase
          .from('plan_dias')
          .update({
            cantidad_actividades: cantidad,
            monto_planificado: montoPlan,
            monto_ejecutado: montoExec
          })
          .eq('id', day.id);
      }

      // 4. Recalcular todas las SEMANAS (ahora que los días están frescos)
      for (const week of weeks) {
        await recalcularMontosSemana(week.id);
        await recalcularMontoRequerimientosSemana(week.id);
      }

      console.log("Sincronización completada.");
      // Recargar datos en UI
      getSemanasPlanificacion();

    } catch (error) {
      console.error("Error sincronizando totales:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, recalcularMontosSemana, getSemanasPlanificacion]);

  const value = useMemo(() => ({
    semanas,
    dias,
    actividades,
    equipos,
    loading,
    getSemanasPlanificacion,
    getSemanaById,
    getEquipos,
    getAllActividades,
    crearEquipo,
    crearActividadPlanificada,
    updateActividad,
    deleteActividad,
    crearRequerimiento,
    recalcularMontosSemana,
    recalcularMontoRequerimientosSemana,
    guardarSemanasGeneradas,
    eliminarPlanificacion,
    syncProjectTotals, // Exported
    actions: { syncProjectTotals }, // Alternative access
    // New exports
    getSubactividades,
    toggleSubactividad,
    getDisponibilidadPartida
  }), [
    semanas, dias, actividades, equipos, loading,
    getSemanasPlanificacion, getSemanaById, getEquipos, getAllActividades, crearEquipo,
    crearActividadPlanificada, updateActividad, deleteActividad,
    crearRequerimiento, recalcularMontosSemana, recalcularMontoRequerimientosSemana,
    guardarSemanasGeneradas, eliminarPlanificacion, syncProjectTotals,
    getSubactividades, toggleSubactividad, getDisponibilidadPartida
  ]);

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
};
