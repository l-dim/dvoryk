"use strict";
/* ============================================================
   ПОЧЕСНІ МЕДАЛІ 🏅 — довгі досягнення з трьома ступенями 🥉🥈🥇
   ВИГОДА ДНЯ 🛍️ — щоденні пропозиції в крамничці з обмеженою кількістю
   Стан: S.stat = { tap, merge, chest, cook, lock, high, outing, … } — лічильники
         S.medal = { id: скільки ступенів забрано }
         S.deal = { day, list: [{ it, price, left }] }
   ============================================================ */
const MEDALS = [
  { id: "orders",  icon: "🧺", name: tt`Добра сусідка`,      what: tt`виконати замовлень`,       tiers: [50, 250, 1000],   get: () => S.ordersDone },
  { id: "merges",  icon: "✨", name: tt`Майстриня злиттів`,  what: tt`об'єднати предметів`,      tiers: [300, 1500, 6000], get: () => S.merges },
  { id: "taps",    icon: "🪴", name: tt`Невтомні руки`,      what: tt`тапнути генератори`,       tiers: [500, 3000, 12000], get: () => statOf("tap") },
  { id: "chests",  icon: "🎁", name: tt`Розпаковувачка`,     what: tt`відкрити подарунків`,      tiers: [25, 120, 400],    get: () => statOf("chest") },
  { id: "high",    icon: "🏅", name: tt`Висока майстерність`, what: tt`зробити предметів 5+ рівня`, tiers: [20, 100, 400], get: () => statOf("high") },
  { id: "cook",    icon: "🍲", name: tt`Господиня печі`,     what: tt`приготувати страв`,        tiers: [10, 50, 200],     get: () => statOf("cook") },
  { id: "webs",    icon: "🕸️", name: tt`Чистюля`,            what: tt`розчистити павутиння`,     tiers: [10, 50, 200],     get: () => statOf("lock") },
  { id: "hearts",  icon: "💛", name: tt`Душа села`,          what: tt`зібрати сердечок дружби`,  tiers: [20, 50, 100],     get: () => Object.values(S.fr || {}).reduce((a, b) => a + b, 0) },
  { id: "cards",   icon: "💌", name: tt`Колекціонерка`,      what: tt`зібрати листівок`,         tiers: [12, 24, 36],      get: () => (window.ALB ? ALB.haveN() : 0), need: "album" },
  { id: "outings", icon: "🎣", name: tt`Мандрівниця`,        what: tt`вдалих вилазок і пригод`,  tiers: [5, 20, 60],       get: () => statOf("outing"), need: "side" },
  { id: "contest", icon: "🏆", name: tt`Кулінарка округи`,   what: tt`призових місць на конкурсі`, tiers: [1, 5, 15],      get: () => Object.values(S.ctWins || {}).reduce((a, b) => a + b, 0), need: "contest" },
  { id: "chef",    icon: "👩‍🍳", name: tt`Шеф-кухарка`,        what: tt`приготувати страв на конкурсі`, tiers: [10, 50, 200], get: () => statOf("dishCt"), need: "contest" },
  { id: "story",   icon: "🏡", name: tt`Відбудовниця`,       what: tt`завершити розділів історії`, tiers: [5, 15, 28],     get: () => S.storyDone ? STORY.length : S.chapter }
];
const MEDAL_REWARD = [
  { coins: 60, stars: 1 },              // 🥉
  { chest: 1, coins: 120, stars: 2 },   // 🥈
  { chest: 2, coins: 250, stars: 4 }    // 🥇
];
const MEDAL_ICON = ["🥉", "🥈", "🥇"];
function statOf(k) { return (S.stat && S.stat[k]) || 0; }

