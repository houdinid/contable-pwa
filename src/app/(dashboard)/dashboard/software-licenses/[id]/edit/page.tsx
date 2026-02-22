"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, MapPin, KeyRound, User, Plus, Box, Calendar } from "lucide-react";
import { useData } from "@/context/data-context";
import { ContactFormModal } from "@/components/forms/contact-form-modal";

export default function EditSoftwareLicensePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const { softwareLicenses, updateSoftwareLicense, contacts } = useData();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [clientId, setClientId] = useState("");
    const [softwareType, setSoftwareType] = useState("");
    const [productKey, setProductKey] = useState("");
    const [purchaseDate, setPurchaseDate] = useState("");
    const [assignedTo, setAssignedTo] = useState("");

    useEffect(() => {
        if (!id || softwareLicenses.length === 0) return;

        const license = softwareLicenses.find(s => s.id === id);
        if (license) {
            setClientId(license.clientId || "");
            setSoftwareType(license.softwareType || "");
            setProductKey(license.productKey || "");

            if (license.purchaseDate) {
                setPurchaseDate(new Date(license.purchaseDate).toISOString().split('T')[0]);
            }

            setAssignedTo(license.assignedTo || "");
        }
        setIsLoading(false);
    }, [id, softwareLicenses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientId || !softwareType) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        setIsSubmitting(true);

        try {
            await updateSoftwareLicense(id, {
                clientId,
                softwareType,
                productKey,
                purchaseDate: purchaseDate || undefined,
                assignedTo: assignedTo || undefined,
            });
            router.push("/dashboard/software-licenses");
        } catch (error) {
            console.error(error);
            alert("Error al actualizar la licencia de software");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Cargando...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard/software-licenses"
                    className="p-2 text-gray-500 hover:bg-indigo-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Editar Licencia de Software</h1>
                    <p className="text-gray-500 dark:text-gray-400">Actualiza los detalles del software y asignaciones.</p>
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
                        <label className="block text-sm font-medium text-foreground mb-1">Empresa Propietaria *</label>
                        <div className="flex gap-2">
                            <select
                                required
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {contacts.filter(c => c.type === 'client').map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setIsContactModalOpen(true)}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                title="Crear Nuevo Cliente"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Detalles del Software */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <Box className="text-indigo-500" size={20} />
                        <h2 className="font-semibold text-foreground">Detalles del Software</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Software / Aplicación *</label>
                            <input
                                type="text"
                                required
                                value={softwareType}
                                onChange={(e) => setSoftwareType(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Ej: Microsoft Windows 11 Pro, Adobe Creative Cloud..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Clave de Producto (Serial)</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={productKey}
                                    onChange={(e) => setProductKey(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Fecha de Compra</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Ej: PC de Caja, Juan Pérez..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/dashboard/software-licenses"
                        className="px-6 py-2 border border-border text-foreground rounded-xl hover:bg-muted/50 transition-colors font-medium"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Guardando...</span>
                        ) : (
                            <>
                                <Save size={20} />
                                Guardar Cambios
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
