"use client";

import { useState, useEffect } from "react";
import { DatabaseBackup, Play, Pause, Square, Save, Clock, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

interface BackupStatus {
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
}

export default function BackupsPage() {
    const [status, setStatus] = useState<BackupStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [scheduleTime, setScheduleTime] = useState("");
    
    // Toggles
    const [skipCanary, setSkipCanary] = useState(false);
    const [skipVolume, setSkipVolume] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/backup');
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error("Error fetching backup status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (action: string, options?: any) => {
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
                fetchStatus();
            }
        } catch (error) {
            console.error(error);
            alert("Error ejecutando acción");
        }
    };

    const handleSchedule = () => {
        if (!scheduleTime) {
            if (confirm("¿Eliminar la programación actual?")) {
                handleAction('schedule', { time: "" });
            }
            return;
        }
        handleAction('schedule', { time: scheduleTime });
    };

    if (loading && !status) return <div className="p-8 text-center">Cargando...</div>;

    const isRunning = status?.isRunning;
    const isPaused = status?.isPaused;
    const pct = status?.progress?.Percent || 0;
    const progressText = status?.progress?.Status || (isRunning ? "Ejecutando..." : "Inactivo");

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <DatabaseBackup size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Copias de Seguridad (CMS)</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Gestiona y programa los respaldos de archivos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ESTADO Y CONTROL */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-foreground">Estado del Backup</h2>
                    
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
                                onClick={() => handleAction('start', { skipCanary, skipVolume })}
                                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                            >
                                <Play size={18} /> Iniciar Ahora
                            </button>
                        ) : (
                            <>
                                {isPaused ? (
                                    <button 
                                        onClick={() => handleAction('resume')}
                                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        <Play size={18} /> Reanudar
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleAction('pause')}
                                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        <Pause size={18} /> Pausar
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        if(confirm("¿Estás seguro de que deseas cancelar y detener el backup actual?")) {
                                            handleAction('stop');
                                        }
                                    }}
                                    className="flex-none flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 py-2 px-4 rounded-lg font-medium transition-colors"
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
                                    <span className="font-medium text-foreground">Escaneo Anti-Ransomware</span>
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
                                    <span className="font-medium text-foreground">Monitoreo de Volumen</span>
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
                                onClick={handleSchedule}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
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
        </div>
    );
}
