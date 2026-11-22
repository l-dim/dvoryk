"use strict";
/* ============================================================
   ХЛІВ 🐄 · ПОГОДА ☀️🌧️ · ДВІР НА СВІЙ СМАК 🎨 · ЯРМАРОК ВИХІДНОГО ДНЯ 🎪
   ============================================================ */
window.PUA_MAP = window.PUA_MAP || {};
const FARM2_ART = [...["cow", "goat"].flatMap(a => [0, 1, 2, 3, 4, 5].map(l => `${a}-${l}`)), ...[0, 1, 2, 3, 4, 5, 6].map(l => `sheep-${l}`), "gen-cow", "gen-goat", "gen-sheep", "manure"];   // усі мальовані

/* ---------- ХЛІВ: тварини — генератори, яких треба годувати ---------- */
const BARN = [
  { id: "cow", lvl: 12, gen: ["🐄", "Корівка Зірка"], eats: "veg", eatsName: "овочі", chain: "milk", name: "Молоко", base: 0xE500,
    items: [["🥛", "Кухоль молока"], ["🍶", "Глечик вершків"], ["🧈", "Вершкове масло"], ["🍦", "Домашній пломбір"], ["🍰", "Сирний торт"], ["🎂", "Молочний торт"]],
    line: "{name}, у мене корівка зайва завелася — бери! 🐄 Тільки годувати не забувай: овочі з городу вона страх як любить. А за це — молочко, вершки, масло…" },
  { id: "goat", lvl: 15, gen: ["🐐", "Кізонька Мека"], eats: "fruit", eatsName: "фрукти", chain: "cheese", name: "Сир", base: 0xE510,
    items: [["🍼", "Козяче молоко"], ["🥣", "Свіжий сирок"], ["🧀", "Бринза"], ["🥟", "Вареники з бринзою"], ["🥧", "Пиріг із бринзою"], ["🍽️", "Сирна тарілка"]],
    line: "{name}, я кізоньку привела! 🐐 Вона в нас ласунка — тільки фрукти їсть. Зате бринза з її молока — найкраща в окрузі!" },
  { id: "sheep", lvl: 19, gen: ["🐑", "Вівця Хмаринка"], eats: "flower", eatsName: "квіти й трави", chain: "wool", name: "Вовна", base: 0xE520,
    items: [["☁️", "Жмут вовни"], ["🧶", "Клубок"], ["🧵", "Пряжа"], ["🧦", "Вовняні шкарпетки"], ["🧤", "Рукавички"], ["🧣", "Шарф"], ["🧥", "Светр"]],
    line: "{name}, знайомся — вівця Хмаринка 🐑 Пасеться на квітах, а вовни дає — на шкарпетки, на рукавички, а там і на светр!" }
];
const FOOD_START = 6, FOOD_MAX = 30, MANURE_P = 0.08, FERT_TAPS = 8;
BARN.forEach((a, k) => {
  const art = id => FARM2_ART.includes(id) ? `items/${id}.webp` : null;
  CHAINS[a.chain] = { name: a.name, items: a.items.map(([e, n], l) => { const c = String.fromCharCode(a.base + l); PUA_MAP[c] = { e, img: art(`${a.id}-${l}`) }; return [c, n]; }) };
  const g = String.fromCharCode(0xE530 + k);
  PUA_MAP[g] = { e: a.gen[0], img: art("gen-" + a.id) };
  GENS[a.id] = { icon: g, name: a.gen[1], chain: a.chain, animal: true };
  if (!PRODUCT_CHAINS.includes(a.chain)) PRODUCT_CHAINS.push(a.chain);
});
CHAINS.manure = { name: "Перегній", nomerge: true, value: 3, items: [[String.fromCharCode(0xE538), "Мішечок перегною"]] };
PUA_MAP[String.fromCharCode(0xE538)] = { e: "🟤", img: FARM2_ART.includes("manure") ? "items/manure.webp" : null };
if (typeof ING_FROM !== "undefined") Object.assign(ING_FROM, { milk: ["dairy"], cheese: ["dairy"] });

