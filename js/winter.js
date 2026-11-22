"use strict";
/* ============================================================
   ЗИМОВА ШАФА (щороку)
   15 листопада — 15 грудня: підготовка. Кожному сусідові треба пошити теплу річ:
   віддати йому кілька замовлень, принести з дошки «матеріал» і заплатити за тканину.
   15 грудня — морози: хто без теплого одягу, той на лікарняному до 1 березня
   (не робить замовлень і не з'являється в дворику).
   Стан у S.wd: { id, intro, n:{сусід:замовлень}, dressed:{}, sick:{}, frost, warned }
   ============================================================ */
const WARDROBE = {
  halya:    { e: "🧣", name: "Вовняна хустка",        orders: 4, item: { c: "bake",   l: 5 }, coins: 120 },
  stepan:   { e: "🥾", name: "Теплі чоботи",          orders: 4, item: { c: "veg",    l: 6 }, coins: 150 },
  olya:     { e: "🧤", name: "Рукавички",             orders: 4, item: { c: "veg",    l: 5 }, coins: 100 },
  marichka: { e: "🧢", name: "Шапка з помпоном",      orders: 4, item: { c: "fruit",  l: 3 }, coins: 80 },
  andriy:   { e: "🧦", name: "Вовняні шкарпетки",     orders: 4, item: { c: "dairy",  l: 2 }, coins: 100 },
  liza:     { e: "🧥", name: "Пухнасте пальто",       orders: 4, item: { c: "flower", l: 4 }, coins: 180 },
  cat:      { e: "🧶", name: "Светрик для котика",    orders: 3, item: { c: "sweet",  l: 3 }, coins: 60 },
  ivan:     { e: "🧥", name: "Кожух листоноші",       orders: 4, item: { c: "tea",    l: 3 }, coins: 150 },
  taras:    { e: "🧣", name: "Довгий шарф",           orders: 4, item: { c: "bake",   l: 6 }, coins: 100 },
  iryna:    { e: "🧤", name: "Теплі рукавички",       orders: 4, item: { c: "flower", l: 5 }, coins: 120 }
};

