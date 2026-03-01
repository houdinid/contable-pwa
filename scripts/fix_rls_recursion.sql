-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Allow superadmins full access on roles" ON public.roles;
DROP POLICY IF EXISTS "Allow superadmins full access on modules" ON public.modules;
DROP POLICY IF EXISTS "Allow superadmins full access on permissions" ON public.permissions;
DROP POLICY IF EXISTS "Allow superadmins full access on user_roles" ON public.user_roles;
-- Create a security definer function to check if the current user is a SuperAdministrador
-- The security definer skips RLS checks inside the function, thus preventing infinite recursion!
CREATE OR REPLACE FUNCTION public.is_superadmin() RETURNS BOOLEAN AS $$
DECLARE is_admin BOOLEAN;
BEGIN
SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
            AND r.name = 'SuperAdministrador'
    ) INTO is_admin;
RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Recreate policies using the new helper function
CREATE POLICY "Allow superadmins full access on roles" ON public.roles FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Allow superadmins full access on modules" ON public.modules FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Allow superadmins full access on permissions" ON public.permissions FOR ALL TO authenticated USING (public.is_superadmin());
CREATE POLICY "Allow superadmins full access on user_roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_superadmin());