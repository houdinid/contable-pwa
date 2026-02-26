"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator as CalculatorIcon, ArrowRightLeft, Percent, DollarSign, Receipt } from "lucide-react";

type CalcMode = "add" | "extract";

export default function CalculatorPage() {
    const [mode, setMode] = useState<CalcMode>("add");
    const [amount, setAmount] = useState<string>("");
    const [vatRate, setVatRate] = useState<string>("19");

    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    const numRate = parseFloat(vatRate) || 0;

    let base = 0;
    let vatAmount = 0;
    let total = 0;

    if (mode === "add") {
        base = numAmount;
        vatAmount = base * (numRate / 100);
        total = base + vatAmount;
    } else {
        total = numAmount;
        base = total / (1 + (numRate / 100));
        vatAmount = total - base;
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <CalculatorIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora</h1>
                    <p className="text-gray-500 dark:text-gray-400">Herramientas financieras y de cálculo</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Receipt className="w-5 h-5 text-indigo-500" />
                            Calculadora de IVA
                        </CardTitle>
                        <CardDescription>
                            Agrega o extrae el IVA de un valor específico.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Mode Selector */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <button
                                onClick={() => setMode("add")}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === "add"
                                        ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                            >
                                <DollarSign size={16} />
                                Agregar IVA
                            </button>
                            <button
                                onClick={() => setMode("extract")}
                                className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${mode === "extract"
                                        ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                            >
                                <ArrowRightLeft size={16} />
                                Extraer IVA
                            </button>
                        </div>

                        {/* Input Controls */}
                        <div className="space-y-5 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-gray-700 dark:text-gray-300">
                                    {mode === "add" ? "Valor Base (Sin IVA)" : "Valor Total (Con IVA)"}
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0"
                                        className="pl-7 text-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vatRate" className="text-gray-700 dark:text-gray-300">Porcentaje de IVA</Label>
                                <div className="relative">
                                    <Input
                                        id="vatRate"
                                        type="number"
                                        placeholder="19"
                                        className="pr-8 text-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                        value={vatRate}
                                        onChange={(e) => setVatRate(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <Percent className="h-4 w-4 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm bg-indigo-50/50 dark:bg-indigo-900/10">
                    <CardHeader>
                        <CardTitle className="text-lg text-indigo-900 dark:text-indigo-100">Resultados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-indigo-100 dark:border-indigo-800/50">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal (Base)</span>
                                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(base)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-4 border-b border-indigo-100 dark:border-indigo-800/50">
                                <div className="flex flex-col">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                                        IVA ({vatRate || "0"}%)
                                    </span>
                                    <span className="text-xs text-indigo-500 font-medium mt-1">
                                        {mode === "extract" ? "Extraído del total" : "Agregado a la base"}
                                    </span>
                                </div>
                                <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(vatAmount)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Total</span>
                                <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
                                    {formatCurrency(total)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
