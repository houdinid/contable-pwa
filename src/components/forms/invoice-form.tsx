"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { Plus, Trash, Save, ArrowLeft } from "lucide-react";
import type { Invoice, InvoiceItem } from "@/types";
import { ContactFormModal } from "@/components/forms/contact-form-modal";

interface InvoiceFormProps {
    initialData?: Invoice;
    onSubmit: (data: any) => Promise<void>;
    isEditing?: boolean;
}

export function InvoiceForm({ initialData, onSubmit, isEditing = false }: InvoiceFormProps) {
    const router = useRouter();
    const { businessIdentities, contacts, products } = useData();
    const [loading, setLoading] = useState(false);

    // Initial State Setup
    const [contactName, setContactName] = useState(initialData?.contactName || "");
    const [contactId, setContactId] = useState(initialData?.contactId || "");
    const [showContactDropdown, setShowContactDropdown] = useState(false);
    const [showNewContactModal, setShowNewContactModal] = useState(false);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [productSuggestions, setProductSuggestions] = useState<{ itemId: string, products: any[] } | null>(null);

    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
    const [creditDays, setCreditDays] = useState(initialData?.creditDays?.toString() || "");
    const [type, setType] = useState<'invoice' | 'quote'>(initialData?.type || 'quote'); // Default to quote

    // Default issuer logic
    const defaultIssuer = businessIdentities.find(b => b.isDefault) || businessIdentities[0];
    const [issuerId, setIssuerId] = useState(initialData?.issuerId || defaultIssuer?.id || "");

    const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || [
        { id: '1', description: '', quantity: 1, price: 0, total: 0 }
    ]);

    // Additional state for money tracking
    const [formData, setFormData] = useState<any>({
        destinationAccountId: initialData?.destinationAccountId || ""
    });

    // Filter contacts based on input and type 'client'
    const filteredContacts = contacts.filter(c =>
        c.type === 'client' && (
            c.name.toLowerCase().includes(contactName.toLowerCase()) ||
            c.taxId?.includes(contactName)
        )
    );

    const selectContact = (contact: any) => {
        setContactName(contact.name);
        setContactId(contact.id);
        setShowContactDropdown(false);
    };

    const handleContactLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContactName(e.target.value);
        if (!isEditing) setContactId(""); // Reset ID if typing a new name only when creating? Actually always reset if name changes manually
        setShowContactDropdown(true);
    };

    const handleNewContactSuccess = (newName: string) => {
        setContactName(newName);
        const newContact = contacts.find(c => c.name === newName);
        if (newContact) setContactId(newContact.id);
        setShowNewContactModal(false);
    };

    const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
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
        // Find current issuer to check tax liability
        const currentIssuer = businessIdentities.find(b => b.id === issuerId);
        const shouldChargeTax = currentIssuer?.isTaxPayer ?? true; // Default to true if not found or not set

        const tax = shouldChargeTax ? subtotal * 0.19 : 0;
        return { subtotal, tax, total: subtotal + tax };
    };

    const [ocrLoading, setOcrLoading] = useState(false);
    const voucherInputRef = useRef<HTMLInputElement>(null);

    const handleVoucherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrLoading(true);
        try {
            // Recognize text
            const text = await import("@/lib/ocr-service").then(m => m.OCRService.recognizeText(file));
            const OCRService = await import("@/lib/ocr-service").then(m => m.OCRService);
            const parsed = OCRService.parseTransferReceipt(text, contacts);
            const myAccountMatch = OCRService.findSourceAccount(text, businessIdentities); // "Source" here means "My Account"

            console.log("Invoice OCR:", parsed, myAccountMatch);

            let messages: string[] = [];

            // Auto-fill
            if (parsed.amount) {
                // For invoices, amount usually sets items? Or just validates?
                // If it's a simple income record, maybe we set a default item "Ingreso"
                // But Invoice has complex items. Let's just alert or try to set total if possible? 
                // Actually, if we are creating a receipt, we might want to verify.
                // For now, let's just show what we found.
                messages.push(`Monto en recibo: $${parsed.amount.toLocaleString()}`);
            }

            if (myAccountMatch.businessIdentityId) {
                setIssuerId(myAccountMatch.businessIdentityId);
                messages.push(`Empresa detectada: ${businessIdentities.find(b => b.id === myAccountMatch.businessIdentityId)?.name}`);

                if (myAccountMatch.sourceAccountId) {
                    setFormData((prev: any) => ({
                        ...prev,
                        destinationAccountId: myAccountMatch.sourceAccountId
                    }));
                    messages.push(`Cuenta de Destino detectada: ...${businessIdentities.find(b => b.id === myAccountMatch.businessIdentityId)?.bankAccounts?.find(a => a.id === myAccountMatch.sourceAccountId)?.accountNumber.slice(-4)}`);
                }
            }

            if (messages.length > 0) {
                alert(`Lectura OCR:\n\n${messages.join('\n')}`);
            } else {
                alert("No se detectaron datos relevantes en la imagen.");
            }

        } catch (error) {
            console.error(error);
            alert("Error al leer comprobante.");
        } finally {
            setOcrLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!contactName.trim()) throw new Error("El nombre del cliente es obligatorio");
            if (!issuerId && businessIdentities.length > 0) throw new Error("Debes seleccionar una razón social emisora");

            // Auto-create contact logic (same as before)
            let finalContactId = contactId;
            if (!finalContactId && contactName) {
                const existing = contacts.find(c => c.name.toLowerCase() === contactName.trim().toLowerCase());
                if (existing) {
                    finalContactId = existing.id;
                } else {
                    finalContactId = 'generated-on-save';
                }
            }

            const { subtotal, tax, total } = calculateTotals();

            const submissionData = {
                issuerId,
                number: initialData?.number || String(Date.now()).slice(-6),
                date,
                dueDate,
                creditDays: creditDays ? Number(creditDays) : undefined,
                contactId: finalContactId || 'adhoc',
                contactName,
                items,
                subtotal,
                tax,
                total,
                status: isEditing ? initialData?.status : (type === 'invoice' ? 'pending' : 'draft'),
                type,
                destinationAccountId: formData.destinationAccountId
            };

            await onSubmit(submissionData);
            router.push("/dashboard/sales");
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
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={24} />
                    </button>
                </h1>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
                    {!isEditing && (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                ref={voucherInputRef}
                                className="hidden"
                                onChange={handleVoucherUpload}
                            />
                            <button
                                type="button"
                                onClick={() => voucherInputRef.current?.click()}
                                disabled={ocrLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                            >
                                {ocrLoading ? 'Leyendo...' : 'Subir Recibo (OCR)'}
                            </button>
                        </>
                    )}

                    {businessIdentities.length > 0 && (
                        <select
                            value={issuerId}
                            onChange={(e) => setIssuerId(e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
                        >
                            <option value="" disabled>-- Seleccionar Emisor --</option>
                            {businessIdentities.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    )}
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
                    >
                        <option value="invoice">Factura de Venta</option>
                        <option value="quote">Cotización</option>
                    </select>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <div className="flex justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">Cliente</label>
                            <button
                                type="button"
                                onClick={() => setShowNewContactModal(true)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                            >
                                <Plus size={12} /> Nuevo Cliente
                            </button>
                        </div>
                        <input
                            type="text"
                            value={contactName}
                            onChange={handleContactLocalChange}
                            onFocus={() => setShowContactDropdown(true)}
                            onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
                            placeholder="Buscar o escribir cliente nuevo..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                            autoComplete="off"
                        />
                        {/* Dropdown Results */}
                        {showContactDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredContacts.length > 0 ? (
                                    filteredContacts.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => selectContact(c)}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col"
                                        >
                                            <span className="font-medium text-gray-900">{c.name}</span>
                                            {c.taxId && <span className="text-xs text-gray-500">NIT: {c.taxId}</span>}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-sm text-gray-500">
                                        No encontrado.
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setShowNewContactModal(true);
                                            }}
                                            className="text-indigo-600 font-medium ml-1 hover:underline"
                                        >
                                            Crear nuevo
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Escribe para buscar.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Crédito (Días)</label>
                            <input
                                type="number"
                                value={creditDays}
                                onChange={(e) => setCreditDays(e.target.value)}
                                placeholder="Ej. 30"
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Items</h2>

                    {/* Items Header - Hidden on mobile */}
                    <div className="hidden md:flex gap-4 mb-2 text-sm font-medium text-gray-600 px-1">
                        <div className="flex-1">Descripción</div>
                        <div className="w-24">Cant.</div>
                        <div className="w-32">Precio</div>
                        <div className="w-32 text-right">Total</div>
                        <div className="w-10"></div>
                    </div>

                    <div className="space-y-6 md:space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start border-b border-gray-100 pb-4 md:border-0 md:pb-0">
                                <div className="w-full md:flex-1 relative">
                                    <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Descripción</label>
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
                                        placeholder="Descripción del ítem"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none overflow-hidden min-h-[42px]"
                                        required
                                    />
                                    {/* Custom Autocomplete Dropdown */}
                                    {productSuggestions && productSuggestions.itemId === item.id && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {productSuggestions.products.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleItemChange(item.id, 'description', p.name);
                                                        handleItemChange(item.id, 'price', p.price);
                                                        setProductSuggestions(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                                                >
                                                    <span className="font-medium text-gray-900 truncate mr-2">{p.name}</span>
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        ${p.price.toLocaleString()} | Stock: {p.stock}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex w-full md:w-auto gap-2 items-start">
                                    <div className="flex-1 md:w-24">
                                        <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Cant.</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                            min="1"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-[42px]"
                                            placeholder="Cant."
                                            required
                                        />
                                    </div>
                                    <div className="flex-1 md:w-32">
                                        <label className="block text-xs font-medium text-gray-500 mb-1 md:hidden">Precio</label>
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-[42px]"
                                            placeholder="Precio"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1 md:w-32 py-2 text-right font-medium text-gray-700 flex flex-col justify-center h-[42px]">
                                        <span className="md:hidden text-xs text-gray-400 mb-1">Total</span>
                                        ${item.total.toLocaleString()}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors h-[42px] flex items-center justify-center"
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
                        className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        <Plus size={16} /> Añadir Ítem
                    </button>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Impuestos (19%)</span>
                                <span>${tax.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
                            <span>Total</span>
                            <span>${total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Documento')}
                    </button>
                </div>
            </form >
        </div >
    );
}
