"use strict";

export default class Shape {
  #x1;
  #y1;
  #x2;
  #y2;

  constructor(x1=0, y1=0, x2=0, y2=0) {
    this.#x1 = x1;
    this.#y1 = y1;
    this.#x2 = x2;
    this.#y2 = y2;
  }

  get x1() { return this.#x1; }
  get y1() { return this.#y1; }
  get x2() { return this.#x2; }
  get y2() { return this.#y2; }

  coords(x1, y1, x2, y2) {
    this.#x1 = x1;
    this.#y1 = y1;
    this.#x2 = x2;
    this.#y2 = y2;
  }

  draw(ctx) {
  }
}