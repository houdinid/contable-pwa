"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Shield, MapPin, KeyRound, MonitorSmartphone, Plus, X } from "lucide-react";
import { useData } from "@/context/data-context";
import { ContactFormModal } from "@/components/forms/contact-form-modal";

export default function EditAntivirusPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const { antivirusLicenses, updateAntivirusLicense, contacts } = useData();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [supplierId, setSupplierId] = useState("");
    const [licenseName, setLicenseName] = useState("");
    const [productKey, setProductKey] = useState("");
    const [startDate, setStartDate] = useState("");
    const [expirationDate, setExpirationDate] = useState("");
    const [deviceLimit, setDeviceLimit] = useState(1);

    // Dynamic Devices Array
    const [devices, setDevices] = useState<{ id: string, hostname: string }[]>([]);

    useEffect(() => {
        if (!id || antivirusLicenses.length === 0) return;

        const license = antivirusLicenses.find(a => a.id === id);
        if (license) {
            setSupplierId(license.supplierId || "");
            setLicenseName(license.licenseName || "");
            setProductKey(license.productKey || "");

            // Format dates for input[type="date"]
            if (license.startDate) {
                setStartDate(new Date(license.startDate).toISOString().split('T')[0]);
            }
            if (license.expirationDate) {
                setExpirationDate(new Date(license.expirationDate).toISOString().split('T')[0]);
            }

            setDeviceLimit(license.deviceLimit || 1);

            // Map devices
            if (license.devices) {
                setDevices(license.devices.map(d => ({ id: d.id, hostname: d.hostname })));
            }
        }
        setIsLoading(false);
    }, [id, antivirusLicenses]);

    const addDeviceField = () => {
        if (devices.length >= deviceLimit) {
            alert(`Has alcanzado el límite de ${deviceLimit} equipos para esta licencia.`);
            return;
        }
        setDevices([...devices, { id: crypto.randomUUID(), hostname: "" }]);
    };

    const updateDevice = (index: number, value: string) => {
        const newDevices = [...devices];
        newDevices[index].hostname = value;
        setDevices(newDevices);
    };

    const removeDevice = (index: number) => {
        setDevices(devices.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!supplierId || !licenseName || !productKey || !startDate || !expirationDate) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }

        if (devices.some(d => !d.hostname.trim())) {
            alert("Existen nombres de equipo en blanco.");
            return;
        }

        if (devices.length > deviceLimit) {
            alert(`El número de equipos excede el límite de ${deviceLimit}.`);
            return;
        }

        setIsSubmitting(true);

        try {
            await updateAntivirusLicense(id, {
                supplierId,
                licenseName,
                productKey,
                startDate,
                expirationDate,
                deviceLimit,
                devices: devices.map(d => ({
                    id: d.id,
                    hostname: d.hostname,
                    licenseId: id,
                    createdAt: new Date().toISOString()
                }))
            });
            router.push("/dashboard/antivirus");
        } catch (error) {
            console.error(error);
            alert("Error al actualizar la licencia");
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
                    href="/dashboard/antivirus"
                    className="p-2 text-gray-500 hover:bg-emerald-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Editar Licencia Antivirus</h1>
                    <p className="text-gray-500 dark:text-gray-400">Actualiza la información de la licencia y sus equipos.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Proveedor */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <MapPin className="text-emerald-500" size={20} />
                        <h2 className="font-semibold text-foreground">Proveedor de Licencia</h2>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-medium text-foreground mb-1">Proveedor *</label>
                        <div className="flex gap-2">
                            <select
                                required
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            >
                                <option value="">Seleccionar Proveedor...</option>
                                {contacts.filter(c => c.type === 'supplier').map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setIsContactModalOpen(true)}
                                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                title="Crear Nuevo Proveedor"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Detalles de la Licencia */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                        <Shield className="text-emerald-500" size={20} />
                        <h2 className="font-semibold text-foreground">Detalles del Producto</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Nombre del Antivirus / Licencia *</label>
                            <input
                                type="text"
                                required
                                value={licenseName}
                                onChange={(e) => setLicenseName(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="Ej: ESET Endpoint Security, Kaspersky..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Clave de Activación (Serial) *</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={productKey}
                                    onChange={(e) => setProductKey(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Fecha de Compra / Activación *</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Fecha de Expiración *</label>
                            <input
                                type="date"
                                required
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Límite de Equipos Permitidos *</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={deviceLimit}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    setDeviceLimit(isNaN(v) ? 1 : v);
                                }}
                                className="w-full md:w-1/3 px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Equipos Asignados (Relación 1 a N) */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MonitorSmartphone className="text-emerald-500" size={20} />
                            <h2 className="font-semibold text-foreground">Equipos Asignados</h2>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">
                            {devices.length} de {deviceLimit} asignados
                        </span>
                    </div>
                    <div className="p-6">
                        {devices.length === 0 ? (
                            <p className="text-sm text-gray-500 italic mb-4">Aún no has registrado equipos para esta licencia.</p>
                        ) : (
                            <div className="space-y-3 mb-4">
                                {devices.map((device, index) => (
                                    <div key={device.id} className="flex gap-2 items-center">
                                        <div className="font-mono text-sm text-gray-400 w-6">{index + 1}.</div>
                                        <input
                                            type="text"
                                            required
                                            value={device.hostname}
                                            onChange={(e) => updateDevice(index, e.target.value)}
                                            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                                            placeholder="Nombre del Equipo (ej: PC-CONTABILIDAD)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeDevice(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={addDeviceField}
                            disabled={devices.length >= deviceLimit}
                            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} />
                            Añadir Equipo
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/dashboard/antivirus"
                        className="px-6 py-2 border border-border text-foreground rounded-xl hover:bg-muted/50 transition-colors font-medium"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
                    if (newId) setSupplierId(newId);
                }}
                defaultType="supplier"
            />
        </div>
    );
}
