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
  const [subactividades, setSubactividades] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar subactividades
  const getSubactividades = useCallback(async (ejecucionActividadId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ejecucion_subactividades')
      .select('*')
      .eq('ejecucion_actividad_id', ejecucionActividadId)
      .order('created_at');

    if (error) {
      console.error('Error fetching subactividades:', error);
    } else {
      setSubactividades(data || []);
    }
    setLoading(false);
  }, []);

  // Completar subactividad
  const completarSubactividad = useCallback(async (subactividadId, observaciones = '') => {
    setLoading(true);
    const { error } = await supabase
      .from('ejecucion_subactividades')
      .update({
        completada: true,
        fecha_completada: new Date(),
        observaciones
      })
      .eq('id', subactividadId);

    if (error) {
      console.error('Error completando subactividad:', error);
      throw error;
    }
    setLoading(false);
  }, []);

  // Iniciar ejecución de actividad
  const iniciarEjecucionActividad = useCallback(async (actividadPlanificadaId) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('ejecucion_actividades')
      .insert([{
        actividad_planificada_id: actividadPlanificadaId,
        fecha_inicio_real: new Date(),
        estado: 'en_proceso'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error iniciando ejecución:', error);
      throw error;
    }

    // Actualizar estado de la actividad planificada
    await supabase
      .from('planificacion_actividades')
      .update({ estado: 'en_proceso' })
      .eq('id', actividadPlanificadaId);

    setLoading(false);
    return data;
  }, []);

  const value = useMemo(() => ({
    subactividades,
    loading,
    getSubactividades,
    completarSubactividad,
    iniciarEjecucionActividad
  }), [
    subactividades, loading, 
    getSubactividades, completarSubactividad, iniciarEjecucionActividad
  ]);

  return (
    <ExecutionContext.Provider value={value}>
      {children}
    </ExecutionContext.Provider>
  );
};