"use strict";

import { myEditor } from "./js/generationEditor.js";
import { GenerationTable } from "./js/generationTable.js";
import { FileManeger } from "./js/fileManeger.js";

document.addEventListener("DOMContentLoaded", () => {
  const table = new GenerationTable("table-container");
  const saveButton = document.getElementById("save-btn");
  const loadButton = document.getElementById("load-btn");
  const loadInput = document.getElementById("load-input");
  const tableButton = document.getElementById("table-header");
  const fileMenu = document.querySelector(".nav__item--dropdown");

  const closeFileMenu = () => fileMenu?.classList.remove("is-open");

  myEditor.onShapesChanged = (shapes, selectedIndex) => {
    table.update(shapes, selectedIndex);
  };

  table.rowSelect = (index) => {
    myEditor.selectShape(index);
  };

  table.rowDelete = (index) => {
    myEditor.deleteShapeAt(index);
  };

  saveButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    FileManeger.saveToFile(myEditor);
    closeFileMenu();
  });

  loadButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeFileMenu();
    loadInput?.click();
  });

  loadInput?.addEventListener("change", async () => {
    const file = loadInput.files?.[0];
    if (!file) return;

    try {
      const shapes = await FileManeger.loadFromFile(file);
      myEditor.loadShapes(shapes);
    } catch (error) {
      window.alert(`Не вдалося відкрити файл: ${error.message}`);
    } finally {
      loadInput.value = "";
    }
  });

  tableButton?.addEventListener("click", () => {
    table.toggle();
  });

  window.addEventListener("beforeunload", () => table.hide());
});