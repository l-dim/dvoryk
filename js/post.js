"use strict";
/* ============================================================
   ПОСИЛКИ ПОШТОЮ 📮 — замовлення з інших міст.
   Люди з усієї країни пишуть листоноші Івану: хочуть домашнього сиру, дерев'яних і кованих
   виробів, кераміки, бурштину, лагодженої електроніки. Збираєш вироби (з городу чи майстерні),
   тиснеш «Відправити» — посилка їде кілька годин, а тоді приходить оплата й відгук.
   Що більше відгуків, то щедріше платять (до +30%).
   Замовлення чекає 3 дні; нове з'являється раз на 6–12 годин, відкритих — не більше трьох.
   Стан: S.post = { orders:[{id, who, city, items, coins, stars, until, ask}], sent:[{who, city, coins, stars, arrive, thanks}], next, reviews, seq }
   ============================================================ */
const POST_WAIT = 3 * 864e5, POST_GAP_H = [6, 12], POST_TRANSIT_H = [6, 16], POST_MAX = 3, POST_PAY = 1.6;
const POST_CHAINS = {
  dairy:   { min: 4, max: 6, ask: "Хочу справжнього домашнього сиру — у місті такого не знайдеш!" },
  milk:    { min: 2, max: 4, ask: "Діти просять сільського молочка — пришліть, будь ласка!" },
  cheese:  { min: 2, max: 4, ask: "Шукаю козячий сир від господині, а не з магазину" },
  wool:    { min: 2, max: 4, ask: "В'яжу светри — потрібна добра овеча вовна" },
  wood:    { min: 3, max: 5, ask: "Потрібні дерев'яні заготовки для майстерні" },
  carve:   { min: 2, max: 4, ask: "Шукаю різьблену дерев'яну річ на подарунок" },
  clay:    { min: 2, max: 4, ask: "Колекціоную глиняний посуд ручної роботи" },
  forge:   { min: 2, max: 4, ask: "Потрібні ковані речі для дачі" },
  amber:   { min: 2, max: 4, ask: "Мрію про прикрасу з живого бурштину" },
  electro: { min: 2, max: 4, ask: "Кажуть, у вашій майстерні все лагодять — допоможете?" }
};
const POST_PEOPLE = [["Оксана", "Київ", 1], ["Богдана", "Львів", 1], ["Пан Ігор", "Одеса"], ["Марта", "Тернопіль", 1], ["Дмитро", "Дніпро"],
  ["Соломія", "Ужгород", 1], ["Олег", "Полтава"], ["Христина", "Чернівці", 1], ["Назар", "Вінниця"], ["Ганна", "Харків", 1], ["Пані Леся", "Луцьк", 1], ["Роман", "Житомир"]];
const POST_THANKS = ["Усе дійшло ціле, дякую! Найкраща господиня в країні ⭐⭐⭐⭐⭐", "Розпакували всією родиною — у захваті! Замовлю ще 💛",
  "Якість — неймовірна. Порадила всім подругам!", "Дуже швидко й з любов'ю запаковано. Дякую! ⭐⭐⭐⭐⭐", "Саме те, що треба було! Щиро дякую 🙏"];

if (typeof UNLOCKS !== "undefined") UNLOCKS.push({ id: "post", lvl: 12, icon: "📮", title: "Посилки поштою",
  text: "Люди з інших міст замовляють твої вироби: домашній сир і молочне, дерев'яні й ковані речі, кераміку, бурштин, електроніку. Збери замовлене й відправ через листоношу Івана — оплата прийде, щойно посилка доїде. Шукай у «Подіях».",
  lines: [["ivan", "{name}, мені тепер з усієї країни листи йдуть — і всі про тебе! 📮 Хочуть твоїх виробів. Збирай — а я відправлю посилкою"]] });
if (typeof GUIDE_BASICS !== "undefined") GUIDE_BASICS.push(["📮", "Посилки поштою",
  "У «Подіях» — замовлення з інших міст (сир і молочне, дерев'яні, ковані, гончарні вироби, бурштин, електроніка — з того, що в тебе вже є). Знайди вироби на городі чи в майстерні й тисни «Відправити». Посилка їде кілька годин, тоді приходить оплата й відгук. Більше відгуків — щедріша оплата."]);

