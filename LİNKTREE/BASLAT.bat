@echo off
title HeimerClean Signal Hub
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1"
if errorlevel 1 (
  echo.
  echo Bir hata olustu. Yukaridaki mesaji kontrol edin.
  pause
)
