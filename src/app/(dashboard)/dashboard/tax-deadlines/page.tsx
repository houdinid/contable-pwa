"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Landmark, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useData } from "@/context/data-context";

export default function TaxDeadlinesListPage() {
    const { taxDeadlines, deleteTaxDeadline } = useData();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredDeadlines = taxDeadlines.filter(deadline => {
        const searchLower = searchTerm.toLowerCase();
        return (
            deadline.businessName.toLowerCase().includes(searchLower) ||
            deadline.taxId.toLowerCase().includes(searchLower) ||
            deadline.taxType.toLowerCase().includes(searchLower)
        );
    });

    // Sort by closest expiration date
    filteredDeadlines.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar esta obligación fiscal?")) {
            await deleteTaxDeadline(id);
        }
    };

    const getStatusInfo = (dateString: string): { label: string, color: string, icon: React.ReactNode } => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(dateString);
        expDate.setHours(0, 0, 0, 0);

        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: "Vencida",
                color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
                icon: <AlertTriangle size={14} />
            };
        } else if (diffDays <= 7) {
            return {
                label: `Vence en ${diffDays} días`,
                color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
                icon: <AlertTriangle size={14} />
            };
        } else {
            return {
                label: "Al día",
                color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
                icon: <CheckCircle2 size={14} />
            };
        }
    };

    const groupedDeadlines = filteredDeadlines.reduce((acc, deadline) => {
        if (!acc[deadline.businessName]) {
            acc[deadline.businessName] = {
                taxId: deadline.taxId,
                items: []
            };
        }
        acc[deadline.businessName].items.push(deadline);
        return acc;
    }, {} as Record<string, { taxId: string, items: typeof filteredDeadlines }>);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Obligaciones Fiscales</h1>
                    <p className="text-gray-500 dark:text-gray-400">Controla los vencimientos de impuestos y renovaciones.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/dashboard/tax-deadlines/types"
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <Landmark size={20} className="text-amber-500" />
                        Gestionar Impuestos
                    </Link>
                    <Link
                        href="/dashboard/tax-deadlines/create"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        <Plus size={20} />
                        Nueva Obligación
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por empresa, NIT o tipo de impuesto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
            </div>

            {/* Grouped Lists */}
            <div className="space-y-8">
                {Object.keys(groupedDeadlines).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                        <Landmark size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>No se encontraron obligaciones fiscales registradas.</p>
                    </div>
                ) : (
                    Object.entries(groupedDeadlines).map(([businessName, group]) => (
                        <div key={businessName} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
                            {/* Card Header - Business Info */}
                            <div className="p-5 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                                        <Landmark size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground leading-tight">{businessName}</h2>
                                        <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs uppercase letter-tracking-wider">NIT: {group.taxId}</span>
                                            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                                                {group.items.length} {group.items.length === 1 ? 'Obligación' : 'Obligaciones'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body - Deadlines List */}
                            <div className="divide-y divide-border">
                                {group.items.map((deadline) => {
                                    const status = getStatusInfo(deadline.expirationDate);
                                    return (
                                        <div key={deadline.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors group">
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                                                {/* Tax Type */}
                                                <div className="min-w-[200px]">
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Impuesto / Obligación</p>
                                                    <span className="text-base font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                                                        {deadline.taxType}
                                                    </span>
                                                </div>

                                                {/* Expiration Date */}
                                                <div className="min-w-[150px]">
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Vencimiento</p>
                                                    <div className="flex items-center gap-2 text-foreground font-medium">
                                                        <Calendar size={16} className="text-muted-foreground" />
                                                        {new Date(deadline.expirationDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Estado</p>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${status.color.includes('text-red') ? 'ring-red-500/20' : status.color.includes('text-amber') ? 'ring-amber-500/20' : 'ring-emerald-500/20'} ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Individual Actions */}
                                            <div className="flex items-center gap-2 self-end sm:self-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/dashboard/tax-deadlines/${deadline.id}/edit`}
                                                    className="p-2.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all border border-transparent hover:border-amber-200"
                                                    title="Editar Obligación"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(deadline.id)}
                                                    className="p-2.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-transparent hover:border-red-200"
                                                    title="Eliminar Obligación"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
