import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./ReportesNomina.css";

const ReportesNomina = ({
    pagosGuardados,
    employees,
    asistencias,
    selectedProject,
}) => {
    const [filterType, setFilterType] = useState("mes"); // 'periodo', 'mes', 'dia', 'periodo_estimado'
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );
    const [selectedDay, setSelectedDay] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [reportData, setReportData] = useState([]);
    const [summary, setSummary] = useState({
        totalAmount: 0,
        totalEmployees: 0,
        count: 0,
    });

    // Helper to format date safely
    const formatDateSafe = (date) => {
        if (!date) return "";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
    };

    // Helper to calculate business days in a month (excluding Sat/Sun)
    const calcularDiasHabilesMes = (fecha) => {
        if (!fecha) return 22;
        const date = new Date(fecha);
        const year = date.getFullYear();
        const month = date.getMonth();
        const primerDiaMes = new Date(year, month, 1);
        const ultimoDiaMes = new Date(year, month + 1, 0);
        let diasHabiles = 0;
        for (let d = new Date(primerDiaMes); d <= ultimoDiaMes; d.setDate(d.getDate() + 1)) {
            const diaSemana = d.getDay();
            if (diaSemana !== 0 && diaSemana !== 6) diasHabiles++;
        }
        return diasHabiles;
    };

    // Helper to calculate real days in a month
    const calcularDiasRealesMes = (fecha) => {
        if (!fecha) return 30;
        const date = new Date(fecha);
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Calculate daily rate for an employee based on specific date context
    const calculateDailyRate = (employee, dateStr) => {
        const diasHabiles = calcularDiasHabilesMes(dateStr);
        const diasReales = calcularDiasRealesMes(dateStr);

        if (["Administrativa", "Ejecucion"].includes(employee.tipoNomina)) {
            const totalMensual = parseFloat(employee.montoLey || 0) + parseFloat(employee.bonificacionEmpresa || 0);
            if (employee.frecuenciaPago === "Semanal") {
                return totalMensual / diasHabiles;
            } else {
                return totalMensual / diasReales;
            }
        } else {
            const montoSalario = parseFloat(employee.montoSalario || 0);
            switch (employee.tipoSalario) {
                case "Diario": return montoSalario;
                case "Semanal": return montoSalario / 5;
                case "Mensual":
                    if (employee.frecuenciaPago === "Semanal") {
                        return montoSalario / diasHabiles;
                    } else {
                        return montoSalario / diasReales;
                    }
                default: return 0;
            }
        }
    };

    const generateReport = () => {
        let data = [];
        let totalAmt = 0;
        let uniqueEmployees = new Set();

        if (filterType === "dia" || filterType === "periodo_estimado") {
            // Estimated Expense Report (Daily or Period) based on Attendance
            let startDate, endDate;

            if (filterType === "dia") {
                if (!selectedDay) return;
                startDate = new Date(selectedDay);
                endDate = new Date(selectedDay);
            } else {
                if (!dateRange.start || !dateRange.end) return;
                startDate = new Date(dateRange.start);
                endDate = new Date(dateRange.end);
            }

            // Iterate through each day in range
            // Clone start date to avoid modifying it in loop condition if used elsewhere
            let current = new Date(startDate);
            const end = new Date(endDate);

            while (current <= end) {
                const dayStr = current.toISOString().split('T')[0];

                // Find attendance for this day
                const asistenciaDia = asistencias.find(
                    (a) => a.fecha === dayStr && a.projectId === selectedProject?.id
                );

                if (asistenciaDia) {
                    employees.forEach((emp) => {
                        if (emp.estado === "Inactivo") return;

                        const registro = asistenciaDia.registros.find(
                            (r) => r.empleadoId === emp.id
                        );

                        // If attended
                        if (registro && registro.asistio) {
                            const dailyRate = calculateDailyRate(emp, dayStr);

                            data.push({
                                fecha: dayStr,
                                empleado: `${emp.nombre} ${emp.apellido}`,
                                cedula: emp.cedula,
                                cargo: emp.cargo,
                                tipo: "Estimado Diario",
                                monto: dailyRate,
                                detalle: "Asistencia confirmada",
                            });
                            totalAmt += dailyRate;
                            uniqueEmployees.add(emp.id);
                        }
                    });
                }
                current.setDate(current.getDate() + 1);
            }
        } else {
            // Historical Payments Report
            let filteredPagos = [];

            if (filterType === "mes") {
                filteredPagos = pagosGuardados.filter((p) =>
                    p.fechaPago.startsWith(selectedMonth)
                );
            } else if (filterType === "periodo") {
                if (!dateRange.start || !dateRange.end) return;
                filteredPagos = pagosGuardados.filter(
                    (p) =>
                        p.fechaPago >= dateRange.start && p.fechaPago <= dateRange.end
                );
            }

            // Flatten payments
            filteredPagos.forEach((pago) => {
                pago.pagos.forEach((pagoEmp) => {
                    const montoTotal = pagoEmp.montoTotalUSD ||
                        (pagoEmp.subtotalUSD + (pagoEmp.montoExtraUSD || 0) + (pagoEmp.adelantosUSD || 0));

                    data.push({
                        fecha: pago.fechaPago,
                        empleado: `${pagoEmp.empleado.nombre} ${pagoEmp.empleado.apellido}`,
                        cedula: pagoEmp.empleado.cedula,
                        cargo: pagoEmp.empleado.cargo,
                        tipo: "Pago Nómina",
                        monto: montoTotal,
                        detalle: `Tasa: ${pago.tasaCambio}`,
                    });
                    totalAmt += montoTotal;
                    uniqueEmployees.add(pagoEmp.empleado.id);
                });
            });
        }

        setReportData(data);
        setSummary({
            totalAmount: totalAmt,
            totalEmployees: uniqueEmployees.size,
            count: data.length,
        });
    };

    const exportToExcel = () => {
        if (reportData.length === 0) return;

        const exportData = reportData.map((row) => ({
            Fecha: row.fecha,
            Empleado: row.empleado,
            Cédula: row.cedula,
            Cargo: row.cargo,
            Tipo: row.tipo,
            "Monto ($)": row.monto.toFixed(2),
            Detalle: row.detalle,
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Add summary row
        XLSX.utils.sheet_add_json(
            ws,
            [
                {
                    Fecha: "TOTAL",
                    "Monto ($)": summary.totalAmount.toFixed(2),
                },
            ],
            { skipHeader: true, origin: -1 }
        );

        XLSX.utils.book_append_sheet(wb, ws, "Reporte Nómina");
        XLSX.writeFile(wb, `Reporte_Nomina_${filterType}_${new Date().getTime()}.xlsx`);
    };

    useEffect(() => {
        generateReport();
    }, [filterType, selectedMonth, selectedDay, dateRange, pagosGuardados, asistencias]);

    return (
        <div className="reportes-nomina">
            <div className="reportes-header">
                <h3>Reportes y Estadísticas de Nómina</h3>

                <div className="filters-container">
                    <div className="filter-group">
                        <label>Tipo de Reporte:</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="mes">Por Mes (Histórico)</option>
                            <option value="periodo">Por Periodo (Histórico)</option>
                            <option value="dia">Gasto Diario (Estimado)</option>
                            <option value="periodo_estimado">Gasto Periodo (Estimado por Asistencia)</option>
                        </select>
                    </div>

                    {filterType === "mes" && (
                        <div className="filter-group">
                            <label>Seleccionar Mes:</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </div>
                    )}

                    {(filterType === "periodo" || filterType === "periodo_estimado") && (
                        <>
                            <div className="filter-group">
                                <label>Desde:</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) =>
                                        setDateRange((prev) => ({ ...prev, start: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="filter-group">
                                <label>Hasta:</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) =>
                                        setDateRange((prev) => ({ ...prev, end: e.target.value }))
                                    }
                                />
                            </div>
                        </>
                    )}

                    {filterType === "dia" && (
                        <div className="filter-group">
                            <label>Seleccionar Día:</label>
                            <input
                                type="date"
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                            />
                        </div>
                    )}

                    <button className="btn-generate" onClick={generateReport}>
                        🔄 Actualizar
                    </button>
                </div>
            </div>

            <div className="report-summary">
                <div className="summary-card total">
                    <h4>Gasto Total ($)</h4>
                    <div className="value">${summary.totalAmount.toFixed(2)}</div>
                </div>
                <div className="summary-card">
                    <h4>Empleados</h4>
                    <div className="value">{summary.totalEmployees}</div>
                </div>
                <div className="summary-card">
                    <h4>Registros</h4>
                    <div className="value">{summary.count}</div>
                </div>
            </div>

            <div className="report-content">
                <div className="report-actions">
                    <button
                        className="btn-export"
                        onClick={exportToExcel}
                        disabled={reportData.length === 0}
                    >
                        📊 Exportar a Excel
                    </button>
                </div>

                <div className="report-table-container">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Empleado</th>
                                <th>Cédula</th>
                                <th>Cargo</th>
                                <th>Tipo</th>
                                <th className="text-right">Monto ($)</th>
                                <th>Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.fecha}</td>
                                        <td>{row.empleado}</td>
                                        <td>{row.cedula}</td>
                                        <td>{row.cargo}</td>
                                        <td>
                                            <span className={`badge ${row.tipo === 'Estimado Diario' ? 'warning' : 'success'}`}>
                                                {row.tipo}
                                            </span>
                                        </td>
                                        <td className="text-right font-bold">
                                            ${row.monto.toFixed(2)}
                                        </td>
                                        <td>{row.detalle}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="no-data">
                                        No hay datos para los filtros seleccionados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {reportData.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td colSpan="5" className="text-right font-bold">
                                        TOTAL:
                                    </td>
                                    <td className="text-right font-bold">
                                        ${summary.totalAmount.toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportesNomina;
