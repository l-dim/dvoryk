"use strict";
/* ============================================================
   БІЛЬШЕ ГРИ
   1. Довші ланцюжки: до кожного з 7 основних — ще 3 рівні (вищі замовлення на пізніх рівнях).
   2. Нові генератори: Лісова стежка (10 рів.), Пташник (14 рів.), Гончарня (18 рів.).
   3. Нескінченна історія: після 28 сюжетних розділів село розбудовується далі —
      нові розділи складаються самі, без кінця. Ціна завдань поволі росте.
   ============================================================ */
const MORE_LEVELS = {
  veg:    [["🍆", "Баклажан"], ["🧄", "Коса часнику"], ["🥗", "Святковий салат"]],
  bake:   [["🥖", "Святковий батон"], ["🥯", "В'язка бубликів"], ["🥮", "Пасочка"]],
  fruit:  [["🍇", "Виноград"], ["🍈", "Диня"], ["🍾", "Яблучний сидр"]],
  flower: [["🪻", "Лаванда"], ["🪷", "Латаття"], ["🏵️", "Квітковий вінок"]],
  tea:    [["🧉", "Трав'яний збір"], ["🍡", "Медові пампушки"], ["🥂", "Святкове частування"]],
  sweet:  [["🍧", "Ягідний шербет"], ["🍢", "Цукрові півники"], ["🍿", "Карамельна кукурудза"]],
  dairy:  [["🥓", "Сало з часником"], ["🍖", "Домашня шинка"], ["🍗", "Печена курочка"]]
};
Object.entries(MORE_LEVELS).forEach(([c, add]) => { if (CHAINS[c]) CHAINS[c].items.push(...add); });

const NEW_GENS = [
  { id: "forest", lvl: 10, gen: ["🌲", "Лісова стежка"], name: "Ліс", who: "stepan",
    items: [["🌰", "Жолудь"], ["🍄", "Гриби"], ["🪵", "Хмиз"], ["🦔", "Їжачок"], ["🦌", "Різьблений олень"], ["🦉", "Сова-оберіг"]],
    line: "{name}, я тобі стежку до лісу розчистив 🌲 Там і гриби, і жолуді, і всяка лісова краса — сусіди вже питають!" },
  { id: "poultry", lvl: 14, gen: ["🪹", "Пташник"], name: "Пташник", who: "olya",
    items: [["🪶", "Пір'їнка"], ["🐣", "Курчатко"], ["🐥", "Пташеня"], ["🦆", "Качечка"], ["🦢", "Лебідь"], ["🦚", "Павич"]],
    line: "{name}, у мене стільки пташок — бери й собі! 🪹 Курчата, качечки… а хто знає, може, й павич колись виведеться 😄" },
  { id: "pottery", lvl: 18, gen: ["🛖", "Гончарня"], name: "Гончарня", who: "andriy",
    items: [["🟫", "Глина"], ["🧱", "Цеглинка"], ["🍶", "Барильце"], ["🏺", "Розписний глечик"], ["🪔", "Каганець"], ["⛲", "Глиняний фонтанчик"]],
    line: "{name}, мій дід був гончарем! 🛖 Я полагодив його круг — ліпи глечики, барильця… Сусіди за таке платять щедро." }
];
NEW_GENS.forEach(g => {
  CHAINS[g.id] = { name: g.name, items: g.items };
  GENS[g.id] = { icon: g.gen[0], name: g.gen[1], chain: g.id };
  if (!PRODUCT_CHAINS.includes(g.id)) PRODUCT_CHAINS.push(g.id);
});
/* мальовані нові предмети: emoji → картинка (PAINTED будується раніше, тож додаємо самі) */
(() => {
  const key = e => [...e].filter(c => c !== "\uFE0F").map(c => c.codePointAt(0).toString(16)).join("-");
  const P = window.PAINTED = window.PAINTED || {};
  Object.entries(MORE_LEVELS).forEach(([c, add]) => add.forEach(([e], k) => { P[key(e)] = `items/${c}-${CHAINS[c].items.length - add.length + k}.webp`; }));
  // 🟫 і ⛲ уже мальовані для дворика (грядки, фонтан) — їх не перемальовуємо
  NEW_GENS.forEach(g => { g.items.forEach(([e], l) => { if (!P[key(e)]) P[key(e)] = `items/${g.id}-${l}.webp`; }); P[key(g.gen[0])] = `items/gen-${g.id}.webp`; });
})();
if (typeof ING_FROM !== "undefined") Object.assign(ING_FROM, { forest: ["veg", "nuts"], poultry: ["dairy"], pottery: ["sweet", "grain"] });

/* ---------- нескінченна історія ---------- */
const ENDLESS_FROM = STORY.length;               // перший згенерований розділ
const EL_TITLES = ["Новий город за хатою", "Ярмарок на площі", "День села", "Обжинки", "Медовий Спас", "Яблучний Спас", "Купальська ніч",
  "Зелені свята", "Толока біля ставу", "Сільська бібліотека", "Нова гойдалка", "Дитячий садок", "Вечорниці в клубі", "Квітучий двір",
  "Гостини в сусідів", "Осінній ярмарок", "Літній фестиваль", "Покрова", "Свято меду", "Новий колодязь", "Майстер-клас бабусі Галі",
  "Весняна толока", "Сільський оркестр", "Свято сонцевороту"];
