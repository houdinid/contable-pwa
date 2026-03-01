"use client";

import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/context/auth-context";
import { createClient } from "@/lib/supabase-browser";
import { UserForm } from "./components/UserForm";
import { EditUserForm } from "./components/EditUserForm";
import { Shield, Plus, MailOpen, Lock, Search, AlertCircle, Loader2, Trash2 } from "lucide-react";

interface UserRecord {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    is_mfa_enabled?: boolean;
}

interface UserRoleItem {
    user_id: string;
    created_at: string;
    roles: { name: string } | null | { name: string }[];
}

export default function UsersSettingsPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserRecord | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const supabase = createClient();

    const fetchUsers = async () => {
        setIsLoading(true);
        setError("");
        try {
            // 1. Get user profiles & roles (Joined query)
            const { data, error: dbError } = await supabase
                .from('user_roles')
                .select(`
          user_id,
          created_at,
          roles ( name )
        `);

            if (dbError) throw dbError;

            // Nota: Supabase bloquea listar `auth.users` desde el cliente por seguridad.
            // Aquí deberemos hacer una llamada a una RPC (Server function) si queremos emails
            // O para propósitos de la demo, usaremos la metadata si la exponemos en una tabla 'profiles'
            // Por ahora para este prototipo usaremos solo la info en `user_roles`
            // y simularemos la vista o construiremos un perfil básico.

            // IDEAL: Se debe construir una tabla auth.users_public o profile sincronizada.
            // Como workaround MVP, mostraremos el ID de usuario y Rol por ahora.
            const mappedUsers = (data as unknown as UserRoleItem[]).map((item) => {
                // Handle case where roles might be an array or object due to Supabase join typing
                const roleName = Array.isArray(item.roles)
                    ? item.roles[0]?.name
                    : item.roles?.name;

                return {
                    id: item.user_id,
                    email: `Usuario ${item.user_id.slice(0, 5)}...`, // Mocked for now without Admin API
                    name: "Usuario del Sistema",
                    role: roleName || "Sin Rol",
                    created_at: item.created_at
                };
            });

            setUsers(mappedUsers);
        } catch (err: any) {
            setError(err.message || "Error al cargar la lista de usuarios.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === UserRole.SUPER_ADMIN) {
            fetchUsers();
        }
    }, [user]);

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este usuario? Esto revocará su acceso al sistema.")) return;

        try {
            // First we delete their role assignment to keep DB clean
            const { error: roleError } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', userId);

            if (roleError) throw roleError;

            // Note: Currently we don't have an Admin API route to fully delete from auth.users
            // deleting from user_roles will effectively block their access via RLS.
            // A full deletion requires a Server Action using Service Role Key.

            fetchUsers();

        } catch (err: any) {
            setError(err.message || "Error al eliminar el usuario");
        }
    };

    if (user?.role !== UserRole.SUPER_ADMIN) {
        return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 max-w-3xl mx-auto mt-8">
                <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Acceso Denegado</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
                    Solo los SuperAdministradores pueden gestionar usuarios y permisos del sistema.
                </p>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-red-100 dark:border-red-900/50 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Diagnóstico de tu cuenta
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tu ID de Usuario (auth.users)</p>
                            <p className="font-mono text-sm break-all">{user?.id || 'No disponible'}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tu Rol Actual (user_roles)</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{user?.role || 'No disponible'}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900/30">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">¿Cómo solucionar esto?</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                            Para ver esta página, necesitas ser "SuperAdministrador" en tu base de datos Supabase. <br />
                            Abre el <strong>SQL Editor</strong> en tu panel de Supabase y ejecuta el siguiente comando:
                        </p>
                        <pre className="bg-white dark:bg-gray-900 p-3 rounded border border-blue-100 dark:border-blue-800/50 text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto select-all">
                            {`-- 1. Copia este script y ejecútalo en el SQL Editor de Supabase
UPDATE public.user_roles 
SET role_id = (SELECT id FROM public.roles WHERE name = 'SuperAdministrador') 
WHERE user_id = '${user?.id || 'TU_USER_ID_AQUI'}';`}
                        </pre>
                    </div>
                </div>
            </div>
        );
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-indigo-600 dark:text-indigo-400" />
                        Gestión de Usuarios y Roles
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Administra los accesos y niveles de permisos (RBAC).
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
                >
                    <Plus size={18} />
                    Invitar Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por correo o rol..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol en el Sistema</th>
                                <th className="px-6 py-4">Seguridad</th>
                                <th className="px-6 py-4">Agregado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                                                    <div className="text-gray-500 dark:text-gray-400 text-xs">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${u.role === UserRole.SUPER_ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' :
                                                    u.role === UserRole.CONTADOR_PRINCIPAL ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                                        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}
                      `}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.is_mfa_enabled ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                                                {u.is_mfa_enabled ? <Lock size={14} /> : <AlertCircle size={14} />}
                                                {u.is_mfa_enabled ? '2FA Activo' : 'Pendiente 2FA'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => setSelectedUserForEdit(u)}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm transition-colors"
                                                >
                                                    Editar Rol
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                    title="Eliminar acceso"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showInviteModal && (
                <UserForm
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {
                        setShowInviteModal(false);
                        fetchUsers();
                    }}
                />
            )}

            {selectedUserForEdit && (
                <EditUserForm
                    user={selectedUserForEdit}
                    onClose={() => setSelectedUserForEdit(null)}
                    onSuccess={() => {
                        setSelectedUserForEdit(null);
                        fetchUsers();
                    }}
                />
            )}
        </div>
    );
}
