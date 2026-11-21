# Герої — 6 жінок і 6 чоловіків (на повний зріст)

По одній картинці на запит. Прикріпи будь-яку фігуру сусіда на повний зріст (наприклад `olya-full` для жінок, `andriy-full` для чоловіків) як зразок стилю.
Збережи як `hero1.png` … `hero6.png` і `man1.png` … `man6.png`. Можна не всі одразу — гра покаже мальованими тих, що є.

## Спільний шаблон для жінок
```
A new character in exactly the same hand-painted cartoon art style, proportions and warm lighting as the attached image: a friendly young Ukrainian woman around 30, the main heroine of a cozy village farm game, kind face, big expressive eyes, warm happy smile, natural look. FULL BODY, standing, the whole figure visible from the top of the head down to the shoes, nothing cut off. Relaxed friendly pose, slightly turned, looking at the viewer, one hand waving hello. Plain solid pure white background, no ground, no shadow, no text, no frame. Vertical image, 3:4.
Look: ...
```
- **hero1 — Світла коса:** `long light-blonde hair in a thick side braid with a small ribbon, fair skin, a light-blue linen sundress with tiny white flowers over a white blouse with embroidered cuffs, white sneakers, holding a small basket of apples.`
- **hero2 — Темне каре:** `a dark-brown chin-length bob with a fringe, light olive skin, a green cotton dress with a cream apron embroidered with red flowers, brown ankle boots, holding a wooden spoon.`
- **hero3 — Руді кучері:** `bouncy copper-red curly hair to the shoulders, freckles, a mustard-yellow knitted cardigan over a white embroidered blouse, a denim midi skirt, brown loafers, holding a little pot with a seedling.`
- **hero4 — Гулька:** `long dark hair tied up in a neat bun with a few loose strands, warm tan skin, a red dress with white polka dots and a thin belt, red ballet flats, holding a bouquet of sunflowers.`
- **hero5 — Хвостик:** `light-brown hair in a high ponytail, a blue-and-white checked shirt with rolled sleeves under denim overalls, green rubber garden boots, gardening gloves sticking out of the pocket, holding a watering can.`
- **hero6 — Солом'яний капелюх:** `a short black pixie haircut under a wide straw hat with a yellow ribbon, light skin with rosy cheeks, a lavender blouse with puffy sleeves, beige linen trousers, straw sandals, holding a little basket of eggs.`

## Спільний шаблон для чоловіків
```
A new character in exactly the same hand-painted cartoon art style, proportions and warm lighting as the attached image: a friendly young Ukrainian man around 30, the main hero of a cozy village farm game, kind face, big expressive eyes, warm happy smile, natural look. FULL BODY, standing, the whole figure visible from the top of the head down to the shoes, nothing cut off. Relaxed friendly pose, slightly turned, looking at the viewer, one hand waving hello. Plain solid pure white background, no ground, no shadow, no text, no frame. Vertical image, 3:4.
Look: ...
```
- **man1 — Русявий чуб:** `tousled light-brown hair with a forelock, clean-shaven, a white linen shirt with red-and-black embroidery on the collar and cuffs, blue jeans, brown boots, holding a small basket of apples.`
- **man2 — Борода:** `short dark hair and a neat dark beard, a green-and-black checked flannel shirt with rolled sleeves, brown work trousers, sturdy boots, holding a small wooden toolbox with a hammer.`
- **man3 — Рудий:** `curly copper-red hair, freckles, a light stubble, a mustard-yellow knitted sweater over a white shirt collar, dark-green corduroy trousers, brown shoes, holding a little pot with a seedling.`
- **man4 — Вуса:** `short black hair combed back, a neat black moustache, warm tan skin, a white embroidered shirt (vyshyvanka) with a red woven sash, dark trousers, black boots, holding a bouquet of sunflowers.`
- **man5 — Кашкет:** `a flat cap over short sandy hair, a blue-and-white checked shirt under denim overalls, green rubber garden boots, gardening gloves sticking out of the pocket, holding a watering can.`
- **man6 — Бриль:** `dark curly hair under a wide straw hat with a blue ribbon, light skin with rosy cheeks, a cream linen shirt with sleeves rolled up, beige linen trousers, straw sandals, holding a little basket of eggs.`

## Ріжемо (для мене)
`cutout <картинка> portraits/<id>-full.png 640` → webp; id додати в `HERO_ART` (js/hero.js) і в sw.js.
