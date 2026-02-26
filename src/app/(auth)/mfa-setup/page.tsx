"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/context/auth-context";
import { QRCodeSVG } from "qrcode.react";
import { ShieldAlert, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function MfaSetupPage() {
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [factorId, setFactorId] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingUp, setIsSettingUp] = useState(true);

    const router = useRouter();
    const supabase = createClient();
    const { checkSession, supabaseUser } = useAuth();

    useEffect(() => {
        // Generate MFA Secret when the page loads
        const setupMfa = async () => {
            try {
                const { data, error } = await supabase.auth.mfa.enroll({
                    factorType: 'totp',
                });

                if (error) throw error;

                setFactorId(data.id);
                setQrCode(data.totp.uri);
                setSecret(data.totp.secret);
            } catch (err: any) {
                setError(err.message || "Error al generar la configuración de 2FA.");
            } finally {
                setIsSettingUp(false);
            }
        };

        if (supabaseUser) {
            setupMfa();
        } else {
            // En caso de recargar la página directamente
            router.push("/login");
        }
    }, [supabaseUser, supabase, router]);

    const verifySetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId) return;

        setIsLoading(true);
        setError("");

        try {
            const challenge = await supabase.auth.mfa.challenge({ factorId });
            if (challenge.error) throw challenge.error;

            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code
            });

            if (verify.error) throw verify.error;

            // Successfully enrolled and verified
            await checkSession();
            router.push("/dashboard");

        } catch (err: any) {
            setError(err.message || "Código incorrecto. Verifica que estás ingresando el código correcto de la App.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSettingUp) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-indigo-600 p-3 rounded-xl shadow-lg ring-1 ring-black/5">
                        <ShieldAlert className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Configurar 2FA
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 px-4">
                    Por seguridad, requerimos Autenticación de Dos Factores en tu cuenta.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700">

                    <div className="mb-8">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            1. Escanea este código QR
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Usa una app como Google Authenticator o Authy en tu celular.
                        </p>
                        <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            {qrCode ? (
                                <QRCodeSVG value={qrCode} size={200} />
                            ) : (
                                <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Generando QR...</div>
                            )}
                        </div>

                        <div className="mt-4 text-center">
                            <span className="text-xs text-gray-500 block mb-1">O ingresa el código manual:</span>
                            <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm text-indigo-600 dark:text-indigo-400 font-bold tracking-widest">
                                {secret}
                            </code>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={verifySetup}>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            2. Ingresa el código generado
                        </h3>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="code" className="sr-only">Código TOTP</label>
                            <input
                                id="code"
                                name="code"
                                type="text"
                                maxLength={6}
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className="block w-full text-center text-3xl tracking-[0.5em] font-mono rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 h-16"
                                placeholder="------"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || code.length !== 6 || !factorId}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Activar 2FA y Entrar
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