const EL_CLEAN = ["Прибрати сміття", "Скосити бур'ян", "Винести старі ящики", "Прибрати каміння", "Згребти листя", "Вирвати кропиву"];
const EL_BUILD = ["Пофарбувати паркан", "Посадити квіти", "Поставити лавку", "Повісити гірлянду", "Накрити столи", "Запросити музик",
  "Спекти пироги", "Прикрасити вхід", "Полити клумби", "Розвісити ліхтарики", "Поставити намет", "Принести рушники", "Розкласти вогнище",
  "Повісити прапорці", "Зробити квіткову арку", "Розставити гарбузи", "Наварити узвару", "Поставити гойдалку"];
const EL_LINES = ["Ото краса! Сусіди будуть у захваті 💛", "Ще трохи — і все буде готово ✨", "{name}, ти справжня майстриня села!",
  "Гуртом і батька легше бити, а вже свято готувати — й поготів 😄", "Ох, як гарно стало! Аж серце радіє 🥹", "Бачу, руки в тебе золоті 👐",
  "Оце по-нашому, по-господарськи! 💪", "Скоро все село збереться — тільки встигай пригощати!"];
const EL_HOSTS = ["halya", "stepan", "olya", "marichka", "andriy", "liza", "ivan", "taras", "iryna"];

window.ENDLESS = (() => {
  function rng(seed) { let s = (seed * 2654435761 + 12345) >>> 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  let srcIdx = null, addPool = null;
  function prep() {
    if (srcIdx) return;
    srcIdx = []; addPool = [];
    for (let i = 0; i < ENDLESS_FROM; i++) {
      const ch = STORY[i];
      if (!ch.indoor) srcIdx.push(i);
      ch.tasks.forEach(t => (t.add || []).forEach(a => { if (!a.pic && !a.who && a.e) addPool.push(a.e); }));
    }
  }
  function make(n) {               // n — порядковий номер згенерованого розділу (0, 1, 2…)
    prep();
    const r = rng(n + 1), pickR = arr => arr[Math.floor(r() * arr.length)];
    const src = STORY[srcIdx[Math.floor(r() * srcIdx.length)]];
    const title = EL_TITLES[n % EL_TITLES.length] + (n >= EL_TITLES.length ? " " + ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][Math.min(8, Math.floor(n / EL_TITLES.length) - 1)] : "");
    const clutter = (src.clutter || []).map((d, k) => Object.assign({}, d, { id: "c" + k }));
    const ids = clutter.map(d => d.id);
    const base = (src.base || []).filter(d => !d.pic && !d.who).map(d => Object.assign({}, d));
    const host = pickR(EL_HOSTS), base0 = 10 + Math.floor(n / 2);
    const tasks = [];
    const deck = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const cleanT = deck(EL_CLEAN), buildT = deck(EL_BUILD);
    const nClean = Math.min(3, Math.ceil(ids.length / 2));
    for (let k = 0; k < 7; k++) {
      const clean = k < nClean;
      const remove = clean ? ids.filter((_, j) => j % nClean === k) : [];
      const add = clean ? [] : [0, 1].slice(0, 1 + Math.floor(r() * 2)).map(() => ({ e: pickR(addPool), x: 15 + Math.round(r() * 70), y: 48 + Math.round(r() * 40), s: 5 + Math.round(r() * 3) }));
      tasks.push({ title: clean ? cleanT[k % cleanT.length] : buildT[k % buildT.length], cost: Math.round((base0 + (k >> 1)) * (window.PACE ? PACE.story : 1)), remove, add,
        lines: [[pickR(EL_HOSTS), pickR(EL_LINES)]] });
    }
    return {
      title, act: "Розбудова села", generated: true, loc: src.loc, river: src.river, ice: src.ice, winter: src.winter,
      sky: src.sky, ground: src.ground, base, clutter, tasks,
      intro: [[host, `{name}, у селі нова справа — «${title}»! Без тебе не впораємось 💛`], ["halya", "Замовлення сусідів — це зірочки, а зірочки — це наше свято. До роботи!"]],
      reward: { chest: (n + 1) % 5 === 0 ? 2 : 1 }
    };
  }
  /* добудувати розділи до потрібного номера */
  function ensure(upTo) {
    while (STORY.length <= upTo) STORY.push(make(STORY.length - ENDLESS_FROM));
  }

  /* ---------- нові генератори за рівнем ---------- */
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  function tick() {
    if (!S || !S.started || S.sideOn || busyUI()) return;
    const g = NEW_GENS.find(x => S.level >= x.lvl && !S.gens.includes(x.id));
    if (!g) return;
    S.gens.push(g.id);
    placeItem({ g: g.id });
    save(); renderAll(); confetti(); sfx.level();
    playDialog([[g.who, g.line]], () => modal({ title: "Новий генератор! 🎉",
      html: `<div class="big-emoji">${g.gen[0]}</div><p><b>${g.gen[1]}</b> — уже на дошці.</p><p class="rewards">${g.items.map(x => x[0]).join(" → ")}</p><p class="hint-s">Тепер сусіди замовлятимуть і ${g.name.toLowerCase() === "ліс" ? "лісові дари" : g.name.toLowerCase()}.</p>`,
      buttons: [{ label: "Чудово! 💛" }] }));
  }
  return { ensure, tick, from: ENDLESS_FROM };
})();
