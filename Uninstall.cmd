@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto use_python
py -3 install.py uninstall
goto finish
:use_python
python install.py uninstall
:finish
if errorlevel 1 echo Uninstall failed. Close Codex Doki and read the error above.
pause
