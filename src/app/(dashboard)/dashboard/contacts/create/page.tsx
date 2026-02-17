"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { Save, User, Building2, ArrowLeft } from "lucide-react";
import type { Contact } from "@/types";

export default function CreateContactPage() {
    const router = useRouter();
    const { addContact } = useData();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Omit<Contact, "id" | "createdAt">>({
        name: "",
        email: "",
        phone: "",
        address: "",
        contactPerson: "",
        taxId: "",
        type: "client",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name.trim()) throw new Error("El nombre es obligatorio");

            await addContact(formData);
            router.push("/dashboard/contacts");
        } catch (err) {
            alert("Error al guardar: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    Nuevo Contacto
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <label className={`
            flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
            ${formData.type === 'client' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}
          `}>
                        <input
                            type="radio"
                            name="type"
                            value="client"
                            checked={formData.type === 'client'}
                            onChange={() => setFormData({ ...formData, type: 'client' })}
                            className="hidden"
                        />
                        <User size={24} />
                        <span className="font-medium">Cliente</span>
                    </label>

                    <label className={`
            flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
            ${formData.type === 'supplier' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}
          `}>
                        <input
                            type="radio"
                            name="type"
                            value="supplier"
                            checked={formData.type === 'supplier'}
                            onChange={() => setFormData({ ...formData, type: 'supplier' })}
                            className="hidden"
                        />
                        <Building2 size={24} />
                        <span className="font-medium">Proveedor</span>
                    </label>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo / Razón Social</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ej. Juan Pérez o Empresa SAS"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Identificación (NIT/CC)</label>
                            <input
                                type="text"
                                value={formData.taxId}
                                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ej. 12345678-9"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="contacto@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="+57 300 123 4567"
                            />
                        </div>
                        <div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Calle 123 # 45-67"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Contacto (Encargado)</label>
                                <input
                                    type="text"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ej. María González (Gerente)"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mr-4 px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Guardando...' : 'Guardar Contacto'}
                    </button>
                </div>
            </form>
        </div>
    );
}