/* нові пункти «Шляху господині» (відкриваються з модалкою й потрапляють у Довідник) */
if (typeof UNLOCKS !== "undefined") UNLOCKS.push(
  { id: "decor", lvl: 6, icon: "🎨", title: "Двір на свій смак",
    text: "Купуй прикраси й став їх у дворику де хочеш: кнопка 🎨 над завданнями у «Дворику». Прибрати чи переставити — там само.",
    lines: [["halya", "{name}, а давай свій двір прикрасимо як душа забажає? 🎨 Лавочку, квіти, ліхтарики — що захочеш!"]] },
  { id: "weather", lvl: 8, icon: "🌦️", title: "Погода",
    text: "Щодня своя погода: 🌧️ дощ — город родить щедріше; 🥵 спека — квіти в'януть, а тварини більше їдять; 🥶 мороз — гончарні круги не крутяться. Прогноз на завтра — у «Подіях».",
    lines: [["stepan", "{name}, коліно крутить — на дощ, мабуть 😄 Слідкуй за погодою: город від неї залежить!"]] },
  { id: "barn", lvl: 12, icon: "🐄", title: "Хлів",
    text: "Тварини — це генератори, яких треба годувати: перетягни на корівку овочі, на кізоньку — фрукти, на вівцю — квіти. Голодна тварина не дає нічого. Іноді в хліві з'являється перегній 🟤 — перетягни його на грядку чи сад, і 8 наступних тапів дадуть кращі плоди.",
    lines: [["olya", "{name}, бачу, ти вже справжня господиня! Час і хлів заводити 🐄"]] }
);
const busyUI2 = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
const nowT = () => window.DVORYK_NOW || Date.now();
const gx2 = s => (typeof gx === "function" ? gx(s) : s);

/* ============================================================ ПОГОДА */
const WEATHER = {
  sun:   { icon: "☀️", name: "Сонячно", fx: "звичайний день" },
  rain:  { icon: "🌧️", name: "Дощ", fx: "город і сад родять щедріше — іноді по два плоди" },
  heat:  { icon: "🥵", name: "Спека", fx: "квіти часом в'януть, а тварини їдять удвічі більше" },
  frost: { icon: "🥶", name: "Мороз", fx: "гончарні круги замерзли — не крутяться" },
  snow:  { icon: "🌨️", name: "Сніг", fx: "тихо й гарно; генератори не втомлюються від тапів частіше" }
};
const RAIN_BONUS = 0.25, HEAT_WILT = 0.3;
window.WTH = (() => {
  const on = () => window.UNL && UNL.on("weather");
  const dayKey = t => { const d = new Date(t); return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate(); };
  function rollFor(t) {
    let s = (dayKey(t) * 2654435761) >>> 0; s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    const r = s / 4294967296, m = new Date(t).getMonth();
    const table = [11, 0, 1].includes(m) ? [["frost", .35], ["snow", .25], ["sun", .4]]
      : [5, 6, 7].includes(m) ? [["heat", .3], ["rain", .25], ["sun", .45]]
      : [["rain", .4], ["sun", .6]];
    let acc = 0; for (const [k, p] of table) { acc += p; if (r < acc) return k; } return "sun";
  }
  const today = () => (on() ? rollFor(nowT()) : "sun");
  const tomorrow = () => rollFor(nowT() + 864e5);
  const w = k => WEATHER[k];
  const GARDEN = ["veg", "fruit", "flower", "bake", "tea", "sweet", "dairy", "forest", "poultry", "pottery"];
  /* мороз: гончарні круги */
  function canTap(i) {
    const it = S.board[i]; if (!on() || !it || !it.g) return true;
    if (today() === "frost" && (it.g === "w_clay" || it.g === "pottery")) { sfx.nope(); toast("🥶 Мороз — глина замерзла, круг не крутиться. Завтра буде краще!"); return false; }
    return true;
  }
  /* після тапу: дощ — бонус, спека — квіти в'януть */
  function afterTap(gIt, item, i) {
    if (!on() || !gIt || !item) return item;
    const chain = GENS[gIt.g] && GENS[gIt.g].chain, k = today();
    if (k === "heat" && chain === "flower" && item.c === "flower" && Math.random() < HEAT_WILT) { toast("🥵 Спека — квітка зів'яла, не встигнувши розпуститися"); return null; }
    if (k === "rain" && GARDEN.includes(chain) && item.c === chain && Math.random() < RAIN_BONUS) {
      setTimeout(() => { const at = placeItem({ c: chain, l: 0 }, i); if (at >= 0) { spawnFrom.set(at, i); sparkle(at, "💧", 5); renderBoard(); } }, 120);
    }
    return item;
  }
  let toldDay = null;
  function tick() {
    if (!on() || !S || !S.started || busyUI2() || S.tut < 4) return;
    const d = new Date(nowT()).toDateString();
    if (toldDay === d || S.wthTold === d) { toldDay = d; return; }
    toldDay = d; S.wthTold = d; save();
    const t = w(today());
    if (today() !== "sun") toast(`${t.icon} Сьогодні ${t.name.toLowerCase()}: ${t.fx}`);
  }
  function card() {
    if (!on()) return { icon: "🌦️", title: "Погода", sub: `відкриється на ${window.PACE ? PACE.lvl("weather") : 8} рівні`, locked: true };
    const a = w(today()), b = w(tomorrow());
    return { icon: a.icon, title: `Погода: ${a.name.toLowerCase()}`, sub: `${a.fx} · завтра ${b.icon} ${b.name.toLowerCase()}`, btn: "", act: "" };
  }
  return { today, tomorrow, canTap, afterTap, tick, card, info: k => WEATHER[k] };
})();

