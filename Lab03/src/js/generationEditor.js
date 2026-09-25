"use strict";

import { DotShape } from "./shapes/dotShape.js";
import { LineShape } from "./shapes/lineShape.js";
import { RectShape } from "./shapes/rectShape.js";
import { EllipsShape } from "./shapes/ellipsShape.js";

export class GenerationEditor {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.maxSize = 127;
    this.shapes = [];
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

    this.shapeLabels = {
      dot: "Крапка",
      line: "Лінія",
      rectangle: "Прямокутник",
      ellipse: "Еліпс",
    };

    this.resizeCanvas();
    this.bindMenu();
    this.bindCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  bindMenu() {
    Object.keys(this.shapeTypes).forEach((type) => {
      document.getElementById(type).addEventListener("click", () => this.selectShape(type));
    });

    document.getElementById("clear").addEventListener("click", () => {
      this.shapes = [];
      this.currentShape = null;
      this.isDrawing = false;
      this.resetSelection();
    });
  }

  bindCanvas() {
    this.canvas.addEventListener("mousedown", (event) => this.startDrawing(event));
    this.canvas.addEventListener("mousemove", (event) => this.updateDrawing(event));
    this.canvas.addEventListener("mouseup", () => this.finishDrawing());
    this.canvas.addEventListener("mouseleave", () => this.finishDrawing());
  }

  selectShape(type) {
    this.currentType = this.currentType === type ? null : type;
    this.currentShape = null;
    this.isDrawing = false;
    Object.keys(this.shapeTypes).forEach((shapeType) => {
      const menuItem = document.getElementById(shapeType);
      const isSelected = shapeType === this.currentType;

      menuItem.classList.toggle("is-selected", isSelected);
      menuItem.setAttribute("aria-checked", String(isSelected));
    });
    document.title = this.currentType
      ? `Lab3 - ${this.shapeLabels[this.currentType]}`
      : "Lab3";
    this.render();
  }

  resetSelection() {
    this.currentType = null;
    Object.keys(this.shapeTypes).forEach((shapeType) => {
      const menuItem = document.getElementById(shapeType);
      menuItem.classList.remove("is-selected");
      menuItem.setAttribute("aria-checked", "false");
    });
    document.title = "Lab3";
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
    if (this.shapes.length >= this.maxSize) return;
    const { x, y } = this.getPosition(event);
    this.startX = x;
    this.startY = y;

    if (this.currentType === "dot") {
      this.shapes.push(new DotShape(x, y));
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

  finishDrawing() {
    if (!this.isDrawing || !this.currentShape) return;
    if (this.currentShape.x1 !== this.currentShape.x2 || this.currentShape.y1 !== this.currentShape.y2) {
      this.shapes.push(this.currentShape);
    }
    this.currentShape = null;
    this.isDrawing = false;
    this.render();
  }

  render(preview = null) {
    const bounds = this.canvas.getBoundingClientRect();

    this.ctx.clearRect(0, 0, bounds.width, bounds.height);
    this.shapes.forEach((shape) => shape.draw(this.ctx));
    if (preview) preview.draw(this.ctx, true);
  }
}