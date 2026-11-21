"use strict";
/* ============================================================
   ПОСТУПОВЕ ВІДКРИТТЯ МЕХАНІК і нові дрібниці
   • UNL — «Шлях господині»: ускладнення й доповнення відкриваються з рівнями,
     кожне — з коротким знайомством. Стан: S.unl = { id: true }
   • XTRA — котик на скрині (S.cat), комора (S.store), сила ×2 (S.boost),
     нагороди за нові предмети в колекції (S.claimD)
   ============================================================ */
const UNLOCKS = [
  { id: "daily",    lvl: 2, icon: "📋", title: "Завдання дня",
    text: "Щодня — три маленькі завдання, а за них подарунок 🎁. Кнопка 📋 під дошкою.",
    lines: [["halya", "{name}, я тобі списочок склала на день 📋 Зробиш — буде гостинець!"]] },
  { id: "discover", lvl: 2, icon: "🎁", title: "Нагороди за відкриття",
    text: "Кожен новий предмет у «Колекції» 📖 тепер приносить монетки. Забирай їх там — біля нових предметів світиться 🎁." },
  { id: "rest",     lvl: 3, icon: "💤", title: "Генератори втомлюються",
    text: "Після кількох тапів генератор відпочиває. Два однакові генератори зливаються в кращий — з більшим зарядом.",
    lines: [["stepan", "Земля теж має відпочивати, {name} 🌱 Потапала — дай грядці перепочити."]] },
  { id: "webs",     lvl: 3, icon: "🕸️", title: "Павутиння",
    text: "У кутку дошки завелося павутиння. Об'єднуй предмети поруч — і під ним знайдеш сюрприз.",
    lines: [["olya", "Ой, павучки сплели сіточки по кутках 🕸️ Розчисти — там щось блищить!"]] },
  { id: "urgent",   lvl: 4, icon: "⏰", title: "Термінові замовлення",
    text: "Іноді сусід дуже поспішає: термінове замовлення має годинник, зате платить більше й дає зайву ⭐." },
  { id: "side",     lvl: 4, icon: "🧭", title: "Пригоди",
    text: "Час від часу сусіди кличуть на окрему маленьку дошку з власними предметами. Встигни за 2 дні!" },
  { id: "cat",      lvl: 5, icon: "🐱", title: "Котик на скрині",
    text: "Пиріжок умостився на старій скрині й теж замовляє 🐾 Виконуй його замовлення — і скриня відкриється з розкішною нагородою!",
    lines: [["cat", "Мур-р. (Сідає на скриню й багатозначно дивиться на тебе.) 🐾"], ["halya", "Хитрун! Не злізе, поки не нагодуєш. А в скрині — щось цінне 🧰"]] },
  { id: "map",      lvl: 5, icon: "🗺️", title: "Таємниця старої скрині",
    text: "У подарунках трапляються шматочки старої карти. Збери всі — і знайдеш дідів скарб." },
  { id: "week",     lvl: 6, icon: "🗓️", title: "Завдання тижня",
    text: "Великі завдання на тиждень і велика нагорода 💝 — у 📋, вкладка «Тиждень»." },
  { id: "store",    lvl: 6, icon: "🗄️", title: "Комора",
    text: "Тепер зайве можна сховати в комору й дістати потім. Тапни предмет → 🗄️. Місць мало, але можна докупити.",
    lines: [["stepan", "Я тобі комору прибрав, {name} 🗄️ Що не треба зараз — клади туди, не пропаде."]] },
  { id: "album",    lvl: 7, icon: "💌", title: "Альбом листівок",
    text: "За замовлення й подарунки тепер дають листівки 💌 Збирай набори в «Колекції» — за кожен повний набір нагорода!",
    lines: [["ivan", "Пошта прийшла! 📮 Цілий стос листівок — і всі різні. Збереш альбом?"]] },
  { id: "boost",    lvl: 8, icon: "⚡", title: "Подвійна сила ×2",
    text: "Кнопка ×2 біля енергії: генератор бере 2 ⚡, зате дає одразу предмет на рівень вищий. Менше злиттів — більше місця." }
];
// що вже було в грі до «Шляху» — у тих, хто грав, лишається відкритим
const UNL_LEGACY = { daily: 0, rest: 0, webs: 0, map: 0, week: 0, urgent: 4, side: 4 };

