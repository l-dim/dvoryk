# Гардероб сусідів — промпти для Gemini

## 1. Речі колекцій (3 аркуші)

Прикріпи будь-який готовий аркуш предметів (наприклад, рибалку чи інгредієнти) як зразок стилю.
Встав **загальний опис**, а одразу за ним — список аркуша.

```
Game item icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute clothing and accessory objects with soft painterly shading and a subtle rim light, rich saturated colors, clean readable silhouettes, slight 3/4 front view, each item shown on its own (not worn by anyone). Arrange them in a strict grid of 3 columns by 4 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each object centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no numbers. Square-ish image.
```

**sheet-fash1** (3×4) — «Святковий віночок» (Оля) + початок «Козацького строю»:
```
1 a Ukrainian floral wreath (vinok) of red poppies, cornflowers and daisies with long colorful ribbons, 2 a white Ukrainian embroidered woman's blouse (vyshyvanka) with red and black floral embroidery on the sleeves, 3 a dark green velvet sleeveless corset vest (kersetka) with gold trim, 4 a traditional checked woven wrap skirt (plakhta) in red, green and black, 5 a long woven red sash belt (kraika) with geometric pattern and tassels, 6 a necklace of several strands of red coral beads with a small silver cross pendant, 7 a pair of tall red leather boots with small heels, 8 a bunch of long satin ribbons in red, yellow, blue and green, 9 a white Ukrainian embroidered man's shirt with a red-black embroidered collar and cuffs, 10 a pair of wide dark-blue Cossack trousers (sharovary), 11 a long wide red silk sash (kushak), 12 a long crimson Cossack coat (zhupan) with gold buttons.
```

**sheet-fash2** (3×4) — кінець «Козацького строю» + «Бабусин недільний» (Галя):
```
1 a tall black lambswool Cossack hat (smushkova shapka), 2 a pair of tall black leather riding boots, 3 a worn leather shoulder bag (torba) with a strap, 4 a wooden folk flute (sopilka) with carved finger holes, 5 a large woolen headscarf with big red roses on a black background, folded, 6 a plain white linen blouse with fine white embroidery, 7 a long dark navy pleated skirt, 8 a white apron with red cross-stitch embroidery along the hem, 9 a Hutsul sheepskin vest (keptar) decorated with colorful embroidery and small leather tassels, 10 a necklace of large round red coral beads, 11 a pair of polished black Sunday shoes with small buckles, 12 a wicker basket covered with an embroidered towel (rushnyk).
```

**sheet-fash3** (3×3, тільки 9 клітинок) — «Ярмаркове літо» (Марічка) + значок клаптиків:
```
(у загальному описі заміни "3 columns by 4 rows" на "3 columns by 3 rows")
1 a straw sun hat with a blue ribbon and a sunflower, 2 a girl's light summer sundress with a small flower print, 3 a big red satin hair bow, 4 a pair of little brown leather summer sandals, 5 a small wreath of white daisies, 6 a small wicker basket full of strawberries, 7 a red rooster-shaped lollipop on a stick, 8 a yellow-and-blue balloon on a string, 9 a little bundle of colorful fabric scraps and a spool of thread tied with a ribbon.
```

## 2. Сусіди в нових строях (4 фігури на повний зріст)

До кожного запиту прикріпи цього персонажа на повний зріст (`olya-full`, `andriy-full`, `halya-full`, `marichka-full`).
Збережи як `olya-vinok.png`, `andriy-kozak.png`, `halya-nedilia.png`, `marichka-yarmarok.png`.

**Спільний шаблон** (останній рядок заміни рядком персонажа):
```
The same character as in the attached image: same face, same hairstyle, same body shape, same hand-painted cartoon art style and warm lighting. Now dressed in a festive traditional Ukrainian outfit, proud and happy, as if going to a village holiday. FULL BODY, standing, the whole figure visible from the top of the head down to the shoes, nothing cut off. Relaxed friendly pose, looking at the viewer with a warm smile. Plain solid pure white background, no ground, no shadow, no text, no frame. Vertical image, 3:4.
Outfit: ...
```

- **olya-vinok:** `a floral wreath of poppies and cornflowers with long colorful ribbons flowing down her back, a white embroidered vyshyvanka blouse, a dark green velvet kersetka vest with gold trim, a checked plakhta wrap skirt, a red woven sash belt, several strands of red coral beads, tall red boots.`
- **andriy-kozak:** `a white embroidered shirt, wide dark-blue sharovary trousers, a long red silk sash, a crimson zhupan coat worn open, a tall black lambswool hat, tall black boots, a leather bag over the shoulder, holding a wooden sopilka flute; still recognisable as the friendly village cook.`
- **halya-nedilia:** `a big black woolen headscarf with red roses tied under the chin, a white embroidered blouse, a long dark navy skirt, a white apron with red cross-stitch, a colorful embroidered Hutsul keptar vest, large red coral beads, polished black shoes, carrying a basket covered with an embroidered rushnyk.`
- **marichka-yarmarok:** `a straw sun hat with a blue ribbon and a sunflower, a light flowery summer sundress, a big red bow in her braid, little brown sandals, a daisy wreath on her wrist, holding a basket of strawberries in one hand and a yellow-and-blue balloon in the other.`

## Як ріжемо (для мене)
```
art/slice.sh art/src/sheet-fash1.webp 3 4 fash-vinok-0 fash-vinok-1 fash-vinok-2 fash-vinok-3 fash-vinok-4 fash-vinok-5 fash-vinok-6 fash-vinok-7 fash-kozak-0 fash-kozak-1 fash-kozak-2 fash-kozak-3
art/slice.sh art/src/sheet-fash2.webp 3 4 fash-kozak-4 fash-kozak-5 fash-kozak-6 fash-kozak-7 fash-nedilia-0 fash-nedilia-1 fash-nedilia-2 fash-nedilia-3 fash-nedilia-4 fash-nedilia-5 fash-nedilia-6 fash-nedilia-7
art/slice.sh art/src/sheet-fash3.webp 3 3 fash-yarmarok-0 fash-yarmarok-1 fash-yarmarok-2 fash-yarmarok-3 fash-yarmarok-4 fash-yarmarok-5 fash-yarmarok-6 fash-yarmarok-7 ui-thread
```
Після нарізки: id речей — у `FASH_ART`, фігури — у `FASH_LOOKS` (js/fashion.js), файли — у sw.js.
Порядок речей у промптах збігається з порядком у `FASHION` (козацький стрій: сорочка, шаровари, кушак, жупан, шапка, чоботи, торба, сопілка).
