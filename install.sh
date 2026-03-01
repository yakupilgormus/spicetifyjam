set -e

echo "Checking for Rust..."
if ! command -v cargo &> /dev/null; then
    echo "Rust not found. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

echo "Locating Spicetify..."
SPICETIFY_PATH=$(spicetify config extension_path)
if [ -z "$SPICETIFY_PATH" ]; then
    echo "Error: Spicetify not found."
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
./target/release/jam-bridge &

echo "Launching Spotify..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Spotify
else
    spotify &
fi

echo "Keep this terminal open to stay synced"
echo "-------------------------------------------"
