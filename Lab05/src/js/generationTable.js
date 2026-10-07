"use strict";

export class GenerationTable {
  constructor(containerIdx) {
    this.container = document.getElementById(containerIdx);
    this.initUI();
    this.hide();

    this.rowSelect = null;
    this.rowDelete = null;
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
              <th>Видалити</th>
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

  show() {
    if (this.container) this.container.style.display = "block";
  }

  toggle() {
    if (!this.container) return;
    const isHidden = this.container.style.display === "none" || !this.container.style.display;
    this.container.style.display = isHidden ? "block" : "none";
  }

  update(shapes, selectedIndex = -1) {
    const tableBody = document.getElementById("shapes-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    shapes.forEach((shape, index) => {
      const row = document.createElement("tr");

      if (index === selectedIndex) {
        row.classList.add("is-selected");
      }

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${shape.type}</td>
        <td>${shape.x1}, ${shape.y1}</td>
        <td>${shape.x2}, ${shape.y2}</td>
        <td style="text-align: center;">
          <button type="button" class="delete-btn" data-index="${index}" title="Вилучити об'єкт">❌</button>
        </td>
      `;

      row.addEventListener("mouseenter", () => {
        row.classList.add("is-hovered");
        if (typeof this.rowSelect === "function") {
          this.rowSelect(index);
        }
      });

      row.addEventListener("mouseleave", () => {
        row.classList.remove("is-hovered");
        if (typeof this.rowSelect === "function") {
          const selectedRow = tableBody.querySelector("tr.is-selected");
          const selectedIdx = selectedRow ? Number(selectedRow.querySelector(".delete-btn")?.dataset.index) : -1;
          this.rowSelect(selectedIdx);
        }
      });

      row.addEventListener("click", (event) => {
        if (event.target.closest(".delete-btn")) return;

        const isCurrentlySelected = row.classList.contains("is-selected");
        
        tableBody.querySelectorAll("tr").forEach((r) => r.classList.remove("is-selected"));

        if (!isCurrentlySelected) {
          row.classList.add("is-selected");
        }

        if (typeof this.rowSelect === "function") {
          this.rowSelect(isCurrentlySelected ? -1 : index);
        }
      });

      const deleteBtn = row.querySelector(".delete-btn");
      deleteBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();
        if (typeof this.rowDelete === "function") {
          this.rowDelete(index);
        }
      });

      tableBody.appendChild(row);
    });
  }
}