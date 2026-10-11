class Object2 {
  constructor() {
    this.tableValues = document.getElementById('table-values');
    this.statusEl = document.getElementById("main--status");
    this.electronAPI = electronAPI;

    this.initIoListeners();
  }

  initIoListeners() {
    if (window.electronAPI && window.electronAPI.onGenerateData) {
      window.electronAPI.onGenerateData((params) => {
        this.processGeneration(params);
      });
    }
  }

  generateVector(n, min, max) {
    const vector = [];
    for (let i = 0; i < n; i++) {
      const randomVal = parseFloat((min + Math.random() * (max - min)).toFixed(2));
      vector.push(randomVal);
    }
    return vector;
  }

  renderTable(vector) {
    if (!this.tableValues) return;
    this.tableValues.innerHTML = "";

    vector.forEach((val, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${index}</td><td>${val}</td>`;
      this.tableValues.appendChild(row);
    });
  }

  processGeneration({ n, min, max }) {
    const vector = this.generateVector(n, min, max);
    this.renderTable(vector);

    const textData = vector.join(" ");

    if (this.statusEl) {
      this.statusEl.innerText = `Згенеровано ${n} елементів`;
      this.statusEl.classList.remove("status--idle");
      this.statusEl.classList.add("status--success");
    }

    try {
      window.electronAPI.writeToClipboard(textData);
    } catch (e) {
      console.warn("Спроба запису у clipboard:", e);
    }

    window.electronAPI.notifyCopiedToClipboard({ textData, vector });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Object2();
  if (window.electronAPI && window.electronAPI.notifyReady) {
    window.electronAPI.notifyReady("object2");
  }
});