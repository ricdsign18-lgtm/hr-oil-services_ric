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
  const { getPagosByProject } = usePersonal();

  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [showCategories, setShowCategories] = useState(false);

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

  // Agrupar gastos por categoría
  const gastosPorCategoria = {};

  console.log('=== DEBUG VALUACION ===');
  console.log('Período:', periodo_inicio, 'a', periodo_fin);
  console.log('Facturas en período:', facturasPeriodo.length);
  console.log('Compras sin factura en período:', comprasSinFacturaPeriodo.length);

  // Procesar facturas (compras con factura)
  facturasPeriodo.forEach((factura) => {
    const categoria = factura.categoria || 'Sin Categoría';
    const monto = parseFloat(factura.pagadoDolares || 0);

    console.log('Factura:', {
      numeroFactura: factura.numeroFactura,
      categoria: categoria,
      pagadoDolares: monto,
      proveedor: factura.proveedor
    });

    if (!gastosPorCategoria[categoria]) {
      gastosPorCategoria[categoria] = {
        conFactura: 0,
        sinFactura: 0,
        total: 0
      };
    }

    gastosPorCategoria[categoria].conFactura += monto;
    gastosPorCategoria[categoria].total += monto;
  });

  // Procesar compras sin factura
  comprasSinFacturaPeriodo.forEach((compra) => {
    const categoria = compra.categoria || 'Sin Categoría';
    const monto = parseFloat(compra.totalDolares || 0);

    console.log('Compra sin factura:', {
      numeroReferencia: compra.numeroNotaEntrega || 'N/A',
      categoria: categoria,
      totalDolares: monto,
      proveedor: compra.proveedor
    });

    if (!gastosPorCategoria[categoria]) {
      gastosPorCategoria[categoria] = {
        conFactura: 0,
        sinFactura: 0,
        total: 0
      };
    }

    gastosPorCategoria[categoria].sinFactura += monto;
    gastosPorCategoria[categoria].total += monto;
  });

  console.log('Gastos agrupados por categoría:', gastosPorCategoria);
  console.log('=== FIN DEBUG ===');

  // Calcular totales
  const totalComprasConFacturaUSD = facturasPeriodo
    .reduce((acc, curr) => acc + parseFloat(curr.pagadoDolares || 0), 0);

  const totalComprasSinFacturaUSD = comprasSinFacturaPeriodo
    .reduce((acc, curr) => acc + parseFloat(curr.totalDolares || 0), 0);

  const totalPagosNominaUSD = pagosPeriodo.reduce((acc, curr) => {
    const totalPagoUSD = curr.pagos.reduce(
      (pagoAcc, pago) => pagoAcc + parseFloat(pago.montoTotalUSD || 0),
      0
    );
    return acc + totalPagoUSD;
  }, 0);

  const totalGastosComprasUSD = totalComprasConFacturaUSD + totalComprasSinFacturaUSD;
  const totalGastosUSD = totalGastosComprasUSD + totalPagosNominaUSD;

  // Ordenar categorías por total (descendente)
  const categoriasOrdenadas = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1].total - a[1].total);

  const utilidadNeta = subtotalValuacionUSD - totalGastosUSD;

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
        {/* Totales de Valuación */}
        <div className="financial-section-full">
          <h5>Totales Valuación</h5>
          <div className="financial-grid-inline">
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
            </div>
          </div>
          <div className="progress-bar-full">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(porcentajeEjecutado, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Gastos por Categoría */}
        <div className="financial-section-full">
          <h5
            onClick={() => setShowCategories(!showCategories)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span style={{ marginRight: '0.5rem' }}>
              {showCategories ? '▼' : '▶'}
            </span>
            Gastos por Categoría
          </h5>
          {showCategories && (
            <>
              {categoriasOrdenadas.length > 0 ? (
                <div className="categorias-grid">
                  {categoriasOrdenadas.map(([categoria, montos]) => {
                    const porcentaje = subtotalValuacionUSD > 0
                      ? (montos.total / subtotalValuacionUSD) * 100
                      : 0;

                    return (
                      <div key={categoria} className="categoria-item">
                        <div className="categoria-header-simple">
                          <span className="categoria-nombre">{categoria}</span>
                          <div className="categoria-stats">
                            <span className="categoria-total">
                              {formatCurrency(montos.total, "USD")}
                            </span>
                            <span className="categoria-porcentaje">
                              {porcentaje.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-message">
                  <span>Sin gastos por categoría registrados</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Resumen de Gastos */}
        <div className="financial-section-full compact-summary">
          <h5>Resumen de Gastos</h5>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">🛒</div>
              <div className="summary-content">
                <span className="summary-label">Total Compras</span>
                <span className="summary-value">
                  {formatCurrency(totalGastosComprasUSD, "USD")}
                </span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-content">
                <span className="summary-label">Nómina</span>
                <span className="summary-value">
                  {formatCurrency(totalPagosNominaUSD, "USD")}
                </span>
              </div>
            </div>
            <div className="summary-card total">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <span className="summary-label">Total Gastos</span>
                <span className="summary-value">
                  {formatCurrency(totalGastosUSD, "USD")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="financial-section-full resultados">
          <h5>Resultados</h5>
          <div className="resultados-grid">
            <div className="resultado-principal">
              <div className="resultado-label">UTILIDAD NETA</div>
              <div className="resultado-value">
                {formatCurrency(utilidadNeta, "USD")}
              </div>
            </div>
            <div className="indicadores-grid">
              <div className="indicador ganancia">
                <div className="indicador-icon">📈</div>
                <div className="indicador-content">
                  <span className="indicador-label">% Ganancia</span>
                  <span className="indicador-value">
                    {subtotalValuacionUSD > 0
                      ? ((utilidadNeta / subtotalValuacionUSD) * 100).toFixed(2)
                      : 0}%
                  </span>
                </div>
              </div>
              <div className="indicador gastos">
                <div className="indicador-icon">📉</div>
                <div className="indicador-content">
                  <span className="indicador-label">% Gastos</span>
                  <span className="indicador-value">
                    {subtotalValuacionUSD > 0
                      ? ((totalGastosUSD / subtotalValuacionUSD) * 100).toFixed(2)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default ValuacionResumenCard;
