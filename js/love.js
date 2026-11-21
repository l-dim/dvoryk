"use strict";
/* ============================================================
   КОХАННЯ 💕 і МАЙСТЕРНЯ 🪚
   Сюжетна лінія з 11-го рівня: у село приїжджає майстер з дерева (для героїні — Максим,
   для героя — Христина). Знайомство → побачення → «будемо жити разом?» → спільна майстерня.
   Етапи S.love.stage: 0 — ще не знайомі, 1 — знайомство (3 замовлення), 2 — подарунок на побачення,
   3 — ближче (5 замовлень), 4 — живуть разом, відкрита майстерня.
   МАЙСТЕРНЯ — окрема дошка з дерев'яними ланцюжками, своїми замовленнями й розширенням.
   Стан: S.wood = { board, stage, orders, seq, gens: [], done }, S.woodOn — зараз у майстерні.
   ============================================================ */
/* Партнер — один із намальованих героїв протилежної статі (того ж варіанта: Гулька ↔ Вуса). */
const PARTNER_NAMES = { hero1: "Настя", hero2: "Катерина", hero3: "Христина", hero4: "Мар'яна", hero5: "Олена", hero6: "Софія",
  man1: "Максим", man2: "Богдан", man3: "Назар", man4: "Василь", man5: "Роман", man6: "Ярослав" };
Object.entries(PARTNER_NAMES).forEach(([id, n]) => {
  const he = id.startsWith("man");
  CHARS[id] = { key: id, icon: he ? "👨" : "👩", name: (he ? "Майстер " : "Майстриня ") + n, from: 999,
    ask: ["Мені б для майстерні… 🪚", "Допоможеш? Без цього не доробити 😊", "Можна попросити тебе?"],
    thanks: he ? ["Дякую, ти неймовірна 💛", "Оце так виручила! 🪵", "Що б я без тебе робив 😊"]
               : ["Дякую, ти неймовірний 💛", "Оце так виручив! 🪵", "Що б я без тебе робила 😊"] };
  if (!PORTRAITS.includes(id)) PORTRAITS.push(id);          // portraits/<id>.webp — по пояс, з фігури героя
  const f = typeof HERO_FACE !== "undefined" && HERO_FACE[id];
  if (f) PORTRAIT_FACE[id] = [f[0], Math.min(60, f[1] / 0.55), Math.round(58 / (f[2] / 100))];
});

/* дерев'яні ланцюжки — символи приватної зони (картинки: items/wood-<l>.webp, items/carve-<l>.webp) */
const WOOD_ART = [...Array.from({ length: 9 }, (_, l) => "wood-" + l), ...Array.from({ length: 7 }, (_, l) => "carve-" + l), "gen-wood", "gen-carve"];
window.PUA_MAP = window.PUA_MAP || {};
[["wood", "Столярка", [["🪵", "Тріска"], ["🟫", "Брусок"], ["🪜", "Дошки"], ["🥄", "Дерев'яна ложка"], ["🥣", "Різьблена миска"], ["🧰", "Скринька"], ["🪑", "Стільчик"], ["🛏️", "Колиска"], ["🗄️", "Різьблена шафа"]]],
 ["carve", "Різьблення", [["🌿", "Гілочка"], ["🪈", "Свищик"], ["🐴", "Дерев'яний коник"], ["🪆", "Розписна лялька"], ["🖼️", "Різьблена рамка"], ["🎻", "Скрипка"], ["🕰️", "Годинник із зозулею"]]]
].forEach(([id, name, items], ci) => {
  CHAINS[id] = { name, side: true, woody: true, items: items.map(([e, n], l) => {
    const c = String.fromCharCode(0xE400 + ci * 16 + l), art = `${id}-${l}`;
    PUA_MAP[c] = { e, img: WOOD_ART.includes(art) ? "items/" + art + ".webp" : null }; return [c, n]; }) };
});
[["wood", "🪚", "Верстак"], ["carve", "🪓", "Різьбярський стіл"]].forEach(([id, e, name], k) => {
  const c = String.fromCharCode(0xE400 + 0x40 + k);
  PUA_MAP[c] = { e, img: WOOD_ART.includes("gen-" + id) ? `items/gen-${id}.webp` : null };
  GENS["w_" + id] = { icon: c, name, chain: id, side: true };
});

