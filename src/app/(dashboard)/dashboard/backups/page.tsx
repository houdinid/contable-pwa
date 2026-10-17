"use client";

import { useState, useEffect } from "react";
import { useData } from "@/context/data-context";
import { 
    DatabaseBackup, 
    Play, 
    Pause, 
    Square, 
    Save, 
    Clock, 
    AlertTriangle, 
    ShieldCheck, 
    ShieldAlert, 
    Download, 
    Upload, 
    Cloud, 
    CloudUpload, 
    RefreshCw, 
    Trash2, 
    CheckCircle2, 
    Server, 
    FolderSync, 
    Terminal, 
    Copy, 
    Check,
    HardDrive,
    Info
} from "lucide-react";

interface BackupStatus {
    isCloud?: boolean;
    isSupported?: boolean;
    isRunning: boolean;
    isPaused: boolean;
    progress: {
        Status: string;
        Percent: number;
        CurrentFolder?: string;
        Timestamp: string;
    } | null;
    scheduledTask: {
        nextRun: string;
        status: string;
    } | null;
    message?: string;
}

export default function BackupsPage() {
    // Tab state: "database" or "cms"
    const [activeTab, setActiveTab] = useState<"database" | "cms">("database");

    // Database Cloud & Local backup from DataContext
    const { 
        exportData: downloadDatabaseBackup, 
        importData, 
        uploadBackupToCloud, 
        listCloudBackups, 
        restoreFromCloud, 
        deleteCloudBackup,
        loadingData 
    } = useData();

    const [cloudBackups, setCloudBackups] = useState<any[]>([]);
    const [isLoadingCloud, setIsLoadingCloud] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isUploadingCloud, setIsUploadingCloud] = useState(false);
    const [dbSuccessMessage, setDbSuccessMessage] = useState<string>("");
    const [copiedScript, setCopiedScript] = useState(false);

    // CMS Script state
    const [status, setStatus] = useState<BackupStatus | null>(null);
    const [loadingScriptStatus, setLoadingScriptStatus] = useState(true);
    const [scheduleTime, setScheduleTime] = useState("");
    const [skipCanary, setSkipCanary] = useState(false);
    const [skipVolume, setSkipVolume] = useState(false);

    // Fetch cloud backups for Database tab
    const loadCloudBackupsList = async () => {
        setIsLoadingCloud(true);
        try {
            const list = await listCloudBackups();
            setCloudBackups(list || []);
        } catch (e) {
            console.error("Error al listar copias de la nube:", e);
        } finally {
            setIsLoadingCloud(false);
        }
    };

    useEffect(() => {
        loadCloudBackupsList();
    }, []);

    // Fetch CMS Script status
    const fetchScriptStatus = async () => {
        try {
            const res = await fetch('/api/backup');
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error("Error fetching backup status", error);
        } finally {
            setLoadingScriptStatus(false);
        }
    };

    useEffect(() => {
        fetchScriptStatus();
        const interval = setInterval(fetchScriptStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    // Handlers for Database tab
    const handleDownloadJson = async () => {
        try {
            setIsExporting(true);
            await downloadDatabaseBackup();
            setDbSuccessMessage("¡Copia de seguridad JSON descargada correctamente!");
            setTimeout(() => setDbSuccessMessage(""), 4000);
        } catch (e: any) {
            alert("Error al exportar datos: " + (e?.message || e));
        } finally {
            setIsExporting(false);
        }
    };

    const handleUploadCloud = async () => {
        try {
            setIsUploadingCloud(true);
            await uploadBackupToCloud();
            await loadCloudBackupsList();
            setDbSuccessMessage("¡Copia de seguridad subida a la nube exitosamente!");
            setTimeout(() => setDbSuccessMessage(""), 4000);
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsUploadingCloud(false);
        }
    };

    const handleRestoreCloud = async (fileName: string) => {
        try {
            await restoreFromCloud(fileName);
            setDbSuccessMessage(`¡Respaldo ${fileName} restaurado! Recargando...`);
            setTimeout(() => window.location.reload(), 1500);
        } catch (e: any) {
            console.error(e);
        }
    };

    const handleDeleteCloud = async (fileName: string) => {
        try {
            await deleteCloudBackup(fileName);
            await loadCloudBackupsList();
        } catch (e: any) {
            console.error(e);
        }
    };

    const handleImportLocalJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("⚠️ ATENCIÓN: Importar un respaldo actualizará y fusionará los registros por su ID. ¿Deseas continuar?")) {
            e.target.value = "";
            return;
        }

        try {
            const text = await file.text();
            await importData(text);
            alert("¡Datos restaurados correctamente!");
            window.location.reload();
        } catch (e: any) {
            alert("Error al importar archivo: Formato no válido. " + (e?.message || ""));
        } finally {
            e.target.value = "";
        }
    };

    // Handlers for CMS tab
    const handleCmsAction = async (action: string, options?: any) => {
        try {
            const res = await fetch('/api/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, options })
            });
            const data = await res.json();
            if (data.error) {
                alert(data.error);
            } else {
                fetchScriptStatus();
            }
        } catch (error) {
            console.error(error);
            alert("Error al ejecutar acción");
        }
    };

    const handleCmsSchedule = () => {
        if (!scheduleTime) {
            if (confirm("¿Eliminar la programación diaria actual?")) {
                handleCmsAction('schedule', { time: "" });
            }
            return;
        }
        handleCmsAction('schedule', { time: scheduleTime });
    };

    const copyScriptCommand = () => {
        navigator.clipboard.writeText('powershell -ExecutionPolicy Bypass -File "D:\\contable-pwa\\scripts\\backup.ps1"');
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2500);
    };

    const isRunning = status?.isRunning;
    const isPaused = status?.isPaused;
    const pct = status?.progress?.Percent || 0;
    const progressText = status?.progress?.Status || (isRunning ? "Ejecutando..." : "Inactivo");
    const isCloudEnv = status?.isCloud || !status?.isSupported;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <DatabaseBackup size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Copias de Seguridad</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Respalda y restaura tus datos contables y archivos empresariales
                        </p>
                    </div>
                </div>

                {/* Tabs selector */}
                <div className="flex bg-muted/60 p-1 rounded-xl border border-border">
                    <button
                        onClick={() => setActiveTab("database")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === "database"
                                ? "bg-background text-foreground shadow-sm font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <DatabaseBackup size={16} className={activeTab === "database" ? "text-indigo-600 dark:text-indigo-400" : ""} />
                        <span>Datos Contables</span>
                        <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 font-bold px-1.5 py-0.5 rounded-full">
                            Nube
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("cms")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === "cms"
                                ? "bg-background text-foreground shadow-sm font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <FolderSync size={16} className={activeTab === "cms" ? "text-indigo-600 dark:text-indigo-400" : ""} />
                        <span>Archivos CMS / Red</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded-full">
                            Local
                        </span>
                    </button>
                </div>
            </div>

            {/* TAB 1: DATOS CONTABLES (SUPABASE & JSON) */}
            {activeTab === "database" && (
                <div className="space-y-6">
                    {dbSuccessMessage && (
                        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-xl text-green-800 dark:text-green-300 text-sm flex items-center gap-2 animate-fade-in">
                            <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0" />
                            <span>{dbSuccessMessage}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tarjeta 1: Respaldo y Restauración Local */}
                        <div className="space-y-6">
                            {/* Exportar JSON */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <Download size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-foreground">Descargar Copia de Seguridad (.json)</h2>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Exporta todas las tablas del sistema: facturas, gastos, clientes, compras, inventario, pagos y licencias a un único archivo local.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownloadJson}
                                    disabled={isExporting || loadingData}
                                    className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm shadow-sm cursor-pointer"
                                >
                                    <Download size={18} />
                                    {isExporting ? "Generando descarga..." : "Descargar Archivo JSON"}
                                </button>
                            </div>

                            {/* Restaurar Localmente */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                        <Upload size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-foreground">Restaurar Copia Local (.json)</h2>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Carga un archivo generado previamente para restablecer o actualizar los datos del sistema mediante sus identificadores únicos.
                                        </p>
                                    </div>
                                </div>

                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-orange-200 dark:border-orange-900/60 rounded-xl p-6 bg-orange-50/20 dark:bg-orange-950/10 cursor-pointer hover:bg-orange-50/40 dark:hover:bg-orange-950/20 transition-colors">
                                    <Upload size={24} className="text-orange-500 mb-2" />
                                    <span className="text-xs font-semibold text-foreground">Seleccionar o arrastrar archivo .json</span>
                                    <span className="text-[11px] text-muted-foreground mt-0.5">Respaldos generados por Contable PWA</span>
                                    <input 
                                        type="file" 
                                        accept=".json" 
                                        onChange={handleImportLocalJson} 
                                        disabled={loadingData}
                                        className="hidden" 
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Tarjeta 2: Respaldos en la Nube (Supabase Storage) */}
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <Cloud size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-foreground">Copias de Seguridad en la Nube</h2>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Almacenamiento seguro directo en Supabase Storage (accesible desde cualquier dispositivo).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleUploadCloud}
                                disabled={isUploadingCloud || loadingData}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm shadow-sm cursor-pointer mb-5"
                            >
                                <CloudUpload size={18} />
                                {isUploadingCloud ? "Subiendo respaldo a la nube..." : "Crear y Subir Copia a la Nube"}
                            </button>

                            <div className="border-t border-border pt-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Copias Guardadas en la Nube ({cloudBackups.length})
                                    </h3>
                                    <button 
                                        onClick={loadCloudBackupsList}
                                        disabled={isLoadingCloud}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <RefreshCw size={12} className={isLoadingCloud ? "animate-spin" : ""} />
                                        Actualizar
                                    </button>
                                </div>

                                {isLoadingCloud ? (
                                    <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                        <RefreshCw size={16} className="animate-spin text-indigo-600" />
                                        Cargando lista de respaldos...
                                    </div>
                                ) : cloudBackups.length === 0 ? (
                                    <div className="py-10 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-lg">
                                        No hay respaldos guardados en la nube aún.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-1">
                                        {cloudBackups.map((bk) => {
                                            const sizeKb = bk.metadata?.size ? (bk.metadata.size / 1024).toFixed(1) : null;
                                            const date = bk.created_at ? new Date(bk.created_at).toLocaleString('es-CO', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'Fecha desconocida';

                                            return (
                                                <div 
                                                    key={bk.name}
                                                    className="flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/70 border border-border rounded-lg transition-colors gap-2"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-foreground truncate" title={bk.name}>
                                                            {bk.name}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {date} {sizeKb && `• ${sizeKb} KB`}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            onClick={() => handleRestoreCloud(bk.name)}
                                                            disabled={loadingData}
                                                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                                                        >
                                                            Restaurar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCloud(bk.name)}
                                                            disabled={loadingData}
                                                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
                                                            title="Eliminar de la nube"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: ARCHIVOS CMS (RED LOCAL / WINDOWS SCRIPT) */}
            {activeTab === "cms" && (
                <div className="space-y-6">
                    {/* Alerta si está corriendo en Vercel / Nube */}
                    {isCloudEnv ? (
                        <div className="bg-card border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 shadow-sm space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Server size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-foreground">
                                            Copia de Seguridad de Archivos CMS (Red Local)
                                        </h2>
                                        <span className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                            Requiere Máquina Local Windows
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                        Este módulo ejecuta un script en <strong>PowerShell</strong> con <strong>Robocopy</strong> que conecta directamente a la ruta de red de la oficina <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">\\192.168.2.61</code> y realiza copias de seguridad incrementales hacia la unidad física <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">F:\bksn</code> con protección activa contra ransomware.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-2">
                                <p className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                                    <Info size={16} />
                                    ¿Por qué no se puede ejecutar desde Vercel en la nube?
                                </p>
                                <p>
                                    Estás conectado a través de <strong>contable-pwa.vercel.app</strong>. Los servidores de Vercel están ubicados en la nube de internet y tienen el sistema de archivos protegido en modo solo lectura; no tienen acceso físico a los discos duros de tu oficina (<code className="font-mono">F:</code>) ni a tu red local privada (<code className="font-mono">192.168.2.61</code>).
                                </p>
                            </div>

                            <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-3">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Terminal size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    Cómo ejecutar esta copia en la oficina:
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Opción 1 (Doble clic - Más fácil):</strong> Ve a la carpeta del proyecto en el Explorador de Windows y haz doble clic sobre:
                                    </p>
                                    <div className="p-3 bg-muted/60 border border-border rounded-lg text-xs font-mono text-foreground font-semibold flex items-center gap-2">
                                        <span>📁 D:\contable-pwa\ejecutar_backup.bat</span>
                                    </div>

                                    <p className="text-xs text-muted-foreground pt-1">
                                        <strong>Opción 2 (Por consola PowerShell):</strong> Puedes pegar este comando en cualquier ventana de PowerShell:
                                    </p>
                                    <div className="flex items-center gap-2 bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs">
                                        <span className="flex-1 truncate">powershell -ExecutionPolicy Bypass -File "D:\contable-pwa\scripts\backup.ps1"</span>
                                        <button
                                            onClick={copyScriptCommand}
                                            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                                            title="Copiar comando"
                                        >
                                            {copiedScript ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-[11px] text-muted-foreground">
                                    💡 <em>Tip: Si abres la aplicación corriendo localmente en tu red (<code className="font-mono">http://localhost:3000</code>), podrás controlar este respaldo directamente con los botones de inicio, pausa y programador de tareas.</em>
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Controles interactivos cuando corre en Windows Local */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ESTADO Y CONTROL */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                                    <HardDrive size={18} className="text-indigo-600" />
                                    Estado del Backup CMS
                                </h2>
                                
                                <div className="mb-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-medium text-foreground">{progressText}</span>
                                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{pct}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-500 ${isPaused ? 'bg-yellow-500' : (pct === 100 && !isRunning ? 'bg-green-500' : 'bg-indigo-600')}`} 
                                            style={{ width: `${pct}%` }}
                                        ></div>
                                    </div>
                                    {status?.progress?.CurrentFolder && (
                                        <p className="text-xs text-gray-500 mt-2 truncate">
                                            Procesando: {status.progress.CurrentFolder}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {!isRunning ? (
                                        <button 
                                            onClick={() => handleCmsAction('start', { skipCanary, skipVolume })}
                                            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer"
                                        >
                                            <Play size={18} /> Iniciar Ahora
                                        </button>
                                    ) : (
                                        <>
                                            {isPaused ? (
                                                <button 
                                                    onClick={() => handleCmsAction('resume')}
                                                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer"
                                                >
                                                    <Play size={18} /> Reanudar
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleCmsAction('pause')}
                                                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer"
                                                >
                                                    <Pause size={18} /> Pausar
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => {
                                                    if(confirm("¿Estás seguro de que deseas cancelar y detener el backup actual?")) {
                                                        handleCmsAction('stop');
                                                    }
                                                }}
                                                className="flex-none flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer"
                                            >
                                                <Square size={18} /> Detener
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* OPCIONES DE SEGURIDAD */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4 text-foreground">Opciones de Seguridad</h2>
                                
                                <div className="space-y-4">
                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${!skipCanary ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/10' : 'border-border bg-card'}`}>
                                        <div className="flex-shrink-0 mt-0.5">
                                            <input 
                                                type="checkbox" 
                                                checked={!skipCanary} 
                                                onChange={(e) => setSkipCanary(!e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                disabled={isRunning}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground text-sm">Escaneo Anti-Ransomware</span>
                                                {!skipCanary ? <ShieldCheck size={16} className="text-green-600" /> : <ShieldAlert size={16} className="text-yellow-600" />}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Busca archivos bloqueados o notas de rescate antes de copiar para proteger el backup limpio.</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${!skipVolume ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/10' : 'border-border bg-card'}`}>
                                        <div className="flex-shrink-0 mt-0.5">
                                            <input 
                                                type="checkbox" 
                                                checked={!skipVolume} 
                                                onChange={(e) => setSkipVolume(!e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                disabled={isRunning}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground text-sm">Monitoreo de Volumen</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Detecta cambios bruscos en la cantidad de archivos (borrado masivo) respecto a la copia anterior.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* PROGRAMACIÓN */}
                            <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                        <Clock size={20} className="text-indigo-600 dark:text-indigo-400" /> 
                                        Programación Diaria
                                    </h2>
                                    
                                    {status?.scheduledTask?.status && status.scheduledTask.status !== 'N/A' && (
                                        <div className="text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 rounded-full flex items-center gap-2">
                                            <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                            </span>
                                            Próxima ejecución: {status.scheduledTask.nextRun}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-end gap-4">
                                    <div className="w-full sm:w-auto">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Hora de Ejecución (Diaria)
                                        </label>
                                        <input 
                                            type="time" 
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                            onClick={handleCmsSchedule}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors cursor-pointer"
                                        >
                                            <Save size={18} /> {scheduleTime ? 'Programar' : 'Eliminar'}
                                        </button>
                                    </div>
                                </div>
                                
                                <p className="text-xs text-gray-500 mt-4 flex items-start gap-1.5">
                                    <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                    Esta programación utiliza el Programador de Tareas de Windows. Requiere que este equipo esté encendido a la hora configurada.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
