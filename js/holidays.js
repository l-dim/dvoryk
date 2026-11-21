"use strict";
/* ============================================================
   СВЯТА ЗА КАЛЕНДАРЕМ 🗓️ — дев'ять подій на рік у справжні дати.
   Працюють на тій самій машинці, що й Свято Миколая (js/event.js): власний генератор і ланцюжок,
   замовлення від господарів свята, бали свята (своя іконка), шкала нагород, історія.
   Рухомі свята (Масляна, Великдень, Зелені свята) рахуються від православної пасхалії.
   Стан: S.ev — поточне свято (як і раніше); S.evDone — id уже завершених.
   ============================================================ */
const HOL_ART = [];   // мальовані: hol-<key>-<l>, gen-hol-<key> — коли буде аркуш
const HOL_MS = [
  { pts: 10, reward: { energy: 10 } }, { pts: 25, reward: { chest: 0 } }, { pts: 45, reward: { coins: 200 } },
  { pts: 70, reward: { chest: 1, stars: 2 }, story: "mid" }, { pts: 100, reward: { energy: 25, coins: 300 } },
  { pts: 140, reward: { chest: 2, stars: 5 }, story: "final" }
];
/* православний Великдень (за юліанською пасхалією) → григоріанська дата */
function orthodoxEaster(y) {
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
  const m = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
  return new Date(y, m - 1, day + 13);
}
const fromEaster = (y, a, b) => { const E = orthodoxEaster(y), at = n => new Date(E.getFullYear(), E.getMonth(), E.getDate() + n).getTime(); return { start: at(a), end: at(b) }; };   // календарними днями (без зсуву через літній час)
const fixed = (y, m1, d1, m2, d2, y2 = y) => ({ start: new Date(y, m1, d1).getTime(), end: new Date(y2, m2, d2).getTime() });

