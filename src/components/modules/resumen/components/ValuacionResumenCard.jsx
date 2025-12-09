import React, { useState, useEffect } from "react";
import { useCurrency } from "../../../../contexts/CurrencyContext";
import { useOperaciones } from "../../../../contexts/OperacionesContext";
import { usePersonal } from "../../../../contexts/PersonalContext";
import supabase from "../../../../api/supaBase";
import { createPortal } from "react-dom";
import { CartShoppingIcon, MultiUsersIcon, SackDollarIcon, BankIcon, InventoryIcon, CashIcon } from "../../../../assets/icons/Icons";
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
  const [seniatAmount, setSeniatAmount] = useState(0);

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

  // Filter by valuation NUMBER instead of date range
  const facturasValuacion = facturas ? facturas.filter(item => String(item.valuacion) === String(numero_valuacion)) : [];
  const comprasSinFacturaValuacion = comprasSinFactura ? comprasSinFactura.filter(item => String(item.valuacion) === String(numero_valuacion)) : [];

  // Pagos remain filtered by period as they are payroll related
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

  const pagosPeriodo = filterDataByPeriod(pagos, "fechaPago");

  // Agrupar gastos por categoría
  const gastosPorCategoria = {};

  // Procesar facturas (compras con factura)
  facturasValuacion.forEach((factura) => {
    const categoria = factura.categoria || 'Sin Categoría';
    const monto = parseFloat(factura.pagadoDolares || 0);

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
  comprasSinFacturaValuacion.forEach((compra) => {
    const categoria = compra.categoria || 'Sin Categoría';
    const monto = parseFloat(compra.totalDolares || 0);

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

  // Calcular totales
  const totalComprasConFacturaUSD = facturasValuacion
    .reduce((acc, curr) => acc + parseFloat(curr.pagadoDolares || 0), 0);

  const totalComprasSinFacturaUSD = comprasSinFacturaValuacion
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

  const categoriasOrdenadas = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1].total - a[1].total);

  const utilidadNeta = subtotalValuacionUSD - totalGastosUSD - seniatAmount;

  // State para el modal
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (categoria) => {
    setSelectedCategory(categoria);
  };

  const handleCloseModal = () => {
    setSelectedCategory(null);
  };

  const handlePrevCategory = () => {
    if (!selectedCategory) return;
    const currentIndex = categoriasOrdenadas.findIndex(([cat]) => cat === selectedCategory);
    if (currentIndex > 0) {
      setSelectedCategory(categoriasOrdenadas[currentIndex - 1][0]);
    }
  };

  const handleNextCategory = () => {
    if (!selectedCategory) return;
    const currentIndex = categoriasOrdenadas.findIndex(([cat]) => cat === selectedCategory);
    if (currentIndex < categoriasOrdenadas.length - 1) {
      setSelectedCategory(categoriasOrdenadas[currentIndex + 1][0]);
    }
  };

  // Filtrar items para el modal
  const getCategoryItems = () => {
    if (!selectedCategory) return [];

    const facturas = facturasValuacion
      .filter(f => (f.categoria || 'Sin Categoría') === selectedCategory)
      .map(f => ({
        id: f.id,
        fecha: f.fechaFactura,
        proveedor: f.proveedor,
        descripcion: f.descripcion,
        subcategoria: Array.isArray(f.subcategorias) ? f.subcategorias.join(', ') : f.subcategoria,
        monto: parseFloat(f.pagadoDolares || 0),
        tipo: 'Factura'
      }));

    const compras = comprasSinFacturaValuacion
      .filter(c => (c.categoria || 'Sin Categoría') === selectedCategory)
      .map(c => ({
        id: c.id,
        fecha: c.fechaCompra,
        proveedor: c.proveedor,
        descripcion: c.descripcion,
        subcategoria: Array.isArray(c.subcategorias) ? c.subcategorias.join(', ') : c.subcategoria,
        monto: parseFloat(c.totalDolares || 0),
        tipo: 'Sin Factura'
      }));

    return [...facturas, ...compras].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  return (
    <div className="valuacion-resumen-card">
      <div className="card-header">
        <h4>
          <div className="header-icon-wrapper">
             {/* Using InventoryIcon as a placeholder for the chart icon in the image */}
             <InventoryIcon width={24} height={24} fill="currentColor" />
          </div>
          {numero_valuacion}
        </h4>
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
          <div className="valuacion-totales-grid">
            {/* Subtotal Original Card */}
            <div className="valuacion-total-card blue">
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">Subtotal Original ({currencyValuacion})</span>
                <span className="valuacion-card-value-main">
                  {formatCurrency(subtotalValuacion, currencyValuacion)}
                </span>
                {currencyValuacion !== 'USD' && (
                  <span className="valuacion-card-value-secondary">
                    ≈ {formatCurrency(subtotalValuacionUSD, "USD")}
                  </span>
                )}
              </div>
            </div>

            {/* Subtotal USD Card */}
            <div className="valuacion-total-card indigo">
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">Subtotal Equivalente (USD)</span>
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
                      style={{ width: `${Math.min(porcentajeEjecutado, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gastos por Categoría */}
        <div className="financial-section-full">
          <h5
            onClick={() => setShowCategories(!showCategories)}
            className="accordion-header"
          >
            <span className="accordion-arrow">
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
                      <div
                        key={categoria}
                        className="categoria-item clickable cursor-pointer"
                        onClick={() => handleCategoryClick(categoria)}
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
                <div className="empty-message">
                  <span>Sin gastos por categoría registrados</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Resumen de Gastos */}
        {/* Resumen de Gastos */}
        <div className="financial-section-full compact-summary">
          <h5>Resumen de Gastos</h5>
          <div className="valuacion-totales-grid">
            <div className="valuacion-total-card orange">
              <div className="valuacion-card-icon">
                <CartShoppingIcon width={32} height={32} fill="#ea580c" />
              </div>
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">Total Compras</span>
                <span className="valuacion-card-value-main text-xl text-orange-700">
                  {formatCurrency(totalGastosComprasUSD, "USD")}
                </span>
              </div>
            </div>

            <div className="valuacion-total-card orange">
              <div className="valuacion-card-icon">
                <MultiUsersIcon width={32} height={32} fill="#ea580c" />
              </div>
              <div className="valuacion-card-content">
                <span className="valuacion-card-label">Nómina</span>
                <span className="valuacion-card-value-main text-xl text-orange-700">
                  {formatCurrency(totalPagosNominaUSD, "USD")}
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
                  <span className="valuacion-card-label seniat-label-block">Monto Anual SENIAT</span>
                  <span className="valuacion-card-value-main text-lg text-gray-600">
                    - {formatCurrency(seniatAmount, "USD")}
                  </span>
                  <span className="valuacion-card-value-secondary text-xs">
                    (60k / {Math.round(60000 / seniatAmount) || 0} val. en {new Date(valuacion.periodoInicio).getFullYear()})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="financial-section-full resultados">
          <h5>Proyección de Ganancias</h5>
          <div className="resultados-grid-detailed">

            {/* 1. Monto a Recibir en Banco */}
            <div className="resultado-row main">
              <span className="label">Monto a Recibir en Banco (Subtotal - 8.1%)</span>
              <span className="value">{formatCurrency(subtotalValuacionUSD * (1 - 0.081), "USD")}</span>
            </div>

            {/* 2. Deducciones Gubernamentales */}
            <div className="resultado-group">
              <div className="group-header">Deducciones Gubernamentales</div>
              <div className="group-items">
                <div className="item-row">
                  <span className="label">Alcaldía (3%)</span>
                  <span className="value negative">
                    - {formatCurrency((subtotalValuacionUSD * (1 - 0.081)) * 0.03, "USD")}
                  </span>
                </div>
                <div className="item-row">
                  <span className="label">Anticipo ISLR (1%)</span>
                  <span className="value negative">
                    - {formatCurrency((subtotalValuacionUSD * (1 - 0.081)) * 0.01, "USD")}
                  </span>
                </div>
                {/* <div className="item-row">
                  <span className="label">SENIAT (10%)</span>
                  <span className="value negative">
                    - {formatCurrency((subtotalValuacionUSD * (1 - 0.081)) * 0.10, "USD")}
                  </span>
                </div> */}
                <div className="item-row">
                  <span className="label">SENIAT (Cuota Anual)</span>
                  <span className="value negative">
                    - {formatCurrency(seniatAmount, "USD")}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculations Constants for easier reuse in render */}
            {(() => {
              const montoBanco = subtotalValuacionUSD * (1 - 0.081);
              const dedAlcaldia = montoBanco * 0.03;
              const dedISLR = montoBanco * 0.01;
              // const dedSENIAT = montoBanco * 0.10;
              const totalDedGov = dedAlcaldia + dedISLR; // + dedSENIAT;

              const baseComisiones = montoBanco - totalDedGov;

              const comisionCobro = baseComisiones * 0.15;
              const d25 = baseComisiones * 0.25;

              const baseOtras = baseComisiones - d25; // As per check: (Monto - Gov - D25) * %
              // Re-reading user request carefully:
              // "Otras Comisiones: P: (Monto a recibir en banco – Deducciones Gubernamentales - D25%)*8%"
              // This implies the base for P, R, L is indeed (Neto - D25)

              const comisionP = baseOtras * 0.08;
              const comisionR = baseOtras * 0.02;
              const comisionL = baseOtras * 0.02;

              const totalComisiones = comisionCobro + d25 + comisionP + comisionR + comisionL;

              // Utilidad final = Banco - Gov - Comisiones - Gastos - SeniatAnual
              const utilidadFinal = montoBanco - totalDedGov - totalComisiones - totalGastosUSD - seniatAmount;

              return (
                <>
                  {/* 3. Comisiones */}
                  <div className="resultado-group">
                    <div className="group-header">Comisiones y Deducciones</div>
                    <div className="group-items">
                      <div className="item-row">
                        <span className="label">Comisión por Cobro (15%)</span>
                        <span className="value negative">
                          - {formatCurrency(comisionCobro, "USD")}
                        </span>
                      </div>
                      <div className="item-row">
                        <span className="label">D25%</span>
                        <span className="value negative">
                          - {formatCurrency(d25, "USD")}
                        </span>
                      </div>
                      <div className="item-row">
                        <span className="label">Otras (P:8%, R:2%, L:2%)</span>
                        <span className="value negative">
                          - {formatCurrency(comisionP + comisionR + comisionL, "USD")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Gastos Realizados */}
                  <div className="resultado-group">
                    <div className="group-header">Gastos Operativos</div>
                    <div className="group-items">
                      <div className="item-row">
                        <span className="label">Total Gastos Registrados</span>
                        <span className="value negative">
                          - {formatCurrency(totalGastosUSD, "USD")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Utilidad Final */}
                  <div className="resultado-principal final">
                    <div className="resultado-label">UTILIDAD PROYECTADA</div>
                    <div className={`resultado-value ${utilidadFinal >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(utilidadFinal, "USD")}
                    </div>
                  </div>

                  <div className="indicadores-grid">
                    <div className="indicador ganancia">
                      <div className="indicador-icon">
                         <CashIcon width={28} height={28} fill="#166534" />
                      </div>
                      <div className="indicador-content">
                        <span className="indicador-label">% Margen</span>
                        <span className="indicador-value">
                          {montoBanco > 0
                            ? ((utilidadFinal / montoBanco) * 100).toFixed(2)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div >

      {/* Modal de Detalle */}
      {selectedCategory && createPortal(
        <div className="category-detail-modal-overlay" onClick={handleCloseModal}>
          <div className="category-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="valuacion-modal-header">
              <div className="nav-controls">
                <button
                  onClick={handlePrevCategory}
                  disabled={categoriasOrdenadas.findIndex(([cat]) => cat === selectedCategory) === 0}
                  className="nav-btn"
                  title="Categoría anterior"
                >
                  <span className="arrow">←</span>
                </button>
                <button
                  onClick={handleNextCategory}
                  disabled={categoriasOrdenadas.findIndex(([cat]) => cat === selectedCategory) === categoriasOrdenadas.length - 1}
                  className="nav-btn"
                  title="Categoría siguiente"
                >
                  <span className="arrow">→</span>
                </button>
              </div>
              <h3 className="modal-title">{selectedCategory}</h3>
              <button onClick={handleCloseModal} className="close-btn" title="Cerrar">×</button>
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
                          <td className="td-date">{item.fecha ? new Date(item.fecha).toLocaleDateString() : 'N/A'}</td>
                          <td className="td-provider font-medium">{item.proveedor}</td>
                          <td className="td-desc text-muted">{item.descripcion}</td>
                          <td className="td-subcat">
                            <span className="badge">{item.subcategoria || 'General'}</span>
                          </td>
                          <td className="td-amount text-right font-bold">
                            {new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2 }).format(item.monto)}
                          </td>
                        </tr>
                      ))}
                      {getCategoryItems().length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">No hay items registrados</td>
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
                      <span className="mobile-date">{item.fecha ? new Date(item.fecha).toLocaleDateString() : 'N/A'}</span>
                      <span className="mobile-amount">${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2 }).format(item.monto)}</span>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-row">
                        <span className="label">Proveedor:</span>
                        <span className="value font-medium">{item.proveedor}</span>
                      </div>
                      <div className="mobile-row">
                        <span className="label">Subcategoría:</span>
                        <span className="value"><span className="badge small">{item.subcategoria || 'General'}</span></span>
                      </div>
                      {item.descripcion && (
                        <div className="mobile-row column">
                          <span className="label">Descripción:</span>
                          <span className="value text-muted">{item.descripcion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {getCategoryItems().length === 0 && (
                  <div className="text-center py-4 text-muted">No hay items registrados</div>
                )}
              </div>
            </div>

            <div className="valuacion-modal-footer">
              <div className="total-label">Total Categoría</div>
              <div className="total-amount">
                $ {new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2 }).format(gastosPorCategoria[selectedCategory]?.total || 0)}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}


    </div >
  );
};

export default ValuacionResumenCard;
