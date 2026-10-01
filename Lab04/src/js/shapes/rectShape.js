"use strict";

import Shape from "./shape.js";

export class RectShape extends Shape {
  constructor(x1=0, y1=0, x2=0, y2=0) {
    super(x1, y1, x2, y2);
  }

  draw(ctx, isPreview = false) {
    ctx.save();

    const x = Math.min(this.x1, this.x2);
    const y = Math.min(this.y1, this.y2);
    const width = Math.abs(this.x2 - this.x1);
    const height = Math.abs(this.y2 - this.y1);

    if (width === 0 || height === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.strokeRect(x, y, width, height);

    ctx.restore();
  }
}