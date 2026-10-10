import Chart from "chart.js/auto";

class Object3 {
  constructor() {
    this.chartCanvas = document.getElementById("myChart");
    this.chartInstance = null;

    this.initListeners();
  }

  initListeners() {
    if (window.electronAPI && window.electronAPI.onReadClipboardAndDraw) {
      window.electronAPI.onReadClipboardAndDraw(() => {
        this.readAndRender();
      });
    }
  }

  readDataFromClipboard() {
    const rawText = window.electronAPI.readFromClipboard();
    if (!rawText) return null;

    return rawText.trim().split(" ").map(Number);
  }
  readAndRender() {
    const data = this.readDataFromClipboard();
    if (data && data.length > 0) {
      this.renderChart(data);
    }
  }

  renderChart(data) {
    if (!this.chartCanvas) return;

    const xValues = data.map((_, index) => index);
    const ctx = this.chartCanvas.getContext("2d");

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: xValues,
        datasets: [{
          label: "Значення вектора y = f(x)",
          data: data,
          borderColor: "#e067f0",
          backgroundColor: "rgba(139, 92, 246, 0.15)",
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "#dc7087",
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { 
            title: { display: true, text: "Індекс (x)" } 
          },
          y: { 
            title: { display: true, text: "Значення (y)" } 
          }
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Object3();
  window.electronAPI.notifyReady("object3");
});