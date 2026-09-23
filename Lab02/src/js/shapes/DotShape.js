import Shape from "./Shape.js";

export class DotShape extends Shape {
  constructor(x1=0, y1=0) {
    super(x1, y1, x1, y1);
  }
  draw(ctx, isPreview = false) {
    const radius = 4;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    ctx.lineWidth = 1;
    ctx.setLineDash(isPreview ? [5, 4] : []);
    ctx.arc(this.x1, this.y1, radius, 0, 2 * Math.PI);
    ctx.closePath();

    if (isPreview) {
      ctx.stroke();
    } else {
      ctx.fill();
    }

    ctx.restore();
  }
}