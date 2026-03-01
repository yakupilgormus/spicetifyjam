#!/bin/bash
set -e

echo "Checking for Rust..."
if ! command -v cargo &> /dev/null; then
    echo "Rust not found. Installing via rustup..."
    # Downloads and runs the official Rust installer in "silent" mode (-y)
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    # This line refreshes the current shell session so 'cargo' works immediately
    source $HOME/.cargo/env
    echo "Rust installed successfully."
else
    echo "Rust is already installed."
fi

echo "Locating Spicetify..."
# This command finds the Spicetify folder automatically
SPICETIFY_PATH=$(spicetify config extension_path)
if [ -z "$SPICETIFY_PATH" ]; then
    echo "Error: Spicetify not found. Please install Spicetify-cli first."
    exit 1
fi

echo "Copying Jam extension..."
cp "main/javascript/jam.js" "$SPICETIFY_PATH/"

echo "Enabling extension..."
spicetify config extensions jam.js
spicetify apply

echo "Building the Networking Bridge..."
cd main/rust
cargo build --release

echo "-------------------------------------------"
echo "INSTALL COMPLETE"
echo "Launching Networking Bridge..."
# The '&' runs the bridge in the background so the script can continue
./target/release/jam-bridge &

echo "Launching Spotify..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS command
    open -a Spotify
else
    # Linux command (works for most distros)
    spotify &
fi

echo "Keep this terminal open to stay synced"
echo "-------------------------------------------"
