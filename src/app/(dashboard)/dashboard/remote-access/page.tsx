"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Copy, Eye, EyeOff, Edit, Trash2, User, Server, MonitorSmartphone } from "lucide-react";
import { useData } from "@/context/data-context";

export default function RemoteAccessListPage() {
    const { remoteAccesses, contacts, deleteRemoteAccess } = useData();
    const [searchTerm, setSearchTerm] = useState("");
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    const filteredAccesses = remoteAccesses.filter(access => {
        const searchLower = searchTerm.toLowerCase();
        const clientName = contacts.find(c => c.id === access.clientId)?.name.toLowerCase() || "";
        return (
            (access.softwareType && access.softwareType.toLowerCase().includes(searchLower)) ||
            (access.connectionCode && access.connectionCode.toLowerCase().includes(searchLower)) ||
            (access.hostname && access.hostname.toLowerCase().includes(searchLower)) ||
            clientName.includes(searchLower)
        );
    });

    const togglePassword = (id: string) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copiado al portapapeles`);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este acceso remoto?")) {
            await deleteRemoteAccess(id);
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
                    <h1 className="text-2xl font-bold text-foreground">Acceso Remoto</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona credenciales de AnyDesk, RustDesk y otros.</p>
                </div>
                <Link
                    href="/dashboard/remote-access/create"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Acceso
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por cliente, ID, software o hostname..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccesses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                        <MonitorSmartphone size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>No se encontraron accesos remotos.</p>
                    </div>
                ) : (
                    filteredAccesses.map((access) => (
                        <div key={access.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            {/* Header / Banner */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 relative"></div>

                            <div className="p-5 flex-1 space-y-4">
                                {/* Title & Actions */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <MonitorSmartphone size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground line-clamp-1" title={access.connectionCode}>{access.connectionCode}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <User size={12} />
                                                <span className="truncate max-w-[150px]">{getClientName(access.clientId)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Link
                                            href={`/dashboard/remote-access/${access.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(access.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Connection Code Copy Section */}
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">ID de Conexión</p>
                                        <div className="font-mono text-sm text-foreground truncate font-bold text-blue-600 dark:text-blue-400">
                                            {access.connectionCode || "Sin ID"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(access.connectionCode || "", "ID")}
                                        className="p-1.5 text-gray-400 hover:text-foreground rounded transition-colors"
                                        title="Copiar ID"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>


                                {/* Password Section */}
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Contraseña</p>
                                        <div className="font-mono text-sm text-foreground truncate">
                                            {showPasswords[access.id] ? (access.password || "Sin contraseña") : "••••••••"}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => togglePassword(access.id)}
                                            className="p-1.5 text-gray-400 hover:text-foreground rounded transition-colors"
                                            title={showPasswords[access.id] ? "Ocultar" : "Mostrar"}
                                        >
                                            {showPasswords[access.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(access.password || "", "Contraseña")}
                                            className="p-1.5 text-gray-400 hover:text-foreground rounded transition-colors"
                                            title="Copiar Contraseña"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {access.hostname && (
                                        <div className="col-span-2 flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Server size={14} className="text-gray-400" />
                                            <span>Equipo: {access.hostname}</span>
                                        </div>
                                    )}

                                    {access.softwareType && (
                                        <div className="col-span-2 flex items-center justify-start bg-gray-50 dark:bg-gray-900/30 px-2 py-1 rounded">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold">{access.softwareType}</span>
                                            </div>
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
