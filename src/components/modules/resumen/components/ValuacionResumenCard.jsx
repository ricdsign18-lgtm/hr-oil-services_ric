import React, { useState, useEffect } from "react";
import { useCurrency } from "../../../../contexts/CurrencyContext";
import { useOperaciones } from "../../../../contexts/OperacionesContext";
import { usePersonal } from "../../../../contexts/PersonalContext";
import supabase from "../../../../api/supaBase";
import ValuacionCategoriasModal from "./ValuacionCategoriasModal";
import ValuacionPayrollModal from "./ValuacionPayrollModal";
import {
  CartShoppingIcon,
  MultiUsersIcon,
  SackDollarIcon,
  BankIcon,
} from "../../../../assets/icons/Icons";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./ValuacionResumenCard.css";

const ValuacionResumenCard = ({
  valuacion,
  mainCurrency,
  budgetTotalUSD,
  cumulativeProgressUSD,
}) => {
  const { formatCurrency, convertToUSD, customRates } = useCurrency();
  const { facturas, comprasSinFactura } = useOperaciones();
  const { getPagosByProject, getPagosContratistasByProject } = usePersonal();

  const [pagos, setPagos] = useState([]);
  const [pagosContratistas, setPagosContratistas] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [showAllCategoriesModal, setShowAllCategoriesModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [seniatAmount, setSeniatAmount] = useState(0);
  const [includeCommissions, setIncludeCommissions] = useState(false);

  useEffect(() => {
    const fetchPagos = async () => {
      if (valuacion.projectId) {
        setLoadingPagos(true);
        const [fetchedPagos, fetchedContratistas] = await Promise.all([
          getPagosByProject(valuacion.projectId),
          getPagosContratistasByProject(valuacion.projectId)
        ]);
        setPagos(fetchedPagos);
        setPagosContratistas(fetchedContratistas);
        setLoadingPagos(false);
      }
    };
    fetchPagos();
  }, [valuacion.projectId, getPagosByProject, getPagosContratistasByProject]);

  useEffect(() => {
    const calculateSeniatAmount = async () => {
      if (!valuacion.periodoInicio) return;

      const date = new Date(valuacion.periodoInicio);
      const year = date.getFullYear();

      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31T23:59:59`;

      try {
        const { count, error } = await supabase
          .from("valuations")
          .select("*", { count: "exact", head: true })
          .gte("period_start", startOfYear)
          .lte("period_start", endOfYear);

        if (error) {
          console.error("Error calculating SENIAT amount:", error);
          return;
        }

        const calculatedAmount = count > 0 ? 60000 / count : 0;
        setSeniatAmount(calculatedAmount);
      } catch (err) {
        console.error("Error calculating SENIAT amount:", err);
      }
    };

    calculateSeniatAmount();
  }, [valuacion.periodoInicio]);

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

  // Filter by:
  // 1. Valuation NUMBER (Legacy)
  // 2. Valuation ID (Correct Link)
  // 3. Date Range (Fallback for items not explicitly linked but within period)

  const isItemInValuation = (item, dateField, toleranceDays = 5) => {
    // Check explicit link
    if (item.valuacion) {
      if (
        String(item.valuacion) === String(numero_valuacion) ||
        String(item.valuacion) === String(valuacion.id)
      ) {
        return true;
      }
      return false;
    }

    // Check date range if valuation has dates
    if (periodo_inicio && periodo_fin && item[dateField]) {
      const itemDate = new Date(item[dateField]);
      const start = new Date(periodo_inicio);
      const end = new Date(periodo_fin);

      // Reset times to compare dates broadly
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      if (toleranceDays > 0) {
        end.setDate(end.getDate() + toleranceDays);
      }

      return itemDate >= start && itemDate <= end;
    }

    return false;
  };

  const facturasValuacion = facturas
    ? facturas.filter((item) => isItemInValuation(item, "fechaFactura", 5))
    : [];
  const comprasSinFacturaValuacion = comprasSinFactura
    ? comprasSinFactura.filter((item) => isItemInValuation(item, "fechaCompra", 5))
    : [];

  const filterDataByPeriod = (data, dateField, toleranceDays = 5) => {
    if (!data) return [];
    const startDate = new Date(periodo_inicio);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(periodo_fin);
    endDate.setHours(23, 59, 59, 999);

    if (toleranceDays > 0) {
      endDate.setDate(endDate.getDate() + toleranceDays);
    }

    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const pagosPeriodo = filterDataByPeriod(pagos, "fechaPago", 5);
  const pagosContratistasPeriodo = filterDataByPeriod(pagosContratistas, "fechaPago", 5);

  // Agrupar gastos por categoría
  const gastosPorCategoria = {};

  // Procesar facturas (compras con factura)
  facturasValuacion.forEach((factura) => {
    const categoria = factura.categoria || "Sin Categoría";
    const monto = Number(factura.totalPagarDolares) || 0;

    if (!gastosPorCategoria[categoria]) {
      gastosPorCategoria[categoria] = {
        conFactura: 0,
        sinFactura: 0,
        total: 0,
      };
    }

    gastosPorCategoria[categoria].conFactura += monto;
    gastosPorCategoria[categoria].total += monto;
  });

  // Procesar compras sin factura
  comprasSinFacturaValuacion.forEach((compra) => {
    const categoria = compra.categoria || "Sin Categoría";
    const monto = Number(compra.totalDolares) || 0;

    if (!gastosPorCategoria[categoria]) {
      gastosPorCategoria[categoria] = {
        conFactura: 0,
        sinFactura: 0,
        total: 0,
      };
    }

    gastosPorCategoria[categoria].sinFactura += monto;
    gastosPorCategoria[categoria].total += monto;
  });

  // Calculate totals
  const totalComprasConFacturaUSD = facturasValuacion.reduce(
    (acc, curr) => acc + (Number(curr.totalPagarDolares) || 0),
    0
  );

  const totalComprasSinFacturaUSD = comprasSinFacturaValuacion.reduce(
    (acc, curr) => acc + (Number(curr.totalDolares) || 0),
    0
  );

  const totalPagosNominaUSD = pagosPeriodo.reduce((acc, curr) => {
    const totalPagoUSD = curr.pagos.reduce(
      (pagoAcc, pago) => pagoAcc + parseFloat(pago.montoTotalUSD || 0),
      0
    );
    return acc + totalPagoUSD;
  }, 0);

  // Contractor payments summation
  // Structure: batch -> pagos (array of objects with monto_total_usd)
  const totalPagosContratistasUSD = pagosContratistasPeriodo.reduce((acc, curr) => {
    if (!curr.pagos || !Array.isArray(curr.pagos)) return acc;
    const totalBatchUSD = curr.pagos.reduce(
      (pagoAcc, pago) => pagoAcc + parseFloat(pago.monto_total_usd || 0),
      0
    );
    return acc + totalBatchUSD;
  }, 0);

  const totalLaboralUSD = totalPagosNominaUSD + totalPagosContratistasUSD;

  const totalGastosComprasUSD =
    totalComprasConFacturaUSD + totalComprasSinFacturaUSD;
  const totalGastosUSD = totalGastosComprasUSD + totalLaboralUSD;

  const categoriasOrdenadas = Object.entries(gastosPorCategoria).sort(
    (a, b) => b[1].total - a[1].total
  );

  const utilidadNeta = subtotalValuacionUSD - totalGastosUSD - seniatAmount;

  const convertFromUSD = (amount) => {
    const rate =
      mainCurrency === "USD" ? 1 : customRates?.[mainCurrency] || 1;
    return amount * rate;
  };

  // Helper states have been removed and moved to the modal components

  return (
    <div className="valuacion-resumen-card">
      <div className="card-header">
        <h4>{numero_valuacion}</h4>
        <div className="header-details">
          <span className="periodo">
            {new Date(
              new Date(periodo_inicio).getTime() +
              new Date().getTimezoneOffset() * 60000
            ).toLocaleDateString()}{" "}
            -{" "}
            {new Date(
              new Date(periodo_fin).getTime() +
              new Date().getTimezoneOffset() * 60000
            ).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="card-body">
        {/* Totales de Valuación */}
        <div className="financial-section-full">
          <h5>Totales Valuación</h5>
          <div className="valuacion-totales-grid">
            {/* Subtotal Original Card */}
            <div className="valuacion-total-card blue">
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">
                  Subtotal Original ({currencyValuacion})
                </span>
                <span className="valuacion-card-value-main">
                  {formatCurrency(subtotalValuacion, currencyValuacion)}
                </span>
                {currencyValuacion !== "USD" && (
                  <span className="valuacion-card-value-secondary">
                    ≈ {formatCurrency(subtotalValuacionUSD, "USD")}
                  </span>
                )}
              </div>
            </div>

            {/* Subtotal USD Card */}
            <div className="valuacion-total-card indigo">
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">
                  Subtotal Equivalente (USD)
                </span>
                <span className="valuacion-card-value-main">
                  {formatCurrency(subtotalValuacionUSD, "USD")}
                </span>
                <span className="valuacion-card-value-secondary">
                  Base de cálculo
                </span>
              </div>
            </div>

            {/* Progreso Card */}
            <div className="valuacion-total-card teal">
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">Progreso Ejecutado</span>
                <span className="valuacion-card-value-main">
                  {porcentajeEjecutado.toFixed(1)}%
                </span>
                <div className="progress-section">
                  <div className="custom-progress-bar">
                    <div
                      className="custom-progress-fill"
                      style={{
                        width: `${Math.min(porcentajeEjecutado, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promedio Avance Card */}
            <div className="valuacion-total-card purple">
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">
                  PROMEDIO DE AVANCE / VALUACION
                </span>
                <span className="valuacion-card-value-main">
                  {(
                    (numero_valuacion.match(/\d+/)
                      ? porcentajeEjecutado /
                      parseInt(numero_valuacion.match(/\d+/)[0], 10)
                      : 0) || 0
                  ).toFixed(2)}
                  %
                </span>
                <span className="valuacion-card-value-secondary">
                  Promedio por valuación
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gastos por Categoría */}


        {/* Resumen de Gastos */}
        {/* Resumen de Gastos */}
        <div className="financial-section-full compact-summary">
          <h5>Resumen de Gastos</h5>
          <div className="valuacion-totales-grid">
            <div
              className="valuacion-total-card orange interactive-card"
              onClick={() => setShowAllCategoriesModal(true)}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="valuacion-card-icon">
                <CartShoppingIcon width={32} height={32} fill="#ea580c" />
              </div>
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">Gastos Administrativos y Operativos</span>
                <span className="valuacion-card-value-main text-xl text-orange-700">
                  {formatCurrency(totalGastosComprasUSD, "USD")}
                </span>
                <span className="valuacion-card-value-secondary" style={{ fontSize: '0.75rem' }}>
                  Click para ver detalle por categorías
                </span>
              </div>
            </div>

            <div
              className="valuacion-total-card orange interactive-card"
              onClick={() => setShowPayrollModal(true)}
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="valuacion-card-icon">
                <MultiUsersIcon width={32} height={32} fill="#ea580c" />
              </div>
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">Nómina y Contrataciones</span>
                <span className="valuacion-card-value-main text-xl text-orange-700">
                  {formatCurrency(totalLaboralUSD, "USD")}
                </span>
                <span className="valuacion-card-value-secondary" style={{ fontSize: '0.75rem' }}>
                  Click para ver detalle de pagos
                </span>
              </div>
            </div>

            <div className="valuacion-total-card red">
              <div className="valuacion-card-icon">
                <SackDollarIcon width={32} height={32} fill="#dc2626" />
              </div>
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">Total Gastos</span>
                <span className="valuacion-card-value-main text-red-700">
                  {formatCurrency(totalGastosUSD, "USD")}
                </span>
              </div>
            </div>
          </div>

          {/* SENIAT Info */}
          <div className="valuacion-totales-grid seniat-grid">
            <div className="valuacion-total-card gray seniat-card-dashed">
              <div className="valuacion-card-content seniat-content-row">
                <div className="seniat-icon-wrapper">
                  <BankIcon width={28} height={28} fill="#4b5563" />
                </div>
                <div>
                  <span className="valuacion-card-label seniat-label-block">
                    Monto Anual SENIAT
                  </span>
                  <span className="valuacion-card-value-main text-lg text-gray-600">
                    - {formatCurrency(seniatAmount, "USD")}
                  </span>
                  <span className="valuacion-card-value-secondary text-xs">
                    (60k / {Math.round(60000 / seniatAmount) || 0} val. en{" "}
                    {new Date(valuacion.periodoInicio).getFullYear()})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="financial-section-full resultados">
          <h5>Proyección de Pérdidas y Ganancias</h5>
          <div className="resultados-grid-detailed">
            {/* 1. Monto a Recibir en Banco */}
            <div className="resultado-row main">
              <span className="label">
                Monto a Recibir en Banco (Subtotal - 8.1%)
              </span>
              <span className="value">
                {formatCurrency(subtotalValuacionUSD * (1 - 0.081), "USD")}
              </span>
            </div>

            {/* Calculations Constants */}
            {(() => {
              const montoBanco = subtotalValuacionUSD * (1 - 0.081);

              const dedAlcaldia = montoBanco * 0.03;
              const dedISLR = montoBanco * 0.01;
              const dedSENIAT = montoBanco * 0.1;
              const totalDedGov = dedAlcaldia + dedISLR + dedSENIAT;

              const baseComisiones = montoBanco - totalDedGov;

              const comisionCobro = baseComisiones * 0.15;
              const d25 = baseComisiones * 0.25;

              const baseOtras = baseComisiones - d25;
              const comisionP = baseOtras * 0.08;
              const comisionR = baseOtras * 0.02;
              const comisionL = baseOtras * 0.02;

              const totalComisiones =
                comisionCobro + d25 + comisionP + comisionR + comisionL;

              // FINAL UTILITY with Toggle
              const utilidadFinal = montoBanco - totalGastosUSD - (includeCommissions ? totalComisiones : 0);

              const toggleCommissions = () => {
                setIncludeCommissions(!includeCommissions);
              };

              return (
                <>
                  <div className="valuacion-totales-grid">
                    {/* Gastos Operativos Card */}
                    <div className="valuacion-total-card red">
                      <div className="valuacion-card-icon">
                        <CartShoppingIcon
                          width={32}
                          height={32}
                          fill="#ef4444"
                        />
                      </div>
                      <div className="valuacion-card-content">
                        <span className="valuacion-card-label">
                          Gastos Operativos
                        </span>
                        <span className="valuacion-card-value-main text-red-700">
                          - {formatCurrency(totalGastosUSD, "USD")}
                        </span>
                      </div>
                    </div>

                    {/* Commissions Toggle Card */}
                    <div className="valuacion-total-card orange" style={{ gridColumn: includeCommissions ? 'auto' : 'span 2' }}>
                      <div className="valuacion-card-content" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="valuacion-card-label">Comisiones y Deducciones</span>
                          <span className="valuacion-card-value-secondary">
                            {includeCommissions ? 'Incluidas' : 'Excluidas'}
                          </span>
                        </div>

                        {/* Custom Toggle Switch */}
                        <label className="switch-container-custom">
                          <input
                            type="checkbox"
                            checked={includeCommissions}
                            onChange={toggleCommissions}
                          />
                          <span className="slider-custom"></span>
                        </label>
                      </div>
                    </div>

                    {/* Commissions Value Card (Only if enabled) */}
                    {includeCommissions && (
                      <div className="valuacion-total-card orange">
                        <div className="valuacion-card-icon">
                          <MultiUsersIcon width={32} height={32} fill="#ea580c" />
                        </div>
                        <div className="valuacion-card-content">
                          <span className="valuacion-card-label">
                            Total Comisiones
                          </span>
                          <span className="valuacion-card-value-main text-orange-700">
                            - {formatCurrency(totalComisiones, "USD")}
                          </span>

                          {/* Commission Breakdown */}
                          <div className="mt-3 pt-2 border-t border-orange-200 text-xs text-slate-600 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <span>Cobro (15%):</span>
                              <span className="font-medium">{formatCurrency(comisionCobro, "USD")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>D25 (25%):</span>
                              <span className="font-medium">{formatCurrency(d25, "USD")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Comisión P (8%):</span>
                              <span className="font-medium">{formatCurrency(comisionP, "USD")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Comisión R (2%):</span>
                              <span className="font-medium">{formatCurrency(comisionR, "USD")}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Comisión L (2%):</span>
                              <span className="font-medium">{formatCurrency(comisionL, "USD")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Utilidad Final Dashboard */}
                  <div className="profit-dashboard">
                    {/* Card 1: Utilidad Monetaria */}
                    <div className="profit-card utility-main">
                      <div className="profit-icon-wrapper">
                        <SackDollarIcon width={32} height={32} fill="#ffffff" />
                      </div>
                      <div className="profit-info">
                        <span className="profit-label">
                          Utilidad Proyectada
                        </span>
                        <span className="profit-value">
                          {formatCurrency(utilidadFinal, "USD")}
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Margen Porcentual con Gráfica */}
                    <div className="profit-card margin-main">
                      <div className="margin-info">
                        <span className="profit-label">% Margen</span>
                        <span className="profit-value-large">
                          {montoBanco > 0
                            ? ((utilidadFinal / montoBanco) * 100).toFixed(2)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="margin-chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Utilidad",
                                  value: Math.max(0, utilidadFinal),
                                  color: "#10b981",
                                }, // Green-500
                                {
                                  name: "Gastos",
                                  value: Math.max(
                                    0,
                                    montoBanco - utilidadFinal
                                  ),
                                  color: "rgba(255,255,255,0.2)",
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={35}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                              stroke="none"
                            >
                              <Cell key="cell-utilidad" fill="#ffffff" />
                              <Cell
                                key="cell-gastos"
                                fill="rgba(255,255,255,0.2)"
                              />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>


      <ValuacionCategoriasModal
        showModal={showAllCategoriesModal}
        onClose={() => setShowAllCategoriesModal(false)}
        categoriasOrdenadas={categoriasOrdenadas}
        gastosPorCategoria={gastosPorCategoria}
        facturasValuacion={facturasValuacion}
        comprasSinFacturaValuacion={comprasSinFacturaValuacion}
        subtotalValuacionUSD={subtotalValuacionUSD}
        totalGastosComprasUSD={totalGastosComprasUSD}
        formatCurrency={formatCurrency}
      />

      <ValuacionPayrollModal
        showModal={showPayrollModal}
        onClose={() => setShowPayrollModal(false)}
        pagosPeriodo={pagosPeriodo}
        pagosContratistasPeriodo={pagosContratistasPeriodo}
        totalLaboralUSD={totalLaboralUSD}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default ValuacionResumenCard;