/* ============================================================ ХЛІВ */
window.BARNS = (() => {
  const on = () => window.UNL && UNL.on("barn");
  const animal = it => !!(it && it.g && GENS[it.g] && GENS[it.g].animal);
  const def = it => BARN.find(a => a.id === it.g);
  const food = it => (it.food == null ? FOOD_START : it.food);
  function canTap(i) {
    const it = S.board[i];
    if (!animal(it) || food(it) > 0) return true;
    const a = def(it); sfx.nope();
    toast(`${a.gen[0]} ${a.gen[1].split(" ")[0]} голодна — перетягни на неї ${a.eatsName} з городу`);
    hintOnce("hungry", [[a.who || "olya", `Тваринку треба годувати! Перетягни на неї ${a.eatsName} — що кращі, то на довше вистачить 🥕`]]);
    return false;
  }
  function hintOnce(flag, lines) { S.barnSeen = S.barnSeen || {}; if (S.barnSeen[flag]) return; S.barnSeen[flag] = 1; save(); setTimeout(() => playDialog(lines), 500); }
  /* після тапу: їжа, перегній; добриво на грядці — кращі плоди */
  function afterTap(gIt, item, i) {
    if (!item) return item;
    if (animal(gIt)) {
      gIt.food = Math.max(0, food(gIt) - (window.WTH && WTH.today() === "heat" ? 2 : 1));
      if (Math.random() < MANURE_P) setTimeout(() => { const at = placeItem({ c: "manure", l: 0 }, i); if (at >= 0) { spawnFrom.set(at, i); renderBoard(); } hintOnce("manure", [["stepan", "О, перегній! 🟤 Перетягни його на грядку чи сад — наступні плоди будуть кращі."]]); }, 150);
      return item;
    }
    if (gIt.fert > 0 && item.c === GENS[gIt.g].chain) {
      gIt.fert--; item = Object.assign({}, item, { l: Math.min(CHAINS[item.c].items.length - 1, item.l + 1) });
    }
    return item;
  }
  /* перетягування: їжа на тварину, перегній на генератор */
  function drop(a, b) {
    const A = S.board[a], B = S.board[b];
    if (!A || A.g || !B || !B.g) return false;
    if (animal(B)) {
      const d = def(B);
      if (A.c !== d.eats) { if (PRODUCT_CHAINS.includes(A.c)) { sfx.nope(); toast(`${d.gen[0]} Таке не їсть — неси ${d.eatsName}`); renderBoard(); return true; } return false; }
      if (food(B) >= FOOD_MAX) { sfx.nope(); toast(`${d.gen[0]} Наїлася досхочу!`); renderBoard(); return true; }
      const v = 2 * (A.l + 1);
      B.food = Math.min(FOOD_MAX, food(B) + v); S.board[a] = null; if (selected === a) selected = b;
      sfx.pop(); popIdx.add(b); floatAt(b, `+${v} 🍽️`); renderBoard(); renderInfo(); renderOrders(); save();
      return true;
    }
    if (A.c === "manure") {
      const ch = GENS[B.g] && GENS[B.g].chain;
      if (GENS[B.g].animal || GENS[B.g].side || !PRODUCT_CHAINS.includes(ch)) { sfx.nope(); toast("🟤 Перегній — для грядок і саду"); renderBoard(); return true; }
      B.fert = (B.fert || 0) + FERT_TAPS; S.board[a] = null; if (selected === a) selected = b;
      sfx.pop(); popIdx.add(b); sparkle(b, "🌱", 6); floatAt(b, `+${FERT_TAPS} 🌱`); renderBoard(); renderInfo(); save();
      return true;
    }
    return false;
  }
  function genInfo(it) {
    if (animal(it)) return ` · 🍽️ ситість ${food(it)}/${FOOD_MAX} (їсть ${def(it).eatsName})`;
    return it.fert > 0 ? ` · 🌱 удобрено ще на ${it.fert} тапів` : "";
  }
  /* нові тварини за рівнем */
  function tick() {
    if (!on() || !S || !S.started || S.sideOn || busyUI2()) return;
    const a = BARN.find(x => S.level >= x.lvl && !S.gens.includes(x.id));
    if (!a) return;
    S.gens.push(a.id); placeItem({ g: a.id }); save(); renderAll(); confetti(); sfx.level();
    playDialog([[a.id === "cow" ? "olya" : a.id === "goat" ? "marichka" : "ivan", a.line]], () => modal({ title: "Новий мешканець хліва! 🎉",
      html: `<div class="big-emoji">${GENS[a.id].icon}</div><p><b>${a.gen[1]}</b> — уже на дошці. Їсть <b>${a.eatsName}</b>: перетягни їх на неї.</p><p class="rewards">${CHAINS[a.chain].items.map(x => x[0]).join(" → ")}</p>`,
      buttons: [{ label: "Нагодую! 💛" }] }));
  }
  return { canTap, afterTap, drop, genInfo, tick, animal };
})();