const HOLIDAYS = [
  { key: "rizdvo", title: "Різдвяні свята", pt: "🕯️", ptName: "свічечки", gen: ["🌾", "Дідух"], who: ["ivan", "taras", "halya"],
    window: y => fixed(y, 11, 15, 0, 8, y + 1),
    desc: "Готуємо Святвечір і колядки! Тапай дідуха, об'єднуй святкові страви й віддавай колядникам.",
    items: [["🌾", "Колосок"], ["🕯️", "Свічечка"], ["🥣", "Кутя"], ["🥯", "Пампушки"], ["🌟", "Різдвяна зірка"], ["🎄", "Святвечірній стіл"]],
    deco: [["🎄", 22, 52, 12], ["🌟", 78, 30, 6], ["🕯️", 70, 70, 5], ["🌾", 30, 74, 6]],
    story: {
      intro: [["halya", "{name}, Святвечір на носі! 🕯️ Треба дванадцять страв наготувати, а дідуха я вже поставила в твоєму дворику 🌾"],
        ["ivan", "А ми з Тарасом колядників збираємо! Тапай дідуха — будуть колоски, свічечки, кутя… Віддавай нам — за кожне свічечки 🕯️"]],
      mid: [["taras", "Ми вже пів села обколядували! «Добрий вечір тобі, пане господарю…» 🎶"], ["halya", "А кутя цього року — найсмачніша! Мак сама терла 😄"]],
      final: [["ivan", "Усе село колядувало до ранку! 🌟 Христос народився!"], ["halya", "Славімо Його! І тобі, {name}, дякуємо — без тебе такого свята не було б 💛"]],
      ending: [["halya", "Різдвяні свята минули, а дідух ще довго стоятиме на покуті 🌾"]] } },
  { key: "maslyana", title: "Масляна", pt: "🥞", ptName: "млинці", gen: ["🧈", "Масляна піч"], who: ["andriy", "halya", "olya"],
    window: y => fromEaster(y, -56, -48),
    desc: "Тиждень млинців і вареників із сиром! Тапай піч, об'єднуй частування й віддавай сусідам.",
    items: [["🧀", "Сирок"], ["🥟", "Вареник із сиром"], ["🥞", "Млинець"], ["🍯", "Млинці з медом"], ["🎀", "Колодка зі стрічками"], ["🔥", "Опудало Масляни"]],
    deco: [["🔥", 26, 70, 7], ["🎀", 74, 66, 5], ["🎈", 80, 34, 6]],
    story: {
      intro: [["andriy", "{name}, Масляна! 🥞 Цілий тиждень — млинці, вареники з сиром і гуляння!"], ["halya", "Я піч розтопила в твоєму дворику. Тапай — а млинці віддавай нам, рахуватимемо 🥞"]],
      mid: [["olya", "Хлопці колодку чіпляють неодруженим — Андрію, а ти чого ховаєшся? 😄"], ["andriy", "Та я ж кухар, мені ніколи! …Ну хіба один млинчик 🥞"]],
      final: [["halya", "Спалили опудало Масляни — зима, прощавай! 🔥"], ["andriy", "Ще ніколи стільки млинців не пекли. Дякую, {name}! 🥞"]],
      ending: [["halya", "Масляна минула — попереду піст і весна 🌱"]] } },
  { key: "velykden", title: "Великдень", pt: "🥚", ptName: "крашанки", gen: ["🧺", "Великодній кошик"], who: ["halya", "olya", "marichka"],
    window: y => fromEaster(y, -6, 4),
    desc: "Печемо паски й пишемо писанки до Великодня! Тапай кошик, об'єднуй і віддавай сусідам.",
    items: [["🥚", "Яйце"], ["🔴", "Крашанка"], ["🎨", "Писанка"], ["🥮", "Паска"], ["🧺", "Кошик до церкви"], ["⛪", "Святковий кошик із рушником"]],
    deco: [["🌸", 22, 52, 11], ["🧺", 72, 72, 5], ["🥚", 30, 76, 4]],
    story: {
      intro: [["halya", "{name}, Великдень іде! 🥚 Будемо паски пекти й писанки писати — я вже й віск розтопила"], ["marichka", "Я поставила тобі кошик! Тапай — і віддавай нам крашанки, писанки, паски 🧺"]],
      mid: [["olya", "Подивись, яку писанку Марічка написала — з півниками! 🐓"], ["marichka", "А в тебе, {name}, із ружами виходять найкращі 🌸"]],
      final: [["halya", "Христос воскрес! 🥚 Кошики освячено, паски — пухкі, як хмаринки"], ["olya", "Воістину воскрес! Битимемося крашанками — чия міцніша? 😄"]],
      ending: [["halya", "Великдень минув, а писанки ще цілий рік берегтимуть хату 💛"]] } },
  { key: "triytsia", title: "Зелені свята", pt: "🌿", ptName: "гілочки", gen: ["🌿", "Клечання"], who: ["marichka", "stepan", "liza"],
    window: y => fromEaster(y, 45, 52),
    desc: "Прикрашаємо хати зеленню на Трійцю! Тапай клечання, об'єднуй і віддавай сусідам.",
    items: [["🌱", "Травинка"], ["🌿", "Гілочка липи"], ["🍃", "Пучок аїру"], ["🚪", "Клечання на воротах"], ["🌸", "Зелений вінок"], ["🏡", "Хата в зелені"]],
    deco: [["🌿", 24, 70, 7], ["🌿", 76, 70, 7], ["🌳", 18, 50, 11]],
    story: {
      intro: [["marichka", "{name}, Зелені свята! 🌿 Треба хату заквітчати — липою, клечанням, аїром на підлогу"], ["stepan", "Я тобі клечання наламав. Тапай — і роздавай сусідам зелень 🌿"]],
      mid: [["liza", "Як же пахне в хаті аїром! Наче в лісі 🌿"], ["stepan", "Отож! Дід мій казав: заквітчана хата — щаслива хата"]],
      final: [["marichka", "Усе село зелене-зелене! 🌳 Найгарніші свята в році"], ["liza", "Дякуємо, {name}! Зелень до осені стоятиме 💚"]],
      ending: [["marichka", "Зелені свята минули — а літо тільки починається ☀️"]] } },
  { key: "kupala", title: "Івана Купала", pt: "🌸", ptName: "квіточки", gen: ["🔥", "Купальське вогнище"], who: ["liza", "marichka", "olya"],
    window: y => fixed(y, 5, 20, 5, 26),
    desc: "Найкоротша ніч року! Тапай вогнище, плети вінки й шукай цвіт папороті.",
    items: [["🌼", "Ромашка"], ["💐", "Польові квіти"], ["🌸", "Віночок"], ["🕯️", "Свічка у вінку"], ["🛶", "Вінок на воді"], ["✨", "Цвіт папороті"]],
    deco: [["🔥", 50, 64, 8], ["🌼", 28, 78, 5], ["🕯️", 72, 76, 4]],
    story: {
      intro: [["liza", "{name}, Купала! 🔥 Сьогодні плетемо вінки й пускаємо на воду — а вночі шукаємо цвіт папороті!"], ["marichka", "Я вогнище розклала в твоєму дворику. Тапай — і віддавай нам квіточки 🌸"]],
      mid: [["olya", "Мій вінок поплив далеко-далеко… Може, і мені суджений знайдеться? 🥹"], ["liza", "Знайдеться! Тільки через вогнище стрибнути не забудь 😄🔥"]],
      final: [["marichka", "Ми знайшли цвіт папороті! ✨ Ну… майже. Але бажання я загадала!"], ["liza", "Дякую, {name}! Найчарівніша ніч у році 🌸"]],
      ending: [["liza", "Купальська ніч минула — а вінки ще пливуть річкою 🌼"]] } },
  { key: "spas", title: "Медовий і Яблучний Спас", pt: "🍯", ptName: "медові краплинки", gen: ["🐝", "Вулик"], who: ["stepan", "halya", "andriy"],
    window: y => fixed(y, 7, 1, 7, 10),
    desc: "Перший мед і перші яблука! Тапай вулик, об'єднуй і неси святити.",
    items: [["🍏", "Яблучко"], ["🍯", "Стільник"], ["🫙", "Глечик меду"], ["🧺", "Кошик яблук"], ["🍪", "Медяник"], ["🎁", "Освячений кошик"]],
    deco: [["🍯", 26, 72, 5], ["🧺", 72, 72, 5], ["🌳", 80, 48, 11]],
    story: {
      intro: [["stepan", "{name}, Медовий Спас! 🍯 Я вулик тобі поставив — бджілки цього року наносили меду, як ніколи"], ["halya", "А за тиждень — Яблучний Спас 🍏 Тапай вулик і віддавай нам мед та яблука!"]],
      mid: [["andriy", "Медяники з першим медом — це щось! 🍪 Пахне на все село"], ["stepan", "Отож. А яблука до Спаса — не їсти! Стерпи ще трошки 😄"]],
      final: [["halya", "Кошики освятили — мед, яблука, мак 🧺 Тепер можна й скуштувати!"], ["stepan", "Дякую, {name}. Солодкого тобі року, як цей мед 🍯"]],
      ending: [["stepan", "Спаси минули — а мед у коморі ще всю зиму радуватиме 🍯"]] } },
  { key: "nezalezhnist", title: "День Незалежності", pt: "🌻", ptName: "соняшники", gen: ["🎪", "Святкова сцена"], who: ["taras", "iryna", "ivan"],
    window: y => fixed(y, 7, 20, 7, 26),
    desc: "Свято всієї країни! Тапай сцену, готуй вишиванки й віддавай сусідам.",
    items: [["🎗️", "Синьо-жовта стрічка"], ["🌾", "Колосся"], ["🌻", "Соняшник"], ["👕", "Вишиванка"], ["🍞", "Святковий коровай"], ["🎆", "Святковий салют"]],
    deco: [["🎈", 22, 36, 6], ["🎈", 78, 36, 6], ["🌻", 28, 74, 5], ["🌻", 72, 74, 5]],
    story: {
      intro: [["iryna", "{name}, День Незалежності! 💙💛 Діти з моєї школи готують концерт — допоможеш?"], ["taras", "Я сцену поставив у твоєму дворику! Тапай — і віддавай нам усе для свята 🌻"]],
      mid: [["ivan", "Усе село у вишиванках — аж очі радіють! 👕"], ["iryna", "А діти так співають «Ой у лузі червона калина»… я аж плакала 🥹"]],
      final: [["taras", "Салют! 🎆 Слава Україні!"], ["iryna", "Героям слава! Дякуємо, {name}, — найкраще свято в селі 💙💛"]],
      ending: [["iryna", "Свято минуло, а соняшники й далі дивляться на сонце 🌻"]] } },
  { key: "pokrova", title: "Покрова", pt: "🍂", ptName: "листочки", gen: ["🍁", "Осінній кошик"], who: ["olya", "andriy", "halya"],
    window: y => fixed(y, 8, 27, 9, 4),
    desc: "Свято Покрови й захисників! Тапай кошик, збирай осінні дари й віддавай сусідам.",
    items: [["🍒", "Гроно калини"], ["🍁", "Кленовий листок"], ["🧣", "Хустка"], ["🎀", "Рушник"], ["🎃", "Гарбуз"], ["🥧", "Покровський пиріг"]],
    deco: [["🍂", 30, 76, 6], ["🍁", 70, 74, 6], ["🎃", 24, 66, 5]],
    story: {
      intro: [["olya", "{name}, Покрова! 🍂 Свято осені й наших захисників. Пироги, калина, хустки…"], ["andriy", "Я кошик поставив у твоєму дворику — тапай і віддавай нам осінні дари 🍁"]],
      mid: [["halya", "Кажуть: на Покрову дівчата свататися чекають 😄 Олю, чого почервоніла?"], ["olya", "Та то від калини! 🍒"]],
      final: [["andriy", "Пиріг на все село спекли! 🥧 А частину — нашим захисникам"], ["halya", "Хай Покрова вкриває всіх наших. Дякую, {name} 💛"]],
      ending: [["olya", "Покрова минула — попереду золота осінь 🍂"]] } }
];

