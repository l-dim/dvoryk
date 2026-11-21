# Свята за календарем — 4 аркуші 4×4 (по два свята на аркуш)

Прикріпи як зразок стилю будь-який аркуш предметів (наприклад, хліва sheet-farm-e).
На кожному аркуші: 6 предметів свята (від простого до найкращого) + генератор, і так для двох свят, + 2 великі прикраси двору.

## Спільний початок промпту
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view, warm Ukrainian folk details. Each next item in a group looks more festive and valuable than the previous one. Arrange them in a strict grid of 4 columns by 4 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
```
Далі встав список для потрібного аркуша.

## H1. Різдво й Масляна
```
1 a single golden wheat ear,
2 a lit wax church candle with a small embroidered ribbon,
3 a clay bowl of kutia (wheat with poppy seeds, honey and nuts),
4 a plate of small round pampushky doughnuts with garlic,
5 a bright Christmas carolling star on a stick, with ribbons,
6 a festive Holy Supper table with a white embroidered cloth, kolach bread, candle and dishes,
7 a didukh — a traditional Ukrainian Christmas sheaf of wheat with ribbons (generator),
8 a small round of white farmer's cheese,
9 a varenyk dumpling with cheese and sour cream,
10 a thin golden pancake (mlynets),
11 a stack of pancakes with honey dripping,
12 a little wooden log (kolodka) decorated with colorful ribbons,
13 a straw Maslyana effigy doll in a skirt and headscarf on a pole,
14 a cozy clay oven with a pan of pancakes (generator),
15 a nativity puppet theater box (vertep) decorated with stars (yard decoration),
16 a big Maslyana bonfire with ribbons on poles around it (yard decoration).
```

## H2. Великдень і Зелені свята
```
1 a plain white egg,
2 a red-dyed Easter egg (krashanka),
3 a pysanka with traditional painted folk ornament,
4 a tall Ukrainian Easter bread (paska) with white icing and decorations,
5 a wicker Easter basket with paska, pysanky and a candle,
6 a festive Easter basket covered with an embroidered rushnyk towel,
7 a wicker Easter basket with a ribbon on the handle (generator),
8 a young green blade of grass,
9 a fresh linden branch with leaves,
10 a bundle of sweet flag (calamus) leaves,
11 a wooden gate decorated with green branches,
12 a green wreath of herbs and field flowers,
13 a small white Ukrainian cottage decorated with green branches,
14 a bunch of fresh green branches tied with a ribbon (generator),
15 a small tree decorated with hanging pysanky (yard decoration),
16 a wooden yard gate and fence fully decorated with green branches (yard decoration).
```

## H3. Івана Купала і Спаси
```
1 a single white daisy,
2 a small bouquet of wild field flowers,
3 a flower wreath (vinok) of daisies and cornflowers,
4 a flower wreath with a lit candle in the middle,
5 a flower wreath with a candle floating on dark water,
6 a magical glowing fern flower,
7 a small Kupala bonfire with logs (generator),
8 a green apple,
9 a piece of honeycomb dripping with honey,
10 a clay jar of golden honey,
11 a wicker basket full of red apples,
12 a decorated gingerbread honey cookie (medianyk),
13 a festive basket with honey, apples and poppy heads covered with an embroidered towel,
14 a wooden beehive with bees around it (generator),
15 a big Kupala bonfire surrounded by flower wreaths (yard decoration),
16 a few wooden beehives with a small bench and flowers (yard decoration).
```

## H4. День Незалежності й Покрова
```
1 a blue-and-yellow ribbon tied in a bow,
2 a bundle of golden wheat ears,
3 a big bright sunflower,
4 a white embroidered shirt (vyshyvanka) with red ornament,
5 a festive round korovai bread with dough decorations,
6 festive fireworks bursting in blue and gold,
7 a small festive stage with blue-yellow ribbons and a microphone (generator),
8 a cluster of red kalyna (viburnum) berries,
9 a golden maple leaf,
10 a folded embroidered headscarf,
11 an embroidered rushnyk towel,
12 an orange pumpkin,
13 a golden round pie decorated with leaves,
14 a wicker basket of autumn leaves, kalyna and apples (generator),
15 a sunflower field arch with blue-yellow ribbons (yard decoration),
16 a scarecrow with pumpkins, kalyna and autumn leaves (yard decoration).
```

## Ріжемо (для мене)
- H1: `hol-rizdvo-0…5 gen-hol-rizdvo hol-maslyana-0…5 gen-hol-maslyana yard-rizdvo yard-maslyana`
- H2: `hol-velykden-0…5 gen-hol-velykden hol-triytsia-0…5 gen-hol-triytsia yard-velykden yard-triytsia`
- H3: `hol-kupala-0…5 gen-hol-kupala hol-spas-0…5 gen-hol-spas yard-kupala yard-spas`
- H4: `hol-nezalezhnist-0…5 gen-hol-nezalezhnist hol-pokrova-0…5 gen-hol-pokrova yard-nezalezhnist yard-pokrova`
- id → `HOL_ART` у js/holidays.js; yard-* — велика прикраса в дворику на час свята.
