# Бровко й майстер-класи — аркуш 3×2

Прикріпи як зразок стилю аркуш прикрас (sheet-decor2) і `items/animal-dog.webp` (це Бровко).

```
Game icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached images. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view, warm Ukrainian village details. Arrange them in a strict grid of 3 columns by 2 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a cozy wooden dog kennel with a red roof and a carved name plate, the same friendly brown-and-white village dog from the attached image peeking out happily, a bowl in front,
2 a big cartoon dog bone, creamy white with soft shading,
3 a cheeky little black crow with a shiny beak, standing and looking sideways mischievously,
4 a beautiful Ukrainian pysanka Easter egg with a red, black and yellow folk ornament, standing on a small carved wooden stand,
5 a Kupala flower wreath of daisies, cornflowers and poppies with long colourful ribbons,
6 an embroidered Ukrainian rushnyk towel with a red-and-black cross-stitch ornament, hanging on a carved wooden holder.
```

## Ріжемо (для мене)
- `art/slice.sh art/src/sheet-dog.webp 3 2 gen-dog bone ui-crow deco-pysanka deco-vinok deco-rushnyk` (кістку, якщо зникне, — CUTOUT_WHITE=1)
- `DOG_ART` у js/dog.js (gen-dog, bone, ui-crow); UI_ICONS 🏵️ → deco-vinok, 📜 → deco-rushnyk; писанка-прикраса — окремий значок у folk.js
