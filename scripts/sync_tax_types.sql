-- ==========================================================
-- CORRECCIÓN DEFINITIVA de 'tax_types' para Sincronización
-- ==========================================================

-- 1. Añadir la columna user_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tax_types' AND column_name='user_id') THEN
        ALTER TABLE public.tax_types ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Eliminar restricción UNIQUE antigua que impedía que varios usuarios usaran el mismo nombre
ALTER TABLE public.tax_types DROP CONSTRAINT IF EXISTS tax_types_name_key;

-- 3. Crear restricción UNIQUE compuesta (nombre + usuario)
-- Esto permite que dos usuarios diferentes tengan "IVA", pero un mismo usuario no lo repita
ALTER TABLE public.tax_types DROP CONSTRAINT IF EXISTS tax_types_name_user_id_key;
ALTER TABLE public.tax_types ADD CONSTRAINT tax_types_name_user_id_key UNIQUE (name, user_id);

-- 4. Actualizar políticas de RLS para que el usuario sea dueño de sus propios tipos
ALTER TABLE public.tax_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.tax_types;
DROP POLICY IF EXISTS "Enable read for all" ON public.tax_types;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.tax_types;

CREATE POLICY "Users can only view their own tax types" ON public.tax_types
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own tax types" ON public.tax_types
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own tax types" ON public.tax_types
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own tax types" ON public.tax_types
    FOR DELETE USING (auth.uid() = user_id);
