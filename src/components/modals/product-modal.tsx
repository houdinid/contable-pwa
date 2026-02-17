import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useData } from '@/context/data-context';
import type { Product } from '@/types';
import { MoneyInput } from "@/components/ui/money-input";

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    productToEdit?: Product | null;
}

export default function ProductModal({ isOpen, onClose, productToEdit }: ProductModalProps) {
    const { addProduct, updateProduct } = useData();
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [cost, setCost] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setName(productToEdit.name);
            setSku(productToEdit.sku || '');
            setDescription(productToEdit.description || '');
            setPrice(productToEdit.price.toString());
            setCost(productToEdit.cost.toString());
            setStock(productToEdit.stock.toString());
            setMinStock(productToEdit.minStock?.toString() || '');
        } else {
            setName('');
            setSku('');
            setDescription('');
            setPrice('');
            setCost('');
            setStock('0');
            setMinStock('');
        }
    }, [productToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const productData = {
            name,
            sku,
            description,
            price: Number(price),
            cost: Number(cost),
            stock: Number(stock),
            minStock: minStock ? Number(minStock) : undefined,
        };

        try {
            if (productToEdit) {
                await updateProduct(productToEdit.id, productData);
            } else {
                await addProduct(productData);
            }
            onClose();
        } catch (error) {
            console.error("Error saving product:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Código</label>
                            <input
                                type="text"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                            <MoneyInput
                                value={stock === '' ? 0 : Number(stock)}
                                // stock state is string in this component, but MoneyInput expects number value for 'value' prop usually?
                                // Wait, MoneyInputProps definition: value: number | string | undefined.
                                // Let's check MoneyInput definition.
                                // export interface MoneyInputProps { value?: number | string; ... }
                                // Yes.
                                // onValueChange gives number.
                                onValueChange={(val) => setStock(val.toString())}
                                currencySymbol=""
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                            <MoneyInput
                                value={price}
                                onValueChange={(val) => setPrice(val.toString())}
                                required
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario</label>
                            <MoneyInput
                                value={cost}
                                onValueChange={(val) => setCost(val.toString())}
                                required
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo (Alerta)</label>
                        <MoneyInput
                            value={minStock}
                            onValueChange={(val) => setMinStock(val.toString())}
                            currencySymbol=""
                            placeholder="Opcional"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
