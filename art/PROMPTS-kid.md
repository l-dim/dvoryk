# Малюк підростає — 2 картинки (дівчинка й хлопчик), по 2 фігури

Немовля вже є (сповиток, `items/deco-baby.webp`). Домальовуємо два наступні віки.
Прикріпи як зразок стилю фігуру героя на повний зріст (наприклад `portraits/hero1-full.webp`).
Збережи як `kid-girl.png` і `kid-boy.png` — я поріжу на `kid-girl-1`, `kid-girl-2`, `kid-boy-1`, `kid-boy-2`.

## Дівчинка
```
Two new characters in exactly the same hand-painted cartoon art style, proportions and warm lighting as the attached image: the same little Ukrainian girl at two ages. Two separate FULL BODY figures side by side with a clear gap of white space between them (they must NOT touch or overlap), each fully visible from head to feet, nothing cut off. Plain solid pure white background, no ground, no shadow, no text, no frame. Horizontal image, 4:3.
Left: a chubby toddler girl about 1 year old with soft light-brown hair and a tiny red bow, a white embroidered baby shirt and red knitted booties, sitting on the floor and happily holding up a curly wood shaving like a treasure.
Right: the same girl at about 4 years old, light-brown hair in two short braids with red ribbons, a white embroidered blouse, a small red skirt with an apron, red boots, proudly carrying a small armful of wood chips and a little wooden bar, big happy smile.
```

## Хлопчик
```
Two new characters in exactly the same hand-painted cartoon art style, proportions and warm lighting as the attached image: the same little Ukrainian boy at two ages. Two separate FULL BODY figures side by side with a clear gap of white space between them (they must NOT touch or overlap), each fully visible from head to feet, nothing cut off. Plain solid pure white background, no ground, no shadow, no text, no frame. Horizontal image, 4:3.
Left: a chubby toddler boy about 1 year old with soft light-brown hair sticking up, a white embroidered baby shirt and blue knitted booties, sitting on the floor and happily holding up a curly wood shaving like a treasure.
Right: the same boy at about 4 years old, tousled light-brown hair, a white embroidered shirt with a red sash, little dark trousers, small boots, proudly carrying a small armful of wood chips and a little wooden bar, big happy smile.
```

## Ріжемо (для мене)
- `splitfig`/половинки → `cutout … 420` → `portraits/kid-girl-1.webp`, `kid-girl-2.webp`, `kid-boy-1.webp`, `kid-boy-2.webp`
- js/family.js: вік малюка (немовля → 2 тижні: повзає → 6 тижнів: ходить), стать при народженні, у дворику — фігура за віком
