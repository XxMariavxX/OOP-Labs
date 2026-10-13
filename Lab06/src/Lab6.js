import { app, BrowserWindow, ipcMain, clipboard, screen } from "electron";
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
    this.pendingVectorData = null;

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
  }

  createWindows() {
    const preloadPath = path.join(__dirname, "js", "preload.cjs");

    // Розташування вікон: Lab6 зліва, Object2 справа згори, Object3 справа під нею.
    // Так результати Object2 та Object3 видно одночасно.
    const { x: wx, y: wy, height: wh } = screen.getPrimaryDisplay().workArea;
    const gap = 20;
    const size1 = { width: 500, height: 500 };
    const size2 = { width: 600, height: 400 };
    const size3 = { width: 800, height: 600 };
    const colRightX = wx + gap + size1.width + gap;
    const pos1 = { x: wx + gap, y: wy + gap };
    const pos2 = { x: colRightX, y: wy + gap };
    const pos3 = {
      x: colRightX,
      y: Math.max(wy, Math.min(wy + gap + size2.height + gap, wy + wh - size3.height)),
    };

    this.winObj1 = new BrowserWindow({
      ...size1,
      ...pos1,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.winObj2 = new BrowserWindow({
      ...size2,
      ...pos2,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.winObj3 = new BrowserWindow({
      ...size3,
      ...pos3,
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

    // Lab6 має залишатися активним вікном, щоб користувач міг повторно запустити роботу.
    this.winObj3.once("ready-to-show", () => {
      if (this.winObj1 && !this.winObj1.isDestroyed()) {
        this.winObj1.focus();
      }
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
        if (this.pendingVectorData && this.winObj3) {
          this.winObj3.webContents.send("read-clipboard-and-draw", this.pendingVectorData);
          this.pendingVectorData = null;
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

    ipcMain.on("data-copied-to-clipboard", (_event, payload) => {
      const { textData, vector } = payload || {};

      if (textData) {
        try {
          clipboard.writeText(textData);
        } catch (e) {
          console.error("Помилка запису у Clipboard:", e);
        }
      }

      if (this.object3Ready && this.winObj3) {
        this.winObj3.webContents.send("read-clipboard-and-draw", vector);
      } else {
        this.pendingVectorData = vector;
      }
    });
  }
}

new Lab6Manager();