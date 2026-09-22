import { DotShape }from "/dotshape.js";
import { LineShape }from "/lineshape.js";
import { RectShape }from "/rectshape.js";
import { EllipsShape }from "/ellipsshape.js";

export class GenerationEditor {
    canvas= document.getElementById("canvas");
    ctx= canvas.getContext("2d");
    maxSize= 127;
    dArray= [];
    currentShape=null;
    isDrawing= false;
    startX= 0;
    startY= 0;
  constructor() {
    this.shapes = [];
  }
}