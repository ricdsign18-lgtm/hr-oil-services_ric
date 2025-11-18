// hooks/useValidaciones.js
import { useCallback } from 'react';

export const useValidaciones = () => {
  // Validar formulario de actividad
  const validarActividad = useCallback((actividad) => {
    const errores = {};
    
    if (!actividad.equipo_id) {
      errores.equipo = 'Debe seleccionar un equipo.';
    }
    if (!actividad.partida_id) {
      errores.partida = 'Debe seleccionar una partida presupuestaria.';
    }
    if (!actividad.cantidad || parseFloat(actividad.cantidad) <= 0) {
      errores.cantidad = 'La cantidad debe ser mayor a cero.';
    }
    if (!actividad.precioUnitario) {
        errores.partida = 'La partida seleccionada no tiene un precio unitario válido.';
    }
    
    return {
      valido: Object.keys(errores).length === 0,
      errores
    };
  }, []);

  // Validar fechas de planificación
  const validarFechasPlanificacion = useCallback((fechaInicio, fechaFin, proyecto) => {
    const errores = {};
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const proyectoInicio = new Date(proyecto?.startDate);
    const proyectoFin = new Date(proyecto?.endDate);

    if (inicio < proyectoInicio) errores.fechaInicio = 'No puede ser anterior al inicio del proyecto';
    if (fin > proyectoFin) errores.fechaFin = 'No puede ser posterior al fin del proyecto';
    if (inicio > fin) errores.fechaFin = 'La fecha fin no puede ser anterior a la fecha inicio';

    return {
      valido: Object.keys(errores).length === 0,
      errores
    };
  }, []);

  // Validar requerimiento
  const validarRequerimiento = useCallback((requerimiento) => {
    const errores = {};
    
    if (!requerimiento.nombre_suministro?.trim()) {
      errores.nombreSuministro = 'El nombre es requerido.';
    }
    if (!requerimiento.categoria) {
      errores.categoria = 'La categoría es requerida.';
    }
    if (!requerimiento.unidad) {
      errores.unidad = 'La unidad es requerida.';
    }
    if (!requerimiento.cantidad_requerida || parseFloat(requerimiento.cantidad_requerida) <= 0) {
      errores.cantidadRequerida = 'La cantidad debe ser mayor a cero.';
    }
    if (!requerimiento.precio_unitario_aprox || parseFloat(requerimiento.precio_unitario_aprox) <= 0) {
      errores.precioUnitarioAprox = 'El precio debe ser mayor a cero.';
    }

    return {
      valido: Object.keys(errores).length === 0,
      errores
    };
  }, []);

  return {
    validarActividad,
    validarFechasPlanificacion,
    validarRequerimiento
  };
};