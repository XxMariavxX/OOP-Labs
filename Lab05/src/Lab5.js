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

  myEditor.onShapesChanged = (shapes) => table.update(shapes);

  saveButton?.addEventListener("click", () => {
    FileManeger.saveToFile(myEditor);
  });

  loadButton?.addEventListener("click", () => loadInput?.click());

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