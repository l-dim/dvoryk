"use strict";
/* ============================================================
   КУЛІНАРНИЙ КОНКУРС 🏆 — кухня з інгредієнтами
   • 60 інгредієнтів (зерно, молочне, ягоди, горіхи, солодке, овочі). Їх дають завдання:
     замовлення сусідів, завдання дня й тижня, вилазки, подарунки.
   • На кухні сама обираєш 3–8 інгредієнтів у каструлю й готуєш страву.
     Бали = цінність інгредієнтів × бонус теми × бонус за кількість × бонус рецепта.
     Якщо в каструлі є все для відомого рецепта — страва «за рецептом» (×1.6) і рецепт записується в книгу.
   • Кожні 3 дні — нова тема; суперниці з сусідніх сіл набирають бали самі.
   Стан: S.ing = { id: кількість }, S.ct = { id, pts, sent }, S.ctBook = { рецепт: разів }, S.ctWins = { 1:…, 2:…, 3:… }
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
/* 60 інгредієнтів: [id, назва, емодзі-замінник, група, рідкість 1–3] */
const ING_CATS = { grain: "Борошно й крупи", dairy: "Молочне", berry: "Ягоди й плоди", nuts: "Горіхи й насіння", sweet: "Солодке й прянощі", veg: "Овочі й зелень" };
const INGS = [
  ["flour", "Пшеничне борошно", "🌾", "grain", 1], ["rye", "Житнє борошно", "🌾", "grain", 2], ["buckwheat", "Гречка", "🥣", "grain", 1],
  ["semolina", "Манка", "🥣", "grain", 1], ["oats", "Вівсянка", "🥣", "grain", 1], ["millet", "Пшоно", "🌾", "grain", 2],
  ["yeast", "Дріжджі", "🍞", "grain", 2], ["cornflour", "Кукурудзяне борошно", "🌽", "grain", 2],
  ["milk", "Молоко", "🥛", "dairy", 1], ["cream", "Вершки", "🥛", "dairy", 2], ["sourcream", "Сметана", "🥣", "dairy", 1],
  ["butter", "Вершкове масло", "🧈", "dairy", 2], ["tvorog", "Домашній сир", "🧀", "dairy", 1], ["cheese", "Твердий сир", "🧀", "dairy", 2],
  ["egg", "Яйця", "🥚", "dairy", 1], ["ryazhanka", "Ряжанка", "🥛", "dairy", 3], ["kefir", "Кефір", "🥛", "dairy", 1],
  ["cherry", "Вишні", "🍒", "berry", 1], ["apple", "Яблука", "🍏", "berry", 1], ["pear", "Груші", "🍐", "berry", 1],
  ["plum", "Сливи", "🫐", "berry", 2], ["apricot", "Абрикоси", "🍑", "berry", 2], ["strawberry", "Полуниця", "🍓", "berry", 2],
  ["raspberry", "Малина", "🍓", "berry", 2], ["blueberry", "Чорниці", "🫐", "berry", 2], ["currant", "Смородина", "🫐", "berry", 2],
  ["kalyna", "Калина", "🍒", "berry", 3], ["lemon", "Лимон", "🍋", "berry", 2], ["pumpkin", "Гарбуз", "🎃", "berry", 1],
  ["gooseberry", "Аґрус", "🍈", "berry", 3],
  ["walnut", "Волоські горіхи", "🌰", "nuts", 2], ["hazelnut", "Фундук", "🌰", "nuts", 2], ["poppy", "Мак", "🌸", "nuts", 2],
  ["seeds", "Насіння соняшнику", "🌻", "nuts", 1], ["almond", "Мигдаль", "🌰", "nuts", 3], ["peanut", "Арахіс", "🥜", "nuts", 1],
  ["honey", "Мед", "🍯", "sweet", 1], ["sugar", "Цукор", "🧂", "sweet", 1], ["choc", "Шоколад", "🍫", "sweet", 2],
  ["cocoa", "Какао", "☕", "sweet", 2], ["vanilla", "Ваніль", "🌼", "sweet", 3], ["cinnamon", "Кориця", "🪵", "sweet", 3],
  ["raisins", "Родзинки", "🍇", "sweet", 2], ["jam", "Варення", "🫙", "sweet", 2], ["condensed", "Згущене молоко", "🥫", "sweet", 3],
  ["caramel", "Карамель", "🍬", "sweet", 2], ["ginger", "Імбир", "🫚", "sweet", 3], ["mint", "М'ята", "🌿", "sweet", 1],
  ["potato", "Картопля", "🥔", "veg", 1], ["cabbage", "Капуста", "🥬", "veg", 1], ["carrot", "Морква", "🥕", "veg", 1],
  ["beet", "Буряк", "🍠", "veg", 1], ["onion", "Цибуля", "🧅", "veg", 1], ["mushroom", "Гриби", "🍄", "veg", 2],
  ["dill", "Кріп", "🌿", "veg", 1], ["garlic", "Часник", "🧄", "veg", 1], ["beans", "Квасоля", "🫘", "veg", 1],
  ["peas", "Зелений горошок", "🫛", "veg", 2], ["salo", "Сало", "🥓", "veg", 3], ["pepper", "Солодкий перець", "🫑", "veg", 2]
].map(([id, name, e, cat, r]) => ({ id, name, e, cat, r, v: [0, 8, 14, 22][r] }));
const ING = Object.fromEntries(INGS.map(x => [x.id, x]));
const ING_ART = INGS.map(x => x.id);      // усі 60 мальовані: items/ing-<id>.webp
/* звідки беруться: ланцюжок замовлення → групи інгредієнтів */
const ING_FROM = { veg: ["veg"], bake: ["grain"], fruit: ["berry"], flower: ["sweet", "berry"], tea: ["sweet", "dairy"], sweet: ["sweet", "nuts"], dairy: ["dairy"] };
const CT_THEMES = [
  { id: "bake",  name: "Найкраща випічка", icon: "🥐", cats: ["grain", "dairy", "nuts"] },
  { id: "sweet", name: "Солодкий стіл",    icon: "🍰", cats: ["sweet", "berry", "nuts"] },
  { id: "oven",  name: "Страви з печі",    icon: "🍲", cats: ["veg", "grain", "dairy"] }
];
const CT_RECIPES = [
  { id: "palianytsia", theme: "bake",  e: "🍞", name: "Паляниця",               need: ["flour", "yeast", "milk"] },
  { id: "pyrizhky",    theme: "bake",  e: "🥟", name: "Пиріжки з вишнями",      need: ["flour", "yeast", "egg", "cherry"] },
  { id: "makivnyk",    theme: "bake",  e: "🥐", name: "Маковий рулет",          need: ["flour", "yeast", "egg", "poppy", "sugar"] },
  { id: "medovyk",     theme: "bake",  e: "🎂", name: "Медовик",                need: ["flour", "honey", "egg", "butter", "sourcream"] },
  { id: "ryebread",    theme: "bake",  e: "🍞", name: "Житній хліб",            need: ["rye", "yeast", "kefir", "seeds"] },
  { id: "syrnyk",      theme: "sweet", e: "🍰", name: "Львівський сирник",      need: ["tvorog", "egg", "semolina", "raisins", "sugar"] },
  { id: "sharlotka",   theme: "sweet", e: "🥧", name: "Яблучна шарлотка",       need: ["apple", "egg", "flour", "sugar", "cinnamon"] },
  { id: "kyivcake",    theme: "sweet", e: "🎂", name: "Київський торт",         need: ["hazelnut", "egg", "sugar", "choc", "butter", "cocoa"] },
  { id: "plombir",     theme: "sweet", e: "🍨", name: "Пломбір",                need: ["cream", "sugar", "vanilla"] },
  { id: "nutcookie",   theme: "sweet", e: "🍪", name: "Горішки зі згущенкою",   need: ["flour", "butter", "condensed", "walnut"] },
  { id: "varenyky",    theme: "oven",  e: "🥟", name: "Вареники з картоплею",   need: ["flour", "potato", "onion", "egg"] },
  { id: "holubtsi",    theme: "oven",  e: "🥬", name: "Голубці",                need: ["cabbage", "buckwheat", "carrot", "onion"] },
  { id: "borshch",     theme: "oven",  e: "🍲", name: "Борщ",                   need: ["beet", "cabbage", "potato", "carrot", "onion", "sourcream", "dill"] },
  { id: "deruny",      theme: "oven",  e: "🥞", name: "Деруни",                 need: ["potato", "egg", "onion", "sourcream"] },
  { id: "kasha",       theme: "oven",  e: "🎃", name: "Гарбузова каша",         need: ["pumpkin", "millet", "milk", "honey"] },
  { id: "yushka",      theme: "oven",  e: "🍄", name: "Грибна юшка",            need: ["mushroom", "potato", "onion", "dill"] }
];
const CT_REWARDS = [
  { chest: 2, coins: 300, stars: 5 },   // 1
  { chest: 1, coins: 200, stars: 3 },   // 2
  { chest: 1, coins: 120, stars: 2 },   // 3
  { chest: 0, coins: 80 }, { chest: 0, coins: 80 }, { chest: 0, coins: 80 },
  { coins: 40 }, { coins: 40 }, { coins: 40 }, { coins: 40 }
];
const CT_MEDAL = ["🥇", "🥈", "🥉"];
const POT_MIN = 3, POT_MAX = 8;
/* іконка інгредієнта: мальована, якщо вже є, інакше емодзі */
function ingIcon(id) { const x = ING[id]; return ING_ART.includes(id) ? `<img class="e3d pnt" src="items/ing-${id}.webp" alt="">` : x.e; }

