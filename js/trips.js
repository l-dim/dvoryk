"use strict";
/* ============================================================
   ПОЇЗДКИ ✈️ — на море й у Карпати (обираєш сама, у «Подіях»).
   Працюють на машинці пригод (js/side.js): окрема дошка з генератором, цілі, «Додому» після мети.
   • Море 🌊 — завжди тепло, будь-якої пори року.
   • Карпати ⛰️ — з березня по листопад полонини з овечками й бринзою,
     а з грудня по лютий — гірськолижні пригоди 🎿.
   • Дорога коштує монети; поїздка триває 3 дні; знову поїхати туди ж — за тиждень.
   • Нагорода — скриня, зірочки, монети й сувенір у дворик (з'являється в «Двір на свій смак»).
   Стан: як у вилазок — S.side (поточна), S.outNext[id] (коли знову можна), S.trips = { id: скільки разів }
   ============================================================ */
const TRIP_DUR = 72 * 3600e3, TRIP_GAP = 7 * 864e5;
const TRIP_ART = [];                                   // мальовані: side-sea-0…4, side-gen-sea, side-carp-…, side-ski-…, souv-sea, souv-ski, ui-trip
const TRIP_REWARD = { chest: 1, stars: 5, coins: 250, hearts: 2, bonus: 40 };
const TRIP_GOALS = [{ l: 2, t: 3 }, { l: 3, t: 2 }, { l: 4, t: 1 }];
const TRIP_KINDS = [
  { id: "sea", short: "Море", host: "liza", title: "Поїздка на море", icon: "🌊", cost: 300, months: null,
    gen: ["🏖️", "Пляжна парасолька"],
    items: [["🐚", "Мушелька"], ["🦀", "Крабик"], ["🏰", "Пісочний замок"], ["🛟", "Надувне коло"], ["⛵", "Вітрильник"]],
    souv: ["🏖️", "Шезлонг із парасолькою", 9],
    note: "На морі завжди тепло ☀️ — хоч узимку, хоч улітку.",
    ask: "{name}, а поїхали на море? 🌊 Сонечко, теплий пісок, мушлі… Я вже квитки виглядаю! Тільки дорогу треба оплатити — і три дні відпочинку наші!",
    thanks: "Ох і відпочили! Засмагли, накупались, а мушель — повна валіза 🐚 Тримай сувенір — поставиш у дворику, щоб літо завжди було поруч 💛" },
  { id: "carp", short: "Карпати", host: "vasyl", title: "Карпати: полонини", icon: "⛰️", cost: 250, months: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    gen: ["🛖", "Колиба вівчаря"],
    items: [["🌿", "Полонинські трави"], ["🫐", "Кошик чорниць"], ["🧀", "Свіжа бринза"], ["🐑", "Ягнятко"], ["🪈", "Трембіта"]],
    souv: ["🐑", "Ягнятко з полонини", 6],
    note: "Улітку в горах — полонини, вівці, чорниці й бринза у вівчаря.",
    ask: "{name}, приїжджайте до мене на полонину! ⛰️ Вівці пасуться, бринза свіжа, а повітря — хоч ложкою їж. Дорогу оплатите — а гостина моя!",
    thanks: "Файно погостювали! Чорниць назбирали, бринзи наїлися, а на трембіті ти вже граєш краще за мене 😄 Тримай ягнятко — хай пасеться в дворику 🐑💛" },
  { id: "ski", short: "Лижі", host: "andriy", title: "Карпати: на лижі", icon: "🎿", cost: 350, months: [11, 0, 1],
    gen: ["🚡", "Канатна дорога"],
    items: [["❄️", "Сніжинка"], ["⛄", "Сніговичок"], ["🧣", "Теплий шарф"], ["🎿", "Лижі"], ["🏆", "Кубок лижника"]],
    souv: ["🛷", "Санчата з гір", 7],
    note: "Узимку в Карпатах — сніг, гірськолижні траси й гарячий чай у колибі.",
    ask: "{name}, у Буковелі випав сніг по коліна! ⛷️ Поїхали на лижі? Я обіцяю не падати… часто 😅 А ввечері — гарячий чай і банош біля каміна!",
    thanks: "Оце покаталися! Я впав лише сім разів, а в тебе — жодного! 🏆 Тримай санчата — будеш катати когось у дворику 😄" }
];
TRIP_KINDS.forEach(k => Object.assign(k, { outing: true, trip: true, dur: TRIP_DUR, gap: TRIP_GAP, reward: TRIP_REWARD, goals: TRIP_GOALS }));

/* ланцюжки й генератори поїздок (символи приватної зони 0xE560…) */
window.PUA_MAP = window.PUA_MAP || {};
(() => {
  let code = 0xE560;
  const ch = () => String.fromCharCode(code++);
  const art = id => TRIP_ART.includes(id) ? `items/${id}.webp` : null;
  TRIP_KINDS.forEach(k => {
    const items = k.items.map(([e, name], l) => { const c = ch(); PUA_MAP[c] = { e, img: art(`side-${k.id}-${l}`) }; return [c, name]; });
    CHAINS["side_" + k.id] = { name: k.title, items, side: true };
    const g = ch(); PUA_MAP[g] = { e: k.gen[0], img: art(`side-gen-${k.id}`) };
    GENS["side_" + k.id] = { icon: g, name: k.gen[1], chain: "side_" + k.id, side: true };
    if (typeof SIDE_KINDS !== "undefined") SIDE_KINDS.push(k);
  });
  // сувеніри — у «Двір на свій смак», але не продаються (лише з поїздки)
  if (typeof DECOR_SHOP !== "undefined") TRIP_KINDS.forEach(k => { if (!DECOR_SHOP.some(x => x[0] === k.souv[0])) DECOR_SHOP.push([k.souv[0], k.souv[1], 0, k.souv[2], "souv"]); });
  if (window.PAINTED) { if (TRIP_ART.includes("souv-sea")) PAINTED["1f3d6"] = "items/souv-sea.webp"; if (TRIP_ART.includes("souv-ski")) PAINTED["1f6f7"] = "items/souv-ski.webp"; }
})();

