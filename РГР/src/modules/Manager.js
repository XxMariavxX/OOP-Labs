export class Manager {
  constructor(analysis, viewer) {
    this.analysis = analysis;
    this.viewer = viewer;

    this.folderInput = document.getElementById("folderInput");
    this.status = document.getElementById("status");

    this.initEv();
  }

  initEv() {
    this.initPicker();

    if (this.folderInput) {
      this.folderInput.addEventListener("change", async (e) => {
        if (this.status) this.status.textContent = "Читання файлів...";
        if (this.viewer) this.viewer.reset();

        let files = [];
        const raw = e.target.files || [];
        for (let i = 0; i < raw.length; i++) {
          const f = raw[i];
          if (/\.(cpp|h|rc)$/i.test(f.name)) files.push(f);
        }

        const folderName = files.length > 0 && files[0].webkitRelativePath
          ? files[0].webkitRelativePath.split("/")[0]
          : (files.length > 0 ? files[0].name : "");

        await this.processFiles(files, folderName);
      });
    }
  }

  initPicker() {
    const pickBtn = document.getElementById("pickBtn");
    if (!pickBtn) return;

    pickBtn.addEventListener("click", async () => {
      if (!window.showDirectoryPicker) {
        this.folderInput.click();
        return;
      }

      let dirHandle;
      try {
        dirHandle = await window.showDirectoryPicker();
      } catch (err) {
        return; // користувач скасував вибір
      }

      if (this.status) this.status.textContent = "Читання файлів...";
      if (this.viewer) this.viewer.reset();
      this.scanned = 0;
      const files = [];
      try {
        await this.collectHandle(dirHandle, files);
      } catch (err) {
        if (this.status) this.status.textContent = `Помилка: ${err && err.message ? err.message : err}`;
        return;
      }

      await this.processFiles(files, dirHandle.name);
    });
  }

  async collectHandle(dirHandle, files) {
    for await (const handle of dirHandle.values()) {
      if (++this.scanned % 500 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
      if (handle.kind === "directory") {
        await this.collectHandle(handle, files);
      } else if (/\.(cpp|h|rc)$/i.test(handle.name)) {
        files.push(await handle.getFile());
      }
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

      await this.analysis.finder(files, (msg) => {
        if (this.status) this.status.textContent = msg;
      });

      if (this.status) {
        this.status.textContent = `Папка "${folderName}":   C++ файлів ${this.analysis.cppFilesCount}`;
      }

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