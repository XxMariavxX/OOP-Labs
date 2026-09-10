"use strict";

export function work1() {
  const work1 = document.getElementById(`menuB3`);
  const mainList = document.getElementById(`list`);
  const mainContent = document.getElementById(`content`);

  work1.addEventListener(`click`, function () {
    const groups = [
      "ІМ-51",
      "ІМ-52",
      "ІМ-53",
      "ІМ-54",
      "ІМ-55",
      "ІМ-61",
      "ІМ-67",
      "ІП-67",
      "ІМ-59",
    ];

    mainList.innerHTML = `
  <div class="dialog-overlay">
      <div class="dialog-box">
      <div class="main-board__list__top">
        <div class="main-board__list__title" id="listTitle">List of groups</div>
        </div>
        <select class="main-board__list--click" id="listOfGroups" size=${groups.length}></select>
        <div class="main-board__buttons" id="buttons">
          <button class="main-board__button main-board__button--yes" id="yesButton">Так</button>
          <button class="main-board__button main-board__button--reject" id="rejectButton">Відміна</button>
        </div>
      </div>
    </div>
  `;

    const listOfGroups = document.getElementById(`listOfGroups`);
    const yesButton = document.getElementById(`yesButton`);
    const rejectButton = document.getElementById(`rejectButton`);

    groups.forEach((groupName) => {
      const option = document.createElement(`option`);
      option.value = groupName;
      option.text = groupName;
      option.classList = `group`;
      listOfGroups.appendChild(option);
    });

    yesButton.addEventListener(`click`, function () {
      const selectedGroup = listOfGroups.value;
      mainContent.innerHTML = `
   <div class="main-board__content">${selectedGroup}</div>
  `;
      mainList.innerHTML = ``;
    });

    rejectButton.addEventListener(`click`, function () {
      mainList.innerHTML = ``;
    });
  });
}