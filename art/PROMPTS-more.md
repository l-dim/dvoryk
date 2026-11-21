# Нові предмети — 3 аркуші (21 + 18 + 3 генератори = 42)

Прикріпи як зразок стилю аркуш предметів (наприклад, город чи випічку).

## Загальний опис
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, rich saturated colors, clean readable silhouettes, slight 3/4 front view. Arrange them in a strict grid of 3 columns by 4 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
```

## sheet-more1 (3×4) — нові рівні: город, випічка, сад, квіти
```
1 a glossy purple eggplant with a green cap,
2 a braided string (kosa) of white garlic bulbs,
3 a festive bowl of fresh vegetable salad with tomatoes, cucumbers and dill,
4 a long festive white bread loaf decorated with a braided dough pattern,
5 a string of golden bagels (bublyky) tied with a red ribbon,
6 a small Ukrainian Easter bread (paska) with white icing and colorful sprinkles,
7 a bunch of ripe purple grapes with a vine leaf,
8 a juicy yellow melon with a slice cut out,
9 a glass bottle of golden apple cider with a cork and apples beside it,
10 a bunch of purple lavender tied with a ribbon,
11 a pink water lily on a green lily pad,
12 a lush flower wreath of poppies, cornflowers and daisies with ribbons.
```

## sheet-more2 (3×4) — нові рівні: чаювання, солодощі, ферма + 3 генератори
```
1 a bundle of dried healing herbs (mint, chamomile, linden) tied with twine,
2 a plate of golden fluffy pampushky doughnuts glazed with honey,
3 a festive tray with a teapot, cups and pastries for a celebration,
4 a glass bowl of colorful berry sorbet,
5 three red sugar rooster candies on sticks,
6 a paper cone of caramel popcorn,
7 a slab of Ukrainian salo with garlic cloves on a wooden board,
8 a rosy home-made baked ham with a sprig of herbs,
9 a golden roast chicken on a clay plate with vegetables,
10 a forest path entrance with a little wooden arch, pine trees and mushrooms (generator: forest trail),
11 a small wooden poultry house with a nest of eggs and a ladder (generator: poultry house),
12 a little potter's workshop with a potter's wheel and clay jugs (generator: pottery).
```

## sheet-more3 (3×6 — 18 клітинок) — ліс, пташник, гончарня
(у загальному описі заміни «3 columns by 4 rows» на «3 columns by 6 rows»)
```
1 a shiny acorn with its cap and an oak leaf,
2 a little group of brown forest mushrooms on moss,
3 a bundle of firewood sticks tied with rope,
4 a cute hedgehog carrying an apple,
5 a hand-carved wooden deer figurine with painted folk patterns,
6 a wise little owl carved as a wooden amulet with folk ornament,
7 a single soft white feather,
8 a fluffy yellow chick hatching from an egg,
9 a fluffy little yellow chick,
10 a cute white duck,
11 a graceful white swan,
12 a magnificent peacock with its tail spread,
13 a lump of wet brown clay on a board,
14 a small stack of red clay bricks,
15 a little wooden barrel (barylce) with iron hoops,
16 a tall painted clay jug with blue and yellow flowers,
17 a clay oil lamp (kaganets) with a small flame,
18 a small glazed clay fountain with water pouring.
```

## Ріжемо (для мене)
- sheet-more1 → items/veg-8..10, bake-9..11, fruit-8..10, flower-7..9
- sheet-more2 → items/tea-7..9, sweet-7..9, dairy-7..9, gen-forest, gen-poultry, gen-pottery
- sheet-more3 → items/forest-0..5, poultry-0..5, pottery-0..5
Після нарізки — додати id у PAINTED_ITEMS (js/data.js) і sw.js.
