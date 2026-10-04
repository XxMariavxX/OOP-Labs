"use strict";

export class FileManager {
  static saveToFile(data, filename = "shapes.json") {
    if (!data) return;

    const shapes = data.getShapesStructure();
    const jsonData = JSON.stringify(shapes, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();


    URL.revokeObjectURL(url);
  }
}