export class Analysis {
  constructor() {
    this.files = [];
    this.cppFilesCount = 0;
    this.fileNodes = [];
    this.dependencies = new Map();
  }

  async parseFiles(files) {
    const fileNodes = [];
    const fileMap = new Map();

    const filtered = files.filter(
      (f) =>
        f.name.endsWith(".cpp") ||
        f.name.endsWith(".h") ||
        f.name.endsWith(".rc")
    );

    for (const file of filtered) {
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

    this.dependencies.clear();
    for (const node of fileNodes) {
      this.dependencies.set(node.name, node.includes);
    }

    return { fileNodes, fileMap };
  }

  calculateLevels(fileNodes, fileMap) {
    const visited = new Set();

    const getLevel = (name) => {
      if (visited.has(name)) return 0;
      visited.add(name);

      const node = fileMap.get(name);
      if (!node || node.includes.length === 0) {
        node && (node.level = 0);
        return 0;
      }

      let maxLevel = -1;
      for (const inc of node.includes) {
        const incNode = fileMap.get(inc);
        if (incNode) {
          const lvl = getLevel(inc);
          if (lvl > maxLevel) maxLevel = lvl;
        }
      }

      node.level = maxLevel + 1;
      return node.level;
    };

    for (const node of fileNodes) {
      getLevel(node.name);
    }

    return fileNodes;
  }

  async finder(files) {
    if (!files) throw new Error("Список файлів порожній.");

    // Очищаємо попередні дані при новому виборі
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
      result = await this.parseFiles(this.files);
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