// hooks/useGeneradorSemanas.js
import { useCallback } from 'react';

export const useGeneradorSemanas = () => {

  const generarSemanasProyecto = useCallback((proyecto) => {
    if (!proyecto?.fecha_inicio || !proyecto?.fecha_fin) {
      console.error("El proyecto no tiene fechas de inicio y fin definidas.");
      return [];
    }

    const fechaInicioProyecto = new Date(proyecto.fecha_inicio + 'T00:00:00');
    const fechaFinProyecto = new Date(proyecto.fecha_fin + 'T00:00:00');

    // Ajustar la fecha de inicio al lunes de esa semana
    const diaSemanaInicio = fechaInicioProyecto.getDay(); // 0 (Dom) - 6 (Sáb)
    const ajusteInicio = (diaSemanaInicio === 0) ? 6 : diaSemanaInicio - 1; // Lunes es 0
    const inicioPlanificacion = new Date(fechaInicioProyecto);
    inicioPlanificacion.setDate(fechaInicioProyecto.getDate() - ajusteInicio);

    // Ajustar la fecha de fin al domingo de esa semana
    const diaSemanaFin = fechaFinProyecto.getDay();
    const ajusteFin = (diaSemanaFin === 0) ? 0 : 7 - diaSemanaFin;
    const finPlanificacion = new Date(fechaFinProyecto);
    finPlanificacion.setDate(fechaFinProyecto.getDate() + ajusteFin);

    const semanas = [];
    let fechaActual = new Date(inicioPlanificacion);
    let numeroSemana = 1;

    while (fechaActual <= finPlanificacion) {
      const inicioSemana = new Date(fechaActual);
      const finSemana = new Date(fechaActual);
      finSemana.setDate(fechaActual.getDate() + 6);

      const diasDeLaSemana = [];
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        diasDeLaSemana.push(dia);
      }

      semanas.push({ numeroSemana, fechaInicio: inicioSemana, fechaFin: finSemana, dias: diasDeLaSemana });
      fechaActual.setDate(fechaActual.getDate() + 7);
      numeroSemana++;
    }

    return semanas;
  }, []);

  return { generarSemanasProyecto };
};