-- SCHEMA RESTORATION FOR PLANNING & EXECUTION MODULES

-- 1. Weeks Management (Planificación de Semanas)
CREATE TABLE plan_semanas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL, -- Link to 'projects' table (assumed exists)
    numero_semana INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    monto_planificado DECIMAL(15, 2) DEFAULT 0,
    monto_ejecutado DECIMAL(15, 2) DEFAULT 0,
    monto_requerimientos DECIMAL(15, 2) DEFAULT 0,
    estado TEXT DEFAULT 'borrador', -- 'borrador', 'planificada', 'en_curso', 'finalizada'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, numero_semana)
);

-- 2. Days Management (Días de Planificación)
CREATE TABLE plan_dias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    semana_id UUID REFERENCES plan_semanas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    monto_planificado DECIMAL(15, 2) DEFAULT 0,
    monto_ejecutado DECIMAL(15, 2) DEFAULT 0,
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'trabajado', 'no_laborable'
    cantidad_actividades INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(semana_id, fecha)
);

-- 3. Activities (Actividades - Main Planning Unit)
CREATE TABLE plan_actividades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dia_id UUID REFERENCES plan_dias(id) ON DELETE CASCADE,
    
    -- Description and Scope
    descripcion TEXT NOT NULL,
    
    -- Link to Budget (Partida)
    -- Assuming a 'presupuesto_items' table exists based on context, otherwise loosen to UUID
    partida_id UUID, 
    nombre_partida TEXT, -- Store name for easier display/history
    
    -- Planning Metrics
    unidad_medida TEXT, 
    cantidad_programada DECIMAL(15, 2) DEFAULT 0,
    precio_unitario DECIMAL(15, 2) DEFAULT 0,
    monto_programado DECIMAL(15, 2) GENERATED ALWAYS AS (cantidad_programada * precio_unitario) STORED,
    
    -- Execution Tracking
    fecha_inicio_real TIMESTAMP WITH TIME ZONE,
    fecha_fin_real TIMESTAMP WITH TIME ZONE,
    
    -- Status Management
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'en_progreso', 'completada'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Subactivities (Subactividades - Checklist)
-- These are the fine-grained tasks within a main activity
CREATE TABLE plan_subactividades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    actividad_id UUID REFERENCES plan_actividades(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    completada BOOLEAN DEFAULT FALSE,
    fecha_completado TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Personnel Assignment (Personal en Actividad)
-- Junction table for assigning multiple personnel to an activity
CREATE TABLE plan_actividad_personal (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    actividad_id UUID REFERENCES plan_actividades(id) ON DELETE CASCADE,
    personal_id UUID, -- Link to 'personal' or 'equipos' table
    nombre_personal TEXT, -- Store name for history/display optimization
    rol_en_actividad TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Link Requirements to Weeks (Optional but recommended integration)
-- Add a column to the existing 'requerimientos' table if possible, 
-- or use this junction table if modifying 'requerimientos' is difficult.
-- For now, assuming we might need to add 'semana_id' to 'requerimientos' manually.
-- ALTER TABLE requerimientos ADD COLUMN semana_id UUID REFERENCES plan_semanas(id);

