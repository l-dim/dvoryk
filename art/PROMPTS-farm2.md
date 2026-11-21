# Хлів, погода, прикраси

Прикріпи як зразок стилю аркуш електроніки (sheet-craft-c).

## E. Хлів: аркуш 4×6 (24)
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects and animals with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view. Each next item in a group looks more crafted and valuable than the previous one. Arrange them in a strict grid of 4 columns by 6 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a clay mug of fresh milk with a little foam,
2 a small clay jug of thick cream,
3 a golden block of homemade butter on a wooden board,
4 a cone of homemade vanilla ice cream,
5 a slice of fluffy cheesecake with berries,
6 a tall festive milk cake with cream roses,
7 a cute spotted Ukrainian cow with a bell and a flower wreath, standing on a patch of grass (generator: cow),
8 a glass bottle of goat milk with a little ribbon,
9 a bowl of fresh white farmer's cheese,
10 a block of white brynza sheep cheese on a cloth,
11 a plate of Ukrainian varenyky with brynza and sour cream,
12 a round golden pie with brynza filling,
13 a festive cheese platter with grapes and honey,
14 a cute white goat with little horns and a bell, standing on grass (generator: goat),
15 a fluffy tuft of raw white wool,
16 a ball of cream wool yarn,
17 a skein of dyed red wool yarn with a wooden spindle,
18 a pair of cozy knitted wool socks with folk pattern,
19 a pair of knitted mittens with a Ukrainian ornament,
20 a long striped knitted scarf,
21 a thick cozy knitted sweater with a folk ornament,
22 a fluffy cute sheep like a little cloud, standing on grass (generator: sheep),
23 a small burlap sack of dark garden compost with a green sprout (fertilizer),
24 a painter's palette with a brush and a little flower (icon: decorate the yard).
```

## F. Погода: аркуш 3×2 (6)
```
Game icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Soft painterly shading, glossy chunky shapes, clean readable silhouettes. Arrange them in a strict grid of 3 columns by 2 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each icon centered in its own cell with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no text, no numbers.
1 a smiling warm sun with soft rays (sunny weather),
2 a fluffy grey cloud with gentle raindrops (rain),
3 a hot red-orange sun with heat waves and a wilting flower (heat),
4 a frosty blue snowflake with icicles and a frosty glow (frost),
5 a soft white cloud with falling snowflakes (snow),
6 a sun peeking from behind a rain cloud (weather forecast icon).
```

## Ріжемо (для мене)
- `art/slice.sh art/src/sheet-farm-e.webp 4 6 cow-0 … cow-5 gen-cow goat-0 … goat-5 gen-goat sheep-0 … sheep-6 gen-sheep manure ui-decor` → `FARM2_ART` у js/farm2.js; ui-decor → 🎨
- `art/slice.sh art/src/sheet-farm-f.webp 3 2 ui-sun ui-rain ui-heat ui-frost ui-snowfall ui-forecast` → UI_ICONS ☀️ 🌧️ 🥵 🥶 🌨️ 🌦️ (перевірити, щоб у 3D-дворику ☀️/🌨️ лишились як були)
