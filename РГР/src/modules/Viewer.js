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
    const gapY = 30;       // gap between rows within a level
    const levelGapY = 50;  // gap between levels
    const padding = 40;
    const lineHeight = 14;
    const perRow = 8;      // max nodes per row (wraps levels into multiple rows)

    const nodeHeights = new Map();
    for (const node of fileNodes) {
      const includesText = node.includes.length > 0
        ? node.includes.join(", ")
        : "(no includes)";
      const lines = this.wrapText(ctx, includesText, boxW - 16);
      const h = 22 + lines.length * lineHeight + 8;
      nodeHeights.set(node.name, { h, lines });
    }

    const sortedLevels = [...levels.keys()].sort((a, b) => a - b);
    const positions = new Map();

    // First pass: compute canvas size
    let totalHeight = padding * 2;
    let maxRowWidth = 0;
    const levelLayouts = new Map(); // level -> array of rows, each row = array of nodes

    for (const level of sortedLevels) {
      const nodes = levels.get(level);
      const rows = [];
      for (let i = 0; i < nodes.length; i += perRow) {
        rows.push(nodes.slice(i, i + perRow));
      }
      levelLayouts.set(level, rows);

      const levelH = rows.length * (nodeHeights.get(nodes[0].name).h + gapY) - gapY;
      totalHeight += levelH + levelGapY;
      for (const row of rows) {
        const w = row.length * (boxW + gapX) - gapX;
        if (w > maxRowWidth) maxRowWidth = w;
      }
    }
    totalHeight -= levelGapY; // remove trailing gap
    const canvasW = Math.max(600, maxRowWidth + padding * 2);
    const canvasH = Math.max(400, totalHeight);

    this.canvas.width = canvasW;
    this.canvas.height = canvasH;
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Second pass: draw, bottom-up
    let currentY = canvasH - padding;
    for (let li = sortedLevels.length - 1; li >= 0; li--) {
      const level = sortedLevels[li];
      const rows = levelLayouts.get(level);
      // draw rows from bottom up within level
      for (let r = rows.length - 1; r >= 0; r--) {
        const row = rows[r];
        const rowH = Math.max(...row.map((n) => nodeHeights.get(n.name).h));
        const y = currentY - rowH;
        const totalW = row.length * (boxW + gapX) - gapX;
        const startX = (canvasW - totalW) / 2;

        row.forEach((node, i) => {
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

        currentY = y - gapY;
      }
      currentY -= levelGapY - gapY;
    }

    // 4. Стрілки
    ctx.strokeStyle = "#9E6898";
    ctx.fillStyle = "#9E6898";
    ctx.lineWidth = 1.5;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";

    for (const node of fileNodes) {
      const from = positions.get(node.name);
      if (!from) continue;

      for (const inc of node.includes) {
        const to = positions.get(inc);
        if (!to) continue;

        const x1 = from.x + from.w / 2;
        const y1 = from.y;
        const x2 = to.x + to.w / 2;
        const y2 = to.y + to.h;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 8;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - arrowSize * Math.cos(angle - Math.PI / 6),
          y2 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - arrowSize * Math.cos(angle + Math.PI / 6),
          y2 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#D3A7C0";
        ctx.fillText("include", (x1 + x2) / 2, (y1 + y2) / 2 - 4);
        ctx.fillStyle = "#9E6898";
      }
    }
  }
}