window.UNL = (() => {
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  let lastAt = 0;
  const on = id => !!(S && S.unl && S.unl[id]);
  function init() {
    if (S.unl) return;
    S.unl = {};
    if (S.started) Object.keys(UNL_LEGACY).forEach(k => { if (S.level >= UNL_LEGACY[k]) S.unl[k] = true; });
    save();
  }
  const next = () => UNLOCKS.find(u => !on(u.id));
  function nextHtml() {
    const n = UNLOCKS.find(u => !on(u.id) && u.lvl > S.level);
    return n ? `<p class="hint-s unl-next">Далі, на рівні ${n.lvl}: ${n.icon} ${n.title}</p>` : "";
  }
  function open(u) {
    S.unl[u.id] = true;
    lastAt = Date.now();
    if (u.id === "webs") { MECH.addLocks(6); renderBoard(); }
    if (u.id === "week" && window.QUEST) QUEST.init();
    save(); renderAll(); if (window.QUEST) QUEST.renderButton(); if (window.XTRA) XTRA.renderBoost();
    sfx.open();
    modal({
      title: "Нове відкрито! ✨",
      html: `<div class="big-emoji">${u.icon}</div><p><b>${u.title}</b></p><p>${u.text}</p>`,
      buttons: [{ label: "Чудово! 💛", onClick: () => { if (u.lines) playDialog(u.lines); } }]
    });
  }
  function tick() {
    if (!S || !S.started || !S.unl || S.sideOn || busyUI() || Date.now() - lastAt < 3500 || S.tut < 4) return;
    const u = UNLOCKS.find(x => !on(x.id) && x.lvl <= S.level);
    if (u) open(u);
  }
  function roadHtml() {
    const rows = UNLOCKS.map(u => `<div class="unl-row${on(u.id) ? " ok" : ""}"><span class="unl-ic">${on(u.id) ? u.icon : "🔒"}</span>` +
      `<span class="unl-t"><b>${u.title}</b><small>${on(u.id) ? "відкрито" : "рівень " + u.lvl}</small></span></div>`).join("");
    const n = UNLOCKS.filter(u => on(u.id)).length;
    return `<div class="coll-sec"><div class="coll-h">Шлях господині 🌱 <small>${n} з ${UNLOCKS.length}</small></div><div class="unl-list">${rows}</div></div>`;
  }
  return { on, init, tick, nextHtml, roadHtml, next };
})();

/* ============================================================ */
const CAT_CHEST = { first: 4, max: 7, chance: 0.4 };
const STORE_START = 3, STORE_PRICES = [150, 300, 500, 800, 1200];
const DISC_COINS = l => 2 + l * l;

