# --- Cyber Shield GitHub Sync Automation ---
# This script will clean your old git history and push everything to your new repository.

Write-Host "🚀 Starting GitHub Sync for Cyber Shield..." -ForegroundColor Cyan

# 1. Validation: Is Git installed?
$gitEx = "C:\Program Files\Git\cmd\git.exe"
if (!(Test-Path $gitEx)) {
    Write-Host "❌ Error: Git was not found at $gitEx" -ForegroundColor Red
    exit
}

# Helper to run git
function run-git { & $gitEx $args }

# 2. Cleanup: Remove old git folders to merge everything into one project
Write-Host "🧹 Cleaning up old repository markers..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter ".git" -Recurse -Hidden | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 3. Initialization: Start fresh
Write-Host "📂 Initializing new repository..." -ForegroundColor Yellow
run-git init
run-git checkout -b main

# 4. Configuration: Setup remote & Identity
Write-Host "🔧 Configuring Git identity..." -ForegroundColor Yellow
run-git config user.name "Vamsi Krishna"
run-git config user.email "cheedivamsi73@gmail.com"

$repoUrl = "https://github.com/He110-12/scam-detection.git"
run-git remote add origin $repoUrl

# 5. Staging: Add all project files
Write-Host "📦 Staging files (this may take a minute)..." -ForegroundColor Yellow
run-git add .

# 6. Commit: Initial state
Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow
run-git commit -m 'Initial commit: Universal Repo Migration (Frontend + Backend)'

# 7. Push: Send to GitHub
Write-Host "📤 Pushing to GitHub (Main Branch)..." -ForegroundColor Cyan
run-git push -u origin main -f

Write-Host "✅ DONE! Your code is now live at: $repoUrl" -ForegroundColor Green
Write-Host "💡 Note: You may be prompted for your GitHub Credentials."
