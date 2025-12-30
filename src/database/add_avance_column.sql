-- Migration to add 'avance' column for tracking percentage progress
ALTER TABLE plan_actividades 
ADD COLUMN IF NOT EXISTS avance DECIMAL(5, 2) DEFAULT 0 CHECK (avance >= 0 AND avance <= 100);

-- Update existing records: 
-- If 'completada' -> 100%
-- If 'en_progreso' -> 50% (initial estimate)
-- If 'pendiente' -> 0%
UPDATE plan_actividades SET avance = 100 WHERE estado = 'completada';
UPDATE plan_actividades SET avance = 50 WHERE estado = 'en_progreso';
UPDATE plan_actividades SET avance = 0 WHERE estado = 'pendiente';
