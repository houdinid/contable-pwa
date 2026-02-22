"use client";

import { useState, useEffect } from "react";
import { useData } from "@/context/data-context";
import { X, Save, User, Building2, CreditCard, Plus, Trash2 } from "lucide-react";
import type { Contact, ContactType, BankAccount } from "@/types";

interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newContactName: string, newContactId?: string) => void;
    initialData?: Contact | null;
    isEditing?: boolean;
    defaultType?: ContactType; // New Prop
}

export function ContactFormModal({ isOpen, onClose, onSuccess, initialData, isEditing = false, defaultType = 'client' }: ContactFormModalProps) {
    const { addContact, updateContact, supplierCategories, expenseCategories, paymentMethods } = useData();

    const [name, setName] = useState("");
    const [taxId, setTaxId] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [type, setType] = useState<ContactType>(defaultType);
    const [specialtyId, setSpecialtyId] = useState("");
    const [defaultExpenseCategoryId, setDefaultExpenseCategoryId] = useState(""); // New State
    const [googleMapsUrl, setGoogleMapsUrl] = useState("");

    // Bank Accounts State
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

    // New Account Form State
    const [newBankName, setNewBankName] = useState("");
    const [newAccountNumber, setNewAccountNumber] = useState("");
    const [newAccountType, setNewAccountType] = useState<"savings" | "checking" | "">("");

    const addBankAccount = () => {
        if (newBankName && newAccountNumber && newAccountType) {
            setBankAccounts([...bankAccounts, {
                id: crypto.randomUUID(),
                bankName: newBankName,
                accountNumber: newAccountNumber,
                accountType: newAccountType as "savings" | "checking"
            }]);
            setNewBankName("");
            setNewAccountNumber("");
            setNewAccountType("");
        }
    };

    const removeAccount = (id: string) => {
        setBankAccounts(bankAccounts.filter(acc => acc.id !== id));
    };

    // Load initial data when editing
    useEffect(() => {
        if (isOpen && initialData && isEditing) {
            setName(initialData.name);
            setTaxId(initialData.taxId || "");
            setEmail(initialData.email || "");
            setWebsite(initialData.website || "");
            setAddress(initialData.address || "");
            setPhone(initialData.phone || "");
            setContactPerson(initialData.contactPerson || "");
            setType(initialData.type);
            setSpecialtyId(initialData.specialtyId || "");
            setDefaultExpenseCategoryId(initialData.defaultExpenseCategoryId || ""); // Load
            setGoogleMapsUrl(initialData.googleMapsUrl || "");
            setBankAccounts(initialData.bankAccounts || []);

            // Clean temp fields
            setNewBankName("");
            setNewAccountNumber("");
            setNewAccountType("");
        } else if (isOpen && !isEditing) {
            // Reset form when opening in create mode
            setName("");
            setTaxId("");
            setEmail("");
            setWebsite("");
            setAddress("");
            setPhone("");
            setContactPerson("");
            setType(defaultType); // Use prop
            setSpecialtyId("");
            setDefaultExpenseCategoryId(""); // Reset
            setGoogleMapsUrl("");
            setBankAccounts([]);

            setNewBankName("");
            setNewAccountNumber("");
            setNewAccountType("");
        }
    }, [isOpen, initialData, isEditing]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const contactData = {
                name,
                taxId,
                email,
                website,
                address,
                phone,
                contactPerson,
                type,
                specialtyId: type === 'supplier' ? specialtyId : undefined,
                defaultExpenseCategoryId: type === 'supplier' ? defaultExpenseCategoryId : undefined, // Save
                googleMapsUrl,
                bankAccounts
            };

            let newId;
            if (isEditing && initialData) {
                await updateContact(initialData.id, contactData);
                newId = initialData.id;
            } else {
                newId = await addContact(contactData);
            }

            onSuccess(name, newId);
            onClose();
        } catch (error) {
            alert("Error al guardar cliente: " + error);
        }
    };

    // Helper to get indented categories for dropdown
    const getCategoryOptions = () => {
        const options: any[] = [];
        const roots = expenseCategories.filter(c => !c.parentId);

        roots.forEach(root => {
            options.push(<option key={root.id} value={root.id}>{root.name}</option>);
            const children = expenseCategories.filter(c => c.parentId === root.id);
            children.forEach(child => {
                options.push(<option key={child.id} value={child.id}>&nbsp;&nbsp;↳ {child.name}</option>);
            });
        });
        return options;
    };


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">{isEditing ? 'Editar Contacto' : 'Nuevo Contacto'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type Selector */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('client')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${type === 'client' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <User size={16} />
                            Cliente
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('supplier')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${type === 'supplier' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Building2 size={16} />
                            Proveedor
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social *</label>
                        <input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ej: Juan Pérez o Empresa SAS"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIT / Identificación</label>
                        <input
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ej: 123456789"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
                        <input
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ej: Gerente, Secretaria, etc."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Página Web</label>
                            <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://www.ejemplo.com"
                            />
                        </div>
                    </div>

                    {/* Bank Accounts Section (Available for all contacts) */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                            <CreditCard size={16} className="text-indigo-600" /> Cuentas Bancarias
                        </h4>

                        {bankAccounts.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay cuentas registradas.</p>
                        ) : (
                            <div className="space-y-3">
                                {bankAccounts.map((account) => (
                                    <div key={account.id} className="bg-white p-3 rounded-md border border-gray-200 relative">
                                        <button
                                            type="button"
                                            onClick={() => removeAccount(account.id)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                            title="Eliminar cuenta"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="grid grid-cols-2 gap-2 text-sm pr-6">
                                            <div><span className="font-bold text-gray-900">{account.bankName}</span></div>
                                            <div className="text-right text-gray-500">{account.accountType === 'savings' ? 'Ahorros' : 'Corriente'}</div>
                                            <div className="col-span-2 font-mono text-indigo-700 bg-gray-50 px-2 py-1 rounded border border-gray-100 mt-1 flex justify-between items-center">
                                                <span>{account.accountNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Account Form */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Agregar Nueva Cuenta</p>
                            <div className="grid gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Banco / Método</label>
                                    <select
                                        value={newBankName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewBankName(val);
                                            // Auto-set type based on selected method if found
                                            const method = paymentMethods.find(p => p.name === val);
                                            if (method) {
                                                if (method.type === 'bank') setNewAccountType('savings'); // Default assumption
                                                else if (method.type === 'check') setNewAccountType('checking');
                                            }
                                        }}
                                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {paymentMethods.filter(p => ['bank', 'other', 'crypto', 'cash'].includes(p.type)).map(method => (
                                            <option key={method.id} value={method.name}>{method.name}</option>
                                        ))}
                                        <option value="custom">+ Otro (Escribir manual)</option>
                                    </select>
                                    {newBankName === 'custom' && (
                                        <input
                                            className="mt-1 w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Nombre del Banco"
                                            onChange={(e) => setNewBankName(e.target.value)}
                                            autoFocus
                                        />
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                        <select
                                            value={newAccountType}
                                            onChange={(e) => setNewAccountType(e.target.value as any)}
                                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            <option value="savings">Ahorros</option>
                                            <option value="checking">Corriente</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Número</label>
                                        <input
                                            value={newAccountNumber}
                                            onChange={(e) => setNewAccountNumber(e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500"
                                            placeholder="000-0000"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={addBankAccount}
                                    disabled={!newBankName || !newAccountNumber || !newAccountType}
                                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Agregar Cuenta
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Specialty Selector for Suppliers */}
                    {type === 'supplier' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad / Categoría</label>
                                <select
                                    value={specialtyId}
                                    onChange={(e) => setSpecialtyId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="">-- Sin especificar --</option>
                                    {supplierCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Default Expense Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría de Gasto Predeterminada</label>
                                <p className="text-xs text-gray-500 mb-1">Al crear un gasto, se seleccionará automáticamente esta categoría.</p>
                                <select
                                    value={defaultExpenseCategoryId}
                                    onChange={(e) => setDefaultExpenseCategoryId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="">-- Seleccionar Categoría --</option>
                                    {getCategoryOptions()}
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Dirección física"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación (Google Maps)</label>
                        <input
                            value={googleMapsUrl}
                            onChange={(e) => setGoogleMapsUrl(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://maps.app.goo.gl/..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Pega aquí el enlace de "Compartir" ubicación de Google Maps.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                        >
                            <Save size={18} />
                            {isEditing ? 'Guardar Cambios' : 'Guardar Contacto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
