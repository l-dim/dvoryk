# Сезонні знахідки — 20 предметів (один аркуш 5×4)

Прикріпи як зразок стилю аркуш скарбів (намисто, ложка, перстень…).

## Загальний опис
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute magical seasonal items with soft painterly shading, a subtle rim light, a gentle glow and a few tiny sparkles, rich saturated colors, clean readable silhouettes, slight 3/4 front view. Each next item in a row looks more precious than the previous one. Arrange them in a strict grid of 5 columns by 4 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
```
(Якщо Gemini не тягне 5×4, роби двома аркушами 5×2: перший — зима й весна, другий — літо й осінь.)

## Список
```
WINTER (amber snowflakes):
1 a single delicate white-blue snowflake,
2 a small clear ice crystal with a frosty glint,
3 a glowing golden-amber snowflake made of translucent amber,
4 a little hanging lantern made of amber with a warm light inside and frost on top,
5 a radiant winter star of amber and ice with a soft golden halo.
SPRING (pysanky):
6 a plain red-dyed Easter egg (krashanka),
7 an Easter egg half-covered in wax pattern with a kistka stylus beside it,
8 a little straw nest with three colorful Ukrainian pysanky,
9 a wicker Easter basket with pysanky, a small paska bread and an embroidered towel,
10 a magnificent glowing pysanka with intricate gold, red and black folk patterns on a tiny stand.
SUMMER (linden honey):
11 a cute fuzzy honey bee,
12 a piece of golden honeycomb dripping honey,
13 a sunflower head glistening with honey drops,
14 a beeswax candle with linden blossoms around its base,
15 a painted clay pot of golden linden honey with a honey dipper and linden flowers.
AUTUMN (golden autumn):
16 a single golden autumn leaf,
17 a bright red-orange maple leaf,
18 a shiny horse chestnut in its spiky green shell, half open,
19 a little orange pumpkin with a twisted stem and a curl of vine,
20 a festive autumn wreath of wheat, red viburnum berries and golden leaves.
```

## Ріжемо (для мене)
`art/slice.sh art/src/sheet-seas.webp 5 4 seas-winter-{0..4} seas-spring-{0..4} seas-summer-{0..4} seas-autumn-{0..4}` (у режимі CUTOUT_WHITE=1 — щоб не загубити блискітки)
Після нарізки — id у `SEAS_ART` (js/season.js) і файли в sw.js.
