"use client";

import { useData } from "@/context/data-context";
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";

export default function TreasuryPage() {
    const { businessIdentities, payments, expenses } = useData();

    // Flatten all accounts from all identities
    const accounts = businessIdentities.flatMap(b =>
        (b.bankAccounts || []).map(acc => ({ ...acc, businessName: b.name }))
    );

    const calculateBalance = (accountId: string) => {
        // Income: Payments where destinationAccountId === accountId
        const income = payments
            .filter(p => p.destinationAccountId === accountId)
            .reduce((sum, p) => sum + p.amount, 0);

        // Expenses: Expenses where sourceAccountId === accountId AND status is paid
        const outcome = expenses
            .filter(e => e.sourceAccountId === accountId && e.status === 'paid')
            .reduce((sum, e) => sum + e.amount, 0);

        return { income, outcome, balance: income - outcome };
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Wallet className="text-indigo-600" />
                Tesorería y Cuentas
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(acc => {
                    const { income, outcome, balance } = calculateBalance(acc.id);
                    return (
                        <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{acc.bankName}</h3>
                                        <p className="text-sm text-gray-500">{acc.businessName}</p>
                                    </div>
                                    <div className="bg-gray-100 p-2 rounded-lg">
                                        <span className="text-xs font-mono text-gray-600">*{acc.accountNumber.slice(-4)}</span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <p className="text-sm text-gray-500 mb-1">Saldo Actual</p>
                                    <p className={`text-3xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                        ${balance.toLocaleString()}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium mb-1">
                                            <ArrowUpCircle size={16} /> Entradas
                                        </div>
                                        <p className="font-semibold text-gray-900">${income.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-red-600 text-sm font-medium mb-1">
                                            <ArrowDownCircle size={16} /> Salidas
                                        </div>
                                        <p className="font-semibold text-gray-900">${outcome.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-xs text-gray-500 uppercase font-medium">{acc.accountType === 'savings' ? 'Ahorros' : 'Corriente'}</span>
                                <a
                                    href={`/dashboard/treasury/${acc.id}`}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                    Ver Movimientos &rarr;
                                </a>
                            </div>
                        </div>
                    );
                })}

                {accounts.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No tienes cuentas registradas</h3>
                        <p className="text-gray-500 mt-1">Ve a Configuración &rarr; Mis Razones Sociales para agregar cuentas bancarias.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
