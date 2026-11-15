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
        await new Promise((r) => setTimeout(r, 200));

        let files = [];
        const raw = e.target.files || [];
        for (let i = 0; i < raw.length; i++) {
          const f = raw[i];
          if (/\.(cpp|h|rc)$/i.test(f.name)) files.push(f);
        }

        if (files.length === 0 && e.target.webkitEntries && e.target.webkitEntries.length > 0) {
          const collected = [];
          for (const entry of e.target.webkitEntries) {
            await this.traverseFileTree(entry, collected);
          }
          files = collected;
        }

        const folderName = files.length > 0 && files[0].webkitRelativePath
          ? files[0].webkitRelativePath.split("/")[0]
          : (files.length > 0 ? files[0].name : "");

        await this.processFiles(files, folderName);
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
        const handles = Array.from(e.dataTransfer.items || [])
          .filter((item) => item.kind === "file")
          .map((item) => ({
            entry: item.webkitGetAsEntry ? item.webkitGetAsEntry() : null,
            file: item.getAsFile(),
          }));
        const folderName = handles[0] && handles[0].entry ? handles[0].entry.name : "";
        const files = [];

        if (this.status) this.status.textContent = "Читання файлів...";
        await new Promise((r) => setTimeout(r, 50));

        try {
          for (const { entry, file } of handles) {
            if (entry) {
              await this.traverseFileTree(entry, files);
            } else if (file) {
              files.push(file);
            }
          }
        } catch (err) {
          if (this.status) {
            this.status.textContent = `Помилка: ${err && err.message ? err.message : err}`;
          }
          console.error("traverse error:", err);
          return;
        }

        await this.processFiles(files, folderName);
      });
    });
  }

  async traverseFileTree(item, files) {
    if (item.isFile) {
      const name = item.name || "";
      if (!/\.(cpp|h|rc)$/i.test(name)) {
        return; // пропускаємо непотрібні файли
      }
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

  async processFiles(files, folderName = "") {
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
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 100)));

      await this.analysis.finder(files);

      if (this.status) {
        this.status.textContent = `Папка "${folderName}": C++ файлів ${this.analysis.cppFilesCount}`;
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
      if (this.viewer) this.viewer.reset();
      console.error("processFiles error:", err);
    }
  }
}