"use client";

import { useData } from "@/context/data-context";

export default function DashboardPage() {
    const { invoices, expenses, loadingData } = useData();

    if (loadingData) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const totalSales = invoices
        .filter(i => i.type === 'invoice' && i.status !== 'cancelled')
        .reduce((sum, i) => sum + i.total, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Resumen Financiero</h1>
                <p className="text-gray-500 dark:text-gray-400 transition-colors">Bienvenido a tu sistema contable.</p>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 transition-colors">Actividad Reciente</h2>
                    {recentInvoices.length === 0 ? (
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No hay actividad registrada.</p>
                    ) : (
                        <div className="space-y-4">
                            {recentInvoices.map(inv => (
                                <div key={inv.id} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{inv.contactName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">Factura #{inv.number}</p>
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-300 transition-colors">${inv.total.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Placeholder for Expenses breakdown or Chart */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm transition-colors">
                    Gráfico de Ingresos vs Gastos (Próximamente)
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, formatter, trend, highlight }: any) {
    const isPositive = trend === "up" || trend === "neutral"; // simple logic
    return (
        <div className={`bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md`}>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
                <p className={`text-3xl font-bold transition-colors ${highlight
                        ? (value >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400")
                        : "text-gray-900 dark:text-white"
                    }`}>
                    {formatter(value)}
                </p>
            </div>
        </div>
    );
}
