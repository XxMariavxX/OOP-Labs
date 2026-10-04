"use strict";

import { myEditor } from "./js/generationEditor.js";
import { GenerationTable } from "./js/generationTable.js";
import { FileManager } from "./js/fileManeger.js";

document.addEventListener("DOMContentLoaded", () => {
  const table = new GenerationTable("table-container");
  const saveButton = document.getElementById("save-btn");
  const tableButton = document.getElementById("table-header");

  myEditor.onShapesChanged = (shapes) => table.update(shapes);

  saveButton?.addEventListener("click", () => {
    FileManager.saveToFile(myEditor);
  });

  tableButton?.addEventListener("click", () => {
    table.toggle();
  });

  window.addEventListener("beforeunload", () => table.hide());
});