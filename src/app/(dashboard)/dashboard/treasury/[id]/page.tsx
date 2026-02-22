"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";

export default function TreasuryAccountPage() {
    const params = useParams();
    const router = useRouter();
    const { businessIdentities, payments, expenses, loadingData } = useData();
    const [account, setAccount] = useState<any>(null);
    const [movements, setMovements] = useState<any[]>([]);

    useEffect(() => {
        if (loadingData || !params.id) return;

        // Find the account across all identities
        let foundAccount = null;
        let foundIdentity = null;

        for (const identity of businessIdentities) {
            const acc = identity.bankAccounts?.find(a => a.id === params.id);
            if (acc) {
                foundAccount = acc;
                foundIdentity = identity;
                break;
            }
        }

        if (foundAccount) {
            setAccount({ ...foundAccount, businessName: foundIdentity?.name });

            // 1. Income (Payments)
            const accountPayments = payments
                .filter(p => p.destinationAccountId === foundAccount.id)
                .map(p => ({
                    id: p.id,
                    date: p.date,
                    type: 'IN',
                    amount: p.amount,
                    description: `Pago Factura`, // We could lookup invoice number if needed
                    reference: p.reference,
                    notes: p.notes
                }));

            // 2. Outcome (Expenses)
            const accountExpenses = expenses
                .filter(e => e.sourceAccountId === foundAccount.id && e.status === 'paid')
                .map(e => ({
                    id: e.id,
                    date: e.date,
                    type: 'OUT',
                    amount: e.amount,
                    description: e.description,
                    reference: '', // Expenses don't have a specific reference field yet, maybe in notes?
                    notes: ''
                }));

            // Merge and Sort
            const allMovements = [...accountPayments, ...accountExpenses].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setMovements(allMovements);
        }

    }, [params.id, businessIdentities, payments, expenses, loadingData]);

    if (loadingData) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    if (!account) {
        return (
            <div className="p-8 text-center">
                <p>Cuenta no encontrada</p>
                <button onClick={() => router.back()} className="text-indigo-600 mt-2">Volver</button>
            </div>
        );
    }

    const totalIncome = movements.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.amount, 0);
    const totalOutcome = movements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.amount, 0);
    const currentBalance = totalIncome - totalOutcome;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={20} />
                Volver a Tesorería
            </button>

            <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Wallet className="text-indigo-600" />
                            {account.bankName}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {account.accountType === 'savings' ? 'Ahorros' : 'Corriente'} • {account.accountNumber}
                        </p>
                        <p className="text-sm text-indigo-600 font-medium mt-1">{account.businessName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Saldo Disponible</p>
                        <p className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            ${currentBalance.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                            <ArrowUpCircle size={18} /> Total Entradas
                        </div>
                        <p className="text-xl font-bold text-green-700">${totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                        <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                            <ArrowDownCircle size={18} /> Total Salidas
                        </div>
                        <p className="text-xl font-bold text-red-700">${totalOutcome.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Historial de Movimientos</h3>
                </div>

                {movements.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No hay movimientos registrados en esta cuenta.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium text-sm">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Descripción</th>
                                    <th className="px-6 py-3">Referencia</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {movements.map((move) => (
                                    <tr key={`${move.type}-${move.id}`} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-3 text-sm text-gray-600 whitespace-nowrap">{move.date}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900">
                                            {move.description}
                                            {move.notes && <div className="text-xs text-gray-400 mt-0.5">{move.notes}</div>}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{move.reference || '-'}</td>
                                        <td className={`px-6 py-3 text-sm font-medium text-right ${move.type === 'IN' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {move.type === 'IN' ? '+' : '-'}${move.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
