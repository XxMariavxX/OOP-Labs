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
    if (!window.electronAPI || !window.electronAPI.readFromClipboard) return null;
    const rawText = window.electronAPI.readFromClipboard();
    if (!rawText || rawText.trim() === "") return null;

    return rawText.trim().split(/\s+/).map(Number);
  }

  readAndRender(vectorFromIpc) {
    // Дані зчитуються з буфера обміну; вектор із IPC використовується лише як запасний варіант
    let data = this.readDataFromClipboard();

    if (!Array.isArray(data) || data.length === 0 || !data.every(Number.isFinite)) {
      data = Array.isArray(vectorFromIpc) ? vectorFromIpc : null;
    }

    if (Array.isArray(data) && data.length > 0 && data.every(Number.isFinite)) {
      this.drawCustomChart(data);
    }
  }

  formatNumber(value) {
    return String(Number(value.toFixed(2)));
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
    const padLeft = 55;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    const minVal = Math.min(...data, 0);
    const maxVal = Math.max(...data, 1);
    const range = maxVal - minVal || 1;

    // y — значення вектора, x — індекси елементів
    const toX = (i) =>
      data.length === 1 ? padLeft + plotW / 2 : padLeft + (i / (data.length - 1)) * plotW;
    const toY = (v) => padTop + plotH - ((v - minVal) / range) * plotH;
    const xAxisY = padTop + plotH;

    // Сітка та числові підписи на осі y
    const yTicks = 5;
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let k = 0; k <= yTicks; k++) {
      const v = minVal + (range * k) / yTicks;
      const y = toY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(this.formatNumber(v), padLeft - 6, y);
    }

    // Осі координат
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, xAxisY);
    ctx.lineTo(width - padRight, xAxisY);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("y", padLeft + 6, padTop - 8);
    ctx.fillText("x", width - padRight + 8, xAxisY - 4);

    // Лінія графіка та заливка під нею
    const points = data.map((val, index) => ({ x: toX(index), y: toY(val), val, index }));

    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, xAxisY);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, xAxisY);
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

    // Точки та їх підписи: значення над точкою, індекс (x) під віссю
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#dc7087";
      ctx.fill();

      ctx.fillStyle = "#334155";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(this.formatNumber(p.val), p.x, p.y - 10);

      ctx.textBaseline = "top";
      ctx.fillText(p.index.toString(), p.x, xAxisY + 4);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Object3();
  if (window.electronAPI && window.electronAPI.notifyReady) {
    window.electronAPI.notifyReady("object3");
  }
});
