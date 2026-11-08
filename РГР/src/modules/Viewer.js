export class Viewer {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
  }

  render(fileNodes) {
    if (!this.canvas || !this.ctx || !fileNodes || fileNodes.length === 0) return;

    const ctx = this.ctx;

    const levels = new Map();
    for (const node of fileNodes) {
      if (!levels.has(node.level)) levels.set(node.level, []);
      levels.get(node.level).push(node);
    }

    const boxW = 160;
    const boxH = 60;
    const gapX = 40;
    const gapY = 80;
    const padding = 40;

    const maxFilesInLevel = Math.max(...[...levels.values()].map((l) => l.length));
    const levelCount = levels.size;

    const canvasW = Math.max(600, maxFilesInLevel * (boxW + gapX) + padding * 2);
    const canvasH = Math.max(400, levelCount * (boxH + gapY) + padding * 2);

    this.canvas.width = canvasW;
    this.canvas.height = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // TODO: 3. Малювати прямокутники (назва + #include)
    // TODO: 4. Малювати стрілки (з підписом "include")
    // TODO: 5. Скролінг працює автоматично
  }
}