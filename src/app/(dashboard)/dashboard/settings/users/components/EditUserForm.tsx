import { useState, useEffect } from "react";
import { UserRole } from "@/context/auth-context";
import { createClient } from "@/lib/supabase-browser";
import { X, Loader2, AlertCircle } from "lucide-react";

interface UserRecord {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface EditUserFormProps {
    user: UserRecord;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditUserForm({ user, onClose, onSuccess }: EditUserFormProps) {
    const [role, setRole] = useState<UserRole>((user.role as UserRole) || UserRole.AUXILIAR);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Buscamos el ID del rol seleccionado
            const { data: roleData, error: dbRoleError } = await supabase
                .from('roles')
                .select('id')
                .eq('name', role)
                .single();

            if (dbRoleError || !roleData) {
                throw new Error("No se pudo encontrar el rol seleccionado en la base de datos.");
            }

            // Actualizamos el rol del usuario en la tabla user_roles
            const { error: updateError } = await supabase
                .from('user_roles')
                .update({ role_id: roleData.id })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            onSuccess();
        } catch (err: any) {
            setError(err.message || "Error al actualizar el rol del usuario.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Editar Rol de Usuario
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Usuario seleccionado:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nuevo Rol de Acceso
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                            >
                                <option value={UserRole.AUXILIAR}>Auxiliar Contable</option>
                                <option value={UserRole.CONTADOR_PRINCIPAL}>Contador Principal</option>
                                <option value={UserRole.ADMIN_EMPRESA}>Admin de Empresa</option>
                                <option value={UserRole.SUPER_ADMIN}>SuperAdministrador</option>
                            </select>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 flex justify-center items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
