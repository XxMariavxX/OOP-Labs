"use strict";

import Shape from "./shape.js";
import { RectShape } from "./rectShape.js";

export class CubeShape extends Shape {
  constructor(x=0, y=0, width=0, height=0) {
    super(x, y, width, height);
  }

  draw(ctx, isPreview = false) {
  }
}