window.LOVE = (() => {
  const on = () => S && S.love && S.love.stage >= 1;
  const st = () => (S.love || (S.love = { stage: 0, n: 0 }));
  function who() {
    const l = S.love || {};
    if (l.partner && CHARS[l.partner]) return l.partner;
    const h = (window.HERO && HERO.cur()) || { id: S.sex === "m" ? "man1" : "hero1" };
    const n = h.id.replace(/\D/g, "") || "1";
    return (S.sex === "m" ? "hero" : "man") + n;
  }
  const male = () => who().startsWith("man");
  const nm = () => CHARS[who()].name.split(" ").pop();
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const GIFT = { c: "flower", l: 6 };                 // святковий букет на побачення
  const findGift = () => (S.sideOn ? S.main : S.board).findIndex(x => x && !x.g && x.c === GIFT.c && x.l === GIFT.l);

  function init() {
    const l = st();
    if (l.stage >= 1) CHARS[who()].from = 0;          // замовляє, як усі сусіди
    if (l.stage >= 4) WOOD.ensure();
  }
  function onDeliver(o) {
    const l = st();
    if (o.ch !== who() || (l.stage !== 1 && l.stage !== 3)) return;
    l.n++; save();
    const need = l.stage === 1 ? 3 : 5;
    if (l.n < need) { setTimeout(() => toast(`💕 ${nm()}: ${l.n}/${need}`), 1200); return; }
    l.n = 0; l.stage++; save();
    setTimeout(() => l.stage === 2 ? dateInvite() : propose(), 1500);
  }
  function meet() {
    const l = st(); l.partner = who(); l.stage = 1; l.n = 0; CHARS[who()].from = 0; save();
    const he = male();
    playDialog([
      ["halya", `{name}, ${S.sex === "m" ? "ти чув" : "ти чула"}? У село ${he ? "приїхав новий майстер" : "приїхала нова майстриня"} з дерева! ${he ? "Купив" : "Купила"} стару хату біля млина.`],
      [who(), `Добридень! Я ${PARTNER_NAMES[who()]}. Різьблю з дерева — ложки, скриньки, колиски… Тільки ще нікого тут не знаю 😅`],
      [who(), "Допоможеш мені облаштуватися? Я поки буду в тебе дещо замовляти — а потім віддячу 💛"]
    ], () => { fillOrders(); renderOrders(); toast(`💕 Віддай ${PARTNER_NAMES[who()]} 3 замовлення`); });
  }
  function dateInvite() {
    playDialog([
      [who(), `{name}, ти так мені ${S.sex === "m" ? "допоміг" : "допомогла"}… Ходімо ввечері до річки? Там такий захід сонця 🌅`],
      ["olya", "Ой, та це ж побачення! 😍 Тільки з порожніми руками не йди — подаруй святковий букет 💐"]
    ], () => toast("💐 Принеси святковий букет — і йди на побачення (у «Подіях»)"));
  }
  function giveGift() {
    const l = st(); if (l.stage !== 2) return;
    const i = findGift();
    if (i < 0) { sfx.nope(); toast(`Спершу збери ${itemIcon(GIFT)} ${itemName(GIFT)}`); return; }
    (S.sideOn ? S.main : S.board)[i] = null; if (selected === i) selected = -1;
    l.stage = 3; l.n = 0; save(); renderAll(); confetti(); sfx.level();
    playDialog([
      [who(), "Це мені? 🥹 Найгарніший букет у моєму житті…"],
      [who(), `Знаєш… я давно ${male() ? "хотів" : "хотіла"} сказати — з тобою мені тут, як удома 💛`],
      ["halya", "Ой, дивіться-но, голубки над річкою 😊 Будуть люди!"]
    ], () => toast(`💕 Віддай ${nm()} ще 5 замовлень`));
  }
  function propose() {
    const he = male();
    playDialog([
      [who(), `{name}, я довго ${he ? "думав" : "думала"}… Хату біля млина я вже майже ${he ? "відремонтував" : "відремонтувала"}. Тільки без тебе вона порожня.`],
      [who(), `Будемо жити разом? 💍 А стару повітку я ${he ? "переробив" : "переробила"} на майстерню — для нас обох!`],
    ], () => modal({ title: "Будемо жити разом? 💕",
      html: `<div class="big-emoji">💕</div><p>${CHARS[who()].name} кличе тебе жити разом.</p><p class="hint-s">Відкриється спільна майстерня з дерева — окрема дошка з виробами, своїми замовленнями й розширенням.</p>`,
      buttons: [{ label: "Так! 💍", onClick: together }] }));
  }
  function together() {
    const l = st(); l.stage = 4; save();
    WOOD.ensure(); confetti(); sfx.level();
    playDialog([
      ["halya", "Ох, яке щастя! 🥹 Ми з дідом Степаном теж колись отак починали…"],
      ["stepan", "Майстерня — це добре! Руки при ділі — і в хаті лад 🪚"],
      [who(), "Ходімо, покажу майстерню! Кнопка 🪚 під дошкою. Там свої замовлення — сусіди вже чекають на ложки й скриньки 😊"]
    ], () => { renderAll(); WOOD.renderButton(); });
  }
  function tick() {
    if (!S || !S.started || busyUI() || S.sideOn) return;
    const l = st();
    if (l.stage === 0 && S.level >= 11 && S.ordersDone >= 20) meet();
  }
  function card() {
    const l = st(); if (l.stage < 1) return null;
    const sub = l.stage === 1 ? `знайомство: замовлення ${l.n}/3` : l.stage === 2 ? `побачення: подаруй ${itemIcon(GIFT)} святковий букет` : l.stage === 3 ? `ближче: замовлення ${l.n}/5` : "живете разом 💕 · майстерня 🪚";
    return { icon: face(CHARS[who()], "mini"), title: CHARS[who()].name, sub, btn: l.stage === 2 ? "Подарувати 💐" : l.stage >= 4 ? "Майстерня" : "", act: l.stage === 2 ? "love-gift" : l.stage >= 4 ? "wood" : "", ready: l.stage === 2 && findGift() >= 0 };
  }
  return { init, onDeliver, tick, card, giveGift, who, stage: () => st().stage, together: () => st().stage >= 4 };
})();

