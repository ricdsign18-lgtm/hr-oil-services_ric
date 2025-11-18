// hooks/useMetricas.js
import { useCallback, useMemo } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

export const useMetricas = () => {
  const { formatCurrency, convertToUSD } = useCurrency();

  // Calcular KPIs principales del proyecto
  const calcularKPIs = useCallback((proyecto, actividades, semanas) => {
    const actividadesCompletadas = actividades.filter(a => a.estado === 'completada');
    const actividadesEnProceso = actividades.filter(a => a.estado === 'en_proceso');
    
    // Avance físico (basado en actividades completadas)
    const avanceFisico = actividades.length > 0 
      ? (actividadesCompletadas.length / actividades.length) * 100 
      : 0;
    
    // Avance financiero (solo actividades 100% completadas)
    const montoCompletado = actividadesCompletadas.reduce((sum, act) => 
      sum + (act.montoTotal || 0), 0
    );
    const avanceFinanciero = proyecto?.budget > 0 
      ? (montoCompletado / proyecto.budget) * 100 
      : 0;
    
    // Eficiencia general (promedio de eficiencias individuales)
    const eficienciaGeneral = actividades.length > 0
      ? actividades.reduce((sum, act) => sum + (act.eficiencia || 0), 0) / actividades.length
      : 0;
    
    // Cumplimiento de plazos
    const actividadesEnPlazo = actividadesCompletadas.filter(act => {
      if (!act.fechaPlanificada || !act.fechaFinReal) return false;
      return new Date(act.fechaFinReal) <= new Date(act.fechaPlanificada);
    });
    const cumplimientoPlazos = actividadesCompletadas.length > 0
      ? (actividadesEnPlazo.length / actividadesCompletadas.length) * 100
      : 0;

    return {
      avanceFisico: Math.round(avanceFisico * 100) / 100,
      avanceFinanciero: Math.round(avanceFinanciero * 100) / 100,
      eficienciaGeneral: Math.round(eficienciaGeneral * 100) / 100,
      cumplimientoPlazos: Math.round(cumplimientoPlazos * 100) / 100,
      actividadesTotales: actividades.length,
      actividadesCompletadas: actividadesCompletadas.length,
      actividadesEnProceso: actividadesEnProceso.length,
      montoCompletado,
      montoPlanificado: proyecto?.budget || 0
    };
  }, []);

  // Generar reporte de productividad por equipo
  const generarReporteEquipos = useCallback((actividades, equipos) => {
    return equipos.map(equipo => {
      const actividadesEquipo = actividades.filter(act => act.equipoId === equipo.id);
      const completadas = actividadesEquipo.filter(act => act.estado === 'completada');
      
      const horasPlanificadas = actividadesEquipo.reduce((sum, act) => 
        sum + (act.horasPlanificadas || 0), 0
      );
      const horasReales = actividadesEquipo.reduce((sum, act) => 
        sum + (act.horasReales || 0), 0
      );
      
      const eficiencia = horasPlanificadas > 0 
        ? (horasPlanificadas / horasReales) * 100 
        : 0;
      
      return {
        equipo: equipo.nombre,
        tag: equipo.tag_serial,
        actividadesAsignadas: actividadesEquipo.length,
        actividadesCompletadas: completadas.length,
        tasaCompletitud: actividadesEquipo.length > 0 
          ? (completadas.length / actividadesEquipo.length) * 100 
          : 0,
        horasPlanificadas: Math.round(horasPlanificadas * 100) / 100,
        horasReales: Math.round(horasReales * 100) / 100,
        eficiencia: Math.round(eficiencia * 100) / 100
      };
    });
  }, []);

  // Análisis de tendencias semanales
  const analizarTendencias = useCallback((semanas) => {
    if (!semanas.length) return [];
    
    return semanas.map(semana => ({
      semana: semana.numeroSemana,
      periodo: `${semana.fechaInicio} - ${semana.fechaFin}`,
      actividadesPlanificadas: semana.cantidadActividades || 0,
      actividadesCompletadas: semana.actividadesCompletadas || 0,
      montoPlanificado: semana.montoPlanificado || 0,
      montoEjecutado: semana.montoEjecutado || 0,
      eficiencia: semana.cantidadActividades > 0 
        ? ((semana.actividadesCompletadas || 0) / semana.cantidadActividades) * 100 
        : 0
    }));
  }, []);

  return {
    calcularKPIs,
    generarReporteEquipos,
    analizarTendencias
  };
};