window.WD = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  /* сезон: Y — рік, у якому почалася підготовка */
  function season() {
    const d = new Date(now()), y = d.getFullYear();
    const startY = new Date(y, 10, 15).getTime();
    const sy = now() >= startY ? y : (now() < new Date(y, 2, 1).getTime() ? y - 1 : null);
    if (sy === null) return null;
    const s = { y: sy, start: new Date(sy, 10, 15).getTime(), frost: new Date(sy, 11, 15).getTime(), end: new Date(sy + 1, 2, 1).getTime() };
    s.phase = now() < s.frost ? "prep" : "winter";
    return s;
  }
  const st = () => { const s = season(); return s && S.wd && S.wd.id === "wd-" + s.y ? S.wd : null; };
  const known = who => CHARS[who] && (CHARS[who].from || 0) <= S.chapter;
  const isSick = who => { const s = season(), w = st(); return !!(s && w && s.phase === "winter" && w.sick[who]); };
  const isDressed = who => { const w = st(); return !!(w && w.dressed[who]); };
  const unlocked = c => S.gens.some(g => GENS[g] && GENS[g].chain === c);
  function needItem(who) {          // якщо ланцюжок ще не відкритий — просимо випічку
    const it = WARDROBE[who].item;
    return unlocked(it.c) ? it : { c: "bake", l: Math.min(it.l, 5) };
  }
  const mainBoard = () => (S.sideOn ? S.main : S.board);
  const findOnBoard = it => mainBoard().findIndex(x => x && !x.g && !x.lock && !x.st && x.c === it.c && x.l === it.l);
  function canGive(who) {
    const w = st(), g = WARDROBE[who];
    return !!w && season().phase === "prep" && !w.dressed[who] && (w.n[who] || 0) >= g.orders && findOnBoard(needItem(who)) >= 0 && S.coins >= g.coins;
  }
  const readyAny = () => !!st() && Object.keys(WARDROBE).some(k => known(k) && canGive(k));
  const daysLeft = () => { const s = season(); return Math.max(0, Math.ceil((s.frost - now()) / 864e5)); };
  const plural = n => n % 10 === 1 && n % 100 !== 11 ? "день" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "дні" : "днів";

  /* ---------- події ---------- */
  function onDeliver(o) {
    const w = st();
    if (!w || season().phase !== "prep" || !WARDROBE[o.ch] || w.dressed[o.ch]) return;
    w.n[o.ch] = (w.n[o.ch] || 0) + 1;
    if (canGive(o.ch)) setTimeout(() => toast(`${WARDROBE[o.ch].e} Можна видати: ${WARDROBE[o.ch].name} — у завданнях 📋`), 1800);
  }
  function give(who) {
    if (!canGive(who)) return;
    const w = st(), g = WARDROBE[who];
    const i = findOnBoard(needItem(who));
    mainBoard()[i] = null; if (!S.sideOn && selected === i) selected = -1;
    S.coins -= g.coins;
    w.dressed[who] = true;
    save(); renderAll(); if (window.QUEST) QUEST.renderButton();
    sfx.level(); confetti();
    $("modal").classList.remove("show");
    playDialog([[who, pick(THANKS_WARM)]], () => window.QUEST && QUEST.panel("winter"));
  }
  const THANKS_WARM = [
    "Ой, як тепло! Тепер мені жодні морози не страшні 💛",
    "Дякую, {name}! Це найтепліший подарунок у моєму житті 🥹",
    "Яке м'якеньке! Сьогодні ж у ньому й піду 😊",
    "Тепер можна хоч на ковзанку, хоч колядувати до ранку! ❄️"
  ];
  function frost() {
    const w = st();
    w.frost = true;
    const sick = window.REB && REB.has("clinic") ? [] : Object.keys(WARDROBE).filter(k => known(k) && !w.dressed[k]);   // амбулаторія — ніхто не хворіє
    sick.forEach(k => { w.sick[k] = true; });
    S.orders = S.orders.filter(o => !w.sick[o.ch]);
    fillOrders(); save(); renderAll();
    const dressed = Object.keys(WARDROBE).filter(k => known(k) && w.dressed[k]);
    const faces = list => list.map(k => face(CHARS[k], "mini")).join(" ");
    modal({
      title: "Прийшли морози ❄️",
      html: `<div class="big-emoji">🌨️</div>` +
        (dressed.length ? `<p>Тепло вдягнені: ${dressed.length}</p><p class="wd-faces">${faces(dressed)}</p>` : "") +
        (sick.length ? `<p>Змерзли й пішли на лікарняний до 1 березня: ${sick.length}</p><p class="wd-faces sick">${faces(sick)}</p>`
                     : `<p><b>Ніхто не змерз!</b> Ти всіх вдягнула вчасно 💛</p>`),
      buttons: [{ label: sick.length ? "Одужуйте 🤒" : "Ура! 🧣", onClick: () => playDialog(sick.length
        ? [["halya", sick.length > 3 ? "Ой, пів села злягло… Нічого, понесемо їм малинового чаю 🍵" : "Шкода, що не всіх устигли вдягнути. Але до весни одужають 💛"]]
        : [["halya", "Усе село тепло вдягнене! Тепер нам жодна зима не страшна ❄️💛"]]) }]
    });
  }

  /* ---------- щосекунди ---------- */
  function tick() {
    if (!S || !S.started || S.ordersDone < 3 || S.level < 3 || busyUI()) return;
    const s = season();
    if (!s) return;
    if (!st()) S.wd = { id: "wd-" + s.y, intro: false, n: {}, dressed: {}, sick: {}, frost: false, warned: "" };
    const w = S.wd;
    if (s.phase === "prep" && !w.intro) {
      w.intro = true; save();
      playDialog([
        ["halya", "{name}, синоптики обіцяють люті морози з 15 грудня! ❄️ А в наших сусідів — ні шапок, ні рукавиць…"],
        ["olya", "Хто змерзне — той до весни зляже. Торік у мене так півсела з нежиттю ходило 🤧"],
        ["halya", "Пошиймо кожному теплу річ! Віддай сусідові кілька його замовлень, принеси матеріал — і плати за тканину. Деталі — у завданнях 📋, вкладка «Зима»."]
      ], () => window.QUEST && QUEST.panel("winter"));
      return;
    }
    if (s.phase === "winter" && w.intro && !w.frost) { frost(); return; }
    if (s.phase === "prep") {
      const left = daysLeft(), key = String(left), naked = Object.keys(WARDROBE).filter(k => known(k) && !w.dressed[k]).length;
      if (naked && [7, 3, 1].includes(left) && w.warned !== key) {
        w.warned = key; save();
        toast(`❄️ До морозів ${left} ${plural(left)}! Ще не вдягнені: ${naked}`);
      }
    }
  }

  /* ---------- вкладка «Зима» ---------- */
  function html() {
    const s = season(), w = st();
    if (!s || !w) return `<p class="hint-s">Зимова шафа відкривається щороку з 15 листопада.</p>`;
    const rows = Object.keys(WARDROBE).filter(known).map(k => {
      const g = WARDROBE[k], it = needItem(k), n = Math.min(w.n[k] || 0, g.orders);
      let right, sub;
      if (w.dressed[k]) { right = `<span class="wd-ok">✅</span>`; sub = `Тепло вдягнений 💛`; }
      else if (w.sick[k]) { right = `<span class="wd-ok">🤒</span>`; sub = `На лікарняному до 1 березня`; }
      else {
        const haveItem = findOnBoard(it) >= 0, haveCoins = S.coins >= g.coins, ordOk = n >= g.orders;
        sub = `<span class="${ordOk ? "ok" : ""}">замовлення ${n}/${g.orders}</span> · <span class="${haveItem ? "ok" : ""}">${itemIcon(it)}</span> · <span class="${haveCoins ? "ok" : ""}">${g.coins}🪙</span>`;
        right = s.phase === "prep" ? `<button class="s-btn wd-give${canGive(k) ? "" : " dim"}" data-who="${k}">Видати</button>` : "";
      }
      return `<div class="wd-row${w.sick[k] ? " sick" : w.dressed[k] ? " done" : ""}"><span class="wd-ava">${face(CHARS[k], "mini")}<i>${g.e}</i></span>` +
        `<span class="wd-mid"><b>${g.name} — ${CHARS[k].name.split(" ").pop()}</b><small>${sub}</small></span>${right}</div>`;
    }).join("");
    const head = s.phase === "prep"
      ? `<p class="dq-when">До морозів: <b>${daysLeft()} ${plural(daysLeft())}</b> (15 грудня)</p>`
      : `<p class="dq-when">Морози тривають до <b>1 березня</b> ❄️</p>`;
    return head + `<div class="wd-list">${rows}</div>` +
      (s.phase === "prep" ? `<p class="dq-hint">Віддай сусідові його замовлення, принеси предмет із дошки й заплати за тканину — і видай теплу річ. Хто лишиться без неї, той злягне до весни 🤒</p>` : "");
  }
  function bind() {
    document.querySelectorAll(".wd-give").forEach(b => b.onclick = () => {
      const k = b.dataset.who;
      if (canGive(k)) { give(k); return; }
      const w = st(), g = WARDROBE[k], it = needItem(k);
      const miss = [];
      if ((w.n[k] || 0) < g.orders) miss.push(`ще ${g.orders - (w.n[k] || 0)} замовл. від ${CHARS[k].name.split(" ").pop()}`);
      if (findOnBoard(it) < 0) miss.push(`${itemIcon(it)} ${itemName(it)} на дошці`);
      if (S.coins < g.coins) miss.push(`${g.coins - S.coins} 🪙`);
      sfx.nope(); toast("Бракує: " + miss.join(", "));
    });
  }
  const active = () => !!season();

  return { tick, onDeliver, isSick, isDressed, readyAny, html, bind, active, give, season };
})();
