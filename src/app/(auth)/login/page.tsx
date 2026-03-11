"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, AlertCircle } from "lucide-react";
import { useEffect } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { checkSession, isAuthenticated, isMfaRequired, isMfaVerified, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    // Si el usuario ya está autenticado, la redirección al dashboard o MFA
    // ahora se maneja más suavemente o desde el layout para evitar bucles de renderizado
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
           console.log("LoginPage: Usuario ya autenticado, redirigiendo...");
           if (isMfaRequired && !isMfaVerified) {
                router.replace("/mfa");
            } else if (!isMfaRequired || isMfaVerified) {
                router.replace("/dashboard");
            }
        }
    }, [isAuthenticated, authLoading, isMfaRequired, isMfaVerified, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            console.log("LoginPage: Attempting signInWithPassword...");
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.error("LoginPage: signInError:", signInError);
                throw signInError;
            }
            console.log("LoginPage: signInWithPassword success, user:", data.user?.id);

            // Successfully logged in
            console.log("LoginPage: Calling checkSession...");
            await checkSession();
            console.log("LoginPage: checkSession completed.");
            // La redirección se maneja en el useEffect arriba basado en el estado del contexto
        } catch (err: any) {
            console.error("LoginPage: handleLogin caught error:", err);
            setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
        } finally {
            console.log("LoginPage: handleLogin finally block.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-indigo-600 p-3 rounded-xl shadow-lg ring-1 ring-black/5">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Contable PWA
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Inicia sesión para acceder a tu panel
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Correo Electrónico
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 sm:text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-11 transition-colors"
                                    placeholder="tu@correo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Contraseña
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 sm:text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-11 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <a
                                    href="/forgot-password"
                                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
