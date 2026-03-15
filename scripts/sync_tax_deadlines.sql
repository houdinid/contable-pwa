-- ==========================================================
-- PRIVATIZACIÓN de 'tax_deadlines' para Multi-usuario
-- ==========================================================

-- 1. Añadir la columna user_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tax_deadlines' AND column_name='user_id') THEN
        ALTER TABLE public.tax_deadlines ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Habilitar RLS
ALTER TABLE public.tax_deadlines ENABLE ROW LEVEL SECURITY;

-- 3. Actualizar políticas de RLS
DROP POLICY IF EXISTS "Allow all access" ON public.tax_deadlines;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.tax_deadlines;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tax_deadlines;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.tax_deadlines;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.tax_deadlines;

CREATE POLICY "Users can only view their own deadlines" ON public.tax_deadlines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own deadlines" ON public.tax_deadlines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own deadlines" ON public.tax_deadlines
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own deadlines" ON public.tax_deadlines
    FOR DELETE USING (auth.uid() = user_id);
