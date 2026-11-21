# Весільне вбрання — 6 пар (наречена й наречений на одній картинці)

Пари в грі сталі: героїня heroN одружується з героєм manN (і навпаки). Тому малюємо 6 картинок, по дві фігури на кожній.
До кожного запиту прикріпи дві картинки-зразки: `portraits/heroN-full.webp` і `portraits/manN-full.webp` (з папки гри).
Збережи як `wed1.png` … `wed6.png`. Можна по одній — я поріжу кожну на `heroN-wed` і `manN-wed`.

## Спільний шаблон
```
The SAME two characters as in the attached images (keep their faces, hair, skin tone and body proportions exactly), in exactly the same hand-painted cartoon art style and warm lighting, now dressed for a traditional Ukrainian village wedding. Two separate FULL BODY figures standing side by side with a clear gap of white space between them (they must NOT touch or overlap): the bride on the left, the groom on the right, both slightly turned towards each other, looking at the viewer with happy shy smiles. The whole of each figure is visible from the top of the head down to the shoes, nothing cut off. Plain solid pure white background, no ground, no shadow, no text, no frame. Horizontal image, 4:3.
Bride: a white linen embroidered blouse (vyshyvanka) with red-and-black folk embroidery on wide sleeves, a dark-red woolen skirt with a woven apron, a black velvet sleeveless vest (korsetka), several strings of red coral beads, a lush wedding flower crown (vinok) of red poppies, white daisies and wheat ears with long colorful ribbons flowing down her back, red leather boots, holding an embroidered wedding towel (rushnyk). ...
Groom: a white embroidered shirt (vyshyvanka) with red-and-black embroidery on the collar and cuffs, a wide red woven sash, dark wide trousers tucked into black leather boots, a small flower and periwinkle boutonniere on the chest, holding a round decorated wedding bread (korovai). ...
```
Замість «...» у кінці рядків Bride і Groom додай риси пари:

1. **wed1 (hero1 + man1):** Bride `— long light-blonde hair in a thick side braid woven with ribbons, fair skin.` · Groom `— tousled light-brown hair with a forelock, clean-shaven.`
2. **wed2 (hero2 + man2):** Bride `— a dark-brown chin-length bob with a fringe, light olive skin.` · Groom `— short dark hair and a neat dark beard.`
3. **wed3 (hero3 + man3):** Bride `— bouncy copper-red curly hair to the shoulders, freckles.` · Groom `— curly copper-red hair, freckles, light stubble.`
4. **wed4 (hero4 + man4):** Bride `— long dark hair in a neat bun under the flower crown, warm tan skin.` · Groom `— short black hair combed back, a neat black moustache, warm tan skin.`
5. **wed5 (hero5 + man5):** Bride `— light-brown hair in a high ponytail tied with wedding ribbons.` · Groom `— short sandy hair, no cap today, combed neatly.`
6. **wed6 (hero6 + man6):** Bride `— a short black pixie haircut, light skin with rosy cheeks, the flower crown a bit bigger to make up for the short hair.` · Groom `— dark curly hair (no straw hat today), light skin with rosy cheeks.`

## Ріжемо (для мене)
- `splitfig` → дві фігури → `cutout` → `portraits/heroN-wed.webp`, `portraits/manN-wed.webp`
- у js/hero.js: вбрання «wed» у весільні дні (FAM.festive) і в виборі вбрання; без картинки — святкове, як зараз.
