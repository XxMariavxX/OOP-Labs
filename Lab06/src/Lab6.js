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
    this.isClosing = false;
    this.object2Ready = false;
    this.object3Ready = false;
    this.pendingParams = null;
    this.pendingChartUpdate = false;

    this.initApp();
  }

  initApp() {
    app.whenReady().then(() => {
      this.setupListeners();
      this.createWindows();
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
    const preloadPath = path.join(__dirname, "js", "preload.js");

    this.winObj1 = new BrowserWindow({
      width: 500,
      height: 500,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.winObj2 = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.winObj3 = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.winObj1.loadFile(path.join(__dirname, "html", "indexObj1.html"));
    this.winObj2.loadFile(path.join(__dirname, "html", "indexObj2.html"));
    this.winObj3.loadFile(path.join(__dirname, "html", "indexObj3.html"));

    [this.winObj1, this.winObj2, this.winObj3].forEach((window) => {
      window.on("closed", () => {
        if (!this.isClosing) {
          this.closeAllWindows();
        }
      });
    });

    if (this.winObj1) {
      this.winObj1.focus();
    }
  }

  closeAllWindows() {
    if (this.isClosing) return;
    this.isClosing = true;

    [this.winObj1, this.winObj2, this.winObj3].forEach((window) => {
      if (window && !window.isDestroyed()) {
        window.destroy();
      }
    });

    this.winObj1 = null;
    this.winObj2 = null;
    this.winObj3 = null;
    app.quit();
  }

  setupListeners() {
    ipcMain.on("component-ready", (_event, component) => {
      if (component === "object2") {
        this.object2Ready = true;
        if (this.pendingParams && this.winObj2) {
          this.winObj2.webContents.send("generate-data", this.pendingParams);
          this.pendingParams = null;
        }
      }

      if (component === "object3") {
        this.object3Ready = true;
        if (this.pendingChartUpdate && this.winObj3) {
          this.winObj3.webContents.send("read-clipboard-and-draw");
          this.pendingChartUpdate = false;
        }
      }
    });

    ipcMain.on("start-processing", (_event, params) => {
      if (this.object2Ready && this.winObj2) {
        this.winObj2.webContents.send("generate-data", params);
      } else {
        this.pendingParams = params;
      }
    });

    ipcMain.on("data-copied-to-clipboard", () => {
      if (this.object3Ready && this.winObj3) {
        this.winObj3.webContents.send("read-clipboard-and-draw");
      } else {
        this.pendingChartUpdate = true;
      }
    });
  }
}

new Lab6Manager();