Write-Host "--- SpicetifyJam Installer ---" -ForegroundColor Cyan

# 1. Force Admin Check
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Please run PowerShell as Administrator!" -ForegroundColor Red
    exit
}

# 2. Install/Check Rust
if (!(Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Rust missing. Installing..."
    iwr -useb https://win.rustup.rs/ -OutFile rustup-init.exe
    .\rustup-init.exe -y --default-toolchain stable
    Remove-Item rustup-init.exe
    # Force refresh environment path so we can use 'cargo' immediately
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 3. Handle Spicetify
Write-Host "Updating Spicetify config..."
try {
    $spicetifyPath = spicetify config extension_path
    if ($null -eq $spicetifyPath) { throw "Spicetify not found" }
    
    Copy-Item "main/javascript/jam.js" "$spicetifyPath" -Force
    spicetify config extensions jam.js
    spicetify apply
} catch {
    Write-Host "Spicetify error: Make sure Spicetify is installed first!" -ForegroundColor Yellow
}

# 4. Build Bridge
Write-Host "Building Bridge..."
Set-Location "$PSScriptRoot\main\rust"
cargo build --release

Write-Host "--- INSTALL COMPLETE ---" -ForegroundColor Green
Start-Process "target\release\jam-bridge.exe"
Start-Process "spotify"
