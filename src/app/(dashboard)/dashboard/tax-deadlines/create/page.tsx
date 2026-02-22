"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Landmark, Calendar, Search } from "lucide-react";
import { useData } from "@/context/data-context";

export default function CreateTaxDeadlinePage() {
    const router = useRouter();
    const { addTaxDeadline, businessIdentities } = useData();

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [businessName, setBusinessName] = useState("");
    const [taxId, setTaxId] = useState("");
    const [taxType, setTaxType] = useState("");
    const [expirationDate, setExpirationDate] = useState("");

    const handleSelectIdentity = (id: string) => {
        const identity = businessIdentities.find(b => b.id === id);
        if (identity) {
            setBusinessName(identity.name);
            setTaxId(identity.taxId);
        } else {
            setBusinessName("");
            setTaxId("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!businessName || !taxId || !taxType || !expirationDate) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        setIsSubmitting(true);

        try {
            await addTaxDeadline({
                businessName,
                taxId,
                taxType,
                expirationDate
            });
            router.push("/dashboard/tax-deadlines");
        } catch (error) {
            console.error(error);
            alert("Error al guardar la obligación fiscal");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard/tax-deadlines"
                    className="p-2 text-gray-500 hover:bg-amber-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nueva Obligación Fiscal</h1>
                    <p className="text-gray-500 dark:text-gray-400">Registra un vencimiento de impuestos, cámara de comercio, etc.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Empresa y Obligación */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <Landmark className="text-amber-500" size={20} />
                        <h2 className="font-semibold text-foreground">Datos de la Obligación</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="col-span-1 md:col-span-2 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                                Autocompletar desde mis Razones Sociales (Opcional)
                            </label>
                            <select
                                onChange={(e) => handleSelectIdentity(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            >
                                <option value="">Ingresar datos manualmente...</option>
                                {businessIdentities.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.taxId})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Nombre de la Empresa o Persona *</label>
                            <input
                                type="text"
                                required
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                placeholder="Ej: Mi Empresa S.A.S."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">NIT / Identificación Fiscal *</label>
                            <input
                                type="text"
                                required
                                value={taxId}
                                onChange={(e) => setTaxId(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
                                placeholder="900.123.456-7"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Tipo de Impuesto / Obligación *</label>
                            <input
                                list="tax-types"
                                required
                                value={taxType}
                                onChange={(e) => setTaxType(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                placeholder="Ej: Declaración de Renta, IVA, ICA..."
                            />
                            <datalist id="tax-types">
                                <option value="Declaración de Renta" />
                                <option value="IVA" />
                                <option value="ICA" />
                                <option value="Retención en la Fuente" />
                                <option value="Renovación Cámara de Comercio" />
                                <option value="Información Exógena" />
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Fecha de Vencimiento Límite *</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    required
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/dashboard/tax-deadlines"
                        className="px-6 py-2 border border-border text-foreground rounded-xl hover:bg-muted/50 transition-colors font-medium"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Guardando...</span>
                        ) : (
                            <>
                                <Save size={20} />
                                Guardar Obligación
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
