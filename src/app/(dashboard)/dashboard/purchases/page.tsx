"use client";

import { useState } from "react";
import { useData } from "@/context/data-context";
import { Plus, Search, ShoppingCart, Calendar, FileText } from "lucide-react";
import { PurchaseForm } from "@/components/purchases/purchase-form";

export default function PurchasesPage() {
    const { purchases } = useData();
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Filter purchases
    const filteredPurchases = purchases.filter(p =>
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.number?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground transition-colors">Compras</h1>
                    <p className="text-gray-500 dark:text-gray-400 transition-colors">Registra facturas de proveedores y entradas de inventario.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Compra
                </button>
            </div>

            {/* List */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-colors">
                <div className="p-4 border-b border-border flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 transition-colors">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por proveedor o número de factura..."
                            className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-foreground placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium transition-colors">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Proveedor</th>
                                <th className="px-6 py-3">N° Factura</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3 text-center">Recibo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No se encontraron compras.
                                    </td>
                                </tr>
                            ) : (
                                filteredPurchases.map(purchase => (
                                    <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {purchase.date}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground">{purchase.supplierName}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{purchase.number || '-'}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {purchase.items.map(i => `${i.productName} (${i.quantity})`).join(", ")}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-foreground">
                                            ${purchase.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${purchase.status === 'paid'
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                                }`}>
                                                {purchase.status === 'paid' ? 'Pagada' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {purchase.receiptUrl ? (
                                                <button
                                                    onClick={() => {
                                                        const win = window.open();
                                                        win?.document.write(`<img src="${purchase.receiptUrl}" style="max-width:100%"/>`);
                                                    }}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                                    title="Ver Recibo"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <PurchaseForm
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}
