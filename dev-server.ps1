# Workaround for Turbopack Windows symlink issue
# This script runs Next.js dev server in compatibility mode

Write-Host "Starting Next.js dev server (Windows compatibility mode)..." -ForegroundColor Cyan

# Set environment variable to disable Turbopack
$env:NEXT_PRIVATE_DISABLE_TURBOPACK = "1"
$env:NODE_OPTIONS = "--no-warnings"

# Clean any existing locks
if (Test-Path ".next\dev\lock") {
    Remove-Item ".next\dev\lock" -Force -ErrorAction SilentlyContinue
}

# Start the dev server
npx next dev --port 3000
