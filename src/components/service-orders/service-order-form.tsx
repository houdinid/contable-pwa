"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { Plus, Trash, Save, ArrowLeft, Calendar, User, FileText } from "lucide-react";
import type { ServiceOrder, ServiceOrderItem, ServiceOrderStatus } from "@/types";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import { MoneyInput } from "@/components/ui/money-input";

interface ServiceOrderFormProps {
    initialData?: ServiceOrder;
    onSubmit: (data: any) => Promise<void>;
    isEditing?: boolean;
}

export function ServiceOrderForm({ initialData, onSubmit, isEditing = false }: ServiceOrderFormProps) {
    const router = useRouter();
    const { businessIdentities, contacts, products } = useData();
    const [loading, setLoading] = useState(false);

    // Initial State Setup
    const [clientName, setClientName] = useState(initialData?.clientName || "");
    const [clientId, setClientId] = useState(initialData?.clientId || "");
    const [showContactDropdown, setShowContactDropdown] = useState(false);
    const [showNewContactModal, setShowNewContactModal] = useState(false);

    // Product Autocomplete
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [productSuggestions, setProductSuggestions] = useState<{ itemId: string, products: any[] } | null>(null);

    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [estimatedDate, setEstimatedDate] = useState(initialData?.estimatedDate || "");

    // Default issuer logic
    const defaultIssuer = businessIdentities.find(b => b.isDefault) || businessIdentities[0];
    const [businessIdentityId, setBusinessIdentityId] = useState(initialData?.businessIdentityId || defaultIssuer?.id || "");

    const [status, setStatus] = useState<ServiceOrderStatus>(initialData?.status || 'pending');

    const [notes, setNotes] = useState(initialData?.notes || "");
    const [technicianNotes, setTechnicianNotes] = useState(initialData?.technicianNotes || "");

    const [items, setItems] = useState<ServiceOrderItem[]>(initialData?.items || [
        { id: '1', description: '', quantity: 1, price: 0, total: 0 }
    ]);

    // Filter contacts based on input and type 'client'
    const filteredContacts = contacts.filter(c =>
        c.type === 'client' && (
            c.name.toLowerCase().includes(clientName.toLowerCase()) ||
            c.taxId?.includes(clientName)
        )
    );

    const selectContact = (contact: any) => {
        setClientName(contact.name);
        setClientId(contact.id);
        setShowContactDropdown(false);
    };

    const handleContactLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClientName(e.target.value);
        if (!isEditing) setClientId("");
        setShowContactDropdown(true);
    };

    const handleNewContactSuccess = (newName: string) => {
        setClientName(newName);
        const newContact = contacts.find(c => c.name === newName);
        if (newContact) setClientId(newContact.id);
        setShowNewContactModal(false);
    };

    const handleItemChange = (id: string, field: keyof ServiceOrderItem, value: any) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'price') {
                    updated.total = Number(updated.quantity) * Number(updated.price);
                }
                return updated;
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems([...items, {
            id: crypto.randomUUID(),
            description: '',
            quantity: 1,
            price: 0,
            total: 0
        }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        // Tax logic could be complex, for now strict 19% if issuer is taxpayer
        const currentIssuer = businessIdentities.find(b => b.id === businessIdentityId);
        const shouldChargeTax = currentIssuer?.isTaxPayer ?? true;

        const tax = shouldChargeTax ? subtotal * 0.19 : 0;
        return { subtotal, tax, total: subtotal + tax };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!clientName.trim()) throw new Error("El nombre del cliente es obligatorio");

            // Auto-create contact logic
            let finalClientId = clientId;
            if (!finalClientId && clientName) {
                const existing = contacts.find(c => c.name.toLowerCase() === clientName.trim().toLowerCase());
                if (existing) {
                    finalClientId = existing.id;
                } else {
                    finalClientId = 'generated-on-save';
                }
            }

            const { subtotal, tax, total } = calculateTotals();

            const submissionData = {
                businessIdentityId,
                number: initialData?.number || `OS-${String(Date.now()).slice(-6)}`,
                date,
                estimatedDate,
                clientId: finalClientId || 'adhoc',
                clientName,
                items,
                subtotal,
                tax,
                total,
                status,
                notes,
                technicianNotes
            };

            await onSubmit(submissionData);
            router.push("/dashboard/service-orders");
        } catch (err) {
            alert("Error al guardar: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const { subtotal, tax, total } = calculateTotals();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <ContactFormModal
                isOpen={showNewContactModal}
                onClose={() => setShowNewContactModal(false)}
                onSuccess={handleNewContactSuccess}
            />

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    {isEditing ? `Editar Orden ${initialData?.number}` : 'Nueva Orden de Servicio'}
                </h1>

                {isEditing && (
                    <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 uppercase tracking-wider">
                        {status === 'pending' && 'Pendiente'}
                        {status === 'in_progress' && 'En Progreso'}
                        {status === 'completed' && 'Completado'}
                        {status === 'billed' && 'Facturado'}
                        {status === 'cancelled' && 'Cancelado'}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Section */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Client Selection */}
                    <div className="relative">
                        <div className="flex justify-between mb-1">
                            <label className="block text-sm font-medium text-foreground">Cliente</label>
                            <button
                                type="button"
                                onClick={() => setShowNewContactModal(true)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
                            >
                                <Plus size={12} /> Nuevo Cliente
                            </button>
                        </div>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={clientName}
                                onChange={handleContactLocalChange}
                                onFocus={() => setShowContactDropdown(true)}
                                onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
                                placeholder="Buscar o escribir cliente..."
                                className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 max-w-full outline-none transition-colors"
                                required
                                autoComplete="off"
                            />
                        </div>

                        {/* Dropdown Results */}
                        {showContactDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredContacts.length > 0 ? (
                                    filteredContacts.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => selectContact(c)}
                                            className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex flex-col"
                                        >
                                            <span className="font-medium text-foreground">{c.name}</span>
                                            {c.taxId && <span className="text-xs text-muted-foreground">NIT: {c.taxId}</span>}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-sm text-muted-foreground">
                                        No encontrado.
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setShowNewContactModal(true);
                                            }}
                                            className="text-indigo-600 dark:text-indigo-400 font-medium ml-1 hover:underline"
                                        >
                                            Crear nuevo
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dates & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Fecha Recepción</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Fecha Estimada</label>
                            <input
                                type="date"
                                value={estimatedDate}
                                onChange={(e) => setEstimatedDate(e.target.value)}
                                className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Status & Issuer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Estado</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as ServiceOrderStatus)}
                                className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                            >
                                <option value="pending">Pendiente</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="completed">Completado</option>
                                <option value="billed">Facturado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                        {businessIdentities.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Emisor (Empresa)</label>
                                <select
                                    value={businessIdentityId}
                                    onChange={(e) => setBusinessIdentityId(e.target.value)}
                                    className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                >
                                    {businessIdentities.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border transition-colors">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Servicios y Productos</h2>

                    {/* Items Header - Hidden on mobile */}
                    <div className="hidden md:flex gap-4 mb-2 text-sm font-medium text-muted-foreground px-1">
                        <div className="flex-1">Descripción</div>
                        <div className="w-24">Cant.</div>
                        <div className="w-32">Precio Unit.</div>
                        <div className="w-32 text-right">Total</div>
                        <div className="w-10"></div>
                    </div>

                    <div className="space-y-6 md:space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start border-b border-border pb-4 md:border-0 md:pb-0">
                                <div className="w-full md:flex-1 relative">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1 md:hidden">Descripción</label>
                                    <textarea
                                        rows={1}
                                        value={item.description}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            handleItemChange(item.id, 'description', val);

                                            // Auto-resize
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';

                                            // Filter products for suggestions
                                            if (val.length > 0) {
                                                const matches = products.filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
                                                if (matches.length > 0) {
                                                    setProductSuggestions({ itemId: item.id, products: matches });
                                                } else {
                                                    setProductSuggestions(null);
                                                }
                                            } else {
                                                setProductSuggestions(null);
                                            }
                                        }}
                                        onFocus={(e) => {
                                            // Resize on focus if needed
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onBlur={() => setTimeout(() => setProductSuggestions(null), 200)}
                                        placeholder="Descripción del servicio o producto..."
                                        className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none overflow-hidden min-h-[42px] transition-colors"
                                        required
                                    />
                                    {/* Custom Autocomplete Dropdown */}
                                    {productSuggestions && productSuggestions.itemId === item.id && (
                                        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {productSuggestions.products.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleItemChange(item.id, 'description', p.name);
                                                        handleItemChange(item.id, 'price', p.price);
                                                        handleItemChange(item.id, 'productId', p.id);
                                                        setProductSuggestions(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex justify-between items-center"
                                                >
                                                    <span className="font-medium text-foreground truncate mr-2">{p.name}</span>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        ${p.price.toLocaleString()} | Stock: {p.stock}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex w-full md:w-auto gap-2 items-start">
                                    <div className="flex-1 md:w-24">
                                        <label className="block text-xs font-medium text-muted-foreground mb-1 md:hidden">Cant.</label>
                                        <MoneyInput
                                            value={item.quantity}
                                            onValueChange={(val) => handleItemChange(item.id, 'quantity', val)}
                                            currencySymbol=""
                                            placeholder="Cant."
                                            className="h-[42px]"
                                            min={1}
                                        />
                                    </div>
                                    <div className="flex-1 md:w-32">
                                        <label className="block text-xs font-medium text-muted-foreground mb-1 md:hidden">Precio</label>
                                        <MoneyInput
                                            value={item.price}
                                            onValueChange={(val) => handleItemChange(item.id, 'price', val)}
                                            placeholder="Precio"
                                            className="h-[42px]"
                                        />
                                    </div>
                                    <div className="flex-1 md:w-32 py-2 text-right font-medium text-foreground flex flex-col justify-center h-[42px]">
                                        <span className="md:hidden text-xs text-muted-foreground mb-1">Total</span>
                                        ${item.total.toLocaleString()}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors h-[42px] flex items-center justify-center"
                                        title="Eliminar"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                        <Plus size={16} /> Añadir Ítem
                    </button>
                </div>

                {/* Notes & Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                            <label className="block text-sm font-medium text-foreground mb-2">Notas Públicas (Visible en PDF)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-colors"
                                placeholder="Detalles visibles para el cliente..."
                            />
                        </div>
                        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                            <label className="block text-sm font-medium text-foreground mb-2">Notas Técnicas (Internas)</label>
                            <textarea
                                value={technicianNotes}
                                onChange={(e) => setTechnicianNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-colors"
                                placeholder="Detalles internos..."
                            />
                        </div>
                    </div>

                    <div className="flex flex-col justify-between">
                        <div></div>
                        <div className="bg-card p-6 rounded-xl shadow-sm border border-border space-y-3">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>${subtotal.toLocaleString()}</span>
                            </div>
                            {tax > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Impuestos (19%)</span>
                                    <span>${tax.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-border flex justify-between font-bold text-lg text-foreground">
                                <span>Total</span>
                                <span>${total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pb-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                    >
                        <Save size={18} />
                        {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Orden')}
                    </button>
                </div>
            </form >
        </div >
    );
}
