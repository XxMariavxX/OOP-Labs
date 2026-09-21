"use strict";

export function clear() {
  const clear = document.getElementById(`clear`);
  const mainContent = document.getElementById(`content`);

  clear.addEventListener("click", function () {
    mainContent.innerHTML = ``;
  });
}