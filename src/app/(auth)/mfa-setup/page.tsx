"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/context/auth-context";
import { ShieldAlert, AlertCircle, Loader2 } from "lucide-react";

export default function MfaVerificationPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [factorId, setFactorId] = useState("");
    const router = useRouter();
    const supabase = createClient();
    const { checkSession } = useAuth();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) { router.push("/login"); return; }
            const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (mfaData?.currentLevel === 'aal2') { router.push("/dashboard"); return; }
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) { setError("Error cargando factores."); return; }
            const totpFactor = data.totp[0];
            if (!totpFactor) { router.push("/mfa-setup"); return; }
            setFactorId(totpFactor.id);
        };
        checkUser();
    }, [router, supabase]);

    const verifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId) return;

        setIsLoading(true);
        setError("");
        setStatus("Iniciando...");

        // Tiempo máximo de espera: 15 segundos
        const withTimeout = (promise: Promise<any>, msg: string) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Tiempo agotado: ${msg}`)), 15000)
                )
            ]);
        };

        try {
            setStatus("Conectando...");
            const challenge = await withTimeout(
                supabase.auth.mfa.challenge({ factorId }),
                "Solicitando permiso a Supabase"
            ) as any;

            if (challenge.error) throw new Error(challenge.error.message);

            const challengeId = challenge.data.id;
            setStatus("Verificando código...");

            const verify = await withTimeout(
                supabase.auth.mfa.verify({ factorId, challengeId, code }),
                "Validando con Supabase"
            ) as any;

            if (verify.error) throw new Error(verify.error.message);

            setStatus("Sincronizando...");
            await checkSession();

            setStatus("Entrando...");
            window.location.href = "/dashboard";

        } catch (err: any) {
            console.error("MFA Error:", err);
            if (err.message.includes("Tiempo agotado")) {
                setError("El navegador bloqueó la conexión. Cierra todas las pestañas de la app e intenta de nuevo o usa Modo Incógnito.");
            } else {
                setError(err.message || "Error al verificar código.");
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center">
                    <div className="bg-orange-500 p-3 rounded-xl shadow-lg ring-1 ring-black/5">
                        <ShieldAlert className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Doble Factor (2FA)</h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700">
                    <form className="space-y-6" onSubmit={verifyCode}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md flex items-start text-red-700 dark:text-red-400">
                                <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            className="block w-full text-center text-3xl tracking-[0.5em] font-mono rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-orange-500 focus:border-orange-500 h-16"
                            placeholder="------"
                        />

                        <button
                            type="submit"
                            disabled={isLoading || code.length !== 6 || !factorId}
                            className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {status}</>
                            ) : "Verificar y Entrar"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
