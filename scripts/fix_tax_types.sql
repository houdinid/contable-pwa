-- ==========================================================
-- SOLUCIÓN AL ERROR: Tabla 'tax_types' no encontrada
-- ==========================================================
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase

-- 1. Crear la tabla de tipos de impuestos (Modulo 6)
CREATE TABLE IF NOT EXISTS public.tax_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Asegurar que la tabla de obligaciones tenga la columna 'completed'
-- (Si ya existe, la ignorará)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tax_deadlines' AND column_name='completed') THEN
        ALTER TABLE public.tax_deadlines ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Habilitar RLS y crear políticas de acceso total (igual que el resto de tus tablas)
ALTER TABLE public.tax_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.tax_types;
CREATE POLICY "Allow all access" ON public.tax_types FOR ALL USING (true) WITH CHECK (true);

-- Asegurar políticas para tax_deadlines también
ALTER TABLE public.tax_deadlines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.tax_deadlines;
CREATE POLICY "Allow all access" ON public.tax_deadlines FOR ALL USING (true) WITH CHECK (true);
