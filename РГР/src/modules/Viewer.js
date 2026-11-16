export class Viewer {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.nodePositions = new Map();
    this.hoveredNodeId = null;
    this.lastNodes = [];
    this.theme = this.loadTheme();

    if (this.canvas) {
      this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
      this.canvas.addEventListener("mouseleave", () => {
        if (this.hoveredNodeId !== null) {
          this.hoveredNodeId = null;
          this.drawScene();
        }
      });
    }
  }

  loadTheme() {
    const target = this.canvas || document.documentElement;
    const styles = getComputedStyle(target);
    const getVar = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

    return {
      textLight: getVar("--text-light", "#F3E9EC"),
      textMuted: getVar("--text-muted", "#D3A7C0"),
      textHighlight: getVar("--text-highlight", "#FFFFFF"),

      cppBg: getVar("--node-cpp-bg", "#2E1F35"),
      cppBgHover: getVar("--node-cpp-bg-hover", "#3E2947"),
      cppBorder: getVar("--node-cpp-border", "#D3A7C0"),

      hBg: getVar("--node-h-bg", "#3A2242"),
      hBgHover: getVar("--node-h-bg-hover", "#4D2D57"),
      hBorder: getVar("--node-h-border", "#B47A9A"),

      extBg: getVar("--node-ext-bg", "#1F1225"),
      extBorder: getVar("--node-ext-border", "#82527D"),

      edgeColor: getVar("--edge-color", "rgba(180, 122, 154, 0.38)"),
      edgeColorDimmed: getVar("--edge-color-dimmed", "rgba(180, 122, 154, 0.08)"),
      edgeArrow: getVar("--edge-arrow", "rgba(180, 122, 154, 0.5)"),
      edgeArrowDimmed: getVar("--edge-arrow-dimmed", "rgba(180, 122, 154, 0.1)"),
      edgeHighlight: getVar("--edge-highlight", "#F3E9EC"),
      edgeLabelBg: getVar("--edge-label-bg", "#2E1F35"),
      edgeLabelBorder: getVar("--edge-label-border", "#B47A9A"),
    };
  }

  reset() {
    this.nodePositions.clear();
    this.hoveredNodeId = null;
    this.lastNodes = [];
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
    }
  }

  handleMouseMove(e) {
    if (!this.canvas || this.nodePositions.size === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundId = null;
    for (const [id, pos] of this.nodePositions.entries()) {
      if (
        mouseX >= pos.x &&
        mouseX <= pos.x + pos.w &&
        mouseY >= pos.y - 22 &&
        mouseY <= pos.y + pos.h
      ) {
        foundId = id;
        break;
      }
    }

    if (foundId !== this.hoveredNodeId) {
      this.hoveredNodeId = foundId;
      this.canvas.style.cursor = foundId ? "pointer" : "default";
      this.drawScene();
    }
  }

  render(fileNodes) {
    if (!this.canvas || !this.ctx || !fileNodes || fileNodes.length === 0) return;
    this.theme = this.loadTheme();
    this.lastNodes = fileNodes;
    this.hoveredNodeId = null;
    this.calculateLayout(fileNodes);
    this.drawScene();
    this.scrollToTopRow();
  }

  scrollToTopRow() {
    if (!this.canvas || this.nodePositions.size === 0) return;

    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;

    let minY = Infinity;
    let firstTopNodeX = Infinity;

    for (const pos of this.nodePositions.values()) {
      if (pos.y < minY) {
        minY = pos.y;
        firstTopNodeX = pos.x;
      } else if (Math.abs(pos.y - minY) < 5 && pos.x < firstTopNodeX) {
        firstTopNodeX = pos.x;
      }
    }

    if (Number.isFinite(firstTopNodeX)) {
      wrapper.scrollTop = 0;
      wrapper.scrollLeft = Math.max(0, firstTopNodeX - 50);
    }
  }

  calculateLayout(fileNodes) {
    const levels = new Map();
    for (const node of fileNodes) {
      const lvl = node.level ?? 0;
      if (!levels.has(lvl)) levels.set(lvl, []);
      levels.get(lvl).push(node);
    }

    const sortedLevels = [...levels.keys()].sort((a, b) => b - a);

    const orderIndex = new Map();
    sortedLevels.forEach((lvl, rowIdx) => {
      const row = levels.get(lvl);
      if (rowIdx === 0) {
        row.sort((a, b) =>
          a.isExternal === b.isExternal
            ? a.name.localeCompare(b.name)
            : a.isExternal
            ? 1
            : -1
        );
      } else {
        const prevRow = levels.get(sortedLevels[rowIdx - 1]);
        prevRow.forEach((n, idx) => orderIndex.set(n.id || n.name, idx));

        row.sort((a, b) => {
          if (a.isExternal !== b.isExternal) return a.isExternal ? 1 : -1;
          const getWeight = (node) => {
            const parents = prevRow.filter((p) =>
              (p.includes || []).includes(node.id || node.name)
            );
            if (parents.length === 0) return 9999;
            return (
              parents.reduce(
                (sum, p) => sum + (orderIndex.get(p.id || p.name) ?? 0),
                0
              ) / parents.length
            );
          };
          return getWeight(a) - getWeight(b);
        });
      }
    });

    const boxW = 210;
    const titleOffset = 24;
    const gapX = 45;
    const gapY = 120;
    const padding = 50;

    const rowHeights = new Map();
    for (const lvl of sortedLevels) {
      const nodesInRow = levels.get(lvl);
      const maxLines = Math.max(
        1,
        ...nodesInRow.map((n) => Math.min((n.displayLines || []).length, 5))
      );
      rowHeights.set(lvl, Math.max(54, maxLines * 17 + 22));
    }

    const maxFilesInLevel = Math.max(...[...levels.values()].map((l) => l.length));
    const totalBoxesHeight = [...rowHeights.values()].reduce(
      (acc, h) => acc + h + titleOffset,
      0
    );

    const canvasW = Math.max(800, maxFilesInLevel * (boxW + gapX) - gapX + padding * 2);
    const canvasH = Math.max(
      500,
      totalBoxesHeight + (sortedLevels.length - 1) * gapY + padding * 2
    );

    this.canvas.width = canvasW;
    this.canvas.height = canvasH;

    this.nodePositions.clear();
    let currentY = padding;

    sortedLevels.forEach((lvl) => {
      const nodesInRow = levels.get(lvl);
      const boxH = rowHeights.get(lvl);
      const rowWidth = nodesInRow.length * boxW + (nodesInRow.length - 1) * gapX;
      const startX = (canvasW - rowWidth) / 2;

      nodesInRow.forEach((node, colIndex) => {
        const x = startX + colIndex * (boxW + gapX);
        const boxY = currentY + titleOffset;
        this.nodePositions.set(node.id || node.name, {
          x,
          y: boxY,
          w: boxW,
          h: boxH,
          node,
        });
      });

      currentY += titleOffset + boxH + gapY;
    });
  }

  drawScene() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const hasHover = this.hoveredNodeId !== null;
    const activeNodes = new Set();
    const activeEdges = new Set();

    if (hasHover) {
      activeNodes.add(this.hoveredNodeId);

      const collectDependenciesDown = (nodeId) => {
        const pos = this.nodePositions.get(nodeId);
        if (!pos) return;
        for (const childId of pos.node.includes || []) {
          activeEdges.add(`${nodeId}->${childId}`);
          if (!activeNodes.has(childId)) {
            activeNodes.add(childId);
            collectDependenciesDown(childId);
          }
        }
      };

      const collectDependentsUp = (targetId) => {
        for (const [parentId, pos] of this.nodePositions.entries()) {
          if ((pos.node.includes || []).includes(targetId)) {
            activeEdges.add(`${parentId}->${targetId}`);
            if (!activeNodes.has(parentId)) {
              activeNodes.add(parentId);
              collectDependentsUp(parentId);
            }
          }
        }
      };

      collectDependenciesDown(this.hoveredNodeId);
      collectDependentsUp(this.hoveredNodeId);
    }

    const allEdges = [];

    for (const [parentId, parentPos] of this.nodePositions.entries()) {
      const dependencies = parentPos.node.includes || [];

      for (const childId of dependencies) {
        const childPos = this.nodePositions.get(childId);
        if (!childPos) continue;

        const isHighlighted =
          hasHover && activeEdges.has(`${parentId}->${childId}`);

        allEdges.push({ parentPos, childPos, isHighlighted, childId, parentId });
      }
    }

    const byChild = new Map();
    for (const edge of allEdges) {
      if (!byChild.has(edge.childId)) byChild.set(edge.childId, []);
      byChild.get(edge.childId).push(edge);
    }
    for (const list of byChild.values()) {
      list.sort((a, b) => a.parentPos.x - b.parentPos.x);
      list.forEach((edge, idx) => {
        edge.outIndex = idx;
        edge.outTotal = list.length;
      });
    }

    const byParent = new Map();
    for (const edge of allEdges) {
      if (!byParent.has(edge.parentId)) byParent.set(edge.parentId, []);
      byParent.get(edge.parentId).push(edge);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.childPos.x - b.childPos.x);
      list.forEach((edge, idx) => {
        edge.inIndex = idx;
        edge.inTotal = list.length;
      });
    }

    const normalEdges = allEdges.filter((e) => !e.isHighlighted);
    const highlightedEdges = allEdges.filter((e) => e.isHighlighted);

    for (const edge of normalEdges) {
      this.drawEdge(ctx, edge, false, hasHover, false);
    }

    for (const [id, pos] of this.nodePositions.entries()) {
      const dimmed = hasHover && !activeNodes.has(id);
      const highlighted = hasHover && id === this.hoveredNodeId;
      this.drawNode(ctx, pos.x, pos.y, pos.w, pos.h, pos.node, dimmed, highlighted);
    }

    for (const edge of highlightedEdges) {
      this.drawEdge(ctx, edge, true, hasHover, false);
    }

    const drawnLabels = [];
    for (const edge of highlightedEdges) {
      this.drawEdge(ctx, edge, true, hasHover, true, drawnLabels);
    }
  }

  drawEdge(ctx, edge, isHighlighted, hasHover, onlyLabel = false, drawnLabels = []) {
    const {
      childPos,
      parentPos,
      outIndex = 0,
      outTotal = 1,
      inIndex = 0,
      inTotal = 1,
    } = edge;
    const t = this.theme;
    const sameRow = Math.abs(parentPos.y - childPos.y) < 10;

    let startX, startY, endX, endY;
    if (sameRow) {
      startX = childPos.x + childPos.w / 2;
      startY = childPos.y + childPos.h;
      endX = parentPos.x + parentPos.w / 2;
      endY = parentPos.y + parentPos.h;
    } else {
      const outRatio = outTotal === 1 ? 0.5 : 0.2 + (0.65 * outIndex) / (outTotal - 1);
      const inRatio = inTotal === 1 ? 0.5 : 0.15 + (0.7 * inIndex) / (inTotal - 1);
      startX = childPos.x + childPos.w * outRatio;
      startY = childPos.y;
      endX = parentPos.x + parentPos.w * inRatio;
      endY = parentPos.y + parentPos.h + 2;
    }

    const headLen = isHighlighted ? 10 : 8;
    let cp1x, cp1y, cp2x, cp2y, angle;

    if (sameRow) {
      const arcDrop = 45;
      cp1x = startX;
      cp1y = startY + arcDrop;
      cp2x = endX;
      cp2y = endY + arcDrop;
      angle = -Math.PI / 2;
    } else {
      const distY = Math.abs(startY - endY);
      const handleOffset = Math.min(90, Math.max(40, distY * 0.45));
      cp1x = startX;
      cp1y = startY - handleOffset;
      cp2x = endX;
      cp2y = endY + handleOffset;
      angle = -Math.PI / 2;
    }

    ctx.save();

    if (onlyLabel) {
      if (!isHighlighted) {
        ctx.restore();
        return;
      }

      const labelW = 56;
      const labelH = 18;
      const candidates = sameRow ? [0.5] : [0.85, 0.72, 0.58, 0.44, 0.3];
      let chosenX = null;
      let chosenY = null;

      for (const tPos of candidates) {
        const invT = 1 - tPos;
        const lx =
          invT ** 3 * startX +
          3 * invT ** 2 * tPos * cp1x +
          3 * invT * tPos ** 2 * cp2x +
          tPos ** 3 * endX;
        const ly =
          invT ** 3 * startY +
          3 * invT ** 2 * tPos * cp1y +
          3 * invT * tPos ** 2 * cp2y +
          tPos ** 3 * endY;

        const overlaps = drawnLabels.some(
          (box) =>
            Math.abs(box.x - lx) < labelW + 4 &&
            Math.abs(box.y - ly) < labelH + 4
        );

        if (!overlaps) {
          chosenX = lx;
          chosenY = ly;
          break;
        }
      }

      if (chosenX !== null) {
        drawnLabels.push({ x: chosenX, y: chosenY });

        ctx.fillStyle = t.edgeLabelBg;
        ctx.strokeStyle = t.edgeLabelBorder;
        ctx.lineWidth = 1;
        ctx.fillRect(chosenX - labelW / 2, chosenY - labelH / 2, labelW, labelH);
        ctx.strokeRect(chosenX - labelW / 2, chosenY - labelH / 2, labelW, labelH);

        ctx.fillStyle = t.edgeHighlight;
        ctx.font = "600 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("#include", chosenX, chosenY);
      }

      ctx.restore();
      return;
    }

    const arrowHeight = headLen * Math.cos(Math.PI / 6);
    const lineEndX = endX - arrowHeight * Math.cos(angle);
    const lineEndY = endY - arrowHeight * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, lineEndX, lineEndY);

    if (isHighlighted) {
      ctx.strokeStyle = t.edgeHighlight;
      ctx.lineWidth = 2.2;
    } else if (hasHover) {
      ctx.strokeStyle = t.edgeColorDimmed;
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = t.edgeColor;
      ctx.lineWidth = 1.3;
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLen * Math.cos(angle - Math.PI / 6),
      endY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLen * Math.cos(angle + Math.PI / 6),
      endY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = isHighlighted
      ? t.edgeHighlight
      : hasHover
      ? t.edgeArrowDimmed
      : t.edgeArrow;
    ctx.fill();

    ctx.restore();
  }

  drawNode(ctx, x, y, w, h, node, dimmed, highlighted) {
    const t = this.theme;
    ctx.save();
    if (dimmed) ctx.globalAlpha = 0.3;

    ctx.fillStyle = highlighted ? t.textHighlight : t.textLight;
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const title = node.isExternal ? node.name : node.path || node.name;
    ctx.fillText(this.truncateText(ctx, title, w), x, y - 6);

    ctx.beginPath();
    ctx.rect(x, y, w, h);

    if (node.isExternal) {
      ctx.fillStyle = t.extBg;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = highlighted ? t.edgeHighlight : t.extBorder;
    } else if (node.name.endsWith(".h") || node.name.endsWith(".hpp")) {
      ctx.fillStyle = highlighted ? t.hBgHover : t.hBg;
      ctx.strokeStyle = highlighted ? t.edgeHighlight : t.hBorder;
    } else {
      ctx.fillStyle = highlighted ? t.cppBgHover : t.cppBg;
      ctx.strokeStyle = highlighted ? t.edgeHighlight : t.cppBorder;
    }

    ctx.fill();
    ctx.lineWidth = highlighted ? 2.5 : 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    const lines = node.displayLines || [];
    const maxVisible = 5;
    ctx.font = "400 11px Consolas, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    lines.slice(0, maxVisible).forEach((line, idx) => {
      ctx.fillStyle = node.isExternal ? t.textMuted : t.textLight;
      ctx.fillText(this.truncateText(ctx, line, w - 16), x + 8, y + 8 + idx * 17);
    });

    if (lines.length > maxVisible) {
      ctx.fillStyle = t.hBorder;
      ctx.fillText(
        `... ще ${lines.length - maxVisible}`,
        x + 8,
        y + 8 + maxVisible * 17
      );
    }

    ctx.restore();
  }

  truncateText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while (
      ctx.measureText(truncated + "...").width > maxWidth &&
      truncated.length > 0
    ) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + "...";
  }
}