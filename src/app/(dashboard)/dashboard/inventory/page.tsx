"use client";

import { useState } from 'react';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { useData } from '@/context/data-context';
import ProductModal from '@/components/modals/product-modal';
import type { Product } from '@/types';

export default function InventoryPage() {
    const { products, deleteProduct } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleEdit = (product: Product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            await deleteProduct(id);
        }
    };

    const handleNewProduct = () => {
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona tus productos y control de stock</p>
                </div>
                <button
                    onClick={handleNewProduct}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm active:scale-95"
                >
                    <Plus size={20} />
                    Nuevo Producto
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                    <div className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Total Productos</div>
                    <div className="text-2xl font-bold text-foreground">{products.length}</div>
                </div>
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                    <div className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Valor Inventario</div>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        ${products.reduce((acc, p) => acc + (p.stock * p.cost), 0).toLocaleString()}
                    </div>
                </div>
                <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                    <div className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-1">Items Bajos en Stock</div>
                    <div className="text-2xl font-bold text-orange-500">
                        {products.filter(p => p.minStock && p.stock <= p.minStock).length}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-foreground placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Products List */}
            <div className="grid gap-4">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">{product.name}</h3>
                                {product.sku && <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>}
                                <div className="flex gap-4 mt-1 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Precio: <span className="font-medium text-foreground">${product.price.toLocaleString()}</span>
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Costo: <span className="font-medium text-foreground">${product.cost.toLocaleString()}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-border md:border-0 border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between md:block md:text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stock Disponible</div>
                                <div className={`font-bold text-lg flex items-center gap-2 justify-end ${product.minStock && product.stock <= product.minStock ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                                    }`}>
                                    {product.minStock && product.stock <= product.minStock && (
                                        <AlertTriangle size={16} className="text-red-500" />
                                    )}
                                    {product.stock}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No se encontraron productos. ¡Crea el primero!
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={productToEdit}
            />
        </div>
    );
}
