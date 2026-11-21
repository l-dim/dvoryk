# Кохана людина й майстерня

## 1. Пара — уже не треба: партнером стає намальований герой протилежної статі (див. js/love.js)
Прикріпи як зразок стилю портрет когось із сусідів (Андрій чи Оля). Збережи як `maksym.png`, `maksym-full.png`, `khrystyna.png`, `khrystyna-full.png`.

Шаблон портрета по пояс:
```
Hand-painted cartoon character portrait for a cozy mobile farm game, in exactly the same art style and warm lighting as the attached image: soft painterly shading, big expressive friendly eyes, slightly exaggerated proportions, rich saturated colors, subtle rim light. Waist-up portrait, facing slightly to the side and looking at the viewer with a warm, shy, charming smile. Plain solid pure white background, no text, no frame, no shadow on the background. Square image.
Character: ...
```
Шаблон на повний зріст — те саме, але замість «Waist-up portrait…» встав:
`FULL BODY, standing, the whole figure visible from the top of the head down to the shoes, nothing cut off, relaxed friendly pose. Vertical image, 3:4.`

- **maksym:** `Maksym, a handsome young Ukrainian woodcarver around 30, warm brown wavy hair, light stubble, kind hazel eyes, a cream linen shirt with rolled sleeves and a little red embroidery on the collar, a brown leather work apron with a carving knife and a pencil in the pocket, a few wood shavings on his sleeves, holding a freshly carved wooden spoon.`
- **khrystyna:** `Khrystyna, a lovely young Ukrainian woodcarver and painter around 28, long chestnut hair in a loose braid with a wood-shaving curl caught in it, freckles, a mustard embroidered blouse, a canvas work apron with brushes and a carving knife in the pocket, holding a small hand-painted wooden horse toy.`

## 2. Дерев'яні вироби — аркуш 3×6 (16 виробів + 2 верстати)
Прикріпи як зразок стилю аркуш предметів (наприклад, гончарню).
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute wooden objects with visible warm wood grain, soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view. Each next item in a row looks more crafted and valuable than the previous one. Arrange them in a strict grid of 3 columns by 6 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a few curly wood shavings and a small wood chip,
2 a smooth rectangular wooden bar (block),
3 a small neat stack of planed wooden planks,
4 a hand-carved wooden spoon,
5 a carved wooden bowl with a simple folk ornament,
6 a small wooden box (skrynka) with a painted flower lid,
7 a little wooden stool with turned legs,
8 a wooden baby cradle with carved sides and an embroidered blanket,
9 a tall carved wooden wardrobe with painted Ukrainian folk flowers,
10 a thin green twig with a few leaves,
11 a small wooden whistle (svyshchyk) shaped like a little bird,
12 a carved wooden toy horse on wheels,
13 a hand-painted wooden folk doll (motanka-style, wooden),
14 an ornately carved wooden picture frame with flowers,
15 a handmade wooden violin with a bow,
16 a carved wooden cuckoo clock with pine-cone weights,
17 a sturdy carpenter's workbench with a saw, plane and clamps (generator: workbench),
18 a woodcarver's table with chisels, a carving knife and an unfinished carving (generator: carving table).
```

## Ріжемо (для мене)
- `art/slice.sh art/src/sheet-wood.webp 3 6 wood-0 … wood-8 carve-0 … carve-6 gen-wood gen-carve` → `WOOD_ART` у js/love.js
- портрети: cutout → portraits/maksym.webp, maksym-full.webp, khrystyna.webp, khrystyna-full.webp → у PORTRAITS / PORTRAITS_FULL (і пара стоїть у дворику поруч із героєм)
