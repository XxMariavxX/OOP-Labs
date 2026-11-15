export class Analysis {
  constructor() {
    this.files = [];
    this.cppFilesCount = 0;
    this.fileNodes = [];
    this.dependencies = new Map();
  }

  async parseFiles(files, onProgress) {
    const fileNodes = [];
    const fileMap = new Map();

    const filtered = files.filter(
      (f) =>
        f.name.endsWith(".cpp") ||
        f.name.endsWith(".h") ||
        f.name.endsWith(".rc")
    );

    const total = filtered.length;
    const BATCH = 50;
    for (let i = 0; i < filtered.length; i += BATCH) {
      const batch = filtered.slice(i, i + BATCH);
      for (const file of batch) {
        let text;
        try {
          text = await file.text();
        } catch (err) {
          throw new Error(`Не вдалося прочитати файл "${file.name}": ${err && err.message ? err.message : err}`);
        }
        const includes = [];
        const regex = /#include\s+["<]([^">]+)[">]/g;
        let match;
        try {
          while ((match = regex.exec(text)) !== null) {
            includes.push(match[1]);
          }
        } catch (err) {
          throw new Error(`Помилка аналізу файлу "${file.name}": ${err && err.message ? err.message : err}`);
        }

        const node = { name: file.name, includes, level: 0 };
        fileNodes.push(node);
        fileMap.set(file.name, node);
      }
      if (onProgress) onProgress(`Читання файлів: ${Math.min(i + BATCH, total)}/${total}`);
      await new Promise((r) => setTimeout(r, 0));
    }

    this.dependencies.clear();
    for (const node of fileNodes) {
      this.dependencies.set(node.name, node.includes);
    }

    return { fileNodes, fileMap };
  }

  calculateLevels(fileNodes, fileMap) {
    const done = new Set();
    const visiting = new Set();
    const levelCache = new Map();

    const getLevel = (name) => {
      if (done.has(name)) return levelCache.get(name) ?? 0;
      if (visiting.has(name)) return 0; // цикл: не заглиблюємось

      const node = fileMap.get(name);
      if (!node) return 0;
      if (node.includes.length === 0) {
        node.level = 0;
        done.add(name);
        levelCache.set(name, 0);
        return 0;
      }

      visiting.add(name);
      let maxLevel = -1;
      for (const inc of node.includes) {
        const incNode = fileMap.get(inc);
        if (incNode) {
          const lvl = getLevel(inc);
          if (lvl > maxLevel) maxLevel = lvl;
        }
      }
      visiting.delete(name);

      node.level = maxLevel + 1;
      done.add(name);
      levelCache.set(name, node.level);
      return node.level;
    };

    for (const node of fileNodes) {
      getLevel(node.name);
    }

    return fileNodes;
  }

  async finder(files, onProgress) {
    if (!files) throw new Error("Список файлів порожній.");

    this.fileNodes = [];
    this.dependencies.clear();
    this.files = Array.from(files);

    const cppFiles = this.files.filter(
      (f) =>
        f.name.endsWith(".cpp") ||
        f.name.endsWith(".h") ||
        f.name.endsWith(".rc")
    );

    this.cppFilesCount = cppFiles.length;

    if (cppFiles.length === 0) {
      throw new Error("Не знайдено C++ файлів (.cpp, .h, .rc).");
    }

    let result;
    try {
      result = await this.parseFiles(this.files, onProgress);
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }

    try {
      this.fileNodes = this.calculateLevels(result.fileNodes, result.fileMap);
    } catch (err) {
      throw new Error(`Помилка побудови графа залежностей: ${err && err.message ? err.message : err}`);
    }

    return this.fileNodes;
  }
}