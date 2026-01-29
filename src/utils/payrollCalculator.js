
export const calculateDailyLaborCost = (employee, dateStr) => {
    if (!employee || !dateStr) return 0;

    // Verificar si la fecha es válida
    const date = new Date(dateStr + 'T12:00:00'); // Validar formato YYYY-MM-DD
    if (isNaN(date.getTime())) return 0;

    const year = date.getFullYear();
    const month = date.getMonth();

    // Validar si es fin de semana (Sábado=6, Domingo=0)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Último día del mes (Total días reales)
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    // Calcular días hábiles (Lunes a Viernes)
    let businessDays = 0;
    for (let d = 1; d <= lastDayOfMonth; d++) {
        const dayDate = new Date(year, month, d);
        const day = dayDate.getDay();
        if (day !== 0 && day !== 6) businessDays++; // Excluir Domingo(0) y Sábado(6)
    }

    // Asegurar valores numéricos
    const montoSalario = parseFloat(employee.montoSalario) || 0;
    const montoLey = parseFloat(employee.montoLey) || 0;
    const bonificacionEmpresa = parseFloat(employee.bonificacionEmpresa) || 0;

    const tipoNomina = employee.tipoNomina || '';
    const frecuenciaPago = employee.frecuenciaPago || '';
    const tipoSalario = employee.tipoSalario || '';

    // === Lógica de Negocio ===

    // CASO 1: Contratistas (Salario Diario)
    if (tipoNomina === "Contratista") {
        // Se asume que cobran por día trabajado (Lunes a Viernes)
        // UPDATE: User requested to include weekends with normal daily amount
        // if (isWeekend) return 0; 
        return montoSalario;
    }

    // CASO 2: Administrativa / Ejecución (Sueldo Mensual + Bono)
    if (["Administrativa", "Ejecucion"].includes(tipoNomina)) {
        const totalMensual = montoLey + bonificacionEmpresa;

        if (frecuenciaPago === "Semanal") {
            // Pago Semanal: Se divide entre días hábiles.
            // UPDATE: User requested to include weekends with normal daily amount
            // if (isWeekend) return 0;
            return businessDays > 0 ? totalMensual / businessDays : 0;
        } else {
            // Pago Quincenal: Se divide entre 30 días (o días reales del mes) y cobran TODOS los días.
            // Generan costo incluso fines de semana.
            return totalMensual / lastDayOfMonth;
        }
    }

    // CASO 3: Obreros / Otros
    else {
        switch (tipoSalario) {
            case "Diario":
                // Cobran por día trabajado
                // UPDATE: User requested to include weekends
                // if (isWeekend) return 0;
                return montoSalario;

            case "Semanal":
                // Salario definido semanalmente. 
                // Asumimos que cubre la semana laboral. Dividimos entre 5.
                // UPDATE: User requested to include weekends
                // if (isWeekend) return 0;
                return montoSalario / 5;

            case "Mensual":
                if (frecuenciaPago === "Semanal") {
                    // Mismo caso que Admin Semanal
                    // if (isWeekend) return 0;
                    return businessDays > 0 ? montoSalario / businessDays : 0;
                } else {
                    // Mismo caso que Admin Quincenal
                    return montoSalario / lastDayOfMonth;
                }

            default:
                return 0;
        }
    }
};
