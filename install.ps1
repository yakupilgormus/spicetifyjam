Write-Host "Checking for Rust..."
if (!(Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Rust not found. Downloading installer..."
    iwr -useb https://win.rustup.rs/ -OutFile rustup-init.exe
    Write-Host "Starting Rust installation..."
    .\rustup-init.exe -y
    $env:Path += ";$env:USERPROFILE\.cargo\bin"
    Remove-Item rustup-init.exe
}

Write-Host "Locating Spicetify..."
$spicetifyPath = spicetify config extension_path
Write-Host "Copying Jam extension..."
Copy-Item "main/javascript/jam.js" "$spicetifyPath"

Write-Host "Enabling extension..."
spicetify config extensions jam.js
Write-Host "Applying changes to Spotify..."
spicetify apply

Write-Host "Building the Networking Bridge from main.rs..."
cd main/rust
cargo build --release

Clear-Host
Write-Host "INSTALL COMPLETE"
Write-Host "Launching Networking Bridge..."
Start-Process "target\release\jam-bridge.exe"

Write-Host "Launching Spotify..."
Start-Process "spotify"

Write-Host "-------------------------------------------"
Write-Host "Everything is running!"
Write-Host "Keep the Bridge window open to stay synced."
Write-Host "-------------------------------------------"
