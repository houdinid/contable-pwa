<#
.SYNOPSIS
    Script de copia de seguridad automatizada incremental para recursos CMS,
    con protecciones activas contra ransomware.
#>

[CmdletBinding()]
param (
    [string]$ServerIp          = "192.168.2.61",
    [string]$DriveLetter       = "F:",
    [string]$BaseFolder        = "bksn",

    [int]$RetentionDays        = 30,
    [int]$MaxChangePercent     = 40,

    [string[]]$SuspiciousExtensions = @(
        "*.encrypted", "*.locked", "*.crypt", "*.crypted", "*.cerber",
        "*.locky", "*.zzz", "*.micro", "*.enc", "*.ryk", "*.ryuk",
        "*_HOW_TO_DECRYPT*", "*README_TO_DECRYPT*", "*DECRYPT_INSTRUCTIONS*",
        "*RECOVER_FILES*"
    ),

    [switch]$LockBackupACL,
    [switch]$EjectDiskAfterBackup,
    
    # Custom params for PWA integration
    [switch]$SkipCanaryCheck,
    [switch]$SkipVolumeCheck,
    [string]$PauseFlagPath = "pause.flag",
    [string]$ProgressFilePath = "progress.json"
)

# -----------------------------------------
# 0. UTILIDADES
# -----------------------------------------
$IsInteractive = [Environment]::UserInteractive

function Write-ProgressFile {
    param([string]$Status, [int]$Percent, [string]$CurrentFolder = "")
    $data = @{
        Status = $Status
        Percent = $Percent
        CurrentFolder = $CurrentFolder
        Timestamp = (Get-Date -Format "o")
    }
    $data | ConvertTo-Json -Compress | Out-File -FilePath $ProgressFilePath -Encoding utf8 -Force
}

function Check-Pause {
    while (Test-Path -Path $PauseFlagPath) {
        Write-ProgressFile -Status "PAUSADO" -Percent 0
        Start-Sleep -Seconds 5
    }
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO","WARN","ERROR","CRITICAL")][string]$Level = "INFO"
    )
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    if ($LogFile) {
        $line | Out-File -FilePath $LogFile -Encoding utf8 -Append
    }
}

# -----------------------------------------
# 1. CONFIGURACIÓN DE RUTAS Y FECHAS
# -----------------------------------------
$CurrentDate      = Get-Date -Format "yyyy-MM-dd"
$CurrentTime      = Get-Date -Format "HHmm"

$Origin           = "\\$ServerIp"
$DestinationBase  = Join-Path -Path $DriveLetter -ChildPath $BaseFolder
$DestinationToday = Join-Path -Path $DestinationBase -ChildPath $CurrentDate

$LogDir           = Join-Path -Path $DestinationBase -ChildPath "Logs"
$LogFile          = Join-Path -Path $LogDir -ChildPath "backup_${CurrentDate}_${CurrentTime}.txt"

if (-not (Test-Path -Path $LogDir)) {
    New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
}

Write-ProgressFile -Status "INICIANDO" -Percent 0

# -----------------------------------------
# 2. VERIFICACIONES PREVIAS
# -----------------------------------------
Write-Log "Verificando conectividad con $ServerIp..."
Check-Pause

if (-not (Test-Connection -ComputerName $ServerIp -Count 1 -Quiet)) {
    Write-Log "No hay conexión con el servidor $ServerIp" "ERROR"
    Write-ProgressFile -Status "ERROR: Sin conexión a $ServerIp" -Percent 0
    exit 1
}

