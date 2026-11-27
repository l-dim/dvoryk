# Після 30 рівня — 2 аркуші 3×5 (4 генератори + 24 предмети)

Прикріпи як зразок стилю аркуш предметів (наприклад, sheet-more3 з лісом і пташником).
У кожному аркуші 15 клітинок: 14 потрібні грі, 15-та — заповнювач (її не ріжемо).

## Загальний опис (вставляй першим)
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, rich saturated colors, clean readable silhouettes, slight 3/4 front view. Arrange them in a strict grid of 3 columns by 5 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
```

## sheet-late1 (3×5) — Пасіка і Ягідник
```
1 a small apiary: two painted wooden beehives on a grassy patch with sunflowers and a few cute bees (generator: apiary),
2 a piece of golden honeycomb dripping with honey,
3 a glass jar of golden honey with a cloth lid tied with twine,
4 a wooden honey dipper with honey dripping into a small clay bowl,
5 a tall beeswax candle with a warm flame, decorated with a small embroidered ribbon,
6 a Ukrainian honey gingerbread cookie (medianyk) with white icing patterns,
7 a layered honey cake (medovyk) on a plate, one slice cut,
8 berry bushes of currants and raspberries with a wicker basket in front (generator: berry garden),
9 a cluster of shiny red currants on a little stem with leaves,
10 a small woven punnet full of ripe strawberries,
11 a wicker basket heaped with blueberries,
12 a glass jar of dark berry jam with a checkered cloth lid,
13 a round berry pie with a lattice crust and berries on top,
14 a festive cream cake decorated with fresh berries and mint leaves,
15 a small bunch of wildflowers (filler).
```

## sheet-late2 (3×5) — Ткацька світлиця і Стайня
```
1 a cozy wooden weaving loom with colorful threads and a half-woven striped cloth (generator: weaving room),
2 a bundle of dried flax stalks tied with twine,
3 a ball of natural linen thread with a wooden spindle,
4 a rolled bolt of white linen cloth,
5 a Ukrainian embroidered towel (rushnyk) with red and black cross-stitch ornament, neatly folded,
6 a Ukrainian embroidered shirt (vyshyvanka) with red and black ornament on the sleeves,
7 a small handwoven Ukrainian folk rug (kylym) with a bright geometric flower pattern,
8 a little wooden stable with a hay loft and a horse peeking out of the door (generator: stable),
9 a shiny iron horseshoe with a tiny red ribbon, for good luck,
10 colorful ribbons and a small flower comb for braiding a horse's mane,
11 a cute brown foal with a white blaze,
12 a friendly chestnut horse with a light mane,
13 a chestnut horse wearing a Ukrainian flower wreath with ribbons,
14 a festive wooden sleigh with painted folk ornaments and a warm blanket,
15 a small bunch of wildflowers (filler).
```

## Ріжемо (для мене)
- sheet-late1 → items/gen-apiary, apiary-0..5, gen-berries, berries-0..5 (15-ту пропускаємо)
- sheet-late2 → items/gen-weave, weave-0..5, gen-stable, stable-0..5 (15-ту пропускаємо)
Після нарізки — дописати id у LATE_ART (js/late.js) і шляхи в FILES (sw.js).
