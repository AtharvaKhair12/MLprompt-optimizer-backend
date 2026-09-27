# PowerShell startup script for AI Prompt Evaluator & Optimizer
# Run from: PromptOptimizerML\ root directory
# Usage: .\start.ps1

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  AI PROMPT EVALUATOR & OPTIMIZER - Startup Script" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot

# -- Step 1: Setup Python venv -------------------------------------------------
Write-Host "[1/5] Setting up Python virtual environment..." -ForegroundColor Yellow
$venvPath = Join-Path $rootDir "backend\venv"
if (-not (Test-Path $venvPath)) {
    python -m venv $venvPath
    Write-Host "      Created venv at $venvPath" -ForegroundColor Green
} else {
    Write-Host "      venv already exists, skipping creation." -ForegroundColor Gray
}

# Activate venv
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
& $activateScript

# -- Step 2: Install Python deps -----------------------------------------------
Write-Host ""
Write-Host "[2/5] Installing Python dependencies..." -ForegroundColor Yellow
pip install -r (Join-Path $rootDir "backend\requirements.txt") --quiet
Write-Host "      Python dependencies installed." -ForegroundColor Green

# -- Step 3: Run training pipeline --------------------------------------------
$artifactPath = Join-Path $rootDir "backend\artifacts\report.json"
Write-Host ""
if (-not (Test-Path $artifactPath)) {
    Write-Host "[3/5] Running ML training pipeline (first-time setup)..." -ForegroundColor Yellow
    Write-Host "      This will take ~2-5 minutes to download the embedding model and train." -ForegroundColor Gray
    python (Join-Path $rootDir "backend\train_pipeline.py")
    Write-Host "      Training complete!" -ForegroundColor Green
} else {
    Write-Host "[3/5] Training artifacts found - skipping retraining." -ForegroundColor Gray
    Write-Host "      Delete backend\artifacts\ to force retrain." -ForegroundColor Gray
}

# -- Step 4: Install frontend deps --------------------------------------------
Write-Host ""
Write-Host "[4/5] Installing frontend npm packages..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "frontend")
npm install --silent
Pop-Location
Write-Host "      npm packages installed." -ForegroundColor Green

# -- Step 5: Start both servers -----------------------------------------------
Write-Host ""
Write-Host "[5/5] Starting servers..." -ForegroundColor Yellow
Write-Host "      Backend  -> http://localhost:8000" -ForegroundColor Cyan
Write-Host "      Frontend -> http://localhost:5173" -ForegroundColor Cyan
Write-Host "      API Docs -> http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C in each terminal to stop." -ForegroundColor Gray
Write-Host ""

# Start backend in a new terminal window
$backendCmd = "cd '$rootDir\backend'; & '$venvPath\Scripts\python.exe' -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Start frontend in a new terminal window
$frontendCmd = "cd '$rootDir\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "Both servers are starting in separate windows." -ForegroundColor Green
Write-Host "Open http://localhost:5173 in your browser." -ForegroundColor Cyan
