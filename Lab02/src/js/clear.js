"use strict";

export function clear() {
  const clear = document.getElementById(`clear`);
  const canvas = document.getElementById(`canvas`);
  const context = canvas.getContext(`2d`);

  clear.addEventListener("click", function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  });
}