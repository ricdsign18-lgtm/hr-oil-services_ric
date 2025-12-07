import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import supabase from '../api/supaBase';
import { useProjects } from './ProjectContext';
import { useNotification } from './NotificationContext';

const OperacionesContext = createContext();

export const useOperaciones = () => useContext(OperacionesContext);

export const OperacionesProvider = ({ children }) => {
  const { selectedProject } = useProjects();
  const { showToast } = useNotification();
  const [inventory, setInventory] = useState([]);
  const [compras, setCompras] = useState([]);
  const [retiros, setRetiros] = useState([]);
  const [productos, setProductos] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [loading, setLoading] = useState(false);

  const getProductos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre_producto');

    if (error) {
      console.error('Error fetching productos:', error);
    } else {
      setProductos(data || []);
    }
    setLoading(false);
  }, []);

  const getRequerimientos = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('requerimientos')
      .select(`
        *,
        requerimiento_items (*)
      `)
      .eq('project_id', selectedProject.id)
      .order('fecha_requerimiento', { ascending: false });

    if (error) {
      console.error('Error fetching requerimientos:', error);
    } else {
      setRequerimientos(data || []);
    }
    setLoading(false);
  }, [selectedProject]);

  const getInventory = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('project_id', selectedProject.id)
      .order('categoria_producto');

    if (error) {
      console.error('Error fetching inventory:', error);
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  }, [selectedProject]);

  const getCompras = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('compras')
      .select('*')
      .eq('project_id', selectedProject.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching compras:', error);
    } else {
      setCompras(data || []);
    }
    setLoading(false);
  }, [selectedProject]);

  const getRetiros = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('retiros_inventario')
      .select(`
        *,
        inventario (nombre_producto, unidad)
      `)
      .eq('project_id', selectedProject.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching retiros:', error);
    } else {
      setRetiros(data || []);
    }
    setLoading(false);
  }, [selectedProject]);

  const getInventorySummary = useCallback(async () => {
    if (!selectedProject) return;

    const { data, error } = await supabase
      .from('inventario')
      .select(`
        *,
        compras (nombre_producto, cantidad),
        retiros_inventario (cantidad_retirada)
      `)
      .eq('project_id', selectedProject.id);

    if (error) {
      console.error('Error fetching inventory summary:', error);
    }
    return data || [];
  }, [selectedProject]);

  const getLowStockItems = useCallback(() => {
    return inventory.filter(item => {
      if (!item.prioridad || !item.stock_objetivo || item.stock_objetivo <= 0) {
        return false;
      }

      const currentStock = item.cantidad_disponible;
      const targetStock = item.stock_objetivo;

      switch (item.prioridad) {
        case 'Alta':
          return currentStock <= targetStock * 0.5;
        case 'Media':
          return currentStock <= targetStock * 0.3;
        case 'Baja':
          return currentStock <= 1;
        default:
          return false;
      }
    });
  }, [inventory]);

  const addRequerimiento = useCallback(async (requerimientoData) => {
    if (!selectedProject) return;
    setLoading(true);

    const { items, ...reqHeader } = requerimientoData;

    // Insertar el requerimiento principal
    const { data: newRequerimiento, error: reqError } = await supabase
      .from('requerimientos')
      .insert([{
        ...reqHeader,
        project_id: selectedProject.id,
        status: 'pendiente'
      }])
      .select()
      .single();

    if (reqError) {
      console.error('Error inserting requerimiento:', reqError);
      setLoading(false);
      return;
    }

    // Insertar los items del requerimiento
    const itemsToInsert = items.map(item => ({
      ...item,
      requerimiento_id: newRequerimiento.id,
      status: 'pendiente',
      cantidad_comprada: 0
    }));

    const { error: itemsError } = await supabase
      .from('requerimiento_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error inserting requerimiento items:', itemsError);
    }

    await getRequerimientos();
    setLoading(false);
  }, [selectedProject, getRequerimientos]);

  const updateRequerimientoItem = useCallback(async (itemId, updatedData) => {
    setLoading(true);
    const { error } = await supabase
      .from('requerimiento_items')
      .update(updatedData)
      .eq('id', itemId);

    if (error) {
      console.error('Error updating requerimiento item:', error);
    } else {
      await getRequerimientos();
    }
    setLoading(false);
  }, [getRequerimientos]);

  const cancelRequerimientoItem = useCallback(async (itemId) => {
    setLoading(true);
    const { error } = await supabase
      .from('requerimiento_items')
      .update({ status: 'cancelado' })
      .eq('id', itemId);

    if (error) {
      console.error('Error canceling requerimiento item:', error);
    } else {
      await getRequerimientos();
    }
    setLoading(false);
  }, [getRequerimientos]);

  const withdrawInventory = useCallback(async (withdrawalData) => {
    if (!selectedProject) return;
    setLoading(true);
    const { inventario_id, cantidad_retirada, retirado_por, observaciones } = withdrawalData;

    // Obtener el item del inventario
    const { data: item, error: itemError } = await supabase
      .from('inventario')
      .select('cantidad_disponible')
      .eq('id', inventario_id)
      .eq('project_id', selectedProject.id)
      .single();

    if (itemError) {
      console.error('Error fetching item:', itemError);
      setLoading(false);
      return;
    }


    if (item.cantidad_disponible < cantidad_retirada) {
      showToast('No hay suficiente stock para retirar.', 'error');
      setLoading(false);
      return;
    }

    // Insertar en retiros_inventario
    const { error: withdrawalError } = await supabase
      .from('retiros_inventario')
      .insert([{
        inventario_id,
        cantidad_retirada,
        retirado_por,
        observaciones,
        fecha_retiro: new Date(),
        project_id: selectedProject.id
      }]);

    if (withdrawalError) {
      console.error('Error inserting withdrawal:', withdrawalError);
      setLoading(false);
      return;
    }

    // Actualizar inventario
    const newQuantity = item.cantidad_disponible - cantidad_retirada;
    const { error: updateError } = await supabase
      .from('inventario')
      .update({ cantidad_disponible: newQuantity })
      .eq('id', inventario_id);

    if (updateError) {
      console.error('Error updating inventory:', updateError);
    } else {
      // Refrescar datos
      await getInventory();
      await getRetiros();
    }
    setLoading(false);
  }, [selectedProject, getInventory, getRetiros, showToast]);

  const addPurchase = useCallback(async (purchaseData) => {
    if (!selectedProject) return;
    setLoading(true);

    // Calcular totales
    const iva = purchaseData.aplica_iva ? parseFloat(purchaseData.precio_unitario) * parseFloat(purchaseData.cantidad) * 0.16 : 0;
    const total_bs = (parseFloat(purchaseData.precio_unitario) * parseFloat(purchaseData.cantidad)) + iva;
    const total_usd = total_bs / parseFloat(purchaseData.tasa_cambio);

    const purchasePayload = {
      ...purchaseData,
      total_bs: total_bs.toFixed(2),
      total_usd: total_usd.toFixed(2),
      iva: iva.toFixed(2),
      precio_unitario: parseFloat(purchaseData.precio_unitario).toFixed(2),
      cantidad: parseInt(purchaseData.cantidad),
      project_id: selectedProject.id
    };

    const { error: purchaseError } = await supabase
      .from('compras')
      .insert([purchasePayload]);

    if (purchaseError) {
      console.error('Error inserting purchase:', purchaseError);
      setLoading(false);
      return;
    }

    // Upsert en productos
    const { nombre_producto, categoria_producto, unidad } = purchaseData;
    const precio_unitario_usd_aprox = parseFloat(total_usd) / parseFloat(purchaseData.cantidad);

    const { error: upsertError } = await supabase
      .from('productos')
      .upsert({
        nombre_producto,
        categoria_producto,
        unidad,
        precio_unitario_usd_aprox: precio_unitario_usd_aprox.toFixed(2),
        last_updated: new Date(),
      }, { onConflict: 'nombre_producto' });

    if (upsertError) {
      console.error('Error upserting product:', upsertError);
    }

    // Verificar si existe en inventario
    const { data: existingItem, error: itemError } = await supabase
      .from('inventario')
      .select('id, cantidad_disponible')
      .eq('nombre_producto', purchaseData.nombre_producto)
      .eq('project_id', selectedProject.id)
      .single();

    if (itemError && itemError.code !== 'PGRST116') {
      console.error('Error fetching item from inventory:', itemError);
    }

    // Actualizar o insertar en inventario
    if (existingItem) {
      const newQuantity = Number(existingItem.cantidad_disponible) + Number(purchaseData.cantidad);
      const { error: updateError } = await supabase
        .from('inventario')
        .update({
          cantidad_disponible: newQuantity,
          last_updated: new Date(),
          unidad: unidad,
          precio_unitario_usd_aprox: precio_unitario_usd_aprox.toFixed(2)
        })
        .eq('id', existingItem.id);
      if (updateError) {
        console.error('Error updating inventory:', updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from('inventario')
        .insert([{
          nombre_producto: purchaseData.nombre_producto,
          categoria_producto: purchaseData.categoria_producto,
          unidad: purchaseData.unidad,
          precio_unitario_usd_aprox: precio_unitario_usd_aprox.toFixed(2),
          cantidad_disponible: purchaseData.cantidad,
          last_updated: new Date(),
          project_id: selectedProject.id
        }]);

      if (insertError) {
        console.error('Error inserting into inventory:', insertError);
      }
    }

    // Actualizar requerimientos pendientes
    const { data: pendingReqItems, error: reqItemsError } = await supabase
      .from('requerimiento_items')
      .select('id, cantidad_requerida, cantidad_comprada, requerimiento_id, status')
      .eq('nombre_producto', purchaseData.nombre_producto)
      .in('status', ['pendiente', 'en_progreso']);

    if (reqItemsError) {
      console.error('Error fetching pending requirement items:', reqItemsError);
    } else if (pendingReqItems) {
      let remainingQuantity = Number(purchaseData.cantidad);

      for (const reqItem of pendingReqItems) {
        if (remainingQuantity <= 0) break;

        const remainingToBuy = reqItem.cantidad_requerida - reqItem.cantidad_comprada;
        const purchasedAmount = Math.min(remainingQuantity, remainingToBuy);

        if (purchasedAmount > 0) {
          const newCantidadComprada = reqItem.cantidad_comprada + purchasedAmount;
          let newStatus = reqItem.status;

          if (newCantidadComprada >= reqItem.cantidad_requerida) {
            newStatus = 'completado';
          } else if (newCantidadComprada > 0) {
            newStatus = 'en_progreso';
          }

          const { error: updateReqItemError } = await supabase
            .from('requerimiento_items')
            .update({
              cantidad_comprada: newCantidadComprada,
              status: newStatus
            })
            .eq('id', reqItem.id);

          if (updateReqItemError) {
            console.error('Error updating requirement item:', updateReqItemError);
          }

          remainingQuantity -= purchasedAmount;
        }
      }
    }

    // Refrescar todos los datos
    await getInventory();
    await getCompras();
    await getProductos();
    await getRequerimientos();

    setLoading(false);
  }, [selectedProject, getInventory, getCompras, getProductos, getRequerimientos]);

  const updateCompra = useCallback(async (compraId, updatedData) => {
    if (!selectedProject) return;
    setLoading(true);

    const { id, created_at, ...updatePayload } = updatedData;
    const { error } = await supabase
      .from('compras')
      .update(updatePayload)
      .eq('id', compraId)
      .eq('project_id', selectedProject.id);

    if (error) {
      console.error('Error updating compra:', error);
    } else {
      await getCompras();
    }
    setLoading(false);
  }, [selectedProject, getCompras]);

  const updateInventoryItem = useCallback(async (itemId, updatedData) => {
    setLoading(true);
    const { error } = await supabase
      .from('inventario')
      .update(updatedData)
      .eq('id', itemId);

    if (error) {
      console.error('Error updating inventory item:', error);
    } else {
      await getInventory();
    }
    setLoading(false);
  }, [getInventory]);

  const [facturas, setFacturas] = useState([]);
  const [comprasSinFactura, setComprasSinFactura] = useState([]);

  const getFacturas = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .eq('projectId', selectedProject.id)
      .neq('status', 'deleted')
      .order('fechaFactura', { ascending: false });

    if (error) {
      console.error('Error fetching facturas:', error);
    } else {
      setFacturas(data || []);
    }
    setLoading(false);
  }, [selectedProject]);

  const getComprasSinFactura = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('compras_sin_factura')
      .select('*')
      .eq('projectId', selectedProject.id)
      .neq('status', 'deleted')
      .order('fechaCompra', { ascending: false });

    if (error) {
      console.error('Error fetching compras sin factura:', error);
    } else {
      setComprasSinFactura(data || []);
    }
    setLoading(false);
  }, [selectedProject]);

  // Cargar datos cuando se selecciona un proyecto
  useEffect(() => {
    if (selectedProject) {
      getInventory();
      getCompras();
      getRetiros();
      getProductos();
      getRequerimientos();
      getFacturas();
      getComprasSinFactura();
    } else {
      // Limpiar datos cuando no hay proyecto seleccionado
      setInventory([]);
      setCompras([]);
      setRetiros([]);
      setRequerimientos([]);
      setFacturas([]);
      setComprasSinFactura([]);
    }
  }, [selectedProject, getInventory, getCompras, getRetiros, getProductos, getRequerimientos, getFacturas, getComprasSinFactura]);

  const value = useMemo(() => ({
    inventory,
    compras,
    retiros,
    productos,
    requerimientos,
    loading,
    getInventory,
    addPurchase,
    withdrawInventory,
    updateCompra,
    getRequerimientos,
    addRequerimiento,
    updateRequerimientoItem,
    cancelRequerimientoItem,
    getInventorySummary,
    getLowStockItems,
    updateInventoryItem,
    facturas,
    comprasSinFactura,
    getFacturas,
    getComprasSinFactura,
  }), [
    inventory,
    compras,
    retiros,
    productos,
    requerimientos,
    loading,
    getInventory,
    addPurchase,
    withdrawInventory,
    updateCompra,
    getRequerimientos,
    addRequerimiento,
    updateRequerimientoItem,
    cancelRequerimientoItem,
    getInventorySummary,
    getLowStockItems,
    updateInventoryItem,
    facturas,
    comprasSinFactura,
    getFacturas,
    getComprasSinFactura,
  ]);

  return (
    <OperacionesContext.Provider value={value}>
      {children}
    </OperacionesContext.Provider>
  );
};