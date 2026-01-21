// src/components/modules/contrato/submodules/presupuesto/components/AvancePresupuesto.jsx
import React, { useState, useEffect } from "react";
import "./AvancePresupuesto.css";
import { useValuation } from "../../../../../../contexts/ValuationContext";
import { useCurrency } from "../../../../../../contexts/CurrencyContext";

const AvancePresupuesto = ({ presupuestoData, projectId }) => {
  // Función local para formatear moneda, como solicitaste.
  // Recibe 'amount' y 'currency'.

  const { valuations } = useValuation();
  const { formatCurrency } = useCurrency();
  const [avancePartidas, setAvancePartidas] = useState([]);

  useEffect(() => {
    calcularAvancePresupuesto();
  }, [presupuestoData, projectId, valuations]);

  // FUNCIÓN CORREGIDA para usar el contexto de valuaciones
  const calcularAvancePresupuesto = () => {
    if (!presupuestoData || !presupuestoData.items) return;

    // Calcular ejecución acumulada por partida (TODAS las valuaciones guardadas)
    const ejecucionAcumulada = {};

    // Inicializar con datos del presupuesto
    presupuestoData.items.forEach((item) => {
      ejecucionAcumulada[item.id] = {
        ...item,
        cantidadEjecutada: 0,
        montoEjecutado: 0,
        cantidadDisponible: item.cantidad,
        montoDisponible: item.montoContrato,
      };
    });

    // Sumar ejecución de TODAS las valuaciones GUARDADAS
    valuations?.forEach((valuacion) => {
      valuacion.partidas?.forEach((partida) => {
        if (ejecucionAcumulada[partida.partidaId]) {
          ejecucionAcumulada[partida.partidaId].cantidadEjecutada += parseFloat(
            partida.cantidadEjecutada
          );
          ejecucionAcumulada[partida.partidaId].montoEjecutado +=
            partida.montoTotal;
        }
      });
    });

    // Calcular porcentajes y disponibilidad FINAL
    const avance = Object.values(ejecucionAcumulada).map((partida) => {
      const porcentajeCantidad =
        partida.cantidad > 0
          ? (partida.cantidadEjecutada / partida.cantidad) * 100
          : 0;
      const porcentajeMonto =
        partida.montoContrato > 0
          ? (partida.montoEjecutado / partida.montoContrato) * 100
          : 0;

      return {
        ...partida,
        cantidadDisponible: partida.cantidad - partida.cantidadEjecutada,
        montoDisponible: partida.montoContrato - partida.montoEjecutado,
        porcentajeEjecutadoCantidad: porcentajeCantidad,
        porcentajeEjecutadoMonto: porcentajeMonto,
      };
    });

    setAvancePartidas(avance);
  };

  // Calcular totales por moneda (TODOS LOS ITEMS)
  const getTotalesPorMoneda = () => {
    return avancePartidas.reduce((acc, partida) => {
      const moneda = partida.moneda || "USD";
      if (!acc[moneda]) {
        acc[moneda] = { ejecutado: 0, presupuestado: 0 };
      }
      acc[moneda].ejecutado += partida.montoEjecutado;
      acc[moneda].presupuestado += partida.montoContrato;
      return acc;
    }, {});
  };

  // Calcular totales por moneda (SOLO ITEMS QUE APLICAN IVA - SUBTOTAL PRESUPUESTO)
  const getTotalesPorMonedaBase = () => {
    return avancePartidas.reduce((acc, partida) => {
      // Filtrar items que son parte del "Subtotal Presupuesto" (aplicaIVA = true)
      // Ajustar esta lógica si "Subtotal Presupuesto" se define de otra manera
      if (partida.aplicaIVA) {
        const moneda = partida.moneda || "USD";
        if (!acc[moneda]) {
          acc[moneda] = { ejecutado: 0, presupuestado: 0 };
        }
        acc[moneda].ejecutado += partida.montoEjecutado;
        acc[moneda].presupuestado += partida.montoContrato;
      }
      return acc;
    }, {});
  };

  // Totales completos para la tabla (sin filtrar)
  const totalesPorMoneda = getTotalesPorMoneda();
  // Totales base para el porcentaje (filtrados)
  const totalesPorMonedaBase = getTotalesPorMonedaBase();

  const getPorcentajeTotal = () => {
    const totalPresupuestadoBase = Object.values(totalesPorMonedaBase).reduce(
      (sum, { presupuestado }) => sum + presupuestado,
      0
    );
    const totalEjecutadoBase = Object.values(totalesPorMonedaBase).reduce(
      (sum, { ejecutado }) => sum + ejecutado,
      0
    );
    return totalPresupuestadoBase > 0
      ? (totalEjecutadoBase / totalPresupuestadoBase) * 100
      : 0;
  };

  if (!presupuestoData || avancePartidas.length === 0) {
    return (
      <div className="avance-presupuesto">
        <div className="no-data">
          <p>No hay datos de avance disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="avance-presupuesto">
      <div className="avance-header">
        <h4>Avance del Presupuesto</h4>
        <div className="avance-total">
          <span className="avance-label">Avance Global:</span>
          <span className="avance-value">
            {getPorcentajeTotal().toFixed(1)}%
          </span>
          <div className="avance-montos-multi-moneda">
            {Object.entries(totalesPorMoneda).map(([moneda, totales]) => (
              <span key={moneda} className="avance-monto">
                {formatCurrency(totales.ejecutado, moneda)} de{" "}
                {formatCurrency(totales.presupuestado, moneda)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="avance-table">
        <table>
          <thead>
            <tr>
              <th className="col-item">ITEM</th>
              <th className="col-descripcion">DESCRIPCIÓN</th>
              <th className="col-unidad">UNIDAD</th>
              <th className="col-presupuestado">PRESUPUESTADO</th>
              <th className="col-ejecutado">EJECUTADO</th>
              <th className="col-disponible">DISPONIBLE</th>
              <th className="col-porcentaje">% AVANCE</th>
            </tr>
          </thead>
          <tbody>
            {avancePartidas.map((partida) => (
              <tr
                key={partida.id}
                className={partida.cantidadDisponible <= 0 ? "completada" : ""}
              >
                <td className="col-item">{partida.item}</td>
                <td className="col-descripcion">{partida.descripcion}</td>
                <td className="col-unidad">{partida.unidad}</td>
                <td className="col-presupuestado">
                  <div>
                    {partida.cantidad.toLocaleString("es-VE")} {partida.unidad}
                  </div>
                  <div className="monto">
                    {formatCurrency(partida.montoContrato, partida.moneda)}
                  </div>
                </td>
                <td className="col-ejecutado">
                  <div>
                    {partida.cantidadEjecutada.toLocaleString("es-VE")}{" "}
                    {partida.unidad}
                  </div>
                  <div className="monto">
                    {formatCurrency(partida.montoEjecutado, partida.moneda)}
                  </div>
                </td>
                <td className="col-disponible">
                  <div>
                    {partida.cantidadDisponible.toLocaleString("es-VE")}{" "}
                    {partida.unidad}
                  </div>
                  <div className="monto">
                    {formatCurrency(partida.montoDisponible, partida.moneda)}
                  </div>
                </td>
                <td className="col-porcentaje">
                  <div className="progress-container">
                    <div
                      className="progress-bar-avance"
                      style={{
                        width: `${Math.min(
                          partida.porcentajeEjecutadoCantidad,
                          100
                        )}%`,
                      }}
                    ></div>
                    <span className="progress-text">
                      {partida.porcentajeEjecutadoCantidad.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="avance-footer">
        <div className="resumen-ejecucion">
          {Object.entries(totalesPorMoneda).map(([moneda, totales]) => (
            <div key={moneda} className="resumen-grupo-moneda">
              <div className="moneda-header">{moneda}</div>
              <div className="resumen-item">
                <span className="resumen-label">Total Ejecutado:</span>
                <span className="resumen-value">
                  {formatCurrency(totales.ejecutado, moneda)}
                </span>
              </div>
              <div className="resumen-item">
                <span className="resumen-label">Total Presupuestado:</span>
                <span className="resumen-value">
                  {formatCurrency(totales.presupuestado, moneda)}
                </span>
              </div>
            </div>
          ))}
          <div className="resumen-item">
            <span className="resumen-label">Porcentaje Global:</span>
            <span className="resumen-value">
              {getPorcentajeTotal().toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvancePresupuesto;
