"use client";
 
import { useData } from "@/context/data-context";
import { useTheme } from "next-themes";
import { 
    Landmark, 
    Plus, 
    BellRing, 
    AlertCircle, 
    Calendar, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Wallet,
    ArrowUpRight, 
    ArrowDownRight,
    FileText,
    Wrench,
    Clock
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
 
export default function DashboardPage() {
    const { 
        invoices, 
        expenses, 
        taxDeadlines, 
        loadingData,
        purchases,
        payments,
        businessIdentities,
        serviceOrders
    } = useData();
    const { resolvedTheme } = useTheme();
    const [hasPlayedAlert, setHasPlayedAlert] = useState(false);
    const [activeTab, setActiveTab] = useState<"invoices" | "serviceOrders">("invoices");
 
    // Recharts colors
    const isDark = resolvedTheme === 'dark';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const tooltipBg = isDark ? '#1f2937' : '#ffffff';
    const tooltipColor = isDark ? '#f3f4f6' : '#111827';
    const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
 
    // --- Calculations ---
 
    // 1. Ingresos Totales (Facturación Activa)
    const totalSales = useMemo(() => {
        return invoices
            .filter(i => i.type === 'invoice' && i.status !== 'cancelled')
            .reduce((sum, i) => sum + i.total, 0);
    }, [invoices]);
 
    // 2. Gastos Totales
    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, e) => sum + e.amount, 0);
    }, [expenses]);
 
    // 3. Beneficio Neto (Ventas - Gastos)
    const netProfit = totalSales - totalExpenses;
 
    // 4. Cuentas por Cobrar (Clientes me deben)
    const totalReceivable = useMemo(() => {
        return invoices
            .filter(i => i.type === 'invoice' && i.status === 'pending')
            .reduce((sum, i) => sum + i.total, 0);
    }, [invoices]);
 
    // 5. Cuentas por Pagar (Debo a proveedores)
    const totalPayable = useMemo(() => {
        return purchases
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.total, 0);
    }, [purchases]);
 
    // 6. Disponible en Cuentas Bancarias (Tesorería)
    const bankBalance = useMemo(() => {
        const accounts = businessIdentities.flatMap(b => b.bankAccounts || []);
        return accounts.reduce((sum, acc) => {
            const income = payments
                .filter(p => p.destinationAccountId === acc.id)
                .reduce((s, p) => s + p.amount, 0);
                
            const outcome = expenses
                .filter(e => e.sourceAccountId === acc.id && e.status === 'paid')
                .reduce((s, e) => s + e.amount, 0);
                
            return sum + (income - outcome);
        }, 0);
    }, [businessIdentities, payments, expenses]);
 
    // 7. Cobrado vs Por Cobrar (Pie Data)
    const paidSales = useMemo(() => {
        return invoices
            .filter(i => i.type === 'invoice' && i.status === 'paid')
            .reduce((sum, i) => sum + i.total, 0);
    }, [invoices]);
 
    const pieData = useMemo(() => {
        return [
            { name: 'Cobrado', value: paidSales },
            { name: 'Por Cobrar', value: totalReceivable }
        ];
    }, [paidSales, totalReceivable]);
 
    const PIE_COLORS = ['#10B981', '#F59E0B']; // Emerald and Amber
 
    // 8. Flujo Mensual (Historial 6 meses)
    const chartData = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d);
        }
        
        return months.map(date => {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('es-ES', { month: 'short' });
 
            const sales = invoices
                .filter(i => i.date.startsWith(monthKey) && i.status !== 'cancelled' && i.type === 'invoice')
                .reduce((sum, i) => sum + i.total, 0);
 
            const expense = expenses
                .filter(e => e.date.startsWith(monthKey))
                .reduce((sum, e) => sum + e.amount, 0);
 
            return {
                name: monthLabel,
                Ventas: sales,
                Gastos: expense,
                Utilidad: sales - expense
            };
        });
    }, [invoices, expenses]);
 
    // Lists sorting & slicing
    const recentInvoices = useMemo(() => {
        return [...invoices]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [invoices]);
 
    const recentServiceOrders = useMemo(() => {
        return [...serviceOrders]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [serviceOrders]);
 
    // Obligations
    const today = new Date().toISOString().split('T')[0];
    const expiredDeadlines = useMemo(() => {
        return taxDeadlines.filter(d => d.expirationDate < today && !d.completed);
    }, [taxDeadlines, today]);
 
    const upcomingDeadlines = useMemo(() => {
        return taxDeadlines
            .filter(d => d.expirationDate >= today && !d.completed)
            .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
            .slice(0, 3);
    }, [taxDeadlines, today]);
 
    // Alert Sound
    useEffect(() => {
        if (!loadingData && expiredDeadlines.length > 0 && !hasPlayedAlert) {
            const playSound = () => {
                try {
                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.play().catch(() => {});
                    setHasPlayedAlert(true);
                } catch (err) {
                    console.error("Error playing alert sound:", err);
                }
            };
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
        <div className="space-y-8 pb-10">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Resumen Financiero</h1>
                    <p className="text-muted-foreground text-sm mt-1">Monitorea la salud contable, flujo de caja y cuentas de tu negocio.</p>
                </div>
            </div>
 
            {/* Expiration Alert Banner */}
            {expiredDeadlines.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full animate-bounce">
                            <BellRing size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-800 dark:text-red-200">¡Alerta de Vencimiento!</p>
                            <p className="text-xs text-red-700 dark:text-red-400">Tienes {expiredDeadlines.length} obligación(es) tributaria(s) vencida(s) pendiente(s).</p>
                        </div>
                    </div>
                    <Link 
                        href="/dashboard/tax-deadlines"
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                        Ver Ahora
                    </Link>
                </div>
            )}
 
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* 1. Disponible Bancos */}
                <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform"></div>
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Disponible (Bancos)</span>
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-foreground">${bankBalance.toLocaleString()}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                            Saldo total en cuentas bancarias
                        </p>
                    </div>
                </div>
 
                {/* 2. Cuentas por Cobrar */}
                <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform"></div>
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clientes me deben</span>
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${totalReceivable.toLocaleString()}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Facturas vigentes pendientes de cobro
                        </p>
                    </div>
                </div>
 
                {/* 3. Cuentas por Pagar */}
                <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform"></div>
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Debo a proveedores</span>
                        <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                            <ArrowDownRight size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-amber-600 dark:text-amber-500">${totalPayable.toLocaleString()}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Compras pendientes de pago
                        </p>
                    </div>
                </div>
 
                {/* 4. Ingresos Facturados */}
                <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform"></div>
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ventas Totales</span>
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-foreground">${totalSales.toLocaleString()}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Facturas comerciales activas
                        </p>
                    </div>
                </div>
 
                {/* 5. Gastos Totales */}
                <div className="bg-card text-card-foreground p-5 rounded-xl border border-border shadow-xs hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 dark:bg-red-500/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform"></div>
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gastos Totales</span>
                        <div className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg">
                            <TrendingDown size={16} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-foreground">${totalExpenses.toLocaleString()}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Suma de egresos y costos pagados
                        </p>
                    </div>
                </div>
            </div>
 
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Cashflow Bar Chart */}
                <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-xs">
                    <h3 className="text-base font-bold text-foreground mb-4">Flujo de Caja Mensual</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: `1px solid ${tooltipBorder}`,
                                        backgroundColor: tooltipBg,
                                        color: tooltipColor
                                    }}
                                    itemStyle={{ color: tooltipColor }}
                                    formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, '']}
                                />
                                <Legend wrapperStyle={{ color: textColor }} />
                                <Bar dataKey="Ventas" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
 
                {/* State of Portfolio (How much they owe me donut chart) */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-xs flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-foreground">Estado de Recaudo (Facturas)</h3>
                        <p className="text-xs text-muted-foreground mt-1">Muestra la proporción de dinero cobrado frente al pendiente de cobro.</p>
                    </div>
                    <div className="h-44 w-full flex items-center justify-center relative my-2">
                        {totalReceivable === 0 && paidSales === 0 ? (
                            <div className="text-xs text-muted-foreground italic">No hay facturas vigentes para mostrar.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: `1px solid ${tooltipBorder}`,
                                            backgroundColor: tooltipBg,
                                            color: tooltipColor
                                        }}
                                        itemStyle={{ color: tooltipColor }}
                                        formatter={(value: number | undefined) => `$${(value || 0).toLocaleString()}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="absolute flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Me Deben</span>
                            <span className="text-base font-black text-amber-500">${totalReceivable.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex justify-around text-xs mt-2 border-t border-border pt-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-[10px]">Cobrado</span>
                                <span className="font-bold text-foreground">${paidSales.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-[10px]">Por Cobrar</span>
                                <span className="font-bold text-foreground">${totalReceivable.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
 
            {/* Bottom Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity (Invoices vs Service Orders Tabs) */}
                <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-4 mb-4">
                        <h3 className="text-base font-bold text-foreground">Actividad Reciente</h3>
                        <div className="flex p-0.5 bg-muted rounded-lg border border-border">
                            <button
                                onClick={() => setActiveTab("invoices")}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    activeTab === "invoices" 
                                        ? "bg-card text-foreground shadow-xs" 
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Inicios / Facturas
                            </button>
                            <button
                                onClick={() => setActiveTab("serviceOrders")}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    activeTab === "serviceOrders" 
                                        ? "bg-card text-foreground shadow-xs" 
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Órdenes de Servicio
                            </button>
                        </div>
                    </div>
 
                    {activeTab === "invoices" ? (
                        recentInvoices.length === 0 ? (
                            <p className="text-muted-foreground text-xs italic py-4 text-center">No hay documentos registrados recientemente.</p>
                        ) : (
                            <div className="space-y-4">
                                {recentInvoices.map(inv => (
                                    <div key={inv.id} className="flex justify-between items-center border-b border-border/40 pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg shrink-0 ${
                                                inv.type === 'quote' ? 'bg-orange-50 text-orange-500 dark:bg-orange-950/20' : 'bg-blue-50 text-blue-500 dark:bg-blue-950/20'
                                            }`}>
                                                <FileText size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-xs text-foreground truncate">{inv.contactName}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {inv.type === 'quote' ? 'Cotización' : 'Factura'} #{inv.number} • {new Date(inv.date).toLocaleDateString('es-CO')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="font-bold text-xs text-foreground">${inv.total.toLocaleString()}</span>
                                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase ${
                                                inv.status === 'paid' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                                                inv.status === 'pending' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400' :
                                                'bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400'
                                            }`}>
                                                {inv.status === 'paid' ? 'Pagado' : inv.status === 'pending' ? 'Pendiente' : 'Borrador'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        recentServiceOrders.length === 0 ? (
                            <p className="text-muted-foreground text-xs italic py-4 text-center">No hay órdenes de servicio registradas recientemente.</p>
                        ) : (
                            <div className="space-y-4">
                                {recentServiceOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center border-b border-border/40 pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-indigo-50 text-indigo-500 dark:bg-indigo-950/20 rounded-lg shrink-0">
                                                <Wrench size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-xs text-foreground truncate">{order.clientName}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    Orden #{order.number} • Recepción: {new Date(order.date).toLocaleDateString('es-CO')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="font-bold text-xs text-foreground">${order.total.toLocaleString()}</span>
                                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase ${
                                                order.status === 'completed' || order.status === 'billed' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' :
                                                order.status === 'in_progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                                                'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400'
                                            }`}>
                                                {order.status === 'completed' ? 'Completado' : order.status === 'billed' ? 'Facturado' : order.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
 
                {/* Obligations Widget */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Landmark size={18} className="text-indigo-500" />
                                Vencimientos Tributarios
                            </h3>
                            <Link 
                                href="/dashboard/tax-deadlines/create"
                                className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                                title="Nueva Obligación"
                            >
                                <Plus size={16} />
                            </Link>
                        </div>
 
                        <div className="space-y-3">
                            {upcomingDeadlines.length === 0 && expiredDeadlines.length === 0 ? (
                                <p className="text-muted-foreground text-xs italic text-center py-6">No hay vencimientos próximos.</p>
                            ) : (
                                <>
                                    {expiredDeadlines.slice(0, 2).map(dl => (
                                        <div key={dl.id} className="flex items-start gap-2.5 p-2.5 bg-red-50 dark:bg-red-950/15 rounded-lg border border-red-100 dark:border-red-950/30">
                                            <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-red-900 dark:text-red-300 truncate">{dl.taxType}</p>
                                                <p className="text-[10px] text-red-700 dark:text-red-400 truncate mt-0.5">{dl.businessName}</p>
                                                <p className="text-[9px] font-bold text-red-600 dark:text-red-500 mt-1 flex items-center gap-1">
                                                    <Clock size={10} /> VENCIDO EL: {new Date(dl.expirationDate).toLocaleDateString('es-CO')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {upcomingDeadlines.map(dl => (
                                        <div key={dl.id} className="flex items-start gap-2.5 p-2.5 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                                            <Calendar size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">{dl.taxType}</p>
                                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{dl.businessName}</p>
                                                <p className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                                                    Vence el: {new Date(dl.expirationDate).toLocaleDateString('es-CO')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                    <Link 
                        href="/dashboard/tax-deadlines"
                        className="block text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline pt-4 border-t border-border mt-4"
                    >
                        Ver todas las obligaciones &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
