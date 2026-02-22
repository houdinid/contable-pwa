"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Mail, MapPin, KeyRound, User, ShieldAlert, Plus } from "lucide-react";
import { useData } from "@/context/data-context";
import { ContactFormModal } from "@/components/forms/contact-form-modal";

export default function CreateCorporateEmailPage() {
    const router = useRouter();
    const { addCorporateEmail, contacts } = useData();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Form State
    const [clientId, setClientId] = useState("");
    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [recoveryPhone, setRecoveryPhone] = useState("");
    const [recoveryEmail, setRecoveryEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientId || !emailAddress || !password) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        setIsSubmitting(true);

        try {
            await addCorporateEmail({
                clientId,
                emailAddress,
                password,
                assignedTo: assignedTo || undefined,
                recoveryPhone: recoveryPhone || undefined,
                recoveryEmail: recoveryEmail || undefined,
            });
            router.push("/dashboard/corporate-emails");
        } catch (error) {
            console.error(error);
            alert("Error al guardar el correo corporativo");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard/corporate-emails"
                    className="p-2 text-gray-500 hover:bg-rose-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nuevo Correo Corporativo</h1>
                    <p className="text-gray-500 dark:text-gray-400">Registra una cuenta de correo y su asignación.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Cliente */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <MapPin className="text-purple-500" size={20} />
                        <h2 className="font-semibold text-foreground">Cliente / Empresa</h2>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-medium text-foreground mb-1">Cliente propietario del dominio *</label>
                        <div className="flex gap-2">
                            <select
                                required
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {contacts.filter(c => c.type === 'client').map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setIsContactModalOpen(true)}
                                className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                                title="Crear Nuevo Cliente"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Cuenta y Credenciales */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <Mail className="text-rose-500" size={20} />
                        <h2 className="font-semibold text-foreground">Cuenta y Credenciales</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Dirección de Correo *</label>
                            <input
                                type="email"
                                required
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                placeholder="Ej: admin@empresa.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Contraseña * (Se guardará cifrada)</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all font-mono"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Asignado a (Nombre del Empleado o Puesto)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                    placeholder="Ej: Juan Pérez / Gerente de Ventas"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Datos de Recuperación */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <ShieldAlert className="text-orange-500" size={20} />
                        <h2 className="font-semibold text-foreground">Datos de Recuperación</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Teléfono de Recuperación</label>
                            <input
                                type="tel"
                                value={recoveryPhone}
                                onChange={(e) => setRecoveryPhone(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                placeholder="Ej: +52 55 1234 5678"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Correo de Recuperación Adicional</label>
                            <input
                                type="email"
                                value={recoveryEmail}
                                onChange={(e) => setRecoveryEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                                placeholder="Ej: respaldo@gmail.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/dashboard/corporate-emails"
                        className="px-6 py-2 border border-border text-foreground rounded-xl hover:bg-muted/50 transition-colors font-medium"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Guardando...</span>
                        ) : (
                            <>
                                <Save size={20} />
                                Guardar Cuenta
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
