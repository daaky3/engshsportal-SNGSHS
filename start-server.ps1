# Serwaah Portal - PWA Server Startup Script

Write-Host ""
Write-Host "======================================"
Write-Host "  Serwaah Portal - PWA Server"
Write-Host "======================================"
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion"
}
catch {
    Write-Host "❌ Node.js is not installed or not in PATH"
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Starting server..."
Write-Host ""

# Start the server in the current terminal (server will run and show logs)
# Press Ctrl+C in this terminal to stop the server
node server.js
