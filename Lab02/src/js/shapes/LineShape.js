"use strict";

import Shape from "./Shape.js";

export class LineShape extends Shape {
  constructor(x1=0, y1=0, x2=0, y2=0) {
    super(x1, y1, x2, y2);
  }

  draw(ctx, isPreview = false) {
    ctx.save();

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.setLineDash(isPreview ? [7, 5] : []);
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}