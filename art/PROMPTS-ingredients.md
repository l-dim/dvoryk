# Інгредієнти для кулінарного конкурсу — 5 аркушів 3×4 (60 штук)

Прикріпи будь-який готовий аркуш (наприклад, із рибою й грибами) як зразок стилю.
Встав **загальний опис**, а одразу за ним — список одного аркуша.

## Загальний опис

```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute food ingredient objects with soft painterly shading and a subtle rim light, rich saturated colors, clean readable silhouettes, slight 3/4 front view. Arrange them in a strict grid of 3 columns by 4 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers, no labels on packages. Square-ish image.
```

## sheet-ing1 — борошно, крупи, молочне

```
1 a small burlap sack of white wheat flour with a scoop, 2 a small burlap sack of darker grey rye flour with rye ears, 3 a wooden bowl of brown buckwheat groats, 4 a ceramic bowl of fine pale semolina, 5 a bowl of rolled oat flakes, 6 a small linen pouch of golden millet grains, 7 a block of fresh baker's yeast on a little plate, 8 a small sack of bright yellow cornmeal with a corn cob, 9 a clay jug of milk, 10 a small glass jar of thick fresh cream, 11 a clay pot of thick white sour cream with a wooden spoon, 12 a block of golden butter on a wooden board.
```

## sheet-ing2 — молочне, ягоди й плоди

```
1 a bowl of crumbly white farmer's cottage cheese, 2 a wedge of yellow hard cheese with holes, 3 three brown and white chicken eggs in a little straw nest, 4 a clay cup of baked milk ryazhanka with a golden-brown skin on top, 5 a glass bottle of kefir, 6 a handful of dark red cherries with leaves, 7 two green and red apples, 8 two ripe yellow pears, 9 a few dark purple plums, 10 a few orange apricots, 11 a few red strawberries with green tops, 12 a small pile of red raspberries.
```

## sheet-ing3 — ягоди, горіхи й насіння

```
1 a small pile of blueberries, 2 a sprig of blackcurrant berries, 3 a bright red cluster of viburnum (kalyna) berries with a leaf, 4 a cut lemon and a whole lemon, 5 a small orange pumpkin, 6 a few green striped gooseberries, 7 a small pile of walnuts with one cracked open, 8 a small pile of hazelnuts, 9 a small wooden bowl of dark blue-grey poppy seeds, 10 a sunflower head with a little pile of sunflower seeds, 11 a small pile of almonds, 12 a small pile of peanuts in shells.
```

## sheet-ing4 — солодке й прянощі

```
1 a clay pot of golden honey with a wooden honey dipper, 2 a glass bowl of white sugar cubes and sugar, 3 a dark chocolate bar with a few broken pieces, 4 a small wooden bowl of cocoa powder, 5 two dark vanilla pods with a white vanilla flower, 6 a bundle of cinnamon sticks tied with string, 7 a small bowl of dark raisins, 8 a glass jar of red berry jam with a checkered cloth lid, 9 an open tin of thick condensed milk with a spoon, 10 a few golden amber caramel candies, 11 a knobby ginger root, 12 a fresh sprig of green mint.
```

## sheet-ing5 — овочі й зелень

```
1 a few brown potatoes, 2 a fresh green head of cabbage, 3 two orange carrots with green tops, 4 a dark red beetroot with leaves, 5 two golden onions, 6 a little group of brown forest mushrooms, 7 a bunch of fresh green dill, 8 a bulb of white garlic with a few cloves, 9 a small bowl of red and white beans, 10 an open green pea pod with peas, 11 a slab of Ukrainian salo (white cured pork fat with pink layer and a dark pepper crust) on a wooden board, 12 a red and a yellow sweet bell pepper.
```

## Як ріжемо (для мене)

```
art/slice.sh art/src/sheet-ing1.webp 3 4 ing-flour ing-rye ing-buckwheat ing-semolina ing-oats ing-millet ing-yeast ing-cornflour ing-milk ing-cream ing-sourcream ing-butter
art/slice.sh art/src/sheet-ing2.webp 3 4 ing-tvorog ing-cheese ing-egg ing-ryazhanka ing-kefir ing-cherry ing-apple ing-pear ing-plum ing-apricot ing-strawberry ing-raspberry
art/slice.sh art/src/sheet-ing3.webp 3 4 ing-blueberry ing-currant ing-kalyna ing-lemon ing-pumpkin ing-gooseberry ing-walnut ing-hazelnut ing-poppy ing-seeds ing-almond ing-peanut
art/slice.sh art/src/sheet-ing4.webp 3 4 ing-honey ing-sugar ing-choc ing-cocoa ing-vanilla ing-cinnamon ing-raisins ing-jam ing-condensed ing-caramel ing-ginger ing-mint
art/slice.sh art/src/sheet-ing5.webp 3 4 ing-potato ing-cabbage ing-carrot ing-beet ing-onion ing-mushroom ing-dill ing-garlic ing-beans ing-peas ing-salo ing-pepper
```
Після нарізки — додати id у `ING_ART` (js/contest.js) і файли в sw.js.
