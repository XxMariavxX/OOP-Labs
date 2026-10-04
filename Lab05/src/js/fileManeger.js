"use strict";

export class FileManeger {
  static saveToFile(editor, filename = "shapes.json") {
    if (!editor) return;

    const shapes = editor.getShapesStructure();
    const jsonData = JSON.stringify(shapes, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  static loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        try {
          const shapes = JSON.parse(reader.result);
          if (!Array.isArray(shapes)) {
            throw new Error("файл повинен містити масив фігур");
          }
          resolve(shapes);
        } catch (error) {
          reject(error);
        }
      });

      reader.addEventListener("error", () => {
        reject(new Error("не вдалося прочитати файл"));
      });

      reader.readAsText(file);
    });
  }
}