window.CONTEST = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const on = () => window.UNL && UNL.on("contest");
  const roundId = t => Math.floor(((t || now()) - CT_EPOCH) / CT_ROUND);
  const roundStart = id => CT_EPOCH + id * CT_ROUND;
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  function rng(seed) { let s = (seed * 2654435761) >>> 0; return () => { s = (s ^ (s << 13)) >>> 0; s = (s ^ (s >>> 17)) >>> 0; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; }; }
  const theme = id => CT_THEMES[((id % 3) + 3) % 3];
  const have = id => (S.ing && S.ing[id]) || 0;

  /* ---------- інгредієнти ---------- */
  function rollIng(cats, minR = 1) {
    const r = Math.random(), rare = Math.max(minR, r < 0.1 ? 3 : r < 0.4 ? 2 : 1);
    let pool = INGS.filter(x => (!cats || cats.includes(x.cat)) && x.r === rare);
    if (!pool.length) pool = INGS.filter(x => x.r === rare);
    return pick(pool).id;
  }
  /* дати n інгредієнтів; why — звідки; показує короткий тост */
  function give(n, cats, minR, why) {
    if (!on() || !n) return [];
    S.ing = S.ing || {};
    const got = [];
    for (let k = 0; k < n; k++) { const id = rollIng(cats, k === n - 1 ? minR : 1); S.ing[id] = (S.ing[id] || 0) + 1; got.push(id); }
    save();
    setTimeout(() => toast(`🧺 ${why ? why + ": " : "Для конкурсу: "}${got.map(id => ING[id].e + " " + ING[id].name).join(", ")}`), 1400);
    if (window.HUB) HUB.renderDot();
    return got;
  }
  function onDeliver(o) {
    if (!on()) return;
    const cats = [...new Set(o.items.flatMap(it => ING_FROM[it.c] || []))];
    const special = o.paw || o.urgent || o.dish || o.ev;
    give(special ? 2 : 1, cats.length ? cats : null, special ? 2 : 1);
  }

  /* ---------- бали ---------- */
  function matchRecipe(pot, th) {
    const cnt = {}; pot.forEach(id => cnt[id] = (cnt[id] || 0) + 1);
    const ok = CT_RECIPES.filter(r => r.need.every(id => cnt[id]));
    // рецепт поточної теми — у пріоритеті, далі — найбільший
    ok.sort((a, b) => (b.theme === th.id) - (a.theme === th.id) || b.need.length - a.need.length);
    return ok[0] || null;
  }
  function score(pot, th) {
    if (pot.length < POT_MIN) return { pts: 0, rec: null };
    const base = pot.reduce((s, id) => s + ING[id].v * (th.cats.includes(ING[id].cat) ? 1.3 : 1), 0);
    const rec = matchRecipe(pot, th);
    const recMul = rec ? (rec.theme === th.id ? 1.6 : 1.3) : 1;
    return { pts: Math.round(base * (1 + 0.1 * (pot.length - POT_MIN)) * recMul), rec };
  }

  /* суперниці: ціль і «характер» */
  function rivals(id, frac) {
    const r = rng(id + 77), base = 400 + 60 * S.level;
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

  /* ---------- підсумок ---------- */
  let pend = null;
  function close(old) {
    if (!old.pts) return;
    const t = theme(old.id), list = table(old.id, old.pts, 1), place = list.findIndex(x => x.me) + 1;
    const r = CT_REWARDS[place - 1] || CT_REWARDS[CT_REWARDS.length - 1];
    if (r.chest !== undefined) placeItem({ c: "chest", l: r.chest });
    if (r.coins) S.coins += r.coins; if (r.stars) S.stars += r.stars;
    if (place <= 3) { S.ctWins = S.ctWins || {}; S.ctWins[place] = (S.ctWins[place] || 0) + 1; }
    save(); renderAll();
    if (place <= 3) { confetti(); sfx.level(); }
    pend = () => modal({ title: place === 1 ? "Перше місце! 🥇" : "Конкурс завершено 🏆",
      html: `<div class="big-emoji">${CT_MEDAL[place - 1] || t.icon}</div><p>«${t.name}»: ти на <b>${place}-му місці</b> з ${list.length}${place === 1 ? " — найкраща кулінарка округи!" : "!"}</p>` +
        `<p class="rewards">${r.chest !== undefined ? CHAINS.chest.items[r.chest][0] + " &nbsp; " : ""}+${r.coins} 🪙${r.stars ? " &nbsp; +" + r.stars + " ⭐" : ""}</p><p class="hint-s">Новий конкурс уже почався — тема «${theme(roundId()).name}» ${theme(roundId()).icon}</p>`,
      buttons: [{ label: "До нового конкурсу ›", onClick: () => show() }, { label: "Добре", cls: "ghost" }] });
  }
  function sync() {
    if (!on()) return;
    const id = roundId();
    if (S.ct && S.ct.id !== id) close(S.ct);
    if (!S.ct || S.ct.id !== id) { S.ct = { id, pts: 0, sent: 0 }; save(); }
  }

  /* ---------- кухня ---------- */
  let pot = [], tab = "kitchen";
  function addToPot(id) {
    if (pot.length >= POT_MAX) { sfx.nope(); toast(`У каструлю влазить до ${POT_MAX} інгредієнтів`); return; }
    if (pot.filter(x => x === id).length >= have(id)) { sfx.nope(); toast(`${ING[id].e} ${ING[id].name} більше немає — збирай у завданнях`); return; }
    pot.push(id); sfx.pop(); show();
  }
  function cook() {
    sync();
    const th = theme(S.ct.id), s = score(pot, th);
    if (pot.length < POT_MIN) { sfx.nope(); toast(`Поклади хоча б ${POT_MIN} інгредієнти`); return; }
    pot.forEach(id => { S.ing[id]--; if (!S.ing[id]) delete S.ing[id]; });
    S.ct.pts += s.pts; S.ct.sent = (S.ct.sent || 0) + 1;
    let firstTime = false;
    if (s.rec) { S.ctBook = S.ctBook || {}; firstTime = !S.ctBook[s.rec.id]; S.ctBook[s.rec.id] = (S.ctBook[s.rec.id] || 0) + 1; }
    pot = []; save();
    sfx.deliver(); if (s.rec) { sfx.level(); confetti(); }
    toast(s.rec ? `${s.rec.e} ${s.rec.name}${firstTime ? " — новий рецепт у книзі!" : "!"} Журі: +${s.pts}` : `🍲 Авторська страва! Журі: +${s.pts}`);
    if (window.MEDAL) MEDAL.count("dishCt");
    show();
  }
  function left() {
    const t = Math.ceil((roundStart(roundId() + 1) - now()) / 6e4), h = Math.floor(t / 60);
    return h >= 24 ? Math.floor(h / 24) + " д " + (h % 24) + " год" : h + " год " + (t % 60) + " хв";
  }
  function kitchenHtml(th) {
    const s = score(pot, th);
    const slots = Array.from({ length: POT_MAX }, (_, k) => pot[k]
      ? `<button class="kt-slot full" data-k="${k}">${ingIcon(pot[k])}</button>` : `<span class="kt-slot${k < POT_MIN ? " need" : ""}"></span>`).join("");
    const owned = INGS.filter(x => have(x.id));
    const pantry = owned.length ? Object.keys(ING_CATS).map(cat => {
      const list = owned.filter(x => x.cat === cat); if (!list.length) return "";
      return `<div class="kt-cat${th.cats.includes(cat) ? " hot" : ""}"><small>${ING_CATS[cat]}${th.cats.includes(cat) ? " · бонус теми ×1.3" : ""}</small><div class="kt-row">` +
        list.map(x => { const left = have(x.id) - pot.filter(p => p === x.id).length;
          return `<button class="kt-ing r${x.r}${left ? "" : " used"}" data-id="${x.id}"><span>${ingIcon(x.id)}</span><i>${left}</i><small>${x.name}</small></button>`; }).join("") + `</div></div>`;
    }).join("") : `<p class="hint-s">Комора порожня. Інгредієнти дають за замовлення сусідів, завдання дня й тижня та вилазки 🧺</p>`;
    return `<div class="kt-pot"><div class="kt-slots">${slots}</div>` +
      `<div class="kt-res">${pot.length < POT_MIN ? `Поклади ${POT_MIN}–${POT_MAX} інгредієнтів` : s.rec ? `${s.rec.e} <b>${s.rec.name}</b> · +${s.pts}` : `🍲 Авторська страва · +${s.pts}`}</div>` +
      `<button class="btn kt-cook"${pot.length < POT_MIN ? " disabled" : ""}>Приготувати 🔥</button></div>` +
      `<div class="kt-pantry">${pantry}</div>`;
  }
  function recipesHtml(th) {
    const book = S.ctBook || {};
    return `<p class="hint-s">Поклади в каструлю все, що потрібно для рецепта (можна й більше) — страва піде «за рецептом»: ×1.6 у темі конкурсу, ×1.3 поза темою.</p>` +
      `<div class="kt-recipes">` + CT_THEMES.map(t => `<div class="kt-rb${t.id === th.id ? " hot" : ""}"><b>${t.icon} ${t.name}${t.id === th.id ? " — зараз" : ""}</b>` +
        CT_RECIPES.filter(r => r.theme === t.id).map(r => `<div class="kt-rec"><span class="kt-re">${r.e}</span><span class="kt-rn">${r.name}${book[r.id] ? ` <small>✓ ${book[r.id]}</small>` : ""}</span>` +
          `<span class="kt-need">${r.need.map(id => `<i class="${have(id) ? "ok" : ""}" title="${ING[id].name}">${ingIcon(id)}</i>`).join("")}</span></div>`).join("") + `</div>`).join("") + `</div>`;
  }
  function tableHtml(p) {
    const list = table(p.id, p.pts, frac(p.id)), w = S.ctWins || {};
    return `<div class="ct-table">${list.map((x, k) => `<div class="ct-row${x.me ? " me" : ""}"><span class="ct-pl">${CT_MEDAL[k] || k + 1}</span>` +
      `<span class="ct-ava">${x.me ? (window.HERO ? HERO.faceHtml(null, "mini") : "🏡") : (typeof rivalFace === "function" ? rivalFace(x.name, x.e) : x.e)}</span><span class="ct-name"><b>${x.me ? "Ти — " + (S.name || "господиня") : x.name}</b><small>${x.from}</small></span><span class="ct-pts">${x.pts}</span></div>`).join("")}</div>` +
      `<p class="hint-s">🥇 💝 +300 🪙 +5 ⭐ · 🥈 📦 +200 🪙 · 🥉 📦 +120 🪙 · до 6-го місця 🎁${(w[1] || w[2] || w[3]) ? `<br>Твої медалі: 🥇${w[1] || 0} 🥈${w[2] || 0} 🥉${w[3] || 0}` : ""}</p>`;
  }
  function show(t) {
    sync();
    if (t) tab = t;
    const p = S.ct, th = theme(p.id);
    const place = table(p.id, p.pts, frac(p.id)).findIndex(x => x.me) + 1;
    const tabs = [["kitchen", "Кухня"], ["recipes", "Рецепти"], ["table", "Таблиця"]].map(([k, n]) => `<button class="dq-tab${tab === k ? " on" : ""}" data-t="${k}">${n}</button>`).join("");
    modal({ title: "Кулінарний конкурс 🏆",
      html: `<div class="ct-head"><span class="ct-big">${th.icon}</span><span><b>${th.name}</b><small>до кінця: ${left()} · ${p.pts ? `ти ${place}-а · ${p.pts} балів` : "ти ще нічого не готувала"}</small></span></div>` +
        `<div class="dq-tabs">${tabs}</div>` + (tab === "kitchen" ? kitchenHtml(th) : tab === "recipes" ? recipesHtml(th) : tableHtml(p)),
      buttons: [{ label: "Закрити", cls: "ghost", onClick: () => { pot = []; } }] });
    document.querySelectorAll(".modal .dq-tab").forEach(b => b.onclick = () => { sfx.pop(); show(b.dataset.t); });
    document.querySelectorAll(".kt-ing").forEach(b => b.onclick = () => addToPot(b.dataset.id));
    document.querySelectorAll(".kt-slot.full").forEach(b => b.onclick = () => { pot.splice(+b.dataset.k, 1); sfx.pop(); show(); });
    const c = document.querySelector(".kt-cook"); if (c) c.onclick = cook;
  }

  function tick() {
    if (!on() || !S.started) return;
    sync();
    if (pend && !busyUI()) { const f = pend; pend = null; f(); }
  }
  const total = () => Object.values(S.ing || {}).reduce((a, b) => a + b, 0);
  function card() {
    if (!on()) return null;
    sync();
    const p = S.ct, t = theme(p.id), place = table(p.id, p.pts, frac(p.id)).findIndex(x => x.me) + 1;
    return { icon: t.icon, title: "Кулінарний конкурс", sub: `«${t.name}» · ${p.pts ? place + "-е місце" : "ще не брала участі"} · 🧺 ${total()} інгр. · ${left()}`,
      ready: total() >= POT_MIN, btn: "На кухню", act: "contest" };
  }
  return { show, tick, card, sync, give, onDeliver, total };
})();
