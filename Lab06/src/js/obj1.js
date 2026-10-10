class Object1 {
  constructor() {
    this.n = document.getElementById("input-n");
    this.max = document.getElementById("input-max");
    this.min = document.getElementById("input-min");
    this.btnExecute = document.getElementById("btn-execute");

    this.initEvents();
  }

  initEvents() {
    this.btnExecute.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleExecute();
    });
  }

  handleExecute() {
    const rawN = this.n.value;
    const rawMax = this.max.value;
    const rawMin = this.min.value;

    if (rawN.trim() === "" || rawMax.trim() === "" || rawMin.trim() === "") {
      alert("Введіть коректні числові значення для всіх полів");
      return;
    }

    const n = Number(rawN);
    const max = Number(rawMax);
    const min = Number(rawMin);

    if (!Number.isInteger(n) || n < 1 || !Number.isFinite(max) || !Number.isFinite(min)) {
      alert("Введіть коректні числові значення для всіх полів");
      return;
    }

    if (min >= max) {
      alert("Мінімальне значення повинно бути менше за максимальне");
      return;
    }

    window.electronAPI.startProcessing({ n, max, min });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Object1();
});