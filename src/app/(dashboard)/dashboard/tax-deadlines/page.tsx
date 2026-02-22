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

    const getStatusInfo = (dateString: string) => {
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Obligaciones Fiscales</h1>
                    <p className="text-gray-500 dark:text-gray-400">Controla los vencimientos de impuestos y renovaciones.</p>
                </div>
                <Link
                    href="/dashboard/tax-deadlines/create"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Obligación
                </Link>
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

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDeadlines.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                        <Landmark size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>No se encontraron obligaciones fiscales registradas.</p>
                    </div>
                ) : (
                    filteredDeadlines.map((deadline) => {
                        const status = getStatusInfo(deadline.expirationDate);

                        return (
                            <div key={deadline.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                {/* Header / Banner */}
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 relative"></div>

                                <div className="p-5 flex-1 space-y-4">
                                    {/* Title & Actions */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                                <Landmark size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground line-clamp-1" title={deadline.businessName}>{deadline.businessName}</h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="font-mono">NIT: {deadline.taxId}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Link
                                                href={`/dashboard/tax-deadlines/${deadline.id}/edit`}
                                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(deadline.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Types & Badge */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg">
                                            {deadline.taxType}
                                        </span>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                                            {status.icon}
                                            {status.label}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                                        <Calendar className="text-gray-400" size={20} />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Fecha de Vencimiento</p>
                                            <p className="font-medium text-foreground">
                                                {new Date(deadline.expirationDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
