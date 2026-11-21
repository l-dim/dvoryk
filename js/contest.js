"use strict";
/* ============================================================
   КУЛІНАРНИЙ КОНКУРС 🏆
   Кожні 3 дні — новий конкурс із темою (випічка, десерти, страви з печі).
   Здаєш на конкурс предмети потрібних ланцюжків — отримуєш бали.
   Суперниці з сусідніх сіл набирають бали самі, протягом конкурсу.
   Наприкінці — місце в таблиці й нагорода.
   Стан: S.ct = { id (номер конкурсу), pts, sent }, S.ctWins = { 1: скільки перших місць, 2:…, 3:… }
   ============================================================ */
const CT_ROUND = 3 * 864e5;
const CT_EPOCH = new Date(2026, 0, 5, 6).getTime();          // понеділок, 6 ранку
const CT_RIVALS = [
  { e: "👵", name: "Баба Явдоха", from: "Вишневе", skill: 1.35 },
  { e: "👨‍🍳", name: "Кухар Петро", from: "Дібрівка", skill: 1.2 },
  { e: "👩‍🦰", name: "Оксана", from: "Калинівка", skill: 1.08 },
  { e: "🧔", name: "Пасічник Остап", from: "Ясени", skill: 0.97 },
  { e: "👩‍🍳", name: "Тетяна", from: "Березівка", skill: 0.88 },
  { e: "👴", name: "Дід Панас", from: "Липове", skill: 0.78 },
  { e: "👧", name: "Соломійка", from: "Горбки", skill: 0.66 },
  { e: "🧑‍🍳", name: "Марко", from: "Зелений Гай", skill: 0.55 },
  { e: "👩", name: "Ганна", from: "Підлісне", skill: 0.45 }
];
const CT_THEMES = [
  { id: "bake",  name: "Найкраща випічка", icon: "🥐", chains: ["bake"], minL: 2 },
  { id: "sweet", name: "Солодкий стіл",    icon: "🍰", chains: ["sweet", "tea"], minL: 2 },
  { id: "oven",  name: "Страви з печі",    icon: "🍲", chains: ["dish", "bake"], minL: 2, oven: true }
];
const CT_REWARDS = [
  { chest: 2, coins: 300, stars: 5 },   // 1
  { chest: 1, coins: 200, stars: 3 },   // 2
  { chest: 1, coins: 120, stars: 2 },   // 3
  { chest: 0, coins: 80 }, { chest: 0, coins: 80 }, { chest: 0, coins: 80 },
  { coins: 40 }, { coins: 40 }, { coins: 40 }, { coins: 40 }
];
const CT_MEDAL = ["🥇", "🥈", "🥉"];

