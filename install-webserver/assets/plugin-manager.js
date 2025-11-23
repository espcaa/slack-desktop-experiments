(function () {
  // Prevent double-injection if the script runs twice
  if (document.getElementById("slackmod-overlay")) return;

  // --- CSS STYLES ---
  const style = document.createElement("style");
  style.textContent = `
    #slackmod-trigger {
      position: fixed;
      bottom: 20px;
      left: 80px; /* To the right of the sidebar */
      z-index: 9999;
      background: #1d1c1d;
      border: 1px solid #565656;
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-family: 'Slack-Lato', sans-serif;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      transition: all 0.2s;
    }
    #slackmod-trigger:hover { transform: translateY(-2px); border-color: #007a5a; }

    #slackmod-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 10000;
      justify-content: center;
      align-items: center;
    }
    #slackmod-modal {
      background: #1d1c1d;
      width: 500px;
      border-radius: 8px;
      border: 1px solid #565656;
      color: #d1d2d3;
      font-family: 'Slack-Lato', sans-serif;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .sm-header {
      padding: 16px;
      border-bottom: 1px solid #565656;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: bold;
    }
    .sm-body { padding: 16px; max-height: 60vh; overflow-y: auto; }
    .sm-plugin-item {
      background: #222529;
      border: 1px solid #565656;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .sm-plugin-name { font-weight: bold; color: #fff; }
    .sm-plugin-desc { font-size: 12px; color: #ababad; margin-top: 4px; }
    .sm-footer {
      padding: 16px;
      border-top: 1px solid #565656;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .sm-btn {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
    .sm-btn-close { background: transparent; color: #d1d2d3; border: 1px solid #565656; }
    .sm-btn-reload { background: #007a5a; color: white; }
    .sm-btn-reload:hover { background: #148567; }
  `;
  document.head.appendChild(style);

  // --- UI ELEMENTS ---

  // 1. The Trigger Button
  const btn = document.createElement("div");
  btn.id = "slackmod-trigger";
  btn.innerHTML = "⚙️ Mods";
  btn.onclick = toggleModal;
  document.body.appendChild(btn);

  // 2. The Modal Overlay
  const overlay = document.createElement("div");
  overlay.id = "slackmod-overlay";
  overlay.onclick = (e) => {
    if (e.target === overlay) toggleModal();
  };

  overlay.innerHTML = `
    <div id="slackmod-modal">
      <div class="sm-header">
        <span>Slack Plugin Manager</span>
        <span style="cursor:pointer" onclick="document.getElementById('slackmod-overlay').style.display='none'">✕</span>
      </div>
      <div class="sm-body" id="sm-plugin-list">
        </div>
      <div class="sm-footer">
        <button class="sm-btn sm-btn-close" onclick="document.getElementById('slackmod-overlay').style.display='none'">Close</button>
        <button class="sm-btn sm-btn-reload" onclick="window.location.reload()">Reload Slack</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // --- LOGIC ---

  function toggleModal() {
    const el = document.getElementById("slackmod-overlay");
    const listEl = document.getElementById("sm-plugin-list");

    if (el.style.display === "flex") {
      el.style.display = "none";
    } else {
      el.style.display = "flex";
      renderPlugins(listEl);
    }
  }

  function renderPlugins(container) {
    container.innerHTML = "";

    // Use the API we exposed in preload.js
    let plugins = [];
    try {
      if (window.slackmod_custom && window.slackmod_custom.getPluginList) {
        plugins = window.slackmod_custom.getPluginList();
      }
    } catch (e) {
      console.error("Error fetching plugins", e);
    }

    if (plugins.length === 0) {
      container.innerHTML =
        '<div style="text-align:center; color:#ababad">No plugins found.</div>';
      return;
    }

    plugins.forEach((p) => {
      const item = document.createElement("div");
      item.className = "sm-plugin-item";
      item.innerHTML = `
        <div class="sm-plugin-name">${p.manifest.name || p.id} <span style="font-size:10px; opacity:0.5">v${p.manifest.version || "1.0"}</span></div>
        <div class="sm-plugin-desc">${p.manifest.description || "No description provided."}</div>
      `;
      container.appendChild(item);
    });
  }

  console.log("[SlackMod] GUI loaded.");
})();
