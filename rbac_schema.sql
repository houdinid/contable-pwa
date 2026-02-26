-- 1. Tabla de Roles
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    -- Ej: 'SuperAdministrador', 'Contador Principal', 'Auxiliar Contable', 'Auditor'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Tabla de Módulos (Recursos protegidos)
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    -- Ej: 'usuarios', 'ventas', 'compras', 'tesoreria', 'inventario', 'reportes', 'configuracion'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. Matriz de Permisos (RBAC)
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, module_id)
);
-- 4. Asignación de Roles a Usuarios de Supabase
-- Nota: auth.users es la tabla nativa de Supabase Auth
-- 4. Asignación de Roles a Usuarios de Supabase
-- Nota: auth.users es la tabla nativa de Supabase Auth
CREATE TABLE public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE
    SET NULL,
        assigned_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 5. Trigger para asignar rol por defecto (Auxiliar Contable) al nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
DECLARE default_role_id uuid;
BEGIN -- Buscar el ID del rol 'Auxiliar Contable' (el más restrictivo por defecto, o 'Auditor')
SELECT id INTO default_role_id
FROM public.roles
WHERE name = 'Auxiliar Contable'
LIMIT 1;
IF default_role_id IS NOT NULL THEN
INSERT INTO public.user_roles (user_id, role_id)
VALUES (new.id, default_role_id);
END IF;
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger que se dispara después de insertar en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Habilitar Row Level Security (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- Políticas de Seguridad (RLS) - Todos los usuarios autenticados pueden leer (SELECT) su configuración
CREATE POLICY "Allow authenticated read access on roles" ON public.roles FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access on modules" ON public.modules FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access on permissions" ON public.permissions FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access on user_roles" ON public.user_roles FOR
SELECT TO authenticated USING (true);
-- Solo SuperAdministradores pueden modificar estas tablas (Inserción/Actualización/Borrado)
-- Esta es una política básica, la complejidad real se manejará en el backend/middleware validando el rol
CREATE POLICY "Allow superadmins full access on roles" ON public.roles FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
            AND r.name = 'SuperAdministrador'
    )
);
CREATE POLICY "Allow superadmins full access on modules" ON public.modules FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
            AND r.name = 'SuperAdministrador'
    )
);
CREATE POLICY "Allow superadmins full access on permissions" ON public.permissions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
            AND r.name = 'SuperAdministrador'
    )
);
CREATE POLICY "Allow superadmins full access on user_roles" ON public.user_roles FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
            AND r.name = 'SuperAdministrador'
    )
);
-- Insertar roles iniciales
INSERT INTO public.roles (name, description)
VALUES (
        'SuperAdministrador',
        'Acceso total. El único que puede crear otros usuarios y asignar roles.'
    ),
    (
        'Contador Principal',
        'Acceso a todos los módulos operativos. Puede aprobar o revertir transacciones.'
    ),
    (
        'Auxiliar Contable',
        'Permisos limitados a lectura e inserción (solo puede crear registros diarios, no borrar).'
    ),
    (
        'Auditor',
        'Solo lectura. Puede ver todos los reportes, cuadros de mando y dashboards financieros sin capacidad de edición.'
    ) ON CONFLICT (name) DO NOTHING;
-- Insertar módulos iniciales (rutas principales del sistema)
INSERT INTO public.modules (name, description)
VALUES (
        'usuarios',
        'Gestión de usuarios, roles y permisos.'
    ),
    ('ventas', 'Cotizaciones, facturas, clientes.'),
    ('compras', 'Gastos, proveedores.'),
    ('tesoreria', 'Bancos, cajas, pagos, recibos.'),
    (
        'inventario',
        'Productos, categorías, movimientos.'
    ),
    (
        'servicios',
        'Órdenes de servicio, WiFi, Antivirus.'
    ),
    (
        'reportes',
        'Balances, estados financieros, cuadros de mando.'
    ),
    ('configuracion', 'Ajustes del sistema.') ON CONFLICT (name) DO NOTHING;
-- Función de conveniencia para asignar el rol de SuperAdmin al primer usuario (si es necesario por consola SQL)
-- UPDATE public.user_roles SET role_id = (SELECT id FROM public.roles WHERE name = 'SuperAdministrador') WHERE user_id = 'UUID_DEL_USUARIO';