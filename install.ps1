$ErrorActionPreference = "Stop"

Write-Host "Checking for Rust..."
if (!(Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Rust not found. Downloading installer..."
    Invoke-WebRequest -Uri "https://win.rustup.rs/" -OutFile "rustup-init.exe"
    Write-Host "Starting Rust installation..."
    .\rustup-init.exe -y --default-toolchain stable
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Remove-Item "rustup-init.exe"
}

Write-Host "Locating Spicetify..."
$spicetifyPath = spicetify config extension_path
if (!$spicetifyPath) {
    Write-Host "Error: Spicetify not found. Please install Spicetify first."
    exit
}

Write-Host "Copying Jam extension..."
Copy-Item "main/javascript/jam.js" "$spicetifyPath" -Force

Write-Host "Enabling extension..."
spicetify config extensions jam.js
Write-Host "Applying changes to Spotify..."
spicetify apply

Write-Host "Building the Networking Bridge..."
Set-Location "$PSScriptRoot\main\rust"
cargo build --release

Clear-Host
Write-Host "-------------------------------------------"
Write-Host "INSTALL COMPLETE"
Write-Host "Launching Networking Bridge..."
Start-Process "target\release\jam-bridge.exe"

Write-Host "Launching Spotify..."
Start-Process "spotify"

Write-Host "Keep the Bridge window open to stay synced"
Write-Host "-------------------------------------------"
