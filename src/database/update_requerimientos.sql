-- Agrega la columna semana_id a la tabla requerimientos para vincularla con la planificación
ALTER TABLE requerimientos 
ADD COLUMN semana_id UUID REFERENCES plan_semanas(id) ON DELETE SET NULL;
