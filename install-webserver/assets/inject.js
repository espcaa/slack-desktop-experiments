const fs = require("fs");
const path = require("path");
const os = require("os");
const { ipcMain } = electron_1;

const PLUGIN_BASE = path.join(os.homedir(), ".slack-plugin-thingy", "plugins");
const PRELOAD_PATH = path.join(
  os.homedir(),
  ".slack-plugin-thingy",
  "preload.js",
);

// Handler: Get list of plugins
ipcMain.on("SLACKMOD_GET_PLUGINS", (event) => {
  try {
    if (!fs.existsSync(PLUGIN_BASE)) {
      event.returnValue = [];
      return;
    }
    const folders = fs
      .readdirSync(PLUGIN_BASE, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const plugins = [];
    for (const folder of folders) {
      const manifestPath = path.join(PLUGIN_BASE, folder, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
          plugins.push({ id: folder, manifest });
        } catch (e) {
          console.error("Manifest Error", e);
        }
      }
    }
    event.returnValue = plugins;
  } catch (e) {
    console.error("Plugin List Error", e);
    event.returnValue = [];
  }
});

// Handler: Read a specific file (with security check)
ipcMain.on("SLACKMOD_READ_FILE", (event, { pluginId, filePath }) => {
  try {
    // If pluginId is null, we might be reading the manager/gui code
    const base = pluginId
      ? path.join(PLUGIN_BASE, pluginId)
      : path.join(os.homedir(), ".slack-plugin-thingy");
    const fullPath = path.join(base, filePath);

    // Security: Prevent escaping the directory (e.g. ../../etc/passwd)
    if (!fullPath.startsWith(base)) {
      console.error("Blocked illegal path access:", fullPath);
      event.returnValue = null;
      return;
    }

    if (fs.existsSync(fullPath)) {
      event.returnValue = fs.readFileSync(fullPath, "utf8");
    } else {
      event.returnValue = null;
    }
  } catch (e) {
    console.error("Read File Error", e);
    event.returnValue = null;
  }
});

electron_1.app.once("browser-window-created", (event, win) => {
  const preloads = win.webContents.session.getPreloads() || [];
  if (!preloads.includes(PRELOAD_PATH)) {
    win.webContents.session.setPreloads([...preloads, PRELOAD_PATH]);
    console.log("[SlackMod] Injected custom preload");
  }
});

require(process._archPath);
