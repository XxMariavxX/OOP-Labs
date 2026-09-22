import { Shape } from "shape.js";

export class DotShape extends Shape {
  constructor(x1=0, y1=0) {
    super(x1, y1, x1, y1);
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.lineCap = 'round';
    ctx.fillRect(this.x1, this.y1, 3, 3);
  }
} 