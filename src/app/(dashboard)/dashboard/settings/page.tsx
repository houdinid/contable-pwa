"use client";

import { useData } from "@/context/data-context";
import { Download, Upload, CheckCircle, Building2, Plus, Trash2, Edit, CreditCard, Bell } from "lucide-react";
import React, { useState } from "react";
import type { BusinessIdentity } from "@/types";
import { PaymentMethodsManager } from "@/components/payments/payment-methods-manager";
import { ProgrammingDocs } from "@/components/settings/programming-docs";
import { toTitleCase, cleanEmail, cleanText, toLowerCaseAll } from "@/lib/utils";

import { compressImage } from "@/lib/image-utils";
import { PushNotificationManager } from "@/components/notifications/PushNotificationManager";

export default function SettingsPage() {
    const { 
        exportData: handleExportData, 
        importData, 
        businessIdentities, 
        addBusinessIdentity, 
        updateBusinessIdentity, 
        deleteBusinessIdentity,
        uploadBackupToCloud,
        listCloudBackups,
        restoreFromCloud,
        deleteCloudBackup,
        contacts,
        invoices,
        expenses,
        products,
        purchases,
        serviceOrders,
        softwareLicenses,
        taxDeadlines
    } = useData();
    const [status, setStatus] = useState<string>("");
    const [cloudBackups, setCloudBackups] = useState<any[]>([]);
    const [isLoadingCloud, setIsLoadingCloud] = useState(false);

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
        phone: "",
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
        setIdentityForm({ name: "", taxId: "", dv: "", address: "", city: "", phone: "", email: "", logoUrl: "", isDefault: false, isTaxPayer: true, bankAccounts: [] });
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
                phone: identity.phone || "",
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
            await handleExportData();
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

    const handleCloudBackup = async () => {
        await uploadBackupToCloud();
        loadCloudBackups();
    };

    const loadCloudBackups = async () => {
        setIsLoadingCloud(true);
        try {
            const list = await listCloudBackups();
            setCloudBackups(list);
        } finally {
            setIsLoadingCloud(false);
        }
    };

    const handleCloudRestore = async (name: string) => {
        await restoreFromCloud(name);
    };

    React.useEffect(() => {
        loadCloudBackups();
    }, []);

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
                            phone: "",
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
                <div className="p-4 sm:p-6 border-b border-border bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            NIT: {id.taxId}{id.dv ? `-${id.dv}` : ''} | {id.address}
                                            {id.phone && ` | Cel: ${id.phone}`}
                                        </p>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Celular / Teléfono (Opcional)</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                        value={identityForm.phone || ""}
                                        onChange={e => setIdentityForm({ ...identityForm, phone: e.target.value })}
                                        placeholder="Ej: 3001234567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Email (Opcional)</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 text-foreground"
                                        value={identityForm.email}
                                        onChange={e => setIdentityForm({ ...identityForm, email: e.target.value })}
                                        placeholder="Ej: contacto@empresa.com"
                                    />
                                </div>
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
                                        <div key={idx} className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm border border-border">
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
                <div className="p-6 border-b border-border bg-muted/50">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <CheckCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Especialidades / Productos Competitivos
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Define las categorías o productos principales para clasificar a tus proveedores.
                    </p>
                </div>
            </div>

            {/* Backup Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/50">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Copias de Seguridad (Backup)
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Respalda tu información localmente o en la nube para prevenir pérdida de datos.
                    </p>
                </div>

                <div className="p-6 space-y-8">
                    {/* Database Statistics */}
                    <div className="bg-muted/30 border border-border rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Estadísticas de Datos a Respaldar
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-card p-3 rounded-lg border border-border flex flex-col justify-between shadow-xs">
                                <span className="text-xs text-muted-foreground">Clientes/Prov.</span>
                                <span className="text-xl font-bold text-foreground mt-1">{contacts.length}</span>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-border flex flex-col justify-between shadow-xs">
                                <span className="text-xs text-muted-foreground">Facturas/Cotiz.</span>
                                <span className="text-xl font-bold text-foreground mt-1">{invoices.length}</span>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-border flex flex-col justify-between shadow-xs">
                                <span className="text-xs text-muted-foreground">Gastos</span>
                                <span className="text-xl font-bold text-foreground mt-1">{expenses.length}</span>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-border flex flex-col justify-between shadow-xs">
                                <span className="text-xs text-muted-foreground">Órdenes Serv.</span>
                                <span className="text-xl font-bold text-foreground mt-1">{serviceOrders.length}</span>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-border flex flex-col justify-between shadow-xs">
                                <span className="text-xs text-muted-foreground">Productos</span>
                                <span className="text-xl font-bold text-foreground mt-1">{products.length}</span>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-border flex flex-col justify-between shadow-xs">
                                <span className="text-xs text-muted-foreground">Compras</span>
                                <span className="text-xl font-bold text-foreground mt-1">{purchases.length}</span>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-border flex flex-col justify-between shadow-xs">
                                <span className="text-xs text-muted-foreground">Licencias Soft.</span>
                                <span className="text-xl font-bold text-foreground mt-1">{softwareLicenses.length}</span>
                            </div>
                            <div className="bg-card p-3 rounded-lg border border-border flex flex-col justify-between shadow-xs">
                                <span className="text-xs text-muted-foreground">Oblig. Fiscales</span>
                                <span className="text-xl font-bold text-foreground mt-1">{taxDeadlines.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Export/Import local */}
                        <div className="space-y-6">
                            {/* Local Export */}
                            <div className="flex items-start gap-4 p-5 bg-blue-50/50 dark:bg-blue-950/15 rounded-xl border border-blue-100 dark:border-blue-900/40">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                    <Download size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-200">Exportación Local</h3>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                                        Descarga un archivo JSON encriptado con todo el contenido actual para guardarlo de forma física.
                                    </p>
                                    <button
                                        onClick={handleExport}
                                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Download size={14} /> Descargar Archivo JSON
                                    </button>
                                    {status === "success-export" && (
                                        <p className="text-green-600 dark:text-green-400 text-xs mt-2 flex items-center gap-1">
                                            <CheckCircle size={12} /> ¡Archivo descargado con éxito!
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Local Import Dropzone */}
                            <div className="flex items-start gap-4 p-5 bg-orange-50/50 dark:bg-orange-950/15 rounded-xl border border-orange-100 dark:border-orange-900/40">
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-lg text-orange-600 dark:text-orange-400 shrink-0">
                                    <Upload size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-orange-900 dark:text-orange-200">Restauración Local</h3>
                                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 mb-3 leading-relaxed">
                                        Carga un respaldo <code>.json</code>. <strong>Esto fusionará/sobrescribirá</strong> los registros mediante su ID único.
                                    </p>
                                    
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-orange-200 dark:border-orange-900/60 rounded-xl p-4 bg-card cursor-pointer hover:bg-orange-50/20 dark:hover:bg-orange-950/5 transition-colors">
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            <Upload size={20} className="text-orange-500" />
                                            <span className="text-xs font-medium text-foreground">Arrastra o selecciona un archivo .json</span>
                                            <span className="text-[10px] text-muted-foreground">Formatos válidos: JSON generado por la App</span>
                                        </div>
                                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Cloud Backup */}
                        <div className="space-y-6">
                            <div className="flex flex-col gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-950/15 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                                        <Building2 size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Copia de Seguridad en la Nube</h3>
                                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1 leading-relaxed">
                                            Respalda y restaura de forma directa en el bucket seguro de Supabase.
                                        </p>
                                        <button
                                            onClick={handleCloudBackup}
                                            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Building2 size={14} /> Subir Copia a la Nube
                                        </button>
                                    </div>
                                </div>

                                {/* Cloud Backup List */}
                                <div className="mt-2 border-t border-indigo-100 dark:border-indigo-900/50 pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-xs font-semibold text-indigo-950 dark:text-indigo-300">Copias de Seguridad Disponibles</h4>
                                        <button 
                                            onClick={loadCloudBackups}
                                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                                        >
                                            Actualizar Lista
                                        </button>
                                    </div>

                                    {isLoadingCloud ? (
                                        <div className="flex justify-center py-6">
                                            <span className="text-xs text-indigo-500 animate-pulse">Obteniendo respaldos...</span>
                                        </div>
                                    ) : cloudBackups.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic text-center py-4">No hay copias en la nube todavía.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                            {cloudBackups.map((backup) => (
                                                <div key={backup.name} className="flex justify-between items-center text-xs p-3 bg-card border border-border rounded-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                                                    <div className="flex flex-col min-w-0 pr-2">
                                                        <span className="font-semibold text-foreground truncate" title={backup.name}>{backup.name}</span>
                                                        <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                                            {new Date(backup.created_at).toLocaleString('es-CO')} | {(backup.metadata?.size / 1024).toFixed(2)} KB
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleCloudRestore(backup.name)}
                                                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 rounded font-semibold text-[10px] cursor-pointer"
                                                        >
                                                            Restaurar
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                await deleteCloudBackup(backup.name);
                                                                loadCloudBackups();
                                                            }}
                                                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded transition-colors cursor-pointer"
                                                            title="Eliminar Respaldo"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notificaciones Push Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/50">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Bell size={20} className="text-indigo-600 dark:text-indigo-400" />
                        Notificaciones Externas (Celular/Escritorio)
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Recibe alertas de vencimiento directamente en tu dispositivo sin tener que abrir la aplicación.
                    </p>
                </div>
                <div className="p-6">
                    <PushNotificationManager />
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
                <div className="p-6 border-b border-border bg-muted/50">
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




function ExpenseCategoriesManager() {
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
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
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
                                <tr key={cat.id} className="hover:bg-muted/50">
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
