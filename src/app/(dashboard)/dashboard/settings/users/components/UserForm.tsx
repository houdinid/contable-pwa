"use client";

import { useState } from "react";
import { UserRole } from "@/context/auth-context";
import { createClient } from "@/lib/supabase-browser";
import { X, Loader2, AlertCircle } from "lucide-react";

interface UserFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function UserForm({ onClose, onSuccess }: UserFormProps) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState<UserRole>(UserRole.AUXILIAR_CONTABLE);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // 1. We invite the user via Supabase Auth
            // Nota: Esto envía correo automáticamente (Magic Link de Invitación).
            // Si el entorno limita el acceso web a admin auth API desde cliente, 
            // esto requeriría un Server Action / API Route con el Service_Role_Key.
            const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
                data: { name } // custom user metadata
            });

            if (authError) {
                // Fallback manual si estamos usando supabase puro desde el PWA
                // Idealmente esto se moverá a un backend/Server Action para evitar problemas de CORS/Admin API en cliente
                throw authError;
            }

            const newUserId = authData.user.id;

            // 2. We assign the corresponding RBAC Role

            const { data: roleData } = await supabase.from('roles').select('id').eq('name', role).single();

            if (roleData) {
                // El Trigger handle_new_user ya le puso Auxiliar Contable por defecto.
                // Lo actualizamos al rol seleccionado:
                const { error: roleError } = await supabase
                    .from('user_roles')
                    .update({ role_id: roleData.id })
                    .eq('user_id', newUserId);

                if (roleError) throw roleError;
            }

            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al invitar al usuario. Puede que requieras privilegios de backend Service Role.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invitar Usuario</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                                placeholder="Ej. Ana Pérez"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Correo Electrónico *
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                                placeholder="ana@empresa.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rol del Sistema *
                            </label>
                            <select
                                required
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                            >
                                {Object.values(UserRole).map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Determina a qué módulos y botones (crear/borrar) tendrá acceso.
                            </p>
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="user-form"
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Invitar Usuario"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
