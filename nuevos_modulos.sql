-- ==========================================
-- SCRIPT DE MIGRACIÓN: NUEVOS MÓDULOS (INFRAESTRUCTURA & ADMINISTRACIÓN)
-- ==========================================
-- 1. Accesos Remotos
CREATE TABLE IF NOT EXISTS public.remote_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.contacts(id) ON DELETE
    SET NULL,
        software_type TEXT NOT NULL,
        connection_code TEXT NOT NULL,
        password TEXT,
        hostname TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Políticas RLS para remote_access
ALTER TABLE public.remote_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON public.remote_access FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.remote_access FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.remote_access FOR
UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.remote_access FOR DELETE USING (auth.role() = 'authenticated');
-- 2. Licencias Antivirus
CREATE TABLE IF NOT EXISTS public.antivirus_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.contacts(id) ON DELETE
    SET NULL,
        license_name TEXT NOT NULL,
        product_key TEXT,
        start_date DATE,
        expiration_date DATE,
        device_limit INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Políticas RLS para antivirus_licenses
ALTER TABLE public.antivirus_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON public.antivirus_licenses FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.antivirus_licenses FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.antivirus_licenses FOR
UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.antivirus_licenses FOR DELETE USING (auth.role() = 'authenticated');
-- 3. Equipos Antivirus (Relación 1 a N)
CREATE TABLE IF NOT EXISTS public.antivirus_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES public.antivirus_licenses(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Políticas RLS para antivirus_devices
ALTER TABLE public.antivirus_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON public.antivirus_devices FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.antivirus_devices FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.antivirus_devices FOR
UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.antivirus_devices FOR DELETE USING (auth.role() = 'authenticated');
-- 4. Correos Corporativos
CREATE TABLE IF NOT EXISTS public.corporate_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_address TEXT NOT NULL,
    password TEXT,
    assigned_to TEXT,
    recovery_phone TEXT,
    recovery_email TEXT,
    client_id UUID REFERENCES public.contacts(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Políticas RLS para corporate_emails
ALTER TABLE public.corporate_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON public.corporate_emails FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.corporate_emails FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.corporate_emails FOR
UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.corporate_emails FOR DELETE USING (auth.role() = 'authenticated');
-- 5. Licencias de Software (General)
CREATE TABLE IF NOT EXISTS public.software_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    software_type TEXT NOT NULL,
    product_key TEXT,
    purchase_date DATE,
    assigned_to TEXT,
    client_id UUID REFERENCES public.contacts(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Políticas RLS para software_licenses
ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON public.software_licenses FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.software_licenses FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.software_licenses FOR
UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.software_licenses FOR DELETE USING (auth.role() = 'authenticated');
-- 6. Obligaciones Fiscales
CREATE TABLE IF NOT EXISTS public.tax_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    tax_type TEXT NOT NULL,
    expiration_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Políticas RLS para tax_deadlines
ALTER TABLE public.tax_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users" ON public.tax_deadlines FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.tax_deadlines FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.tax_deadlines FOR
UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.tax_deadlines FOR DELETE USING (auth.role() = 'authenticated');