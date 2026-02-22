import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { Save, ArrowLeft, Receipt, FileUp, FileText, Camera, X, Plus, ScanLine, Loader2 } from "lucide-react";
import type { Expense } from "@/types";
import { parseDianXml } from "@/lib/xml-parser";
import { compressImage } from "@/lib/image-utils";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import { MoneyInput } from "@/components/ui/money-input";
import { OCRService } from "@/lib/ocr-service";

interface ExpenseFormProps {
    initialData?: Expense;
    onSubmit: (data: any) => Promise<void>;
    isEditing?: boolean;
}

// Force rebuild
export function ExpenseForm({ initialData, onSubmit, isEditing = false }: ExpenseFormProps) {
    const router = useRouter();
    const { contacts, expenseCategories, addContact, businessIdentities, expenses } = useData();
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const voucherInputRef = useRef<HTMLInputElement>(null);

    // New Supplier Modal State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Filter only suppliers and sort by usage frequency
    const suppliers = useMemo(() => {
        return contacts
            .filter(c => c.type === 'supplier')
            .sort((a, b) => {
                const countA = expenses.filter(e => e.supplierId === a.id).length;
                const countB = expenses.filter(e => e.supplierId === b.id).length;
                return countB - countA; // Descending order
            });
    }, [contacts, expenses]);

    // Default to first category if available, else empty
    const defaultCategoryId = expenseCategories.length > 0 ? expenseCategories[0].id : "";

    const [formData, setFormData] = useState<Omit<Expense, "id" | "createdAt">>({
        description: initialData?.description || "",
        amount: initialData?.amount || 0,
        date: initialData?.date || new Date().toISOString().split('T')[0],
        categoryId: initialData?.categoryId || defaultCategoryId,
        supplierId: initialData?.supplierId || "",
        businessIdentityId: initialData?.businessIdentityId || "",
        sourceAccountId: initialData?.sourceAccountId || "",
        status: initialData?.status || "paid", // Default to paid for expenses usually
        receiptUrl: initialData?.receiptUrl || "",
    });

    // Auto-select defaults
    useEffect(() => {
        // 1. Business Identity
        if (!formData.businessIdentityId && businessIdentities.length > 0) {
            const defaultIdentity = businessIdentities.find(b => b.isDefault);
            if (defaultIdentity) {
                setFormData(prev => ({ ...prev, businessIdentityId: defaultIdentity.id }));
            } else {
                setFormData(prev => ({ ...prev, businessIdentityId: businessIdentities[0].id }));
            }
        }
    }, [businessIdentities, formData.businessIdentityId]);

    const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const parsed = parseDianXml(content);

            if (parsed) {
                // 1. Find Supplier
                const foundSupplier = suppliers.find(c =>
                    c.name.toLowerCase().includes(parsed.supplierName.toLowerCase()) ||
                    parsed.supplierName.toLowerCase().includes(c.name.toLowerCase())
                );

                let supplierIdToSet = "";
                if (foundSupplier) {
                    supplierIdToSet = foundSupplier.id;
                } else {
                    if (confirm(`Proveedor "${parsed.supplierName}" no encontrado. ¿Deseas crearlo ahora?`)) {
                        const newId = await addContact({
                            name: parsed.supplierName,
                            taxId: parsed.supplierTaxId,
                            type: 'supplier'
                        });
                        supplierIdToSet = newId;
                        alert(`Proveedor "${parsed.supplierName}" creado y seleccionado.`);
                    }
                }



                // 2. Find Business Identity (Receiver)
                let businessIdentityIdToSet = "";

                // Helper to normalize Tax IDs (remove hyphens, spaces, check digits often separated by -)
                const normalize = (id: string) => id.replace(/[^0-9]/g, "");

                if (parsed.customerTaxId) {
                    const parsedId = normalize(parsed.customerTaxId);

                    // Try to find by Tax ID (normalized)
                    const foundIdentity = businessIdentities.find(b => normalize(b.taxId).includes(parsedId) || parsedId.includes(normalize(b.taxId)));

                    if (foundIdentity) {
                        businessIdentityIdToSet = foundIdentity.id;
                    } else if (parsed.customerName) {
                        // Fallback: Try to find by Name (fuzzy match)
                        const foundByName = businessIdentities.find(b =>
                            b.name.toLowerCase().includes(parsed.customerName!.toLowerCase()) ||
                            parsed.customerName!.toLowerCase().includes(b.name.toLowerCase())
                        );
                        if (foundByName) {
                            businessIdentityIdToSet = foundByName.id;
                        }
                    }
                }

                // 3. Auto-fill Form
                const itemDescriptions = parsed.items.map(item => item.description).join(", ");
                const description = itemDescriptions
                    ? `${itemDescriptions} (Factura ${parsed.number})`
                    : `Factura ${parsed.number} - ${parsed.supplierName}`;

                setFormData(prev => ({
                    ...prev,
                    date: parsed.date,
                    amount: parsed.total,
                    description: description.substring(0, 255), // Limit length
                    supplierId: supplierIdToSet || prev.supplierId,
                    businessIdentityId: businessIdentityIdToSet || prev.businessIdentityId
                }));
            } else {
                alert("No se pudo leer el archivo XML.");
            }
        };
        reader.readAsText(file);
    };

    const handleVoucherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrLoading(true);

        try {
            // 1. Compress Image
            const compressed = await compressImage(file);
            setFormData(prev => ({ ...prev, receiptUrl: compressed }));

            // 2. Process with OCR
            const text = await OCRService.recognizeText(file);
            const parsed = OCRService.parseTransferReceipt(text, contacts); // Pass all contacts to check accounts

            // New: Check for Source Account (Business Identity)
            const sourceMatch = OCRService.findSourceAccount(text, businessIdentities);

            console.log("OCR Result:", parsed, sourceMatch);

            // 3. Auto-fill based on OCR
            let updates: any = {};
            let messages: string[] = [];

            if (parsed.amount) {
                updates.amount = parsed.amount;
                messages.push(`Monto detectado: $${parsed.amount.toLocaleString()}`);
            }

            if (parsed.date) {
                updates.date = parsed.date;
                messages.push(`Fecha detectada: ${parsed.date}`);
            }

            if (parsed.matchedContactId) {
                updates.supplierId = parsed.matchedContactId;
                const contactName = contacts.find(c => c.id === parsed.matchedContactId)?.name;
                messages.push(`Proveedor detectado por cuenta: ${contactName}`);
                // If supplier has accounts, maybe show which one matched? 
                // parsed.accountNumber is the one found in text
            }

            if (sourceMatch.businessIdentityId) {
                updates.businessIdentityId = sourceMatch.businessIdentityId;
                messages.push(`Empresa detectada: ${businessIdentities.find(b => b.id === sourceMatch.businessIdentityId)?.name}`);

                if (sourceMatch.sourceAccountId) {
                    updates.sourceAccountId = sourceMatch.sourceAccountId;
                    updates.status = 'paid';
                    messages.push(`Cuenta de Origen detectada: ...${businessIdentities.find(b => b.id === sourceMatch.businessIdentityId)?.bankAccounts?.find(a => a.id === sourceMatch.sourceAccountId)?.accountNumber.slice(-4)}`);
                }
            }

            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }));
                alert(`Comprobante leído con éxito:\n\n${messages.join('\n')}`);
            } else {
                alert("No se pudo extraer información clara del comprobante, pero la imagen se adjuntó.");
            }

        } catch (error) {
            console.error("OCR Error:", error);
            alert("Error al procesar el comprobante.");
        } finally {
            setOcrLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImage(file);
            setFormData(prev => ({ ...prev, receiptUrl: compressed }));
        } catch (error) {
            console.error("Error compressing image:", error);
            alert("Error al procesar la imagen.");
        }
    };

    // Auto-fill category from supplier defaults
    useEffect(() => {
        if (formData.supplierId) {
            const supplier = suppliers.find(s => s.id === formData.supplierId);
            if (supplier && supplier.defaultExpenseCategoryId) {
                const catExists = expenseCategories.some(c => c.id === supplier.defaultExpenseCategoryId);
                if (catExists) {
                    setFormData(prev => {
                        if (prev.categoryId === supplier.defaultExpenseCategoryId) return prev;
                        return { ...prev, categoryId: supplier.defaultExpenseCategoryId! };
                    });
                }
            }
        }
    }, [formData.supplierId, suppliers, expenseCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.description.trim()) throw new Error("La descripción es obligatoria");
            if (formData.amount <= 0) throw new Error("El monto debe ser mayor a 0");
            if (!formData.categoryId) throw new Error("Debes seleccionar una categoría");

            await onSubmit(formData);
            router.push("/dashboard/expenses");
        } catch (err) {
            alert("Error al guardar: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get indented categories for dropdown
    const startRenderCategories = () => {
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
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Editar Gasto' : 'Registrar Gasto'}
                    </h1>
                </div>

                {!isEditing && (
                    <div className="flex items-center gap-2">
                        {/* Hidden Inputs */}
                        <input
                            type="file"
                            accept=".xml"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleXmlUpload}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            ref={voucherInputRef}
                            className="hidden"
                            onChange={handleVoucherUpload}
                        />

                        {/* Actions */}
                        <button
                            onClick={() => voucherInputRef.current?.click()}
                            disabled={ocrLoading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                        >
                            {ocrLoading ? <Loader2 size={18} className="animate-spin" /> : <ScanLine size={18} />}
                            {ocrLoading ? 'Leyendo...' : 'Subir Comprobante (OCR)'}
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors"
                        >
                            <FileUp size={18} />
                            XML
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-card p-8 rounded-xl shadow-sm border border-border space-y-6">

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Gasto</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Receipt size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ej. Compra de resmas de papel"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
                        <MoneyInput
                            required
                            value={formData.amount}
                            onValueChange={(val) => setFormData({ ...formData, amount: val })}
                            placeholder="0.00"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Identity Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Empresa (Comprador)</label>
                        <select
                            value={formData.businessIdentityId || ""}
                            onChange={(e) => {
                                setFormData(prev => ({
                                    ...prev,
                                    businessIdentityId: e.target.value,
                                    sourceAccountId: "" // Reset source account on identity change
                                }));
                            }}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
                        >
                            <option value="">-- Seleccionar --</option>
                            {businessIdentities.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Payment Source (Money Out) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pagado Desde (Origen)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                className="px-2 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground font-medium"
                            >
                                <option value="paid">Pagado</option>
                                <option value="pending">Pendiente</option>
                            </select>

                            {formData.status === 'paid' && (
                                <select
                                    value={formData.sourceAccountId || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sourceAccountId: e.target.value }))}
                                    className="px-2 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
                                >
                                    <option value="">-- Cuenta --</option>
                                    {businessIdentities.find(b => b.id === formData.businessIdentityId)?.bankAccounts?.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.bankName} (...{acc.accountNumber.slice(-4)})
                                        </option>
                                    ))}
                                    {(!businessIdentities.find(b => b.id === formData.businessIdentityId)?.bankAccounts?.length) && (
                                        <option value="" disabled>Sin cuentas</option>
                                    )}
                                </select>
                            )}
                        </div>
                        {formData.status === 'paid' && !formData.sourceAccountId && (
                            <p className="text-xs text-orange-500 mt-1">Selecciona la cuenta de origen.</p>
                        )}
                    </div>

                    {/* Supplier Select */}
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (Opcional)</label>
                        <div className="flex gap-2">
                            <select
                                value={formData.supplierId || ""}
                                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
                            >
                                <option value="">-- Seleccionar --</option>
                                {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setIsContactModalOpen(true)}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                title="Crear Nuevo Proveedor"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        {suppliers.length === 0 && (
                            <p className="text-xs text-orange-500 mt-1">No hay proveedores registrados.</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-background text-foreground"
                            required
                        >
                            <option value="">-- Seleccionar Categoría --</option>
                            {startRenderCategories()}
                        </select>
                        {expenseCategories.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No hay categorías configuradas. Ve a Configuración.</p>
                        )}
                    </div>

                    {/* Photo Receipt */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Foto Recibo (Opcional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment" // Hints mobile browsers to open camera
                            ref={imageInputRef}
                            className="hidden"
                            onChange={handleImageUpload}
                        />

                        {!formData.receiptUrl ? (
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted/50 hover:border-gray-400 transition-colors"
                            >
                                <Camera size={18} />
                                Tomar Foto / Subir
                            </button>
                        ) : (
                            <div className="relative">
                                <img
                                    src={formData.receiptUrl}
                                    alt="Recibo"
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, receiptUrl: "" }))}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                                    title="Eliminar foto"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mr-4 px-6 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Gasto')}
                    </button>
                </div>
            </form>

            <ContactFormModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                defaultType="supplier"
                onSuccess={(name, id) => {
                    if (id) {
                        setFormData(prev => ({ ...prev, supplierId: id }));
                        alert(`Proveedor "${name}" creado y seleccionado exitosamente.`);
                    }
                }}
            />
        </div>
    );
}
