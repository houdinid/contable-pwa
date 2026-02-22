"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Wifi, Copy, Eye, EyeOff, Router, Edit, Trash2, MapPin, User, Server, Shield } from "lucide-react";
import { useData } from "@/context/data-context";
import { WifiNetwork } from "@/types";

export default function WifiListPage() {
    const { wifiNetworks, contacts, deleteWifiNetwork } = useData();
    const [searchTerm, setSearchTerm] = useState("");
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    const filteredNetworks = wifiNetworks.filter(network => {
        const searchLower = searchTerm.toLowerCase();
        const clientName = contacts.find(c => c.id === network.clientId)?.name.toLowerCase() || "";
        return (
            network.ssid.toLowerCase().includes(searchLower) ||
            clientName.includes(searchLower) ||
            (network.area && network.area.toLowerCase().includes(searchLower)) ||
            (network.ipAddress && network.ipAddress.includes(searchLower))
        );
    });

    const togglePassword = (id: string) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        // You would typically show a toast notification here
        alert(`${label} copiado al portapapeles`);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar esta red?")) {
            await deleteWifiNetwork(id);
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
                    <h1 className="text-2xl font-bold text-foreground">Redes WiFi y Dispositivos</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona accesos y configuraciones de red.</p>
                </div>
                <Link
                    href="/dashboard/wifi/create"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Red
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por SSID, Cliente, IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNetworks.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                        <Wifi size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>No se encontraron redes WiFi.</p>
                    </div>
                ) : (
                    filteredNetworks.map((network) => (
                        <div key={network.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            {/* Header / Banner */}
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 relative"></div>

                            <div className="p-5 flex-1 space-y-4">
                                {/* Title & Actions */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                            <Wifi size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground line-clamp-1" title={network.ssid}>{network.ssid}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <User size={12} />
                                                <span className="truncate max-w-[150px]">{getClientName(network.clientId)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Link
                                            href={`/dashboard/wifi/${network.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(network.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Password Section */}
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Contraseña</p>
                                        <div className="font-mono text-sm text-foreground truncate">
                                            {showPasswords[network.id] ? (network.password || "Sin contraseña") : "••••••••"}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => togglePassword(network.id)}
                                            className="p-1.5 text-gray-400 hover:text-foreground rounded transition-colors"
                                            title={showPasswords[network.id] ? "Ocultar" : "Mostrar"}
                                        >
                                            {showPasswords[network.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(network.password || "", "Contraseña")}
                                            className="p-1.5 text-gray-400 hover:text-foreground rounded transition-colors"
                                            title="Copiar Contraseña"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {network.area && (
                                        <div className="col-span-2 flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <MapPin size={14} className="text-gray-400" />
                                            <span>{network.area}</span>
                                        </div>
                                    )}

                                    {network.ipAddress && (
                                        <div className="col-span-2 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 px-2 py-1 rounded">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Server size={14} className="text-gray-400 flex-shrink-0" />
                                                <span className="font-mono text-xs truncate">{network.ipAddress}</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(network.ipAddress || "", "IP")}
                                                className="text-gray-400 hover:text-foreground p-1"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    )}

                                    {network.deviceType && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mt-1">
                                            <Router size={12} />
                                            <span className="capitalize">{network.deviceType.replace("_", " ")}</span>
                                        </div>
                                    )}
                                    {network.encryption && (
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mt-1 justify-end">
                                            <Shield size={12} />
                                            <span>{network.encryption}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Photo (if exists) */}
                            {network.photoUrl && (
                                <div className="h-32 bg-gray-100 dark:bg-gray-900 border-t border-border relative group">
                                    <img
                                        src={network.photoUrl}
                                        alt={`Foto de ${network.ssid}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Link
                                            href={`/dashboard/wifi/${network.id}/edit`}
                                            className="px-3 py-1 bg-background/90 text-foreground text-xs rounded-full shadow-sm font-medium"
                                        >
                                            Ver Detalles
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
