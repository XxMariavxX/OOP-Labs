"use strict";

import Shape from "./shape.js";

export class EllipsShape extends Shape {
  constructor(x1=0, y1=0, x2=0, y2=0) {
    super(x1, y1, x2, y2);

    this.fillColor = "rgba(235, 86, 215, 0.86)";
  }

  draw(ctx) {
    ctx.save();

    const rX = Math.abs(this.x2 - this.x1);
    const rY = Math.abs(this.y2 - this.y1);

    const cX = this.x1;
    const cY = this.y1;

    if (rX === 0 || rY === 0) return;

    ctx.beginPath();

    ctx.ellipse(cX, cY, rX, rY, 0, 0, 2 * Math.PI);
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}