"use strict";

import { DotShape } from "./shapes/dotShape.js";
import { LineShape } from "./shapes/lineShape.js";
import { RectShape } from "./shapes/rectShape.js";
import { EllipsShape } from "./shapes/ellipsShape.js";

export class GenerationEditor {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.maxSize = 128;
    this.shapes = new Array(this.maxSize).fill(null);
    this.count = 0;
    this.currentType = null;
    this.currentShape = null;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;

    this.shapeTypes = {
      dot: DotShape,
      line: LineShape,
      rectangle: RectShape,
      ellipse: EllipsShape,
    };

    this.resizeCanvas();
    this.bindMenu();
    this.bindCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  addshape(shape) {
    if (this.count < this.maxSize) {
      this.shapes[this.count] = shape;
      this.count++;
      return true;
    } else {
      return false;
    };
  }

  bindMenu() {
    const objectsMenu = document.getElementById("objects-menu");
    objectsMenu.addEventListener("mouseenter", () => this.updateMenuSelection());
    objectsMenu.addEventListener("focusin", () => this.updateMenuSelection());

    Object.keys(this.shapeTypes).forEach((type) => {
      document.getElementById(type).addEventListener("click", () => this.selectShape(type));
    });

    document.getElementById("clear").addEventListener("click", () => {
      this.shapes.fill(null);
      this.count = 0;
      this.currentShape = null;
      this.isDrawing = false;
      this.resetSelection();
    });
  }

  bindCanvas() {
    this.canvas.addEventListener("mousedown", (event) => this.startDrawing(event));
    this.canvas.addEventListener("mousemove", (event) => this.updateDrawing(event));
    this.canvas.addEventListener("mouseup", (event) => this.finishDrawing(event));
    this.canvas.addEventListener("mouseleave", () => this.finishDrawing());
  }

  selectShape(type) {
    this.currentType = this.currentType === type ? null : type;
    this.currentShape = null;
    this.isDrawing = false;
    this.updateMenuSelection();
    this.render();
  }

  updateMenuSelection() {
    Object.keys(this.shapeTypes).forEach((shapeType) => {
      const menuItem = document.getElementById(shapeType);
      const isSelected = shapeType === this.currentType;

      menuItem.classList.toggle("is-selected", isSelected);
      menuItem.setAttribute("aria-checked", String(isSelected));
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

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
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

  finishDrawing(event) {
    if (!this.isDrawing || !this.currentShape) return;
    if (event) {
      const { x, y } = this.getPosition(event);
      this.currentShape.coords(this.startX, this.startY, x, y);
    }
    if (this.currentShape.x1 !== this.currentShape.x2 || this.currentShape.y1 !== this.currentShape.y2) {
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
      if (this.shapes[i] !== null) {
        this.shapes[i].draw(this.ctx);
      }
    }
    if (preview) preview.draw(this.ctx, true);
  }
}