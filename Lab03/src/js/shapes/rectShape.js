"use strict";

import Shape from "./shape.js";

export class RectShape extends Shape {
  constructor(x1=0, y1=0, x2=0, y2=0) {
    super(x1, y1, x2, y2);

    this.fillColor = "rgba(235, 86, 215, 0.86)";
  }

  draw(ctx, isPreview = false) {
    ctx.save();

    const widthX = Math.abs(this.x2 - this.x1);
    const heightY = Math.abs(this.y2 - this.y1);

    const left = this.x1 - widthX;
    const top = this.y1 - heightY;

    const widthAll = 2 * widthX;
    const heightAll = 2 * heightY;

    ctx.fillStyle = isPreview ? "transparent" : this.fillColor;
    ctx.strokeStyle = "black";
    ctx.setLineDash(isPreview ? [7, 5] : []);
    ctx.fillRect(left, top, widthAll, heightAll);
    ctx.strokeRect(left, top, widthAll, heightAll);
    ctx.setLineDash([]);

    ctx.restore();
  }
}