"use strict";
/* ============================================================
   ПІСЛЯ 30 РІВНЯ 🐝 — ще чотири генератори з власними ланцюжками:
   Пасіка (32), Ягідник (36), Ткацька світлиця (40), Стайня (45).
   Кожен приходить із сусідом і діалогом (ENDLESS.tick), а сусіди починають
   замовляти нове. Предмети — символи приватної зони (PUA): поки малюнків нема,
   показуємо 3D-емодзі-замінник; коли аркуші sheet-late1/2 наріжемо —
   досить дописати id у LATE_ART.
   ============================================================ */
const LATE_ART = ["apiary", "berries", "weave", "stable"].flatMap(g => ["gen-" + g, ...[0, 1, 2, 3, 4, 5].map(l => g + "-" + l)]);   // аркуші sheet-late1/2
const LATE_GENS = [
  { id: "apiary", lvl: 32, base: 0xE900, gen: ["🐝", tt`Пасіка`], name: tt`Пасіка`, who: "vasyl",
    items: [["🧇", tt`Вощина`], ["🍯", tt`Баночка меду`], ["🥄", tt`Медова ложечка`], ["🕯️", tt`Воскова свічка`], ["🍪", tt`Медяник`], ["🎂", tt`Медовий торт`]],
    line: tt`{name}, мої бджоли роїлися — забирай рій собі! 🐝 Поставимо вулики біля саду, і буде в тебе свій мед, віск і медяники.`,
    ing: ["sweet"], wants: tt`мед, віск і медяники` },
  { id: "berries", lvl: 36, base: 0xE910, gen: ["🫐", tt`Ягідник`], name: tt`Ягідник`, who: "olya",
    items: [["🍒", tt`Гроно смородини`], ["🍓", tt`Лукошко полуниць`], ["🧺", tt`Кошик чорниць`], ["🫙", tt`Банка варення`], ["🥧", tt`Ягідний пиріг`], ["🍰", tt`Ягідний торт`]],
    line: tt`{name}, я тобі кущики смородини й малини розсадила 🫐 Ягідник — це і варення на зиму, і пироги, і радість для малечі!`,
    ing: ["berry"], wants: tt`ягоди, варення й пироги` },
  { id: "weave", lvl: 40, base: 0xE920, gen: ["🪡", tt`Ткацька світлиця`], name: tt`Ткацтво`, who: "halya",
    items: [["🌿", tt`Пучок льону`], ["🧶", tt`Клубок ниток`], ["📜", tt`Сувій полотна`], ["🧣", tt`Вишитий рушник`], ["👚", tt`Вишиванка`], ["🖼️", tt`Тканий килим`]],
    line: tt`{name}, мій ткацький верстат застоявся без діла 🪡 Бери його — з льону вийде полотно, з полотна — рушники й вишиванки на все село.`,
    ing: ["grain"], wants: tt`полотно, рушники й вишиванки` },
  { id: "stable", lvl: 45, base: 0xE930, gen: ["🐴", tt`Стайня`], name: tt`Стайня`, who: "stepan",
    items: [["🧲", tt`Підкова на щастя`], ["🎀", tt`Стрічки для гриви`], ["🐴", tt`Лоша`], ["🐴", tt`Коник`], ["🏅", tt`Коник у віночку`], ["🛷", tt`Святкові сани`]],
    line: tt`{name}, я вже старий за конем ходити, а він у мене золотий 🐴 Бери стайню — і на ярмарок поїдеш, і на Різдво в санях покатаєшся!`,
    ing: ["veg"], wants: tt`підкови, коників і сани` }
];

(() => {
  window.PUA_MAP = window.PUA_MAP || {};
  const art = id => (LATE_ART.includes(id) ? `items/${id}.webp` : null);
  LATE_GENS.forEach(g => {
    const items = g.items.map(([e, n], l) => { const c = String.fromCharCode(g.base + l); PUA_MAP[c] = { e, img: art(`${g.id}-${l}`) }; return [c, n]; });
    const gc = String.fromCharCode(g.base + 7); PUA_MAP[gc] = { e: g.gen[0], img: art("gen-" + g.id) };
    CHAINS[g.id] = { name: g.name, items };
    GENS[g.id] = { icon: gc, name: g.gen[1], chain: g.id };
    if (!PRODUCT_CHAINS.includes(g.id)) PRODUCT_CHAINS.push(g.id);
    // у форматі NEW_GENS — щоб ENDLESS.tick видав генератор на своєму рівні з діалогом
    if (typeof NEW_GENS !== "undefined" && !NEW_GENS.some(x => x.id === g.id))
      NEW_GENS.push({ id: g.id, lvl: g.lvl, gen: [gc, g.gen[1]], name: g.wants, who: g.who, items, line: g.line });
    if (typeof ING_FROM !== "undefined") ING_FROM[g.id] = g.ing;
  });
})();
