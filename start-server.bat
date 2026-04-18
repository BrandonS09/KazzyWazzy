@echo off
REM Kill all Node.js processes
echo Stopping all Node.js processes...
FOR /F "tokens=5" %%A IN ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') DO taskkill /PID %%A /F
FOR /F "tokens=5" %%A IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO taskkill /PID %%A /F
FOR /F "tokens=5" %%A IN ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') DO taskkill /PID %%A /F
FOR /F "tokens=5" %%A IN ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') DO taskkill /PID %%A /F
FOR /F "tokens=5" %%A IN ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') DO taskkill /PID %%A /F

echo.
echo All Node processes stopped.
echo.
echo Starting server on port 8080...
npm start

pause
