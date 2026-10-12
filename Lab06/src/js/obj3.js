/// <reference path="../types/electron.d.ts" />

class Object3 {
  constructor() {
    this.canvas = document.getElementById("myChart");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

    this.initListeners();
  }

  initListeners() {
    if (window.electronAPI && window.electronAPI.onReadClipboardAndDraw) {
      window.electronAPI.onReadClipboardAndDraw((vectorFromIpc) => {
        this.readAndRender(vectorFromIpc);
      });
    }
  }

  readDataFromClipboard() {
    if (!window.electronAPI) return null;
    const rawText = window.electronAPI.readFromClipboard();
    if (!rawText) return null;

    const parsed = rawText.trim().split(/\s+/).map(Number);
    return parsed.length > 0 ? parsed : null;
  }

  readAndRender(vectorFromIpc) {
    let data = vectorFromIpc;

    if (!Array.isArray(data) || data.length === 0) {
      data = this.readDataFromClipboard();
    }

    if (Array.isArray(data) && data.length > 0 && !data.some(isNaN)) {
      this.drawCustomChart(data);
    }
  }

  drawCustomChart(data) {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;

    ctx.clearRect(0, 0, width, height);

    const minVal = Math.min(...data, 0);
    const maxVal = Math.max(...data, 1);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.fillText("y", padding - 15, padding);
    ctx.fillText("x", width - padding + 10, height - padding + 5);

    const points = data.map((val, index) => {
      const x = data.length === 1 
        ? width / 2 
        : padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);
      
      return { x, y, val, index };
    });

    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, height - padding);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, height - padding);
      ctx.closePath();
      ctx.fillStyle = "rgba(224, 103, 240, 0.2)";
      ctx.fill();

      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = "#e067f0";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#dc7087";
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.val.toString(), p.x, p.y - 10);
      ctx.fillText(p.index.toString(), p.x, height - padding + 15);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Object3();
  if (window.electronAPI && window.electronAPI.notifyReady) {
    window.electronAPI.notifyReady("object3");
  }
});