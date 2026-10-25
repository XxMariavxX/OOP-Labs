export class Manager {
  constructor(analysis, viewer) {
    this.analysis = analysis;
    this.viewer = viewer;

    this.dropArea = document.getElementById("canvasWrapper");
    this.dropZone = document.getElementById("dropZone");
    this.folderInput = document.getElementById("folderInput");
    this.status = document.getElementById("status");

    this.initEv();
  }

  initEv() {
    if (this.folderInput) {
      this.folderInput.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files);
        await this.processFiles(files);
      });
    }

    const targetZone = this.dropArea || this.dropZone;

    if (targetZone) {
      targetZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (this.dropZone) this.dropZone.classList.add("dropzone--active");
      });

      targetZone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        if (this.dropZone) this.dropZone.classList.remove("dropzone--active");
      });

      targetZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        if (this.dropZone) this.dropZone.classList.remove("dropzone--active");

        const items = Array.from(e.dataTransfer.items || []);
        const files = [];

        for (const item of items) {
          if (item.kind === "file") {
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry) {
              await this.traverseFileTree(entry, files);
            } else {
              const file = item.getAsFile();
              if (file) files.push(file);
            }
          }
        }

        await this.processFiles(files);
      });
    }
  }

  traverseFileTree(item, files) {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file) => {
          files.push(file);
          resolve();
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries(async (entries) => {
          for (const entry of entries) {
            await this.traverseFileTree(entry, files);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async processFiles(files) {
    if (!files || files.length === 0) {
      if (this.status) {
        this.status.textContent = "Помилка: Файли не обрано або папка порожня";
      }
      return;
    }

    if (this.status) this.status.textContent = "Обробка...";

    const hierarchy = this.analysis.finder(files);

    if (this.status) {
      this.status.textContent = `Проаналізовано C++ файлів: ${this.analysis.cppFilesCount}`;
    }

    if (this.dropZone) {
      this.dropZone.classList.add("dropzone--hidden");
    }

    if (this.viewer) {
      this.viewer.render(hierarchy);
    }
  }
}