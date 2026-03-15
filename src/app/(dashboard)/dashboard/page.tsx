"use client";

import { useData } from "@/context/data-context";
import { Landmark, Plus, BellRing, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const { invoices, expenses, taxDeadlines, loadingData } = useData();
    const [hasPlayedAlert, setHasPlayedAlert] = useState(false);

    // Calculate stats
    const totalSales = invoices
        .filter(i => i.type === 'invoice' && i.status !== 'cancelled')
        .reduce((sum, i) => sum + i.total, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    // Obligations Logic
    const today = new Date().toISOString().split('T')[0];
    const expiredDeadlines = taxDeadlines.filter(d => d.expirationDate < today && !d.completed);
    const upcomingDeadlines = taxDeadlines
        .filter(d => d.expirationDate >= today && !d.completed)
        .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
        .slice(0, 3);

    // Alert Sound Logic
    useEffect(() => {
        if (!loadingData && expiredDeadlines.length > 0 && !hasPlayedAlert) {
            const playSound = () => {
                try {
                    // Standard notification sound
                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.play().catch(e => console.warn("Audio play blocked by browser policy. User must interact first."));
                    setHasPlayedAlert(true);
                } catch (err) {
                    console.error("Error playing alert sound:", err);
                }
            };
            
            // Wait a bit for page to settle
            const timer = setTimeout(playSound, 1000);
            return () => clearTimeout(timer);
        }
    }, [loadingData, expiredDeadlines.length, hasPlayedAlert]);

    if (loadingData) {
        return (
            <div className="flex items-center justify-center h-full py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Resumen Financiero</h1>
                    <p className="text-gray-500 dark:text-gray-400 transition-colors">Bienvenido a tu sistema contable.</p>
                </div>
            </div>

            {/* Expiration Alert Banner */}
            {expiredDeadlines.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full">
                            <BellRing size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-800 dark:text-red-300">¡Alerta de Vencimiento!</p>
                            <p className="text-xs text-red-700 dark:text-red-400">Tienes {expiredDeadlines.length} obligación(es) vencida(s) pendiente(s).</p>
                        </div>
                    </div>
                    <Link 
                        href="/dashboard/tax-deadlines"
                        className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Ver Ahora
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Ingresos Totales"
                    value={totalSales}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                    trend="up"
                />
                <StatCard
                    title="Gastos Totales"
                    value={totalExpenses}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                    trend="down"
                />
                <StatCard
                    title="Beneficio Neto"
                    value={netProfit}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                    trend={netProfit >= 0 ? "up" : "down"}
                    highlight
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity */}
                <div className="lg:col-span-2 bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border transition-colors">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-500" />
                        Actividad Reciente
                    </h2>
                    {recentInvoices.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No hay actividad registrada.</p>
                    ) : (
                        <div className="space-y-4">
                            {recentInvoices.map(inv => (
                                <div key={inv.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-card-foreground">{inv.contactName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {inv.type === 'quote' ? 'Cotización' : 'Factura'} #{inv.number}
                                        </p>
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 transition-colors">${inv.total.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Obligations Widget */}
                <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Landmark size={18} className="text-indigo-500" />
                            Obligaciones
                        </h2>
                        <Link 
                            href="/dashboard/tax-deadlines/create"
                            className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            title="Nueva Obligación"
                        >
                            <Plus size={18} />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {upcomingDeadlines.length === 0 && expiredDeadlines.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">No hay vencimientos próximos.</p>
                        ) : (
                            <>
                                {expiredDeadlines.slice(0, 2).map(dl => (
                                    <div key={dl.id} className="flex items-start gap-3 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                        <AlertCircle size={16} className="text-red-500 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-red-800 dark:text-red-400 truncate">{dl.taxType} - {dl.businessName}</p>
                                            <p className="text-[10px] text-red-600 dark:text-red-500">Vencido: {dl.expirationDate}</p>
                                        </div>
                                    </div>
                                ))}
                                {upcomingDeadlines.map(dl => (
                                    <div key={dl.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                                        <Calendar size={16} className="text-gray-400 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{dl.taxType} - {dl.businessName}</p>
                                            <p className="text-[10px] text-muted-foreground">Vence: {dl.expirationDate}</p>
                                        </div>
                                    </div>
                                ))}
                                <Link 
                                    href="/dashboard/tax-deadlines"
                                    className="block text-center text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline pt-2"
                                >
                                    Ver todas
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, formatter, trend, highlight }: any) {
    return (
        <div className={`bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border transition-all hover:shadow-md`}>
            <p className="text-muted-foreground text-sm font-medium transition-colors">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
                <p className={`text-3xl font-bold transition-colors ${highlight
                    ? (value >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400")
                    : "text-card-foreground"
                    }`}>
                    {formatter(value)}
                </p>
            </div>
        </div>
    );
}
