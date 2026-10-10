@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 goto use_python
py -3 install.py install
goto finish
:use_python
python install.py install
:finish
if errorlevel 1 echo Installation failed. Read the error above and README.md.
pause
