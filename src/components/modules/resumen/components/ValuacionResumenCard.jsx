import React, { useState, useEffect } from "react";
import { useCurrency } from "../../../../contexts/CurrencyContext";
import { useOperaciones } from "../../../../contexts/OperacionesContext";
import { usePersonal } from "../../../../contexts/PersonalContext";
import "./ValuacionResumenCard.css";

const ValuacionResumenCard = ({
  valuacion,
  mainCurrency,
  budgetTotalUSD,
  cumulativeProgressUSD,
}) => {
  const { formatCurrency, convertToUSD } = useCurrency();
  const { facturas, comprasSinFactura } = useOperaciones();
  // console.log("Las compras sin factura son", comprasSinFactura)
  const { getPagosByProject } = usePersonal();
  
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(true);

  useEffect(() => {
    const fetchPagos = async () => {
      if (valuacion.projectId) {
        setLoadingPagos(true);
        const fetchedPagos = await getPagosByProject(valuacion.projectId);
        setPagos(fetchedPagos);
        setLoadingPagos(false);
      }
    };
    fetchPagos();
  }, [valuacion.projectId, getPagosByProject]);

  if (!valuacion) {
    return (
      <div className="valuacion-resumen-card">
        <div className="card-body">
          <p>No hay datos de valuación para mostrar.</p>
        </div>
      </div>
    );
  }

  const {
    numero: numero_valuacion,
    periodoInicio: periodo_inicio,
    periodoFin: periodo_fin,
    totales,
    partidas: items,
  } = valuacion;

  const subtotalValuacion = totales?.subtotal || 0;
  const currencyValuacion = totales?.currency || mainCurrency;

  const subtotalValuacionUSD = convertToUSD(
    subtotalValuacion,
    currencyValuacion
  );
  const porcentajeEjecutado =
    budgetTotalUSD > 0 ? (cumulativeProgressUSD / budgetTotalUSD) * 100 : 0;

  const filterDataByPeriod = (data, dateField) => {
    if (!data) return [];
    const startDate = new Date(periodo_inicio);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(periodo_fin);
    endDate.setHours(23, 59, 59, 999);

    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const facturasPeriodo = filterDataByPeriod(facturas, "fechaFactura");
  const comprasSinFacturaPeriodo = filterDataByPeriod(comprasSinFactura, "fechaCompra");
  const pagosPeriodo = filterDataByPeriod(pagos, "fechaPago");

  const totalComprasConFacturaUSD = facturasPeriodo
    .reduce((acc, curr) => acc + parseFloat(curr.pagadoDolares || 0), 0);

  const totalComprasSinFacturaUSD = comprasSinFacturaPeriodo
    .reduce((acc, curr) => acc + parseFloat(curr.totalDolares || 0), 0);

  const totalPagosNominaUSD = pagosPeriodo.reduce((acc, curr) => {
    const totalPagoUSD = curr.pagos.reduce(
      (pagoAcc, pago) => pagoAcc + parseFloat(pago.subtotalUSD || 0),
      0
    );
    return acc + totalPagoUSD;
  }, 0);

  const totalGastosUSD =
    totalComprasConFacturaUSD + totalComprasSinFacturaUSD + totalPagosNominaUSD;

  const deducciones = {
    arrendamiento: subtotalValuacionUSD * 0.05,
    aporteEPS: subtotalValuacionUSD * 0.03,
    timbreFiscal: subtotalValuacionUSD * 0.001,
    ejecucionObras: subtotalValuacionUSD * 0.02,
  };

  const totalDeducciones = Object.values(deducciones).reduce(
    (acc, curr) => acc + curr,
    0
  );

  const montoARecibir =
    subtotalValuacionUSD - totalGastosUSD - totalDeducciones;

  const deduccionesEmpresa = {
    alcaldia: montoARecibir * 0.03,
    anticipoIslr: montoARecibir * 0.01,
    seniat: montoARecibir * 0.1,
  };

  const totalDeduccionesEmpresa = Object.values(deduccionesEmpresa).reduce(
    (acc, curr) => acc + curr,
    0
  );

  const utilidadNeta = montoARecibir - totalDeduccionesEmpresa;

  return (
    <div className="valuacion-resumen-card">
      <div className="card-header">
        <h4>{numero_valuacion}</h4>
        <div className="header-details">
          <span className="periodo">
            {new Date(periodo_inicio).toLocaleDateString()} -{" "}
            {new Date(periodo_fin).toLocaleDateString()}
          </span>
          <span className="porcentaje-ejecutado">
            {porcentajeEjecutado.toFixed(1)}% Ejecutado
          </span>
        </div>
      </div>

      <div className="card-body">
        <div className="financial-grid">
          <div className="financial-column">
            <div className="financial-section">
              <h5>Totales Valuación</h5>
              <div className="financial-item subtotal">
                <span className="financial-item-label">Subtotal Original</span>
                <span className="financial-item-value">
                  {formatCurrency(subtotalValuacion, currencyValuacion)}
                </span>
              </div>
              <div className="financial-item subtotal">
                <span className="financial-item-label">Subtotal (USD)</span>
                <span className="financial-item-value">
                  {formatCurrency(subtotalValuacionUSD, "USD")}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-item-label">Progreso</span>
                <span className="financial-item-value">
                  {porcentajeEjecutado.toFixed(1)}%
                </span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(porcentajeEjecutado, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="financial-section">
              <h5>Gastos del Período</h5>
              <div className="financial-item gastos">
                <span className="financial-item-label">
                  Compras con Factura
                </span>
                <span className="financial-item-value">
                  {formatCurrency(totalComprasConFacturaUSD, "USD")}
                </span>
              </div>
              <div className="financial-item gastos">
                <span className="financial-item-label">
                  Compras sin Factura
                </span>
                <span className="financial-item-value">
                  {formatCurrency(totalComprasSinFacturaUSD, "USD")}
                </span>
              </div>
              <div className="financial-item gastos">
                <span className="financial-item-label">Nómina</span>
                <span className="financial-item-value">
                  {formatCurrency(totalPagosNominaUSD, "USD")}
                </span>
              </div>
              <div className="financial-item gastos destacado">
                <span className="financial-item-label">Total Gastos</span>
                <span className="financial-item-value">
                  {formatCurrency(totalGastosUSD, "USD")}
                </span>
              </div>
            </div>
          </div>

          <div className="financial-column">
            <div className="financial-section">
              <h5>Deducciones</h5>
              <div className="financial-item deducciones">
                <span className="financial-item-label">Arrendamiento (5%)</span>
                <span className="financial-item-value">
                  {formatCurrency(deducciones.arrendamiento, "USD")}
                </span>
              </div>
              <div className="financial-item deducciones">
                <span className="financial-item-label">Aporte EPS (3%)</span>
                <span className="financial-item-value">
                  {formatCurrency(deducciones.aporteEPS, "USD")}
                </span>
              </div>
              <div className="financial-item deducciones">
                <span className="financial-item-label">
                  Timbre Fiscal (0.1%)
                </span>
                <span className="financial-item-value">
                  {formatCurrency(deducciones.timbreFiscal, "USD")}
                </span>
              </div>
              <div className="financial-item deducciones">
                <span className="financial-item-label">
                  Ejecución Obras (2%)
                </span>
                <span className="financial-item-value">
                  {formatCurrency(deducciones.ejecucionObras, "USD")}
                </span>
              </div>
              <div className="financial-item deducciones destacado">
                <span className="financial-item-label">Total Deducciones</span>
                <span className="financial-item-value">
                  {formatCurrency(totalDeducciones, "USD")}
                </span>
              </div>
            </div>

            <div className="financial-section">
              <h5>Resultados</h5>
              <div className="financial-item destacado">
                <span className="financial-item-label">Monto a Recibir</span>
                <span className="financial-item-value">
                  {formatCurrency(montoARecibir, "USD")}
                </span>
              </div>

              <div className="financial-item deducciones">
                <span className="financial-item-label">Alcaldía (3%)</span>
                <span className="financial-item-value">
                  {formatCurrency(deduccionesEmpresa.alcaldia, "USD")}
                </span>
              </div>
              <div className="financial-item deducciones">
                <span className="financial-item-label">Anticipo ISLR (1%)</span>
                <span className="financial-item-value">
                  {formatCurrency(deduccionesEmpresa.anticipoIslr, "USD")}
                </span>
              </div>
              <div className="financial-item deducciones">
                <span className="financial-item-label">SENIAT (10%)</span>
                <span className="financial-item-value">
                  {formatCurrency(deduccionesEmpresa.seniat, "USD")}
                </span>
              </div>

              <div className="financial-item final">
                <span className="financial-item-label">UTILIDAD NETA</span>
                <span className="financial-item-value">
                  {formatCurrency(utilidadNeta, "USD")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuacionResumenCard;
