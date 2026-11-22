# Поїздки — 2 аркуші (море й Карпати)

Прикріпи як зразок стилю аркуш предметів (наприклад, хліва sheet-farm-e).

## Спільний початок
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view. Each next item in a group looks more special and valuable than the previous one. Arrange them in a strict grid of COLS columns by ROWS rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
```

## T1 — Море й літні Карпати (COLS = 4, ROWS = 3)
```
1 a small pearly seashell,
2 a cute little red crab,
3 a sandcastle with a tiny flag on top,
4 a striped inflatable swim ring,
5 a small sailboat with white sails on a bit of blue water,
6 a colourful beach umbrella over a patch of sand with a towel (generator),
7 a small bunch of fragrant Carpathian mountain herbs tied with string,
8 a wicker basket full of wild blueberries,
9 a round of fresh white bryndza sheep cheese on a wooden board,
10 a fluffy white lamb with a little bell on a red ribbon,
11 a long wooden trembita alpine horn with carved ornament,
12 a cozy wooden shepherd's hut (kolyba) with a smoking chimney on a green mountain meadow (generator).
```

## T2 — Зимові Карпати й сувеніри (COLS = 3, ROWS = 3)
```
1 a sparkling blue snowflake,
2 a cheerful little snowman with a red scarf,
3 a warm knitted scarf with Hutsul ornament,
4 a pair of wooden skis with poles,
5 a golden skiing trophy cup with a ribbon,
6 a mountain cable car cabin on a rope over snowy fir trees (generator),
7 a wooden beach lounger under a striped sun umbrella (yard souvenir),
8 a small wooden sled with red runners and a cozy blanket (yard souvenir),
9 a vintage travel suitcase with colourful stickers of the sea and mountains.
```

## Ріжемо (для мене)
- T1: `art/slice.sh art/src/sheet-trips-1.webp 4 3 side-sea-0 side-sea-1 side-sea-2 side-sea-3 side-sea-4 side-gen-sea side-carp-0 side-carp-1 side-carp-2 side-carp-3 side-carp-4 side-gen-carp`
- T2: `art/slice.sh art/src/sheet-trips-2.webp 3 3 side-ski-0 side-ski-1 side-ski-2 side-ski-3 side-ski-4 side-gen-ski souv-sea souv-ski ui-trip`
- id → `TRIP_ART` у js/trips.js; 🧳 → ui-trip в UI_ICONS. Сувенір «ягнятко» вже мальований (deco-lamb).
