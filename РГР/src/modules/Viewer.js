export class Viewer {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
  }

  reset() {
    if (!this.canvas || !this.ctx) return;
    this.canvas.width = 0;
    this.canvas.height = 0;
  }

  // Розбиває текст на рядки за шириною прямокутника
  wrapText(ctx, text, maxWidth) {
    const words = text.split(/,\s*/);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? currentLine + ", " + word : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  render(fileNodes) {
    if (!this.canvas || !this.ctx || !fileNodes || fileNodes.length === 0) return;

    const ctx = this.ctx;

    const levels = new Map();
    for (const node of fileNodes) {
      if (!levels.has(node.level)) levels.set(node.level, []);
      levels.get(node.level).push(node);
    }

    const boxW = 260;
    const gapX = 40;
    const gapY = 80;
    const padding = 40;
    const lineHeight = 14;

    const nodeHeights = new Map();
    for (const node of fileNodes) {
      const includesText = node.includes.length > 0
        ? node.includes.join(", ")
        : "(no includes)";
      const lines = this.wrapText(ctx, includesText, boxW - 16);
      const h = 22 + lines.length * lineHeight + 8;
      nodeHeights.set(node.name, { h, lines });
    }

    const maxFilesInLevel = Math.max(...[...levels.values()].map((l) => l.length));
    const levelCount = levels.size;

    const canvasW = Math.max(600, maxFilesInLevel * (boxW + gapX) + padding * 2);
    const canvasH = Math.max(400, levelCount * (200 + gapY) + padding * 2);

    this.canvas.width = canvasW;
    this.canvas.height = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);

    const positions = new Map();
    const sortedLevels = [...levels.keys()].sort((a, b) => a - b);

    for (const level of sortedLevels) {
      const nodes = levels.get(level);
      const boxHs = nodes.map((n) => nodeHeights.get(n.name).h);
      const maxH = Math.max(...boxHs);
      const y = canvasH - padding - level * (maxH + gapY) - maxH;
      const totalW = nodes.length * (boxW + gapX) - gapX;
      const startX = (canvasW - totalW) / 2;

      nodes.forEach((node, i) => {
        const x = startX + i * (boxW + gapX);
        const { h, lines } = nodeHeights.get(node.name);
        positions.set(node.name, { x, y, w: boxW, h });

        ctx.strokeStyle = "#82527D";
        ctx.lineWidth = 2;
        ctx.fillStyle = "#2C1B2F";
        ctx.fillRect(x, y, boxW, h);
        ctx.strokeRect(x, y, boxW, h);

        ctx.fillStyle = "#F3E9EC";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.name, x + boxW / 2, y + 16);

        ctx.font = "11px system-ui, sans-serif";
        ctx.fillStyle = "#D3A7C0";
        lines.forEach((line, idx) => {
          ctx.fillText(line, x + boxW / 2, y + 32 + idx * lineHeight);
        });
      });
    }

    // TODO: 4. Малювати стрілки (з підписом "include")
  }
}