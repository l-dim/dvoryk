"use strict";
/* ============================================================
   РІДКІСНІ ЗНАХІДКИ 💎 · КОЛЕКЦІОНЕР 🧐 · ВИКЛИКИ НА ЧАС ⏳
   • Тап по генератору зрідка дає «Бабусин скарб»: рів.1 — раз на ~700 тапів (кілька днів), рів.2 — раз на ~3000 (тиждень-два).
     Два однакові скарби → вищий; верхні рівні — тільки злиттям.
   • Колекціонер Орест приходить без черги по рідкісний скарб і чекає 3 доби. Платить щедро.
   • Виклик на час: 90 хвилин, ціль, яку майже не можна виконати без докупівлі енергії
     чи монет. Повна нагорода — за всю ціль, половина — за 60%.
   Стан: S.rareNext, S.flash = { kind, t, n, until, done }, S.flashNext
   ============================================================ */
CHAINS.rare = { name: "Бабусині скарби", rare: true, vals: [15, 35, 80, 180, 400, 900, 2000], items: [
  ["📿", "Коралове намисто"], ["🥄", "Розписна ложка"], ["💍", "Бабусин перстень"], ["🏺", "Розписний глечик"],
  ["🕰️", "Годинник із зозулею"], ["💎", "Дорогоцінний камінь"], ["👑", "Родинна реліквія"] ] };
/* мальовані скарби: символи приватної зони Unicode → items/rare-<l>.webp (щоб не плутати з іншими 💍 🕰️ у грі) */
window.PUA_MAP = window.PUA_MAP || {};
CHAINS.rare.items = CHAINS.rare.items.map(([e, name], l) => { const c = String.fromCharCode(0xE200 + l); PUA_MAP[c] = { e, img: "items/rare-" + l + ".webp" }; return [c, name]; });
const RARE_ICON = `<img class="e3d pnt" src="items/ui-rare.webp" alt="">`;
const RARE_DROP = [1 / 700, 1 / 3000];                  // рів.1 ≈ раз на кілька днів, рів.2 ≈ раз на тиждень-два
CHARS.collector = { key: "collector", icon: "🧐", name: "Колекціонер Орест", from: 999,
  ask: ["Шукаю одну річ для колекції… Заплачу, як ніхто в окрузі 🧐", "Кажуть, у вашому дворику бувають справжні скарби?", "Я терплячий. Але така річ — на вагу золота!"],
  thanks: ["Неймовірно! Саме такої бракувало моїй колекції 🧐✨", "Оце знахідка! Тримайте — заслужили сповна", "Ваш дворик — справжня скарбниця!"] };
PORTRAITS.push("collector");                            // мальований портрет portraits/collector.webp
PORTRAIT_FACE.collector = [35.5, 23.1, 205];
const COLLECTOR = { waitH: 168, gapH: [72, 144], firstMin: 10 };   // чекає тиждень, приходить раз на 3–6 днів
const FLASH_DUR = 90 * 60e3, FLASH_GAP = [24, 48];      // год між викликами
const FLASH_KINDS = [
  { k: "tap",     icon: "🪴", text: "Тапни генератори",          t: lvl => 130 + lvl * 2 },
  { k: "merge",   icon: "✨", text: "Зроби злиттів",              t: lvl => 120 + lvl * 2 },
  { k: "deliver", icon: "🧺", text: "Віддай замовлень",           t: lvl => 9 + Math.floor(lvl / 10) },
  { k: "high",    icon: "🏅", text: "Створи предметів 5+ рівня",  t: lvl => 8 + Math.floor(lvl / 8) }
];
const FLASH_FULL = { chest: 2, rare: 1, stars: 5 }, FLASH_HALF = { chest: 0, coins: 60 };

