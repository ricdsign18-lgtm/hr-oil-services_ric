// contexts/ExecutionContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import supabase from '../api/supaBase';

const ExecutionContext = createContext();

export const useExecution = () => {
  const context = useContext(ExecutionContext);
  if (!context) {
    throw new Error('useExecution debe usarse dentro de ExecutionProvider');
  }
  return context;
};

export const ExecutionProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  // Cargar subactividades
  const getSubactividades = useCallback(async (ejecucionActividadId) => {
    const { data, error } = await supabase
      .from('ejecucion_subactividades')
      .select('*')
      .eq('ejecucion_actividad_id', ejecucionActividadId)
      .order('created_at');

    if (error) {
      console.error('Error fetching subactividades:', error);
      return []; // Devolver siempre un array
    }
    return data || [];
  }, []);

  // Completar/Toggle subactividad
  const toggleSubactividad = useCallback(async (subactividadId, completada, observaciones = '') => {
    setLoading(true);
    const updateData = {
      completada: completada,
      fecha_completada: completada ? new Date() : null,
    };
    if (observaciones) updateData.observaciones = observaciones;

    const { error } = await supabase
      .from('ejecucion_subactividades')
      .update(updateData)
      .eq('id', subactividadId);

    if (error) {
      console.error('Error actualizando subactividad:', error);
      throw error;
    }
    setLoading(false);
  }, []);

  // Finalizar actividad
  const finalizarActividad = useCallback(async (ejecucionId, actividadPlanificadaId) => {
    setLoading(true);
    try {
      // 1. Actualizar el estado de la ejecución
      const { error: execError } = await supabase
        .from('ejecucion_actividades')
        .update({ estado: 'completada', fecha_fin_real: new Date().toISOString() })
        .eq('id', ejecucionId);
      if (execError) throw execError;

      // 2. Actualizar el estado de la planificación
      await supabase
        .from('planificacion_actividades')
        .update({ estado: 'completada' })
        .eq('id', actividadPlanificadaId);

    } catch (error) {
      console.error("Error al finalizar la actividad:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar ejecución de actividad
  const iniciarEjecucionActividad = useCallback(async (actividadPlanificada) => {
    setLoading(true);
    try {
      // 1. Crear (o encontrar) el registro principal de ejecución
      const { data: ejecucionData, error: ejecucionError } = await supabase
        .from('ejecucion_actividades')
        .upsert(
          {
            actividad_planificada_id: actividadPlanificada.id,
            estado: 'en_proceso',
            fecha_inicio_real: new Date().toISOString(),
          },
          { onConflict: 'actividad_planificada_id' }
        )
        .select()
        .single();

      if (ejecucionError) throw ejecucionError;

      // 2. Crear las subactividades de ejecución basadas en la planificación
      let subactividadesArray = actividadPlanificada.subactividades;

      // Robustez: asegurar que sea un array
      if (typeof subactividadesArray === 'string') {
        try {
          subactividadesArray = JSON.parse(subactividadesArray);
        } catch (e) {
          // Si no es JSON válido, tal vez es una cadena simple, la convertimos en array de 1 elemento
          subactividadesArray = [subactividadesArray];
        }
      }

      if (subactividadesArray && Array.isArray(subactividadesArray) && subactividadesArray.length > 0) {
        const subactividadesParaCrear = subactividadesArray.map(desc => ({
          ejecucion_actividad_id: ejecucionData.id,
          descripcion: desc,
        }));

        // Usar upsert para no duplicar si ya existen
        const { error: subError } = await supabase
          .from('ejecucion_subactividades')
          .upsert(subactividadesParaCrear, { onConflict: 'ejecucion_actividad_id, descripcion' });

        if (subError) console.error("Error al crear subactividades:", subError);
      }

      // 3. Actualizar el estado en la tabla de planificación
      await supabase
        .from('planificacion_actividades')
        .update({ estado: 'en_proceso' })
        .eq('id', actividadPlanificada.id);

      return ejecucionData;
    } catch (error) {
      console.error('Error iniciando ejecución:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTiemposPorActividad = useCallback(async (ejecucionActividadId) => {
    const { data, error } = await supabase
      .from('ejecucion_tiempos')
      .select('*')
      .eq('ejecucion_actividad_id', ejecucionActividadId)
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: false });

    if (error) {
      console.error("Error al obtener tiempos:", error);
      return [];
    }
    return data;
  }, []);

  const registrarTiempo = useCallback(async (tiempoData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ejecucion_tiempos')
        .insert(tiempoData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error al registrar tiempo:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    loading,
    getSubactividades,
    iniciarEjecucionActividad,
    finalizarActividad,
    getTiemposPorActividad,
    registrarTiempo,
    toggleSubactividad,
  }), [
    loading,
    getSubactividades,
    iniciarEjecucionActividad,
    finalizarActividad,
    getTiemposPorActividad,
    registrarTiempo,
    toggleSubactividad,
  ]);

  return (
    <ExecutionContext.Provider value={value}>
      {children}
    </ExecutionContext.Provider>
  );
};