import { useMemo, useState, useRef, useEffect } from "react";
import { useProjects } from "../../../contexts/ProjectContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useBudget } from "../../../contexts/BudgetContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useValuation } from "../../../contexts/ValuationContext";
//import { usePlanificacion } from "../../../contexts/PlanificacionContext";
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
  // const {
  //   totalTareas,
  //   tareasCompletadas,
  //   loading: planificacionLoading,
  // } = usePlanificacion();

  const { compras } = useOperaciones();
  const { getPagosByProject } = usePersonal();

  const [allPagos, setAllPagos] = useState([]);
  const [loadingAllPagos, setLoadingAllPagos] = useState(true);

  useEffect(() => {
    const fetchAllPagos = async () => {
      if (selectedProject?.id) {
        setLoadingAllPagos(true);
        const fetchedPagos = await getPagosByProject(selectedProject.id);
        setAllPagos(fetchedPagos);
        setLoadingAllPagos(false);
      }
    };
    fetchAllPagos();
  }, [selectedProject?.id, getPagosByProject]);

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
    totalUtilidadNetaTodasValuaciones_USD,
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
      totalPresupuesto_USD > 0
        ? (totalEjecutado_USD / totalPresupuesto_USD) * 100
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
    let totalUtilidadNetaTodasValuaciones_USD = 0;

    valuations?.forEach((valuacion) => {
      const {
        periodoInicio: periodo_inicio,
        periodoFin: periodo_fin,
        totales,
      } = valuacion;

      const subtotalValuacion = totales?.subtotal || 0;
      const currencyValuacion = totales?.currency || mainCurrency;
      const subtotalValuacionUSD = safeConvertToUSD(
        subtotalValuacion,
        currencyValuacion
      );

      const filterDataByPeriod = (data, dateField) => {
        if (!data) return [];
        const startDate = new Date(periodo_inicio);
        const endDate = new Date(periodo_fin);
        return data.filter((item) => {
          const itemDate = new Date(item[dateField]);
          return itemDate >= startDate && itemDate <= endDate;
        });
      };

      const comprasPeriodo = filterDataByPeriod(compras, "created_at");
      const pagosPeriodo = filterDataByPeriod(allPagos, "fechaPago");

      const totalComprasConFacturaUSD = comprasPeriodo
        .filter((c) => c.numero_factura)
        .reduce((acc, curr) => acc + parseFloat(curr.total_usd || 0), 0);

      const totalComprasSinFacturaUSD = comprasPeriodo
        .filter((c) => !c.numero_factura)
        .reduce((acc, curr) => acc + parseFloat(curr.total_usd || 0), 0);

      const totalPagosNominaUSD = pagosPeriodo.reduce((acc, curr) => {
        const totalPagoUSD = curr.pagos.reduce(
          (pagoAcc, pago) => pagoAcc + parseFloat(pago.subtotalUSD || 0),
          0
        );
        return acc + totalPagoUSD;
      }, 0);

      const totalGastosUSD =
        totalComprasConFacturaUSD +
        totalComprasSinFacturaUSD +
        totalPagosNominaUSD;
      totalGastosTodasValuaciones_USD += totalGastosUSD;

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
      totalUtilidadNetaTodasValuaciones_USD += utilidadNeta;
    });

    const presupuestoItems = [
      {
        label: "Total Presupuesto",
        value: formatCurrency(
          convertFromUSD(totalPresupuesto_USD),
          mainCurrency
        ),
        equivalentValue: generarConversiones(totalPresupuesto_USD),
        highlight: true,
      },
      {
        label: "Subtotal Presupuesto (con IVA)",
        value: formatCurrency(convertFromUSD(subtotalConIVA_USD), mainCurrency),
        equivalentValue: generarConversiones(subtotalConIVA_USD),
      },
      {
        label: "Subtotal Gastos Reembolsables",
        value: formatCurrency(convertFromUSD(subtotalSinIVA_USD), mainCurrency),
        equivalentValue: generarConversiones(subtotalSinIVA_USD),
      },
    ];

    const valuacionesItems = [
      {
        label: `Total Ejecutado`,
        value: formatCurrency(convertFromUSD(totalEjecutado_USD), mainCurrency),
        equivalentValue: generarConversiones(totalEjecutado_USD),
      },
      {
        label: "Total Gastos (Todas Valuaciones)",
        value: formatCurrency(
          convertFromUSD(totalGastosTodasValuaciones_USD),
          mainCurrency
        ),
        equivalentValue: generarConversiones(totalGastosTodasValuaciones_USD),
      },
      {
        label: "Utilidad Neta (Todas Valuaciones)",
        value: formatCurrency(
          convertFromUSD(totalUtilidadNetaTodasValuaciones_USD),
          mainCurrency
        ),
        equivalentValue: generarConversiones(
          totalUtilidadNetaTodasValuaciones_USD
        ),
        highlight: true,
      },
      {
        label: "Progreso Global",
        value: `${porcentajeTotalEjecutado.toFixed(2)}%`,
        equivalentValue: `${valuations?.length || 0} valuación(es)`,
        progress: porcentajeTotalEjecutado,
      },
    ];

    return {
      totalPresupuesto_USD,
      totalEjecutado_USD,
      porcentajeTotalEjecutado,
      presupuestoItems,
      valuacionesItems,
      totalGastosTodasValuaciones_USD,
      totalUtilidadNetaTodasValuaciones_USD,
    };
  }, [
    budget,
    valuations,
    mainCurrency,
    formatCurrency,
    customRates,
    safeConvertToUSD,
    compras,
    allPagos,
  ]);

  const isLoading =
    budgetLoading ||
    valuationsLoading ||
    //planificacionLoading ||
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
          />
          <ResumeCard
            title="Resumen de Valuaciones"
            items={valuacionesItems}
            icon={<DashboarddIcon />}
          />
        </aside>

        <section className="valuaciones-resumen-container">
          <div className="section-header">
            <h3>Detalle de Valuaciones</h3>
            <span className="badge">{totalSlides}</span>
          </div>

          {totalSlides > 0 ? (
            <div className="valuaciones-carousel-container">
              <div className="valuaciones-carousel-viewport">
                <div className="valuaciones-carousel-grid" ref={carouselRef}>
                  {valuations.map((valuacion, index) => {
                    const cumulativeValuationUSD = valuations
                      .slice(0, index + 1) // Get current and all previous valuations
                      .reduce((sum, v) => {
                        const subtotal = v.totales?.subtotal || 0;
                        const currency = v.totales?.currency || mainCurrency;
                        return sum + safeConvertToUSD(subtotal, currency);
                      }, 0);

                    return (
                      <div
                        key={valuacion.id}
                        className="valuacion-card-carousel"
                      >
                        <ValuacionResumenCard
                          valuacion={valuacion}
                          mainCurrency={mainCurrency}
                          budgetTotalUSD={totalPresupuesto_USD}
                          cumulativeProgressUSD={cumulativeValuationUSD} // New prop
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
                        className={`carousel-indicator ${
                          index === currentSlide ? "active" : ""
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