window.CONTEST = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const on = () => window.UNL && UNL.on("contest");
  const roundId = t => Math.floor(((t || now()) - CT_EPOCH) / CT_ROUND);
  const roundStart = id => CT_EPOCH + id * CT_ROUND;
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  /* детермінований «випадок» для конкурсу id */
  function rng(seed) { let s = (seed * 2654435761) >>> 0; return () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; }; }
  const unlockedChains = () => S.gens.map(g => GENS[g].chain);
  function theme(id) {
    const avail = CT_THEMES.filter(t => t.oven ? !!S.oven : t.chains.some(c => unlockedChains().includes(c)));
    return avail[((id % avail.length) + avail.length) % avail.length] || CT_THEMES[0];
  }
  const themeChains = t => t.chains.filter(c => c === "dish" ? !!S.oven : unlockedChains().includes(c));
  const points = it => Math.round(itemValue(it.c, it.l) * (it.c === "dish" ? 1.5 : 1));

  /* суперниці: ціль і «характер» (хтось починає рано, хтось робить ривок наприкінці) */
  function rivals(id, frac) {
    const r = rng(id + 77), base = 180 + 25 * S.level;
    return CT_RIVALS.map(x => {
      const target = base * x.skill * (0.88 + r() * 0.24), p = 0.6 + r() * 0.9;
      const f = Math.max(0, Math.min(1, frac));
      return Object.assign({}, x, { pts: Math.round(target * Math.pow(f, p)) });
    });
  }
  const frac = id => (now() - roundStart(id)) / CT_ROUND;
  function table(id, pts, f) {
    const list = rivals(id, f).concat([{ me: true, e: "", name: S.name || "Ти", from: "наш дворик", pts }]);
    list.sort((a, b) => b.pts - a.pts || (a.me ? -1 : 1));
    return list;
  }
  const st = () => (S.ct && S.ct.id === roundId() ? S.ct : null);

  /* ---------- здати предмет ---------- */
  function candidates() {
    const t = theme(roundId()), cs = themeChains(t), groups = {};
    S.board.forEach((it, i) => {
      if (!it || it.g || it.lock || it.st || !cs.includes(it.c) || it.l < t.minL) return;
      const k = it.c + ":" + it.l;
      (groups[k] = groups[k] || { c: it.c, l: it.l, idx: [] }).idx.push(i);
    });
    return Object.values(groups).sort((a, b) => points(b) - points(a));
  }
  function send(c, l) {
    const p = st(); if (!p) return;
    const i = S.board.findIndex(it => it && !it.g && it.c === c && it.l === +l);
    if (i < 0) return;
    const it = S.board[i], pts = points(it);
    S.board[i] = null; if (selected === i) selected = -1;
    p.pts += pts; p.sent = (p.sent || 0) + 1;
    sfx.deliver(); toast(`🏆 ${itemIcon(it)} ${itemName(it)} — журі в захваті! +${pts} балів`);
    renderBoard(); renderOrders(); renderInfo(); save();
    show();
  }

  /* ---------- підсумок ---------- */
  function close(old) {
    const t = theme(old.id), list = table(old.id, old.pts, 1), place = list.findIndex(x => x.me) + 1;
    if (!old.pts) return;               // не брала участі — без нагороди
    const r = CT_REWARDS[place - 1] || CT_REWARDS[CT_REWARDS.length - 1];
    if (r.chest !== undefined) placeItem({ c: "chest", l: r.chest });
    if (r.coins) S.coins += r.coins; if (r.stars) S.stars += r.stars;
    if (place <= 3) { S.ctWins = S.ctWins || {}; S.ctWins[place] = (S.ctWins[place] || 0) + 1; }
    save(); renderAll();
    if (place <= 3) { confetti(); sfx.level(); }
    pend = () => modal({ title: place === 1 ? "Перше місце! 🥇" : "Конкурс завершено 🏆",
      html: `<div class="big-emoji">${CT_MEDAL[place - 1] || t.icon}</div><p>«${t.name}»: ти на <b>${place}-му місці</b> з ${list.length}${place === 1 ? " — найкраща кулінарка округи!" : "!"}</p>` +
        `<p class="rewards">${r.chest !== undefined ? CHAINS.chest.items[r.chest][0] + " &nbsp; " : ""}+${r.coins} 🪙${r.stars ? " &nbsp; +" + r.stars + " ⭐" : ""}</p><p class="hint-s">Новий конкурс уже почався — тема «${theme(roundId()).name}» ${theme(roundId()).icon}</p>`,
      buttons: [{ label: "До нового конкурсу ›", onClick: show }, { label: "Добре", cls: "ghost" }] });
  }
  let pend = null;
  function sync() {
    if (!on()) return;
    const id = roundId();
    if (S.ct && S.ct.id !== id) close(S.ct);
    if (!S.ct || S.ct.id !== id) { S.ct = { id, pts: 0, sent: 0 }; save(); }
  }

  /* ---------- вікно ---------- */
  function left() {
    const t = Math.ceil((roundStart(roundId() + 1) - now()) / 6e4), h = Math.floor(t / 60);
    return h >= 24 ? Math.floor(h / 24) + " д " + (h % 24) + " год" : h + " год " + (t % 60) + " хв";
  }
  function show() {
    sync();
    const p = S.ct, t = theme(p.id), list = table(p.id, p.pts, frac(p.id));
    const rows = list.map((x, k) => `<div class="ct-row${x.me ? " me" : ""}"><span class="ct-pl">${CT_MEDAL[k] || k + 1}</span>` +
      `<span class="ct-ava">${x.me ? "🏡" : x.e}</span>` +
      `<span class="ct-name"><b>${x.me ? "Ти — " + (S.name || "господиня") : x.name}</b><small>${x.from}</small></span><span class="ct-pts">${x.pts}</span></div>`).join("");
    const cands = candidates();
    const sendHtml = cands.length ? cands.map(g => `<button class="ct-send" data-c="${g.c}" data-l="${g.l}"><span>${itemIcon(g)}</span><small>+${points(g)}</small>${g.idx.length > 1 ? `<i>×${g.idx.length}</i>` : ""}</button>`).join("")
      : `<p class="hint-s">На дошці поки немає нічого для журі. Потрібно: ${themeChains(t).map(c => CHAINS[c].items[t.minL][0] + " " + CHAINS[c].name.toLowerCase()).join(", ")} — від ${t.minL + 1}-го рівня і вище. Що вищий рівень, то більше балів!</p>`;
    const w = S.ctWins || {};
    modal({ title: "Кулінарний конкурс 🏆",
      html: `<div class="ct-head"><span class="ct-big">${t.icon}</span><span><b>${t.name}</b><small>до кінця: ${left()}</small></span></div>` +
        `<p class="ct-lbl">Здати журі (тапни):</p><div class="ct-sends">${sendHtml}</div>` +
        `<div class="ct-table">${rows}</div>` +
        `<p class="hint-s">Нагороди: 🥇 💝 +300 🪙 +5 ⭐ · 🥈 📦 +200 🪙 · 🥉 📦 +120 🪙 · топ-6 🎁${(w[1] || w[2] || w[3]) ? `<br>Твої медалі: 🥇${w[1] || 0} 🥈${w[2] || 0} 🥉${w[3] || 0}` : ""}</p>`,
      buttons: [{ label: "Закрити", cls: "ghost" }] });
    document.querySelectorAll(".ct-send").forEach(b => b.onclick = () => send(b.dataset.c, b.dataset.l));
  }

  function tick() {
    if (!on() || !S.started) return;
    sync();
    if (pend && !busyUI()) { const f = pend; pend = null; f(); }
  }
  function card() {
    if (!on()) return null;
    sync();
    const p = S.ct, t = theme(p.id), list = table(p.id, p.pts, frac(p.id)), place = list.findIndex(x => x.me) + 1;
    return { icon: t.icon, title: "Кулінарний конкурс", sub: `«${t.name}» · ${p.pts ? place + "-е місце" : "ще не брала участі"} · ${left()}`, ready: candidates().length > 0 };
  }
  return { show, tick, card, sync };
})();