/* ============================================================ ДВІР НА СВІЙ СМАК */
const DECOR_SHOP = [
  ["🌷", "Тюльпани", 40, 5], ["🌼", "Ромашки", 40, 5], ["🌺", "Мальви", 45, 5], ["🪴", "Вазон", 70, 6], ["🪣", "Відерце", 30, 5],
  ["🪑", "Стілець", 80, 7], ["🪵", "Дрова", 60, 7], ["🎃", "Гарбуз", 70, 6], ["🪧", "Табличка", 60, 7], ["🎀", "Бантик", 35, 5],
  ["🕯️", "Свічечка", 40, 4], ["🏮", "Ліхтарик", 120, 6], ["🎈", "Кульки", 90, 6], ["⛱️", "Парасоля", 160, 9], ["🧑‍🌾", "Опудало", 180, 7],
  ["🍽️", "Святковий стіл", 220, 11], ["🛋️", "Диванчик", 260, 9], ["🚪", "Хвіртка", 140, 9], ["🌳", "Дуб", 320, 12], ["🌸", "Квітуча вишня", 360, 11],
  ["⛲", "Фонтан", 500, 11], ["⛄", "Сніговик", 100, 9], ["🪺", "Шпаківня", 90, 7]
];
window.DECOR = (() => {
  const on = () => window.UNL && UNL.on("decor");
  const st = () => (S.decor || (S.decor = { inv: {}, placed: {}, seq: 0 }));
  const curCh = () => STORY[Math.min(S.chapter, STORY.length - 1)];
  const locKey = ch => (ch && ch.loc) || "home";
  let placing = null;
  function yard(ch) {
    if (!S.decor) return [];
    return (S.decor.placed[locKey(ch)] || []).map(d => ({ key: "u" + d.id, e: d.e, x: d.x, y: d.y, s: d.s }));
  }
  const price = e => (DECOR_SHOP.find(x => x[0] === e) || [])[2] || 0;
  function panel() {
    if (!on()) return;
    const s = st(), here = s.placed[locKey(curCh())] || [];
    const rows = DECOR_SHOP.map(([e, n, p, , souv]) => { const have = s.inv[e] || 0;
      if (souv && !have && !Object.values(s.placed).some(a => a.some(d => d.e === e))) return "";   // сувенір — лише коли привезла з поїздки
      return `<div class="dc-row"><span class="dc-ic">${e}</span><span class="dc-t"><b>${n}</b><small>${have ? "у тебе: " + have : souv ? "сувенір з поїздки" : p + " 🪙"}</small></span>` +
        (have ? `<button class="s-btn dc-put" data-e="${e}">Поставити</button>` : "") +
        (souv ? "" : `<button class="s-btn ghost dc-buy${S.coins < p ? " dim" : ""}" data-e="${e}">${have ? "+1" : "Купити"}</button>`) + `</div>`; }).join("");
    const placed = here.map(d => `<button class="dc-placed" data-id="${d.id}" title="Прибрати">${d.e}<i>✕</i></button>`).join("");
    modal({ title: "Двір на свій смак 🎨",
      html: `<p class="hint-s">Купи прикрасу, натисни «Поставити» — і тапни на землю у дворику.</p>` +
        (here.length ? `<div class="dc-here"><small>Уже стоїть тут (тапни, щоб прибрати назад у скриньку):</small><div>${placed}</div></div>` : "") +
        `<div class="dc-list">${rows}</div>`,
      buttons: [{ label: "Готово 💛", cls: "ghost" }] });
    document.querySelectorAll(".dc-buy").forEach(b => b.onclick = () => buy(b.dataset.e));
    document.querySelectorAll(".dc-put").forEach(b => b.onclick = () => startPlace(b.dataset.e));
    document.querySelectorAll(".dc-placed").forEach(b => b.onclick = () => unplace(+b.dataset.id));
  }
  function buy(e) {
    if ((DECOR_SHOP.find(x => x[0] === e) || [])[4]) return;      // сувеніри не продаються
    const p = price(e);
    if (S.coins < p) { sfx.nope(); toast(`Бракує ${p - S.coins} 🪙`); return; }
    S.coins -= p; st().inv[e] = (st().inv[e] || 0) + 1; sfx.coin(); renderTop(); save(); panel();
  }
  function startPlace(e) {
    if (!window.Yard3D) { toast("Розставляти можна у 3D-дворику"); return; }
    placing = e; $("modal").classList.remove("show");
    if (typeof viewCh !== "undefined" && viewCh !== null) { viewCh = null; renderStory(); }
    showTab("story");
    document.body.classList.add("dc-placing");
    toast(`${e} Тапни на землю у дворику, куди поставити`);
  }
  function unplace(id) {
    const s = st(), k = locKey(curCh()), arr = s.placed[k] || [], d = arr.find(x => x.id === id); if (!d) return;
    s.placed[k] = arr.filter(x => x.id !== id); s.inv[d.e] = (s.inv[d.e] || 0) + 1;
    sfx.pop(); save(); renderStory(); panel();
  }
  function onTapScene(cx, cy) {
    if (!placing || !window.Yard3D || !Yard3D.pick) return false;
    const p = Yard3D.pick(cx, cy);
    if (!p) { sfx.nope(); toast("Тапни на саму землю дворика 🌱"); return true; }
    const s = st(), e = placing, def = DECOR_SHOP.find(x => x[0] === e);
    if (!(s.inv[e] > 0)) { placing = null; document.body.classList.remove("dc-placing"); return true; }
    s.inv[e]--; const k = locKey(curCh());
    (s.placed[k] = s.placed[k] || []).push({ id: ++s.seq, e, x: Math.round(p.x), y: Math.round(p.y), s: def ? def[3] : 7 });
    placing = null; document.body.classList.remove("dc-placing");
    sfx.pop(); confetti && confetti(); save(); renderStory();
    toast(`${e} Гарно стало!`);
    return true;
  }
  /* тап по сцені (відрізняємо від обертання камери) */
  let down = null;
  function init() {
    const sc = $("scene"); if (!sc || sc.dataset.dc) return; sc.dataset.dc = "1";
    sc.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
    sc.addEventListener("pointerup", e => {
      if (!down || !placing) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
      if (moved < 10) onTapScene(e.clientX, e.clientY);
    }, true);
  }
  function renderButton() { const b = $("decorBtn"); if (b) { b.hidden = !on(); b.onclick = panel; } }
  function card() {
    if (!on()) return { icon: "🎨", title: "Двір на свій смак", sub: `відкриється на ${window.PACE ? PACE.lvl("decor") : 6} рівні`, locked: true };
    const n = Object.values(st().placed).reduce((a, b) => a + b.length, 0);
    return { icon: "🎨", title: "Двір на свій смак", sub: n ? `розставлено прикрас: ${n}` : "купуй прикраси й став де хочеш", btn: "Відкрити", act: "decor" };
  }
  return { yard, panel, init, card, renderButton, placing: () => placing };
})();

