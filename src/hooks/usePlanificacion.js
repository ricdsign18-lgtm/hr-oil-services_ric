// hooks/usePlanificacion.js
import { useCallback, useMemo } from 'react';
import { useProjects } from '../contexts/ProjectContext';

export const usePlanificacion = () => {
  const { selectedProject } = useProjects();

  // Generar semanas automáticamente basado en fechas del proyecto
  const generarSemanasProyecto = useCallback(() => {
    if (!selectedProject?.startDate || !selectedProject?.endDate) return [];

    const start = new Date(selectedProject.startDate);
    const end = new Date(selectedProject.endDate);
    const semanas = [];
    let currentDate = new Date(start);
    let numeroSemana = 1;

    while (currentDate <= end) {
      const semanaStart = new Date(currentDate);
      const semanaEnd = new Date(currentDate);
      semanaEnd.setDate(semanaEnd.getDate() + 6);

      // Ajustar fin de semana si excede fecha final del proyecto
      if (semanaEnd > end) semanaEnd.setTime(end.getTime());

      semanas.push({
        numeroSemana,
        fechaInicio: new Date(semanaStart),
        fechaFin: new Date(semanaEnd),
        dias: generarDiasSemana(semanaStart, semanaEnd)
      });

      currentDate.setDate(currentDate.getDate() + 7);
      numeroSemana++;
    }

    return semanas;
  }, [selectedProject]);

  // Generar días laborales de una semana
  const generarDiasSemana = useCallback((start, end) => {
    const dias = [];
    const current = new Date(start);
    
    while (current <= end) {
      // Solo días laborales (lunes a viernes)
      if (current.getDay() >= 1 && current.getDay() <= 5) {
        dias.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return dias;
  }, []);

  // Calcular métricas de planificación
  const calcularMetricasPlanificacion = useCallback((semanas, actividades) => {
    const totalSemanas = semanas.length;
    const semanasCompletadas = semanas.filter(s => s.estado === 'completada').length;
    const totalActividades = actividades.length;
    const actividadesCompletadas = actividades.filter(a => a.estado === 'completada').length;
    
    return {
      totalSemanas,
      semanasCompletadas,
      porcentajeSemanas: totalSemanas > 0 ? (semanasCompletadas / totalSemanas) * 100 : 0,
      totalActividades,
      actividadesCompletadas,
      porcentajeActividades: totalActividades > 0 ? (actividadesCompletadas / totalActividades) * 100 : 0
    };
  }, []);

  return {
    generarSemanasProyecto,
    calcularMetricasPlanificacion
  };
};