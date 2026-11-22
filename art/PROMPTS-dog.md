# Бровко й ворони — аркуш 3×1

Прикріпи як зразок стилю аркуш прикрас (sheet-decor2) і, для собаки, `items/animal-dog.webp` (це той самий Бровко).

```
Game icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached images. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view, warm Ukrainian village details. Arrange them in a strict grid of 3 columns by 1 row of equal square cells, left to right, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a cozy wooden dog kennel with a red roof and a carved name plate, the same friendly brown-and-white village dog from the attached image peeking out happily, a bowl in front,
2 a big cartoon dog bone, creamy white with soft shading,
3 a cheeky little black crow with a shiny beak, standing and looking sideways mischievously.
```

## Ріжемо (для мене)
- `art/slice.sh art/src/sheet-dog.webp 3 1 gen-dog bone ui-crow` (кістка й ворона — CUTOUT_WHITE за потреби)
- id → `DOG_ART` у js/dog.js; значок ворони на плитці — ui-crow
