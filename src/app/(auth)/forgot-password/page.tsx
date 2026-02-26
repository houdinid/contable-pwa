"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Mail, CheckCircle, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || "Ha ocurrido un error al intentar enviar el correo de recuperación.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Recuperar Contraseña
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700">

                    {isSubmitted ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">¡Revisa tu correo!</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Hemos enviado un enlace de recuperación a <b>{email}</b>. Haz clic en el enlace del correo para crear una nueva contraseña.
                            </p>
                            <Link href="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium text-sm flex items-center justify-center gap-2">
                                <ArrowLeft size={16} /> Volver al Login
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleReset}>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                Ingresa el correo electrónico asociado a tu cuenta y te enviaremos instrucciones para restaurar tu contraseña.
                            </p>

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
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 sm:text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-11 transition-colors"
                                        placeholder="tu@correo.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Enlace"
                                )}
                            </button>

                            <div className="text-center mt-4">
                                <Link href="/login" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm font-medium">
                                    Cancelar y volver
                                </Link>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
