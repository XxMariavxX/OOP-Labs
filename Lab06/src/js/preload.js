const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  startProcessing: (params) => ipcRenderer.send("start-processing", params),

  onGenerateData: (callback) => {
    ipcRenderer.on('generate-data', (_event, params) => callback(params));
  },

  writeToClipboard: (text) => clipboard.writeText(text),

  notifyCopiedToClipboard: () => ipcRenderer.send('data-copied-to-clipboard'),

  onReadClipboardAndDraw: (callback) => {
    ipcRenderer.on('read-clipboard-and-draw', () => callback());
  },

  readFromClipboard: () => clipboard.readText(),

  notifyReady: () => ipcRenderer.send('notify-ready')
});