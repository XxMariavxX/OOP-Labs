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

  getFormData() {
    const n = parseInt(this.n.value);
    const max = parseInt(this.max.value);
    const min = parseInt(this.min.value);
    return { n, max, min };
  }

  handleExecute() {
    const params = this.getFormData();

    if (isNaN(params.n) || isNaN(params.max) || isNaN(params.min)) {
      alert("Введіть коректні числові значення для всіх полів");
      return;
    }

    if (params.min >= params.max) {
      alert("Мінімальне значення повинно бути менше за максимальне");
      return;
    }

    window.electronAPI.startProcessing(params);
  }
}

  document.addEventListener("DOMContentLoaded", () => {
    new FormManager();
});