import { NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const SCRIPT_DIR = path.join(process.cwd(), 'scripts');
const SCRIPT_PATH = path.join(SCRIPT_DIR, 'backup.ps1');
const PAUSE_FLAG = path.join(SCRIPT_DIR, 'pause.flag');
const PROGRESS_FILE = path.join(SCRIPT_DIR, 'progress.json');

// Helper to check if a process is running
async function isScriptRunning() {
    try {
        const { stdout } = await execAsync('wmic process where "name=\'powershell.exe\'" get commandline');
        return stdout.includes('backup.ps1');
    } catch {
        return false;
    }
}

export async function GET() {
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
        // Parse CSV roughly: "TaskName","Next Run Time","Status"
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
        isRunning,
        isPaused,
        progress,
        scheduledTask
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, options } = body;

        // Ensure script dir exists
        if (!fs.existsSync(SCRIPT_DIR)) {
            fs.mkdirSync(SCRIPT_DIR, { recursive: true });
        }

        if (action === 'start') {
            if (await isScriptRunning()) {
                return NextResponse.json({ error: 'El backup ya está en ejecución' }, { status: 400 });
            }

            // Clean up old flags/files
            if (fs.existsSync(PAUSE_FLAG)) fs.unlinkSync(PAUSE_FLAG);
            if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);

            let psArgs = ['-ExecutionPolicy', 'Bypass', '-File', SCRIPT_PATH];
            
            if (options?.skipCanary) psArgs.push('-SkipCanaryCheck');
            if (options?.skipVolume) psArgs.push('-SkipVolumeCheck');
            
            // Use 'start' without '/B' to pop up a visible window. Remove '-WindowStyle Hidden'.
            const cmd = `start powershell.exe -ExecutionPolicy Bypass -File "${SCRIPT_PATH}" ${options?.skipCanary ? '-SkipCanaryCheck' : ''} ${options?.skipVolume ? '-SkipVolumeCheck' : ''} -PauseFlagPath "${PAUSE_FLAG}" -ProgressFilePath "${PROGRESS_FILE}"`;
            
            exec(cmd, { cwd: SCRIPT_DIR }, (error) => {
                if (error) console.error("Error executing PowerShell:", error);
            });

            return NextResponse.json({ success: true, message: 'Backup iniciado' });
        }

        if (action === 'pause') {
            fs.writeFileSync(PAUSE_FLAG, 'paused');
            return NextResponse.json({ success: true, message: 'Backup pausado' });
        }

        if (action === 'resume') {
            if (fs.existsSync(PAUSE_FLAG)) {
                fs.unlinkSync(PAUSE_FLAG);
            }
            return NextResponse.json({ success: true, message: 'Backup reanudado' });
        }

        if (action === 'stop') {
            // Kill powershell and robocopy
            try {
                await execAsync('taskkill /F /IM robocopy.exe /T');
            } catch {} // ignore if not running
            try {
                // Find specific powershell process running backup.ps1
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
            
            if (fs.existsSync(PROGRESS_FILE)) {
                fs.unlinkSync(PROGRESS_FILE);
            }
            if (fs.existsSync(PAUSE_FLAG)) {
                fs.unlinkSync(PAUSE_FLAG);
            }

            return NextResponse.json({ success: true, message: 'Backup detenido' });
        }

        if (action === 'schedule') {
            const { time } = options; // time format "HH:mm"
            if (!time) {
                // Remove task if time is empty
                try {
                    await execAsync('schtasks /Delete /TN "ContableBackup" /F');
                    return NextResponse.json({ success: true, message: 'Programación eliminada' });
                } catch {
                    return NextResponse.json({ success: true, message: 'No había programación activa' });
                }
            }

            // Create or update task
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
