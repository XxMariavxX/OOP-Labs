"use strict";

import Shape from "./shape.js";
import { RectShape } from "./rectShape.js";
import { LineShape } from "./lineShape.js";

export class CubeShape extends Shape {
  constructor(x1=0, y1=0, x2=0, y2=0) {
    super(x1, y1, x2, y2);
  }

  draw(ctx, isPreview = false) {

    ctx.save();
    if (this.x1 === this.x2 || this.y1 === this.y2) return;

    const x = (this.x2 - this.x1) * 0.3;
    const y = (this.y2 - this.y1) * 0.3;

    const rectFront = new RectShape(this.x1, this.y1, this.x2, this.y2);
    const rectSide = new RectShape(this.x1 + x, this.y1 - y, this.x2 + x, this.y2 - y);

    const line1 = new LineShape(this.x1, this.y1, this.x1 + x, this.y1 - y);
    const line2 = new LineShape(this.x2, this.y1, this.x2 + x, this.y1 - y);
    const line3 = new LineShape(this.x1, this.y2, this.x1 + x, this.y2 - y);
    const line4 = new LineShape(this.x2, this.y2, this.x2 + x, this.y2 - y);

    rectSide.draw(ctx, isPreview);
    line1.draw(ctx, isPreview);
    line2.draw(ctx, isPreview);
    line3.draw(ctx, isPreview);
    line4.draw(ctx, isPreview);
    rectFront.draw(ctx, isPreview);

    ctx.restore();
  }
}