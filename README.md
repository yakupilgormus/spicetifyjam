# spicetifyjam

**Real time P2P listening parties and chat for Spicetify. No premium or external servers required.**

---

## Quick Start

### 1. Requirements
You must have **Spicetify** installed. If you don't: [**Get Spicetify here**](https://spicetify.app/docs/getting-started)

### 2. Installation
Paste the command for your system into your terminal:
#### **Windows (PowerShell)**
```powershell
iwr "[https://raw.githubusercontent.com/yakupilgormus/spicetifyjam/main/jam.js](https://raw.githubusercontent.com/yakupilgormus/spicetifyjam/main/jam.js)" -OutFile "$env:APPDATA\spicetify\Extensions\jam.js"; spicetify config extensions jam.js; spicetify apply
```

### Linux/MacOS
```bash
curl -L "[https://raw.githubusercontent.com/yakupilgormus/spicetifyjam/main/jam.js](https://raw.githubusercontent.com/yakupilgormus/spicetifyjam/main/jam.js)" -o ~/.config/spicetify/Extensions/jam.js && spicetify config extensions jam.js && spicetify apply
```

## How to Use
Launch **Spotify** and click the **Jam** icon in the top bar.
- • **To Host:** Click **START SESSION**, copy your unique code, and send it to your friends.
- • **To Join:** Click **JOIN SESSION**, paste the host's code, and confirm.
- • **Chat:** A chat window will appear in the bottom right corner once the session begins.

## Privacy and Tech
Jam is built on **WebRTC**. All playback data and chat messages are sent directly between users.
- • Direct Sync: No data is ever stored on a central server.
- • Low Latency: **P2P** connections so that the plugin has fast synchronization.
- • Encrypted: Your listening sessions remain private to your group.

## Credit
This project is made possible by these open source tools.
- • [Spicetify](https://spicetify.app/): The framework for Spotify customization.
- • [PeerJS](https://peerjs.com/): The  engine for P2P data sync.

## License
Distributed under the **MIT License**. See the license file for details.


