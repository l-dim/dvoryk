# Що лишилось домалювати

## 1. Малюк у зимовому — 2 картинки (дівчинка й хлопчик), по 2 фігури
Прикріпи як зразок цього ж малюка: `portraits/kid-girl-2.webp` (для дівчинки) або `portraits/kid-boy-2.webp` (для хлопчика).
Збережи як `kid-girl-winter.png` і `kid-boy-winter.png`.

### Дівчинка
```
The same little Ukrainian girl as in the attached image, in exactly the same hand-painted cartoon art style, proportions and warm lighting, now dressed for a snowy winter. Two separate FULL BODY figures of her side by side with a clear gap of white space between them (they must NOT touch or overlap), each fully visible from head to feet, nothing cut off. Plain solid pure white background, no snow on the ground, no ground, no shadow, no text, no frame. Horizontal image, 4:3.
Left: the chubby toddler girl about 1 year old in a cosy cream knitted winter overall with a hood with little ears, a red scarf and red mittens on a string, sitting and happily holding a snowball.
Right: the same girl at about 4 years old in a red winter coat with white fur trim, a knitted hat with a pompom over her two braids, a white scarf, red mittens and white felt boots, proudly carrying a small armful of firewood, big happy smile.
```

### Хлопчик
```
The same little Ukrainian boy as in the attached image, in exactly the same hand-painted cartoon art style, proportions and warm lighting, now dressed for a snowy winter. Two separate FULL BODY figures of him side by side with a clear gap of white space between them (they must NOT touch or overlap), each fully visible from head to feet, nothing cut off. Plain solid pure white background, no snow on the ground, no ground, no shadow, no text, no frame. Horizontal image, 4:3.
Left: the chubby toddler boy about 1 year old in a cosy blue knitted winter overall with a hood with little ears, a striped scarf and blue mittens on a string, sitting and happily holding a snowball.
Right: the same boy at about 4 years old in a blue winter jacket, a knitted hat with ear flaps, a red scarf, mittens, warm trousers and felt boots, proudly pulling a tiny wooden sled with a few logs on it, big happy smile.
```

## 2. Прикраси для двору — аркуш 4×2
Прикріпи як зразок стилю аркуш хліва (sheet-farm-e).
```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute objects with soft painterly shading and a subtle rim light, clean readable silhouettes, slight 3/4 front view, warm Ukrainian village details. Arrange them in a strict grid of 4 columns by 2 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers.
1 a cheerful snowman with a carrot nose, a red knitted hat and a broom,
2 a festive wooden table with an embroidered tablecloth, a round korovai bread and a clay jug,
3 a warm glowing lantern on a little wooden post,
4 a small wooden garden gate with a carved top,
5 a cosy little wooden sofa-bench with embroidered cushions,
6 a simple wooden village chair,
7 a small wooden yard sign on a stake decorated with flowers,
8 a cute wooden birdhouse on a pole with a little bird on the roof.
```

## 3. Втомлена земля — аркуш 2×2 (промпт у `art/PROMPTS-soil.md`)

## Ріжемо (для мене)
- малюк: половинки → `cutout … 420` → `portraits/kid-girl-1-winter`, `kid-girl-2-winter`, `kid-boy-1-winter`, `kid-boy-2-winter`; додати в `KID_ART` (js/family.js)
- прикраси: `art/slice.sh art/src/sheet-decor2.webp 4 2 deco-snowman deco-table deco-lantern deco-gate deco-sofa deco-chair deco-sign deco-birdhouse` → UI_ICONS ⛄ 🍽️ 🏮 🚪 🛋️ 🪑 🪧; шпаківня — нова прикраса в «Двір на свій смак»
