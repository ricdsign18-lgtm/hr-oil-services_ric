// hooks/useMetricas.js
import { useCallback, useMemo } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

export const useMetricas = () => {
  const { formatCurrency, convertToUSD } = useCurrency();

  // Calcular KPIs principales del proyecto
  const calcularKPIs = useCallback((proyecto, actividades, semanas) => {
    const actividadesCompletadas = actividades.filter(a => a.estado === 'completada');
    const actividadesEnProceso = actividades.filter(a => a.estado === 'en_proceso');

    // Avance físico (Promedio ponderado por monto programado)
    // Formula: Sum(Activity.avance * Activity.montoProgramado) / Sum(Activity.montoProgramado)
    // Si no hay monto programado, usar promedio simple.

    let totalMontoProgramado = 0;
    let sumaAvancePonderado = 0;
    let sumaAvanceSimple = 0;

    actividades.forEach(act => {
      const monto = act.monto_programado || 0; // Ensure column match
      const avance = act.avance || 0;

      totalMontoProgramado += monto;
      sumaAvancePonderado += (avance * monto);
      sumaAvanceSimple += avance;
    });

    const avanceFisico = totalMontoProgramado > 0
      ? (sumaAvancePonderado / totalMontoProgramado)
      : (actividades.length > 0 ? (sumaAvanceSimple / actividades.length) : 0);

    // Avance financiero (Ejecutado real [based on progress] / Total Budget del Proyecto)
    // El "monto ejecutado real" para finanzas es el Earned Value (Valor Ganado) = % Avance * Presupuesto Actividad
    const montoEjecutadoReal = sumaAvancePonderado / 100; // Divide by 100 because avance is 0-100

    // Si proyecto.budget no existe, tratar de sumar montos de paquetes o usar totalMontoProgramado
    // FIX: Si el budget es muy bajo (ej. dummy $10) y el programado es mayor, usar el programado.
    let presupuestoBase = proyecto?.budget || 0;
    if (!presupuestoBase || presupuestoBase < totalMontoProgramado) {
      presupuestoBase = totalMontoProgramado;
    }

    const avanceFinanciero = presupuestoBase > 0
      ? (montoEjecutadoReal / presupuestoBase) * 100
      : 0;

    // Eficiencia general (Monto Ejecutado / Costo Real)
    // Como no tenemos Costo Real (Facturas/Gastos) integrado directamente aquí a nivel de actividad, 
    // usaremos la eficiencia promedio registrada (si existe) o un placeholder por ahora.
    // O mejor: Comparar lo "Ejecutado" segun avance vs lo "Gastado" si tuviéramos ese dato.
    // Volvamos al promedio simple de eficiencias si el campo existe, o removamos si es confuso.
    // Mantendremos la lógica anterior de promedio simple si existe el campo, sino 100%
    const eficienciaGeneral = actividades.length > 0
      ? actividades.reduce((sum, act) => sum + (act.eficiencia || 100), 0) / actividades.length
      : 0;

    // Cumplimiento de plazos
    // Cumplimiento de plazos
    const actividadesEnPlazo = actividadesCompletadas.filter(act => {
      // FIX: La fecha planificada viene de plan_dias.fecha
      const fechaPlan = act.fecha_planificada || act.plan_dias?.fecha;
      const fechaReal = act.fecha_fin_real;

      if (!fechaPlan || !fechaReal) return false;

      // Comparar fechas (normalizar a inicio del día para evitar problemas de hora)
      const dPlan = new Date(fechaPlan);
      dPlan.setHours(23, 59, 59, 999); // Planificada es el final del día

      const dReal = new Date(fechaReal);
      return dReal <= dPlan;
    });
    const cumplimientoPlazos = actividadesCompletadas.length > 0
      ? (actividadesEnPlazo.length / actividadesCompletadas.length) * 100
      : 100; // Si no hay completadas, 100% "En plazo" (optimista)

    return {
      avanceFisico: Math.round(avanceFisico * 100) / 100,
      avanceFinanciero: Math.round(avanceFinanciero * 100) / 100,
      eficienciaGeneral: Math.round(eficienciaGeneral * 100) / 100,
      cumplimientoPlazos: Math.round(cumplimientoPlazos * 100) / 100,
      actividadesTotales: actividades.length,
      actividadesCompletadas: actividadesCompletadas.length,
      actividadesEnProceso: actividadesEnProceso.length,
      montoCompletado: montoEjecutadoReal,
      montoCompletado: montoEjecutadoReal,
      montoPlanificado: presupuestoBase
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