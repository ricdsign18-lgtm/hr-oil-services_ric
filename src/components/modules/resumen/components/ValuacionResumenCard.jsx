import React, { useState, useEffect } from "react";
import { useCurrency } from "../../../../contexts/CurrencyContext";
import { useOperaciones } from "../../../../contexts/OperacionesContext";
import { usePersonal } from "../../../../contexts/PersonalContext";
import supabase from "../../../../api/supaBase";
import { createPortal } from "react-dom";
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

  const isItemInValuation = (item, dateField) => {
    // Check explicit link
    if (
      String(item.valuacion) === String(numero_valuacion) ||
      String(item.valuacion) === String(valuacion.id)
    ) {
      return true;
    }

    // Check date range if valuation has dates
    if (periodo_inicio && periodo_fin && item[dateField]) {
      const itemDate = new Date(item[dateField]);
      const start = new Date(periodo_inicio);
      const end = new Date(periodo_fin);

      // Reset times to compare dates broadly
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      return itemDate >= start && itemDate <= end;
    }

    return false;
  };

  const facturasValuacion = facturas
    ? facturas.filter((item) => isItemInValuation(item, "fechaFactura"))
    : [];
  const comprasSinFacturaValuacion = comprasSinFactura
    ? comprasSinFactura.filter((item) => isItemInValuation(item, "fechaCompra"))
    : [];

  const filterDataByPeriod = (data, dateField, toleranceDays = 0) => {
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

  const pagosPeriodo = filterDataByPeriod(pagos, "fechaPago", 3);
  const pagosContratistasPeriodo = filterDataByPeriod(pagosContratistas, "fechaPago", 3);

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

  // State para el modal
  const [selectedCategory, setSelectedCategory] = useState(null);

  // State variables for Payroll Modal Filters
  const [payrollFilterDate, setPayrollFilterDate] = useState("");
  const [payrollFilterEmployee, setPayrollFilterEmployee] = useState("");

  const handleCategoryClick = (categoria) => {
    setSelectedCategory(categoria);
  };

  const handleCloseModal = () => {
    setSelectedCategory(null);
  };

  const handlePrevCategory = () => {
    if (!selectedCategory) return;
    const currentIndex = categoriasOrdenadas.findIndex(
      ([cat]) => cat === selectedCategory
    );
    if (currentIndex > 0) {
      setSelectedCategory(categoriasOrdenadas[currentIndex - 1][0]);
    }
  };

  const handleNextCategory = () => {
    if (!selectedCategory) return;
    const currentIndex = categoriasOrdenadas.findIndex(
      ([cat]) => cat === selectedCategory
    );
    if (currentIndex < categoriasOrdenadas.length - 1) {
      setSelectedCategory(categoriasOrdenadas[currentIndex + 1][0]);
    }
  };

  // Filtrar items para el modal
  const getCategoryItems = () => {
    if (!selectedCategory) return [];

    const facturas = facturasValuacion
      .filter((f) => (f.categoria || "Sin Categoría") === selectedCategory)
      .map((f) => ({
        id: f.id,
        fecha: f.fechaFactura,
        proveedor: f.proveedor,
        descripcion: f.descripcion,
        subcategoria: Array.isArray(f.subcategorias)
          ? f.subcategorias.join(", ")
          : f.subcategoria,
        monto: parseFloat(f.totalPagarDolares || 0),
        tipo: "Factura",
      }));

    const compras = comprasSinFacturaValuacion
      .filter((c) => (c.categoria || "Sin Categoría") === selectedCategory)
      .map((c) => ({
        id: c.id,
        fecha: c.fechaCompra,
        proveedor: c.proveedor,
        descripcion: c.descripcion,
        subcategoria: Array.isArray(c.subcategorias)
          ? c.subcategorias.join(", ")
          : c.subcategoria,
        monto: parseFloat(c.totalDolares || 0),
        tipo: "Sin Factura",
      }));

    return [...facturas, ...compras].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
  };

  // Helper to flatten payroll items for the modal
  const getAllPayrollItems = () => {
    const items = [];

    // Regular Payroll
    if (pagosPeriodo) {
      pagosPeriodo.forEach(batch => {
        batch.pagos.forEach(pago => {
          items.push({
            id: pago.id,
            fecha: batch.fechaPago,
            createdAt: batch.timestamp,
            empleado: `${pago.empleado.nombre} ${pago.empleado.apellido}`,
            cedula: pago.empleado.cedula,
            cargo: pago.empleado.cargo,
            monto: parseFloat(pago.montoTotalUSD || 0),
            tipo: "Nómina"
          });
        });
      });
    }

    // Contractor Payments
    if (pagosContratistasPeriodo) {
      pagosContratistasPeriodo.forEach(batch => {
        if (batch.pagos && Array.isArray(batch.pagos)) {
          batch.pagos.forEach(pago => {
            const nombre = pago.nombre_contratista || pago.nombre || "Contratista";
            items.push({
              id: pago.id || `contr-${batch.id}-${Math.random()}`,
              fecha: batch.fechaPago,
              createdAt: batch.timestamp,
              empleado: nombre,
              cedula: pago.cedula || "N/A",
              cargo: pago.cargo || "Servicios Profesionales",
              monto: parseFloat(pago.monto_total_usd || 0),
              tipo: "Contratista"
            });
          });
        }
      });
    }

    return items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  // Helper functions for Payroll Filtering
  const getUniquePayrollDates = () => {
    const items = getAllPayrollItems();
    const dates = [...new Set(items.map(item => item.fecha))];
    return dates.sort((a, b) => new Date(b) - new Date(a));
  };

  const getUniquePayrollEmployees = () => {
    const items = getAllPayrollItems();
    const employees = [...new Set(items.map(item => item.empleado))];
    return employees.sort();
  };

  const getFilteredPayrollItems = () => {
    let items = getAllPayrollItems();

    if (payrollFilterDate) {
      items = items.filter(item => item.fecha === payrollFilterDate);
    }

    if (payrollFilterEmployee) {
      items = items.filter(item => item.empleado === payrollFilterEmployee);
    }

    return items;
  };

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

              // Utilidad final = Banco - Gov - Comisiones - Gastos - SeniatAnual
              const utilidadFinal =
                montoBanco -
                totalDedGov -
                totalComisiones -
                totalGastosUSD -
                seniatAmount;

              return (
                <>
                  <div className="valuacion-totales-grid">
                    {/* Deducciones Gubernamentales Card */}
                    <div className="valuacion-total-card red">
                      <div className="valuacion-card-icon">
                        <BankIcon width={32} height={32} fill="#ef4444" />
                      </div>
                      <div className="valuacion-card-content">
                        <span className="valuacion-card-label">
                          Deducciones Gov.
                        </span>
                        <span className="valuacion-card-value-main text-red-700">
                          - {formatCurrency(totalDedGov, "USD")}
                        </span>
                        <span className="valuacion-card-value-secondary">
                          Alcaldía, ISLR, SENIAT(10%)
                        </span>
                      </div>
                    </div>

                    {/* Comisiones Card */}
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
                      </div>
                    </div>

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
                  </div>

                  {/* SENIAT Anual Card (if needed separately, or included in deductions? usually separate as per prev design) */}
                  <div
                    className="valuacion-totales-grid seniat-grid"
                    style={{ marginBottom: "1.5rem", marginTop: "0.5rem" }}
                  >
                    <div className="valuacion-total-card gray seniat-card-dashed">
                      <div className="valuacion-card-content seniat-content-row">
                        <div className="seniat-icon-wrapper">
                          <BankIcon width={28} height={28} fill="#4b5563" />
                        </div>
                        <div>
                          <span className="valuacion-card-label seniat-label-block">
                            SENIAT (Cuota Anual)
                          </span>
                          <span className="valuacion-card-value-main text-lg text-gray-600">
                            - {formatCurrency(seniatAmount, "USD")}
                          </span>
                        </div>
                      </div>
                    </div>
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

      {/* Modal de Detalle */}
      {/* Modal de Detalle */}
      {selectedCategory &&
        createPortal(
          <div
            className="category-detail-modal-overlay"
            onClick={handleCloseModal}
          >
            <div
              className="category-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="valuacion-modal-header">
                <div className="nav-controls">
                  <button
                    onClick={handlePrevCategory}
                    disabled={
                      categoriasOrdenadas.findIndex(
                        ([cat]) => cat === selectedCategory
                      ) === 0
                    }
                    className="nav-btn"
                    title="Categoría anterior"
                  >
                    <span className="arrow">←</span>
                  </button>
                  <button
                    onClick={handleNextCategory}
                    disabled={
                      categoriasOrdenadas.findIndex(
                        ([cat]) => cat === selectedCategory
                      ) ===
                      categoriasOrdenadas.length - 1
                    }
                    className="nav-btn"
                    title="Categoría siguiente"
                  >
                    <span className="arrow">→</span>
                  </button>
                </div>
                <h3 className="modal-title">{selectedCategory}</h3>
                <button
                  onClick={handleCloseModal}
                  className="close-btn"
                  title="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="valuacion-modal-content">
                {/* Vista de Tabla (Desktop) */}
                <div className="valuacion-desktop-view">
                  <div className="valuacion-table-wrapper">
                    <table className="valuacion-detail-table">
                      <thead>
                        <tr>
                          <th className="th-date">Fecha</th>
                          <th className="th-provider">Proveedor</th>
                          <th className="th-desc">Descripción</th>
                          <th className="th-subcat">Subcategoría</th>
                          <th className="th-amount">Monto ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCategoryItems().map((item, idx) => (
                          <tr key={idx}>
                            <td className="td-date">
                              {item.fecha
                                ? new Date(item.fecha).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="td-provider font-medium">
                              {item.proveedor}
                            </td>
                            <td className="td-desc text-muted">
                              {item.descripcion}
                            </td>
                            <td className="td-subcat">
                              <span className="valuacion-badge">
                                {item.subcategoria || "General"}
                              </span>
                            </td>
                            <td className="td-amount text-right font-bold">
                              {new Intl.NumberFormat("de-DE", {
                                minimumFractionDigits: 2,
                              }).format(item.monto)}
                            </td>
                          </tr>
                        ))}
                        {getCategoryItems().length === 0 && (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center py-4 text-muted"
                            >
                              No hay items registrados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vista de Tarjetas (Mobile) */}
                <div className="mobile-view">
                  {getCategoryItems().map((item, idx) => (
                    <div key={idx} className="mobile-card">
                      <div className="mobile-card-header">
                        <span className="mobile-date">
                          {item.fecha
                            ? new Date(item.fecha).toLocaleDateString()
                            : "N/A"}
                        </span>
                        <span className="mobile-amount">
                          $
                          {new Intl.NumberFormat("de-DE", {
                            minimumFractionDigits: 2,
                          }).format(item.monto)}
                        </span>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-row">
                          <span className="label">Proveedor:</span>
                          <span className="value font-medium">
                            {item.proveedor}
                          </span>
                        </div>
                        <div className="mobile-row">
                          <span className="label">Subcategoría:</span>
                          <span className="value">
                            <span className="valuacion-badge small">
                              {item.subcategoria || "General"}
                            </span>
                          </span>
                        </div>
                        {item.descripcion && (
                          <div className="mobile-row column">
                            <span className="label">Descripción:</span>
                            <span className="value text-muted">
                              {item.descripcion}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {getCategoryItems().length === 0 && (
                    <div className="text-center py-4 text-muted">
                      No hay items registrados
                    </div>
                  )}
                </div>
              </div>

              <div className="valuacion-modal-footer">
                <div className="total-label">Total Categoría</div>
                <div className="total-amount">
                  ${" "}
                  {new Intl.NumberFormat("de-DE", {
                    minimumFractionDigits: 2,
                  }).format(gastosPorCategoria[selectedCategory]?.total || 0)}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Todas las Categorías */}
      {showAllCategoriesModal &&
        createPortal(
          <div
            className="category-detail-modal-overlay"
            onClick={() => setShowAllCategoriesModal(false)}
          >
            <div
              className="category-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="valuacion-modal-header">
                <h3 className="modal-title">Gastos Administrativos y Operativos</h3>
                <button
                  onClick={() => setShowAllCategoriesModal(false)}
                  className="close-btn"
                  title="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="valuacion-modal-content">
                <div className="categorias-grid-modal">
                  {categoriasOrdenadas.length > 0 ? (
                    <div className="categorias-grid">
                      {categoriasOrdenadas.map(([categoria, montos]) => {
                        const porcentaje =
                          subtotalValuacionUSD > 0
                            ? (montos.total / subtotalValuacionUSD) * 100
                            : 0;

                        return (
                          <div
                            key={categoria}
                            className="categoria-item clickable"
                            onClick={() => {
                              handleCategoryClick(categoria);
                              // Optional: keep main modal open or close it? 
                              // Current logic opens a SECOND modal on top, which is fine for drilling down
                            }}
                            style={{ cursor: "pointer" }}
                            title="Ver detalle"
                          >
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
                    <div className="empty-message-modal">
                      <span>Sin gastos por categoría registrados</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="valuacion-modal-footer">
                <div className="total-label">Total Gastos</div>
                <div className="total-amount">
                  {formatCurrency(totalGastosComprasUSD, "USD")}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Nómina */}
      {showPayrollModal &&
        createPortal(
          <div
            className="category-detail-modal-overlay"
            onClick={() => setShowPayrollModal(false)}
          >
            <div
              className="category-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="valuacion-modal-header">
                <h3 className="modal-title">Detalle de Nómina</h3>
                <button
                  onClick={() => setShowPayrollModal(false)}
                  className="close-btn"
                  title="Cerrar"
                >
                  ×
                </button>
              </div>

              {/* Filters Bar */}
              <div className="valuacion-modal-filters" style={{ padding: '0 24px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <select
                  className="form-select"
                  value={payrollFilterDate}
                  onChange={(e) => setPayrollFilterDate(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                >
                  <option value="">Todas las Fechas</option>
                  {getUniquePayrollDates().map(date => (
                    <option key={date} value={date}>{new Date(date).toLocaleDateString()}</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  value={payrollFilterEmployee}
                  onChange={(e) => setPayrollFilterEmployee(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.9rem', minWidth: '200px' }}
                >
                  <option value="">Todos los Empleados</option>
                  {getUniquePayrollEmployees().map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              <div className="valuacion-modal-content">
                {/* Deskop View */}
                <div className="valuacion-desktop-view">
                  <div className="valuacion-table-wrapper">
                    <table className="valuacion-detail-table">
                      <thead>
                        <tr>
                          <th className="th-date">Fecha Pago</th>
                          <th className="th-provider">Empleado</th>
                          <th className="th-desc">Cargo</th>
                          <th className="th-amount">Monto ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredPayrollItems().map((item, idx) => (
                          <tr key={idx}>
                            <td className="td-date">
                              {new Date(item.fecha).toLocaleDateString()}
                              {item.createdAt && (
                                <div className="text-xs text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                                  Creado: {new Date(item.createdAt).toLocaleString()}
                                </div>
                              )}
                            </td>
                            <td className="td-provider font-medium">
                              {item.empleado}
                              <div className="text-xs text-muted">{item.cedula}</div>
                            </td>
                            <td className="td-desc text-muted">
                              {item.cargo}
                            </td>
                            <td className="td-amount text-right font-bold">
                              {formatCurrency(item.monto, "USD")}
                            </td>
                          </tr>
                        ))}
                        {getFilteredPayrollItems().length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">
                              No hay pagos registrados con estos filtros
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="mobile-view">
                  {getFilteredPayrollItems().map((item, idx) => (
                    <div key={idx} className="mobile-card">
                      <div className="mobile-card-header">
                        <span className="mobile-date">
                          {new Date(item.fecha).toLocaleDateString()}
                          {item.createdAt && (
                            <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>
                              Creado: {new Date(item.createdAt).toLocaleString()}
                            </div>
                          )}
                        </span>
                        <span className="mobile-amount">
                          {formatCurrency(item.monto, "USD")}
                        </span>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-row">
                          <span className="label">Empleado:</span>
                          <span className="value font-medium">{item.empleado}</span>
                        </div>
                        <div className="mobile-row">
                          <span className="label">Cargo:</span>
                          <span className="value text-muted">{item.cargo}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getFilteredPayrollItems().length === 0 && (
                    <div className="text-center py-4 text-muted">
                      No hay pagos registrados
                    </div>
                  )}
                </div>
              </div>

              <div className="valuacion-modal-footer" style={{ flexDirection: 'column', gap: '8px' }}>
                {(payrollFilterDate || payrollFilterEmployee) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: '#64748b', fontSize: '0.95rem' }}>
                    <div className="total-label">Total Filtrado</div>
                    <div className="total-amount">
                      {formatCurrency(
                        getFilteredPayrollItems().reduce((acc, item) => acc + item.monto, 0),
                        "USD"
                      )}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div className="total-label">Total Nómina y Contrataciones</div>
                  <div className="total-amount">
                    {formatCurrency(totalLaboralUSD, "USD")}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ValuacionResumenCard;
