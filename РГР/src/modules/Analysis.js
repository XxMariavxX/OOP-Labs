export class Analysis {
  constructor() {
    this.files = [];
  }

  finder() {
    const input = document.getElementById("fileInput");
    const listing = document.getElementById("listing");
    input.type = "file";
    input.webkitEntries = true;
    input.multiple = true;

    input.addEventListener("change", (event) => {
      const files = Array.from(event.target.files);
      console.log("Selected files:", files);
      listing.innerHTML = "";
      files.forEach((file) => {
        const li = document.createElement("li");
        li.textContent = file.name;
        listing.appendChild(li);
      });
    });

    const cppFiles = files.filter(
      (f) =>
        f.name.endsWith(".cpp") ||
        f.name.endsWith(".h") ||
        f.name.endsWith(".rc"),
    );
  }
}
