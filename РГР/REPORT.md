# Звіт про зміни (РГР)

## 1. Запуск проєкту (package.json)
- Виправлено порожній скрипт `"dev": ""` → `"dev": "vite"`, потім об'єднано з компіляцією SCSS в один запуск.
- Створено `scripts/dev.cjs`, який паралельно запускає Vite dev-сервер і `sass --watch`, з коректним завершенням по Ctrl+C.
- Скрипт `dev` змінено на `node scripts/dev.cjs`.

## 2. Обробка помилок (Manager.js, Analysis.js)
- Замінено одну загальну помилку на окремі повідомлення:
  - «Папка порожня або не містить C++ файлів (.cpp, .h, .rc).»
- Додано `try/catch` у `processFiles`, `finder`, `parseFiles`, `traverseFileTree`.
- Окремі повідомлення для читання файлів/папок, аналізу regex, побудови графа залежностей.

## 3. Обхід вкладених папок (Manager.js)
- `traverseFileTree` зроблено асинхронним.
- `readEntries` тепер викликається циклічно (батчами), щоб не губити файли у великих/вкладених папках.
- Додано fallback через `webkitEntries` для вибору папки через input.

## 4. Індикація обробки (Manager.js)
- Додано статуси: «Читання файлів...», «Обробка... (знайдено файлів: N)», «Відображення...».
- Додано `setTimeout` (yield), щоб браузер встигав перемалювати UI на великих проєктах.
- Скидання canvas (`viewer.reset()`) при помилках/новому виборі, щоб не з'являвся скрол.

## 5. Інтерфейс (index.html, _main.scss, _dropzone.scss)
- Статус винесено в окрему смужку `main__status-bar` над канвасом (по центру, видно).
- Хедер зроблено адаптивним: `flex-wrap`, `justify-content: center`, панель з `min-height`.
- Dropzone зроблено адаптивним: `width: 100%; max-width: 320px; height: auto`.
- Текст dropzone збільшено до 16px; кнопка хедера — до 18px.
- «або» перенесено на окремий рядок (`flex-basis: 100%`).

## 6. Файли, що змінено
- `РГР/package.json`
- `РГР/scripts/dev.cjs` (новий)
- `РГР/src/modules/Manager.js`
- `РГР/src/modules/Analysis.js`
- `РГР/src/modules/Viewer.js`
- `РГР/index.html`
- `РГР/src/styles/_main.scss`
- `РГР/src/styles/_dropzone.scss`
- `РГР/src/styles/style.css` (перекомпільовано)
- `РГР/dist/*` (перезібрано)
