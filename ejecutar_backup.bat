@echo off
title Copia de Seguridad CMS (Robocopy)
cd /d "%~dp0"
echo ======================================================================
echo    INICIANDO COPIA DE SEGURIDAD CMS (Robocopy)
echo    Servidor Origen: \\192.168.2.61
echo    Destino: F:\bksn
echo ======================================================================
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\backup.ps1"
echo.
echo Presione cualquier tecla para cerrar esta ventana...
pause >nul
