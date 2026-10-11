const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  startProcessing: (params) => ipcRenderer.send("start-processing", params),

  onGenerateData: (callback) => {
    ipcRenderer.on('generate-data', (_event, params) => callback(params));
  },

  writeToClipboard: (text) => {
    try {
      if (clipboard) clipboard.writeText(text);
    } catch (e) {
      console.warn("Резервний варіант clipboard", e);
    }
  },

  notifyCopiedToClipboard: (payload) => ipcRenderer.send('data-copied-to-clipboard', payload),

  onReadClipboardAndDraw: (callback) => {
    ipcRenderer.on('read-clipboard-and-draw', (_event, vector) => callback(vector));
  },

  readFromClipboard: () => {
    try {
      return clipboard ? clipboard.readText() : "";
    } catch (e) {
      return "";
    }
  },

  notifyReady: (component) => ipcRenderer.send('component-ready', component)
});