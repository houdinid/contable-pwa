"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Shield, Copy, Edit, Trash2, Calendar, Monitor, User } from "lucide-react";
import { useData } from "@/context/data-context";

export default function AntivirusListPage() {
    const { antivirusLicenses, deleteAntivirusLicense, contacts } = useData();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredLicenses = antivirusLicenses.filter(license => {
        const searchLower = searchTerm.toLowerCase();
        const supplierName = contacts.find(c => c.id === license.supplierId)?.name.toLowerCase() || "";
        return (
            license.licenseName.toLowerCase().includes(searchLower) ||
            license.productKey.toLowerCase().includes(searchLower) ||
            supplierName.includes(searchLower)
        );
    });

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copiado al portapapeles`);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar esta licencia y sus equipos asociados?")) {
            await deleteAntivirusLicense(id);
        }
    };

    const getSupplierName = (id?: string) => {
        if (!id) return "Sin Proveedor";
        return contacts.find(c => c.id === id)?.name || "Proveedor Desconocido";
    };

    // Calculate days remaining
    const getDaysRemaining = (expDate: string) => {
        const today = new Date();
        const exp = new Date(expDate);
        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Licencias de Antivirus</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona licencias y equipos asignados.</p>
                </div>
                <Link
                    href="/dashboard/antivirus/create"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
                    placeholder="Buscar por producto, clave o proveedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLicenses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                        <Shield size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>No se encontraron licencias de antivirus.</p>
                    </div>
                ) : (
                    filteredLicenses.map((license) => {
                        const daysRemaining = getDaysRemaining(license.expirationDate);
                        const isExpiringSoon = daysRemaining <= 15 && daysRemaining > 0;
                        const isExpired = daysRemaining <= 0;

                        const usageRatio = (license.devices?.length || 0) / license.deviceLimit;
                        const isFull = usageRatio >= 1;

                        return (
                            <div key={license.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                {/* Header / Banner */}
                                <div className={`h-2 relative ${isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>

                                <div className="p-5 flex-1 space-y-4">
                                    {/* Title & Actions */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30'}`}>
                                                <Shield size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground line-clamp-1" title={license.licenseName}>{license.licenseName}</h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <User size={12} />
                                                    <span className="truncate max-w-[150px]">{getSupplierName(license.supplierId)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Link
                                                href={`/dashboard/antivirus/${license.id}/edit`}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
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

                                    {/* Product Key Copy Section */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Clave del Producto</p>
                                            <div className="font-mono text-sm text-foreground truncate font-bold text-emerald-600 dark:text-emerald-400">
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

                                    {/* Dates & Status Grid */}
                                    <div className="grid grid-cols-2 gap-3 text-sm border-t border-border pt-3">
                                        <div className="col-span-1">
                                            <p className="text-xs text-gray-500 mb-1">Vencimiento</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className={isExpired ? "text-red-500" : isExpiringSoon ? "text-orange-500" : "text-gray-400"} />
                                                <span className={`font-medium ${isExpired ? "text-red-600" : isExpiringSoon ? "text-orange-600" : ""}`}>
                                                    {new Date(license.expirationDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {isExpired && <p className="text-[10px] text-red-600 font-bold mt-0.5">VENCIDA</p>}
                                            {isExpiringSoon && <p className="text-[10px] text-orange-600 font-bold mt-0.5">VENCE EN {daysRemaining} DÍAS</p>}
                                        </div>

                                        <div className="col-span-1 border-l border-border pl-3">
                                            <p className="text-xs text-gray-500 mb-1">Uso de Equipos</p>
                                            <div className="flex items-center gap-2">
                                                <Monitor size={14} className={isFull ? "text-orange-500" : "text-gray-400"} />
                                                <span className={`font-bold ${isFull ? "text-orange-600" : "text-foreground"}`}>
                                                    {license.devices?.length || 0} / {license.deviceLimit}
                                                </span>
                                            </div>
                                            {isFull && <p className="text-[10px] text-orange-600 font-bold mt-0.5">LÍMITE ALCANZADO</p>}
                                        </div>

                                        {/* Nested list of devices */}
                                        <div className="col-span-2 mt-2">
                                            <p className="text-xs text-gray-500 mb-1">Equipos Asignados</p>
                                            {license.devices && license.devices.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {license.devices.map(d => (
                                                        <span key={d.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                            {d.hostname}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">No hay equipos asignados</p>
                                            )}
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