if (-not (Test-Path -Path "$DriveLetter\")) {
    Write-Log "No se encuentra la unidad $DriveLetter o está desconectada." "ERROR"
    Write-ProgressFile -Status "ERROR: Unidad destino $DriveLetter no encontrada" -Percent 0
    exit 1
}

if (-not (Test-Path -Path $DestinationToday)) {
    New-Item -Path $DestinationToday -ItemType Directory -Force | Out-Null
}

# -----------------------------------------
# 3. LISTADO DE CARPETAS Y EXCLUSIONES
# -----------------------------------------
$FoldersToBackup = @(
    "7a", "3b3", "4cv2", "4d", "4dr3", "adjuntos_web", "c0nf4r", "c3", "d",
    "ig", "l4", "lg1", "n1", "pr2", "psc", "qo", "r3c", "r4h", "s34",
    "sp", "t0", "t33", "tc0n", "w1", "web", "j3", "j3v", "pr", "rh", "tf4c"
)

$ExcludeDirNames = @("lg")
$ExcludeFullPath = "$Origin\7a\4L\prosoft 17072024\PROSOFT\MANAGER\Actualizaciones"
$AllExclusions   = $ExcludeDirNames + @($ExcludeFullPath)

# -----------------------------------------
# 4. CANARIO ANTI-RANSOMWARE
# -----------------------------------------
if (-not $SkipCanaryCheck) {
    Write-Log "Escaneando origen en busca de indicios de ransomware..."
    Write-ProgressFile -Status "Analizando Canarios (Anti-Ransomware)" -Percent 10
    $ransomHits = @()
    $totalFolders = $FoldersToBackup.Count
    $folderIndex = 0

    foreach ($folder in $FoldersToBackup) {
        Check-Pause
        $folderIndex++
        $sourcePath = "$Origin\$folder"

        Write-Log "  [$folderIndex/$totalFolders] Escaneando '$folder'..."

        if (-not (Test-Path -Path $sourcePath)) {
            continue
        }

        try {
            Get-ChildItem -Path $sourcePath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
                $file = $_
                if ($file.FullName -like "$ExcludeFullPath*") { return }

                $isExcludedDir = $false
                foreach ($dirName in $ExcludeDirNames) {
                    if ($file.FullName -match "\\$dirName\\") { $isExcludedDir = $true; break }
                }
                if ($isExcludedDir) { return }

                foreach ($pattern in $SuspiciousExtensions) {
                    if ($file.Name -like $pattern) {
                        $ransomHits += $file.FullName
                        break
                    }
                }
            }
        } catch {}
    }

    if ($ransomHits.Count -gt 0) {
        $msg = "POSIBLE RANSOMWARE DETECTADO en el origen."
        Write-Log $msg "CRITICAL"
        Write-ProgressFile -Status "ERROR: RANSOMWARE DETECTADO" -Percent 0
        exit 2
    }
} else {
    Write-Log "Escaneo de canarios omitido por el usuario." "WARN"
}

