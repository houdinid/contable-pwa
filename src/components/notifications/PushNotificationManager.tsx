"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

export function PushNotificationManager() {
    const { user } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Public VAPID Key
    const PUBLIC_VAPID_KEY = 'BIpzg6hQZ_toW3uv4PP6Edhg24tb3hnd8ZbnFw1BFyxnW3RKZ6ke7TVK07HtvT7AxlcFGjVXJEeUUWSYJ8vOVFc'; 

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window && user) {
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, [user]);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (err) {
            console.error("Error checking subscription:", err);
        } finally {
            setLoading(false);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribe = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await Notification.requestPermission();
            if (result !== 'granted') {
                throw new Error('Permiso de notificación denegado');
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            // Save to Supabase
            const { error: dbError } = await supabase
                .from('push_subscriptions')
                .insert({
                    user_id: user?.id,
                    subscription: subscription.toJSON()
                });

            if (dbError) throw dbError;

            setIsSubscribed(true);
        } catch (err: any) {
            setError(err.message || 'Error al suscribirse');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                
                // Remove from Supabase
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('user_id', user?.id);
            }
            setIsSubscribed(false);
        } catch (err) {
            console.error("Error unsubscribing:", err);
        } finally {
            setLoading(false);
        }
    };

    const sendTestNotification = async () => {
        setLoading(true);
        try {
            const { error: funcError } = await supabase.functions.invoke('send-push', {
                body: { testUserId: user?.id }
            });

            if (funcError) throw funcError;
            alert('¡Notificación de prueba enviada! Deberías recibirla en unos segundos.');
        } catch (err: any) {
            setError('Error al enviar prueba: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader2 className="animate-spin text-indigo-600" size={20} />;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                        isSubscribed 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                    }`}
                >
                    {isSubscribed ? <BellOff size={18} /> : <Bell size={18} />}
                    {isSubscribed ? 'Desactivar Notificaciones' : 'Activar Notificaciones Push'}
                </button>

                {isSubscribed && (
                    <button
                        onClick={sendTestNotification}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors font-medium text-sm"
                    >
                        <Bell size={18} />
                        Probar Notificación
                    </button>
                )}
            </div>
            
            {error && <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded border border-red-100">{error}</p>}
            
            {!isSubscribed && !error && (
                <p className="text-[10px] text-gray-500 bg-indigo-50/50 p-1.5 rounded inline-block w-fit">
                    Recibe alertas directamente en tu celular sobre tus vencimientos.
                </p>
            )}
        </div>
    );
}
