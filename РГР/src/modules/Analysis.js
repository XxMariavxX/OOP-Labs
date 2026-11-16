export class Analysis {
  constructor() {
    this.files = [];
    this.cppFilesCount = 0;
    this.fileNodes = [];
    this.dependencies = new Map();
  }

  getNormalizedPath(file) {
    let rawPath = file._relativePath || file.webkitRelativePath || file.name;
    rawPath = rawPath.replace(/\\/g, "/");
    const parts = rawPath.split("/");
    return parts.length > 1 ? parts.slice(1).join("/") : rawPath;
  }

  resolveIncludePath(currentFilePath, includeStr) {
    const cleanInc = includeStr.replace(/\\/g, "/").trim();
    const currentDir = currentFilePath.includes("/")
      ? currentFilePath.substring(0, currentFilePath.lastIndexOf("/"))
      : "";

    const baseParts = currentDir ? currentDir.split("/") : [];
    const incParts = cleanInc.split("/");

    for (const part of incParts) {
      if (part === "." || part === "") continue;
      if (part === "..") {
        if (baseParts.length > 0) baseParts.pop();
      } else {
        baseParts.push(part);
      }
    }

    return {
      resolvedRelative: baseParts.join("/"),
      directPath: cleanInc,
      baseName: cleanInc.split("/").pop(),
    };
  }

  async parseFiles(files, onProgress) {
    const fileNodes = [];
    const pathMap = new Map();
    const nameMap = new Map();

    const filtered = files.filter((f) =>
      /\.(cpp|h|hpp|cc|cxx|rc)$/i.test(f.name)
    );

    const total = filtered.length;
    const BATCH = 50;

    for (let i = 0; i < filtered.length; i += BATCH) {
      const batch = filtered.slice(i, i + BATCH);
      for (const file of batch) {
        const text = await file.text();
        const rawIncludes = [];
        const regex = /#include\s+(["<][^">]+[">])/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
          rawIncludes.push(match[1]);
        }

        const relPath = this.getNormalizedPath(file);
        const node = {
          id: relPath,
          name: file.name,
          path: relPath,
          rawIncludes,
          displayLines: rawIncludes.map((inc) => `#include ${inc}`),
          includes: [],
          level: 0,
          isExternal: false,
        };

        fileNodes.push(node);
        pathMap.set(relPath, node);

        if (!nameMap.has(file.name)) {
          nameMap.set(file.name, []);
        }
        nameMap.get(file.name).push(node);
      }
      if (onProgress) onProgress(`Читання файлів: ${Math.min(i + BATCH, total)}/${total}`);
      await new Promise((r) => setTimeout(r, 0));
    }

    for (const node of [...fileNodes]) {
      const resolvedTargets = new Set();

      for (const rawToken of node.rawIncludes) {
        const isSystem = rawToken.startsWith("<");
        const cleanInc = rawToken.slice(1, -1);
        const { resolvedRelative, directPath, baseName } = this.resolveIncludePath(
          node.path,
          cleanInc
        );

        let targetNode =
          pathMap.get(resolvedRelative) ||
          pathMap.get(directPath) ||
          [...pathMap.values()].find((n) => n.path.endsWith(`/${directPath}`));

        if (!targetNode && nameMap.has(baseName)) {
          const candidates = nameMap.get(baseName);
          if (candidates.length === 1) {
            targetNode = candidates[0];
          }
        }

        if (!targetNode) {
          const extId = `ext:${baseName}`;
          targetNode = pathMap.get(extId);
          if (!targetNode) {
            targetNode = {
              id: extId,
              name: baseName,
              path: baseName,
              rawIncludes: [],
              displayLines: [isSystem ? "Стандартна / системна бібліотека" : "Зовнішній заголовковий файл"],
              includes: [],
              level: 0,
              isExternal: true,
            };
            fileNodes.push(targetNode);
            pathMap.set(extId, targetNode);
          }
        }

        if (targetNode && targetNode.id !== node.id) {
          resolvedTargets.add(targetNode.id);
        }
      }

      node.includes = [...resolvedTargets];
    }

    this.dependencies.clear();
    for (const node of fileNodes) {
      this.dependencies.set(node.id, node.includes);
    }

    return { fileNodes, pathMap };
  }

  calculateLevels(fileNodes, pathMap) {
    const done = new Set();
    const visiting = new Set();
    const levelCache = new Map();

    const getLevel = (id) => {
      if (done.has(id)) return levelCache.get(id) ?? 0;
      if (visiting.has(id)) return 0;

      const node = pathMap.get(id);
      if (!node || node.includes.length === 0) {
        if (node) node.level = 0;
        done.add(id);
        levelCache.set(id, 0);
        return 0;
      }

      visiting.add(id);
      let maxLevel = -1;
      for (const incId of node.includes) {
        if (pathMap.has(incId)) {
          const lvl = getLevel(incId);
          if (lvl > maxLevel) maxLevel = lvl;
        }
      }
      visiting.delete(id);

      node.level = maxLevel + 1;
      done.add(id);
      levelCache.set(id, node.level);
      return node.level;
    };

    for (const node of fileNodes) {
      getLevel(node.id);
    }

    return fileNodes;
  }

  async finder(files, onProgress) {
    if (!files) throw new Error("Список файлів порожній.");

    this.fileNodes = [];
    this.dependencies.clear();
    this.files = Array.from(files);

    const cppFiles = this.files.filter((f) =>
      /\.(cpp|h|hpp|cc|cxx|rc)$/i.test(f.name)
    );

    this.cppFilesCount = cppFiles.length;

    if (cppFiles.length === 0) {
      throw new Error("Не знайдено C++ файлів (.cpp, .h, .rc).");
    }

    const result = await this.parseFiles(this.files, onProgress);
    this.fileNodes = this.calculateLevels(result.fileNodes, result.pathMap);

    return this.fileNodes;
  }
}