# -----------------------------------------
# 5. DETECCIÓN DE CAMBIOS ANÓMALOS EN VOLUMEN
# -----------------------------------------
if (-not $SkipVolumeCheck) {
    function Get-PreviousBackupFolder {
        if (-not (Test-Path $DestinationBase)) { return $null }
        Get-ChildItem -Path $DestinationBase -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}$' -and $_.Name -ne $CurrentDate } |
            Sort-Object Name -Descending |
            Select-Object -First 1
    }

    $PreviousBackup = Get-PreviousBackupFolder
    if ($PreviousBackup) {
        Write-ProgressFile -Status "Comparando volumen de archivos" -Percent 20
        Check-Pause
        try {
            Write-Log "Contando archivos del backup anterior..."
            $prevCount = (Get-ChildItem -Path $PreviousBackup.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count

            $srcCount  = 0
            foreach ($folder in $FoldersToBackup) {
                $p = "$Origin\$folder"
                if (Test-Path $p) {
                    $srcCount += (Get-ChildItem -Path $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
                }
            }

            if ($prevCount -gt 0) {
                $changePct = [Math]::Abs($srcCount - $prevCount) / $prevCount * 100
                Write-Log "Archivos origen: $srcCount | Backup anterior: $prevCount | Variación: $([Math]::Round($changePct,1))%"

                if ($changePct -ge $MaxChangePercent) {
                    $msg = "Variación de archivos del $([Math]::Round($changePct,1))% respecto al backup anterior."
                    Write-Log $msg "WARN"
                }
            }
        } catch {}
    }
} else {
    Write-Log "Control de volumen de cambios omitido por el usuario." "WARN"
}

# -----------------------------------------
# 6. EJECUCIÓN DEL RESPALDO
# -----------------------------------------
$startMsg = "Iniciando copia incremental CMS a $DestinationToday"
Write-Log $startMsg

$XfArgs = @()
foreach ($p in $SuspiciousExtensions) { $XfArgs += @("/XF", $p) }

$failedFolders = @()
$totalFolders2 = $FoldersToBackup.Count
$idx2 = 0

foreach ($folder in $FoldersToBackup) {
    Check-Pause
    $idx2++
    $sourcePath = "$Origin\$folder"
    $targetPath = "$DestinationToday\$folder"

    $pct = 20 + [math]::Round(($idx2 / $totalFolders2) * 70)
    Write-ProgressFile -Status "Copiando" -Percent $pct -CurrentFolder $folder

    Write-Log "Procesando carpeta: $folder..."

    if (-not (Test-Path -Path $sourcePath)) {
        continue
    }

    $robocopyArgs = @(
        $sourcePath,
        $targetPath,
        "/E",
        "/Z",
        "/R:1",
        "/W:1",
        "/MT:8",
        "/V",
        "/TEE",
        "/LOG+:$LogFile"
    ) + $XfArgs + @("/XD") + $AllExclusions

    try {
        & robocopy.exe @robocopyArgs
        if ($LASTEXITCODE -ge 8) {
            Write-Log "ERROR al respaldar carpeta '$folder' (Código Robocopy: $LASTEXITCODE)" "ERROR"
            $failedFolders += $folder
        }
    } catch {
        Write-Log "Excepción copiando '$folder': $($_.Exception.Message)" "ERROR"
        $failedFolders += $folder
    }
}

# -----------------------------------------
# 7. PROTECCIÓN DEL BACKUP (INMUTABILIDAD BÁSICA)
# -----------------------------------------
if ($LockBackupACL) {
    Check-Pause
    Write-ProgressFile -Status "Aplicando protección ACL" -Percent 95
    try {
        Write-Log "Aplicando protección de solo lectura al backup de hoy..."
        attrib.exe +R "$DestinationToday\*.*" /S /D | Out-Null
        icacls.exe "$DestinationToday" /inheritance:e /deny "Users:(OI)(CI)(DE,DC,WD)" /T /C | Out-Null
        Write-Log "Backup de hoy protegido."
    } catch {
        Write-Log "No se pudo aplicar la protección ACL." "WARN"
    }
}

# -----------------------------------------
# 8. RETENCIÓN
# -----------------------------------------
Check-Pause
Write-ProgressFile -Status "Limpiando backups antiguos" -Percent 98
try {
    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $DestinationBase -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}$' } |
        ForEach-Object {
            $folderDate = [DateTime]::ParseExact($_.Name, "yyyy-MM-dd", $null)
            if ($folderDate -lt $cutoff) {
                Write-Log "Purgando backup antiguo: $($_.FullName)"
                icacls.exe $_.FullName /reset /T /C | Out-Null
                attrib.exe -R "$($_.FullName)\*.*" /S /D | Out-Null
                Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction Stop
            }
        }
} catch {}

# -----------------------------------------
# 10. FINALIZACIÓN
# -----------------------------------------
if ($failedFolders.Count -gt 0) {
    Write-ProgressFile -Status "FINALIZADO CON ERRORES" -Percent 100
} else {
    Write-ProgressFile -Status "COMPLETADO" -Percent 100
}

Start-Sleep -Seconds 2 # Allow API to read final status
Remove-Item -Path $ProgressFilePath -ErrorAction SilentlyContinue
