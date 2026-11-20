# Затишний дворик 🏡

Затишна мердж-гра: город, випічка, квіти й добрі сусіди. Без реклами й без справжніх покупок.

Грати: відкрий посилання в Safari на iPhone → «Поділитися» → «На початковий екран».

- `js/data.js` — предмети, персонажі, сюжет (сюди додаються нові розділи)
- `js/game.js` — логіка гри
- після змін у грі збільшити `VERSION` у `sw.js`

## Графіка й ліцензії

- 3D-іконки: [Fluent Emoji 3D](https://github.com/microsoft/fluentui-emoji) © Microsoft, MIT (`e3d/LICENSE-fluentui-emoji.txt`).
- 3D-дворик: [Three.js](https://threejs.org) r170, MIT (`vendor/LICENSE-three.txt`); моделі [Kenney](https://kenney.nl) — Nature, Food, Furniture, Holiday, City Suburban, Survival kits, CC0 (`models/*/License.txt`).
- `js/yard3d.js` — 3D-сцена; таблиця `MODELS` зіставляє емодзі з `js/data.js` з моделями. Для чого моделі немає — ставиться «фігурка» з 3D-іконки.
- Якщо WebGL недоступний, «Дворик» показується як раніше, у 2D.
