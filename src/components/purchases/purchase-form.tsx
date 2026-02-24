"use client";

import { useState, useEffect, useRef } from "react";
import { useData } from "@/context/data-context";
import { X, Plus, Trash2, Save, ShoppingCart, Search, FileUp, FileText, AlertTriangle, Camera } from "lucide-react";
import type { Purchase, PurchaseItem, Contact, Product } from "@/types";
import { parseDianXml } from "@/lib/xml-parser";
import { ProductFormModal } from "@/components/inventory/product-form-modal";
import { compressImage } from "@/lib/image-utils";
import { ContactFormModal } from "@/components/forms/contact-form-modal";
import { MoneyInput } from "@/components/ui/money-input";

interface PurchaseFormProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export function PurchaseForm({ onClose, onSuccess }: PurchaseFormProps) {
    const { contacts, products, addPurchase, addContact, businessIdentities, purchases } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [supplierId, setSupplierId] = useState("");
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [businessIdentityId, setBusinessIdentityId] = useState("");

    // Filter suppliers and sort by frequency
    const suppliers = contacts
        .filter(c => c.type === 'supplier')
        .sort((a, b) => {
            const countA = purchases.filter(p => p.supplierId === a.id).length;
            const countB = purchases.filter(p => p.supplierId === b.id).length;
            return countB - countA; // Descending
        });

    // Auto-select defaults
    useEffect(() => {
        // 1. Business Identity
        if (!businessIdentityId && businessIdentities.length > 0) {
            const defaultIdentity = businessIdentities.find(b => b.isDefault);
            if (defaultIdentity) {
                setBusinessIdentityId(defaultIdentity.id);
            } else {
                setBusinessIdentityId(businessIdentities[0].id);
            }
        }
    }, [businessIdentities, businessIdentityId]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [number, setNumber] = useState("");
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("paid");
    const [receiptUrl, setReceiptUrl] = useState("");

    // New Item Inputs
    const [selectedProductId, setSelectedProductId] = useState("");
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemCost, setItemCost] = useState(0);

    // Auto-fill cost when product selected
    useEffect(() => {
        if (selectedProductId) {
            const product = products.find(p => p.id === selectedProductId);
            if (product) {
                setItemCost(product.cost);
            }
        }
    }, [selectedProductId, products]);

