import { useMemo, useState, useRef, useEffect } from "react";
import { useProjects } from "../../../contexts/ProjectContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useBudget } from "../../../contexts/BudgetContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useValuation } from "../../../contexts/ValuationContext";
import { useOperaciones } from "../../../contexts/OperacionesContext";
import { usePersonal } from "../../../contexts/PersonalContext";
import { getMainCurrency } from "../../../utils/mainCurrency";
import { ResumeCard } from "../../resume/ResumeCard";
import ValuacionResumenCard from "./components/ValuacionResumenCard";

import { DashboarddIcon, SackDollarIcon } from "../../../assets/icons/Icons";
import "./ResumenMain.css";

const ResumenMain = () => {
  const { selectedProject } = useProjects();
  const { userData } = useAuth();
  const { budget, loading: budgetLoading } = useBudget();
  const { valuations, loading: valuationsLoading } = useValuation();
  const { formatCurrency, convertToUSD, customRates } = useCurrency();


  const { compras, facturas, comprasSinFactura } = useOperaciones();
  const { getPagosByProject, getPagosContratistasByProject } = usePersonal();

  const [allPagos, setAllPagos] = useState([]);
  const [allPagosContratistas, setAllPagosContratistas] = useState([]);
  const [loadingAllPagos, setLoadingAllPagos] = useState(true);

  useEffect(() => {
    const fetchAllPagos = async () => {
      if (selectedProject?.id) {
        setLoadingAllPagos(true);
        const [fetchedPagos, fetchedPagosContratistas] = await Promise.all([
          getPagosByProject(selectedProject.id),
          getPagosContratistasByProject(selectedProject.id)
        ]);
        setAllPagos(fetchedPagos);
        setAllPagosContratistas(fetchedPagosContratistas);
        setLoadingAllPagos(false);
      }
    };
    fetchAllPagos();
  }, [selectedProject?.id, getPagosByProject, getPagosContratistasByProject]);

  const mainCurrency = useMemo(() => getMainCurrency(budget), [budget]);
  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = valuations?.length || 0;

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  useEffect(() => {
    if (carouselRef.current) {
      const slideWidth =
        carouselRef.current.querySelector(".valuacion-card-carousel")
          ?.offsetWidth || 0;
      const translateX = -currentSlide * slideWidth;
      carouselRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [currentSlide, totalSlides]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [valuations]);

  const safeConvertToUSD = (amount, currency) =>
    convertToUSD
      ? convertToUSD(Number(amount || 0), currency || "USD")
      : Number(amount || 0);

  const {
    totalPresupuesto_USD,
    totalEjecutado_USD,
    porcentajeTotalEjecutado,
    presupuestoItems,
    valuacionesItems,
    totalGastosTodasValuaciones_USD,
    totalUtilidadProyectadaGlobal_USD,
    totalComisionesYDeduccionesGlobal_USD,
    budgetChartData,
    valuationsChartData,
    subtotalConIVA_USD,
  } = useMemo(() => {
    const subtotales = {
      USD: { conIVA: 0, sinIVA: 0 },
      EUR: { conIVA: 0, sinIVA: 0 },
      BS: { conIVA: 0, sinIVA: 0 },
    };
    budget?.items?.forEach((item) => {
      if (!item || !item.moneda) return;
      const monto = Number(item.montoContrato || 0);
      const target = item.aplicaIVA ? "conIVA" : "sinIVA";
      subtotales[item.moneda] = subtotales[item.moneda] || {
        conIVA: 0,
        sinIVA: 0,
      };
      subtotales[item.moneda][target] += monto;
    });

    const subtotalConIVA_USD = Object.entries(subtotales).reduce(
      (sum, [curr, vals]) => sum + safeConvertToUSD(vals.conIVA, curr),
      0
    );
    const subtotalSinIVA_USD = Object.entries(subtotales).reduce(
      (sum, [curr, vals]) => sum + safeConvertToUSD(vals.sinIVA, curr),
      0
    );
    const totalPresupuesto_USD = subtotalConIVA_USD + subtotalSinIVA_USD;

    const totalEjecutado_USD =
      valuations?.reduce((sum, v) => {
        const subtotal = v.totales?.subtotal || 0;
        const currency = v.totales?.currency || mainCurrency;
        return sum + safeConvertToUSD(subtotal, currency);
      }, 0) || 0;

    const porcentajeTotalEjecutado =
      subtotalConIVA_USD > 0
        ? (totalEjecutado_USD / subtotalConIVA_USD) * 100
        : 0;

    const generarConversiones = (usdAmount) => {
      const tasaEUR = customRates?.EUR || 0.92;
      const eurAmount = usdAmount * tasaEUR;
      const conversiones = [];
      if (mainCurrency !== "USD")
        conversiones.push(formatCurrency(usdAmount, "USD"));
      if (mainCurrency !== "EUR")
        conversiones.push(formatCurrency(eurAmount, "EUR"));
      return conversiones.join(" | ");
    };

    const convertFromUSD = (amount) => {
      const rate =
        mainCurrency === "USD" ? 1 : customRates?.[mainCurrency] || 1;
      return amount * rate;
    };

    let totalGastosTodasValuaciones_USD = 0;
    let totalUtilidadProyectadaGlobal_USD = 0; // Renamed from totalUtilidadNeta
    let totalComisionesYDeduccionesGlobal_USD = 0; // New accumulator

    // 1. Calculate Global Expenses (Project-wide, not just within valuation periods)
    const totalComprasConFacturaGlobal_USD = facturas
      ? facturas.reduce((acc, curr) => acc + parseFloat(curr.pagadoDolares || 0), 0)
      : 0;

    const totalComprasSinFacturaGlobal_USD = comprasSinFactura
      ? comprasSinFactura.reduce((acc, curr) => acc + parseFloat(curr.totalDolares || 0), 0)
      : 0;

    const totalPagosNominaEmpleados_USD = allPagos
      ? allPagos.reduce((acc, curr) => {
        const totalPagoUSD = curr.pagos.reduce(
          (pagoAcc, pago) => pagoAcc + parseFloat(pago.montoTotalUSD || 0),
          0
        );
        return acc + totalPagoUSD;
      }, 0)
      : 0;

    const totalPagosContratistas_USD = allPagosContratistas
      ? allPagosContratistas.reduce((acc, curr) => {
        // Check if 'pagos' is an array in the contractor record
        const pagosArray = Array.isArray(curr.pagos) ? curr.pagos : [];
        const totalPagoUSD = pagosArray.reduce(
          (pagoAcc, pago) => pagoAcc + parseFloat(pago.monto_total_usd || 0),
          0
        );
        return acc + totalPagoUSD;
      }, 0)
      : 0;

    const totalPagosNominaGlobal_USD = totalPagosNominaEmpleados_USD + totalPagosContratistas_USD;

    totalGastosTodasValuaciones_USD =
      totalComprasConFacturaGlobal_USD +
      totalComprasSinFacturaGlobal_USD +
      totalPagosNominaGlobal_USD;

    let totalIngresosNetos_USD = 0;

    valuations?.forEach((valuacion) => {
      const {
        totales,
      } = valuacion;

      const subtotalValuacion = totales?.subtotal || 0;
      const currencyValuacion = totales?.currency || mainCurrency;
      const subtotalValuacionUSD = safeConvertToUSD(
        subtotalValuacion,
        currencyValuacion
      );

      // New Deduction Logic (Mirroring ValuacionResumenCard)
      const montoBanco = subtotalValuacionUSD * (1 - 0.081); // Subtotal - 8.1%
      const diffSubtotalBanco = subtotalValuacionUSD - montoBanco; // The 8.1% deducted initially

      // Gov Deductions
      const dedAlcaldia = montoBanco * 0.03;
      const dedISLR = montoBanco * 0.01;
      // const dedSENIAT = montoBanco * 0.10; // REMOVED as per updated requirements
      const totalDedGov = dedAlcaldia + dedISLR; // + dedSENIAT;

      // Commissions
      const baseComisiones = montoBanco - totalDedGov;

      const comisionCobro = baseComisiones * 0.15;
      const d25 = baseComisiones * 0.25;

      const baseOtras = baseComisiones - d25;
      const comisionP = baseOtras * 0.08;
      const comisionR = baseOtras * 0.02;
      const comisionL = baseOtras * 0.02;
      const totalOtras = comisionP + comisionR + comisionL;

      const totalComisiones = comisionCobro + d25 + totalOtras;

      // Aggregating global totals
      // Total Deductions & Commissions = The 8.1% initial cut + Gov Deductions + All Commissions
      totalComisionesYDeduccionesGlobal_USD += (diffSubtotalBanco + totalDedGov + totalComisiones);

      // Accumulate "Net Income" available to cover expenses
      // Net Income = AmountInBank - GovDeductions - Commissions
      totalIngresosNetos_USD += (montoBanco - totalDedGov - totalComisiones);
    });

    // Final Global Utility = Total Net Income - Total Global Expenses
    totalUtilidadProyectadaGlobal_USD = totalIngresosNetos_USD - totalGastosTodasValuaciones_USD;

    // PREPARE CHART DATA
    const budgetChartData = [
      { name: 'Ejecutado', value: totalEjecutado_USD, color: '#3b82f6', formattedValue: formatCurrency(convertFromUSD(totalEjecutado_USD), mainCurrency) },
      { name: 'Disponible', value: Math.max(0, subtotalConIVA_USD - totalEjecutado_USD), color: '#e2e8f0', formattedValue: formatCurrency(convertFromUSD(Math.max(0, subtotalConIVA_USD - totalEjecutado_USD)), mainCurrency) }
    ];

    const valuationsChartData = [
      { name: 'Gastos', value: totalGastosTodasValuaciones_USD, color: '#ef4444', formattedValue: formatCurrency(convertFromUSD(totalGastosTodasValuaciones_USD), mainCurrency) },
      { name: 'Comisiones', value: totalComisionesYDeduccionesGlobal_USD, color: '#f59e0b', formattedValue: formatCurrency(convertFromUSD(totalComisionesYDeduccionesGlobal_USD), mainCurrency) },
      { name: 'Utilidad', value: Math.max(0, totalUtilidadProyectadaGlobal_USD), color: '#10b981', formattedValue: formatCurrency(convertFromUSD(Math.max(0, totalUtilidadProyectadaGlobal_USD)), mainCurrency) }
    ];


    const totalGastosOperativosYAdministrativos_USD =
      totalComprasConFacturaGlobal_USD + totalComprasSinFacturaGlobal_USD;

    const presupuestoItems = [
      {
        label: "Subtotal Presupuesto",
        value: formatCurrency(convertFromUSD(subtotalConIVA_USD), mainCurrency),
        equivalentValue: generarConversiones(subtotalConIVA_USD),
        highlight: true,
      },
      {
        label: "Subtotal Gastos Reembolsables",
        value: formatCurrency(convertFromUSD(subtotalSinIVA_USD), mainCurrency),
        equivalentValue: generarConversiones(subtotalSinIVA_USD),
      },
      {
        label: "Total Presupuesto",
        value: formatCurrency(
          convertFromUSD(totalPresupuesto_USD),
          mainCurrency
        ),
        equivalentValue: generarConversiones(totalPresupuesto_USD),
      },
      {
        label: `Total Ejecutado`,
        value: formatCurrency(convertFromUSD(totalEjecutado_USD), mainCurrency),
        equivalentValue: generarConversiones(totalEjecutado_USD),
        color: '#3b82f6' // Blue to match chart
      },
      {
        label: "Total Gastos en Nómina",
        value: formatCurrency(
          convertFromUSD(totalPagosNominaGlobal_USD),
          mainCurrency
        ),
        equivalentValue: generarConversiones(totalPagosNominaGlobal_USD),
        color: '#ef4444'
      },
      {
        label: "Total Gastos Operativos y Administrativos",
        value: formatCurrency(
          convertFromUSD(totalGastosOperativosYAdministrativos_USD),
          mainCurrency
        ),
        equivalentValue: generarConversiones(totalGastosOperativosYAdministrativos_USD),
        color: '#ef4444'
      },
      {
        label: "Total Gastos",
        value: formatCurrency(
          convertFromUSD(totalGastosTodasValuaciones_USD),
          mainCurrency
        ),
        equivalentValue: generarConversiones(totalGastosTodasValuaciones_USD),
        color: '#ef4444'
      }
    ];

    return {
      totalPresupuesto_USD,
      totalEjecutado_USD,
      porcentajeTotalEjecutado,
      presupuestoItems,
      totalGastosTodasValuaciones_USD,
      totalUtilidadProyectadaGlobal_USD,
      totalComisionesYDeduccionesGlobal_USD,
      budgetChartData,
      subtotalConIVA_USD
    };
  }, [
    budget,
    valuations,
    mainCurrency,
    formatCurrency,
    customRates,
    safeConvertToUSD,
    compras,
    facturas,
    comprasSinFactura,
    allPagos,
  ]);

  const isLoading =
    budgetLoading ||
    valuationsLoading ||
    loadingAllPagos;

  if (isLoading) {
    return (
      <>
        <div className="resumen-main__container">
          <div className="loading-skeleton">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line" style={{ width: "40%" }}></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line" style={{ width: "60%" }}></div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <main className="resumen-main__container">
        {/* Columna de Resumen (izquierda) */}
        <aside className="resume-cards-container">
          <ResumeCard
            title="Resumen de Presupuesto"
            items={presupuestoItems}
            icon={<SackDollarIcon />}
            chartData={budgetChartData.map(d => ({ ...d, formattedValue: `${((d.value / totalPresupuesto_USD) * 100).toFixed(1)}%` }))}
            chartConfig={{ centerLabel: `${porcentajeTotalEjecutado.toFixed(0)}%` }}
            chartType="donut"
          />
        </aside>

        <section className="valuaciones-resumen-container">
          <div className="section-header">
            <h3>Detalle de Valuaciones</h3>
            <span className="valuacion-badge">{totalSlides}</span>
          </div>

          {totalSlides > 0 ? (
            <div className="valuaciones-carousel-container">
              <div className="valuaciones-carousel-viewport">
                <div className="valuaciones-carousel-grid" ref={carouselRef}>
                  {valuations.map((valuacion, index) => {
                    const cumulativeValuationUSD = valuations
                      .slice(0, index + 1) // Get current and all previous valuations
                      .reduce((sum, v) => {
                        // Calculate filtered subtotal (only items with IVA)
                        const valSum =
                          v.partidas?.reduce((acc, p) => {
                            if (p.aplicaIVA) {
                              return (
                                acc +
                                safeConvertToUSD(
                                  p.montoTotal || 0,
                                  p.moneda || v.totales?.currency || mainCurrency
                                )
                              );
                            }
                            return acc;
                          }, 0) || 0;
                        return sum + valSum;
                      }, 0);

                    return (
                      <div
                        key={valuacion.id}
                        className="valuacion-card-carousel"
                      >
                        <ValuacionResumenCard
                          valuacion={valuacion}
                          mainCurrency={mainCurrency}
                          budgetTotalUSD={subtotalConIVA_USD}
                          cumulativeProgressUSD={cumulativeValuationUSD}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {totalSlides > 1 && (
                <div className="carousel-controls">
                  <button
                    className="carousel-btn"
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    aria-label="Valuación anterior"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <div className="carousel-indicators">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                      <button
                        key={index}
                        className={`carousel-indicator ${index === currentSlide ? "active" : ""
                          }`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Ir a valuación ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    className="carousel-btn"
                    onClick={nextSlide}
                    disabled={currentSlide === totalSlides - 1}
                    aria-label="Siguiente valuación"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No hay valuaciones para mostrar</p>
              <small>
                Las valuaciones de este proyecto aparecerán aquí una vez
                creadas.
              </small>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default ResumenMain;
