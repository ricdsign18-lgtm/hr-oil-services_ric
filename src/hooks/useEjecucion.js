// hooks/useEjecucion.js
import { useState, useCallback, useEffect } from 'react';

export const useEjecucion = () => {
  const [timersActivos, setTimersActivos] = useState({});
  const [alertas, setAlertas] = useState([]);

  // Timer en vivo para actividades
  const iniciarTimer = useCallback((actividadId) => {
    const inicio = Date.now();
    setTimersActivos(prev => ({
      ...prev,
      [actividadId]: { inicio, pausas: 0, ultimaPausa: null }
    }));
  }, []);

  const pausarTimer = useCallback((actividadId) => {
    setTimersActivos(prev => {
      if (!prev[actividadId]) return prev;
      
      return {
        ...prev,
        [actividadId]: {
          ...prev[actividadId],
          ultimaPausa: Date.now()
        }
      };
    });
  }, []);

  const reanudarTimer = useCallback((actividadId) => {
    setTimersActivos(prev => {
      if (!prev[actividadId] || !prev[actividadId].ultimaPausa) return prev;
      
      const tiempoPausa = Date.now() - prev[actividadId].ultimaPausa;
      return {
        ...prev,
        [actividadId]: {
          ...prev[actividadId],
          pausas: prev[actividadId].pausas + tiempoPausa,
          ultimaPausa: null
        }
      };
    });
  }, []);

  const detenerTimer = useCallback((actividadId) => {
    setTimersActivos(prev => {
      const timer = prev[actividadId];
      if (!timer) return prev;
      
      const { inicio, pausas, ultimaPausa } = timer;
      const tiempoTotal = Date.now() - inicio;
      const tiempoProductivo = tiempoTotal - pausas - (ultimaPausa ? Date.now() - ultimaPausa : 0);
      
      // Aquí podrías guardar en la base de datos
      const nuevosTimers = { ...prev };
      delete nuevosTimers[actividadId];
      return nuevosTimers;
    });
  }, []);

  // Obtener tiempo transcurrido para una actividad
  const getTiempoActividad = useCallback((actividadId) => {
    const timer = timersActivos[actividadId];
    if (!timer) return { productivo: 0, total: 0 };
    
    const ahora = Date.now();
    const tiempoTotal = ahora - timer.inicio;
    const tiempoPausas = timer.pausas + (timer.ultimaPausa ? ahora - timer.ultimaPausa : 0);
    const tiempoProductivo = tiempoTotal - tiempoPausas;
    
    return {
      productivo: Math.round(tiempoProductivo / 1000),
      total: Math.round(tiempoTotal / 1000),
      enPausa: !!timer.ultimaPausa
    };
  }, [timersActivos]);

  // Sistema de alertas automáticas
  const verificarAlertas = useCallback((actividades) => {
    const nuevasAlertas = [];
    const ahora = new Date();
    
    actividades.forEach(actividad => {
      // Alerta por retraso
      if (actividad.fechaPlanificada && new Date(actividad.fechaPlanificada) < ahora && actividad.estado !== 'completada') {
        const diasRetraso = Math.floor((ahora - new Date(actividad.fechaPlanificada)) / (1000 * 60 * 60 * 24));
        if (diasRetraso > 0) {
          nuevasAlertas.push({
            tipo: 'retraso',
            severidad: diasRetraso > 2 ? 'alta' : 'media',
            mensaje: `Actividad "${actividad.descripcion}" con ${diasRetraso} día(s) de retraso`,
            actividadId: actividad.id
          });
        }
      }
      
      // Alerta por baja eficiencia
      if (actividad.eficiencia !== null && actividad.eficiencia < 60) {
        nuevasAlertas.push({
          tipo: 'eficiencia',
          severidad: 'media',
          mensaje: `Baja eficiencia (${actividad.eficiencia}%) en actividad "${actividad.descripcion}"`,
          actividadId: actividad.id
        });
      }
    });
    
    setAlertas(nuevasAlertas);
  }, []);

  // Limpiar alerta
  const limpiarAlerta = useCallback((index) => {
    setAlertas(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    timersActivos,
    alertas,
    iniciarTimer,
    pausarTimer,
    reanudarTimer,
    detenerTimer,
    getTiempoActividad,
    verificarAlertas,
    limpiarAlerta
  };
};