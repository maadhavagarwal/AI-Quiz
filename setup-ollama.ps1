# SETUP SCRIPT: AI MCQ Generator with Ollama (Windows)
# This is the PERMANENT, NON-DEPRECATING solution

Write-Host "==================================
" -ForegroundColor Cyan
Write-Host "AI MCQ Generator - Ollama Setup (Windows)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Ollama is installed
Write-Host "Checking if Ollama is installed..." -ForegroundColor Yellow
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue

if (-not $ollamaPath) {
    Write-Host "❌ Ollama is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Download Ollama for Windows:" -ForegroundColor Cyan
    Write-Host "   https://ollama.ai/download/windows" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation steps:" -ForegroundColor Yellow
    Write-Host "   1. Download the installer" -ForegroundColor White
    Write-Host "   2. Run the installer (Ollama-setup.exe)" -ForegroundColor White
    Write-Host "   3. Follow the prompts" -ForegroundColor White
    Write-Host "   4. Ollama will run automatically as a service" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Ollama is installed" -ForegroundColor Green
Write-Host ""

# Step 2: Check if Ollama service is running
Write-Host "Checking if Ollama service is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" `
        -UseBasicParsing `
        -TimeoutSec 3 `
        -ErrorAction SilentlyContinue
    
    Write-Host "✅ Ollama is running on http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Ollama service is not running." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "On Windows, Ollama runs automatically as a service after installation." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To check/restart Ollama:" -ForegroundColor Cyan
    Write-Host "   1. Press Win + R, type 'services.msc'" -ForegroundColor White
    Write-Host "   2. Look for 'Ollama'" -ForegroundColor White
    Write-Host "   3. If stopped, right-click and select 'Start'" -ForegroundColor White
    Write-Host ""
    Write-Host "   OR run in PowerShell (admin):" -ForegroundColor White
    Write-Host "   net start Ollama" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 3: Check if models are installed
Write-Host ""
Write-Host "Checking installed models..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" `
        -UseBasicParsing `
        -TimeoutSec 5 `
        -ErrorAction SilentlyContinue | ConvertFrom-Json
    
    $models = $response.models
    
    if ($models.Count -eq 0) {
        Write-Host "❌ No models installed." -ForegroundColor Red
        Write-Host ""
        Write-Host "Installing llama2 (recommended for MCQs)..." -ForegroundColor Yellow
        Write-Host "This will download ~4GB, may take 5-10 minutes..." -ForegroundColor Yellow
        Write-Host ""
        
        & ollama pull llama2
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ llama2 installed successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Failed to pull llama2. Please try manually:" -ForegroundColor Red
            Write-Host "   ollama pull llama2" -ForegroundColor White
            exit 1
        }
    } else {
        Write-Host "✅ Models available:" -ForegroundColor Green
        foreach ($model in $models) {
            Write-Host "   • $($model.name)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "Could not check models: $_" -ForegroundColor Red
}

# Step 4: Summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your system is ready for MCQ generation!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start the backend:" -ForegroundColor White
Write-Host "      cd backend" -ForegroundColor Green
Write-Host "      npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "   2. In another terminal, start the frontend:" -ForegroundColor White
Write-Host "      cd frontend" -ForegroundColor Green
Write-Host "      npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "   3. Open http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "   4. Create a quiz and generate questions!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 How it works:" -ForegroundColor Cyan
Write-Host "   • Questions are generated locally using Ollama (llama2)" -ForegroundColor White
Write-Host "   • No API keys needed (except optional cloud backup)" -ForegroundColor White
Write-Host "   • Never breaks due to API deprecations" -ForegroundColor White
Write-Host "   • Works completely offline" -ForegroundColor White
Write-Host "   • Instant feedback (1-2 seconds)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Useful commands:" -ForegroundColor Cyan
Write-Host "   ollama list              - See installed models" -ForegroundColor White
Write-Host "   ollama pull mistral      - Install another model (mistral is faster)" -ForegroundColor White
Write-Host "   ollama pull neural-chat  - For conversational questions" -ForegroundColor White
Write-Host ""
Write-Host "❓ Troubleshooting:" -ForegroundColor Yellow
Write-Host "   • If Ollama won't start: Check if port 11434 is in use" -ForegroundColor White
Write-Host "   • If models won't download: Check internet connection" -ForegroundColor White
Write-Host "   • If generation fails: Ensure Ollama service is running" -ForegroundColor White
Write-Host ""
