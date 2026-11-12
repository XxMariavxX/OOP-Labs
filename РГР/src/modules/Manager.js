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
        if (this.status) this.status.textContent = "Читання файлів...";
        // yield, щоб браузер встиг показати повідомлення
        await new Promise((r) => setTimeout(r, 50));
        let files = Array.from(e.target.files || []);

        // Fallback: якщо браузер не повернув файлів через webkitdirectory,
        // використовуємо webkitEntries (рекурсивний обхід)
        if (files.length === 0 && e.target.webkitEntries && e.target.webkitEntries.length > 0) {
          const collected = [];
          for (const entry of e.target.webkitEntries) {
            await this.traverseFileTree(entry, collected);
          }
          files = collected;
        }

        await this.processFiles(files);
      });
    }

    const zones = [this.dropZone, this.dropArea].filter(Boolean);

    zones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (this.dropZone) this.dropZone.classList.add("dropzone--active");
      });

      zone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        if (this.dropZone) this.dropZone.classList.remove("dropzone--active");
      });

      zone.addEventListener("drop", async (e) => {
        e.preventDefault();
        if (this.dropZone) this.dropZone.classList.remove("dropzone--active");

        const items = Array.from(e.dataTransfer.items || []);
        const files = [];

        if (this.status) this.status.textContent = "Читання файлів...";
        await new Promise((r) => setTimeout(r, 50));

        try {
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
        } catch (err) {
          if (this.status) {
            this.status.textContent = `Помилка: ${err && err.message ? err.message : err}`;
          }
          console.error("traverse error:", err);
          return;
        }

        await this.processFiles(files);
      });
    });
  }

  async traverseFileTree(item, files) {
    if (item.isFile) {
      return new Promise((resolve, reject) => {
        item.file(
          (file) => {
            files.push(file);
            resolve();
          },
          (err) => reject(new Error(`Не вдалося прочитати файл "${item.name}": ${err && err.message ? err.message : err}`))
        );
      });
    }

    if (item.isDirectory) {
      const dirReader = item.createReader();
      const readBatch = () =>
        new Promise((res, rej) => {
          dirReader.readEntries(res, rej);
        });
      let entries = await readBatch();
      while (entries && entries.length > 0) {
        for (const entry of entries) {
          await this.traverseFileTree(entry, files);
        }
        entries = await readBatch();
      }
      return;
    }
  }

  async processFiles(files) {
    if (this.viewer) this.viewer.reset();
    try {
      const cppFiles = (files || []).filter(
        (f) =>
          f.name.endsWith(".cpp") ||
          f.name.endsWith(".h") ||
          f.name.endsWith(".rc")
      );

      if (cppFiles.length === 0) {
        throw new Error("Папка порожня або не містить C++ файлів (.cpp, .h, .rc).");
      }

      if (this.status) this.status.textContent = `Обробка... (знайдено файлів: ${files.length})`;
      await new Promise((r) => setTimeout(r, 50));

      await this.analysis.finder(files);

      if (this.status) {
        this.status.textContent = `Проаналізовано C++ файлів: ${this.analysis.cppFilesCount}`;
      }

      if (this.status) this.status.textContent = "Відображення...";
      await new Promise((r) => setTimeout(r, 0));

      if (this.viewer) {
        this.viewer.render(this.analysis.fileNodes);
      }
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      if (this.status) {
        this.status.textContent = `Помилка: ${message}`;
      }
      console.error("processFiles error:", err);
    }
  }
}