"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, MonitorSmartphone, MapPin, KeyRound, Plus } from "lucide-react";
import { useData } from "@/context/data-context";
import { ContactFormModal } from "@/components/forms/contact-form-modal";

export default function CreateRemoteAccessPage() {
    const router = useRouter();
    const { addRemoteAccess, contacts } = useData();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Form State
    const [clientId, setClientId] = useState("");
    const [softwareType, setSoftwareType] = useState("AnyDesk");
    const [hostname, setHostname] = useState("");
    const [connectionCode, setConnectionCode] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientId || !softwareType || !connectionCode) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        setIsSubmitting(true);

        try {
            await addRemoteAccess({
                clientId,
                softwareType,
                connectionCode,
                password,
                hostname
            });
            router.push("/dashboard/remote-access");
        } catch (error) {
            console.error(error);
            alert("Error al guardar el acceso remoto");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard/remote-access"
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nuevo Acceso Remoto</h1>
                    <p className="text-gray-500 dark:text-gray-400">Registra las credenciales para asistir a un cliente.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Ubicación y Cliente */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <MapPin className="text-green-500" size={20} />
                        <h2 className="font-semibold text-foreground">Cliente / Empresa</h2>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-medium text-foreground mb-1">Cliente / Empresa *</label>
                        <div className="flex gap-2">
                            <select
                                required
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {contacts.filter(c => c.type === 'client').map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setIsContactModalOpen(true)}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                title="Crear Nuevo Cliente"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Detalles del Acceso */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <MonitorSmartphone className="text-blue-500" size={20} />
                        <h2 className="font-semibold text-foreground">Software y Equipo</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Tipo de Software *</label>
                            <select
                                required
                                value={softwareType}
                                onChange={(e) => setSoftwareType(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="AnyDesk">AnyDesk</option>
                                <option value="RustDesk">RustDesk</option>
                                <option value="TeamViewer">TeamViewer</option>
                                <option value="Supremo">Supremo</option>
                                <option value="VNC">VNC</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Nombre del Equipo (Hostname)</label>
                            <input
                                type="text"
                                value={hostname}
                                onChange={(e) => setHostname(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Ej: PC-RECEPCION, DESKTOP-XX..."
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Credenciales */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <KeyRound className="text-purple-500" size={20} />
                        <h2 className="font-semibold text-foreground">Credenciales de Conexión</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">ID de Conexión *</label>
                            <input
                                type="text"
                                required
                                value={connectionCode}
                                onChange={(e) => setConnectionCode(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                placeholder="Ej: 123 456 789"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Contraseña (Se guardará cifrada)</label>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/dashboard/remote-access"
                        className="px-6 py-2 border border-border text-foreground rounded-xl hover:bg-muted/50 transition-colors font-medium"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Guardando...</span>
                        ) : (
                            <>
                                <Save size={20} />
                                Guardar Acceso
                            </>
                        )}
                    </button>
                </div>
            </form>

            <ContactFormModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                onSuccess={(newName, newId) => {
                    if (newId) setClientId(newId);
                }}
                defaultType="client"
            />
        </div>
    );
}
