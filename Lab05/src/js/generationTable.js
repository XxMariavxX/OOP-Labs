"use strict";

export class GenerationTable {
  constructor(containerIdx) {
    this.container = document.getElementById(containerIdx);
    this.initUI();
    this.hide();
  }

  initUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="table-panel-header">
        <span class="table-header__title">Таблиця</span>
        <button class="table-header__close" id="table-close-btn">
          <img src="./images/table_close.png" alt="Закрити" class="table-header__icon" />
        </button>
      </div>
      <div class="table-scroll">
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
      </div>
    `;

    const closeButton = document.getElementById("table-close-btn");
    closeButton?.addEventListener("click", () => this.hide());
  }

  hide() {
    if (this.container) this.container.style.display = "none";
  }

  toggle() {
    const isHidden = this.container.style.display === "none";
    this.container.style.display = isHidden ? "block" : "none";
  }

  update(shapes) {
    const tableBody = document.getElementById("shapes-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    shapes.forEach((shape, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${shape.type}</td>
        <td>${shape.x1}, ${shape.y1}</td>
        <td>${shape.x2}, ${shape.y2}</td>
      `;
      tableBody.appendChild(row);
    });
  }
}