window.PUA_MAP = window.PUA_MAP || {};
HOLIDAYS.forEach((h, k) => {
  const art = id => HOL_ART.includes(id) ? `items/${id}.webp` : null;
  const chain = "hol_" + h.key;
  CHAINS[chain] = { name: h.title, items: h.items.map(([e, n], l) => { const c = String.fromCharCode(0xE600 + k * 16 + l); PUA_MAP[c] = { e, img: art(`hol-${h.key}-${l}`) }; return [c, n]; }) };
  const g = String.fromCharCode(0xE6A0 + k);
  PUA_MAP[g] = { e: h.gen[0], img: art("gen-hol-" + h.key) };
  GENS[chain] = { icon: g, name: h.gen[1], chain, holiday: true };
  Object.assign(h, { chain, gen: chain, genName: h.gen[1], milestones: HOL_MS });
});
if (GENS.mykolai) GENS.mykolai.holiday = true;
/* Миколай — теж у календарі (з тими самими даними, що й були) */
const HOL_ALL = [...HOLIDAYS, Object.assign({}, EVENT, { pt: "❄️", ptName: "сніжинки", deco: [["❄️", 30, 30, 5], ["🎁", 70, 74, 5]],
  desc: "Допоможи Ірині й Марічці зібрати подарунки для сільських дітей! Тапай скриньку, об'єднуй подарунки й віддавай їм." })];
