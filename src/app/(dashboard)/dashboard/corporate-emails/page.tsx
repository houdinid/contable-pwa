"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Copy, Eye, EyeOff, Edit, Trash2, Mail, User, Phone, Shield } from "lucide-react";
import { useData } from "@/context/data-context";

export default function CorporateEmailsListPage() {
    const { corporateEmails, contacts, deleteCorporateEmail } = useData();
    const [searchTerm, setSearchTerm] = useState("");
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    const filteredEmails = corporateEmails.filter(email => {
        const searchLower = searchTerm.toLowerCase();
        const clientName = contacts.find(c => c.id === email.clientId)?.name.toLowerCase() || "";
        return (
            email.emailAddress.toLowerCase().includes(searchLower) ||
            (email.assignedTo && email.assignedTo.toLowerCase().includes(searchLower)) ||
            (email.recoveryEmail && email.recoveryEmail.toLowerCase().includes(searchLower)) ||
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
        if (window.confirm("¿Estás seguro de eliminar este correo corporativo?")) {
            await deleteCorporateEmail(id);
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
                    <h1 className="text-2xl font-bold text-foreground">Correos Corporativos</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona accesos y recuperación de correos de clientes.</p>
                </div>
                <Link
                    href="/dashboard/corporate-emails/create"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Correo
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por correo, cliente, asignado a..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmails.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                        <Mail size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p>No se encontraron correos corporativos.</p>
                    </div>
                ) : (
                    filteredEmails.map((email) => (
                        <div key={email.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            {/* Header / Banner */}
                            <div className="bg-gradient-to-r from-rose-500 to-pink-600 h-2 relative"></div>

                            <div className="p-5 flex-1 space-y-4">
                                {/* Title & Actions */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground line-clamp-1" title={email.emailAddress}>{email.emailAddress}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <Shield size={12} />
                                                <span className="truncate max-w-[150px]">{getClientName(email.clientId)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Link
                                            href={`/dashboard/corporate-emails/${email.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(email.id)}
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
                                            {showPasswords[email.id] ? (email.password || "Sin contraseña") : "••••••••"}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => togglePassword(email.id)}
                                            className="p-1.5 text-gray-400 hover:text-foreground rounded transition-colors"
                                            title={showPasswords[email.id] ? "Ocultar" : "Mostrar"}
                                        >
                                            {showPasswords[email.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(email.password || "", "Contraseña")}
                                            className="p-1.5 text-gray-400 hover:text-foreground rounded transition-colors"
                                            title="Copiar Contraseña"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    {email.assignedTo && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <User size={14} className="text-gray-400" />
                                            <span className="truncate">Usuario: font-medium {email.assignedTo}</span>
                                        </div>
                                    )}

                                    {(email.recoveryPhone || email.recoveryEmail) && (
                                        <div className="mt-2 pt-2 border-t border-border space-y-2">
                                            <p className="text-xs font-semibold text-gray-500">Datos de Recuperación</p>
                                            {email.recoveryPhone && (
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span className="truncate">{email.recoveryPhone}</span>
                                                </div>
                                            )}
                                            {email.recoveryEmail && (
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <span className="truncate">{email.recoveryEmail}</span>
                                                </div>
                                            )}
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
