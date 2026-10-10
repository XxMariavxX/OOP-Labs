class Object1 {
  constructor() {
    this.n = document.getElementById("input-n");
    this.max = document.getElementById("input-max");
    this.min = document.getElementById("input-min");
    this.btnExecute = document.getElementById("btn-execute");

    this.initEvents();
  }

  initEvents() {
    this.btnExecute.addEventListener("click", () => this.handleExecute());
  }

  handleExecute() {
    const n = Number(this.n.value);
    const max = Number(this.max.value);
    const min = Number(this.min.value);

    if (
      this.n.value.trim() === "" ||
      this.max.value.trim() === "" ||
      this.min.value.trim() === "" ||
      !Number.isInteger(n) ||
      n < 1 ||
      !Number.isFinite(max) ||
      !Number.isFinite(min)
    ) {
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