window.XTRA = (() => {
  const on = id => window.UNL && UNL.on(id);

  /* ---------- котик на скрині ---------- */
  const cat = () => (S.cat || (S.cat = { n: 0, t: CAT_CHEST.first, round: 1 }));
  const catProg = () => cat().n + "/" + cat().t;
  function catOrder() {
    if (!on("cat") || S.orders.some(o => o.paw) || Math.random() >= CAT_CHEST.chance) return null;
    if (window.WD && WD.isSick("cat")) return null;
    const chains = S.gens.map(g => GENS[g].chain);
    const c = pick(chains), len = CHAINS[c].items.length;
    const l = Math.min(len - 1, 2 + rnd(Math.min(3, 1 + Math.floor(S.level / 6))));
    const coins = Math.round(itemValue(c, l) * 1.3);
    return { id: ++S.orderSeq, ch: "cat", items: [{ c, l }], coins, xp: (l + 1) * 3, stars: 1, paw: true, line: rnd(3) };
  }
  function onDeliver(o, card) {
    if (!o.paw) return;
    const k = cat();
    k.n++;
    if (k.n < k.t) { setTimeout(() => toast(`🐾 Котик на скрині: ${k.n}/${k.t}`), 900); return; }
    const round = k.round;
    S.cat = { n: 0, t: Math.min(CAT_CHEST.max, k.t + 1), round: round + 1 };
    const coins = 80 + 40 * Math.min(round, 6), en = 10;
    setTimeout(() => playDialog([["cat", "Мр-р-ряу! 😻 (Потягується, злазить зі скрині й муркоче.)"]], () => {
      placeItem({ c: "chest", l: 2 }); S.coins += coins; regen(); S.energy += en;
      if (window.ALB) ALB.give(2, "Від котика");
      save(); renderAll(); confetti(); sfx.level();
      modal({ title: "Скриня відкрита! 🧰",
        html: `<div class="big-emoji">🧰</div><p>Пиріжок наївся й пустив до скрині. А там…</p><p class="rewards">💝 &nbsp; +${coins} 🪙 &nbsp; +${en} ⚡${on("album") ? " &nbsp; 💌💌" : ""}</p>` +
          `<p class="hint-s">Котик уже вмощується назад 🐾 Наступна скриня — за ${S.cat.t} його замовлень.</p>`,
        buttons: [{ label: "Мур! 💛" }] });
    }), 900);
  }

  /* ---------- комора ---------- */
  const store = () => (S.store || (S.store = { slots: STORE_START, items: [] }));
  const canStore = it => it && !it.lock && !it.st && !(window.SIDE && SIDE.isSideItem && SIDE.isSideItem(it));
  function storeBtn(it) {
    if (!on("store") || S.sideOn || !canStore(it)) return "";
    return `<button class="sell store-b" id="storeBtn"><small>у комору</small><span>🗄️</span></button>`;
  }
  function hintBtn() {
    if (!on("store") || S.sideOn) return "";
    const s = store();
    return `<button class="store-open" id="storeOpen">🗄️ <small>${s.items.length}/${s.slots}</small></button>`;
  }
  function stash(i) {
    const s = store(), it = S.board[i];
    if (!canStore(it)) return;
    if (s.items.length >= s.slots) { sfx.nope(); toast("Комора повна 🗄️ Звільни місце або докупи ще одне"); openStore(); return; }
    const cell = document.querySelector(`.cell[data-i="${i}"]`);
    const btn = $("storeBtn");
    if (cell && btn) flyIcon(itemIcon(it), cell.getBoundingClientRect(), btn.getBoundingClientRect(), { size: 34, end: 0.5 });
    s.items.push(it);
    S.board[i] = null; if (selected === i) selected = -1;
    sfx.pop(); toast(`🗄️ ${itemName(it)} — у коморі`);
    renderBoard(); renderInfo(); renderOrders(); save();
  }
  function take(k) {
    const s = store();
    if (!s.items[k]) return;
    const i = emptyNear(Math.floor(N / 2));
    if (i < 0) { sfx.nope(); toast("Звільни місце на дошці 🙂"); return; }
    S.board[i] = s.items.splice(k, 1)[0]; popIdx.add(i);
    sfx.pop();
    renderBoard(); renderOrders(); renderInfo(); save();
    openStore();
  }
  function buySlot() {
    const s = store(), p = STORE_PRICES[s.slots - STORE_START];
    if (!p) return;
    if (S.coins < p) { sfx.nope(); toast("Не вистачає монеток 🪙"); return; }
    S.coins -= p; s.slots++;
    sfx.coin(); toast("🗄️ Нова полиця в коморі!");
    renderTop(); renderInfo(); save(); openStore();
  }
  function openStore() {
    const s = store(), p = STORE_PRICES[s.slots - STORE_START];
    const cells = Array.from({ length: s.slots }, (_, k) => s.items[k]
      ? `<button class="st-cell full" data-k="${k}"><span>${itemIcon(s.items[k])}</span><small>${itemName(s.items[k])}</small></button>`
      : `<div class="st-cell"></div>`).join("") +
      (p ? `<button class="st-cell buy" id="stBuy"><span>➕</span><small>${p} 🪙</small></button>` : "");
    modal({ title: "Комора 🗄️",
      html: `<p class="hint-s">Тапни річ, щоб повернути її на дошку. Сховати — тапни предмет на дошці й натисни 🗄️.</p><div class="st-grid">${cells}</div>`,
      buttons: [{ label: "Закрити", cls: "ghost" }] });
    document.querySelectorAll(".st-cell.full").forEach(b => b.onclick = () => take(+b.dataset.k));
    const bb = $("stBuy"); if (bb) bb.onclick = buySlot;
  }

  /* ---------- сила ×2 ---------- */
  const boosted = () => on("boost") && !!S.boost;
  function renderBoost() {
    const b = $("boostBtn"); if (!b) return;
    b.hidden = !on("boost");
    b.classList.toggle("on", !!S.boost);
    b.textContent = S.boost ? "×2" : "×1";
  }
  function toggleBoost() {
    S.boost = !S.boost; sfx.pop();
    toast(S.boost ? "⚡×2: тап коштує 2 ⚡, предмет — на рівень вищий" : "⚡×1: звичайні тапи");
    renderBoost(); save();
  }

  /* ---------- нагороди за відкриття ---------- */
  function initDisc() {
    if (S.claimD) return;
    S.claimD = {};
    if (S.started) Object.keys(S.collection).forEach(k => S.claimD[k] = 1);   // давні знахідки — без нагороди
  }
  const discReady = k => on("discover") && S.collection[k] && !S.claimD[k];
  const discCount = () => on("discover") ? PRODUCT_CHAINS.reduce((n, c) => n + CHAINS[c].items.filter((_, l) => discReady(c + ":" + l)).length, 0) : 0;
  function claimDisc(k, el) {
    if (!discReady(k)) return 0;
    const [c, l] = k.split(":"); const lv = +l;
    S.claimD[k] = 1;
    let coins = DISC_COINS(lv);
    S.coins += coins;
    const top = lv >= CHAINS[c].items.length - 1;
    if (top) S.stars += 1;
    if (el) { const r = el.getBoundingClientRect(); flyMany(r, "🪙", "coins", 3); if (top) flyMany(r, "⭐", "stars", 2, 150); }
    return coins;
  }
  function claimAll() {
    let sum = 0;
    PRODUCT_CHAINS.forEach(c => CHAINS[c].items.forEach((_, l) => { sum += claimDisc(c + ":" + l); }));
    if (sum) { sfx.coin(); toast(`🎁 Нагороди за відкриття: +${sum} 🪙`); }
    renderTop(); renderCollection(); renderNavBadge(); save();
  }

  return { catOrder, onDeliver, catProg, storeBtn, hintBtn, stash, openStore, boosted, renderBoost, toggleBoost,
    initDisc, discReady, discCount, claimDisc, claimAll };
})();
