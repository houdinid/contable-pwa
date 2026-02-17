"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Link, ArrowLeft, Save, Upload, X, Wifi, Shield, Server, MapPin, Smartphone } from "lucide-react";
import { useData } from "@/context/data-context";
import { WifiDeviceType } from "@/types";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import { Plus } from "lucide-react";

export default function CreateWifiPage() {
    const router = useRouter();
    const { addWifiNetwork, contacts } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Form State
    const [ssid, setSsid] = useState("");
    const [password, setPassword] = useState("");
    const [encryption, setEncryption] = useState("WPA2");
    const [isHidden, setIsHidden] = useState(false);

    const [deviceType, setDeviceType] = useState<WifiDeviceType>("router");
    const [deviceBrand, setDeviceBrand] = useState("");
    const [model, setModel] = useState("");

    const [clientId, setClientId] = useState("");
    const [area, setArea] = useState("");

    const [ipAddress, setIpAddress] = useState("");
    const [subnetMask, setSubnetMask] = useState("");
    const [gateway, setGateway] = useState("");
    const [dns, setDns] = useState("");

    const [notes, setNotes] = useState("");

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewUrl(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await addWifiNetwork({
                ssid,
                password,
                encryption,
                isHidden,
                deviceType,
                deviceBrand,
                model,
                clientId: clientId || undefined,
                area,
                ipAddress,
                subnetMask,
                gateway,
                dns,
                notes,
                photoUrl: previewUrl || undefined,
            });
            router.push("/dashboard/wifi");
        } catch (error) {
            console.error(error);
            alert("Error al guardar la red WiFi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard/wifi"
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nueva Red WiFi</h1>
                    <p className="text-gray-500 dark:text-gray-400">Registra una nueva configuración de red o dispositivo.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Ubicación y Cliente */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-border flex items-center gap-2">
                        <MapPin className="text-green-500" size={20} />
                        <h2 className="font-semibold text-foreground">Ubicación y Cliente</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Cliente / Empresa</label>
                            <div className="flex gap-2">
                                <select
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
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Área / Ubicación Física</label>
                            <input
                                type="text"
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Ej: Recepción, Piso 2, Sala de Juntas"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Información de Red */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-border flex items-center gap-2">
                        <Wifi className="text-indigo-500" size={20} />
                        <h2 className="font-semibold text-foreground">Información de Red & Seguridad</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-foreground mb-1">Nombre de Red (SSID) *</label>
                            <input
                                type="text"
                                required
                                value={ssid}
                                onChange={(e) => setSsid(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Ej: Oficina_Principal_5G"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-foreground mb-1">Contraseña WiFi</label>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Cifrado / Seguridad</label>
                            <select
                                value={encryption}
                                onChange={(e) => setEncryption(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                <option value="WPA2">WPA2 (Recomendado)</option>
                                <option value="WPA3">WPA3 (Más seguro)</option>
                                <option value="WPA/WPA2">WPA/WPA2 Mixto</option>
                                <option value="WEP">WEP (Inseguro - Legacy)</option>
                                <option value="OPEN">Abierta / Sin contraseña</option>
                            </select>
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer text-foreground">
                                <input
                                    type="checkbox"
                                    checked={isHidden}
                                    onChange={(e) => setIsHidden(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <span>Red Oculta (No difunde SSID)</span>
                            </label>
                        </div>
                    </div>
                </div>




                {/* 3. Configuración IP */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-border flex items-center gap-2">
                        <Server className="text-blue-500" size={20} />
                        <h2 className="font-semibold text-foreground">Configuración IP (LAN)</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Dirección IP</label>
                            <input
                                type="text"
                                value={ipAddress}
                                onChange={(e) => setIpAddress(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                                placeholder="192.168.1.1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Máscara Subred</label>
                            <input
                                type="text"
                                value={subnetMask}
                                onChange={(e) => setSubnetMask(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                                placeholder="255.255.255.0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Puerta de Enlace</label>
                            <input
                                type="text"
                                value={gateway}
                                onChange={(e) => setGateway(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                                placeholder="192.168.1.254"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">DNS Principal</label>
                            <input
                                type="text"
                                value={dns}
                                onChange={(e) => setDns(e.target.value)}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
                                placeholder="8.8.8.8"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Hardware y Foto */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hardware Info */}
                    <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-border flex items-center gap-2">
                            <Smartphone className="text-orange-500" size={20} />
                            <h2 className="font-semibold text-foreground">Hardware del Dispositivo</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Tipo de Dispositivo</label>
                                <select
                                    value={deviceType}
                                    onChange={(e) => setDeviceType(e.target.value as WifiDeviceType)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                    <option value="router">Router / Modem</option>
                                    <option value="access_point">Access Point (AP)</option>
                                    <option value="repeater">Repetidor / Extensor</option>
                                    <option value="switch">Switch Gestionable</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Marca / Fabricante</label>
                                <input
                                    type="text"
                                    value={deviceBrand}
                                    onChange={(e) => setDeviceBrand(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="TP-Link, Cisco, Ubiquiti..."
                                    list="brands"
                                />
                                <datalist id="brands">
                                    <option value="TP-Link" />
                                    <option value="D-Link" />
                                    <option value="Huawei" />
                                    <option value="Cisco" />
                                    <option value="Ubiquiti" />
                                    <option value="MikroTik" />
                                    <option value="Aruba" />
                                    <option value="Tenda" />
                                    <option value="Mercusys" />
                                </datalist>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">Modelo</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Ej: Archer C6, UniFi AC Lite..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-border flex items-center gap-2">
                            <Upload className="text-purple-500" size={20} />
                            <h2 className="font-semibold text-foreground">Foto del Equipo</h2>
                        </div>
                        <div className="p-6">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors relative min-h-[200px]">
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Preview" className="w-full h-40 object-contain rounded-lg mb-2" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                        >
                                            <X size={16} />
                                        </button>
                                        <p className="text-xs text-green-600 font-medium">Imagen cargada</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="text-gray-400 mb-2" size={32} />
                                        <p className="text-sm text-gray-500 mb-2">Arrastra o selecciona una foto</p>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                        >
                                            Seleccionar
                                        </button>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-border">
                        <h2 className="font-semibold text-foreground">Notas Adicionales</h2>
                    </div>
                    <div className="p-6">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Detalles sobre la instalación, ubicación exacta, o instrucciones especiales..."
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/dashboard/wifi"
                        className="px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
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
                                Guardar Red
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
