# Нові ремесла майстерні: кераміка, кузня, бурштин

Прикріпи до кожного промпту як зразок стилю аркуш дерев'яних виробів (sheet-wood).

## A. Кераміка й кузня: аркуш 4×4 (14 виробів і 2 генератори)
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view. Each next item in a row looks more crafted and valuable than the previous one. Arrange them in a strict grid of 4 columns by 4 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a soft lump of wet reddish-brown clay with finger marks,
2 a small glazed clay mug (hornyatko) with a simple painted stripe,
3 a glazed earthenware bowl with a green and yellow Ukrainian folk swirl pattern (polyvyana),
4 a wide traditional Ukrainian clay pot (makitra) with a painted ornament,
5 a traditional Ukrainian ring-shaped ceramic jug (kumanets) with a hole in the middle, painted flowers,
6 a tall elegant hand-painted ceramic vase in Petrykivka style with red and blue flowers,
7 a small cozy stove covered with painted ceramic tiles (kakhli) in blue and white folk ornaments,
8 a potter's wheel with a half-made clay pot spinning on it and a bucket of water (generator: potter's wheel),
9 a single shiny iron nail,
10 a forged iron horseshoe for good luck with little nail holes,
11 an old ornate forged iron key,
12 a forged knife with a carved wooden handle,
13 a forged black iron hook with a decorative curl,
14 a forged iron Ukrainian trident (tryzub) ornament on a small stand, warm metallic shine,
15 a small forged iron garden gate with elegant curls and leaves,
16 a cozy village blacksmith forge with glowing coals, an anvil, a hammer and tongs (generator: forge).
```

## B. Бурштин і ювелірка: аркуш 4×3 (12)
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view. Amber pieces glow warm honey-orange and are slightly translucent. Arrange them in a strict grid of 4 columns by 3 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a grey lump of sandy rock with a tiny orange amber speck peeking out,
2 a few small rough raw amber crumbs,
3 a bigger rough raw amber nugget, honey-orange,
4 a polished glossy amber cabochon, glowing warm orange,
5 a silver ring with a polished amber stone,
6 a necklace of round polished amber beads,
7 a delicate silver tiara set with amber stones,
8 a small amber digging pit in sand with a wooden sieve, a shovel and a bucket of water (generator: amber pit),
9 a polished drop of amber with a tiny ladybug trapped inside, glowing (rare treasure),
10 a few broken shards of a clay pot (cracked pottery),
11 a crooked, badly cut wooden bar, bent like a boomerang (workshop junk),
12 a cozy small wooden workshop house with a saw sign above the door (button icon: workshop).
```

## C. Електроніка: аркуш 3×3 (7 виробів, генератор і значок)
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute retro electronics with soft painterly shading and a subtle rim light, warm vintage colors (cream, mint, wood and brass), clean readable silhouettes, slight 3/4 front view. Each next item looks more crafted and valuable than the previous one. Arrange them in a strict grid of 3 columns by 3 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a coiled electric wire with an old plug,
2 a glowing vintage light bulb with a warm filament,
3 a chunky retro battery,
4 a retro metal flashlight shining a soft beam,
5 a vintage rotary dial telephone in cream and red,
6 a vintage wooden tube radio with a fabric speaker and brass knobs,
7 a retro wooden tube television with a rounded screen and little antenna,
8 a cozy radio repair workbench with a soldering iron, a lamp, wires and an open radio (generator: radio workshop),
9 a small vintage multimeter tester with a needle dial and two probes (icon: test the device).
```

## Ріжемо (для мене)
- `art/slice.sh art/src/sheet-craft-a.webp 4 4 clay-0 … clay-6 gen-clay forge-0 … forge-6 gen-forge`
- `art/slice.sh art/src/sheet-craft-b.webp 4 3 amber-0 … amber-6 gen-amber inclusion shards woodjunk ui-workshop`
- `art/slice.sh art/src/sheet-craft-c.webp 3 3 electro-0 … electro-6 gen-electro ui-test`
- id → `CRAFT_ART` у js/crafts.js; woodjunk → PUA 0xE480 у js/woodhard.js; ui-workshop → кнопка майстерні.