HOL_ALL.sort((a, b) => a.window(2027).start - b.window(2027).start);   // у порядку року (від січня)

window.HOL = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const winOf = (h, t = now()) => {
    const y = new Date(t).getFullYear();
    for (const yy of [y - 1, y]) { const w = h.window(yy); if (t >= w.start && t < w.end) return Object.assign({ y: yy }, w); }
    return Object.assign({ y }, h.window(y));
  };
  const inWin = (h, t = now()) => { const w = winOf(h, t); return t >= w.start && t < w.end; };
  const idOf = (h, t = now()) => h.key + "-" + winOf(h, t).y;
  const byKey = k => HOL_ALL.find(h => h.key === k);
  let cur = byKey("mykolai");
  /* обрати поточне свято й підставити його в EVENT (машинка js/event.js працює з EVENT) */
  function pick() {
    let h = null;
    if (S && S.ev && S.ev.intro && !S.ev.ended) h = byKey(S.ev.id.replace(/-\d+$/, ""));
    if (!h) { const done = (S && S.evDone) || []; h = HOL_ALL.filter(x => inWin(x) && !done.includes(idOf(x)) && !(S && S.ev && S.ev.id === idOf(x) && S.ev.ended)).sort((a, b) => winOf(a).start - winOf(b).start)[0] || null; }
    if (!h) h = next() || cur;
    if (h !== cur || EVENT.key !== h.key) { cur = h; Object.assign(EVENT, { key: h.key, title: h.title, window: h.window, chain: h.chain, gen: h.gen, who: h.who, milestones: h.milestones, story: h.story, pt: h.pt, desc: h.desc }); }
    if (typeof DAILY !== "undefined" && DAILY.snow) { DAILY.snow.icon = h.pt; DAILY.snow.text = `Збери ${h.ptName} на свято`; }
    return h;
  }
  const win = () => winOf(cur);
  /* найближче свято, що ще попереду */
  function next(t = now()) {
    let best = null, bt = Infinity;
    HOL_ALL.forEach(h => { const y = new Date(t).getFullYear(); [y, y + 1].forEach(yy => { const w = h.window(yy); if (w.start > t && w.start < bt) { bt = w.start; best = h; } }); });
    return best;
  }
  const fmt = ts => new Date(ts).toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
  function finished(id) { S.evDone = (S.evDone || []).concat(id).slice(-20); }
  /* прикраси свята в дворику */
  function yard() {
    if (!window.EV || !EV.active()) return [];
    return (cur.deco || []).map(([e, x, y, s], k) => ({ key: "hol-" + cur.key + "-" + k, e, x, y, s }));
  }
  /* календар свят */
  function calendar() {
    const t = now(), y = new Date(t).getFullYear();
    const rows = HOL_ALL.map(h => { let w = h.window(y); if (w.end <= t) w = h.window(y + 1); const live = inWin(h) && window.EV && EV.active() && cur === h;
      return { h, w, live }; }).sort((a, b) => a.w.start - b.w.start)
      .map(({ h, w, live }) => `<div class="hl-row${live ? " live" : ""}"><span class="hl-ic">${h.pt}</span><span class="hl-t"><b>${h.title}</b><small>${fmt(w.start)} — ${fmt(w.end - 864e5)}</small></span>${live ? `<span class="hl-on">триває!</span>` : ""}</div>`).join("");
    modal({ title: "Свята року 🗓️", html: `<p class="hint-s">Кожне свято — у свої справжні дні: окремий генератор, замовлення від господарів свята й шкала нагород.</p><div class="hl-list">${rows}</div>`,
      buttons: [...(window.EV && EV.active() ? [{ label: `${cur.pt} ${cur.title}`, onClick: () => EV.panel() }] : []), { label: "Закрити", cls: "ghost" }] });
  }
  function card() {
    if (!S || !S.started) return null;
    if (window.EV && EV.active()) return { icon: cur.pt, title: cur.title, sub: `триває · ${S.ev.pts} ${cur.pt} зібрано`, btn: "Відкрити", act: "hol-ev" };
    const n = next(); if (!n) return null;
    const w = winOf(n, now() + 1); const st = w.start > now() ? w.start : n.window(new Date(now()).getFullYear() + 1).start;
    return { icon: "🗓️", title: "Свята року", sub: `наступне — ${n.title}, ${fmt(st)}`, btn: "Календар", act: "hol-cal" };
  }
  return { pick, win, next, finished, yard, calendar, card, list: HOL_ALL, easter: orthodoxEaster };
})();
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => HOL.card()]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { "hol-cal": () => HOL.calendar(), "hol-ev": () => EV.panel() });
