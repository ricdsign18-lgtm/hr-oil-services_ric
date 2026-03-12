import React, { useState } from "react";
import { createPortal } from "react-dom";

const ValuacionPayrollModal = ({
    showModal,
    onClose,
    pagosPeriodo,
    pagosContratistasPeriodo,
    totalLaboralUSD,
    formatCurrency,
}) => {
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterDay, setFilterDay] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    const getAllPayrollItems = () => {
        const items = [];

        // Regular Payroll
        if (pagosPeriodo) {
            pagosPeriodo.forEach((batch) => {
                batch.pagos.forEach((pago) => {
                    items.push({
                        id: pago.id,
                        fecha: batch.fechaPago,
                        createdAt: batch.timestamp,
                        empleado: `${pago.empleado.nombre} ${pago.empleado.apellido}`,
                        cedula: pago.empleado.cedula,
                        cargo: pago.empleado.cargo,
                        monto: parseFloat(pago.montoTotalUSD || 0),
                        tipo: "Nómina",
                    });
                });
            });
        }

        // Contractor Payments
        if (pagosContratistasPeriodo) {
            pagosContratistasPeriodo.forEach((batch) => {
                if (batch.pagos && Array.isArray(batch.pagos)) {
                    batch.pagos.forEach((pago) => {
                        const nombre =
                            pago.nombre_contratista || pago.nombre || "Contratista";
                        items.push({
                            id: pago.id || `contr-${batch.id}-${Math.random()}`,
                            fecha: batch.fechaPago,
                            createdAt: batch.timestamp,
                            empleado: nombre,
                            cedula: pago.cedula || "N/A",
                            cargo: pago.cargo || "Servicios Profesionales",
                            monto: parseFloat(pago.monto_total_usd || 0),
                            tipo: "Contratista",
                        });
                    });
                }
            });
        }

        return items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    };

    const fullItems = getAllPayrollItems();

    const getUniquePayrollEmployees = () => {
        const employees = [...new Set(fullItems.map((item) => item.empleado))];
        return employees.sort();
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

    const getFilteredPayrollItems = () => {
        let items = filterItemsByDate(fullItems, item => item.fecha);

        if (filterEmployee) {
            items = items.filter((item) => item.empleado === filterEmployee);
        }

        return items;
    };

    const filteredItems = getFilteredPayrollItems();

    // Get unique years for the dropdown
    const availableYears = React.useMemo(() => {
        const years = new Set();
        fullItems.forEach(item => {
            if (item.fecha) {
                const y = new Date(item.fecha).getFullYear();
                if (!isNaN(y)) years.add(y);
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [fullItems]);

    if (!showModal) return null;

    return createPortal(
        <div className="category-detail-modal-overlay" onClick={onClose}>
            <div
                className="category-detail-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="valuacion-modal-header">
                    <h3 className="modal-title">Detalle de Nómina</h3>
                    <button onClick={onClose} className="close-btn" title="Cerrar">
                        ×
                    </button>
                </div>

                {/* Filters Bar */}
                <div
                    className="valuacion-modal-filters"
                    style={{
                        padding: "0 24px",
                        marginBottom: "16px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        alignItems: "flex-end"
                    }}
                >
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
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Empleado:</label>
                        <select
                            className="form-select"
                            value={filterEmployee}
                            onChange={(e) => setFilterEmployee(e.target.value)}
                            style={{
                                padding: "8px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                fontSize: "0.9rem",
                                minWidth: "180px",
                            }}
                        >
                            <option value="">Todos los Empleados</option>
                            {getUniquePayrollEmployees().map((emp) => (
                                <option key={emp} value={emp}>
                                    {emp}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(filterDay || filterMonth || filterYear || filterStartDate || filterEndDate || filterEmployee) && (
                        <button
                            onClick={() => {
                                setFilterDay("");
                                setFilterMonth("");
                                setFilterYear("");
                                setFilterStartDate("");
                                setFilterEndDate("");
                                setFilterEmployee("");
                            }}
                            style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            Limpiar
                        </button>
                    )}
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
                                    {filteredItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="td-date">
                                                {new Date(item.fecha).toLocaleDateString()}
                                                {item.createdAt && (
                                                    <div
                                                        className="text-xs text-muted"
                                                        style={{ fontSize: "0.7rem", marginTop: "2px" }}
                                                    >
                                                        Creado: {new Date(item.createdAt).toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="td-provider font-medium">
                                                {item.empleado}
                                                <div className="text-xs text-muted">{item.cedula}</div>
                                            </td>
                                            <td className="td-desc text-muted">{item.cargo}</td>
                                            <td className="td-amount text-right font-bold">
                                                {formatCurrency(item.monto, "USD")}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
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
                        {filteredItems.map((item, idx) => (
                            <div key={idx} className="mobile-card">
                                <div className="mobile-card-header">
                                    <span className="mobile-date">
                                        {new Date(item.fecha).toLocaleDateString()}
                                        {item.createdAt && (
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: "0.7rem", fontWeight: "normal" }}
                                            >
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
                        {filteredItems.length === 0 && (
                            <div className="text-center py-4 text-muted">
                                No hay pagos registrados
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="valuacion-modal-footer"
                    style={{ flexDirection: "column", gap: "8px" }}
                >
                    {(filterDay || filterMonth || filterYear || filterStartDate || filterEndDate || filterEmployee) && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                color: "#64748b",
                                fontSize: "0.95rem",
                            }}
                        >
                            <div className="total-label">Total Filtrado</div>
                            <div className="total-amount">
                                {formatCurrency(
                                    filteredItems.reduce((acc, item) => acc + item.monto, 0),
                                    "USD"
                                )}
                            </div>
                        </div>
                    )}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        <div className="total-label">Total Nómina y Contrataciones</div>
                        <div className="total-amount">
                            {formatCurrency(totalLaboralUSD, "USD")}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ValuacionPayrollModal;