    const handleAddItem = () => {
        if (!selectedProductId || itemQuantity <= 0) return;

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const newItem: PurchaseItem = {
            productId: product.id,
            productName: product.name,
            quantity: itemQuantity,
            unitCost: itemCost,
            total: itemQuantity * itemCost
        };

        setItems([...items, newItem]);
        // Reset item inputs
        setSelectedProductId("");
        setItemQuantity(1);
        setItemCost(0);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const parsed = parseDianXml(content);

            if (parsed) {
                // 1. Auto-fill Date and Number
                setDate(parsed.date);
                setNumber(parsed.number);

                // 2. Find Business Identity (Receiver/Customer)
                if (parsed.customerTaxId) {
                    // Helper to normalize Tax IDs
                    const normalize = (id: string) => id.replace(/[^0-9]/g, "");
                    const parsedId = normalize(parsed.customerTaxId);

                    const foundIdentity = businessIdentities.find(b => normalize(b.taxId).includes(parsedId) || parsedId.includes(normalize(b.taxId)));

                    if (foundIdentity) {
                        setBusinessIdentityId(foundIdentity.id);
                    } else if (parsed.customerName) {
                        // Fallback: Try to find by Name
                        const foundByName = businessIdentities.find(b =>
                            b.name.toLowerCase().includes(parsed.customerName!.toLowerCase()) ||
                            parsed.customerName!.toLowerCase().includes(b.name.toLowerCase())
                        );
                        if (foundByName) {
                            setBusinessIdentityId(foundByName.id);
                        }
                    }
                }

                // 3. Find Supplier
                // Try precise match by specific ID if we had it, otherwise name
                const foundSupplier = contacts.find(c =>
                    c.type === 'supplier' &&
                    (c.name.toLowerCase().includes(parsed.supplierName.toLowerCase()) ||
                        parsed.supplierName.toLowerCase().includes(c.name.toLowerCase()))
                );

                if (foundSupplier) {
                    setSupplierId(foundSupplier.id);
                } else {
                    if (confirm(`Proveedor "${parsed.supplierName}" no encontrado. ¿Deseas crearlo ahora?`)) {
                        const newId = await addContact({
                            name: parsed.supplierName,
                            taxId: parsed.supplierTaxId,
                            type: 'supplier',
                            address: parsed.supplierAddress,
                            phone: parsed.supplierPhone,
                            email: parsed.supplierEmail
                        });
                        setSupplierId(newId);
                        alert(`Proveedor "${parsed.supplierName}" creado y seleccionado.`);
                    }
                }

                // 3. Auto-fill Items
                // We'll map XML items to Purchase Items. 
                // Problem: XML items don't map to Inventory Products 1:1 automatically.
                // Solution: Add them as "Unlinked" items or try to match by name?
                // For now, let's just add them to the visual list, maybe highlighting they need product mapping?
                // For this MVP, we will just fill the "Items" table but they won't be linked to inventory PRODUCT IDs unless we find a name match.

                const newItems: PurchaseItem[] = parsed.items.map(xmlItem => {
                    // Try exact name match
                    const productMatch = products.find(p => p.name.toLowerCase() === xmlItem.description.toLowerCase());

                    return {
                        productId: productMatch?.id || "unknown", // "unknown" or empty string to indicate manual mapping needed?
                        productName: xmlItem.description,
                        quantity: xmlItem.quantity,
                        unitCost: xmlItem.unitPrice,
                        total: xmlItem.total
                    };
                });

                setItems(newItems);
                setNotes(`Importado desde XML: ${parsed.number}`);
            } else {
                alert("No se pudo leer el archivo XML. Verifica que sea un formato válido de la DIAN.");
            }
        };
        reader.readAsText(file);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImage(file);
            setReceiptUrl(compressed);
        } catch (error) {
            console.error("Error compressing image:", error);
            alert("Error al procesar la imagen.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.length === 0) {
            alert("Completa los campos obligatorios (Proveedor y Productos)");
            return;
        }

        const supplier = contacts.find(c => c.id === supplierId);
        if (!supplier) {
            alert("Proveedor no encontrado.");
            return;
        }

        const total = items.reduce((sum, item) => sum + item.total, 0);

        const purchaseData: Omit<Purchase, "id" | "createdAt"> = {
            supplierId,
            supplierName: supplier.name,
            date,
            number,
            items,
            total,
            status: status as 'pending' | 'paid',
            businessIdentityId,
            receiptUrl, // Save the image
            notes
        };

        try {
            await addPurchase(purchaseData);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al guardar la compra.");
        }
    };


    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const [productModalOpen, setProductModalOpen] = useState(false);
    const [productModalData, setProductModalData] = useState<Partial<Product> | undefined>(undefined);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    const handleCreateProduct = (index: number, item: PurchaseItem) => {
        setEditingItemIndex(index);
        setProductModalData({
            name: item.productName,
            cost: item.unitCost,
            price: item.unitCost * 1.3, // Suggest 30% margin?
            stock: 0 // Initial stock is 0, purchase adds to it
        });
        setProductModalOpen(true);
    };

    const handleCreateNewProductModal = () => {
        setEditingItemIndex(null);
        setProductModalData(undefined);
        setProductModalOpen(true);
    };

    const handleProductCreated = (product: Product) => {
        if (editingItemIndex !== null) {
            const newItems = [...items];
            newItems[editingItemIndex] = {
                ...newItems[editingItemIndex],
                productId: product.id,
                productName: product.name // Update name in case user changed it in modal
            };
            setItems(newItems);
        } else {
            setSelectedProductId(product.id);
        }
        setProductModalOpen(false);
        setEditingItemIndex(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-background z-10 transition-colors">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ShoppingCart className="text-indigo-600 dark:text-indigo-400" />
                        Registrar Compra
                    </h2>

                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            accept=".xml"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleXmlUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 text-sm font-medium transition-colors"
                        >
                            <FileUp size={18} />
                            Importar XML
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Empresa (Comprador)</label>
                            <select
                                className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                value={businessIdentityId}
                                onChange={(e) => setBusinessIdentityId(e.target.value)}
                            >
                                <option value="">-- Seleccionar --</option>
                                {businessIdentities.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Proveedor</label>
                            <div className="flex gap-2">
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                >
                                    <option value="">Seleccionar Proveedor</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsContactModalOpen(true)}
                                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                    title="Crear Nuevo Proveedor"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Fecha</label>
                            <input
                                type="date"
                                required
                                className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">N° Factura (Opcional)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                placeholder="Ej: FE-1234"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Estado de Pago</label>
                            <select
                                className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="paid">Pagada / Contado</option>
                                <option value="pending">Pendiente / Crédito</option>
                            </select>
                        </div>
                    </div>

                    {/* Pending: XML Import Button Here */}

                    {/* Items Section */}
                    <div className="bg-muted/50 p-4 rounded-xl border border-border">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Agregar Productos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-5">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Producto</label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground focus:ring-2 focus:ring-indigo-500"
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleCreateNewProductModal}
                                        className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                        title="Crear Nuevo Producto"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cant.</label>
                                <MoneyInput
                                    value={itemQuantity}
                                    onValueChange={(val) => setItemQuantity(val)}
                                    currencySymbol=""
                                    placeholder="0"
                                    min={1}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Costo Unit.</label>
                                <MoneyInput
                                    value={itemCost}
                                    onValueChange={(val) => setItemCost(val)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex justify-center items-center gap-1 shadow-sm active:scale-95 transition-all"
                                >
                                    <Plus size={16} /> Agregar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-border rounded-lg overflow-hidden bg-card">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="px-4 py-2">Producto</th>
                                    <th className="px-4 py-2 text-right">Cant.</th>
                                    <th className="px-4 py-2 text-right">Costo</th>
                                    <th className="px-4 py-2 text-right">Total</th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                                            No hay productos agregados.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => {
                                        const isUnlinked = item.productId === 'unknown';
                                        return (
                                            <tr key={index} className={isUnlinked ? "bg-yellow-50 dark:bg-yellow-900/10" : "hover:bg-muted/50 transition-colors"}>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2" title={isUnlinked ? "Producto no vinculado" : ""}>
                                                        {isUnlinked && (
                                                            <button
                                                                onClick={() => handleCreateProduct(index, item)}
                                                                className="p-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md flex items-center gap-1 text-xs font-bold transition-colors"
                                                                title="Crear producto en inventario"
                                                                type="button"
                                                            >
                                                                <Plus size={14} />
                                                                Crear
                                                            </button>
                                                        )}
                                                        <span className={isUnlinked ? "text-yellow-800 dark:text-yellow-500 font-medium" : "text-foreground"}>{item.productName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-foreground">{item.quantity}</td>
                                                <td className="px-4 py-2 text-right text-foreground">${item.unitCost.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right font-medium text-foreground">${item.total.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-400 hover:text-red-600 dark:hover:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            <tfoot className="bg-muted/50 font-bold">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-right text-gray-900 dark:text-gray-200">Total Compra:</td>
                                    <td className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400">${totalAmount.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                        {items.some(i => i.productId === 'unknown') && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-xs flex items-center gap-2 border-t border-yellow-100 dark:border-yellow-900/30">
                                <AlertTriangle size={14} />
                                Algunos productos importados no están vinculados al inventario. No se actualizará el stock de estos items. Elimínalos y agrégalos manualmente si deseas controlar stock.
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Notas</label>
                            <textarea
                                rows={2}
                                className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Photo Receipt */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Foto Recibo (Opcional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment" // Hints mobile browsers to open camera
                                ref={imageInputRef}
                                className="hidden"
                                onChange={handleImageUpload}
                            />

                            {!receiptUrl ? (
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full h-20 flex flex-col items-center justify-center gap-1 border border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted/50 hover:border-gray-400 transition-colors"
                                >
                                    <Camera size={20} />
                                    <span className="text-xs">Tomar Foto / Subir</span>
                                </button>
                            ) : (
                                <div className="relative w-full h-32">
                                    <img
                                        src={receiptUrl}
                                        alt="Recibo"
                                        className="w-full h-full object-cover rounded-lg border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setReceiptUrl("")}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                                        title="Eliminar foto"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm shadow-indigo-200 dark:shadow-none"
                        >
                            <Save size={18} />
                            Guardar Compra
                        </button>
                    </div>
                </form>
            </div >
            {productModalOpen && (
                <ProductFormModal
                    isOpen={productModalOpen}
                    onClose={() => setProductModalOpen(false)}
                    initialData={productModalData}
                    onSuccess={handleProductCreated}
                />
            )}
            <ContactFormModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                defaultType="supplier"
                onSuccess={(name, id) => {
                    if (id) {
                        setSupplierId(id);
                        alert(`Proveedor "${name}" creado y seleccionado exitosamente.`);
                    }
                }}
            />
        </div>
    );
}
