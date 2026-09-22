export default class Shape {
  constructor(x1=0, y1=0, x2=0, y2=0) {
    this._x1 = x1;
    this._y1 = y1;
    this._x2 = x2;
    this._y2 = y2;
  }

  get x1() { return this._x1; }
  get y1() { return this._y1; }
  get x2() { return this._x2; }
  get y2() { return this._y2; }

  coords(x1, y1, x2, y2) {
    this._x1 = x1;
    this._y1 = y1;
    this._x2 = x2;
    this._y2 = y2;
  }

  draw(ctx) {
  }
}