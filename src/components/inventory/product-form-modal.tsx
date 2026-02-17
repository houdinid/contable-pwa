import { useState, useEffect } from "react";
import { useData } from "@/context/data-context";
import { X, Save, Package } from "lucide-react";
import type { Product } from "@/types";

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product; // For editing
    initialData?: Partial<Product>; // For creating from XML
    onSuccess?: (product: Product) => void;
}

export function ProductFormModal({ isOpen, onClose, product, initialData, onSuccess }: ProductFormModalProps) {
    const { addProduct, updateProduct } = useData();
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        stock: 0,
        price: 0,
        cost: 0,
        minStock: 5,
        description: "",
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku || "",
                stock: product.stock,
                price: product.price,
                cost: product.cost,
                minStock: product.minStock || 5,
                description: product.description || "",
            });
        } else if (initialData) {
            setFormData({
                name: initialData.name || "",
                sku: initialData.sku || "",
                stock: initialData.stock || 0,
                price: initialData.price || 0,
                cost: initialData.cost || 0,
                minStock: initialData.minStock || 5,
                description: initialData.description || "",
            });
        } else {
            setFormData({
                name: "",
                sku: "",
                stock: 0,
                price: 0,
                cost: 0,
                minStock: 5,
                description: "",
            });
        }
    }, [product, initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.name) throw new Error("Nombre requerido");

            const dataToSave = {
                name: formData.name,
                sku: formData.sku,
                stock: Number(formData.stock),
                price: Number(formData.price),
                cost: Number(formData.cost),
                minStock: Number(formData.minStock),
                description: formData.description,
            };

            let savedProduct: Product | undefined;

            if (product) {
                await updateProduct(product.id, dataToSave);
                savedProduct = { ...product, ...dataToSave }; // Approximate, context updates async
            } else {
                const newId = await addProduct(dataToSave);
                // We need the full product object to pass back. 
                // Since addProduct now returns ID (we need to update that too!), we can construct it.
                // Wait, addProduct currently returns void in DataContext interface? Need to check.
                // If it returns void, I need to update DataContext first.
                // Assuming I will update DataContext to return ID like Contact.
                if (newId) {
                    savedProduct = {
                        id: newId,
                        createdAt: new Date().toISOString(),
                        ...dataToSave
                    };
                }
            }

            if (onSuccess && savedProduct) onSuccess(savedProduct);
            onClose();
        } catch (error) {
            alert("Error al guardar producto");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-indigo-600" />
                        {product ? "Editar Producto" : "Nuevo Producto"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                        <input
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Código</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                            <input
                                type="number"
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra (Costo)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    required
                                    className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    required
                                    className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo (Alerta)</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.minStock}
                            onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
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
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Save size={18} />
                            Guardar Producto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
