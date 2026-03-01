"use server";

import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@/context/auth-context";

// Se inicializa el cliente con la "Service Role Key" para bypassear RLS.
// Esto solo corre en el servidor, por lo que la clave secreta nunca llega al navegador.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function inviteUserAction(email: string, name: string, role: UserRole) {
    try {
        // 1. Invitar al usuario usando the Admin Auth API de Supabase
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { name } // custom user metadata
        });

        if (authError) throw authError;

        const newUserId = authData.user.id;

        // 2. Asignar el Rol RBAC correspondiente
        const { data: roleData } = await supabaseAdmin.from('roles').select('id').eq('name', role).single();

        if (roleData) {
            const { error: roleError } = await supabaseAdmin
                .from('user_roles')
                .update({ role_id: roleData.id })
                .eq('user_id', newUserId);

            if (roleError) throw roleError;
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error al invitar usuario:", error);
        return { success: false, error: error.message || "Fallo interno al invitar usuario." };
    }
}
