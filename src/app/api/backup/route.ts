import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const isWindows = process.platform === 'win32';
const isCloud = !isWindows || !!process.env.VERCEL;

const SCRIPT_DIR = path.join(process.cwd(), 'scripts');
const SCRIPT_PATH = path.join(SCRIPT_DIR, 'backup.ps1');
const PAUSE_FLAG = path.join(SCRIPT_DIR, 'pause.flag');
const PROGRESS_FILE = path.join(SCRIPT_DIR, 'progress.json');

function safeUnlink(filePath: string) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (e) {
        console.warn(`Could not unlink ${filePath}:`, e);
    }
}

// Helper to check if a process is running
async function isScriptRunning() {
    if (!isWindows) return false;
    try {
        const { stdout } = await execAsync('wmic process where "name=\'powershell.exe\'" get commandline');
        return stdout.includes('backup.ps1');
    } catch {
        return false;
    }
}

export async function GET() {
    if (isCloud) {
        return NextResponse.json({
            isCloud: true,
            isSupported: false,
            isRunning: false,
            isPaused: false,
            progress: null,
            scheduledTask: null,
            message: 'El respaldo de archivos locales (CMS / Robocopy) requiere ejecutarse en un entorno local Windows.'
        });
    }

    const isRunning = await isScriptRunning();
    const isPaused = fs.existsSync(PAUSE_FLAG);
    
    let progress = null;
    if (fs.existsSync(PROGRESS_FILE)) {
        try {
            let data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.slice(1);
            }
            progress = JSON.parse(data);
        } catch {
            // ignore parse error
        }
    }

    // Check scheduled task
    let scheduledTask = null;
    try {
        const { stdout } = await execAsync('schtasks /Query /TN "ContableBackup" /FO CSV');
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
            const data = lines[1].split('","');
            scheduledTask = {
                nextRun: data[1]?.replace('"', '') || 'N/A',
                status: data[2]?.replace('"', '') || 'N/A'
            };
        }
    } catch {
        scheduledTask = null;
    }

    return NextResponse.json({
        isCloud: false,
        isSupported: true,
        isRunning,
        isPaused,
        progress,
        scheduledTask
    });
}

export async function POST(request: Request) {
    if (isCloud) {
        return NextResponse.json({ 
            error: 'El respaldo de archivos por PowerShell/Robocopy no se puede ejecutar en la nube (Vercel). Debe ejecutarse en la máquina local de la oficina con acceso a la red \\\\192.168.2.61.' 
        }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { action, options } = body;

        // Ensure script dir exists
        if (!fs.existsSync(SCRIPT_DIR)) {
            try {
                fs.mkdirSync(SCRIPT_DIR, { recursive: true });
            } catch {}
        }

        if (action === 'start') {
            if (await isScriptRunning()) {
                return NextResponse.json({ error: 'El backup ya está en ejecución' }, { status: 400 });
            }

            // Clean up old flags/files
            safeUnlink(PAUSE_FLAG);
            safeUnlink(PROGRESS_FILE);

            // Use 'start' to pop up a visible window.
            const cmd = `start powershell.exe -ExecutionPolicy Bypass -File "${SCRIPT_PATH}" ${options?.skipCanary ? '-SkipCanaryCheck' : ''} ${options?.skipVolume ? '-SkipVolumeCheck' : ''} -PauseFlagPath "${PAUSE_FLAG}" -ProgressFilePath "${PROGRESS_FILE}"`;
            
            exec(cmd, { cwd: SCRIPT_DIR }, (error) => {
                if (error) console.error("Error executing PowerShell:", error);
            });

            return NextResponse.json({ success: true, message: 'Backup iniciado' });
        }

        if (action === 'pause') {
            try {
                fs.writeFileSync(PAUSE_FLAG, 'paused');
            } catch (e: any) {
                return NextResponse.json({ error: 'No se pudo pausar: ' + e.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: 'Backup pausado' });
        }

        if (action === 'resume') {
            safeUnlink(PAUSE_FLAG);
            return NextResponse.json({ success: true, message: 'Backup reanudado' });
        }

        if (action === 'stop') {
            // Kill powershell and robocopy
            try {
                await execAsync('taskkill /F /IM robocopy.exe /T');
            } catch {}
            try {
                const { stdout } = await execAsync('wmic process where "name=\'powershell.exe\'" get processid,commandline');
                const lines = stdout.split('\n');
                for (const line of lines) {
                    if (line.includes('backup.ps1')) {
                        const match = line.match(/\s+(\d+)\s*$/);
                        if (match) {
                            await execAsync(`taskkill /F /PID ${match[1]} /T`);
                        }
                    }
                }
            } catch {}
            
            safeUnlink(PROGRESS_FILE);
            safeUnlink(PAUSE_FLAG);

            return NextResponse.json({ success: true, message: 'Backup detenido' });
        }

        if (action === 'schedule') {
            const { time } = options;
            if (!time) {
                try {
                    await execAsync('schtasks /Delete /TN "ContableBackup" /F');
                    return NextResponse.json({ success: true, message: 'Programación eliminada' });
                } catch {
                    return NextResponse.json({ success: true, message: 'No había programación activa' });
                }
            }

            const psCmd = `powershell.exe -ExecutionPolicy Bypass -File "${SCRIPT_PATH}" -ProgressFilePath "${PROGRESS_FILE}" -PauseFlagPath "${PAUSE_FLAG}"`;
            
            try {
                await execAsync(`schtasks /Create /TN "ContableBackup" /TR "${psCmd}" /SC DAILY /ST ${time} /F`);
                return NextResponse.json({ success: true, message: 'Backup programado' });
            } catch (error: any) {
                return NextResponse.json({ error: 'Error programando la tarea: ' + error.message }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
