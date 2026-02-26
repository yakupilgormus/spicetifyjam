(function Jam() {
    const VERSION = "1.0.0";
    if (!Spicetify.Player || !Spicetify.Platform || !Spicetify.PopupModal) {
        setTimeout(Jam, 1000);
        return;
    }

    let peer = null;
    let connections = [];
    let isRemoteUpdate = false;
    let isHost = false;
    let myInfo = { name: "Anonymous", pfp: "" };

    const script = document.createElement("script");
    script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
    document.head.appendChild(script);

    const style = document.createElement("style");
    style.innerHTML = `
        #jam-chat { position: fixed; right: 25px; bottom: 90px; width: 320px; height: 480px; background: #121212; border-radius: 8px; display: none; flex-direction: column; border: 1px solid #333; z-index: 9999; box-shadow: 0 12px 32px rgba(0,0,0,0.6); font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow: hidden; }
        #jam-chat-header { padding: 14px; background: #181818; font-weight: 700; color: #1DB954; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #282828; letter-spacing: 1px; font-size: 12px; }
        #jam-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scrollbar-width: thin; scrollbar-color: #333 transparent; }
        .jam-msg { display: flex; align-items: flex-start; gap: 10px; color: #e1e1e1; font-size: 13px; animation: fadeIn 0.2s ease; }
        .jam-msg img { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: #282828; }
        .jam-msg b { color: #fff; display: block; font-size: 11px; margin-bottom: 2px; }
        #jam-input { background: #282828; border: none; padding: 16px; color: #fff; outline: none; border-top: 1px solid #333; font-size: 13px; }
        #jam-input::placeholder { color: #777; }
        #jam-close { cursor: pointer; color: #555; font-size: 18px; line-height: 1; }
        #jam-close:hover { color: #fff; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    const chatContainer = document.createElement("div");
    chatContainer.id = "jam-chat";
    chatContainer.innerHTML = `
        <div id="jam-chat-header">JAM SESSION v${VERSION} <span id="jam-close">×</span></div>
        <div id="jam-messages"></div>
        <input type="text" id="jam-input" placeholder="Send a message...">
    `;
    document.body.appendChild(chatContainer);

    const addMessage = (name, pfp, text) => {
        const msgDiv = document.createElement("div");
        msgDiv.className = "jam-msg";
        const img = pfp || 'https://www.scdn.co/mirror/static/images/profile-default.png';
        msgDiv.innerHTML = `<img src="${img}"><div><b>${name.toUpperCase()}</b><span>${text}</span></div>`;
        const box = document.getElementById("jam-messages");
        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;
    };

    const handleData = (conn, data) => {
        if (data.type === 'chat') {
            addMessage(data.name, data.pfp, data.text);
        } else if (data.type === 'sync' && !isHost) {
            isRemoteUpdate = true;
            const latency = (Date.now() - data.time) / 1000;
            const correctedPos = data.pos + (data.paused ? 0 : latency);

            if (Spicetify.Player.data.track.uri !== data.uri) {
                Spicetify.Player.playUri(data.uri, { SetPosition: correctedPos * 1000 });
            } else if (Math.abs(Spicetify.Player.getProgress() - (correctedPos * 1000)) > 1500) {
                Spicetify.Player.seek(correctedPos * 1000);
            }
            
            data.paused ? Spicetify.Player.pause() : Spicetify.Player.play();
            setTimeout(() => { isRemoteUpdate = false; }, 800);
        }
    };

    const broadcast = (data) => {
        connections.forEach(c => {
            if (c.open) c.send(data);
        });
    };

    const initializeSession = async (role) => {
        peer = new Peer();
        const user = await Spicetify.Platform.UserAPI.getUser();
        myInfo = { name: user.displayName || "User", pfp: user.images[0]?.url || "" };

        if (role === 'host') {
            isHost = true;
            peer.on('open', id => {
                prompt("SHARE JAM CODE:", id);
                addMessage("SYSTEM", "", "Hosting active. Waiting for peers...");
            });
            peer.on('connection', conn => {
                connections.push(conn);
                conn.on('data', d => handleData(conn, d));
                Spicetify.showNotification("Peer connected to Jam.");
            });
        } else {
            isHost = false;
            const id = prompt("ENTER JAM CODE:");
            if (!id) return;
            const conn = peer.connect(id);
            connections = [conn];
            conn.on('data', d => handleData(conn, d));
            conn.on('open', () => addMessage("SYSTEM", "", "Connected to host. Syncing playback..."));
        }
        chatContainer.style.display = "flex";
    };

    new Spicetify.Topbar.Button("Jam", "community-group", () => {
        Spicetify.PopupModal.display({
            title: "Jam Session",
            content: `
                <div style="display:flex;flex-direction:column;gap:12px;padding:10px 20px 20px 20px;">
                    <button id="jam-host-init" style="background:#1DB954;color:#fff;padding:14px;border-radius:30px;font-weight:700;border:none;cursor:pointer;font-size:12px;">START SESSION (HOST)</button>
                    <button id="jam-join-init" style="background:#282828;color:#fff;padding:14px;border-radius:30px;font-weight:700;border:none;cursor:pointer;font-size:12px;">JOIN SESSION (GUEST)</button>
                </div>
            `
        });
        document.getElementById("jam-host-init").onclick = () => { initializeSession('host'); Spicetify.PopupModal.hide(); };
        document.getElementById("jam-join-init").onclick = () => { initializeSession('join'); Spicetify.PopupModal.hide(); };
    }).register();

    document.getElementById("jam-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter" && e.target.value.trim()) {
            const val = e.target.value.trim();
            addMessage(myInfo.name, myInfo.pfp, val);
            broadcast({ type: 'chat', name: myInfo.name, pfp: myInfo.pfp, text: val });
            e.target.value = "";
        }
    });

    document.getElementById("jam-close").onclick = () => chatContainer.style.display = "none";

    const syncPlayback = () => {
        if (!isHost || isRemoteUpdate || !connections.length) return;
        broadcast({
            type: 'sync',
            uri: Spicetify.Player.data.track.uri,
            pos: Spicetify.Player.getProgress() / 1000,
            paused: !Spicetify.Player.isPlaying(),
            time: Date.now()
        });
    };

    Spicetify.Player.addEventListener("songchange", syncPlayback);
    Spicetify.Player.addEventListener("onplaypause", syncPlayback);
    setInterval(() => {
        if (isHost && Spicetify.Player.isPlaying()) syncPlayback();
    }, 3000);
})();
