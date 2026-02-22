"use client";

import Link from "next/link";
import { useData } from "@/context/data-context";
import { Plus, FileText, FileCheck, FileX, Printer } from "lucide-react";

export default function SalesPage() {
    const { invoices, loadingData } = useData();

    if (loadingData) {
        return <div className="p-8 text-center">Cargando facturas...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Ingresos y Cotizaciones</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona tus documentos comerciales</p>
                </div>
                <Link
                    href="/dashboard/sales/create"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Factura
                </Link>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Documento</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                    No hay documentos registrados.
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                                        <FileText size={16} className={inv.type === 'quote' ? 'text-orange-500' : 'text-blue-500'} />
                                        {inv.type === 'quote' ? 'COT-' : 'FACT-'}{inv.number}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inv.contactName}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={inv.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-foreground">
                                        ${inv.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Link href={`/dashboard/sales/${inv.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
                                            Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {invoices.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border border-border">
                        No hay documentos registrados.
                    </div>
                ) : (
                    invoices.map((inv) => (
                        <div key={inv.id} className="bg-card p-4 rounded-lg shadow-sm border border-border space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <FileText size={20} className={inv.type === 'quote' ? 'text-orange-500' : 'text-blue-500'} />
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-gray-100 block">
                                            {inv.type === 'quote' ? 'COT-' : 'FACT-'}{inv.number}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(inv.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <StatusBadge status={inv.status} />
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{inv.contactName}</p>
                                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                        ${inv.total.toLocaleString()}
                                    </p>
                                </div>
                                <Link
                                    href={`/dashboard/sales/${inv.id}`}
                                    className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Ver Detalle
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        draft: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
        pending: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
        paid: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
        cancelled: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
    };

    const labels = {
        draft: "Borrador",
        pending: "Pendiente",
        paid: "Pagada",
        cancelled: "Anulada",
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}
