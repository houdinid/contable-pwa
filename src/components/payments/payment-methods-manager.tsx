"use client";

import { useState } from "react";
import { useData } from "@/context/data-context";
import { Plus, Trash2 } from "lucide-react";

export function PaymentMethodsManager() {
    const { paymentMethods, addPaymentMethod, deletePaymentMethod } = useData();
    const [newMethod, setNewMethod] = useState({ name: "", type: "bank" as any });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMethod.name.trim()) return;
        await addPaymentMethod(newMethod);
        setNewMethod({ name: "", type: "bank" });
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este método de pago?")) {
            await deletePaymentMethod(id);
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'cash': return 'Efectivo';
            case 'bank': return 'Banco / Transferencia';
            case 'check': return 'Cheque';
            case 'crypto': return 'Criptomoneda';
            default: return 'Otro';
        }
    };

    return (
        <div className="space-y-4">
            {/* Add Form */}
            <form onSubmit={handleAdd} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Nombre</label>
                    <input
                        value={newMethod.name}
                        onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                        placeholder="Ej. Bancolombia Ahorros, Caja Menor..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="w-48 space-y-1">
                    <label className="text-xs text-gray-500 font-medium">Tipo</label>
                    <select
                        value={newMethod.type}
                        onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value as any })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="cash">Efectivo</option>
                        <option value="bank">Banco / Transferencia</option>
                        <option value="check">Cheque</option>
                        <option value="crypto">Criptomoneda</option>
                        <option value="other">Otro</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={!newMethod.name.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Plus size={18} /> Agregar
                </button>
            </form>

            {/* List Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3 text-right" style={{ width: '100px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paymentMethods.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    No hay métodos de pago definidos.
                                </td>
                            </tr>
                        ) : (
                            paymentMethods.map((method) => (
                                <tr key={method.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-900 font-medium">{method.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{getTypeLabel(method.type)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(method.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
