import { getMainCurrency } from "./mainCurrency";

export const calculateBudgetSummary = (budget, convertToUSD, customRates) => {
  const subtotales = {
    USD: { conIVA: 0, sinIVA: 0 },
    EUR: { conIVA: 0, sinIVA: 0 },
    BS: { conIVA: 0, sinIVA: 0 },
  };

  let itemsConIva = 0;
  let itemsSinIva = 0;

  if (budget?.items) {
    budget.items.forEach((item) => {
      if (!item || !item.moneda) return;
      const monto = Number(item.montoContrato || 0);
      if (item.aplicaIVA) {
        subtotales[item.moneda] = subtotales[item.moneda] || {
          conIVA: 0,
          sinIVA: 0,
        };
        subtotales[item.moneda].conIVA += monto;
        itemsConIva++;
      } else {
        subtotales[item.moneda] = subtotales[item.moneda] || {
          conIVA: 0,
          sinIVA: 0,
        };
        subtotales[item.moneda].sinIVA += monto;
        itemsSinIva++;
      }
    });
  }

  const safeConvertToUSD = (amount, currency) =>
    convertToUSD
      ? convertToUSD(Number(amount || 0), currency || "USD")
      : Number(amount || 0);

  const subtotalConIVA_USD = Object.entries(subtotales).reduce(
    (sum, [currency, vals]) =>
      sum + safeConvertToUSD(vals.conIVA || 0, currency),
    0
  );
  const subtotalSinIVA_USD = Object.entries(subtotales).reduce(
    (sum, [currency, vals]) =>
      sum + safeConvertToUSD(vals.sinIVA || 0, currency),
    0
  );
  const totalPresupuesto_USD = subtotalConIVA_USD + subtotalSinIVA_USD;
  const ivaCalculado_USD = subtotalConIVA_USD * 0.16;
  const totalGeneral_USD =
    subtotalConIVA_USD + subtotalSinIVA_USD + ivaCalculado_USD;

  const mainCurrency = getMainCurrency(budget);
  const subtotalConIVA_Main = subtotales[mainCurrency]?.conIVA || 0;
  const subtotalSinIVA_Main = subtotales[mainCurrency]?.sinIVA || 0;
  const totalPresupuesto_Main = subtotalConIVA_Main + subtotalSinIVA_Main;
  const ivaCalculado_Main = subtotalConIVA_Main * 0.16;
  const totalGeneral_Main =
    subtotalConIVA_Main + subtotalSinIVA_Main + ivaCalculado_Main;

  const tasaEUR = customRates?.EUR || 0.85844;
  const subtotalConIVA_EUR = subtotalConIVA_USD * tasaEUR;
  const subtotalSinIVA_EUR = subtotalSinIVA_USD * tasaEUR;
  const totalPresupuesto_EUR = totalPresupuesto_USD * tasaEUR;

  return {
    subtotalsByCurrency: subtotales,
    itemsConIva,
    itemsSinIva,
    subtotalConIVA_USD,
    subtotalSinIVA_USD,
    totalPresupuesto_USD,
    ivaCalculado_USD,
    totalGeneral_USD,
    subtotalConIVA_Main,
    subtotalSinIVA_Main,
    totalPresupuesto_Main,
    ivaCalculado_Main,
    totalGeneral_Main,
    subtotalConIVA_EUR,
    subtotalSinIVA_EUR,
    totalPresupuesto_EUR,
    mainCurrency,
  };
};

export const calculateValuationSummary = (
  valuations,
  convertToUSD,
  customRates
) => {
  const safeConvertToUSD = (amount, currency) =>
    convertToUSD
      ? convertToUSD(Number(amount || 0), currency || "USD")
      : Number(amount || 0);

  const totalEjecutado_RAW =
    valuations?.reduce(
      (total, v) => total + Number(v.totales?.subtotal || 0),
      0
    ) || 0;

  const totalEjecutado_USD =
    valuations?.reduce(
      (sum, v) =>
        sum +
        safeConvertToUSD(
          Number(v.totales?.subtotal || 0),
          v.totales?.currency || "USD"
        ),
      0
    ) || 0;

  const tasaEUR = customRates?.EUR || 0.85844;
  const totalEjecutado_EUR = totalEjecutado_USD * tasaEUR;

  return {
    totalEjecutado_RAW,
    totalEjecutado_USD,
    totalEjecutado_EUR,
  };
};

export const calculateProgress = (totalEjecutado, totalPresupuesto) => {
  if (totalPresupuesto > 0) {
    return (totalEjecutado / totalPresupuesto) * 100;
  }
  return 0;
};
