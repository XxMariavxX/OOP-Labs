import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Lab6Manager {
  constructor() {
    this.winObj1 = null;
    this.winObj2 = null;
    this.winObj3 = null;

    this.initApp();
  }

  initApp() {
    app.whenReady().then(() => {
      this.createWindows();
      this.setupListeners();
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindows();
      }
    });
  }

  createWindows() {
    this.winObj1 = new BrowserWindow({
      width: 500,
      height: 500,
      webPreferences: {
        preload: path.join(__dirname, "js", "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.winObj2 = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        preload: path.join(__dirname, "js", "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.winObj3 = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "js", "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.winObj1.loadFile(path.join(__dirname, "html", "indexObj1.html"));
    this.winObj2.loadFile(path.join(__dirname, "html", "indexObj2.html"));
    this.winObj3.loadFile(path.join(__dirname, "html", "indexObj3.html"));

    if (this.winObj1) {
  this.winObj1.focus();
}
  }

  setupListeners() {
    ipcMain.on("start-processing", (event, params) => {
      if (this.winObj2) {
        this.winObj2.webContents.send("generate-data", params);
      }
    });
    ipcMain.on("data-copied-to-clipboard", () => {
      if (this.winObj3) {
        this.winObj3.webContents.send("read-clipboard-and-draw");
      }
    });
  }
}
new Lab6Manager();