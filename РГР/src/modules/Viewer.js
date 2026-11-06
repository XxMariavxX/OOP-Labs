export class Viewer {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
  }

  render(hierarchy) {
    if (!this.canvas || !this.ctx) return;

    const files = Array.isArray(hierarchy) ? hierarchy : [];
    const wrapper = this.canvas.parentElement;
    const width = (wrapper && wrapper.clientWidth) || 800;
    const height = Math.max(200, files.length * 18 + 40);

    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#F3E9EC";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillText(`Знайдено C++ файлів: ${files.length}`, 20, 24);

    ctx.font = "14px system-ui, sans-serif";
    files.forEach((file, i) => {
      ctx.fillText(file.name, 20, 48 + i * 18);
    });
  }
}