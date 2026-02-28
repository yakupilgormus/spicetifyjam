(function Jam() {
    const VERSION = "1.0.0-Bridge";
    if (!Spicetify.Player || !Spicetify.Platform || !Spicetify.Menu) {
        setTimeout(Jam, 1000);
        return;
    }

    let socket = null;
    let isRemoteUpdate = false;
    let myInfo = { name: "User", pfp: "" };
    let currentPeerId = "Not Connected";

    const style = document.createElement("style");
    style.innerHTML = `
        #jam-chat { position: fixed; right: 25px; bottom: 90px; width: 320px; height: 480px; background: #121212; border-radius: 8px; display: none; flex-direction: column; border: 1px solid #333; z-index: 9999; box-shadow: 0 12px 32px rgba(0,0,0,0.6); font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden; }
        #jam-chat-header { padding: 14px; background: #181818; font-weight: 700; color: #1DB954; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #282828; letter-spacing: 1px; font-size: 11px; }
        #jam-status-dot { width: 8px; height: 8px; background: #555; border-radius: 50%; display: inline-block; margin-right: 8px; }
        #jam-copy-id { cursor: pointer; background: #282828; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; margin-left: 10px; border: 1px solid #444; transition: 0.2s; }
        #jam-copy-id:hover { background: #1DB954; border-color: #1DB954; }
        #jam-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scrollbar-width: thin; scrollbar-color: #333 transparent; }
        .jam-msg { display: flex; align-items: flex-start; gap: 10px; color: #e1e1e1; font-size: 13px; animation: fadeIn 0.2s ease; }
        .jam-msg img { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: #282828; object-fit: cover; }
        .jam-msg b { color: #fff; display: block; font-size: 11px; margin-bottom: 2px; }
        #jam-input { background: #282828; border: none; padding: 16px; color: #fff; outline: none; border-top: 1px solid #333; font-size: 13px; }
        #jam-close { cursor: pointer; color: #555; font-size: 18px; line-height: 1; }
        #jam-close:hover { color: #fff; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    const chatContainer = document.createElement("div");
    chatContainer.id = "jam-chat";
    chatContainer.innerHTML = `
        <div id="jam-chat-header">
            <span style="display:flex; align-items:center;">
                <div id="jam-status-dot"></div>JAM v${VERSION}
                <button id="jam-copy-id">COPY ID</button>
            </span>
            <span id="jam-close">×</span>
        </div>
        <div id="jam-messages"></div>
        <input type="text" id="jam-input" placeholder="Send a message...">
    `;
    document.body.appendChild(chatContainer);

    const updateStatus = (color) => {
        const dot = document.getElementById("jam-status-dot");
        if (dot) dot.style.background = color;
    };

    const addMessage = (name, pfp, text) => {
        const msgDiv = document.createElement("div");
        msgDiv.className = "jam-msg";
        const img = pfp || 'https://www.scdn.co/mirror/static/images/profile-default.png';
        msgDiv.innerHTML = `<img src="${img}"><div><b>${name.toUpperCase()}</b><span>${text}</span></div>`;
        const box = document.getElementById("jam-messages");
        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;
    };

    const connectToBridge = async () => {
        try {
            const user = await Spicetify.Platform.UserAPI.getUser();
            myInfo = { 
                name: user.displayName || "Spotify User", 
                pfp: user.images && user.images.length > 0 ? user.images[0].url : "" 
            };
        } catch (e) { console.error(e); }

        socket = new WebSocket('ws://127.0.0.1:8080/jam');

        socket.onopen = () => {
            updateStatus("#1DB954");
            addMessage("SYSTEM", "", `Connected as ${myInfo.name}`);
            chatContainer.style.display = "flex";
            socket.send(JSON.stringify({ type: 'get_id' }));
        };

        socket.onclose = () => {
            updateStatus("#eb4034");
            addMessage("SYSTEM", "", "Bridge Disconnected.");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'id_res') {
                currentPeerId = data.id;
            } else if (data.type === 'chat') {
                if (data.name !== myInfo.name) addMessage(data.name, data.pfp, data.text);
            } else if (data.type === 'sync' && !isRemoteUpdate) {
                isRemoteUpdate = true;
                if (Spicetify.Player.data.track.uri !== data.uri) {
                    Spicetify.Player.playUri(data.uri, { SetPosition: data.pos * 1000 });
                } else if (Math.abs(Spicetify.Player.getProgress() - (data.pos * 1000)) > 2000) {
                    Spicetify.Player.seek(data.pos * 1000);
                }
                data.paused ? Spicetify.Player.pause() : Spicetify.Player.play();
                setTimeout(() => { isRemoteUpdate = false; }, 1000);
            }
        };
    };

    new Spicetify.Topbar.Button("Jam", "community-group", () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectToBridge();
        } else {
            chatContainer.style.display = chatContainer.style.display === "none" ? "flex" : "none";
        }
    }).register();

    document.getElementById("jam-copy-id").onclick = () => {
        navigator.clipboard.writeText(currentPeerId);
        Spicetify.showNotification("Jam ID copied to clipboard!");
    };

    document.getElementById("jam-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter" && e.target.value.trim()) {
            const val = e.target.value.trim();
            addMessage(myInfo.name, myInfo.pfp, val);
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'chat', name: myInfo.name, pfp: myInfo.pfp, text: val }));
            }
            e.target.value = "";
        }
    });

    document.getElementById("jam-close").onclick = () => chatContainer.style.display = "none";

    const syncPlayback = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN || isRemoteUpdate) return;
        socket.send(JSON.stringify({
            type: 'sync',
            uri: Spicetify.Player.data.track.uri,
            pos: Spicetify.Player.getProgress() / 1000,
            paused: !Spicetify.Player.isPlaying()
        }));
    };

    Spicetify.Player.addEventListener("onplaypause", syncPlayback);
    Spicetify.Player.addEventListener("songchange", syncPlayback);
})();
