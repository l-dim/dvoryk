"use strict";
/* ============================================================
   СЕЗОННІ РІДКІСНІ ЛАНЦЮЖКИ 🍂❄️🌸🐝
   • Кожна пора року має свій ланцюжок із 5 предметів. Тап генератора іноді дає перший:
     рів.1 — раз на ~400 тапів (день-два), рів.2 — раз на ~2000 (тиждень-два). Решта — тільки злиттям.
   • Сусіди просять сезонні речі (окреме замовлення, платять щедро).
   • Наприкінці сезону ВСІ сезонні предмети зникають — з дошки, 📥 і сховку.
     Стан: S.seasonId (поточний сезон), S.seasonWarn (день останнього нагадування)
   ============================================================ */
const SEASONS = [
  { id: "winter", months: [11, 0, 1], name: "Зима", title: "Бурштинові сніжинки", icon: "❄️",
    items: [["❄️", "Сніжинка"], ["🧊", "Крижинка"], ["🔶", "Бурштинова сніжинка"], ["🏮", "Бурштиновий ліхтарик"], ["🌟", "Зимове сяйво"]] },
  { id: "spring", months: [2, 3, 4], name: "Весна", title: "Писанки", icon: "🥚",
    items: [["🥚", "Крашанка"], ["🎨", "Писанка-заготовка"], ["🪺", "Гніздо писанок"], ["🧺", "Великодній кошик"], ["🌸", "Писанка-оберіг"]] },
  { id: "summer", months: [5, 6, 7], name: "Літо", title: "Липовий мед", icon: "🐝",
    items: [["🐝", "Бджілка"], ["🍯", "Стільник"], ["🌻", "Медовий соняшник"], ["🕯️", "Воскова свічка"], ["🏺", "Глечик липового меду"]] },
  { id: "autumn", months: [8, 9, 10], name: "Осінь", title: "Золота осінь", icon: "🍂",
    items: [["🍂", "Листочок"], ["🍁", "Кленовий лист"], ["🌰", "Каштан"], ["🎃", "Гарбузик"], ["🌾", "Осінній вінок"]] }
];
const SEAS_DROP = [1 / 400, 1 / 2000], SEAS_VALS = [12, 30, 70, 160, 360];
const SEAS_ART = ["winter", "spring", "summer", "autumn"].flatMap(s => [0, 1, 2, 3, 4].map(l => `seas-${s}-${l}`));   // усі мальовані

/* реєструємо ланцюжки (символи приватної зони — щоб не плутати з такими ж емодзі деінде) */
window.PUA_MAP = window.PUA_MAP || {};
SEASONS.forEach((s, si) => {
  CHAINS["s_" + s.id] = { name: s.title, seasonal: true, vals: SEAS_VALS,
    items: s.items.map(([e, name], l) => { const c = String.fromCharCode(0xE300 + si * 16 + l), id = `seas-${s.id}-${l}`;
      PUA_MAP[c] = { e, img: SEAS_ART.includes(id) ? "items/" + id + ".webp" : null }; return [c, name]; }) };
});

