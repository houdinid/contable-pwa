"use client";

import Link from "next/link";
import { useState } from "react";
import { useData } from "@/context/data-context";
import { Plus, User, Building2, Phone, Mail, Edit, Filter, MapPin, Copy, CreditCard, Map as MapIcon, Search } from "lucide-react";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import type { Contact } from "@/types";

export default function ContactsPage() {
    const { contacts, loadingData, supplierCategories } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    const handleCreate = () => {
        setEditingContact(null);
        setShowModal(true);
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setShowModal(true);
    };

    // Filter Logic
    const filteredContacts = contacts.filter(contact => {
        const matchesSpecialty = !selectedSpecialty || (contact.type === 'supplier' && contact.specialtyId === selectedSpecialty);
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            contact.name.toLowerCase().includes(searchLower) ||
            (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
            (contact.phone && contact.phone.includes(searchLower)) ||
            (contact.taxId && contact.taxId.toLowerCase().includes(searchLower))
        );

        return matchesSpecialty && matchesSearch;
    });

    if (loadingData) {
        return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando contactos...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Contactos</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona tus Clientes y Proveedores</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-grow sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar contacto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedSpecialty}
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                            className="appearance-none bg-background border border-border text-foreground py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer w-full"
                        >
                            <option value="">Todos</option>
                            <option disabled>──────────</option>
                            {supplierCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <Filter size={16} />
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        Nuevo Contacto
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContacts.length === 0 ? (
                    <div className="col-span-full bg-card p-12 text-center rounded-xl border border-border shadow-sm">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">No hay contactos</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {selectedSpecialty
                                ? "No hay proveedores con esta especialidad."
                                : "Comienza añadiendo a tus clientes o proveedores."}
                        </p>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={18} />
                            Crear primer contacto
                        </button>
                    </div>
                ) : (
                    filteredContacts.map((contact) => {
                        // Find category name if it exists
                        const categoryName = contact.specialtyId ? supplierCategories.find(c => c.id === contact.specialtyId)?.name : null;

                        return (
                            <div key={contact.id} className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contact.type === 'client'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                            }`}>
                                            {contact.type === 'client' ? <User size={20} /> : <Building2 size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{contact.name}</h3>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${contact.type === 'client'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                                    }`}>
                                                    {contact.type === 'client' ? 'Cliente' : 'Proveedor'}
                                                </span>
                                                {categoryName && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                        {categoryName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(contact)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors"
                                        title="Editar"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    {contact.contactPerson && (
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-gray-400 dark:text-gray-500" />
                                            <span>{contact.contactPerson}</span>
                                        </div>
                                    )}
                                    {contact.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail size={16} className="text-gray-400 dark:text-gray-500" />
                                            <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate">{contact.email}</a>
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-gray-400 dark:text-gray-500" />
                                            <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">{contact.phone}</a>
                                        </div>
                                    )}
                                    {contact.address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
                                            <span>{contact.address}</span>
                                        </div>
                                    )}
                                    {contact.googleMapsUrl && (
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                                            <MapIcon size={16} />
                                            <a href={contact.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex-1 truncate">
                                                Ver Ubicación
                                            </a>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(contact.googleMapsUrl || "")}
                                                title="Copiar enlace"
                                                className="ml-auto text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    )}
                                    {contact.bankAccounts && contact.bankAccounts.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium mb-2 text-xs">
                                                <CreditCard size={14} className="text-gray-500" />
                                                <span>Cuentas Bancarias ({contact.bankAccounts.length})</span>
                                            </div>
                                            <div className="space-y-2">
                                                {contact.bankAccounts.map((acc, idx) => (
                                                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{acc.bankName}</p>
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{acc.accountType === 'savings' ? 'Ahorros' : 'Corriente'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                                            <code className="text-indigo-700 dark:text-indigo-400 font-mono select-all truncate mr-2">{acc.accountNumber}</code>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(acc.accountNumber || "");
                                                                    alert("Número de cuenta copiado");
                                                                }}
                                                                title="Copiar número de cuenta"
                                                                className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex-shrink-0"
                                                            >
                                                                <Copy size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {contact.taxId && (
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                            ID: {contact.taxId}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <ContactFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => { }}
                initialData={editingContact}
                isEditing={!!editingContact}
            />
        </div >
    );
}
