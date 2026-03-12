import React, { useState } from "react";
import { createPortal } from "react-dom";

const ValuacionCategoriasModal = ({
    showModal,
    onClose,
    categoriasOrdenadas,
    gastosPorCategoria,
    facturasValuacion,
    comprasSinFacturaValuacion,
    subtotalValuacionUSD,
    totalGastosComprasUSD,
    formatCurrency,
}) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [filterDay, setFilterDay] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [filterGlobalCategory, setFilterGlobalCategory] = useState("");

    // Get unique years from all data for the year filter dropdown
    const availableYears = React.useMemo(() => {
        const years = new Set();
        const addYear = (dateStr) => {
            if (dateStr) {
                const y = new Date(dateStr).getFullYear();
                if (!isNaN(y)) years.add(y);
            }
        };
        facturasValuacion.forEach(f => addYear(f.fechaFactura));
        comprasSinFacturaValuacion.forEach(c => addYear(c.fechaCompra));

        return Array.from(years).sort((a, b) => b - a);
    }, [facturasValuacion, comprasSinFacturaValuacion]);

    const handleCategoryClick = (categoria) => {
        setSelectedCategory(categoria);
    };

    const handleCloseDetailModal = () => {
        setSelectedCategory(null);
        setFilterDay("");
        setFilterMonth("");
        setFilterYear("");
        setFilterStartDate("");
        setFilterEndDate("");
        setFilterGlobalCategory("");
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
        const currentIndex = dynamicCategoriasOrdenadas.findIndex(
            ([cat]) => cat === selectedCategory
        );
        if (currentIndex < dynamicCategoriasOrdenadas.length - 1) {
            setSelectedCategory(dynamicCategoriasOrdenadas[currentIndex + 1][0]);
        }
    };

    // Helper to filter array of items by selected filters
    const filterItemsByDate = (items, dateGetter) => {
        let filtered = items;

        // Exact Date filtering (Day/Month/Year dropdowns)
        if (filterDay || filterMonth || filterYear) {
            filtered = filtered.filter(item => {
                const dateStr = dateGetter(item);
                if (!dateStr) return false;
                const d = new Date(dateStr);

                let matches = true;
                if (filterDay) {
                    // +1 because getUTCDate/getDate returns local, to be safe just check parts 
                    // or just use typical string matching. But let's use the local date representation.
                    // Better to parse from string if it's YYYY-MM-DD
                    const dayMatch = parseInt(dateStr.split('-')[2]) === parseInt(filterDay) || d.getDate() === parseInt(filterDay);
                    if (!dayMatch) matches = false;
                }
                if (filterMonth && matches) {
                    if (d.getMonth() + 1 !== parseInt(filterMonth)) matches = false;
                }
                if (filterYear && matches) {
                    if (d.getFullYear() !== parseInt(filterYear)) matches = false;
                }
                return matches;
            });
        }

        // Period filtering (Start/End Date range)
        if (filterStartDate) {
            const start = new Date(filterStartDate + "T00:00:00");
            filtered = filtered.filter(item => {
                const dateStr = dateGetter(item);
                if (!dateStr) return false;
                return new Date(dateStr) >= start;
            });
        }

        if (filterEndDate) {
            const end = new Date(filterEndDate + "T23:59:59");
            filtered = filtered.filter(item => {
                const dateStr = dateGetter(item);
                if (!dateStr) return false;
                return new Date(dateStr) <= end;
            });
        }

        return filtered;
    };

    // Dynamically calculate categories and totals based on filters
    const { dynamicCategoriasOrdenadas, dynamicGlobalTotal } = React.useMemo(() => {
        // If no filters are active, use the props directly
        if (!filterDay && !filterMonth && !filterYear && !filterStartDate && !filterEndDate && !filterGlobalCategory) {
            return {
                dynamicCategoriasOrdenadas: categoriasOrdenadas,
                dynamicGlobalTotal: totalGastosComprasUSD
            };
        }

        // Apply filters to facturas and compras
        let filteredFacturas = filterItemsByDate(facturasValuacion, f => f.fechaFactura);
        let filteredCompras = filterItemsByDate(comprasSinFacturaValuacion, c => c.fechaCompra);

        if (filterGlobalCategory) {
            filteredFacturas = filteredFacturas.filter(f => (f.categoria || "Sin Categoría") === filterGlobalCategory);
            filteredCompras = filteredCompras.filter(c => (c.categoria || "Sin Categoría") === filterGlobalCategory);
        }

        // Recalculate totals per category
        const tempGastosPorCategoria = {};

        filteredFacturas.forEach(f => {
            const cat = f.categoria || "Sin Categoría";
            if (!tempGastosPorCategoria[cat]) tempGastosPorCategoria[cat] = { total: 0 };
            tempGastosPorCategoria[cat].total += parseFloat(f.totalPagarDolares || 0);
        });

        filteredCompras.forEach(c => {
            const cat = c.categoria || "Sin Categoría";
            if (!tempGastosPorCategoria[cat]) tempGastosPorCategoria[cat] = { total: 0 };
            tempGastosPorCategoria[cat].total += parseFloat(c.totalDolares || 0);
        });

        // Create ordered array and global total
        const newCategoriasOrdenadas = Object.entries(tempGastosPorCategoria)
            .sort((a, b) => b[1].total - a[1].total)
        // .filter(([_, montos]) => montos.total > 0); // Optional: hide empty categories

        const newGlobalTotal = newCategoriasOrdenadas.reduce((acc, [_, montos]) => acc + montos.total, 0);

        return {
            dynamicCategoriasOrdenadas: newCategoriasOrdenadas,
            dynamicGlobalTotal: newGlobalTotal
        };

    }, [filterDay, filterMonth, filterYear, filterStartDate, filterEndDate, filterGlobalCategory, facturasValuacion, comprasSinFacturaValuacion, categoriasOrdenadas, totalGastosComprasUSD]);


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

        return filterItemsByDate([...facturas, ...compras], item => item.fecha).sort(
            (a, b) => new Date(b.fecha) - new Date(a.fecha)
        );
    };

    const filteredItems = getCategoryItems();
    const dynamicCategoryTotal = filteredItems.reduce((acc, curr) => acc + curr.monto, 0);

    if (!showModal) return null;

    return createPortal(
        <>
            {/* Main Categories Modal */}
            <div
                className="category-detail-modal-overlay"
                onClick={onClose}
                style={{ zIndex: 1000 }}
            >
                <div
                    className="category-detail-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="valuacion-modal-header">
                        <h3 className="modal-title">Gastos Administrativos y Operativos</h3>
                        <button
                            onClick={onClose}
                            className="close-btn"
                            title="Cerrar"
                        >
                            ×
                        </button>
                    </div>

                    <div className="valuacion-modal-content" style={{ marginTop: '0' }}>
                        {/* Filters Section (Global) */}
                        <div className="valuacion-filters-section" style={{ padding: '0 20px 15px', borderBottom: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Día:</label>
                                <select
                                    value={filterDay}
                                    onChange={(e) => setFilterDay(e.target.value)}
                                    className="filter-select"
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                >
                                    <option value="">Todos</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Mes:</label>
                                <select
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                    className="filter-select"
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                >
                                    <option value="">Todos</option>
                                    <option value="1">Enero</option>
                                    <option value="2">Febrero</option>
                                    <option value="3">Marzo</option>
                                    <option value="4">Abril</option>
                                    <option value="5">Mayo</option>
                                    <option value="6">Junio</option>
                                    <option value="7">Julio</option>
                                    <option value="8">Agosto</option>
                                    <option value="9">Septiembre</option>
                                    <option value="10">Octubre</option>
                                    <option value="11">Noviembre</option>
                                    <option value="12">Diciembre</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Año:</label>
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="filter-select"
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                >
                                    <option value="">Todos</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Separator */}
                            <div style={{ width: '1px', height: '35px', backgroundColor: '#e2e8f0', margin: '0 5px' }}></div>

                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Desde:</label>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Hasta:</label>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                />
                            </div>

                            {/* Separator */}
                            <div style={{ width: '1px', height: '35px', backgroundColor: '#e2e8f0', margin: '0 5px' }}></div>

                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Categoría:</label>
                                <select
                                    value={filterGlobalCategory}
                                    onChange={(e) => setFilterGlobalCategory(e.target.value)}
                                    className="filter-select"
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', maxWidth: '200px' }}
                                >
                                    <option value="">Todas las categorías</option>
                                    {categoriasOrdenadas.map(([cat]) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {(filterDay || filterMonth || filterYear || filterStartDate || filterEndDate || filterGlobalCategory) && (
                                <button
                                    onClick={() => {
                                        setFilterDay("");
                                        setFilterMonth("");
                                        setFilterYear("");
                                        setFilterStartDate("");
                                        setFilterEndDate("");
                                        setFilterGlobalCategory("");
                                    }}
                                    style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        <div className="categorias-grid-modal" style={{ paddingTop: '15px' }}>
                            {dynamicCategoriasOrdenadas.length > 0 ? (
                                <div className="categorias-grid">
                                    {dynamicCategoriasOrdenadas.map(([categoria, montos]) => {
                                        // Optional: Hide categories with 0 total when filtering
                                        if ((filterDay || filterMonth || filterYear || filterStartDate || filterEndDate || filterGlobalCategory) && montos.total === 0) return null;

                                        const porcentaje =
                                            dynamicGlobalTotal > 0
                                                ? (montos.total / dynamicGlobalTotal) * 100
                                                : 0;

                                        return (
                                            <div
                                                key={categoria}
                                                className="categoria-item clickable"
                                                onClick={() => handleCategoryClick(categoria)}
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
                        <div className="total-label">Total Gasto Filtrado</div>
                        <div className="total-amount">
                            {formatCurrency(dynamicGlobalTotal, "USD")}
                        </div>
                    </div>
                </div>
            </div>

            {/* Drill-down Detail Modal */}
            {selectedCategory && (
                <div
                    className="category-detail-modal-overlay drilldown-overlay"
                    onClick={handleCloseDetailModal}
                    style={{ zIndex: 1050 }}
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
                                        dynamicCategoriasOrdenadas.findIndex(
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
                                        dynamicCategoriasOrdenadas.findIndex(
                                            ([cat]) => cat === selectedCategory
                                        ) === dynamicCategoriasOrdenadas.length - 1
                                    }
                                    className="nav-btn"
                                    title="Categoría siguiente"
                                >
                                    <span className="arrow">→</span>
                                </button>
                            </div>
                            <h3 className="modal-title">{selectedCategory}</h3>
                            <button
                                onClick={handleCloseDetailModal}
                                className="close-btn"
                                title="Cerrar"
                            >
                                ×
                            </button>
                        </div>

                        {/* Filters Section (Inner Modal) */}
                        <div className="valuacion-filters-section" style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Día:</label>
                                <select
                                    value={filterDay}
                                    onChange={(e) => setFilterDay(e.target.value)}
                                    className="filter-select"
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                >
                                    <option value="">Todos</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Mes:</label>
                                <select
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                    className="filter-select"
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                >
                                    <option value="">Todos</option>
                                    <option value="1">Enero</option>
                                    <option value="2">Febrero</option>
                                    <option value="3">Marzo</option>
                                    <option value="4">Abril</option>
                                    <option value="5">Mayo</option>
                                    <option value="6">Junio</option>
                                    <option value="7">Julio</option>
                                    <option value="8">Agosto</option>
                                    <option value="9">Septiembre</option>
                                    <option value="10">Octubre</option>
                                    <option value="11">Noviembre</option>
                                    <option value="12">Diciembre</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Año:</label>
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="filter-select"
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                >
                                    <option value="">Todos</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Separator */}
                            <div style={{ width: '1px', height: '35px', backgroundColor: '#e2e8f0', margin: '0 5px' }}></div>

                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Desde:</label>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div className="filter-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Hasta:</label>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                />
                            </div>

                            {(filterDay || filterMonth || filterYear || filterStartDate || filterEndDate) && (
                                <button
                                    onClick={() => {
                                        setFilterDay("");
                                        setFilterMonth("");
                                        setFilterYear("");
                                        setFilterStartDate("");
                                        setFilterEndDate("");
                                    }}
                                    style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        <div className="valuacion-modal-content">
                            {/* Desktop View */}
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
                                            {filteredItems.map((item, idx) => (
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
                                            {filteredItems.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan="5"
                                                        className="text-center py-4 text-muted"
                                                    >
                                                        No hay items para los filtros seleccionados
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile View */}
                            <div className="mobile-view">
                                {filteredItems.map((item, idx) => (
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
                                {filteredItems.length === 0 && (
                                    <div className="text-center py-4 text-muted">
                                        No hay items para los filtros seleccionados
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="valuacion-modal-footer">
                            <div className="total-label">Total Filtrado ({selectedCategory})</div>
                            <div className="total-amount">
                                ${" "}
                                {new Intl.NumberFormat("de-DE", {
                                    minimumFractionDigits: 2,
                                }).format(dynamicCategoryTotal)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
};

export default ValuacionCategoriasModal;