window.MEDAL = (() => {
  const on = () => window.UNL && UNL.on("medals");
  const open = m => !m.need || (window.UNL && UNL.on(m.need));
  const got = m => (S.medal && S.medal[m.id]) || 0;
  const reached = m => m.tiers.filter(t => m.get() >= t).length;
  const canClaim = m => open(m) && got(m) < reached(m);
  const ready = () => on() && MEDALS.some(canClaim);
  const total = () => MEDALS.reduce((n, m) => n + got(m), 0);
  function count(k, n = 1) { S.stat = S.stat || {}; S.stat[k] = (S.stat[k] || 0) + n; }
  function claim(id) {
    const m = MEDALS.find(x => x.id === id); if (!m || !canClaim(m)) return;
    const tier = got(m), r = MEDAL_REWARD[tier];
    S.medal = S.medal || {}; S.medal[id] = tier + 1;
    if (r.chest !== undefined) placeItem({ c: "chest", l: r.chest });
    S.coins += r.coins || 0; S.stars += r.stars || 0;
    save(); renderAll(); sfx.level(); if (tier === 2) confetti();
    toast(`${MEDAL_ICON[tier]} «${m.name}»: ${r.chest !== undefined ? CHAINS.chest.items[r.chest][0] + " " : ""}+${r.coins} 🪙 +${r.stars} ⭐`);
    panel();
  }
  function panel() {
    const rows = MEDALS.map(m => {
      if (!open(m)) return tt`<div class="md-row locked"><span class="md-ic">🔒</span><span class="md-mid"><b>${m.name}</b><small>відкриється згодом</small></span></div>`;
      const g = got(m), v = m.get(), next = m.tiers[Math.min(g, 2)], can = canClaim(m);
      const pips = m.tiers.map((t, k) => `<i class="${k < g ? "on" : v >= t ? "can" : ""}">${k < g ? MEDAL_ICON[k] : ""}</i>`).join("");
      return `<div class="md-row${can ? " can" : g >= 3 ? " done" : ""}"><span class="md-ic">${m.icon}</span>` +
        `<span class="md-mid"><b>${m.name}</b><small>${g >= 3 ? tt`усі медалі зібрано!` : `${m.what}: ${Math.min(v, next)}/${next}`}</small>` +
        `<i class="dq-bar"><b style="width:${g >= 3 ? 100 : Math.min(100, v / next * 100)}%"></b></i></span>` +
        `<span class="md-pips">${pips}</span>${can ? `<button class="s-btn md-go" data-id="${m.id}">${MEDAL_ICON[g]}</button>` : ""}</div>`;
    }).join("");
    modal({ title: tt`Почесні медалі 🏅 ${total()}/${MEDALS.length * 3}`,
      html: tt`<p class="hint-s">За кожну справу в грі — медалі трьох ступенів: 🥉 → 🥈 → 🥇. Що вища медаль, то щедріша нагорода.</p><div class="md-list">${rows}</div>`,
      buttons: [{ label: tt`Закрити`, cls: "ghost" }] });
    document.querySelectorAll(".md-go").forEach(b => b.onclick = () => claim(b.dataset.id));
  }
  function card() {
    if (!on()) return null;
    return { icon: "🏅", title: tt`Почесні медалі`, sub: ready() ? tt`Є нова медаль — забирай!` : tt`${total()} з ${MEDALS.length * 3} медалей`, btn: tt`Відкрити`, act: "medals", ready: ready() };
  }
  return { count, panel, ready, card, total };
})();

/* ============================================================ */
const DEAL_COUNT = 4;
window.DEALS = (() => {
  const on = () => window.UNL && UNL.on("deals");
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  function roll() {
    const chains = S.gens.map(g => GENS[g].chain), list = [];
    const used = new Set();
    for (let k = 0; k < DEAL_COUNT - 1; k++) {
      let c = pick(chains), tries = 0;
      while (used.has(c) && tries++ < 6) c = pick(chains);
      used.add(c);
      const l = Math.min(CHAINS[c].items.length - 1, 3 + rnd(3));
      list.push({ it: { c, l }, price: Math.round(itemValue(c, l) * 2.2 / 5) * 5, left: 1 + rnd(3) });
    }
    // одна пропозиція — енергія або подарунок
    list.push(Math.random() < 0.6 ? { it: { c: "energy", l: 1 }, price: 70, left: 2 } : { it: { c: "chest", l: 0 }, price: 180, left: 1 });
    S.deal = { day: today(), list };
    save();
  }
  function buy(k) {
    const d = S.deal.list[k]; if (!d || d.left <= 0) return;
    if (S.coins < d.price) { sfx.nope(); toast(tt`Не вистачає монеток 🪙`); return; }
    S.coins -= d.price; d.left--;
    const at = placeItem(Object.assign({}, d.it));
    sfx.coin(); toast(`🛍️ ${itemIcon(d.it)} ${itemName(d.it)} — ${at >= 0 ? tt`на дошці` : tt`чекає в 📥`}`);
    renderAll(); save();
  }
  function untilMidnight() {
    const d = new Date(), m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() - d.getTime();
    const t = Math.ceil(m / 6e4); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  }
  function render() {
    const box = $("dealsBox"); if (!box) return;
    if (!on()) { box.innerHTML = ""; return; }
    if (!S.deal || S.deal.day !== today()) roll();
    const sig = JSON.stringify(S.deal) + S.coins;
    const head = tt`<div class="deal-h"><b>Вигода дня 🛍️</b><small>оновиться через <span id="dealT">${untilMidnight()}</span></small></div>`;
    if (box.dataset.sig === sig) { const t = $("dealT"); if (t) t.textContent = untilMidnight(); return; }
    box.dataset.sig = sig;
    box.innerHTML = head + `<div class="deal-grid">${S.deal.list.map((d, k) => `<button class="deal-card${d.left ? "" : " out"}" data-k="${k}">` +
      `<span class="deal-ic">${itemIcon(d.it)}</span><small>${itemName(d.it)}</small>` +
      `<em>${CHAINS[d.it.c].collect || CHAINS[d.it.c].open ? "" : tt`рів. ${d.it.l + 1} · `}${d.left ? "×" + d.left : tt`розпродано`}</em><span class="deal-price${d.left && S.coins >= d.price ? "" : " dim"}">${d.left ? d.price + " 🪙" : "✓"}</span></button>`).join("")}</div>`;
    box.querySelectorAll(".deal-card").forEach(b => b.onclick = () => buy(+b.dataset.k));
  }
  return { render };
})();