/* ============================================================ ЯРМАРОК ВИХІДНОГО ДНЯ */
window.FAIR = (() => {
  const open = () => !!(S.wood && S.love && S.love.stage >= 4);
  const weekend = () => [0, 6].includes(new Date(nowT()).getDay());
  const weekKey = () => { const d = new Date(nowT()); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); return d.toDateString(); };   // субота цього вікенду
  const BUYER_LINES = ["Почім оце? Гарна робота!", "Мені б таке — на подарунок 🎁", "Ой, яке! Беру, якщо не дорого.", "Давно таке шукаю!"];
  function ensure() {
    if (S.fair && S.fair.wk === weekKey()) return S.fair;
    const w = S.wood, chars = Object.keys(CHARS).filter(c => PORTRAITS.includes(c) && c !== "cat" && c !== "collector" && !(window.HERO && c === S.hero) && c !== (window.LOVE && LOVE.who()) && (CHARS[c].from || 0) <= S.chapter);
    const buyers = [];
    for (let k = 0; k < 4 && chars.length; k++) {
      const ch = chars.splice(Math.floor(Math.random() * chars.length), 1)[0];
      const c = pick(w.gens), len = CHAINS[c].items.length, l = Math.min(len - 1, 2 + rnd(Math.min(5, 2 + Math.floor(w.done / 12))));
      const base = Math.round(itemValue(c, l) * 1.5);
      buyers.push({ ch, want: { c, l }, offer: base, tries: 0, st: "ok", line: pick(BUYER_LINES) });
    }
    S.fair = { wk: weekKey(), buyers }; save();
    return S.fair;
  }
  const wboard = () => (S.woodOn ? S.board : S.wood.board);
  const find = want => wboard().findIndex(x => x && !x.g && x.c === want.c && x.l === want.l && !(window.WH && !WH.usable(x)));
  function panel() {
    if (!open()) return;
    if (!weekend()) { modal({ title: "Ярмарок вихідного дня 🎪", html: `<div class="big-emoji">🎪</div><p>Ярмарок буває по суботах і неділях. Готуй вироби в майстерні — покупці торгуються, але платять щедріше, ніж сусіди!</p>`, buttons: [{ label: "Чекатиму 💛" }] }); return; }
    const f = ensure();
    const rows = f.buyers.map((b, k) => {
      const has = find(b.want) >= 0, it = CHAINS[b.want.c].items[b.want.l];
      const state = b.st === "sold" ? `<small class="fr-ok">продано ✅</small>` : b.st === "gone" ? `<small class="fr-gone">пішов до іншого 🚶</small>` :
        `<button class="s-btn fr-sell${has ? "" : " dim"}" data-k="${k}">Продати · ${b.offer} 🪙</button>` + (b.tries < 2 ? `<button class="s-btn ghost fr-hag" data-k="${k}">Торгуватися</button>` : "");
      return `<div class="fr-row${b.st !== "ok" ? " done" : ""}">${face(CHARS[b.ch], "mini")}<span class="fr-t"><b>${CHARS[b.ch].name}</b><small>хоче ${it[0]} ${it[1]}${b.st === "ok" && !has ? " · немає в майстерні" : ""}</small></span><span class="fr-b">${state}</span></div>`;
    }).join("");
    modal({ title: "Ярмарок вихідного дня 🎪",
      html: `<p class="hint-s">Покупці беруть вироби з майстерні. Торгуйся — можна виторгувати більше, але покупець може й піти!</p><div class="fr-list">${rows}</div>`,
      buttons: [{ label: "Закрити", cls: "ghost" }] });
    document.querySelectorAll(".fr-sell").forEach(b => b.onclick = () => sell(+b.dataset.k));
    document.querySelectorAll(".fr-hag").forEach(b => b.onclick = () => haggle(+b.dataset.k));
  }
  function sell(k) {
    const b = S.fair.buyers[k], i = find(b.want);
    if (b.st !== "ok") return;
    if (i < 0) { sfx.nope(); toast(`Зроби в майстерні ${itemIcon(b.want)} ${itemName(b.want)}`); return; }
    wboard()[i] = null; if (S.woodOn && selected === i) selected = -1;
    S.coins += b.offer; b.st = "sold"; S.fairSold = (S.fairSold || 0) + 1;
    sfx.coin(); confetti(); renderTop(); if (S.woodOn) renderBoard(); save();
    toast(`🎪 ${CHARS[b.ch].name}: «Дякую! Хай служить довго!» +${b.offer} 🪙`);
    panel();
  }
  function haggle(k) {
    const b = S.fair.buyers[k]; if (b.st !== "ok" || b.tries >= 2) return;
    const ok = Math.random() < (b.tries === 0 ? 0.6 : 0.4); b.tries++;
    if (ok) { const up = 1.15 + Math.random() * 0.15; b.offer = Math.round(b.offer * up / 5) * 5; sfx.coin(); toast(`🤝 ${CHARS[b.ch].name}: «Ну добре, ${b.offer} — і по руках!»`); }
    else { b.st = "gone"; sfx.nope(); toast(`😤 ${CHARS[b.ch].name}: «Ну й дорого! Піду до іншого майстра.»`); }
    save(); panel();
  }
  function card() {
    if (!open()) return null;
    if (!weekend()) { const d = new Date(nowT()).getDay(), left = (6 - d + 7) % 7 || 7; return { icon: "🎪", title: "Ярмарок вихідного дня", sub: `найближчий — у суботу (через ${left} дн.)`, btn: "", act: "" }; }
    const f = ensure(), n = f.buyers.filter(b => b.st === "ok").length;
    return { icon: "🎪", title: "Ярмарок вихідного дня", sub: n ? `${n} покупці чекають на вироби з майстерні` : "усіх покупців обслужено 💛", btn: "Відкрити", act: "fair", ready: n > 0 && f.buyers.some(b => b.st === "ok" && find(b.want) >= 0) };
  }
  return { panel, card, weekend };
})();

/* ---------- підключення до решти гри ---------- */
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => window.FAIR.card(), () => window.DECOR.card(), () => window.WTH.card()]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { decor: () => DECOR.panel(), fair: () => FAIR.panel() });
if (typeof GUIDE_WOOD !== "undefined") GUIDE_WOOD.push(["🎪", "Ярмарок вихідного дня", "По суботах і неділях приходять 4 покупці й просять вироби з майстерні — платять у півтора раза більше. Можна торгуватися: першого разу вдається частіше, а другого — ризик, що покупець піде.", w => true]);
window.FARM2 = {
  canTap: i => (window.BARNS.canTap(i) && window.WTH.canTap(i)),
  afterTap: (gIt, item, i) => window.WTH.afterTap(gIt, window.BARNS.afterTap(gIt, item, i), i),
  drop: (a, b) => window.BARNS.drop(a, b),
  genInfo: it => window.BARNS.genInfo(it),
  tick: () => { window.BARNS.tick(); window.WTH.tick(); window.DECOR.init(); window.DECOR.renderButton(); }
};