if (typeof UNLOCKS !== "undefined") UNLOCKS.push({ id: "trips", lvl: 12, icon: "🧳", title: "Поїздки",
  text: "Тепер можна поїхати відпочити! На море 🌊 — будь-коли, там завжди тепло. У Карпати ⛰️ — улітку на полонини до овечок, а взимку на лижі 🎿. Дорога коштує монети, поїздка триває 3 дні, а звідти привозиш сувенір у дворик. Шукай у «Подіях».",
  lines: [["liza", "{name}, ми з тобою стільки працюємо — пора й відпочити! 🧳 Може, на море? Або в гори?"]] });

window.TRIPS = (() => {
  const on = () => window.UNL && UNL.on("trips");
  const now = () => window.DVORYK_NOW || Date.now();
  const month = () => new Date(now()).getMonth();
  const open = k => !k.months || k.months.includes(month());
  const hm = ms => { const t = Math.max(0, Math.ceil(ms / 6e4)), h = Math.floor(t / 60); return h >= 24 ? Math.floor(h / 24) + " д " + (h % 24) + " год" : h ? h + " год " + (t % 60) + " хв" : (t % 60) + " хв"; };
  const byId = id => TRIP_KINDS.find(k => k.id === id);

  function go(id) {
    const k = byId(id); if (!k) return;
    if (S.side && S.side.kind === id) { if (!S.sideOn) { SIDE.enter(); SIDE.renderButton(); } showTab("board"); return; }
    if (S.side) { sfx.nope(); toast("Спершу заверши поточну пригоду 🙂"); return; }
    if (!open(k)) { sfx.nope(); toast(k.id === "ski" ? "Лижі — коли в горах сніг (грудень–лютий) ❄️" : "Узимку в Карпатах — лижі 🎿"); return; }
    if (!SIDE.canGo(id)) { sfx.nope(); toast("Ще не відпочили від минулої поїздки — знову за " + hm(S.outNext[id] - now())); return; }
    if (S.coins < k.cost) { sfx.nope(); toast(`На дорогу треба ${k.cost} 🪙 — бракує ${k.cost - S.coins}`); return; }
    modal({
      title: k.title + " " + k.icon,
      html: `<div class="big-emoji">${GENS["side_" + k.id].icon}</div><p>${k.note}</p>
        <p>Дорога — <b>${k.cost} 🪙</b>. Три дні окремої дошки з генератором ${GENS["side_" + k.id].icon}, а звідти — сувенір ${k.souv[0]} у дворик.</p>
        <p class="hint-s">Город тим часом чекатиме — повернутись можна будь-коли кнопкою 🪴 під дошкою.</p>`,
      buttons: [{ label: `🧳 Їхати за ${k.cost} 🪙`, onClick: () => start(k) }, { label: "Пізніше", cls: "ghost" }]
    });
  }
  function start(k) {
    if (S.side || S.coins < k.cost) return;
    S.coins -= k.cost; renderTop();
    SIDE.goOut(k.id); showTab("board");
  }
  function souvenir(k) {
    S.decor = S.decor || { inv: {}, placed: {}, seq: 0 };
    S.decor.inv[k.souv[0]] = (S.decor.inv[k.souv[0]] || 0) + 1;
    S.trips = S.trips || {}; S.trips[k.id] = (S.trips[k.id] || 0) + 1;
  }
  /* картки в «Подіях» */
  function cardOf(k) {
    const ic = GENS["side_" + k.id].icon;
    if (!on()) return { icon: ic, title: k.title, sub: `відкриється на ${window.PACE ? PACE.lvl("trips") : 12} рівні`, locked: true };
    if (S.side && S.side.kind === k.id) return { icon: ic, title: k.title, sub: S.side.done ? "Мета є — можна додому або ще погуляти" : "Ти зараз тут · ще " + hm(S.side.until - now()), btn: S.sideOn ? "Ти тут" : "Перейти", act: "trip:" + k.id, ready: true };
    if (S.side) return { icon: ic, title: k.title, sub: "Спершу заверши іншу пригоду", btn: "—", act: "" };
    if (!SIDE.canGo(k.id)) return { icon: ic, title: k.title, sub: "Знову можна за " + hm(S.outNext[k.id] - now()), btn: "⏳", act: "" };
    return { icon: ic, title: k.title, sub: `${k.note.split(" — ")[0].replace(/\.$/, "")} · 3 дні · дорога ${k.cost} 🪙 · сувенір ${k.souv[0]}`, btn: "Їхати", act: "trip:" + k.id, ready: S.coins >= k.cost };
  }
  function cards() {
    const carp = open(byId("ski")) ? byId("ski") : byId("carp");
    return [cardOf(byId("sea")), cardOf(carp)];
  }
  return { go, souvenir, cards, kinds: TRIP_KINDS };
})();

window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => TRIPS.cards()[0], () => TRIPS.cards()[1]]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { "trip:sea": () => TRIPS.go("sea"), "trip:carp": () => TRIPS.go("carp"), "trip:ski": () => TRIPS.go("ski") });
