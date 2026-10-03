"use strict";

import Shape from "./shape.js";
import { LineShape } from "./lineShape.js";
import { EllipsShape } from "./ellipsShape.js";

export class LineSegmentShape extends Shape {
  constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
    super(x1, y1, x2, y2);

    this.fillColor = "rgba(235, 86, 215, 0.86)";
    this.radius = 5;
  }

  draw(ctx, isPreview = false) {
    ctx.save();

    const r = this.radius;
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const length = Math.hypot(dx, dy);

    let lStartX = this.x1;
    let lStartY = this.y1;
    let lEndX = this.x2;
    let lEndY = this.y2;

    if (length === 0) return;

    if (length > r * 2) {
      const offsetX = (dx / length) * r;
      const offsetY = (dy / length) * r;

      lStartX = this.x1 + offsetX;
      lStartY = this.y1 + offsetY;
      lEndX = this.x2 - offsetX;
      lEndY = this.y2 - offsetY;
    }

    const line = new LineShape(lStartX, lStartY, lEndX, lEndY);
    line.draw(ctx, isPreview);

    const ellips1 = new EllipsShape(this.x1, this.y1, this.x1 + r, this.y1 + r);
    const ellips2 = new EllipsShape(this.x2, this.y2, this.x2 + r, this.y2 + r);

    ellips1.draw(ctx, isPreview);
    ellips2.draw(ctx, isPreview);

    ctx.restore();
  }
}