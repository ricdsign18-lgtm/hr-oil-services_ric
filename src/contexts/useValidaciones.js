import { useCallback } from 'react';

export const useValidaciones = () => {

  const validarActividad = useCallback((data) => {
    const errores = {};
    if (!data.equipo_id) {
      errores.equipo = 'Debe seleccionar un equipo.';
    }
    if (!data.partida_id) {
      errores.partida = 'Debe seleccionar una partida presupuestaria.';
    }
    if (!data.cantidad || parseFloat(data.cantidad) <= 0) {
      errores.cantidad = 'La cantidad debe ser mayor a cero.';
    }
    if (!data.precioUnitario) {
        errores.partida = 'La partida seleccionada no tiene un precio unitario válido.';
    }
    return {
      valido: Object.keys(errores).length === 0,
      errores,
    };
  }, []);

  const validarRequerimiento = useCallback((data) => {
    const errores = {};
    if (!data.nombre_suministro?.trim()) {
      errores.nombreSuministro = 'El nombre es requerido.';
    }
    if (!data.categoria) {
      errores.categoria = 'La categoría es requerida.';
    }
    if (!data.unidad) {
      errores.unidad = 'La unidad es requerida.';
    }
    if (!data.cantidad_requerida || parseFloat(data.cantidad_requerida) <= 0) {
      errores.cantidadRequerida = 'La cantidad debe ser mayor a cero.';
    }
    if (!data.precio_unitario_aprox || parseFloat(data.precio_unitario_aprox) <= 0) {
      errores.precioUnitarioAprox = 'El precio debe ser mayor a cero.';
    }
    return {
      valido: Object.keys(errores).length === 0,
      errores,
    };
  }, []);


  return {
    validarActividad,
    validarRequerimiento,
  };
};