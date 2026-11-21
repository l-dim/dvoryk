# Листівки альбому — 3 аркуші по 12 (36 листівок)

Прикріпи як зразок стилю будь-який аркуш предметів (наприклад, інгредієнти).
Вставляй загальний опис, а за ним — список аркуша.

## Загальний опис
```
Collectible postcard sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Each cell is one small vintage-style picture postcard, portrait orientation (3:4), with a cream paper border with slightly rounded corners and a thin decorative folk-ornament frame line, and a little cozy painted scene inside featuring the subject below as the clear main focus. Rich saturated warm colors, soft painterly shading. All postcards upright, the same size and shape, not overlapping. Arrange them in a strict grid of 4 columns by 3 rows, left to right, top to bottom, in the numbered order below, each postcard centered in its own cell with a white gap around it. Plain solid pure white background, no shadows on the background, no text, no letters, no numbers, no stamps with writing.
```

## sheet-pc1 — Город · Хата
```
1 a bunch of orange carrots with green tops lying on garden soil,
2 ripe red tomatoes on a vine in the sun,
3 small green cucumbers with a yellow flower on the vine,
4 a golden corn cob half-peeled in its green husk,
5 a big round orange pumpkin on straw,
6 a tall sunflower against a blue summer sky,
7 a painted enamel teapot steaming on a wooden table,
8 a wicker basket with an embroidered towel,
9 a lit candle in a clay candlestick on a windowsill at dusk,
10 an old plush teddy bear sitting on a bench,
11 a framed painting of a village house on a whitewashed wall,
12 a puffy feather bed with embroidered pillows piled high (peryna).
```

## sheet-pc2 — Природа · Ремесла
```
1 a red ladybug on a green leaf,
2 a fuzzy bee on a clover flower,
3 a colorful butterfly on a daisy,
4 a cute hedgehog with an apple on its back in autumn leaves,
5 a huge old oak tree in a meadow,
6 a white swan on a calm pond with reeds,
7 spools of red and black embroidery thread,
8 a sewing needle with a red thread on embroidered linen,
9 a ball of wool yarn with knitting needles,
10 a warm knitted scarf with a folk pattern,
11 a painted clay jug (hlechyk) with flowers,
12 a wooden violin resting on a chair.
```

## sheet-pc3 — Смаколики · Свята
```
1 a round Ukrainian bread loaf (palianytsia) on a towel,
2 a clay jug of milk with a glass,
3 a bowl of dark red cherries,
4 a stack of thin pancakes with sour cream,
5 a plate of varenyky with melted butter and onion,
6 a festive layered cake with berries,
7 a little brass bell with a red ribbon,
8 a clay pot of golden honey with a honey dipper,
9 a decorated Ukrainian Easter egg (pysanka) with bright folk patterns,
10 a Christmas tree with homemade toys in snow,
11 a white dove with a sprig of guelder-rose (kalyna),
12 a glowing Christmas star (Bethlehem star) over a snowy village at night.
```

## Ріжемо (для мене)
```
art/slice.sh art/src/sheet-pc1.webp 4 3 pc-garden-0 … pc-garden-5 pc-home-0 … pc-home-5
art/slice.sh art/src/sheet-pc2.webp 4 3 pc-nature-0 … pc-nature-5 pc-craft-0 … pc-craft-5
art/slice.sh art/src/sheet-pc3.webp 4 3 pc-food-0 … pc-food-5 pc-holy-0 … pc-holy-5
```
Порядок збігається з `ALBUM` у js/album.js.
