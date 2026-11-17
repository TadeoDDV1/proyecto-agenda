@echo off
REM ============================================================================
REM  Arranca la app y el bot de WhatsApp en desarrollo, sin comandos manuales.
REM  Doble clic a este archivo.
REM ============================================================================
setlocal
cd /d "%~dp0"

echo.
echo  AgendaSaaS - entorno de desarrollo
echo  -----------------------------------
echo   App:  http://localhost:3100
echo   Bot:  se abre en una ventana aparte
echo.
echo  Cierra las dos ventanas para detener todo.
echo.

start "AgendaSaaS - App (3100)" cmd /k "npm run dev -- --port 3100"
timeout /t 8 /nobreak >nul
start "AgendaSaaS - Bot WhatsApp" cmd /k "npm run bot"

endlocal
