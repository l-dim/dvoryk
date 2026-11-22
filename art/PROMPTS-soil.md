# Втомлена земля й трактор — аркуш 2×2

Прикріпи як зразок стилю аркуш хліва (sheet-farm-e) чи погоди (sheet-farm-f).

```
Game icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view. Arrange them in a strict grid of 2 columns by 2 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a small cute red vintage farm tractor with big back wheels, side view facing left, a little puff of smoke from the exhaust,
2 a sad little pile of defective harvest: a wilted crooked carrot, a cracked wormy potato and a withered leaf, slightly greyish,
3 a mound of fresh dark plowed soil with neat furrows and one tiny green sprout,
4 a patch of dry, cracked, exhausted soil with a wilted drooping sprout.
```

## Ріжемо (для мене)
- `art/slice.sh art/src/sheet-soil.webp 2 2 ui-tractor junk ui-soil-fresh ui-soil-tired`
- id → `SOIL_ART` у js/soil.js; 🚜 → ui-tractor в UI_ICONS.