window.RARE = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const on = () => window.UNL && UNL.on("rare");
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const hm = ms => { const t = Math.max(0, Math.ceil(ms / 6e4)), h = Math.floor(t / 60); return h >= 24 ? Math.floor(h / 24) + " д " + (h % 24) + " год" : h ? h + " год " + (t % 60) + " хв" : (t % 60) + " хв"; };

  /* ---------- знахідка при тапі ---------- */
  function onTap(near) {
    if (!on() || S.sideOn) return;
    const r = Math.random();
    const l = r < RARE_DROP[1] ? 1 : r < RARE_DROP[1] + RARE_DROP[0] ? 0 : -1;
    if (l < 0) return;
    const at = placeItem({ c: "rare", l }, near);
    if (at >= 0) { spawnFrom.set(at, near); setTimeout(() => sparkle(at, "✨", 10), 250); }
    sfx.level();
    setTimeout(() => toast(`💎 Рідкісна знахідка: ${CHAINS.rare.items[l][0]} ${CHAINS.rare.items[l][1]}! Два однакові — ще цінніша річ`), 300);
  }

  /* ---------- колекціонер ---------- */
  function rareOrder() {
    const best = Object.keys(S.collection).filter(k => k.startsWith("rare:")).map(k => +k.split(":")[1]);
    const top = best.length ? Math.max(...best) : 0;
    const l = Math.min(5, Math.max(1, Math.min(top + 1, 1 + rnd(3) + (S.level >= 15 ? 1 : 0))));
    // пара: два РІЗНІ скарби одночасно, чекає 5 діб, платить ще щедріше
    if (top >= 2 && Math.random() < 0.45) {
      let l2 = Math.max(1, Math.min(5, l + (Math.random() < 0.5 ? -1 : 1))); if (l2 === l) l2 = l > 1 ? l - 1 : l + 1;
      const v = CHAINS.rare.vals[l] + CHAINS.rare.vals[l2];
      return { id: ++S.orderSeq, ch: "collector", items: [{ c: "rare", l }, { c: "rare", l: l2 }], coins: Math.round(v * 3.6), xp: 60 + (l + l2) * 15,
        stars: 4 + l + l2, rare: true, pair: true, line: rnd(3), until: now() + 10 * 24 * 3600e3, rchest: 2 };
    }
    const v = CHAINS.rare.vals[l];
    return { id: ++S.orderSeq, ch: "collector", items: [{ c: "rare", l }], coins: Math.round(v * 3), xp: 30 + l * 15,
      stars: 2 + l, rare: true, line: rnd(3), until: now() + COLLECTOR.waitH * 3600e3, rchest: l >= 3 ? 2 : 1 };
  }
  function collectorTick() {
    if (!on() || S.sideOn || busyUI()) return;
    if (S.orders.some(o => o.rare)) return;
    if (!S.rareNext) { S.rareNext = now() + COLLECTOR.firstMin * 60e3; save(); return; }
    if (now() < S.rareNext) return;
    const o = rareOrder(); S.orders.unshift(o); S.rareNext = 0;
    renderOrders(); save();
    const want = o.items.map(it => `${CHAINS.rare.items[it.l][0]} «${CHAINS.rare.items[it.l][1]}»`).join(" і ");
    playDialog([["collector", o.pair ? `Добридень! Цього разу мені потрібна пара для вітрини 🧐 ${want} — разом! Чекатиму десять днів і заплачу по-царськи.`
      : `Добридень! Я — Орест, збираю старовину 🧐 Мені б ${want}. Чекатиму тиждень — і заплачу щедро!`]]);
  }
  function onDeliver(o) {
    if (!o.rare) return;
    placeItem({ c: "chest", l: o.rchest || 1 });
    S.rareNext = now() + (COLLECTOR.gapH[0] + rnd(COLLECTOR.gapH[1] - COLLECTOR.gapH[0])) * 3600e3;
    setTimeout(() => toast(`🧐 Колекціонер залишив ${CHAINS.chest.items[o.rchest || 1][0]} — на дошці!`), 900);
  }
  function onExpire(o) { if (o.rare) S.rareNext = now() + (COLLECTOR.gapH[0] + rnd(COLLECTOR.gapH[1] - COLLECTOR.gapH[0])) * 3600e3; }

  /* ---------- виклик на час ---------- */
  const fl = () => S.flash && !S.flash.over ? S.flash : null;
  const kind = f => FLASH_KINDS.find(x => x.k === f.kind);
  function start() {
    const k = pick(FLASH_KINDS);
    S.flash = { kind: k.k, t: k.t(S.level), n: 0, until: now() + FLASH_DUR, over: false };
    save(); renderButton();
    playDialog([["halya", `{name}, ярмарок у районі! Купці дають лише півтори години ⏳ ${k.text.toLowerCase()}: ${S.flash.t}. Встигнемо — буде скриня-сюрприз і рідкісна знахідка!`]], panel);
  }
  function track(k, n = 1) {
    const f = fl(); if (!f || f.kind !== k || now() >= f.until) return;
    f.n = Math.min(f.t, f.n + n);
    if (f.n >= f.t) finish(true);
    else { renderButton(); if (f.n === Math.ceil(f.t * 0.6)) toast("⏳ 60% виклику! Половина нагороди вже твоя — тисни далі за повною"); }
  }
  function grant(r) {
    const p = [];
    if (r.chest !== undefined) { placeItem({ c: "chest", l: r.chest }); p.push(CHAINS.chest.items[r.chest][0]); }
    if (r.rare !== undefined) { placeItem({ c: "rare", l: r.rare }); p.push(CHAINS.rare.items[r.rare][0]); }
    if (r.stars) { S.stars += r.stars; p.push("+" + r.stars + " ⭐"); }
    if (r.coins) { S.coins += r.coins; p.push("+" + r.coins + " 🪙"); }
    return p.join(" &nbsp; ");
  }
  function finish(won) {
    const f = S.flash; if (!f || f.over) return;
    f.over = true;
    const half = !won && f.n >= Math.ceil(f.t * 0.6);
    S.flashNext = now() + (FLASH_GAP[0] + rnd(FLASH_GAP[1] - FLASH_GAP[0] + 1)) * 3600e3;
    const txt = won ? grant(FLASH_FULL) : half ? grant(FLASH_HALF) : "";
    save(); renderAll(); renderButton();
    if (won) { confetti(); sfx.level(); }
    modal({ title: won ? "Виклик виконано! ⏳🏆" : half ? "Майже встигли ⏳" : "Час минув ⏳",
      html: `<div class="big-emoji">${won ? "🏆" : kind(f).icon}</div><p>${kind(f).text}: <b>${f.n} / ${f.t}</b></p>` +
        (txt ? `<p class="rewards">${txt}</p>` : `<p>Цього разу не вийшло. Наступний виклик — за кілька годин!</p>`) +
        (half ? `<p class="hint-s">За повну ціль були б 💝, рідкісна знахідка й +5 ⭐</p>` : ""),
      buttons: [{ label: won ? "Ура! 💛" : "Добре" }] });
  }
  function panel() {
    const f = fl();
    if (!f) { modal({ title: "Виклик на час ⏳", html: `<div class="big-emoji">⏳</div><p>Наступний виклик — за ${hm((S.flashNext || 0) - now())}.</p>`, buttons: [{ label: "Добре" }] }); return; }
    const k = kind(f), half = Math.ceil(f.t * 0.6);
    modal({ title: "Виклик на час ⏳",
      html: `<div class="fl-head"><span class="fl-ic">${k.icon}</span><span><b>${k.text}: ${f.t}</b><small>лишилось <b id="flLeft">${hm(f.until - now())}</b></small></span></div>` +
        `<div class="fl-bar"><b style="width:${f.n / f.t * 100}%"></b><i style="left:60%"></i><span>${f.n} / ${f.t}</span></div>` +
        `<p class="fl-rew"><span>60% (${half}): 🎁 +${FLASH_HALF.coins} 🪙</span><span>100%: 💝 ${CHAINS.rare.items[FLASH_FULL.rare][0]} +${FLASH_FULL.stars} ⭐</span></p>` +
        `<p class="hint-s">Енергії самої шкали тут не вистачить — докупи ⚡ у крамничці, розбуди генератори чи випий чаю ☕</p>`,
      buttons: [{ label: "⚡ Енергія", onClick: () => showNoEnergyInfo() }, { label: "Закрити", cls: "ghost" }] });
  }
  function renderButton() {
    const b = $("flashBtn"); if (!b) return;
    const f = fl();
    b.hidden = !f || S.sideOn;
    if (!f) return;
    $("flTime").textContent = hm(f.until - now()).replace(" год ", "г ").replace(" хв", "хв");
    $("flBar").style.width = (f.n / f.t * 100) + "%";
  }
  function flashTick() {
    if (!on() || !UNL.on("flash")) return;
    const f = fl();
    if (f && now() >= f.until && !busyUI()) { finish(f.n >= f.t); return; }
    if (!f && !busyUI() && !S.sideOn) {
      if (!S.flashNext) { S.flashNext = now() + 10 * 60e3; save(); }
      else if (now() >= S.flashNext) start();
    }
    renderButton();
  }
  function tick() { if (!S || !S.started) return; collectorTick(); flashTick(); }

  /* ---------- картки в «Подіях» ---------- */
  function cards() {
    if (!on()) return [];
    const got = CHAINS.rare.items.map((x, l) => S.collection["rare:" + l] ? x[0] : "❔").join("");
    const o = S.orders.find(x => x.rare);
    const out = [{ icon: RARE_ICON, title: "Бабусині скарби", sub: `${got} · знахідки з генераторів, два однакові → цінніша`, btn: "", act: "" },
      { icon: face(CHARS.collector, "mini"), title: "Колекціонер Орест", sub: o ? `чекає ${o.items.map(it => CHAINS.rare.items[it.l][0]).join(" + ")} ще ${hm(o.until - now())}` : `прийде за ${hm((S.rareNext || now()) - now())}`, btn: "", act: "" }];
    if (UNL.on("flash")) { const f = fl(); out.unshift({ icon: "⏳", title: "Виклик на час", sub: f ? `${kind(f).text}: ${f.n}/${f.t} · ${hm(f.until - now())}` : `наступний за ${hm((S.flashNext || now()) - now())}`, btn: f ? "Відкрити" : "", act: f ? "flash" : "", ready: !!f }); }
    return out;
  }
  return { onTap, onDeliver, onExpire, track, tick, panel, cards, renderButton };
})();
