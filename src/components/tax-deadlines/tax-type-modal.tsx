"use client";

import { useState } from "react";
import { useData } from "@/context/data-context";
import { X, Save, Plus } from "lucide-react";

interface TaxTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (name: string) => void;
}

export function TaxTypeFormModal({ isOpen, onClose, onSuccess }: TaxTypeFormModalProps) {
    const { addTaxType } = useData();
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await addTaxType({ name: name.trim() });
            onSuccess(name.trim());
            setName("");
            onClose();
        } catch (error: any) {
            console.error("Error creating tax type:", error);
            if (error.message?.includes("tabla 'tax_types' no existe")) {
                alert("Aviso: " + error.message + "\n\nPuedes seguir trabajando, pero recuerda ejecutar el script SQL en Supabase más tarde para que se guarde en la nube.");
                onSuccess(name.trim());
                setName("");
                onClose();
            } else {
                alert("Error al crear el tipo de impuesto: " + (error.message || JSON.stringify(error)));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-border">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                    <h3 className="font-bold text-foreground">Nuevo Tipo de Impuesto</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Nombre del Impuesto / Obligación *</label>
                        <input
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            placeholder="Ej: Impuesto al Patrimonio, Retención ICA..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            Guardar Tipo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
