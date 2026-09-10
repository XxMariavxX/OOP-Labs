"use strict";

export function work2() {
  const work2 = document.getElementById(`menuB0`);
  const mainList = document.getElementById(`list`);
  const mainContent = document.getElementById(`content`);

  work2.addEventListener(`click`, function () {
    mainList.innerHTML = `
  <div class="dialog-overlay">
        <div class="dialog-box">
          <div class="main-board__list__top">
            <div class="main-board__list__title" id="listTitle">Введіть текст</div>
          </div>
          <input type="text" class="main-board__content__input" id="inputField" placeholder="Enter text"/>
          <div class="main-board__buttons" id="buttons">
            <button class="main-board__button main-board__button--yes" id="yesButton">Так</button>
            <button class="main-board__button main-board__button--reject" id="rejectButton">Відміна</button>
          </div>
        </div>
      </div>
  `;
    const inputField = document.getElementById(`inputField`);
    const yesButton = document.getElementById(`yesButton`);
    const rejectButton = document.getElementById(`rejectButton`);

    rejectButton.addEventListener(`click`, function () {
      mainList.innerHTML = ``;
    });

    yesButton.addEventListener(`click`, function () {
      const valueInput = inputField.value;
      mainContent.innerHTML = `
    <div class="main-board__content">${valueInput}</div>
    `;
      mainList.innerHTML = ``;
    });
  });
}