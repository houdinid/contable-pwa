"use client";

import { useData } from "@/context/data-context";
import { Download, Upload, CheckCircle, Building2, Plus, Trash2, Edit, CreditCard } from "lucide-react";
import React, { useState } from "react";
import type { BusinessIdentity } from "@/types";
import { PaymentMethodsManager } from "@/components/payments/payment-methods-manager";
import { ExpenseCategoriesManager } from "@/components/settings/expense-categories-manager";
import { ProgrammingDocs } from "@/components/settings/programming-docs";
import { toTitleCase, cleanEmail, cleanText, toLowerCaseAll } from "@/lib/utils";

import { compressImage } from "@/lib/image-utils";

export default function SettingsPage() {
    const { exportData, importData, businessIdentities, addBusinessIdentity, updateBusinessIdentity, deleteBusinessIdentity } = useData();
    const [status, setStatus] = useState<string>("");

    // Identity Form State
    const [showIdentityForm, setShowIdentityForm] = useState(false);
    const [isImportingIdentities, setIsImportingIdentities] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [identityForm, setIdentityForm] = useState<Omit<BusinessIdentity, "id">>({
        name: "",
        taxId: "",
        dv: "",
        address: "",
        city: "",
        email: "",
        logoUrl: "",
        isDefault: false,
        isTaxPayer: true, // Default true
        bankAccounts: []
    });

    const handleIdentitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateBusinessIdentity(editingId, identityForm);
            } else {
                await addBusinessIdentity(identityForm);
            }
            setShowIdentityForm(false);
            resetForm();
        } catch (e) {
            alert("Error al guardar: " + e);
        }
    };

    const resetForm = () => {
        setIdentityForm({ name: "", taxId: "", dv: "", address: "", city: "", email: "", logoUrl: "", isDefault: false, isTaxPayer: true, bankAccounts: [] });
        setEditingId(null);
    };

    const handleEditIdentity = (id: string) => {
        const identity = businessIdentities.find(i => i.id === id);
        if (identity) {
            setIdentityForm({
                name: identity.name,
                taxId: identity.taxId || "",
                dv: identity.dv || "",
                address: identity.address || "",
                city: identity.city || "",
                email: identity.email || "",
                logoUrl: identity.logoUrl || "",
                isDefault: identity.isDefault,
                isTaxPayer: identity.isTaxPayer ?? true,
                bankAccounts: identity.bankAccounts || []
            });
            setEditingId(id);
            setShowIdentityForm(true);
        }
    };

    const handleDeleteIdentity = async (id: string) => {
        if (confirm("¿Seguro que deseas eliminar esta razón social?")) {
            await deleteBusinessIdentity(id);
        }
    };

    const handleExport = async () => {
        try {
            await exportData();
            setStatus("success-export");
            setTimeout(() => setStatus(""), 3000);
        } catch (e) {
            alert("Error exportando: " + e);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("⚠️ ATENCIÓN: Importar un respaldo SOBREESCRIBIRÁ todos los datos actuales. ¿Estás seguro?")) {
            return;
        }

        try {
            const text = await file.text();
            await importData(text);
            setStatus("success-import");
            alert("¡Datos restaurados correctamente!");
            window.location.reload(); // Reload to reflect changes
        } catch (e) {
            alert("Error importando archivo: El formato no es válido o la clave es incorrecta.");
        }
    };

    const handleDownloadIdentitiesTemplate = () => {
        const headers = ["Razon Social", "NIT", "DV", "Direccion", "Ciudad", "Email"];
        const sampleRow = ["Mi Empresa S.A.", "900123456", "7", "Calle Principal #1", "Bogota", "contacto@miempresa.com"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(";") + "\n"
            + sampleRow.join(";");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_razones_sociales.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleIdentitiesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImportingIdentities(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
                if (lines.length < 2) {
                    alert("El archivo parece estar vacío o no tiene el formato correcto.");
                    return;
                }

                const separator = lines[0].includes(';') ? ';' : ',';
                let successCount = 0;
                let errorCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(separator).map(cell => cell.trim().replace(/^"|"$/g, ''));
                    if (row.length < 2) continue; // Skip malformed rows

                    const name = toTitleCase(row[0] || "");
                    const taxId = cleanText(row[1] || "");
                    const dv = cleanText(row[2] || "");
                    const address = toLowerCaseAll(row[3] || "");
                    const city = toTitleCase(row[4] || "");
                    const email = cleanEmail(row[5] || "");

                    if (!name || !taxId) {
                        errorCount++;
                        continue;
                    }

                    try {
                        await addBusinessIdentity({
                            name,
                            taxId,
                            dv,
                            address,
                            city,
                            email,
                            isDefault: false,
                            isTaxPayer: true,
                            bankAccounts: []
                        });
                        successCount++;
                    } catch (err) {
                        console.error("Error adding row", i, err);
                        errorCount++;
                    }
                }

                alert(`Importación completada.\n\nRazones Sociales importadas: ${successCount}\nErrores: ${errorCount}`);
            } catch (error) {
                console.error("Error parsing CSV:", error);
                alert("Hubo un error al procesar el archivo CSV.");
            } finally {
                setIsImportingIdentities(false);
                e.target.value = '';
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Configuración y Seguridad</h1>
                <p className="text-gray-500 dark:text-gray-400">Gestiona tus copias de seguridad y preferencias.</p>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                            Mis Razones Sociales (Emisores)
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Gestiona las empresas o nombres con los que facturas.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleDownloadIdentitiesTemplate}
                            title="Descargar Plantilla CSV"
                            className="flex items-center justify-center w-8 h-8 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                        >
                            <Download size={16} />
                        </button>

                        <label
                            title="Importar CSV"
                            className={`flex items-center justify-center w-8 h-8 ${isImportingIdentities ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-50 text-green-600 cursor-pointer hover:bg-green-100'} rounded-lg transition-colors border border-green-200`}
                        >
                            <Upload size={16} />
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleIdentitiesFileUpload}
                                disabled={isImportingIdentities}
                            />
                        </label>

                        <button
                            onClick={() => {
                                resetForm();
                                setShowIdentityForm(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={16} /> Agregar
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {businessIdentities.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No tienes razones sociales registradas.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {businessIdentities.map(id => (
                                <div key={id.id} className="flex justify-between items-center p-4 border border-border rounded-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-foreground">{id.name}</h3>
                                            {id.isDefault && (
                                                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">Predeterminado</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">NIT: {id.taxId}{id.dv ? `-${id.dv}` : ''} | {id.address}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditIdentity(id.id)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteIdentity(id.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Identity Modal Form */}
            {showIdentityForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-border">
                        <h3 className="text-lg font-bold text-foreground mb-4">{editingId ? 'Editar Razón Social' : 'Nueva Razón Social'}</h3>
                        <form onSubmit={handleIdentitySubmit} className="space-y-4">
                            {/* Logo Upload */}
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border border-border mb-2">
                                    {identityForm.logoUrl ? (
                                        <img src={identityForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={32} className="text-gray-400 dark:text-gray-500" />
                                    )}
                                    <label className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload size={20} className="text-white" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    try {
                                                        const compressed = await compressImage(file);
                                                        setIdentityForm(prev => ({ ...prev, logoUrl: compressed }));
                                                    } catch (err) {
                                                        alert("Error al procesar imagen");
                                                    }
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Click para subir logo</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Nombre / Razón Social</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                    value={identityForm.name}
                                    onChange={e => setIdentityForm({ ...identityForm, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">NIT / Identificación</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            required
                                            className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                            value={identityForm.taxId}
                                            onChange={e => setIdentityForm({ ...identityForm, taxId: e.target.value })}
                                        />
                                        <span className="text-foreground font-bold">-</span>
                                        <input
                                            className="w-16 px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground text-center"
                                            placeholder="DV"
                                            maxLength={1}
                                            value={identityForm.dv || ""}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setIdentityForm({ ...identityForm, dv: val });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Ciudad</label>
                                    <input
                                        className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                        value={identityForm.city || ""}
                                        onChange={e => setIdentityForm({ ...identityForm, city: e.target.value })}
                                        placeholder="Ej: Bogotá"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Dirección</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                    value={identityForm.address}
                                    onChange={e => setIdentityForm({ ...identityForm, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Email (Opcional)</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                    value={identityForm.email}
                                    onChange={e => setIdentityForm({ ...identityForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mb-2">
                                    <input
                                        type="checkbox"
                                        checked={identityForm.isTaxPayer}
                                        onChange={e => setIdentityForm({ ...identityForm, isTaxPayer: e.target.checked })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Responsable de IVA (Cobrar Impuestos)
                                </label>
                                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={identityForm.isDefault}
                                        onChange={e => setIdentityForm({ ...identityForm, isDefault: e.target.checked })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Establecer como predeterminado
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowIdentityForm(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Guardar
                                </button>
                            </div>

                            {/* Bank Accounts Section (Only visible when editing for now to simplify state management, or if we structure state better) */}
                            {/* Let's allow adding accounts directly here if state permits, but simpler to manage bank accounts *after* creation or inside this form if we extend state. 
                                For now, let's keep it simple: Basic info first. Bank accounts can be added via a separate small section in this modal? 
                                Yes, let's add it below the basic info.
                             */}

                            <div className="border-t border-border pt-4 mt-4">
                                <h4 className="text-sm font-semibold text-foreground mb-2">Cuentas Bancarias Propias</h4>
                                <p className="text-xs text-gray-500 mb-3">Cuentas donde recibes dinero o desde donde pagas gastos.</p>

                                <div className="space-y-2 mb-3">
                                    {identityForm.bankAccounts?.map((acc, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm border border-border">
                                            <span>{acc.bankName} - {acc.accountNumber} ({acc.accountType === 'savings' ? 'Ahorros' : 'Corriente'})</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newAccs = [...(identityForm.bankAccounts || [])];
                                                    newAccs.splice(idx, 1);
                                                    setIdentityForm({ ...identityForm, bankAccounts: newAccs });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!identityForm.bankAccounts || identityForm.bankAccounts.length === 0) && (
                                        <p className="text-xs text-gray-400 italic">No hay cuentas registradas.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        id="newBankName"
                                        placeholder="Banco (ej. Nequi)"
                                        className="px-2 py-1 text-sm border border-border rounded bg-background"
                                    />
                                    <input
                                        id="newAccNum"
                                        placeholder="Número de Cuenta"
                                        className="px-2 py-1 text-sm border border-border rounded bg-background"
                                    />
                                    <div className="flex gap-1">
                                        <select id="newAccType" className="px-2 py-1 text-sm border border-border rounded bg-background w-full">
                                            <option value="savings">Ahorros</option>
                                            <option value="checking">Corriente</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const bankName = (document.getElementById('newBankName') as HTMLInputElement).value;
                                                const accountNumber = (document.getElementById('newAccNum') as HTMLInputElement).value;
                                                const accountType = (document.getElementById('newAccType') as HTMLSelectElement).value as any;

                                                if (bankName && accountNumber) {
                                                    const newAcc = {
                                                        id: crypto.randomUUID(),
                                                        bankName,
                                                        accountNumber,
                                                        accountType
                                                    };
                                                    setIdentityForm({
                                                        ...identityForm,
                                                        bankAccounts: [...(identityForm.bankAccounts || []), newAcc]
                                                    });
                                                    (document.getElementById('newBankName') as HTMLInputElement).value = '';
                                                    (document.getElementById('newAccNum') as HTMLInputElement).value = '';
                                                }
                                            }}
                                            className="px-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Supplier Categories Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <CheckCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Especialidades / Productos Competitivos
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Define las categorías o productos principales para clasificar a tus proveedores.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <SupplierCategoriesManager />
                </div>
            </div>

            {/* Backup Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Copias de Seguridad (Backup)
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Descarga una copia de toda tu información (Clientes, Facturas, etc.) para guardarla en tu computador.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Export Section */}
                    <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full text-blue-600 dark:text-blue-400">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900 dark:text-blue-100">Exportar Datos</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                Genera un archivo <code>.json</code> con toda tu información encriptada.
                            </p>
                            <button
                                onClick={handleExport}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Descargar Copia de Seguridad
                            </button>
                            {status === "success-export" && (
                                <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
                                    <CheckCircle size={14} /> Archivo descargado exitosamente.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Import Section */}
                    <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                        <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-full text-orange-600 dark:text-orange-400">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h3 className="font-medium text-orange-900 dark:text-orange-100">Restaurar Datos</h3>
                            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                                Carga un archivo de respaldo previamente descargado.
                                <br />
                                <strong>Nota:</strong> Esto reemplazará toda la información actual.
                            </p>
                            <label className="px-4 py-2 bg-card border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-sm font-medium cursor-pointer inline-block">
                                Seleccionar Archivo...
                                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>



            {/* Programming & Documentation Section */}
            <div className="mb-8">
                <ProgrammingDocs />
            </div>

            {/* Expense Categories Section Origin */}
            <div className="mb-8">
                <ExpenseCategoriesManager />
            </div>

            {/* Payment Methods Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <CreditCard size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Métodos de Pago
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Configura las formas de pago que aceptas (Efectivo, Bancos, Criptomonedas, etc.).
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <PaymentMethodsManager />
                </div>
            </div>
        </div >
    );
}




function SupplierCategoriesManager() {
    const { supplierCategories, addSupplierCategory, deleteSupplierCategory } = useData();
    const [newCategory, setNewCategory] = useState("");

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        await addSupplierCategory(newCategory.trim());
        setNewCategory("");
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta categoría?")) {
            await deleteSupplierCategory(id);
        }
    };

    return (
        <div className="space-y-4">
            {/* Add Form */}
            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nueva especialidad (ej. Papelería, Mantenimiento)"
                    className="flex-1 px-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                />
                <button
                    type="submit"
                    disabled={!newCategory.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Plus size={18} /> Agregar
                </button>
            </form>

            {/* List Table */}
            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3 text-right" style={{ width: '100px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {supplierCategories.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No hay categorías definidas.
                                </td>
                            </tr>
                        ) : (
                            supplierCategories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                    <td className="px-4 py-3 text-foreground font-medium">{cat.name}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