/* ============================================================ */
const WOOD_STRIP_PRICE = [[3, 200], [5, 350], [8, 550], [12, 900]];
window.WOOD = (() => {
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  function ensure() {
    if (S.wood) return S.wood;
    const board = Array(N).fill(null), mid = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2);
    board[mid] = { g: "w_wood", gl: 1 };
    [mid - 1, mid + 1, mid - COLS].forEach(i => { board[i] = { c: "wood", l: 0 }; });
    S.wood = { board, stage: 0, orders: [], gens: ["wood"], done: 0 };
    save(); renderButton();
    return S.wood;
  }
  const open = () => !!(S.wood && S.love && S.love.stage >= 4);
  function enter() {
    if (!open() || S.woodOn) return;
    if (S.sideOn) { sfx.nope(); toast("Спершу повернись із пригоди 🙂"); return; }
    S.main = S.board; S.board = S.wood.board; S.woodOn = true; S.sideOn = true; selected = -1;
    fillOrders(); sfx.pop(); renderAll(); renderButton(); save();
    if (!S.wood.seen) { S.wood.seen = true; save(); playDialog([[LOVE.who(), "Ось наша майстерня! 🪚 Тапай верстак — буде тріска, з тріски брусок, а там і до шафи недалеко 😄 Енергія та сама, що й на городі."]]); }
  }
  function leave() {
    if (!S.woodOn) return;
    S.wood.board = S.board; S.board = S.main; delete S.main; S.woodOn = false; S.sideOn = false; selected = -1;
    sfx.pop(); renderAll(); renderButton(); save();
  }
  function toggle() { S.woodOn ? leave() : enter(); }
  function renderButton() {
    const b = $("woodBtn"); if (!b) return;
    document.body.classList.toggle("wood-mode", !!S.woodOn);
    b.hidden = !open() || (S.sideOn && !S.woodOn);
    b.classList.toggle("on", !!S.woodOn);
    document.body.classList.toggle("wood-mode", !!S.woodOn);
    b.innerHTML = S.woodOn ? `<span class="sd-ic">🪴</span><small>Город</small>` : `<span class="sd-ic">🪚</span><small>Майстерня</small>`;
  }
  /* замовлення майстерні */
  function order() {
    const w = S.wood, chains = w.gens;
    const busy = w.orders.map(o => o.ch);
    let pool = Object.keys(CHARS).filter(c => (CHARS[c].from || 0) <= S.chapter && c !== "cat" && c !== "collector" && !(window.WD && WD.isSick(c)) && !busy.includes(c));
    if (!pool.length) return null;
    const ch = LOVE.who() && !busy.includes(LOVE.who()) && Math.random() < 0.3 ? LOVE.who() : pick(pool);
    const count = Math.random() < 0.6 ? 1 : 2, items = [];
    const cap = Math.min(7, 2 + Math.floor(w.done / 6));
    for (let n = 0; n < count; n++) { const c = pick(chains), len = CHAINS[c].items.length; items.push({ c, l: Math.min(len - 1, 1 + rnd(cap)) }); }
    let coins = 0, xp = 0, top = 0;
    items.forEach(it => { coins += Math.round(itemValue(it.c, it.l) * 1.1); xp += (it.l + 1) * 3; top = Math.max(top, it.l); });
    const o = { id: ++S.orderSeq, ch, items, coins, xp, stars: top >= 4 ? 2 : 1, wood: true, line: rnd(3), born: Date.now() };
    return window.WH ? WH.maybeSet(o) : o;
  }
  function onDeliver(o) {
    if (!o.wood) return;
    const w = S.wood; w.done++;
    if (w.done === 10 && !w.gens.includes("carve")) {
      w.gens.push("carve"); placeItem({ g: "w_carve", gl: 1 });
      setTimeout(() => playDialog([[LOVE.who(), `Ти так гарно працюєш! Я ${LOVE.who().startsWith("man") ? "поставив" : "поставила"} тобі різьбярський стіл 🪓 — тепер і коників, і скрипки робитимемо!`]]), 1500);
    }
    save();
  }
  function stripPrice(k) { return WOOD_STRIP_PRICE[k] || null; }
  function card() { return open() ? { icon: "🪚", title: "Майстерня", sub: `виробів віддано: ${S.wood.done} · дошка ${S.wood.stage}/4`, btn: S.woodOn ? "Ти тут" : "Перейти", act: "wood" } : null; }
  function tick() { renderButton(); }
  return { ensure, enter, leave, toggle, renderButton, order, onDeliver, stripPrice, card, tick, open };
})();
