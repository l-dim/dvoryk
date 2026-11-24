"use strict";
/* ============================================================
   БІЛЬШЕ ГРИ
   1. Довші ланцюжки: до кожного з 7 основних — ще 3 рівні (вищі замовлення на пізніх рівнях).
   2. Нові генератори: Лісова стежка (10 рів.), Пташник (14 рів.), Гончарня (18 рів.).
   3. Нескінченна історія: після 28 сюжетних розділів село розбудовується далі —
      нові розділи складаються самі, без кінця. Ціна завдань поволі росте.
   ============================================================ */
const MORE_LEVELS = {
  veg:    [["🍆", tt`Баклажан`], ["🧄", tt`Коса часнику`], ["🥗", tt`Святковий салат`]],
  bake:   [["🥖", tt`Святковий батон`], ["🥯", tt`В'язка бубликів`], ["🥮", tt`Пасочка`]],
  fruit:  [["🍇", tt`Виноград`], ["🍈", tt`Диня`], ["🍾", tt`Яблучний сидр`]],
  flower: [["🪻", tt`Лаванда`], ["🪷", tt`Латаття`], ["🏵️", tt`Квітковий вінок`]],
  tea:    [["🧉", tt`Трав'яний збір`], ["🍡", tt`Медові пампушки`], ["🥂", tt`Святкове частування`]],
  sweet:  [["🍧", tt`Ягідний шербет`], ["🍢", tt`Цукрові півники`], ["🍿", tt`Карамельна кукурудза`]],
  dairy:  [["🥓", tt`Сало з часником`], ["🍖", tt`Домашня шинка`], ["🍗", tt`Печена курочка`]]
};
Object.entries(MORE_LEVELS).forEach(([c, add]) => { if (CHAINS[c]) CHAINS[c].items.push(...add); });

const NEW_GENS = [
  { id: "forest", lvl: 10, gen: ["🌲", tt`Лісова стежка`], name: tt`Ліс`, who: "stepan",
    items: [["🌰", tt`Жолудь`], ["🍄", tt`Гриби`], ["🪵", tt`Хмиз`], ["🦔", tt`Їжачок`], ["🦌", tt`Різьблений олень`], ["🦉", tt`Сова-оберіг`]],
    line: tt`{name}, я тобі стежку до лісу розчистив 🌲 Там і гриби, і жолуді, і всяка лісова краса — сусіди вже питають!` },
  { id: "poultry", lvl: 14, gen: ["🪹", tt`Пташник`], name: tt`Пташник`, who: "olya",
    items: [["🪶", tt`Пір'їнка`], ["🐣", tt`Курчатко`], ["🐥", tt`Пташеня`], ["🦆", tt`Качечка`], ["🦢", tt`Лебідь`], ["🦚", tt`Павич`]],
    line: tt`{name}, у мене стільки пташок — бери й собі! 🪹 Курчата, качечки… а хто знає, може, й павич колись виведеться 😄` },
  { id: "pottery", lvl: 18, gen: ["🛖", tt`Гончарня`], name: tt`Гончарня`, who: "andriy",
    items: [["🟫", tt`Глина`], ["🧱", tt`Цеглинка`], ["🍶", tt`Барильце`], ["🏺", tt`Розписний глечик`], ["🪔", tt`Каганець`], ["⛲", tt`Глиняний фонтанчик`]],
    line: tt`{name}, мій дід був гончарем! 🛖 Я полагодив його круг — ліпи глечики, барильця… Сусіди за таке платять щедро.` }
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
const EL_TITLES = [tt`Новий город за хатою`, tt`Ярмарок на площі`, tt`День села`, tt`Обжинки`, tt`Медовий Спас`, tt`Яблучний Спас`, tt`Купальська ніч`,
  tt`Зелені свята`, tt`Толока біля ставу`, tt`Сільська бібліотека`, tt`Нова гойдалка`, tt`Дитячий садок`, tt`Вечорниці в клубі`, tt`Квітучий двір`,
  tt`Гостини в сусідів`, tt`Осінній ярмарок`, tt`Літній фестиваль`, tt`Покрова`, tt`Свято меду`, tt`Новий колодязь`, tt`Майстер-клас бабусі Галі`,
  tt`Весняна толока`, tt`Сільський оркестр`, tt`Свято сонцевороту`];
const EL_CLEAN = [tt`Прибрати сміття`, tt`Скосити бур'ян`, tt`Винести старі ящики`, tt`Прибрати каміння`, tt`Згребти листя`, tt`Вирвати кропиву`];
const EL_BUILD = [tt`Пофарбувати паркан`, tt`Посадити квіти`, tt`Поставити лавку`, tt`Повісити гірлянду`, tt`Накрити столи`, tt`Запросити музик`,
  tt`Спекти пироги`, tt`Прикрасити вхід`, tt`Полити клумби`, tt`Розвісити ліхтарики`, tt`Поставити намет`, tt`Принести рушники`, tt`Розкласти вогнище`,
  tt`Повісити прапорці`, tt`Зробити квіткову арку`, tt`Розставити гарбузи`, tt`Наварити узвару`, tt`Поставити гойдалку`];
const EL_LINES = [tt`Ото краса! Сусіди будуть у захваті 💛`, tt`Ще трохи — і все буде готово ✨`, tt`{name}, ти справжня майстриня села!`,
  tt`Гуртом і батька легше бити, а вже свято готувати — й поготів 😄`, tt`Ох, як гарно стало! Аж серце радіє 🥹`, tt`Бачу, руки в тебе золоті 👐`,
  tt`Оце по-нашому, по-господарськи! 💪`, tt`Скоро все село збереться — тільки встигай пригощати!`];
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
      title, act: tt`Розбудова села`, generated: true, loc: src.loc, river: src.river, ice: src.ice, winter: src.winter,
      sky: src.sky, ground: src.ground, base, clutter, tasks,
      intro: [[host, tt`{name}, у селі нова справа — «${title}»! Без тебе не впораємось 💛`], ["halya", tt`Замовлення сусідів — це зірочки, а зірочки — це наше свято. До роботи!`]],
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
    playDialog([[g.who, g.line]], () => modal({ title: tt`Новий генератор! 🎉`,
      html: tt`<div class="big-emoji">${g.gen[0]}</div><p><b>${g.gen[1]}</b> — уже на дошці.</p><p class="rewards">${g.items.map(x => x[0]).join(" → ")}</p><p class="hint-s">Тепер сусіди замовлятимуть і ${g.id === "forest" ? tt`лісові дари` : g.name.toLowerCase()}.</p>`,
      buttons: [{ label: tt`Чудово! 💛` }] }));
  }
  return { ensure, tick, from: ENDLESS_FROM };
})();
