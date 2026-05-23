"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import {
    Calculator as CalculatorIcon,
    ArrowRightLeft,
    Percent,
    DollarSign,
    Receipt,
    Coins,
    TrendingUp,
    TrendingDown,
    Info
} from "lucide-react";

type CalcMode = "add" | "extract";
type TabMode = "iva" | "investment";
type InvMode = "roi" | "target";

export default function CalculatorPage() {
    const [activeTab, setActiveTab] = useState<TabMode>("iva");

    // --- IVA Calculator State ---
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

    // --- Investment Calculator State ---
    const [invMode, setInvMode] = useState<InvMode>("roi");
    const [buyPrice, setBuyPrice] = useState<number>(0);
    const [sellPrice, setSellPrice] = useState<number>(0);
    const [targetGain, setTargetGain] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("1");
    const [commissionPercent, setCommissionPercent] = useState<string>("0");

    const numBuyPrice = buyPrice || 0;
    const numQuantity = parseFloat(quantity) || 1;
    const numCommissionPercent = parseFloat(commissionPercent) || 0;

    // Common Calculations
    const totalBuyRaw = numBuyPrice * numQuantity;
    const buyCommission = totalBuyRaw * (numCommissionPercent / 100);
    const totalInvestment = totalBuyRaw + buyCommission;

    let calculatedSellPrice = 0;
    let totalSellRaw = 0;
    let sellCommission = 0;
    let totalReturnNet = 0;
    let netProfit = 0;
    let grossProfit = 0;
    let netRoi = 0;
    let grossRoi = 0;

    if (invMode === "roi") {
        calculatedSellPrice = sellPrice || 0;
        totalSellRaw = calculatedSellPrice * numQuantity;
        sellCommission = totalSellRaw * (numCommissionPercent / 100);
        totalReturnNet = totalSellRaw - sellCommission;
        netProfit = totalReturnNet - totalInvestment;
        grossProfit = totalSellRaw - totalBuyRaw;
        
        grossRoi = numBuyPrice > 0 ? ((calculatedSellPrice - numBuyPrice) / numBuyPrice) * 100 : 0;
        netRoi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    } else {
        // target mode: calculate required selling price for target net ROI
        const numTargetGain = parseFloat(targetGain) || 0;
        const commissionDenominator = 1 - numCommissionPercent / 100;
        
        if (commissionDenominator > 0 && numBuyPrice > 0) {
            const commissionFactor = (1 + numCommissionPercent / 100) / commissionDenominator;
            calculatedSellPrice = numBuyPrice * commissionFactor * (1 + numTargetGain / 100);
        } else if (numBuyPrice > 0) {
            calculatedSellPrice = numBuyPrice * (1 + numTargetGain / 100);
        }
        
        totalSellRaw = calculatedSellPrice * numQuantity;
        sellCommission = totalSellRaw * (numCommissionPercent / 100);
        totalReturnNet = totalSellRaw - sellCommission;
        netProfit = totalReturnNet - totalInvestment;
        grossProfit = totalSellRaw - totalBuyRaw;
        
        grossRoi = numBuyPrice > 0 ? ((calculatedSellPrice - numBuyPrice) / numBuyPrice) * 100 : 0;
        netRoi = numTargetGain;
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatPercent = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val / 100);
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <CalculatorIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora</h1>
                        <p className="text-gray-500 dark:text-gray-400">Herramientas financieras y de cálculo</p>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-inner shrink-0 sm:self-center">
                    <button
                        onClick={() => setActiveTab("iva")}
                        className={`flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === "iva"
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                        <Receipt size={16} />
                        IVA
                    </button>
                    <button
                        onClick={() => setActiveTab("investment")}
                        className={`flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === "investment"
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                        <Coins size={16} />
                        Rentabilidad
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === "iva" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300">
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
                                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                        mode === "add"
                                            ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                                >
                                    <DollarSign size={16} />
                                    Agregar IVA
                                </button>
                                <button
                                    onClick={() => setMode("extract")}
                                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                        mode === "extract"
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
                        <CardContent className="space-y-6">
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
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300">
                    {/* Investment Parameters */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Coins className="w-5 h-5 text-indigo-500" />
                                Parámetros de Inversión
                            </CardTitle>
                            <CardDescription>
                                Calcula el retorno o proyecta el precio de venta de tus inversiones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Investment Mode Selector */}
                            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <button
                                    onClick={() => setInvMode("roi")}
                                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                        invMode === "roi"
                                            ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                                >
                                    <TrendingUp size={16} />
                                    Calcular ROI / Ganancia
                                </button>
                                <button
                                    onClick={() => setInvMode("target")}
                                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                        invMode === "target"
                                            ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                                >
                                    <ArrowRightLeft size={16} />
                                    Venta Objetivo
                                </button>
                            </div>

                            {/* Input Controls */}
                            <div className="space-y-5 pt-2">
                                {/* Precio de Compra */}
                                <div className="space-y-2">
                                    <Label htmlFor="buyPrice" className="text-gray-700 dark:text-gray-300">
                                        Precio de Compra (por Unidad)
                                    </Label>
                                    <MoneyInput
                                        id="buyPrice"
                                        value={buyPrice || ""}
                                        onValueChange={(val) => setBuyPrice(val)}
                                        placeholder="0"
                                        className="text-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                    />
                                </div>

                                {/* Mode Specific Input */}
                                {invMode === "roi" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="sellPrice" className="text-gray-700 dark:text-gray-300">
                                            Precio de Venta (por Unidad)
                                        </Label>
                                        <MoneyInput
                                            id="sellPrice"
                                            value={sellPrice || ""}
                                            onValueChange={(val) => setSellPrice(val)}
                                            placeholder="0"
                                            className="text-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="targetGain" className="text-gray-700 dark:text-gray-300">
                                            Rentabilidad Objetivo (%)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="targetGain"
                                                type="number"
                                                step="0.01"
                                                placeholder="20"
                                                className="pr-8 text-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                                value={targetGain}
                                                onChange={(e) => setTargetGain(e.target.value)}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <Percent className="h-4 w-4 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Cantidad & Comisión */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity" className="text-gray-700 dark:text-gray-300">
                                            Cantidad / Títulos
                                        </Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            placeholder="1"
                                            className="text-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="commissionPercent" className="text-gray-700 dark:text-gray-300">
                                            Comisión por Op. (%)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="commissionPercent"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="pr-8 text-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                                                value={commissionPercent}
                                                onChange={(e) => setCommissionPercent(e.target.value)}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <Percent className="h-4 w-4 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Investment Results */}
                    <Card className={`border shadow-sm transition-all duration-300 ${
                        netProfit > 0
                            ? "border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10"
                            : netProfit < 0
                            ? "border-rose-100 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10"
                            : "border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/5"
                    }`}>
                        <CardHeader className="pb-4">
                            <CardTitle className={`text-lg font-bold ${
                                netProfit > 0
                                    ? "text-emerald-900 dark:text-emerald-100"
                                    : netProfit < 0
                                    ? "text-rose-900 dark:text-rose-100"
                                    : "text-indigo-900 dark:text-indigo-100"
                            }`}>
                                Resultados de Inversión
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* ROI Performance Ring/Header */}
                            <div className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                    Rentabilidad Neta (ROI)
                                </span>
                                <div className="flex items-center gap-2">
                                    {netProfit > 0 ? (
                                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                                    ) : netProfit < 0 ? (
                                        <TrendingDown className="w-8 h-8 text-rose-500" />
                                    ) : (
                                        <Coins className="w-8 h-8 text-gray-400" />
                                    )}
                                    <span className={`text-4xl font-extrabold tracking-tight ${
                                        netProfit > 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : netProfit < 0
                                            ? "text-rose-600 dark:text-rose-400"
                                            : "text-gray-500 dark:text-gray-400"
                                    }`}>
                                        {netRoi > 0 ? "+" : ""}{formatPercent(netRoi)}
                                    </span>
                                </div>
                                <span className={`mt-2 text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${
                                    netProfit > 0
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                        : netProfit < 0
                                        ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                }`}>
                                    {netProfit > 0 ? "Ganancia" : netProfit < 0 ? "Pérdida" : "Sin Ganancia/Pérdida"}
                                </span>
                            </div>

                            {/* Mode specific highlight (Price Selling Target) */}
                            {invMode === "target" && numBuyPrice > 0 && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">
                                            Precio Venta Objetivo
                                        </span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(calculatedSellPrice)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                                            Rentabilidad Bruta
                                        </span>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            +{formatPercent(grossRoi)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Breakdown */}
                            <div className="space-y-3 pt-2 text-sm">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">Inversión Compra</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(totalBuyRaw)}
                                    </span>
                                </div>

                                {numCommissionPercent > 0 && (
                                    <>
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 pl-4">
                                            <span>Comisión de Compra ({numCommissionPercent}%)</span>
                                            <span>+{formatCurrency(buyCommission)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 pl-4">
                                            <span>Comisión de Venta ({numCommissionPercent}%)</span>
                                            <span>+{formatCurrency(sellCommission)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300">
                                            <span>Inversión Total (Con Comisiones)</span>
                                            <span>{formatCurrency(totalInvestment)}</span>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {invMode === "roi" ? "Retorno Neto Recibido" : "Retorno Neto Proyectado"}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(totalReturnNet)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-gray-900 dark:text-white text-base">
                                        {netProfit >= 0 ? "Ganancia Neta" : "Pérdida Neta"}
                                    </span>
                                    <span className={`text-xl font-extrabold ${
                                        netProfit > 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : netProfit < 0
                                            ? "text-rose-600 dark:text-rose-400"
                                            : "text-gray-700 dark:text-gray-300"
                                    }`}>
                                        {formatCurrency(netProfit)}
                                    </span>
                                </div>
                            </div>

                            {/* Help Alert */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl flex gap-2.5 items-start">
                                <Info size={16} className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {invMode === "roi" 
                                        ? "La rentabilidad neta tiene en cuenta los costos de compra y comisiones aplicables a ambas operaciones (compra y venta)."
                                        : "El precio de venta objetivo se calcula sumando la rentabilidad neta deseada y compensando las comisiones aplicables para que recibas el retorno neto exacto."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
