const { contextBridge, ipcRenderer } = require("electron");

// Helper to ask Main Process for data synchronously
// We use Sync because your plugin loader relies on require(), which is synchronous
const getPluginList = () => {
  return ipcRenderer.sendSync("SLACKMOD_GET_PLUGINS");
};

const getPluginFile = (pluginId, filePath) => {
  return ipcRenderer.sendSync("SLACKMOD_READ_FILE", { pluginId, filePath });
};

// Expose API to the web page (if needed)
contextBridge.exposeInMainWorld("slackmod_custom", {
  getPluginList,
  getPluginFile,
});

window.addEventListener("DOMContentLoaded", () => {
  console.log("[SlackMod] Preload loaded. Initializing plugins...");

  // 1. Load the Plugin Manager GUI (if it exists in root .slack-plugin-thingy)
  // Passing null as pluginId to indicate root folder access
  const guiCode = getPluginFile(null, "plugin-manager.js");
  if (guiCode) {
    try {
      (0, eval)(guiCode);
    } catch (e) {
      console.error("GUI Init Error", e);
    }
  }

  // 2. Load Plugins
  const plugins = getPluginList();
  console.log(`[SlackMod] Found ${plugins.length} plugins.`);

  plugins.forEach((plugin) => {
    const entryFile = plugin.manifest.entry || "index.js";
    const code = getPluginFile(plugin.id, entryFile);

    if (!code) return;

    const module = { exports: {} };

    // Custom require function for inside the plugin
    const localRequire = (relPath) => {
      const fileCode = getPluginFile(plugin.id, relPath);
      if (!fileCode) {
        console.error(
          `Cannot find module '${relPath}' in plugin '${plugin.id}'`,
        );
        return null;
      }
      const mod = { exports: {} };
      try {
        new Function("require", "module", "exports", fileCode)(
          localRequire,
          mod,
          mod.exports,
        );
      } catch (err) {
        console.error(`Error requiring ${relPath}:`, err);
      }
      return mod.exports;
    };

    try {
      new Function("require", "module", "exports", code)(
        localRequire,
        module,
        module.exports,
      );

      // Run lifecycle
      if (module.exports && typeof module.exports.onStart === "function") {
        module.exports.onStart();
      }
      console.log(`[SlackMod] Loaded: ${plugin.id}`);
    } catch (err) {
      console.error(`[SlackMod] Failed to load ${plugin.id}:`, err);
    }
  });
});
