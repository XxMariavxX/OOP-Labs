"use strict";

import { DotShape } from "./shapes/dotShape.js";
import { LineShape } from "./shapes/lineShape.js";
import { RectShape } from "./shapes/rectShape.js";
import { EllipsShape } from "./shapes/ellipsShape.js";
import { LineSegmentShape } from "./shapes/lineSegmentShape.js";
import { CubeShape } from "./shapes/cubeShape.js";

export class GenerationEditor {
  static #instance = null;

  constructor() {
    if (GenerationEditor.#instance) return GenerationEditor.#instance;

    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.maxSize = 127;
    this.shapes = new Array(this.maxSize).fill(null);
    this.count = 0;
    this.currentType = null;
    this.currentShape = null;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.selectedInx = -1;

    this.shapeTypes = {
      dot: DotShape,
      line: LineShape,
      rectangle: RectShape,
      ellipse: EllipsShape,
      lineSegment: LineSegmentShape,
      cube: CubeShape
    };
    this.shapeTypeNames = Object.fromEntries(
      Object.entries(this.shapeTypes).map(([type, ShapeClass]) => [ShapeClass.name, type])
    );

    this.onShapesChanged = null;
    GenerationEditor.#instance = this;

    this.resizeCanvas();
    this.bindMenu();
    this.bindCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  static getInstance() {
    if (!GenerationEditor.#instance) {
      GenerationEditor.#instance = new GenerationEditor();
    }
    return GenerationEditor.#instance;
  }

  onNotify(selectedType) {
    this.currentType = this.currentType === selectedType ? null : selectedType;
    this.currentShape = null;
    this.isDrawing = false;
    this.updateMenuSelection();
    this.render();
  }

  addshape(shape) {
    if (this.count >= this.maxSize) return false;
    this.shapes[this.count++] = shape;
    this.notifyShapesChanged();
    this.render();
    return true;
  }

  selectShape(index) {
    this.selectedInx = index;
    this.render();
  }

  deleteShapeAt(index) {
    if (index < 0 || index >= this.count) return;

    for (let i = index; i < this.count - 1; i++) {
      this.shapes[i] = this.shapes[i + 1];
    }
    this.shapes[this.count - 1] = null;
    this.count--;

    if (this.selectedInx === index) {
      this.selectedInx = -1;
    } else if (this.selectedInx > index) {
      this.selectedInx--;
    }

    this.render();
    this.notifyShapesChanged();
  }

  notifyShapesChanged() {
    if (typeof this.onShapesChanged === "function") {
      this.onShapesChanged(this.getShapesStructure(), this.selectedInx);
    }
  }

  getShapesStructure() {
    const shapesStructure = [];
    for (let i = 0; i < this.count; i++) {
      if (this.shapes[i]) {
        shapesStructure.push({
          type: this.shapeTypeNames[this.shapes[i].constructor.name] ?? this.shapes[i].constructor.name,
          x1: this.shapes[i].x1,
          y1: this.shapes[i].y1,
          x2: this.shapes[i].x2,
          y2: this.shapes[i].y2
        });
      }
    }
    return shapesStructure;
  }

  registerShape(type, ShapeClass) {
    if (!type || typeof ShapeClass !== "function") {
      throw new TypeError("Потрібні ключ типу та клас фігури");
    }
    this.shapeTypes[type] = ShapeClass;
    this.shapeTypeNames[ShapeClass.name] = type;
  }

  loadShapes(shapes) {
    if (shapes.length > this.maxSize) {
      throw new Error(`можна завантажити не більше ${this.maxSize} фігур`);
    }

    const loadedShapes = shapes.map((shape) => {
      const type = this.shapeTypes[shape.type]
        ? shape.type
        : this.shapeTypeNames[shape.type];
      const ShapeClass = this.shapeTypes[type];

      if (!ShapeClass) {
        throw new Error(`невідомий тип фігури: ${shape.type}`);
      }

      const coordinates = [shape.x1, shape.y1, shape.x2, shape.y2];
      if (!coordinates.every((coordinate) => Number.isFinite(Number(coordinate)))) {
        throw new Error("файл містить некоректні координати");
      }
      const loadedShape = new ShapeClass(...coordinates.map(Number));
      if (!this.isShapeDrawable(loadedShape, type)) {
        throw new Error("файл містить невидиму фігуру без розміру");
      }
      return loadedShape;
    });

    this.shapes.fill(null);
    loadedShapes.forEach((shape, index) => {
      this.shapes[index] = shape;
    });
    this.count = loadedShapes.length;
    this.currentShape = null;
    this.isDrawing = false;
    this.selectedInx = -1;
    this.render();
    this.notifyShapesChanged();
  }

  bindMenu() {
    const dropdownMenus = document.querySelectorAll(".nav__item--dropdown");

    const closeDropdowns = () => {
      dropdownMenus.forEach((menu) => menu.classList.remove("is-open"));
    };

    document.addEventListener("click", closeDropdowns);

    document.querySelectorAll("[data-shape-type]").forEach((menuItem) => {
      menuItem.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onNotify(menuItem.dataset.shapeType);
        closeDropdowns();
      });
    });

    Object.keys(this.shapeTypes).forEach((type) => {
      const toolbarButton = document.getElementById(type);

      if (toolbarButton) {
        toolbarButton.addEventListener("click", (event) => {
          event.stopPropagation();
          closeDropdowns();
          this.onNotify(type);
        });
      }
    });

    const clearBtn = document.getElementById("clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        closeDropdowns();
        this.shapes.fill(null);
        this.count = 0;
        this.currentShape = null;
        this.isDrawing = false;
        this.selectedInx = -1;
        this.resetSelection();
        this.notifyShapesChanged();
      });
    }
  }

  bindCanvas() {
    this.canvas.addEventListener("mousedown", (event) => {
      this.startDrawing(event);
    });

    this.canvas.addEventListener("mousemove", (event) => {
      if (this.isDrawing) {
        this.updateDrawing(event);
      }
    });

    this.canvas.addEventListener("mouseup", (event) => {
      if (this.isDrawing) {
        this.finishDrawing(event);
      }
    });

    this.canvas.addEventListener("mouseleave", (event) => {
      if (this.isDrawing) {
        this.finishDrawing(event);
      }
    });
  }

  updateMenuSelection() {
    Object.keys(this.shapeTypes).forEach((shapeType) => {
      const menuItem = document.getElementById(shapeType);
      const isSelected = shapeType === this.currentType;

      if (menuItem) {
        menuItem.classList.toggle("is-selected", isSelected);
        menuItem.setAttribute("aria-checked", String(isSelected));
      }
    });
  }

  resetSelection() {
    this.currentType = null;
    this.updateMenuSelection();
    this.render();
  }

  resizeCanvas() {
    const bounds = this.canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    this.canvas.width = Math.round(bounds.width * devicePixelRatio);
    this.canvas.height = Math.round(bounds.height * devicePixelRatio);
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    this.render();
  }

  getPosition(event) {
    const bounds = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - bounds.left, bounds.width));
    const y = Math.max(0, Math.min(event.clientY - bounds.top, bounds.height));
    return { x, y };
  }

  startDrawing(event) {
    if (!this.currentType) return;
    if (this.count >= this.maxSize) return;

    const { x, y } = this.getPosition(event);
    this.startX = x;
    this.startY = y;

    if (this.currentType === "dot") {
      this.addshape(new DotShape(x, y));
      this.render();
      return;
    }

    this.currentShape = new this.shapeTypes[this.currentType](x, y, x, y);
    this.isDrawing = true;
  }

  updateDrawing(event) {
    if (!this.isDrawing) return;
    const { x, y } = this.getPosition(event);
    this.currentShape.coords(this.startX, this.startY, x, y);
    this.render(this.currentShape);
  }

  isShapeDrawable(shape, type) {
    const width = Math.abs(shape.x2 - shape.x1);
    const height = Math.abs(shape.y2 - shape.y1);
    const requiresArea = ["rectangle", "ellipse", "cube"].includes(type);

    return requiresArea
      ? width > 0 && height > 0
      : width > 0 || height > 0;
  }

  finishDrawing(event) {
    if (!this.isDrawing || !this.currentShape) return;
    if (event) {
      const { x, y } = this.getPosition(event);
      this.currentShape.coords(this.startX, this.startY, x, y);
    }
    if (this.isShapeDrawable(this.currentShape, this.currentType)) {
      this.addshape(this.currentShape);
    }
    this.currentShape = null;
    this.isDrawing = false;
    this.render();
  }

  render(preview = null) {
    const bounds = this.canvas.getBoundingClientRect();

    this.ctx.clearRect(0, 0, bounds.width, bounds.height);

    for (let i = 0; i < this.count; i++) {
      if (!this.shapes[i]) continue;

      this.ctx.save();
      if (i === this.selectedInx) {
        this.ctx.shadowColor = "#cf0de0";
        this.ctx.shadowBlur = 8;
        this.ctx.strokeStyle = "#c28fc2";
        this.ctx.fillStyle = "rgba(211, 120, 146, 0.15)";
        this.ctx.lineWidth = 2.5;
      }

      this.shapes[i].draw(this.ctx);
      this.ctx.restore();
    }
    if (preview) preview.draw(this.ctx, true);
  }
}

export const myEditor = GenerationEditor.getInstance();