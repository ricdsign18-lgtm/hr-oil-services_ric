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

  // Filter by valuation NUMBER instead of date range
  const facturasValuacion = facturas ? facturas.filter(item => item.valuacion === numero_valuacion) : [];
  const comprasSinFacturaValuacion = comprasSinFactura ? comprasSinFactura.filter(item => item.valuacion === numero_valuacion) : [];

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

  // Ordenar categorías por total (descendente)
  const categoriasOrdenadas = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1].total - a[1].total);

  const utilidadNeta = subtotalValuacionUSD - totalGastosUSD;

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
                      <div
                        key={categoria}
                        className="categoria-item clickable"
                        onClick={() => handleCategoryClick(categoria)}
                        style={{ cursor: 'pointer' }}
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
                <div className="item-row">
                  <span className="label">SENIAT (10%)</span>
                  <span className="value negative">
                    - {formatCurrency((subtotalValuacionUSD * (1 - 0.081)) * 0.10, "USD")}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculations Constants for easier reuse in render */}
            {(() => {
              const montoBanco = subtotalValuacionUSD * (1 - 0.081);
              const dedAlcaldia = montoBanco * 0.03;
              const dedISLR = montoBanco * 0.01;
              const dedSENIAT = montoBanco * 0.10;
              const totalDedGov = dedAlcaldia + dedISLR + dedSENIAT;

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

              // Utilidad final = Banco - Gov - Comisiones - Gastos
              const utilidadFinal = montoBanco - totalDedGov - totalComisiones - totalGastosUSD;

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
                      <div className="indicador-icon">�</div>
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
      {/* Modal de Detalle */}
      {selectedCategory && (
        <div className="category-detail-modal-overlay">
          <div className="category-detail-modal">
            <div className="modal-header">
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

            <div className="modal-content">
              {/* Vista de Tabla (Desktop) */}
              <div className="desktop-view">
                <div className="table-responsive">
                  <table className="detail-table">
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

            <div className="modal-footer">
              <div className="total-label">Total Categoría</div>
              <div className="total-amount">
                $ {new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2 }).format(gastosPorCategoria[selectedCategory]?.total || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .category-detail-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
          padding: 1rem;
        }

        .category-detail-modal {
          background: #ffffff;
          border-radius: 12px;
          width: 95vw;
          max-width: 1100px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0,0,0,0.25);
          animation: slideUp 0.3s ease-out;
          overflow: hidden;
          position: relative;
        }

        .modal-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fff;
          z-index: 10;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a1a;
          text-align: center;
          flex: 1;
        }

        .nav-controls {
          display: flex;
          gap: 0.5rem;
        }

        .nav-btn {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #495057;
          transition: all 0.2s;
        }

        .nav-btn:hover:not(:disabled) {
          background: #e9ecef;
          color: #000;
          transform: translateY(-1px);
        }

        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          border-color: #f0f0f0;
        }

        .close-btn {
          background: #fff0f0;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          color: #dc3545;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #ffe6e6;
          transform: rotate(90deg);
        }

        .modal-content {
          padding: 0;
          overflow-y: auto;
          flex: 1;
          background: #f8f9fa;
        }

        /* Desktop View - Table */
        .desktop-view {
          display: flex;
          flex-direction: column;
          width: 100%;
          overflow: hidden;
        }
        
        .table-responsive {
          flex: 1;
          overflow: auto;
          width: 100%;
        }
        
        .detail-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: white;
        }

        .detail-table th {
          background: #f8fafc;
          padding: 1rem;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
          white-space: nowrap;
          box-shadow: 0 1px 0 #e2e8f0;
        }

        .detail-table td {
          padding: 1rem;
          border-bottom: 1px solid #f0f0f0;
          color: #333;
          font-size: 0.9rem;
          vertical-align: top;
        }
        
        .detail-table td:first-child { /* Fecha */
            white-space: nowrap;
            color: #64748b;
        }

        .detail-table td:nth-child(3) { /* Estilo para Descripción */
            min-width: 300px; 
            max-width: 400px;
            white-space: normal;
        }
        
        .detail-table td:last-child { /* Monto */
            white-space: nowrap;
        }

        .detail-table tr:hover td {
          background-color: #f8f9fa;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-muted { color: #868e96; font-size: 0.85rem; }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; color: #1a1a1a; }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #e7f5ff;
          color: #007bff;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Mobile View - Cards */
        .mobile-view {
          display: none;
          padding: 1rem;
          gap: 1rem;
        }

        .mobile-card {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .mobile-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .mobile-date {
          font-size: 0.85rem;
          color: #868e96;
        }

        .mobile-amount {
          font-size: 1.1rem;
          font-weight: 700;
          color: #28a745;
        }

        .mobile-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        
        .mobile-row.column {
          flex-direction: column;
          gap: 0.25rem;
        }

        .mobile-row .label {
          color: #868e96;
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .badge.small {
          padding: 0.15rem 0.5rem;
          font-size: 0.7rem;
        }

        .modal-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid #e9ecef;
          background: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-label {
          font-size: 1rem;
          color: #6c757d;
        }

        .total-amount {
          font-size: 1.5rem;
          font-weight: 800;
          color: #28a745;
          letter-spacing: -0.5px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 768px) {
          .desktop-view {
            display: none !important;
          }
          .mobile-view {
            display: flex !important;
            flex-direction: column;
          }
          
          .category-detail-modal {
            max-height: 90vh;
            border-radius: 12px 12px 0 0;
            position: absolute;
            bottom: 0;
            margin-bottom: 0;
            animation: slideUp 0.3s ease-out;
            max-width: 100%;
          }
          
          .category-detail-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }
        }
      `}</style>
    </div >
  );
};

export default ValuacionResumenCard;
