# Translation guide (Ukrainian → English)

The game is a cozy merge game set in a Ukrainian village yard. It quietly introduces players
around the world to Ukrainian life: food, holidays, crafts, songs, neighbors. Translations should feel
warm, playful and natural in English — not literal — while keeping Ukrainian culture visible.

## Format rules (must follow exactly)
- Keep every placeholder `{0}`, `{1}`… — same set, any order. Keep `{name}` (the player's name) as is.
- Keep HTML tags and attributes exactly (`<b>`, `<p class="hint-s">`, `<span …>`); translate only visible text.
- Keep emojis. Keep numbers. Keep leading/trailing spaces implied by the source (e.g. a string ending in ": ").
- Plural keys look like `монетка|монетки|монеток` → translate as `{ "one": "coin", "other": "coins" }`.
- Straight quotes "…" instead of «…». Em dashes are fine.
- UI labels and buttons: short, about the same length as the source. Sentence case.
- If the Ukrainian text is a fragment glued to other text (e.g. `до кінця `, `у `), translate as a fragment that will read naturally.

## Voice
- The player is addressed as "you", warm and friendly. Ukrainian addresses the player as a woman by default;
  English is gender-neutral — never "girl", "lady".
- `господинько` / `господине` (affectionate address to the player) → "dear" (or "neighbor" when it fits).
- Neighbors talk like real people: Granny is tender, Grandpa is gruff and kind, Marichka is a little kid.
- Exclamations: "Yay!", "Oh my!", "Hooray!" — keep the playful energy; don't over-translate interjections.

## Names (characters keep Ukrainian names)
| Ukrainian | English |
|---|---|
| Бабуся Галя | Granny Halya |
| Дід Степан | Grandpa Stepan |
| Сусідка Оля | Olya next door |
| Марічка | Marichka |
| Кухар Андрій | Chef Andriy |
| Подруга Ліза | Liza (friend) → "Liza" in dialog, "Friend Liza" as a title |
| Кіт Пиріжок | Pyrizhok the cat ("pyrizhok" = a little pie) |
| Листоноша Іван | Ivan the mailman |
| Фотограф Тарас | Taras the photographer |
| Вчителька Ірина | Ms. Iryna, the teacher |
| Миколай (Святий Миколай) | St. Nicholas |

## Game terms
| Ukrainian | English |
|---|---|
| Затишний дворик / Дворик | Cozy Yard |
| Город (tab, board) | Garden |
| Дворик (tab) | Yard |
| Крамничка | Shop |
| Події | Events |
| Колекція | Collection |
| монетки 🪙 | coins |
| зірочки ⭐ | stars |
| енергія ⚡ | energy |
| рівень / рів. | level / lvl |
| розділ (історії) | chapter |
| замовлення | order |
| генератор | producer (only if the word appears; usually use the item's name) |
| об'єднуй / злий | merge |
| дошка | board |
| Скарбничка (real purchases) | Treasury |
| Довідник господині | Home Guide |
| Пошта | Mail |
| Хмара | Cloud |
| год / хв / с | h / min / s |
| Чаювання | Tea time |

Item names: Насіннячко Seed, Паросток Sprout, Салат Lettuce, Огірочок Cucumber, Морквинка Carrot,
Помідор Tomato, Кукурудза Corn, Гарбуз Pumpkin; Колосок Wheat ear, Борошно Flour, Коржик Flatbread,
Крендель Pretzel, Хлібина Loaf, Круасан Croissant, Кекс Cupcake, Пиріг Pie, Торт Cake;
Грядка Garden bed, Комора Pantry, Яблунька Apple tree, Квітковий кошик Flower basket, Чайничок Teapot,
Медовий горщик Honey pot, Курник Henhouse.

## Ukrainian culture: keep the word, add meaning lightly
Keep these Ukrainian words (transliterated, capitalized like English nouns where natural). Where the
string *defines or introduces* the thing (an item name, a description, a guide entry), add a short
gloss once: "varenyky (Ukrainian dumplings)". In casual dialog just use the word.

| Ukrainian | English |
|---|---|
| борщ | borscht |
| вареники | varenyky (dumplings) |
| пиріжки | pyrizhky (little pies) |
| паляниця | palianytsia (round bread) |
| паска | paska (Easter bread) |
| писанка | pysanka (decorated Easter egg) |
| кутя | kutia (Christmas wheat pudding) |
| узвар | uzvar (dried-fruit drink) |
| сало | salo |
| вишиванка | vyshyvanka (embroidered shirt) |
| рушник | rushnyk (embroidered towel) |
| вінок | vinok (flower crown) |
| хата | khata (cottage) — or simply "house" in UI |
| толока | toloka (neighbors working together) |
| колядки / щедрівки | koliadky / shchedrivky (carols) |
| Святвечір | Holy Eve (Sviat Vechir) |
| Купала / Івана Купала | Kupala Night |
| Великдень | Easter |
| Різдво | Christmas |
| Андріївські вечорниці | St. Andrew's Eve evening |
| Петриківка / петриківський розпис | Petrykivka painting |
| мавка | mavka (forest spirit) |
| гопак | hopak |
| бандура | bandura |
| ярмарок | fair (Ukrainian fair) |
| світлиця | front room (svitlytsia) |
