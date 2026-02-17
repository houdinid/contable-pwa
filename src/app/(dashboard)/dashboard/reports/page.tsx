"use client";

import { useData } from "@/context/data-context";
import { useTheme } from "next-themes";
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
import { TrendingUp, TrendingDown, DollarSign, Activity, Printer } from "lucide-react";

export default function ReportsPage() {
    const { invoices, expenses, loadingData, contacts, expenseCategories } = useData();
    const { resolvedTheme } = useTheme();

    // Chart Colors based on theme
    const isDark = resolvedTheme === 'dark';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const tooltipBg = isDark ? '#1f2937' : '#ffffff';
    const tooltipColor = isDark ? '#f3f4f6' : '#111827';
    const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

    if (loadingData) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Generando reportes...</div>;
    }

    // --- Calculations ---

    // 1. Totals
    const totalSales = invoices
        .filter(i => i.status !== 'cancelled' && i.type === 'invoice')
        .reduce((sum, i) => sum + i.total, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // 2. Monthly Data (Last 6 months)
    const getLast6Months = () => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d);
        }
        return months;
    };

    const chartData = getLast6Months().map(date => {
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

    // 3. Expenses by Category
    const expensesByCategory = expenses.reduce((acc, curr) => {
        let catName = 'Sin categoría';
        if (curr.categoryId) {
            const cat = expenseCategories.find(c => c.id === curr.categoryId);
            catName = cat ? cat.name : ((curr as any).category || curr.categoryId);
        } else if ((curr as any).category) {
            // Fallback for old data
            catName = (curr as any).category;
        }

        acc[catName] = (acc[catName] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
        name: name,
        value: value
    }));

    // 4. Top Clients (Income)
    const salesByClient = invoices
        .filter(i => i.status !== 'cancelled' && i.type === 'invoice')
        .reduce((acc, curr) => {
            const name = curr.contactName || 'Desconocido';
            acc[name] = (acc[name] || 0) + curr.total;
            return acc;
        }, {} as Record<string, number>);

    const topClientsData = Object.entries(salesByClient)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    // 5. Expenses by Supplier
    // We need to resolve supplier names if possible, otherwise use ID or generic 'Otros'
    // Note: This requires access to contacts list which is returned by useData

    const expensesBySupplier = expenses.reduce((acc, curr) => {
        let name = 'No asignado';
        if (curr.supplierId) {
            const supplier = contacts.find(c => c.id === curr.supplierId);
            name = supplier ? supplier.name : 'Proveedor eliminado';
        }
        acc[name] = (acc[name] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const topSuppliersData = Object.entries(expensesBySupplier)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    return (
        <div className="space-y-8 pb-8">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Reportes Financieros</h1>
                    <p className="text-gray-500 dark:text-gray-400">Análisis de rendimiento de tu negocio</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Printer size={20} /> Imprimir / PDF
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos Totales</p>
                            <h3 className="text-2xl font-bold text-foreground mt-2">${totalSales.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos Totales</p>
                            <h3 className="text-2xl font-bold text-foreground mt-2">${totalExpenses.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilidad Neta</p>
                            <h3 className={`text-2xl font-bold mt-2 ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ${netProfit.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Margen</p>
                            <h3 className={`text-2xl font-bold mt-2 ${profitMargin >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'}`}>
                                {profitMargin.toFixed(1)}%
                            </h3>
                        </div>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Sales vs Expenses Chart */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Flujo de Caja Mensual</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: `1px solid ${tooltipBorder}`,
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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

                {/* Expenses by Category */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Gastos por Categoría</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: `1px solid ${tooltipBorder}`,
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            backgroundColor: tooltipBg,
                                            color: tooltipColor
                                        }}
                                        itemStyle={{ color: tooltipColor }}
                                        formatter={(value: number | undefined) => `$${(value || 0).toLocaleString()}`}
                                    />
                                    <Legend wrapperStyle={{ color: textColor }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-center">
                                <p>No hay gastos para mostrar</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
