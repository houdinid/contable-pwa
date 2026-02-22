"use client";

import { useState } from "react";
import { useData } from "@/context/data-context";
import { Plus, User, Building2, Phone, Mail, Edit, Filter, MapPin, Copy, CreditCard, Map as MapIcon, Search, Download, Upload, Globe, Trash2 } from "lucide-react";
import { toTitleCase, cleanEmail, cleanText, toLowerCaseAll } from "@/lib/utils";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import type { Contact } from "@/types";

export default function ContactsPage() {
    const { contacts, loadingData, supplierCategories, addContact, deleteContact } = useData();
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isImporting, setIsImporting] = useState(false);

    const handleCreate = () => {
        setEditingContact(null);
        setShowModal(true);
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setShowModal(true);
    };

    const handleDelete = async (contact: Contact) => {
        if (confirm(`¿Estás seguro de que deseas eliminar este contacto ("${contact.name}")?\n\nEsta acción no se puede deshacer y podría afectar facturas asociadas.`)) {
            try {
                await deleteContact(contact.id);
            } catch (error) {
                alert("Error al eliminar el contacto: " + error);
            }
        }
    };

    // Filter Logic
    const filteredContacts = contacts.filter(contact => {
        const matchesSpecialty = !selectedSpecialty || (contact.type === 'supplier' && contact.specialtyId === selectedSpecialty);
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            contact.name.toLowerCase().includes(searchLower) ||
            (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
            (contact.phone && contact.phone.toLowerCase().includes(searchLower)) ||
            (contact.taxId && contact.taxId.toLowerCase().includes(searchLower))
        );

        return matchesSpecialty && matchesSearch;
    });

    const handleDownloadTemplate = () => {
        const headers = ["Tipo(Cliente/Proveedor)", "Razon Social", "NIT", "Telefono", "Correo", "Direccion", "Persona Contacto", "Pagina Web"];
        const sampleRow = ["Cliente", "Mi Empresa S.A.", "900123456", "3001234567", "contacto@miempresa.com", "Calle Falsa 123", "Juan Perez", "https://ejemplo.com"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(";") + "\n"
            + sampleRow.join(";");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_contactos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                // Basic CSV parser assuming ';' separator which is common in Excel Spanish
                // Note: handling commas vs semicolons robustly can be tricky, we'll try ';' first then ','
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
                if (lines.length < 2) {
                    alert("El archivo parece estar vacío o no tiene el formato correcto.");
                    return;
                }

                // Detect separator
                const separator = lines[0].includes(';') ? ';' : ',';
                let successCount = 0;
                let errorCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(separator).map(cell => cell.trim().replace(/^"|"$/g, ''));
                    if (row.length < 2) continue; // Skip malformed rows

                    const rawType = row[0]?.toLowerCase();
                    const type = (rawType === 'proveedor' || rawType === 'supplier') ? 'supplier' : 'client';
                    const name = toTitleCase(row[1] || "");
                    const taxId = cleanText(row[2] || "");
                    const phone = cleanText(row[3] || "");
                    const email = cleanEmail(row[4] || "");
                    const address = toLowerCaseAll(row[5] || "");
                    const contactPerson = toTitleCase(row[6] || "");
                    const website = cleanText(row[7] || "");

                    if (!name) {
                        errorCount++;
                        continue;
                    }

                    try {
                        await addContact({
                            type,
                            name,
                            taxId,
                            phone,
                            email,
                            address,
                            contactPerson,
                            website,
                        });
                        successCount++;
                    } catch (err) {
                        console.error("Error adding row", i, err);
                        errorCount++;
                    }
                }

                alert(`Importación completada.\n\nContactos importados: ${successCount}\nErrores: ${errorCount}`);
            } catch (error) {
                console.error("Error parsing CSV:", error);
                alert("Hubo un error al procesar el archivo CSV.");
            } finally {
                setIsImporting(false);
                // Reset file input
                e.target.value = '';
            }
        };

        reader.readAsText(file);
    };

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
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
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

                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadTemplate}
                            title="Descargar Plantilla CSV"
                            className="flex items-center justify-center w-10 h-10 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                        >
                            <Download size={18} />
                        </button>

                        <label
                            title="Importar CSV"
                            className={`flex items-center justify-center w-10 h-10 ${isImporting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-50 text-green-600 cursor-pointer hover:bg-green-100'} rounded-lg transition-colors border border-green-200`}
                        >
                            <Upload size={18} />
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isImporting}
                            />
                        </label>

                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">Nuevo Contacto</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                            <div key={contact.id} className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contact.type === 'client'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                            }`}>
                                            {contact.type === 'client' ? <User size={20} /> : <Building2 size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-foreground">{contact.name}</h3>
                                            <div className="flex gap-2 text-xs font-medium mt-1">
                                                <span className={`px-2 py-0.5 rounded-full ${contact.type === 'client'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                                    }`}>
                                                    {contact.type === 'client' ? 'Cliente' : 'Proveedor'}
                                                </span>
                                                {categoryName && (
                                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                        {categoryName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => setEditingContact(contact)}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors bg-background rounded-md border border-border"
                                            title="Editar contacto"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(contact)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors bg-background rounded-md border border-border"
                                            title="Eliminar contacto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    {contact.contactPerson && (
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-gray-400 dark:text-gray-500" />
                                            <span>{contact.contactPerson}</span>
                                        </div>
                                    )}
                                    <div className="space-y-3 text-sm">
                                        {contact.email && (
                                            <div className="flex items-center gap-3 text-card-foreground">
                                                <Mail size={16} className="text-muted-foreground flex-shrink-0" />
                                                <a href={`mailto:${contact.email}`} className="truncate hover:underline">{contact.email}</a>
                                            </div>
                                        )}
                                        {contact.phone && (
                                            <div className="flex items-center gap-3 text-card-foreground">
                                                <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                                                <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                                            </div>
                                        )}
                                        {contact.address && (
                                            <div className="flex items-start gap-3 text-card-foreground">
                                                <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                                <span className="line-clamp-2" title={contact.address}>{contact.address}</span>
                                            </div>
                                        )}
                                        {contact.website && (
                                            <div className="flex items-center gap-2">
                                                <Globe size={16} className="text-gray-400 dark:text-gray-500" />
                                                <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate flex-1">
                                                    {contact.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        )}
                                        {contact.googleMapsUrl && (
                                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                                                <MapIcon size={16} />
                                                <a href={contact.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex-1 truncate">
                                                    Ver Ubicación
                                                </a>
                                            </div>
                                        )}
                                    </div>
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
        </div>
    );
}
