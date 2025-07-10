# SQL Files Cleanup Script
# Run this to remove historical debugging/fix files that are no longer needed

Write-Host "🧹 Cleaning up historical SQL files..." -ForegroundColor Green

# Create backup directory first (just in case)
$backupDir = "sql-backup-$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "📦 Created backup directory: $backupDir" -ForegroundColor Yellow

# Files to keep (will NOT be deleted)
$keepFiles = @(
    "sql\actual-database-schema.sql",
    "sql\onboarding_goals.sql", 
    "sql\core-data-validator.sql",
    "supabase\sql\calculate-weekly-metrics.sql"
)

Write-Host "✅ Keeping these essential files:" -ForegroundColor Green
$keepFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }

# Move historical files to backup
$filesToCleanup = @(
    # Security fixes (applied already)
    "sql\fix-security-issues.sql",
    "sql\simple-security-fix.sql", 
    "sql\test-security-fixes.sql",
    "supabase\sql\fix-all-function-security.sql",
    "supabase\sql\fix-all-function-security-safe.sql",
    
    # Schema/constraint fixes (applied already) 
    "sql\fix_unique_constraint.sql",
    "sql\fix_sync_state_schema.sql",
    "sql\fix_pace_function.sql",
    "sql\fix_pace_function_clean.sql",
    
    # Debugging files
    "sql\simple-schema-check.sql",
    "sql\get-current-schema.sql", 
    "sql\DEBUG_SCHEMA_CHECK.sql",
    "sql\delete-user-preferences-table.sql",
    
    # Legacy setup
    "sql\setup_database.sql",
    
    # Weekly metrics duplicates
    "supabase\sql\fix-calculate-weekly-metrics.sql",
    "supabase\sql\safe-calculate-weekly-metrics.sql",
    "supabase\sql\secure-calculate-weekly-metrics.sql", 
    "supabase\sql\create-calculate-weekly-metrics.sql",
    
    # Misc cleanup
    "sql\database-schematoday.sql",
    "supabase\sql\fix-type-mismatch.sql",
    "supabase\sql\check-table-structure.sql"
)

Write-Host "🗑️  Moving these files to backup:" -ForegroundColor Yellow

$movedCount = 0
foreach ($file in $filesToCleanup) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Move-Item $file "$backupDir\$fileName" -Force
        Write-Host "   ✓ Moved: $file" -ForegroundColor Gray
        $movedCount++
    } else {
        Write-Host "   - Not found: $file" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "🎉 Cleanup complete!" -ForegroundColor Green
Write-Host "   📦 Moved $movedCount files to: $backupDir" -ForegroundColor Yellow
Write-Host "   ✅ Kept essential reference files in place" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Your sql/ directory is now clean and organized!" -ForegroundColor Cyan
Write-Host "   If you need any backed up files, check: $backupDir" -ForegroundColor Gray 