# Значки для нових механік — 1 аркуш 3×4

Прикріпи як зразок стилю старий аркуш значків інтерфейсу (зірочка, шестерня, будиночок, крамничка…).

```
Game UI icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute icons with soft painterly shading, a subtle rim light and a thin darker outline, rich saturated warm colors, clean readable silhouettes that still read well at a small size, slight 3/4 front view. Arrange them in a strict grid of 3 columns by 4 rows of equal square cells, left to right, top to bottom, in the numbered order below. Each icon centered in its own cell, fully inside it with a generous white margin, all about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no letters, no numbers. Square-ish image.
1 a small festive fair tent with red-and-white stripes, little triangle flags and a golden top,
2 a big carved wooden spoon with a painted Ukrainian folk flower ornament on the handle,
3 a round gold medal with a star in the middle on a red-and-blue ribbon,
4 a shiny gold medal with a laurel wreath embossed on it on a short red ribbon,
5 a shiny silver medal with a laurel wreath embossed on it on a short blue ribbon,
6 a shiny bronze medal with a laurel wreath embossed on it on a short green ribbon,
7 a cream paper envelope sealed with a red wax seal in the shape of a heart,
8 a small tear-off wall calendar with a red top bar, two rings and a tiny sunflower drawn on the page,
9 a small wooden folk-painted cupboard with its doors slightly open and jars and a basket inside,
10 an embroidered Ukrainian dress on a wooden dressmaker's mannequin with a flower wreath on top,
11 a small wooden ballot box with a slot and two pink hearts flying into it,
12 a small stack of three instant photos (polaroids) with a vintage camera leaning on them.
```

Збережи як `sheet-ui2`. Ріжемо:
```
art/slice.sh art/src/sheet-ui2.webp 3 4 ui-events ui-spoon ui-medal ui-gold ui-silver ui-bronze ui-mail ui-calendar ui-cabinet ui-look ui-vote ui-album
```
Мапа в UI_ICONS: 🎪 ui-events · 🥄 ui-spoon · 🏅 ui-medal · 🥇 ui-gold · 🥈 ui-silver · 🥉 ui-bronze · ✉️ ui-mail · 📅 ui-calendar · 🗄️ ui-cabinet · 💃 ui-look · 🗳️ ui-vote · 📷 ui-album

---

# Котик на скрині й альбом листівок — аркуш 2×1

Прикріпи аркуш значків вище як зразок стилю (і портрет котика `cat` — щоб це був саме Пиріжок).

```
Game UI icon sheet for a cozy mobile farm game, in the same hand-painted cartoon art style and warm lighting as the attached image. Glossy, chunky, cute icons with soft painterly shading, a subtle rim light and a thin darker outline, rich saturated warm colors, clean readable silhouettes that still read well at a small size, slight 3/4 front view. Exactly 2 icons side by side in a strict grid of 2 columns by 1 row of equal square cells, each icon centered in its own cell with a generous white margin, both about the same size. Plain solid pure white background, no cell borders, no shadows on the background, no text, no letters, no numbers. Wide image, 2:1.
1 the same fluffy ginger cat with a little blue bow tie as in the attached cat picture, sitting proudly on top of a closed old wooden treasure chest with iron corners and a golden lock, a few gold coins peeking out from under the lid, the cat looking smug and pleased,
2 a cozy postcard album: an open little album with a red cloth cover and gold corners, with three colorful picture postcards (a sunflower, a cherry branch, a little village house) fanned out of it and a small red heart sticker on top.
```

Збережи як `sheet-ui3`. Ріжемо:
```
art/slice.sh art/src/sheet-ui3.webp 2 1 ui-catchest ui-postcards
```
ui-catchest — картинкою в картці «Котик на скрині» і значку на замовленні котика; ui-postcards — замість 💌 по всій грі.

---

# Дрібні значки інтерфейсу — аркуш 3×4 (sheet-ui4)

Той самий загальний опис, що й для першого аркуша значків (вище), зі списком:
```
1 a clipboard with a checklist of three ticked lines and a pencil clipped on top,
2 a small wooden gift crate with a slot on top and a ribbon, like a parcel inbox,
3 a round red alarm clock with two bells on top,
4 three puffy blue "Z" letters floating above a small fluffy cloud (sleep symbol),
5 a torn piece of an old treasure map with a dotted path and a red X,
6 a single orange cat paw print with pink toe beans,
7 a glossy plump golden-yellow heart,
8 a small weekly planner calendar with seven little colored squares,
9 two curved green arrows forming a circle (refresh / swap),
10 a big glossy question mark made of wood on a small round wooden stand,
11 a glossy plump pink heart with a small sparkle,
12 a small festive wheel of fortune with colored segments and a red pointer on top.
```
Ріжемо: `art/slice.sh art/src/sheet-ui4.webp 3 4 ui-quests ui-inbox ui-timer ui-sleep ui-map ui-paw ui-friend ui-week ui-swap ui-unknown ui-heart ui-wheel`
Мапа: 📋 ui-quests · 📥 ui-inbox · ⏰ ui-timer · 💤 ui-sleep · 🗺️ ui-map · 🐾 ui-paw · 💛 ui-friend · 🗓️ ui-week · 🔄 ui-swap · ❔ ui-unknown · 💗 ui-heart · 🎡 ui-wheel
