"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, Landmark, Loader2 } from "lucide-react";
import { useData } from "@/context/data-context";

export default function TaxTypesManagementPage() {
    const { taxTypes, addTaxType, deleteTaxType } = useData();
    const [newName, setNewName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsSubmitting(true);
        try {
            await addTaxType({ name: newName.trim() });
            setNewName("");
        } catch (error) {
            console.error("Error adding tax type:", error);
            alert("No se pudo crear el tipo de impuesto.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este tipo de impuesto? Esto no borrará las obligaciones asociadas, pero ya no aparecerá en el listado.")) {
            try {
                await deleteTaxType(id);
            } catch (error) {
                console.error("Error deleting tax type:", error);
                alert("No se pudo eliminar el tipo de impuesto.");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/tax-deadlines"
                    className="p-2 text-gray-500 hover:bg-amber-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestión de Impuestos</h1>
                    <p className="text-gray-500 dark:text-gray-400">Configura los tipos de impuestos que usas en tus obligaciones.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-1">
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden sticky top-24">
                        <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                            <Plus className="text-amber-500" size={20} />
                            <h2 className="font-semibold text-foreground">Nuevo Impuesto</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ej: Retención IVA"
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !newName.trim()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Guardar Impuesto
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="md:col-span-2">
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-2">
                            <Landmark className="text-amber-500" size={20} />
                            <h2 className="font-semibold text-foreground">Lista de Impuestos Registrados</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {taxTypes.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground">
                                    <p>No hay impuestos personalizados todavía.</p>
                                </div>
                            ) : (
                                taxTypes.map((type) => (
                                    <div key={type.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="font-medium text-foreground">{type.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(type.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
