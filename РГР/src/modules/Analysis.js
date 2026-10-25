export class Analysis {
  constructor() {
    this.files = [];
    this.cppFilesCount = 0;
  }

  finder(files) {
    if (!files) return [];

    this.files = Array.from(files);

    const cppFiles = this.files.filter(
      (f) =>
        f.name.endsWith(".cpp") ||
        f.name.endsWith(".h") ||
        f.name.endsWith(".rc")
    );

    this.cppFilesCount = cppFiles.length;

    const listing = document.getElementById("listing");
    if (listing) {
      listing.innerHTML = "";
      cppFiles.forEach((file) => {
        const li = document.createElement("li");
        li.textContent = file.name;
        listing.appendChild(li);
      });
    }

    return cppFiles;
  }
}