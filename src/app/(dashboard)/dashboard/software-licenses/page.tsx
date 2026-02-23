"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Copy, Edit, Trash2, Box, User, Calendar, BriefcaseBusiness } from "lucide-react";
import { useData } from "@/context/data-context";

export default function SoftwareLicensesListPage() {
    const { softwareLicenses, contacts, deleteSoftwareLicense } = useData();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredLicenses = softwareLicenses.filter(license => {
        const searchLower = searchTerm.toLowerCase();
        const clientName = contacts.find(c => c.id === license.clientId)?.name.toLowerCase() || "";
        return (
            license.softwareType.toLowerCase().includes(searchLower) ||
            (license.productKey || "").toLowerCase().includes(searchLower) ||
            (license.assignedTo && license.assignedTo.toLowerCase().includes(searchLower)) ||
            clientName.includes(searchLower)
        );
    });

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copiado al portapapeles`);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar esta licencia de software?")) {
            await deleteSoftwareLicense(id);
        }
    };

    const getClientName = (id?: string) => {
        if (!id) return "Sin Cliente";
        return contacts.find(c => c.id === id)?.name || "Cliente Desconocido";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Licencias de Software</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona licencias generales: Windows, Office, AutoCAD, etc.</p>
                </div>
                <Link
                    href="/dashboard/software-licenses/create"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Licencia
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por software, clave o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLicenses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                        <Box size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>No se encontraron licencias de software.</p>
                    </div>
                ) : (
                    filteredLicenses.map((license) => (
                        <div key={license.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            {/* Header / Banner */}
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 relative"></div>

                            <div className="p-5 flex-1 space-y-4">
                                {/* Title & Actions */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                            <Box size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground line-clamp-1" title={license.softwareType}>{license.softwareType}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <BriefcaseBusiness size={12} />
                                                <span className="truncate max-w-[150px]">{getClientName(license.clientId)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Link
                                            href={`/dashboard/software-licenses/${license.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(license.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Product Key Map */}
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Clave de Producto / Serial</p>
                                        <div className="font-mono text-sm text-foreground truncate font-bold text-indigo-600 dark:text-indigo-400">
                                            {license.productKey || "Sin Clave"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(license.productKey || "", "Clave")}
                                        className="p-1.5 text-gray-400 hover:text-foreground rounded transition-colors"
                                        title="Copiar Clave"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 gap-2 text-sm pt-2 border-t border-border mt-3">
                                    {license.assignedTo && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <User size={14} className="text-gray-400" />
                                            <span>Asignado a: <span className="font-medium">{license.assignedTo}</span></span>
                                        </div>
                                    )}

                                    {license.purchaseDate && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Calendar size={14} className="text-gray-400" />
                                            <span>Comprado: {new Date(license.purchaseDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