window.SEAS = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const on = () => window.UNL && UNL.on("seasonal");
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const cur = () => { const m = new Date(now()).getMonth(); return SEASONS.find(s => s.months.includes(m)); };
  const chain = () => "s_" + cur().id;
  const isSeas = it => !!(it && it.c && CHAINS[it.c] && CHAINS[it.c].seasonal);
  /* кінець сезону: 1-ше число місяця після останнього місяця сезону */
  function endsAt() {
    const d = new Date(now()), s = cur(), last = s.months[2];
    let y = d.getFullYear(); if (last < d.getMonth()) y++;
    return new Date(y, last + 1, 1).getTime();
  }
  const daysLeft = () => Math.max(1, Math.ceil((endsAt() - now()) / 864e5));

  function onTap(near) {
    if (!on() || S.sideOn) return;
    const r = Math.random(), l = r < SEAS_DROP[1] ? 1 : r < SEAS_DROP[1] + SEAS_DROP[0] ? 0 : -1;
    if (l < 0) return;
    const at = placeItem({ c: chain(), l }, near);
    if (at >= 0) { spawnFrom.set(at, near); setTimeout(() => sparkle(at, "✨", 8), 250); }
    setTimeout(() => toast(`${cur().icon} Сезонна знахідка: ${CHAINS[chain()].items[l][1]}! Злий до кінця сезону — потім розтане`), 300);
  }

  /* сезонне замовлення: хтось із сусідів просить сезонну річ */
  function order() {
    if (!on() || S.orders.some(o => o.seas) || Math.random() >= 0.14) return null;
    const c = chain(), got = Object.keys(S.collection).filter(k => k.startsWith(c + ":")).map(k => +k.split(":")[1]);
    if (!got.length) return null;
    const l = Math.min(4, Math.max(1, Math.max(...got) + (Math.random() < 0.5 ? 1 : 0)));
    const who = Object.keys(CHARS).filter(k => PORTRAITS.includes(k) && k !== "cat" && k !== "collector" && (CHARS[k].from || 0) <= S.chapter && !S.orders.some(o => o.ch === k));
    if (!who.length) return null;
    return { id: ++S.orderSeq, ch: pick(who), items: [{ c, l }], coins: Math.round(SEAS_VALS[l] * 2.2), xp: 20 + l * 10, stars: 2 + Math.floor(l / 2), seas: true, line: rnd(3) };
  }

  /* зміна сезону — усе минулорічне тане */
  function sweep() {
    const keep = it => !isSeas(it) || it.c === chain();
    let n = 0;
    const clean = arr => arr.forEach((it, i) => { if (it && !keep(it)) { arr[i] = null; n++; } });
    clean(S.sideOn ? S.main : S.board);
    const before = (S.inbox || []).length; S.inbox = (S.inbox || []).filter(keep); n += before - S.inbox.length;
    if (S.store) { const b2 = S.store.items.length; S.store.items = S.store.items.filter(keep); n += b2 - S.store.items.length; }
    S.orders = S.orders.filter(o => !o.seas || o.items.every(it => it.c === chain()));
    return n;
  }
  function tick() {
    if (!S || !S.started || !on() || busyUI()) return;
    const id = cur().id;
    if (S.seasonId !== id) {
      const had = S.seasonId;
      S.seasonId = id;
      const n = had ? sweep() : 0;
      save(); renderAll();
      if (had) modal({ title: `${cur().name}! ${cur().icon}`,
        html: `<div class="big-emoji">${cur().icon}</div>${n ? `<p>Минулий сезон закінчився — ${n} ${n % 10 === 1 && n % 100 !== 11 ? "сезонна річ зникла" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "сезонні речі зникли" : "сезонних речей зникли"} 🍃</p>` : ""}<p>Новий сезонний ланцюжок: <b>${cur().title}</b>. Шукай у генераторах до ${new Date(endsAt() - 1).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}!</p>`,
        buttons: [{ label: "Шукатиму! ✨" }] });
      return;
    }
    const d = daysLeft(), key = new Date(now()).toDateString();
    if (d <= 7 && S.seasonWarn !== key && (S.board.some(isSeas) || (S.store && S.store.items.some(isSeas)))) {
      S.seasonWarn = key; save();
      toast(`${cur().icon} Сезон закінчується через ${d} ${d === 1 ? "день" : d < 5 ? "дні" : "днів"} — сезонні речі розтануть! Злий і віддай їх`);
    }
  }
  function card() {
    if (!on()) return null;
    const c = chain(), row = CHAINS[c].items.map((x, l) => S.collection[c + ":" + l] ? x[0] : "❔").join("");
    return { icon: cur().icon, title: `Сезон: ${cur().title}`, sub: `${row} · ще ${daysLeft()} дн., потім розтане`, btn: "", act: "" };
  }
  return { onTap, order, tick, card, isSeas, cur };
})();