window.POST = (() => {
  const on = () => window.UNL && UNL.on("post");
  const now = () => window.DVORYK_NOW || Date.now();
  const st = () => (S.post = S.post || { orders: [], sent: [], next: 0, reviews: 0, seq: 0 });
  const rndIn = ([a, b]) => a + Math.random() * (b - a);
  const hm = ms => { const t = Math.max(0, Math.ceil(ms / 6e4)), h = Math.floor(t / 60); return h >= 24 ? Math.floor(h / 24) + " д " + (h % 24) + " год" : h ? h + " год " + (t % 60) + " хв" : (t % 60) + " хв"; };
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  /* дошки: город і майстерня (де б ти зараз не була) */
  const mainB = () => S.main || S.board;
  const woodB = () => S.woodOn ? S.board : (S.wood && S.wood.board) || [];
  const boards = () => [mainB(), woodB()];
  const bonus = () => Math.min(0.3, st().reviews * 0.02);

  /* що можна замовити: ланцюжки, генератори яких у тебе є */
  function chains() {
    const have = new Set();
    boards().forEach(b => b.forEach(x => { if (x && x.g && GENS[x.g]) have.add(GENS[x.g].chain); }));
    return Object.keys(POST_CHAINS).filter(c => CHAINS[c] && have.has(c));
  }
  function makeOrder() {
    const cs = chains(); if (!cs.length) return null;
    const s = st(), [who, city, f] = POST_PEOPLE[Math.floor(Math.random() * POST_PEOPLE.length)];
    const n = cs.length > 1 && Math.random() < 0.35 ? 2 : 1, items = [];
    for (let k = 0; k < n; k++) {
      const c = cs[Math.floor(Math.random() * cs.length)], p = POST_CHAINS[c], len = CHAINS[c].items.length;
      const top = Math.min(p.max, len - 1, p.min + Math.floor(S.level / 12));
      items.push({ c, l: p.min + Math.floor(Math.random() * (top - p.min + 1)) });
    }
    const coins = Math.round(items.reduce((a, it) => a + itemValue(it.c, it.l), 0) * POST_PAY * (1 + bonus()));
    return { id: ++s.seq, who, city, f: !!f, items, coins, stars: 1 + items.length, until: now() + POST_WAIT, ask: POST_CHAINS[items[0].c].ask };
  }
  /* де лежить предмет (не генератор, не павутиння) */
  function find(it, skip = []) {
    for (const b of boards()) { const i = b.findIndex((x, j) => x && !x.g && !x.lock && !x.st && x.c === it.c && x.l === it.l && !skip.some(s => s.b === b && s.i === j)); if (i >= 0) return { b, i }; }
    return null;
  }
  function findAll(o) { const got = []; for (const it of o.items) { const f = find(it, got); if (!f) return null; got.push(f); } return got; }

  function send(id) {
    const s = st(), o = s.orders.find(x => x.id === id); if (!o) return;
    const got = findAll(o);
    if (!got) {
      const miss = o.items.filter((it, k) => { const prev = o.items.slice(0, k).filter(x => x.c === it.c && x.l === it.l).length; let n = 0; boards().forEach(b => b.forEach(x => { if (x && !x.g && x.c === it.c && x.l === it.l) n++; })); return n <= prev; });
      sfx.nope(); toast("Бракує: " + miss.map(it => itemIcon(it) + " " + itemName(it)).join(", ")); return;
    }
    got.forEach(({ b, i }) => { b[i] = null; });
    if (selected >= 0 && !S.board[selected]) selected = -1;
    s.orders = s.orders.filter(x => x !== o);
    s.sent.push({ who: o.who, city: o.city, coins: o.coins, stars: o.stars, arrive: now() + rndIn(POST_TRANSIT_H) * 3600e3 * (window.REB && REB.has("bridge") ? 0.5 : 1) });   // міст — удвічі швидше
    if (window.QUEST) QUEST.track("deliver");
    sfx.deliver(); save(); renderAll();
    toast(`📦 Посилку для ${o.who} (${o.city}) відправлено! Оплата — щойно доїде`);
    panel();
  }

  function tick() {
    if (!S || !S.started || !on()) return;
    const s = st(), t = now();
    // оплата за посилки, що доїхали
    const arrived = s.sent.filter(p => t >= p.arrive);
    if (arrived.length && !busyUI()) {
      s.sent = s.sent.filter(p => !arrived.includes(p));
      let coins = 0, stars = 0;
      arrived.forEach(p => { coins += p.coins; stars += p.stars; s.reviews++; });
      S.coins += coins; S.stars += stars;
      save(); renderTop();
      const p = arrived[0];
      playDialog([["ivan", `Посилка дійшла! ${p.who} з міста ${p.city} пише: «${POST_THANKS[Math.floor(Math.random() * POST_THANKS.length)]}» 📮 Оплата вже у тебе: +${coins} 🪙 +${stars} ⭐`]]);
      sfx.coin();
    }
    // прострочені замовлення
    const gone = s.orders.filter(o => t >= o.until);
    if (gone.length) { s.orders = s.orders.filter(o => !gone.includes(o)); toast(`📮 ${gone[0].who} (${gone[0].city}) ${gone[0].f ? "не дочекалась і скасувала" : "не дочекався й скасував"} замовлення`); save(); }
    // нові замовлення
    if (!s.next) { s.next = t + 20 * 60e3; save(); return; }
    if (t >= s.next && s.orders.length < POST_MAX) {
      const o = makeOrder();
      s.next = t + rndIn(POST_GAP_H) * 3600e3;
      if (o) { s.orders.push(o); toast(`📮 Нове замовлення поштою: ${o.who} (${o.city}) — ${o.items.map(itemIcon).join(" ")}`); }
      save();
    }
  }

  function panel() {
    const s = st(), cs = chains();
    const rows = s.orders.map(o => {
      const ok = !!findAll(o);
      return `<div class="wd-row${ok ? " done" : ""}"><span class="wd-ava">📦</span><span class="wd-mid"><b>${o.who} · ${o.city}</b>` +
        `<small>«${o.ask}»</small><small>${o.items.map(it => itemIcon(it) + " " + itemName(it)).join(" + ")} · +${o.coins} 🪙 +${o.stars} ⭐ · ⏰ ${hm(o.until - now())}</small></span>` +
        `<button class="s-btn post-send${ok ? "" : " dim"}" data-id="${o.id}">Відправити</button></div>`;
    }).join("");
    const way = s.sent.map(p => `<div class="wd-row"><span class="wd-ava">🚚</span><span class="wd-mid"><b>${p.who} · ${p.city}</b><small>у дорозі ще ${hm(p.arrive - now())} · оплата +${p.coins} 🪙</small></span></div>`).join("");
    modal({
      title: "Посилки поштою 📮",
      html: (cs.length ? "" : `<p class="hint-s">Замовляють домашній сир і молочне, дерев'яні, ковані, гончарні вироби, бурштин і електроніку. Щойно в тебе з'явиться курник, хлів чи майстерня — підуть і замовлення.</p>`) +
        (rows ? `<div class="wd-list">${rows}</div>` : `<p>Поки нових замовлень немає — наступне прийде за <b>${hm(Math.max(0, s.next - now()))}</b>.</p>`) +
        (way ? `<p class="dq-when">У дорозі</p><div class="wd-list">${way}</div>` : "") +
        `<p class="hint-s">Відгуків: <b>${s.reviews}</b>${s.reviews ? ` · за них платять щедріше: +${Math.round(bonus() * 100)}%` : ""}. Вироби беруться з городу або з майстерні.</p>`,
      buttons: [{ label: "Готово", cls: "ghost" }]
    });
    document.querySelectorAll(".post-send").forEach(b => b.onclick = () => send(+b.dataset.id));
  }

  function card() {
    if (!on()) return { icon: "📮", title: "Посилки поштою", sub: `відкриється на ${window.PACE ? PACE.lvl("post") : 12} рівні`, locked: true };
    const s = st(), ready = s.orders.some(o => findAll(o));
    const sub = s.orders.length || s.sent.length
      ? [s.orders.length ? `замовлень: ${s.orders.length}` : "", s.sent.length ? `у дорозі: ${s.sent.length}` : "", s.reviews ? `відгуків: ${s.reviews}` : ""].filter(Boolean).join(" · ")
      : chains().length ? "нове замовлення прийде за " + hm(Math.max(0, s.next - now())) : "потрібен курник, хлів чи майстерня";
    return { icon: "📮", title: "Посилки поштою", sub: sub + (ready ? " · є що відправити!" : ""), btn: "Відкрити", act: "post", ready };
  }
  return { tick, panel, card, send, chains, makeOrder };
})();
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => POST.card()]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { post: () => POST.panel() });
