@echo off 

echo Building...
echo.
for %%i in (*.ts) do (echo %%i & cmd /c tsc %%i)
for %%i in (models\*.ts) do (echo %%i & cmd /c tsc %%i)

@echo on