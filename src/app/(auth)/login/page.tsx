"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { checkSession, isAuthenticated, isMfaRequired, isMfaVerified, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const hasRedirected = useRef(false); // Guard to prevent multiple redirects

    // Si el usuario ya está autenticado (ej. vuelve a /login con sesión activa), redirigir UNA sola vez
    useEffect(() => {
        if (hasRedirected.current) return; // Ya se redirigió, no hacer nada más
        if (!authLoading && isAuthenticated) {
            hasRedirected.current = true;
            console.log("LoginPage: Usuario ya autenticado, redirigiendo a dashboard con recarga completa...");
            window.location.href = "/dashboard";
        }
    }, [isAuthenticated, authLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hasRedirected.current) return; // Evitar doble submit
        setError("");
        setIsLoading(true);

        const cleanEmail = email.trim();

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
            });

            if (signInError) throw signInError;

            // MFA DESACTIVADO A PETICIÓN DEL USUARIO
            // Redirigir directamente al dashboard sin comprobar o exigir factores AAL2
            
            hasRedirected.current = true; // Marcar que ya vamos a redirigir
            window.location.href = "/dashboard";
            
        } catch (err: any) {
            hasRedirected.current = false; // Reset si hay error
            console.error("LoginPage: handleLogin error:", err);
            setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center">
                    <div className="bg-indigo-600 p-3 rounded-xl shadow-lg ring-1 ring-black/5">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                    Contable PWA
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Inicia sesión para acceder a tu panel
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md flex items-start text-red-700 dark:text-red-400">
                                <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                    className="block w-full pl-10 sm:text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-11"
                                    placeholder="tu@correo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" title="Tips: Revisa si la primera letra está en mayúscula" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 sm:text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-11"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
