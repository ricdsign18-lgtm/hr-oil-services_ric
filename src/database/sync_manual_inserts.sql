-- SCRIPT TO SYNC MANUALLY INSERTED PURCHASES TO INVENTORY AND PRODUCTS
-- Target Project: 0a311e1a-a26f-480f-b2f4-4650f4357cbe
-- Target Date Range: 2025-11-27 to 2025-12-17
-- Revision: 2 (Fixed ID type to BIGINT)

DO $$
DECLARE
    r RECORD;
    target_project_id UUID := '0a311e1a-a26f-480f-b2f4-4650f4357cbe';
    unit_price_usd NUMERIC;
    -- Changed from UUID to BIGINT as error suggests 'id' is numeric (e.g. "26")
    existing_inventory_id BIGINT; 
    processed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting sync for project %...', target_project_id;

    -- Iterate over the purchases in the specified range
    FOR r IN 
        SELECT * FROM public.compras 
        WHERE project_id = target_project_id 
          AND fecha_compra >= '2025-11-27' 
          AND fecha_compra <= '2025-12-17'
    LOOP
        -- 1. Calculate Unit Price USD
        IF r.cantidad > 0 AND r.total_usd > 0 THEN
            unit_price_usd := r.total_usd / r.cantidad;
        ELSE
            unit_price_usd := 0;
        END IF;

        -- 2. Upsert into PRODUCTOS
        INSERT INTO public.productos (
            nombre_producto, 
            categoria_producto, 
            unidad, 
            precio_unitario_usd_aprox, 
            last_updated
        ) VALUES (
            r.nombre_producto,
            r.categoria_producto,
            r.unidad,
            unit_price_usd,
            NOW()
        )
        ON CONFLICT (nombre_producto) 
        DO UPDATE SET 
            precio_unitario_usd_aprox = EXCLUDED.precio_unitario_usd_aprox,
            last_updated = NOW();

        -- 3. Update or Insert into INVENTARIO
        -- Check if item exists in inventory for this project
        -- Reset variable in loop
        existing_inventory_id := NULL;
        
        SELECT id INTO existing_inventory_id 
        FROM public.inventario 
        WHERE project_id = target_project_id 
          AND nombre_producto = r.nombre_producto;

        IF existing_inventory_id IS NOT NULL THEN
            -- Update existing inventory
            UPDATE public.inventario
            SET 
                cantidad_disponible = cantidad_disponible + r.cantidad,
                last_updated = NOW(),
                unidad = r.unidad,
                precio_unitario_usd_aprox = unit_price_usd
            WHERE id = existing_inventory_id;
            
            RAISE NOTICE 'Updated inventory for: % (+%)', r.nombre_producto, r.cantidad;
        ELSE
            -- Insert new inventory record
            INSERT INTO public.inventario (
                project_id,
                nombre_producto,
                categoria_producto,
                unidad,
                cantidad_disponible,
                precio_unitario_usd_aprox,
                last_updated
            ) VALUES (
                target_project_id,
                r.nombre_producto,
                r.categoria_producto,
                r.unidad,
                r.cantidad,
                unit_price_usd,
                NOW()
            );
            
            RAISE NOTICE 'Created new inventory item for: % (Qty: %)', r.nombre_producto, r.cantidad;
        END IF;

        processed_count := processed_count + 1;
    END LOOP;

    RAISE NOTICE 'Sync completed. Processed % records.', processed_count;
END $$;
