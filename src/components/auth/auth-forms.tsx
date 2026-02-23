"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function PinForm() {
    const router = useRouter();
    const { login, register, hasPin, isLoading, isAuthenticated, resetPin } = useAuth();
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // If already authenticated, we should ideally redirect, but handle that in useEffect or layout logic.
    // For now, let's focus on the form.

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (hasPin) {
                const success = await login(pin);
                if (!success) {
                    setError("PIN incorrecto");
                } else {
                    router.push("/dashboard");
                }
            } else {
                if (pin.length < 4) {
                    setError("El PIN debe tener al menos 4 dígitos");
                    setLoading(false);
                    return;
                }
                if (pin !== confirmPin) {
                    setError("Los PIN no coinciden");
                    setLoading(false);
                    return;
                }
                await register(pin);
            }
        } catch (err) {
            setError("Ocurrió un error");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 transition-colors">
            <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8 border border-border">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Contable PWA
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {hasPin ? "Ingresa tu PIN de seguridad" : "Configura tu PIN de acceso"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PIN</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full px-4 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                            placeholder="****"
                            inputMode="numeric"
                        />
                    </div>

                    {!hasPin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar PIN</label>
                            <input
                                type="password"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                className="w-full px-4 py-2 border border-border bg-background rounded-lg text-foreground focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                                placeholder="****"
                                inputMode="numeric"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !pin}
                        className="w-full py-3 px-4 bg-indigo-600 dark:bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {loading ? "Procesando..." : (hasPin ? "Acceder" : "Crear PIN")}
                    </button>

                    {hasPin && (
                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm("¿Seguro que deseas restablecer el PIN? Deberás crear uno nuevo para ingresar.")) {
                                        resetPin();
                                    }
                                }}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
                            >
                                ¿Olvidaste tu PIN? Restablecer
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
