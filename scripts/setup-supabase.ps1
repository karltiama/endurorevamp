# Supabase Setup Script for Windows
# This script helps set up Supabase CLI and link your project

Write-Host "🚀 Setting up Supabase CLI for Enduro Revamp" -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is already installed
try {
    $supabaseVersion = supabase --version 2>$null
    if ($supabaseVersion) {
        Write-Host "✅ Supabase CLI is already installed" -ForegroundColor Green
        Write-Host "Version: $supabaseVersion" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://github.com/supabase/cli/releases" -ForegroundColor Cyan
    Write-Host "2. Download: supabase_windows_amd64.exe" -ForegroundColor Cyan
    Write-Host "3. Add to your PATH or place in this project directory" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternative installation methods:" -ForegroundColor Yellow
    Write-Host "- Using Scoop: scoop install supabase" -ForegroundColor Cyan
    Write-Host "- Using Chocolatey: choco install supabase" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""

# Check if project is already linked
try {
    $projectInfo = supabase status 2>$null
    if ($projectInfo -and $projectInfo -match "Project ID:") {
        Write-Host "✅ Project is already linked" -ForegroundColor Green
        Write-Host $projectInfo -ForegroundColor Cyan
    } else {
        Write-Host "🔗 To link your Supabase project:" -ForegroundColor Yellow
        Write-Host "1. Go to your Supabase dashboard" -ForegroundColor Cyan
        Write-Host "2. Copy your project reference (found in Settings > General)" -ForegroundColor Cyan
        Write-Host "3. Run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Cyan
    }
} catch {
    Write-Host "🔗 To link your Supabase project:" -ForegroundColor Yellow
    Write-Host "1. Go to your Supabase dashboard" -ForegroundColor Cyan
    Write-Host "2. Copy your project reference (found in Settings > General)" -ForegroundColor Cyan
    Write-Host "3. Run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🔄 To start local development:" -ForegroundColor Yellow
Write-Host "supabase start" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 To create your first migration:" -ForegroundColor Yellow
Write-Host "supabase migration new initial_schema" -ForegroundColor Cyan
Write-Host ""

Write-Host "📖 For detailed instructions, see:" -ForegroundColor Yellow
Write-Host "docs/SUPABASE_DEVELOPMENT_WORKFLOW.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 Benefits of this setup:" -ForegroundColor Green
Write-Host "- Version-controlled database schema" -ForegroundColor White
Write-Host "- Local development environment" -ForegroundColor White
Write-Host "- Easy rollbacks and testing" -ForegroundColor White
Write-Host "- Professional deployment workflow" -ForegroundColor White
Write-Host ""

Write-Host "Setup complete! Happy coding!" -ForegroundColor Green 