export class Viewer {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.nodePositions = new Map();
    this.hoveredNodeId = null;
    this.pointerPos = { x: 0, y: 0 };
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
      window.addEventListener("resize", () => this.handleResize());
    }
  }

  loadTheme() {
    const target = this.canvas || document.documentElement;
    const styles = getComputedStyle(target);
    const getVar = (name, fallback) =>
      styles.getPropertyValue(name).trim() || fallback;

    return {
      textLight: getVar("--text-light", "#C0B2B2"),
      textMuted: getVar("--text-muted", "#A5878F"),
      textHighlight: getVar("--text-highlight", "#C0B2B2"),

      cppBg: getVar("--node-cpp-bg", "#4B2A53"),
      cppBgHover: getVar("--node-cpp-bg-hover", "#6E4468"),
      cppBorder: getVar("--node-cpp-border", "#896378"),

      hBg: getVar("--node-h-bg", "#6E4468"),
      hBgHover: getVar("--node-h-bg-hover", "#896378"),
      hBorder: getVar("--node-h-border", "#A5878F"),

      extBg: getVar("--node-ext-bg", "#271637"),
      extBorder: getVar("--node-ext-border", "#896378"),

      edgeColor: getVar("--edge-color", "rgba(165, 135, 143, 0.38)"),
      edgeColorDimmed: getVar("--edge-color-dimmed", "rgba(165, 135, 143, 0.08)"),
      edgeArrow: getVar("--edge-arrow", "rgba(165, 135, 143, 0.5)"),
      edgeArrowDimmed: getVar("--edge-arrow-dimmed", "rgba(165, 135, 143, 0.1)"),
      edgeHighlight: getVar("--edge-highlight", "#C0B2B2"),
      edgeLabelBg: getVar("--edge-label-bg", "#271637"),
      edgeLabelBorder: getVar("--edge-label-border", "#A5878F"),
    };
  }

  reset() {
    this.nodePositions.clear();
    this.hoveredNodeId = null;
    this.lastNodes = [];
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas.style.cursor = "default";
    }
  }

  handleMouseMove(e) {
    if (!this.canvas || this.nodePositions.size === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    this.pointerPos = { x: mouseX, y: mouseY };

    let foundId = null;
    for (const [id, pos] of this.nodePositions.entries()) {
      if (
        mouseX >= pos.x &&
        mouseX <= pos.x + pos.w &&
        mouseY >= pos.y &&
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
    } else if (foundId !== null) {
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
    this.scrollToBottomRow();
  }

  handleResize() {
    if (!this.canvas || !this.ctx || this.lastNodes.length === 0) return;
    this.hoveredNodeId = null;
    this.canvas.style.cursor = "default";
    this.calculateLayout(this.lastNodes);
    this.drawScene();
  }

  scrollToBottomRow() {
    if (!this.canvas || this.nodePositions.size === 0) return;
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;

    const targetScrollTop = Math.max(
      0,
      this.canvas.height - wrapper.clientHeight - 40
    );
    wrapper.scrollTop = targetScrollTop;
    wrapper.scrollLeft = Math.max(
      0,
      (this.canvas.width - wrapper.clientWidth) / 2
    );
  }

  getNodeKind(node) {
    if (node.isExternal) return "ext";
    if (/\.(h|hpp)$/i.test(node.name)) return "h";
    if (/\.rc$/i.test(node.name)) return "rc";
    return "cpp";
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

    const wrapper = this.canvas.parentElement;
    const viewW = wrapper ? wrapper.clientWidth : 0;
    const viewH = wrapper ? wrapper.clientHeight : 0;

    const scaleX = Math.min(1, Math.max(0.55, viewW / 1100));
    const scaleY = Math.min(1, Math.max(0.5, viewH / 800));
    const boxScale = Math.min(1, Math.max(0.62, viewW / 1000));

    const boxW = Math.round(228 * boxScale);
    const headerH = Math.round(28 * Math.max(0.85, boxScale));
    const lineH = Math.round(16 * Math.max(0.875, boxScale));
    const maxVisibleLines = 5;
    const gapX = Math.round(40 * scaleX);
    const baseGapY = 100;
    const topPadding = 56;
    const bottomPadding = 130;

    const rowHeights = new Map();
    for (const lvl of sortedLevels) {
      const nodesInRow = levels.get(lvl);
      const maxLines = Math.max(
        1,
        ...nodesInRow.map((n) =>
          Math.min((n.displayLines || []).length || 1, maxVisibleLines + 1)
        )
      );
      rowHeights.set(lvl, headerH + maxLines * lineH + 22);
    }

    const maxFilesInLevel = Math.max(
      1,
      ...[...levels.values()].map((l) => l.length)
    );
    const gapY = Math.round(
      (baseGapY + Math.max(0, maxFilesInLevel - 3) * 8) * scaleY
    );
    const totalBoxesHeight = [...rowHeights.values()].reduce(
      (acc, h) => acc + h,
      0
    );

    const canvasW = Math.max(
      viewW,
      800,
      maxFilesInLevel * (boxW + gapX) - gapX + topPadding * 2
    );
    const canvasH = Math.max(
      viewH,
      500,
      totalBoxesHeight +
        Math.max(0, sortedLevels.length - 1) * gapY +
        topPadding +
        bottomPadding
    );

    this.canvas.width = canvasW;
    this.canvas.height = canvasH;

    this.nodePositions.clear();
    let currentY = topPadding;

    sortedLevels.forEach((lvl) => {
      const nodesInRow = levels.get(lvl);
      const boxH = rowHeights.get(lvl);
      const rowWidth = nodesInRow.length * boxW + (nodesInRow.length - 1) * gapX;
      const startX = (canvasW - rowWidth) / 2;

      nodesInRow.forEach((node, colIndex) => {
        const x = startX + colIndex * (boxW + gapX);
        this.nodePositions.set(node.id || node.name, {
          x,
          y: currentY,
          w: boxW,
          h: boxH,
          headerH,
          lineH,
          maxVisibleLines,
          node,
        });
      });

      currentY += boxH + gapY;
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
      for (const childId of parentPos.node.includes || []) {
        const childPos = this.nodePositions.get(childId);
        if (!childPos) continue;
        const isHighlighted = hasHover && activeEdges.has(`${parentId}->${childId}`);
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
      this.drawNode(ctx, pos, dimmed, highlighted);
    }

    for (const edge of highlightedEdges) {
      this.drawEdge(ctx, edge, true, hasHover, false);
    }

    const drawnLabels = [];
    for (const edge of highlightedEdges) {
      this.drawEdge(ctx, edge, true, hasHover, true, drawnLabels);
    }

    if (hasHover) {
      const pos = this.nodePositions.get(this.hoveredNodeId);
      if (pos && (pos.node.displayLines || []).length > pos.maxVisibleLines) {
        const hidden = (pos.node.displayLines || []).slice(pos.maxVisibleLines);
        this.drawTooltip(ctx, pos.node, hidden);
      }
    }
  }

  getSpreadRatio(index, total) {
    if (total <= 1) return 0.5;
    return 0.14 + (0.72 * index) / (total - 1);
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
      startX = childPos.x + childPos.w * this.getSpreadRatio(outIndex, outTotal);
      startY = childPos.y + childPos.h;
      endX = parentPos.x + parentPos.w * this.getSpreadRatio(inIndex, inTotal);
      endY = parentPos.y + parentPos.h;
    } else {
      startX = childPos.x + childPos.w * this.getSpreadRatio(outIndex, outTotal);
      startY = childPos.y;
      endX = parentPos.x + parentPos.w * this.getSpreadRatio(inIndex, inTotal);
      endY = parentPos.y + parentPos.h + 2;
    }

    const headLen = isHighlighted ? 10 : 8;
    const distY = Math.abs(startY - endY);
    const handleOffset = sameRow
      ? 40
      : Math.min(80, Math.max(18, distY * 0.4));
    const cp1x = startX;
    const cp1y = sameRow ? startY + handleOffset : startY - handleOffset;
    const cp2x = endX;
    const cp2y = sameRow ? endY + handleOffset : endY + handleOffset;
    const angle = -Math.PI / 2;

    ctx.save();

    if (onlyLabel) {
      if (!isHighlighted) {
        ctx.restore();
        return;
      }

      const labelW = 58;
      const labelH = 18;
      const candidates = sameRow ? [0.5] : [0.84, 0.7, 0.56, 0.42, 0.28];
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
            Math.abs(box.x - lx) < labelW + 6 &&
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

        this.roundRectPath(
          ctx,
          chosenX - labelW / 2,
          chosenY - labelH / 2,
          labelW,
          labelH,
          4
        );
        ctx.fillStyle = t.edgeLabelBg;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = t.edgeLabelBorder;
        ctx.stroke();

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

  drawNode(ctx, pos, dimmed, highlighted) {
    const { x, y, w, h, headerH, lineH, maxVisibleLines, node } = pos;
    const t = this.theme;
    const kind = this.getNodeKind(node);

    ctx.save();
    if (dimmed) ctx.globalAlpha = 0.28;

    let bg = t.cppBg;
    let border = t.cppBorder;

    if (kind === "ext") {
      bg = t.extBg;
      border = t.extBorder;
    } else if (kind === "h") {
      bg = highlighted ? t.hBgHover : t.hBg;
      border = t.hBorder;
    } else if (kind === "rc") {
      bg = highlighted ? t.cppBgHover : t.cppBg;
      border = t.hBorder;
    } else {
      bg = highlighted ? t.cppBgHover : t.cppBg;
    }

    this.roundRectPath(ctx, x, y, w, h, 8);
    ctx.fillStyle = bg;
    ctx.fill();

    if (kind === "ext") {
      ctx.setLineDash([5, 4]);
    }
    ctx.lineWidth = highlighted ? 2.4 : 1.5;
    ctx.strokeStyle = highlighted ? t.edgeHighlight : border;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(x + 1, y + headerH);
    ctx.lineTo(x + w - 1, y + headerH);
    ctx.strokeStyle = "rgba(192, 178, 178, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const title = node.name;
    const maxTitleW = Math.max(40, w - 20);
    ctx.fillStyle = highlighted ? t.textHighlight : t.textLight;
    ctx.font = "700 12.5px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      this.truncateText(ctx, title, maxTitleW),
      x + 10,
      y + headerH / 2 + 0.5
    );

    const lines =
      node.displayLines && node.displayLines.length > 0
        ? node.displayLines
        : ["(немає #include)"];
    const visible = lines.slice(0, maxVisibleLines);
    const remaining = lines.length - visible.length;
    const bodyStartY = y + headerH + 8;

    ctx.font = "400 11px Consolas, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    visible.forEach((line, idx) => {
      ctx.fillStyle = kind === "ext" ? t.textMuted : t.textLight;
      ctx.fillText(
        this.truncateText(ctx, line, w - 20),
        x + 10,
        bodyStartY + idx * lineH
      );
    });

    if (remaining > 0) {
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.fillStyle = t.edgeHighlight;
      ctx.fillText(
        `… ще ${remaining}`,
        x + 10,
        bodyStartY + visible.length * lineH
      );
    }

    ctx.restore();
  }

  drawTooltip(ctx, node, lines) {
    const t = this.theme;
    const font = "400 11px Consolas, monospace";
    const lineH = 16;
    const padX = 10;
    const padY = 8;
    const titleH = 20;

    ctx.save();
    ctx.font = font;
    let textW = ctx.measureText(node.name).width;
    for (const line of lines) {
      textW = Math.max(textW, ctx.measureText(line).width);
    }

    const boxW = textW + padX * 2;
    const boxH = titleH + lines.length * lineH + padY * 2;

    let x = this.pointerPos.x + 16;
    let y = this.pointerPos.y + 16;
    if (x + boxW > this.canvas.width - 10) x = this.pointerPos.x - boxW - 16;
    if (y + boxH > this.canvas.height - 10) y = this.canvas.height - boxH - 10;
    if (x < 0) x = 10;
    if (y < 0) y = 10;

    this.roundRectPath(ctx, x, y, boxW, boxH, 6);
    ctx.fillStyle = t.edgeLabelBg;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = t.edgeLabelBorder;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = t.textHighlight;
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(node.name, x + padX, y + padY);

    ctx.font = font;
    lines.forEach((line, idx) => {
      ctx.fillStyle = t.textLight;
      ctx.fillText(line, x + padX, y + padY + titleH + idx * lineH);
    });

    ctx.restore();
  }

  roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
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