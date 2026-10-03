"user strict";

export class GenerationTable {
  constructor(containerIdx) {
    this.container = document.getElementById(containerIdx);
    this.initUI();
  }

  initUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="table-header">
        <span class="table-header__title">Таблиця</span>
        <button class="table-header__close" id="table-close-btn">Закрити</button>
      </div>
      <table class="table" id="shapes-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Тип</th>
            <th>x1, y1</th>
            <th>x2, y2</th>
          </tr>
        </thead>
        <tbody id="shapes-table-body">
        </tbody>
      </table>
    `;

    const closeButton = document.getElementById("table-close-btn");
    closeButton?.addEventListener("click", () => () => this.hide());
  }

  hide() {
    this.container.style.display = "none";
  }

  show() {
    this.container.style.display = "block";
  }

  toggle() {
    const isHidden = this.container.style.display === "none";
    this.container.style.display = isHidden ? "block" : "none";
  }
}