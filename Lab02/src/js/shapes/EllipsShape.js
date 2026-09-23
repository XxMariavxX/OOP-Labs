"use strict";

import Shape from "./Shape.js";

export class EllipsShape extends Shape {
  constructor(x1=0, y1=0, x2=0, y2=0) {
    super(x1, y1, x2, y2);
  }

  draw(ctx, isPreview = false) {
    const rX = Math.abs(this.x2 - this.x1) / 2;
    const rY = Math.abs(this.y2 - this.y1) / 2;

    const cX = Math.min(this.x1, this.x2) + rX;
    const cY = Math.min(this.y1, this.y2) + rY;

    if (rX === 0 || rY === 0) return;

    ctx.beginPath();
    ctx.ellipse(cX, cY, rX, rY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = "black";
    ctx.setLineDash(isPreview ? [7, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}