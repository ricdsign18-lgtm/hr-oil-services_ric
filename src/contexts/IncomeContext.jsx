// src/contexts/IncomeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../api/supaBase";
import { useAuth } from "./AuthContext";
import { useProjects } from "./ProjectContext";

const IncomeContext = createContext();

export const useIncome = () => {
  const context = useContext(IncomeContext);
  if (!context) {
    throw new Error("useIncome debe ser usado dentro de un IncomeProvider");
  }
  return context;
};

export const IncomeProvider = ({ children }) => {
  const { userData } = useAuth();
  const { selectedProject } = useProjects();
  const [invoices, setInvoices] = useState([]);
  const [clientDeductions, setClientDeductions] = useState([]);
  const [companyDeductions, setCompanyDeductions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos
  useEffect(() => {
    if (selectedProject) {
      loadInvoices();
      loadCompanyDeductions();
    }
  }, [selectedProject]);

  const loadInvoices = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("income_invoices")
        .select(`
          *,
          income_client_deductions (*)
        `)
        .eq("project_id", selectedProject.id)
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyDeductions = async () => {
    if (!selectedProject) return;

    try {
      const { data, error } = await supabase
        .from("income_company_deductions")
        .select("*")
        .eq("project_id", selectedProject.id)
        .order("deduction_date", { ascending: false });

      if (error) throw error;
      setCompanyDeductions(data || []);
    } catch (error) {
      console.error("Error loading company deductions:", error);
    }
  };

  // Agregar factura
  const addInvoice = async (invoiceData) => {
    if (!selectedProject) throw new Error("No project selected");

    try {
      const newInvoice = {
        project_id: selectedProject.id,
        invoice_date: invoiceData.invoiceDate,
        client_name: invoiceData.clientName,
        client_rif: invoiceData.clientRif,
        client_address: invoiceData.clientAddress,
        description: invoiceData.description,
        exempt_amount: parseFloat(invoiceData.exemptAmount) || 0,
        taxable_base: parseFloat(invoiceData.taxableBase),
        subtotal: parseFloat(invoiceData.subtotal),
        iva_amount: parseFloat(invoiceData.ivaAmount),
        exchange_rate: parseFloat(invoiceData.exchangeRate),
        total_amount: parseFloat(invoiceData.totalAmount),
        valuation_id: invoiceData.valuationId || null,
        status: invoiceData.status || 'por_cobrar', // Nuevo campo
      };

      console.log("Enviando factura:", newInvoice);

      const { data, error } = await supabase
        .from("income_invoices")
        .insert([newInvoice])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      await loadInvoices();
      return data;
    } catch (error) {
      console.error("Error adding invoice:", error);
      throw error;
    }
  };

  // Actualizar factura
  const updateInvoice = async (id, invoiceData) => {
    try {
      const updatedInvoice = {
        invoice_date: invoiceData.invoiceDate,
        client_name: invoiceData.clientName,
        client_rif: invoiceData.clientRif,
        client_address: invoiceData.clientAddress,
        description: invoiceData.description,
        exempt_amount: parseFloat(invoiceData.exemptAmount) || 0,
        taxable_base: parseFloat(invoiceData.taxableBase),
        subtotal: parseFloat(invoiceData.subtotal),
        iva_amount: parseFloat(invoiceData.ivaAmount),
        exchange_rate: parseFloat(invoiceData.exchangeRate),
        total_amount: parseFloat(invoiceData.totalAmount),
        valuation_id: invoiceData.valuationId || null,
        status: invoiceData.status || 'por_cobrar', // Nuevo campo
      };

      const { data, error } = await supabase
        .from("income_invoices")
        .update(updatedInvoice)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await loadInvoices();
      return data;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  };

  // Eliminar factura
  const deleteInvoice = async (id) => {
    try {
      // Primero eliminar deducciones asociadas (si no hay cascade delete)
      await supabase.from("income_client_deductions").delete().eq("invoice_id", id);

      const { error } = await supabase
        .from("income_invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadInvoices();
      return { success: true };
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  };

  // Agregar deducciones del cliente
  const addClientDeductions = async (invoiceId, deductionsData) => {
    try {
      // Primero eliminar deducciones existentes para esta factura (para evitar duplicados)
      const { error: deleteError } = await supabase
        .from("income_client_deductions")
        .delete()
        .eq("invoice_id", invoiceId);

      if (deleteError) {
        console.error("Error deleting existing deductions:", deleteError);
      }

      // Insertar las nuevas deducciones
      const deductionsToInsert = deductionsData.map(deduction => ({
        invoice_id: invoiceId,
        description: deduction.description,
        percentage: parseFloat(deduction.percentage),
        amount: parseFloat(deduction.amount),
        amount_usd: parseFloat(deduction.amount_usd),
      }));

      const { error } = await supabase
        .from("income_client_deductions")
        .insert(deductionsToInsert);

      if (error) throw error;

      // Recargar las facturas para obtener los datos actualizados
      await loadInvoices();

      return { success: true };
    } catch (error) {
      console.error("Error adding client deductions:", error);
      throw error;
    }
  };

  // Agregar deducción de empresa
  const addCompanyDeduction = async (deductionData) => {
    if (!selectedProject) throw new Error("No project selected");

    try {
      const newDeduction = {
        project_id: selectedProject.id,
        deduction_date: deductionData.deductionDate,
        description: deductionData.description,
        percentage: parseFloat(deductionData.percentage),
        amount: parseFloat(deductionData.amount),
        amount_usd: parseFloat(deductionData.amountUSD),
      };

      const { data, error } = await supabase
        .from("income_company_deductions")
        .insert([newDeduction])
        .select()
        .single();

      if (error) throw error;

      await loadCompanyDeductions();
      return data;
    } catch (error) {
      console.error("Error adding company deduction:", error);
      throw error;
    }
  };

  // Eliminar deducción de empresa
  const deleteCompanyDeduction = async (id) => {
    try {
      const { error } = await supabase
        .from("income_company_deductions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadCompanyDeductions();
      return { success: true };
    } catch (error) {
      console.error("Error deleting company deduction:", error);
      throw error;
    }
  };

  // Calcular totales por fecha
  const getDailyTotals = (date) => {
    const dailyInvoices = invoices.filter(invoice =>
      invoice.invoice_date === date
    );

    // Tomar la tasa de la primera factura del día (o un valor por defecto)
    const exchangeRate = dailyInvoices.length > 0 ? parseFloat(dailyInvoices[0].exchange_rate) : 0;

    // Sumatoria de todas las bases imponibles (para deducciones de empresa)
    const totalTaxableBase = dailyInvoices.reduce((sum, invoice) => {
      return sum + parseFloat(invoice.taxable_base);
    }, 0);

    // Monto recibido al banco (base imponible - deducciones cliente)
    const totalReceivedBs = dailyInvoices.reduce((sum, invoice) => {
      const clientDeductionsTotal = invoice.income_client_deductions?.reduce(
        (deductionSum, deduction) => deductionSum + parseFloat(deduction.amount),
        0
      ) || 0;

      return sum + (parseFloat(invoice.taxable_base) - clientDeductionsTotal);
    }, 0);

    // Calcular USD usando la tasa de cambio de cada factura
    const totalReceivedUsd = dailyInvoices.reduce((sum, invoice) => {
      const clientDeductionsTotal = invoice.income_client_deductions?.reduce(
        (deductionSum, deduction) => deductionSum + parseFloat(deduction.amount),
        0
      ) || 0;

      const netAmountBs = parseFloat(invoice.taxable_base) - clientDeductionsTotal;
      const netAmountUsd = netAmountBs / parseFloat(invoice.exchange_rate);

      return sum + netAmountUsd;
    }, 0);

    return {
      totalTaxableBase,
      totalReceivedBs,
      totalReceivedUsd,
      exchangeRate // Devolver la tasa de cambio
    };
  };

  const value = {
    invoices,
    clientDeductions,
    companyDeductions,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addClientDeductions,
    addCompanyDeduction,
    deleteCompanyDeduction,
    loadInvoices,
    loadCompanyDeductions,
    getDailyTotals,
  };

  return (
    <IncomeContext.Provider value={value}>
      {children}
    </IncomeContext.Provider>
  );
};