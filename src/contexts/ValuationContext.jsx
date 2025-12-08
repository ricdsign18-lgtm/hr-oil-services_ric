import { createContext, useContext, useState, useEffect } from "react";
import { useProjects } from "./ProjectContext";
import { useBudget } from "./BudgetContext";
import supabase from "../api/supaBase";

const ValuationContext = createContext();

export const useValuation = () => {
  const context = useContext(ValuationContext);
  if (!context) {
    throw new Error(
      "useValuation debe ser usado dentro de un ValuationProvider"
    );
  }
  return context;
};

export const ValuationProvider = ({ children }) => {
  const { selectedProject } = useProjects();
  const { budget } = useBudget();
  const [valuations, setValuations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar valuaciones del proyecto
  const loadValuations = async () => {
    if (!selectedProject?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("valuations")
        .select(
          `
          *,
          valuation_items (
            *,
            budget_items (
              item_number,
              description,
              unit
            )
          )
        `
        )
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        // Transformar datos de Supabase a nuestro formato
        const transformedValuations = data.map((valuation) => ({
          id: valuation.id,
          numero: valuation.valuation_number,
          periodoInicio: valuation.period_start,
          periodoFin: valuation.period_end,
          fechaCreacion: valuation.created_at,
          projectId: valuation.project_id,
          totales: {
            subtotal: parseFloat(valuation.subtotal),
            iva: parseFloat(valuation.iva),
            total: parseFloat(valuation.total),
            cantidadPartidas: valuation.quantity_items,
          },
          partidas: valuation.valuation_items.map((item) => ({
            id: item.id,
            partidaId: item.budget_item_id,
            item: item.budget_items.item_number,
            descripcion: item.budget_items.description,
            unidad: item.budget_items.unit,
            cantidadEjecutada: parseFloat(item.quantity_executed),
            precioUnitario: parseFloat(item.unit_price),
            moneda: item.currency,
            montoTotal: parseFloat(item.total_amount),
            aplicaIVA: item.applies_vat,
          })),
        }));
        setValuations(transformedValuations);
      } else {
        setValuations([]);
      }
    } catch (err) {
      console.error("Error loading valuations:", err);
      setError(err.message);
      // Fallback a localStorage
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Fallback a localStorage
  const loadFromLocalStorage = () => {
    const savedValuations = localStorage.getItem(
      `valuaciones_${selectedProject?.id}`
    );
    if (savedValuations) {
      setValuations(JSON.parse(savedValuations));
    } else {
      setValuations([]);
    }
  };

  // Crear o actualizar valuación
  const saveValuation = async (valuationData) => {
    setLoading(true);
    setError(null);

    try {
      if (!budget?.id) {
        throw new Error("No hay presupuesto cargado para asociar la valuación");
      }

      let valuationId = valuationData.id;

      if (valuationId) {
        // Actualizar valuación existente
        const { error: updateError } = await supabase
          .from("valuations")
          .update({
            valuation_number: valuationData.numero,
            period_start: valuationData.periodoInicio,
            period_end: valuationData.periodoFin,
            subtotal: valuationData.totales?.subtotal || 0,
            iva: valuationData.totales?.iva || 0,
            total: valuationData.totales?.total || 0,
            quantity_items: valuationData.partidas?.length || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", valuationId);

        if (updateError) throw updateError;
      } else {
        // Crear nueva valuación
        const { data: newValuation, error: insertError } = await supabase
          .from("valuations")
          .insert({
            project_id: selectedProject.id,
            budget_id: budget.id,
            valuation_number: valuationData.numero,
            period_start: valuationData.periodoInicio,
            period_end: valuationData.periodoFin,
            subtotal: valuationData.totales?.subtotal || 0,
            iva: valuationData.totales?.iva || 0,
            total: valuationData.totales?.total || 0,
            quantity_items: valuationData.partidas?.length || 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        valuationId = newValuation.id;
      }

      // Guardar items de la valuación
      await saveValuationItems(valuationId, valuationData.partidas);

      // Recargar las valuaciones
      await loadValuations();

      return { success: true, id: valuationId };
    } catch (err) {
      console.error("Error saving valuation:", err);
      setError(err.message);
      // Fallback a localStorage
      saveToLocalStorage(valuationData);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Guardar items de la valuación
  const saveValuationItems = async (valuationId, items) => {
    if (!items || items.length === 0) return;

    // Eliminar items existentes
    await supabase
      .from("valuation_items")
      .delete()
      .eq("valuation_id", valuationId);

    // Insertar nuevos items
    const itemsToInsert = items.map((item, index) => ({
      valuation_id: valuationId,
      budget_item_id: item.partidaId,
      quantity_executed: item.cantidadEjecutada,
      unit_price: item.precioUnitario,
      currency: item.moneda,
      applies_vat: item.aplicaIVA,
      item_order: index,
    }));

    const { error } = await supabase
      .from("valuation_items")
      .insert(itemsToInsert);

    if (error) throw error;
  };

  // Eliminar valuación
  const deleteValuation = async (valuationId) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("valuations")
        .delete()
        .eq("id", valuationId);

      if (error) throw error;

      // Recargar las valuaciones
      await loadValuations();

      return { success: true };
    } catch (err) {
      console.error("Error deleting valuation:", err);
      setError(err.message);
      // Fallback a localStorage
      deleteFromLocalStorage(valuationId);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Calcular siguiente número de valuación
  const getNextValuationNumber = () => {
    if (valuations.length === 0) return 1;

    const lastNumber = Math.max(
      ...valuations.map((v) => {
        const match = v.numero?.match(/VALUACIÓN\s*(\d+)/i);
        return match ? parseInt(match[1]) : 0;
      })
    );
    return lastNumber + 1;
  };

  // Fallback a localStorage
  const saveToLocalStorage = (valuationData) => {
    const isEditing = !!valuationData.id;
    let updatedValuations;

    if (isEditing) {
      updatedValuations = valuations.map((v) =>
        v.id === valuationData.id ? valuationData : v
      );
    } else {
      const newValuation = {
        id: Date.now().toString(),
        ...valuationData,
        fechaCreacion: new Date().toISOString(),
        projectId: selectedProject?.id,
      };
      updatedValuations = [...valuations, newValuation];
    }

    localStorage.setItem(
      `valuaciones_${selectedProject?.id}`,
      JSON.stringify(updatedValuations)
    );
    setValuations(updatedValuations);
  };

  const deleteFromLocalStorage = (valuationId) => {
    const updatedValuations = valuations.filter((v) => v.id !== valuationId);
    localStorage.setItem(
      `valuaciones_${selectedProject?.id}`,
      JSON.stringify(updatedValuations)
    );
    setValuations(updatedValuations);
  };

  // Cargar valuaciones cuando cambie el proyecto
  useEffect(() => {
    if (selectedProject?.id) {
      loadValuations();
    } else {
      setValuations([]);
    }
  }, [selectedProject?.id]);

  const value = {
    valuations,
    loading,
    error,
    loadValuations,
    saveValuation,
    deleteValuation,
    getNextValuationNumber,
    refreshValuations: loadValuations,
  };

  return (
    <ValuationContext.Provider value={value}>
      {children}
    </ValuationContext.Provider>
  );
};
