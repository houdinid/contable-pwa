"use client";

import Link from "next/link";
import { useData } from "@/context/data-context";
import { Plus, TrendingDown, Calendar, Building2, Edit, Trash2, FileText } from "lucide-react";

export default function ExpensesPage() {
    const { expenses, contacts, loadingData, deleteExpense, expenseCategories, businessIdentities } = useData();

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este gasto?")) {
            await deleteExpense(id);
        }
    };

    if (loadingData) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando gastos...</div>;
    }

    const getSupplierName = (id?: string) => {
        if (!id) return "Sin proveedor";
        const supplier = contacts.find(c => c.id === id);
        return supplier ? supplier.name : "Proveedor desconocido";
    };

    const getCategoryName = (id: string, oldCategory?: string) => {
        if (!id) return oldCategory || "Sin categoría";
        const cat = expenseCategories.find(c => c.id === id);
        return cat ? cat.name : (oldCategory || id);
    };

    const expensesTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground transition-colors">Gastos y Compras</h1>
                    <p className="text-gray-500 dark:text-gray-400 transition-colors">Controla tus salidas de dinero</p>
                </div>
                <Link
                    href="/dashboard/expenses/create"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Registrar Gasto
                </Link>
            </div>

            {/* Summary Card */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Gastos</p>
                        <h3 className="text-2xl font-bold text-foreground transition-colors">${expensesTotal.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-x-auto transition-colors">
                <table className="w-full text-left text-sm min-w-[800px]">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border transition-colors">
                        <tr>
                            <th className="px-6 py-4">Descripción</th>
                            <th className="px-6 py-4">Empresa</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Proveedor</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4 text-right">Monto</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                    No hay gastos registrados.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((exp) => (
                                <tr key={exp.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        {exp.description}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {businessIdentities.find(b => b.id === exp.businessIdentityId)?.name || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize">
                                            {getCategoryName(exp.categoryId, (exp as any).category)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        {exp.supplierId && <Building2 size={14} className="text-gray-400" />}
                                        {getSupplierName(exp.supplierId)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {new Date(exp.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-foreground">
                                        ${exp.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/dashboard/expenses/${exp.id}/edit`}
                                                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(exp.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        {exp.receiptUrl && (
                                            <div className="flex justify-end mt-1">
                                                <button
                                                    onClick={() => {
                                                        const win = window.open();
                                                        win?.document.write(`<img src="${exp.receiptUrl}" style="max-width:100%"/>`);
                                                    }}
                                                    className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                                >
                                                    <FileText size={14} /> Ver Recibo
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
