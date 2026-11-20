"use strict";
/* ============================================================
   ЗАТИШНИЙ ДВОРИК — рушій гри
   ============================================================ */

// Превʼю-сторінка може мати власний сейв (щоб не чіпати основну гру)
const SAVE_KEY = window.DVORYK_SAVE_KEY || "dvoryk_save_v1";
const $ = id => document.getElementById(id);
const rnd = n => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];
const N = COLS * ROWS;

/* ---------------- Стан ---------------- */
function defaultState() {
  const board = new Array(N).fill(null);
  board[idx(4, 2)] = { g: "veg" };
  board[idx(4, 4)] = { g: "bake" };
  board[idx(3, 1)] = { c: "veg", l: 0 };
  board[idx(3, 3)] = { c: "veg", l: 0 };
  board[idx(5, 3)] = { c: "bake", l: 0 };
  board[idx(5, 5)] = { c: "bake", l: 0 };
  board[idx(6, 3)] = { c: "chest", l: 0 };
  return {
    v: 1, name: "", started: false, board,
    energy: ENERGY_MAX, energyAt: Date.now(),
    coins: 50, stars: 0, xp: 0, level: 1,
    orders: [], orderSeq: 0, ordersDone: 0, merges: 0,
    gens: ["veg", "bake"],
    chapter: 0, task: 0, storyDone: false,
    inbox: [], collection: {},
    sound: true, infinite: false, energyBuys: { day: "", n: 0 },
    lastDaily: "", streak: 0, teaAt: 0, tut: 0,
    created: Date.now()
  };
}
function idx(r, c) { return r * COLS + c; }

let S = null;
function load() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    // превʼю вперше відкривається з копією прогресу з основної гри
    if (!raw && window.DVORYK_COPY_FROM) raw = localStorage.getItem(window.DVORYK_COPY_FROM);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !Array.isArray(data.board)) return null;
    const st = Object.assign(defaultState(), data);
    st.infinite = false; // режим «без обмежень» прибрано — енергія тепер справжня
    return st;
  } catch (e) { return null; }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 250);
}
function saveNow() {
  if (!S) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* немає сховища */ }
}

/* ---------------- Довідка по предметах ---------------- */
function itemIcon(it) {
  if (!it) return "";
  if (it.g) return GENS[it.g].icon;
  return CHAINS[it.c].items[it.l][0];
}
function itemName(it) {
  if (!it) return "";
  if (it.g) return GENS[it.g].name;
  return CHAINS[it.c].items[it.l][1];
}
function isMax(it) { return it && !it.g && it.l >= CHAINS[it.c].items.length - 1; }
function itemValue(c, l) { return Math.round(4 * Math.pow(1.9, l)); }
Object.keys(CHARS).forEach(k => CHARS[k].key = k);
function face(ch, cls = "") {
  if (!PORTRAITS.includes(ch.key)) return ch.icon;
  const src = `portraits/${ch.key}.webp`;
  if (cls !== "mini") return `<img class="face ${cls}" src="${src}" alt="">`;
  const [x, y, w] = PORTRAIT_FACE[ch.key] || [50, 22, 240];
  return `<span class="face mini"><img src="${src}" alt="" style="width:${w}%;transform:translate(-${x}%,-${y}%)"></span>`;
}
function fmtName(t) { return t.replace(/\{name\}/g, S.name || "господинько"); }

/* ---------------- Звук (м'які тони WebAudio) ---------------- */
let actx = null;
function audio() {
  if (!S || !S.sound) return null;
  try {
    if (!actx) {
      if (navigator.audioSession) navigator.audioSession.type = "ambient"; // поважати беззвучний режим iPhone
      actx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  } catch (e) { return null; }
}
function tone(freq, dur = 0.12, type = "sine", vol = 0.12, delay = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  pop: () => tone(660, 0.1, "sine", 0.1),
  merge: l => { const f = 440 * Math.pow(2, Math.min(l, 10) / 7); tone(f, 0.12, "triangle", 0.12); tone(f * 1.5, 0.18, "sine", 0.08, 0.07); },
  coin: () => { tone(988, 0.08, "square", 0.04); tone(1319, 0.16, "square", 0.04, 0.07); },
  deliver: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.1, i * 0.08)),
  level: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, "sine", 0.12, i * 0.1)),
  nope: () => tone(196, 0.15, "sine", 0.08),
  open: () => [392, 523, 659].forEach((f, i) => tone(f, 0.14, "triangle", 0.1, i * 0.06))
};

/* ---------------- Енергія ---------------- */
function regen() {
  const now = Date.now();
  if (S.energy >= ENERGY_MAX) { S.energyAt = now; return; }
  const n = Math.floor((now - S.energyAt) / ENERGY_REGEN_MS);
  if (n > 0) {
    S.energy = Math.min(ENERGY_MAX, S.energy + n);
    S.energyAt += n * ENERGY_REGEN_MS;
    if (S.energy >= ENERGY_MAX) S.energyAt = now;
  }
}
function spendEnergy() {
  regen();
  if (S.energy < 1) { showNoEnergy(); return false; }
  if (S.energy >= ENERGY_MAX) S.energyAt = Date.now();
  S.energy -= 1;
  return true;
}
function addEnergy(n) { regen(); S.energy += n; renderTop(); save(); }
function addCoins(n) { S.coins += n; renderTop(); save(); }

/* ---------------- Дошка: пошук місця ---------------- */
function emptyNear(from) {
  let best = -1, bd = 1e9;
  const fr = Math.floor(from / COLS), fc = from % COLS;
  for (let i = 0; i < N; i++) {
    if (S.board[i]) continue;
    const r = Math.floor(i / COLS), c = i % COLS;
    const d = (r - fr) ** 2 + (c - fc) ** 2 + Math.random() * 0.1;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function placeItem(item, near = Math.floor(N / 2)) {
  const i = emptyNear(near);
  if (i < 0) { S.inbox.push(item); renderInbox(); return -1; }
  S.board[i] = item;
  discover(item);
  popIdx.add(i);
  return i;
}
function discover(it) {
  if (!it || it.g) return;
  const k = it.c + ":" + it.l;
  if (!S.collection[k]) {
    S.collection[k] = 1;
    if (PRODUCT_CHAINS.includes(it.c) && S.started) toast("Нове у колекції: " + itemIcon(it) + " " + itemName(it));
  }
}

/* ---------------- Генератор ---------------- */
function produce(i) {
  const gen = GENS[S.board[i].g];
  if (emptyNear(i) < 0) { sfx.nope(); toast("Немає місця 🙈 Об'єднай або продай щось"); return; }
  if (!spendEnergy()) return;
  let item;
  const roll = Math.random();
  if (roll < 0.015) item = { c: "energy", l: 0 };
  else if (roll < 0.06) item = { c: "coin", l: 0 };
  else {
    // що вищий рівень гравця, то частіше генератор дає одразу кращі предмети
    const r = Math.random(), up = Math.min(0.35, 0.15 + S.level * 0.01);
    item = { c: gen.chain, l: r < 0.03 + S.level * 0.002 ? 2 : r < up ? 1 : 0 };
  }
  const at = placeItem(item, i);
  if (at >= 0) spawnFrom.set(at, i);
  sfx.pop();
  bounce(i);
  if (S.tut === 0) setTut(1);
  renderBoard(); renderTop(); renderOrders(); save();
  return at;
}

/* ---------------- Скриньки ---------------- */
function openChest(i) {
  const it = S.board[i];
  const k = it.l, count = CHAINS.chest.sizes[k];
  S.board[i] = null;
  const unlocked = S.gens.map(g => GENS[g].chain);
  const maxT = [1, 2, 3][k];
  for (let n = 0; n < count; n++) {
    const r = Math.random();
    let item;
    if (r < 0.08) item = { c: "energy", l: Math.min(2, rnd(k + 1)) };
    else if (r < 0.28) item = { c: "coin", l: Math.min(3, rnd(k + 2)) };
    else item = { c: pick(unlocked), l: rnd(maxT + 1) };
    const at = placeItem(item, i);
    if (at >= 0) spawnFrom.set(at, i);
  }
  sfx.open();
  sparkle(i, "✨", 8);
  renderBoard(); renderOrders(); save();
}

/* ---------------- Збір монет / енергії ---------------- */
function collect(i) {
  const it = S.board[i], ch = CHAINS[it.c];
  const v = ch.values[it.l];
  S.board[i] = null;
  const src = cellRect(i);
  if (ch.collect === "coins") { S.coins += v; sfx.coin(); floatAt(i, "+" + v + " 🪙"); flyMany(src, "🪙", "coins", Math.min(6, 2 + it.l * 2)); }
  else { regen(); S.energy += v; sfx.coin(); floatAt(i, "+" + v + " ⚡"); flyMany(src, "⚡", "energy", Math.min(6, 2 + it.l * 2)); }
  if (selected === i) selected = -1;
  renderBoard(); renderTop(); renderInfo(); save();
}

/* ---------------- Переміщення та злиття ---------------- */
function handleDrop(a, b) {
  if (a === b) return;
  const A = S.board[a], B = S.board[b];
  if (!A) return;
  if (!B) {
    S.board[b] = A; S.board[a] = null;
    if (selected === a) selected = b;
  } else if (!A.g && !B.g && A.c === B.c && A.l === B.l && !isMax(A)) {
    const nl = A.l + 1;
    S.board[b] = { c: A.c, l: nl };
    S.board[a] = null;
    S.merges++;
    discover(S.board[b]);
    gainXp(1 + Math.floor(nl / 2));
    sfx.merge(nl);
    sparkle(b, "✨", 5);
    popIdx.add(b); mergedIdx.add(b); burstAt(b);
    selected = b;
    // невеликий бонус за злиття
    const bonus = Math.random();
    if (bonus < 0.015) placeItem({ c: "energy", l: 0 }, b);
    else if (bonus < 0.05 && nl >= 3) placeItem({ c: "coin", l: 0 }, b);
    if (S.tut === 1) setTut(2);
  } else {
    S.board[b] = A; S.board[a] = B;
    if (selected === a) selected = b; else if (selected === b) selected = a;
  }
  renderBoard(); renderOrders(); renderInfo(); save();
}

/* ---------------- Досвід і рівні ---------------- */
function xpNeed(l) { return 30 + 20 * (l - 1); }
function gainXp(n) {
  S.xp += n;
  let ups = 0;
  while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; ups++; }
  if (ups) {
    regen(); S.energy += ENERGY_BONUS.level;
    placeItem({ c: "chest", l: S.level % 5 === 0 ? 1 : 0 });
    sfx.level();
    confetti();
    setTimeout(() => modal({
      title: "Рівень " + S.level + "! 🎉",
      html: `<div class="big-emoji">🌟</div><p>Ти молодчинка! Тримай подарунки:</p><p class="rewards">+${ENERGY_BONUS.level} ⚡ &nbsp; ${S.level % 5 === 0 ? "📦" : "🎁"}</p>`,
      buttons: [{ label: "Дякую! 💛" }]
    }), 350);
  }
  renderTop();
}

/* ---------------- Замовлення ---------------- */
function unlockedChains() { return S.gens.map(g => GENS[g].chain); }
function newOrder() {
  const busy = S.orders.map(o => o.ch);
  const pool = Object.keys(CHARS).filter(c => !busy.includes(c) && (CHARS[c].from || 0) <= S.chapter);
  const ch = pick(pool);
  const chains = unlockedChains();
  const count = S.level < 3 ? 1 : (Math.random() < 0.55 ? 1 : 2);
  const items = [];
  for (let n = 0; n < count; n++) {
    const c = pick(chains), len = CHAINS[c].items.length;
    // стеля складності: не більше рів. 6 (до 15-го рівня гравця — рів. 5), щоб не було виснажливого гринду
    const cap = S.level < 15 ? 4 : 5;
    const maxT = Math.min(len - 1, cap, 2 + Math.floor(S.level / 2));
    const minT = S.level >= 4 ? 2 : 1;
    const l = Math.max(minT, Math.min(maxT, minT + rnd(maxT - minT + 1)));
    items.push({ c, l: Math.min(l, len - 1) });
  }
  // для перших замовлень — дуже прості речі
  if (S.ordersDone < 3) { items.length = 1; items[0].l = 1; items[0].c = pick(["veg", "bake"]); }
  let coins = 0, xp = 0, top = 0;
  items.forEach(it => { coins += itemValue(it.c, it.l) * 2; xp += (it.l + 1) * 3; top = Math.max(top, it.l); });
  const stars = top >= 5 || items.length >= 2 && top >= 4 ? 2 : 1;
  return { id: ++S.orderSeq, ch, items, coins, xp, stars, line: rnd(3) };
}
function fillOrders() {
  while (S.orders.length < 3) S.orders.push(newOrder());
}
function matchOrder(o) {
  const used = new Set(), found = [];
  for (const need of o.items) {
    let hit = -1;
    for (let i = 0; i < N; i++) {
      const it = S.board[i];
      if (it && !it.g && !used.has(i) && it.c === need.c && it.l === need.l) { hit = i; break; }
    }
    found.push(hit);
    if (hit >= 0) used.add(hit);
  }
  return found;
}
function deliver(id) {
  const o = S.orders.find(x => x.id === id);
  if (!o) return;
  const found = matchOrder(o);
  if (found.some(i => i < 0)) { sfx.nope(); return; }
  const card = document.querySelector(`.order[data-id="${id}"]`);
  found.forEach((i, k) => { flyFrom(i, card, k * 70); S.board[i] = null; if (selected === i) selected = -1; });
  if (card && FARM) {
    const cr = card.getBoundingClientRect();
    setTimeout(() => { flyMany(cr, "🪙", "coins", 4); if (o.stars) flyMany(cr, "⭐", "stars", o.stars + 1, 120); }, 380);
  }
  S.coins += o.coins;
  S.stars += o.stars;
  S.ordersDone++;
  sfx.deliver();
  bubble(CHARS[o.ch], pick(CHARS[o.ch].thanks), card);
  S.orders = S.orders.filter(x => x.id !== id);
  if (S.ordersDone % 4 === 0) placeItem({ c: "chest", l: 0 });
  gainXp(o.xp);
  if (S.tut === 2) setTut(3);
  renderBoard(); renderTop(); renderInfo();
  if (card) { card.classList.add("got"); setTimeout(() => card.classList.add("leaving"), FARM ? 420 : 0); }
  setTimeout(() => { fillOrders(); renderOrders(); save(); }, FARM ? 850 : 450);
  renderNavBadge();
  save();
}

/* ---------------- Сюжет ---------------- */
function curChapter() { return STORY[Math.min(S.chapter, STORY.length - 1)]; }
function doTask() {
  if (S.storyDone) return;
  const ch = STORY[S.chapter], t = ch.tasks[S.task];
  if (S.stars < t.cost) { sfx.nope(); toast("Потрібно ще " + (t.cost - S.stars) + " ⭐ — виконуй замовлення сусідів"); return; }
  S.stars -= t.cost;
  S.task++;
  if (S.tut === 3) setTut(4);
  sfx.deliver();
  renderTop(); renderStory(true);
  $("tab-story").scrollTo({ top: 0, behavior: "smooth" });
  save();
  const finished = S.task >= ch.tasks.length;
  playDialog(t.lines, () => {
    if (!finished) return;
    // кінець розділу
    const r = ch.reward || {};
    confetti(); sfx.level();
    const parts = [];
    if (r.gen && !S.gens.includes(r.gen)) { S.gens.push(r.gen); placeItem({ g: r.gen }); parts.push(GENS[r.gen].icon + " " + GENS[r.gen].name); }
    if (r.chest !== undefined) { placeItem({ c: "chest", l: r.chest }); parts.push(CHAINS.chest.items[r.chest][0]); }
    regen(); S.energy += ENERGY_BONUS.chapter; parts.push("+" + ENERGY_BONUS.chapter + " ⚡");
    S.chapter++; S.task = 0;
    if (S.chapter >= STORY.length) { S.storyDone = true; S.chapter = STORY.length - 1; S.task = STORY[S.chapter].tasks.length; }
    save();
    modal({
      title: "Розділ завершено! 🎉",
      html: `<p class="chapter-done">«${ch.title}»</p><p>Нагорода чекає на дошці:</p><p class="rewards">${parts.join(" &nbsp; ")}</p>` +
        (r.gen ? `<p class="hint-s">Новий генератор! Тепер сусіди замовлятимуть і ${CHAINS[GENS[r.gen].chain].name.toLowerCase()}.</p>` : ""),
      buttons: [{ label: S.storyDone ? "Ура! 💛" : "Далі ›", onClick: () => {
        renderAll();
        if (!S.storyDone) playDialog(STORY[S.chapter].intro);
        else playDialog([["halya", "Це ще не кінець, {name}! Нові розділи вже пишуться 💌 А поки — сусіди чекають на замовлення!"]]);
      } }]
    });
  });
}

/* ---------------- Щоденний подарунок і перерва на чай ---------------- */
function todayStr() { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
function checkDaily() {
  const t = todayStr();
  if (S.lastDaily === t) return;
  const y = new Date(Date.now() - 864e5);
  const ys = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
  S.streak = S.lastDaily === ys ? S.streak + 1 : 1;
  S.lastDaily = t;
  const big = S.streak % 3 === 0;
  regen(); S.energy += ENERGY_BONUS.daily;
  placeItem({ c: "chest", l: big ? 1 : 0 });
  save();
  modal({
    title: "Щоденний подарунок 🎁",
    html: `<div class="big-emoji">${big ? "📦" : "🎁"}</div><p>День ${S.streak} поспіль! ${big ? "Кожен третій день — велика посилка!" : ""}</p><p class="rewards">+${ENERGY_BONUS.daily} ⚡ &nbsp; ${big ? "📦" : "🎁"}</p>`,
    buttons: [{ label: "Забрати 💛", onClick: () => { renderAll(); } }]
  });
}
function teaReady() { return Date.now() - S.teaAt >= TEA_BREAK_MS; }
function takeTea() {
  if (!teaReady()) return;
  S.teaAt = Date.now();
  addEnergy(TEA_BREAK_ENERGY);
  sfx.coin();
  toast("☕ Смачного! +" + TEA_BREAK_ENERGY + " ⚡");
}
function hm(ms) {
  const m = Math.ceil(ms / 60000);
  if (m < 60) return m + " хв";
  return Math.floor(m / 60) + " год" + (m % 60 ? " " + (m % 60) + " хв" : "");
}
function energyFullIn() {
  regen();
  if (S.energy >= ENERGY_MAX) return 0;
  return (ENERGY_MAX - S.energy - 1) * ENERGY_REGEN_MS + Math.max(0, ENERGY_REGEN_MS - (Date.now() - S.energyAt));
}
function energyBuysToday() {
  if (!S.energyBuys || S.energyBuys.day !== todayStr()) S.energyBuys = { day: todayStr(), n: 0 };
  return S.energyBuys.n;
}
function energyPrice() {
  const n = energyBuysToday();
  return n < ENERGY_SHOP.prices.length ? ENERGY_SHOP.prices[n] : 0;
}
function energyButtons(withWait) {
  const btns = [];
  if (teaReady()) btns.push({ label: "☕ Перерва на чай: +" + TEA_BREAK_ENERGY + " ⚡", onClick: takeTea });
  else btns.push({ label: "☕ Чай буде за " + hm(TEA_BREAK_MS - (Date.now() - S.teaAt)), disabled: true });
  const p = energyPrice();
  if (p) btns.push({ label: "Купити " + ENERGY_SHOP.amount + " ⚡ за " + p + " 🪙", cls: "ghost", disabled: S.coins < p, onClick: () => buy("energy") });
  if (withWait) btns.push({ label: "Зачекаю 💤", cls: "ghost" });
  return btns;
}
let noEnergyTick = null;
function showNoEnergy() {
  sfx.nope();
  regen();
  const next = () => mmss(Math.max(0, ENERGY_REGEN_MS - (Date.now() - S.energyAt)));
  modal({
    title: "Енергія скінчилась 😴",
    html: `<div class="big-emoji">🫖</div>
      <p>Город відпочиває. Наступна ⚡ буде за <b id="neNext">${next()}</b>,<br>повна шкала (${ENERGY_MAX} ⚡) — за <b id="neFull">${hm(energyFullIn())}</b>.</p>
      <p class="hint-s">Поки чекаєш — об'єднуй те, що вже є на дошці, і виконуй замовлення.${energyPrice() ? "" : "<br>Енергію на сьогодні вже купувала — завтра крамничка знову відкриється."}</p>`,
    buttons: energyButtons(true)
  });
  clearInterval(noEnergyTick);
  noEnergyTick = setInterval(() => {
    const a = document.getElementById("neNext"), b = document.getElementById("neFull");
    if (!a || !$("modal").classList.contains("show")) { clearInterval(noEnergyTick); return; }
    a.textContent = next(); b.textContent = hm(energyFullIn());
  }, 1000);
}

/* ---------------- Крамничка (тільки ігрові монетки) ---------------- */
const SHOP = [
  { id: "energy", icon: "⚡", title: ENERGY_SHOP.amount + " енергії", price: 0 },
  { id: "chest0", icon: "🎁", title: "Подарунок", price: 150 },
  { id: "chest1", icon: "📦", title: "Посилка", price: 400 },
  { id: "star",   icon: "⭐", title: "Зірочка для ремонту", price: 500 },
  { id: "chest2", icon: "💝", title: "Скриня-сюрприз", price: 900 }
];
function buy(id) {
  const s = SHOP.find(x => x.id === id);
  const price = id === "energy" ? energyPrice() : s.price;
  if (!price) { sfx.nope(); toast("Енергію на сьогодні вже купила — завтра знову можна 🌙"); return; }
  if (S.coins < price) { sfx.nope(); toast("Не вистачає монеток 🪙"); return; }
  S.coins -= price;
  if (id === "energy") { regen(); S.energy += ENERGY_SHOP.amount; S.energyBuys.n++; }
  else if (id === "star") S.stars += 1;
  else placeItem({ c: "chest", l: +id.slice(-1) });
  sfx.coin();
  toast("Куплено: " + s.icon + " " + s.title);
  renderAll(); save();
}

/* ---------------- Продаж ---------------- */
function sellSelected() {
  const it = S.board[selected];
  if (!it || it.g) return;
  const price = Math.max(1, Math.round(itemValue(it.c, it.l) / 2));
  floatAt(selected, "+" + price + " 🪙");
  S.board[selected] = null; selected = -1;
  S.coins += price;
  sfx.coin();
  renderBoard(); renderTop(); renderInfo(); renderOrders(); save();
}

/* ============================================================
   РЕНДЕР
   ============================================================ */
let selected = -1;
const popIdx = new Set();
const spawnFrom = new Map(); // клітинка → звідки прилетів предмет
const mergedIdx = new Set();
let neededIdx = new Set();

function renderAll() { renderTop(); renderOrders(); renderBoard(); renderInfo(); renderInbox(); renderStory(); renderShop(); renderCollection(); renderNavBadge(); renderTut(); }

function mmss(ms) { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

function renderTop() {
  regen();
  $("lvl").textContent = S.level;
  $("xpRing").style.setProperty("--p", Math.min(100, S.xp / xpNeed(S.level) * 100));
  $("energy").textContent = S.energy;
  const t = $("energyTimer");
  if (S.energy < ENERGY_MAX) {
    t.textContent = mmss(ENERGY_REGEN_MS - (Date.now() - S.energyAt));
    t.hidden = false;
  } else t.hidden = true;
  $("coins").textContent = S.coins;
  $("stars").textContent = S.stars;
}

function renderOrders() {
  const box = $("orders");
  neededIdx = new Set();
  box.innerHTML = "";
  S.orders.forEach(o => {
    const found = matchOrder(o);
    const ready = found.every(i => i >= 0);
    found.forEach(i => { if (i >= 0) neededIdx.add(i); });
    const ch = CHARS[o.ch];
    const el = document.createElement("div");
    const pic = FARM && PORTRAITS.includes(ch.key);
    el.className = "order" + (ready ? " ready" : "") + (pic ? " pic" : "");
    el.dataset.id = o.id;
    const itemsHtml = `<div class="o-items">${o.items.map((it, k) => `<span class="o-item${found[k] >= 0 ? " have" : ""}">${itemIcon(it)}</span>`).join("")}</div>`;
    el.innerHTML = (pic
      ? `<div class="o-who"><span class="o-name">${ch.name.split(" ").pop()}</span></div>` +
        `<div class="o-body"><div class="o-pic"><img src="portraits/${ch.key}.webp" alt="" style="object-position:${(PORTRAIT_FACE[ch.key] || [50])[0]}% 0"></div>${itemsHtml}</div>`
      : `<div class="o-who"><span class="o-ava">${face(ch, "mini")}</span><span class="o-name">${ch.name.split(" ").pop()}</span></div>` + itemsHtml) +
      (ready
        ? `<button class="o-btn">Віддати</button>`
        : `<div class="o-rew">🪙${o.coins} · ${"⭐".repeat(o.stars)}</div>`);
    el.addEventListener("click", e => {
      if (ready && e.target.closest(".o-btn")) { deliver(o.id); return; }
      bubble(ch, ch.ask[o.line] + "  " + o.items.map(it => itemIcon(it) + " " + itemName(it)).join(", "), el);
    });
    box.appendChild(el);
  });
  // підсвітити потрібні предмети на дошці
  document.querySelectorAll(".tile").forEach(t => t.classList.toggle("needed", neededIdx.has(+t.dataset.i)));
}

function renderBoard() {
  const board = $("board");
  if (board.children.length !== N) {
    board.innerHTML = "";
    for (let i = 0; i < N; i++) { const c = document.createElement("div"); c.className = "cell"; c.dataset.i = i; board.appendChild(c); }
  }
  for (let i = 0; i < N; i++) {
    const cell = board.children[i], it = S.board[i];
    cell.classList.toggle("sel", i === selected);
    const key = it ? (it.g ? "g:" + it.g : it.c + ":" + it.l) : "";
    if (cell.dataset.key === key && !popIdx.has(i) && !spawnFrom.has(i) && !mergedIdx.has(i)) { cell.firstChild && cell.firstChild.classList.toggle("needed", neededIdx.has(i)); continue; }
    cell.dataset.key = key;
    cell.innerHTML = "";
    if (!it) continue;
    const t = document.createElement("div");
    const from = spawnFrom.has(i) && FARM ? cellRect(spawnFrom.get(i)) : null, to = from && cellRect(i);
    const anim = from && to ? " spawn" : mergedIdx.has(i) && FARM ? " merged" : popIdx.has(i) ? " pop" : "";
    t.className = "tile" + (it.g ? " gen" : "") + (it.c && CHAINS[it.c].open ? " chest" : "") +
      (it.c && CHAINS[it.c].collect ? " collect" : "") + (isMax(it) && PRODUCT_CHAINS.includes(it.c) ? " max" : "") +
      anim + (neededIdx.has(i) ? " needed" : "");
    if (from && to) { t.style.setProperty("--fx", (from.left - to.left) + "px"); t.style.setProperty("--fy", (from.top - to.top) + "px"); }
    t.dataset.i = i;
    t.textContent = itemIcon(it);
    if (it.g) { const b = document.createElement("span"); b.className = "gen-badge"; b.textContent = "⚡"; t.appendChild(b); }
    cell.appendChild(t);
  }
  popIdx.clear(); spawnFrom.clear(); mergedIdx.clear();
}

function renderInfo() {
  const box = $("info");
  const it = S.board[selected];
  if (!it) {
    box.innerHTML = `<span class="info-hint">Тапни на предмет, щоб дізнатися про нього більше</span>`;
    return;
  }
  let text = "", btn = "";
  if (it.g) {
    const ch = CHAINS[GENS[it.g].chain];
    text = `<b>${GENS[it.g].name}</b><small>Тапай, щоб отримати ${ch.items[0][0]} (−1 ⚡)</small>`;
  } else if (CHAINS[it.c].open) {
    text = `<b>${itemName(it)}</b><small>Тапни ще раз, щоб відкрити!${isMax(it) ? "" : " Або об'єднай два однакові"}</small>`;
  } else if (CHAINS[it.c].collect) {
    text = `<b>${itemName(it)}</b><small>Тапни ще раз, щоб забрати +${CHAINS[it.c].values[it.l]} ${it.c === "coin" ? "🪙" : "⚡"}</small>`;
  } else {
    const ch = CHAINS[it.c];
    const next = isMax(it) ? "Найвищий рівень! 🏆" : `Два таких → ${ch.items[it.l + 1][0]} ${ch.items[it.l + 1][1]}`;
    text = `<b>${itemName(it)}</b> <span class="lvl-tag">рів. ${it.l + 1}</span><small>${next}</small>`;
    btn = `<button class="sell" id="sellBtn">Продати +${Math.max(1, Math.round(itemValue(it.c, it.l) / 2))}🪙</button>`;
  }
  box.innerHTML = `<span class="info-ic">${itemIcon(it)}</span><span class="info-txt">${text}</span>${btn}`;
  const sb = $("sellBtn");
  if (sb) sb.onclick = () => {
    if (it.l >= 3 && !sb.dataset.sure) { sb.dataset.sure = 1; sb.textContent = "Точно продати?"; return; }
    sellSelected();
  };
}

function renderInbox() {
  const b = $("inboxBtn");
  b.hidden = S.inbox.length === 0;
  b.querySelector("span").textContent = S.inbox.length;
  b.firstChild.textContent = S.inbox.length ? itemIcon(S.inbox[0]) : "📥";
}
function takeInbox() {
  if (!S.inbox.length) return;
  const i = emptyNear(Math.floor(N / 2));
  if (i < 0) { sfx.nope(); toast("Звільни місце на дошці 🙂"); return; }
  const it = S.inbox.shift();
  S.board[i] = it; discover(it); popIdx.add(i);
  sfx.pop();
  renderBoard(); renderInbox(); renderOrders(); save();
}

/* Хто з сусідів стоїть у дворику: ті, хто найбільше говорить у розділі (до трьох) */
function yardPeople(ch, all) {
  const count = {};
  [ch.intro || [], ...ch.tasks.map(t => t.lines || [])].forEach(lines => lines.forEach(([who]) => {
    if (CHARS[who] && who !== "cat" && PORTRAITS_FULL.includes(who)) count[who] = (count[who] || 0) + 1;
  }));
  // хто вже стоїть у дворику окремою фігуркою (наречені) — двічі не ставимо
  all.forEach(d => { if (d.pic) delete count[d.pic.split("-")[0]]; });
  const who = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 3);
  const slots = [[27, 72], [73, 72], [36, 87], [64, 87], [17, 60], [83, 60], [40, 76], [60, 76], [12, 74], [88, 74], [24, 86], [76, 86], [50, 64], [8, 66], [92, 66], [30, 94], [70, 94], [50, 92]];
  const taken = all.filter(d => d.y >= 34 && !d.who).map(d => [d.x, d.y, d.s]);
  const out = [];
  for (const w of who) {
    const s = 10;
    // не ставати впритул і не заступати собою те, що стоїть позаду (фігура висока)
    const free = slots.find(([x, y]) => taken.every(([tx, ty, ts, person]) =>
      Math.hypot(tx - x, (ty - y) * 1.4) > (ts + s) * 0.85 &&
      !(ts <= 12 && Math.abs(tx - x) < (ts + s) * 0.5 && ty < y && y - ty < 32) &&
      !(person && Math.abs(tx - x) < 12 && Math.abs(ty - y) < 32)));
    if (!free) break;
    taken.push([free[0], free[1], s, true]); // сусіди не стають один за одним
    out.push({ key: "p-" + w, who: w, x: free[0], y: free[1], s });
  }
  return out;
}
function renderStory(animateLast) {
  const ch = curChapter();
  const scene = $("scene");
  scene.style.setProperty("--sky1", ch.sky[0]);
  scene.style.setProperty("--sky2", ch.sky[1]);
  scene.style.setProperty("--ground", ch.ground);
  const removed = new Set();
  const added = [];
  ch.tasks.slice(0, S.task).forEach((t, k) => {
    (t.remove || []).forEach(r => removed.add(r));
    (t.add || []).forEach((a, j) => added.push(Object.assign({ fresh: animateLast && k === S.task - 1, key: "t" + k + "-" + j }, a)));
  });
  const all = [
    ...ch.base.map((d, j) => Object.assign({ key: "b" + j }, d)),
    ...ch.clutter.map((d, j) => Object.assign({ key: "c" + j }, d)).filter(c => !removed.has(c.id)),
    ...added
  ];
  if (window.Yard3D) {
    all.push(...yardPeople(ch, all));
    // справжній 3D-дворик
    scene.classList.add("is3d");
    if (!scene.querySelector("canvas")) scene.innerHTML = "";
    Yard3D.mount(scene);
    Yard3D.render(Math.min(S.chapter, STORY.length - 1), ch, all, !!animateLast);
    Yard3D.setActive(!$("tab-story").hidden);
  } else {
    const deco = d => `<span class="deco${d.fresh ? " fresh" : ""}" style="left:${d.x}%;top:${d.y}%;font-size:${d.s}cqw">${d.e}</span>`;
    scene.innerHTML = `<div class="ground"></div>` + all.map(deco).join("");
  }

  $("chapterTitle").textContent = `Розділ ${S.chapter + 1}. ${ch.title}`;
  const done = Math.min(S.task, ch.tasks.length);
  $("chapterBar").style.width = (done / ch.tasks.length * 100) + "%";
  $("chapterProg").textContent = done + "/" + ch.tasks.length;

  const list = $("tasks");
  list.innerHTML = "";
  ch.tasks.forEach((t, k) => {
    const row = document.createElement("div");
    const state = k < S.task ? "done" : k === S.task ? "now" : "locked";
    row.className = "task " + state;
    row.innerHTML = `<span class="t-ic">${state === "done" ? "✅" : state === "now" ? "🔨" : "🔒"}</span>` +
      `<span class="t-title">${t.title}</span>` +
      (state === "now" ? `<button class="t-btn${S.stars >= t.cost ? "" : " dim"}">${t.cost} ⭐</button>` :
        state === "locked" ? `<span class="t-cost">${t.cost} ⭐</span>` : "");
    const btn = row.querySelector(".t-btn");
    if (btn) btn.onclick = doTask;
    list.appendChild(row);
  });
  $("storyEnd").hidden = !S.storyDone;
  $("replayIntro").onclick = () => playDialog(ch.intro);
}

function renderShop() {
  const box = $("shopList");
  box.innerHTML = "";
  SHOP.forEach(s => {
    const row = document.createElement("div");
    row.className = "shop-item";
    let price = s.price, title = s.title, lbl;
    if (s.id === "energy") {
      price = energyPrice();
      const left = ENERGY_SHOP.prices.length - energyBuysToday();
      title += `<small class="s-sub">${left ? "сьогодні ще " + left + " з " + ENERGY_SHOP.prices.length : "завтра знову"}</small>`;
    }
    lbl = price ? price + " 🪙" : "🌙";
    row.innerHTML = `<span class="s-ic">${s.icon}</span><span class="s-title">${title}</span><button class="s-btn${price && S.coins >= price ? "" : " dim"}">${lbl}</button>`;
    row.querySelector("button").onclick = () => buy(s.id);
    box.appendChild(row);
  });
  const tb = $("teaBtn");
  if (teaReady()) { tb.textContent = "☕ Перерва на чай: +" + TEA_BREAK_ENERGY + " ⚡ безкоштовно"; tb.classList.remove("dim"); }
  else { tb.textContent = "☕ Наступна перерва на чай за " + hm(TEA_BREAK_MS - (Date.now() - S.teaAt)); tb.classList.add("dim"); }
}

function renderCollection() {
  const box = $("collList");
  let have = 0, total = 0;
  box.innerHTML = "";
  PRODUCT_CHAINS.forEach(c => {
    const ch = CHAINS[c];
    const sec = document.createElement("div");
    sec.className = "coll-sec";
    const items = ch.items.map((x, l) => {
      total++;
      const got = S.collection[c + ":" + l];
      if (got) have++;
      return `<span class="coll-it${got ? "" : " no"}" title="${got ? x[1] : "?"}">${got ? x[0] : "❔"}</span>`;
    }).join("");
    const locked = !unlockedChains().includes(c);
    sec.innerHTML = `<div class="coll-h">${ch.name}${locked ? " <small>🔒 відкриється за сюжетом</small>" : ""}</div><div class="coll-row">${items}</div>`;
    box.appendChild(sec);
  });
  $("collProg").textContent = have + " / " + total;
}

function renderNavBadge() {
  const ch = STORY[S.chapter];
  const can = !S.storyDone && ch && ch.tasks[S.task] && S.stars >= ch.tasks[S.task].cost;
  $("navStoryDot").hidden = !can;
}

/* ---------------- Підказки-навчання ---------------- */
const TUT = [
  "👆 Тапни на 🪴 Грядку — вона дасть насіннячко",
  "✌️ Перетягни 🌱 на такий самий 🌱 — вийде 🌿",
  "🧺 Збери, що просять сусіди, і натисни «Віддати»",
  "🏡 Зірочки ⭐ витрачай у «Дворику» на ремонт"
];
function setTut(n) { S.tut = n; renderTut(); }
function renderTut() {
  const h = $("tutHint");
  if (S.tut < TUT.length) { h.textContent = TUT[S.tut]; h.hidden = false; }
  else h.hidden = true;
}

/* ---------------- Ефекти ---------------- */
function cellRect(i) { const c = $("board").children[i]; return c ? c.getBoundingClientRect() : null; }
function floatAt(i, text) {
  const r = cellRect(i); if (!r) return;
  const f = document.createElement("div");
  f.className = "float"; f.textContent = text;
  f.style.left = (r.left + r.width / 2) + "px"; f.style.top = r.top + "px";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}
function sparkle(i, ch, n) {
  const r = cellRect(i); if (!r) return;
  for (let k = 0; k < n; k++) {
    const s = document.createElement("div");
    s.className = "spark"; s.textContent = ch;
    const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 30;
    s.style.left = (r.left + r.width / 2) + "px"; s.style.top = (r.top + r.height / 2) + "px";
    s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}
const FARM = document.body.classList.contains("farm");
function flyFrom(i, toEl, delay = 0) {
  const r = cellRect(i); if (!r) return;
  if (FARM && toEl) { flyIcon(itemIcon(S.board[i]), r, toEl.getBoundingClientRect(), { delay, size: r.width * 0.8, end: 0.5, onEnd: () => toEl.classList.add("got") }); return; }
  const f = document.createElement("div");
  f.className = "fly"; f.textContent = itemIcon(S.board[i]);
  f.style.left = (r.left + r.width / 2) + "px"; f.style.top = (r.top + r.height / 2) + "px";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 700);
}
/* іконка летить дугою з одного місця в інше */
function flyIcon(content, from, to, { delay = 0, size = 30, dur = 620, end = 0.6, lift = 70, onEnd } = {}) {
  if (!from || !to) return;
  const f = document.createElement("div");
  f.className = "flyto"; f.textContent = content; f.style.fontSize = size + "px";
  document.body.appendChild(f);
  const x0 = from.left + from.width / 2 - size / 2, y0 = from.top + from.height / 2 - size / 2;
  const x1 = to.left + to.width / 2 - size / 2, y1 = to.top + to.height / 2 - size / 2;
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * 40, my = Math.min(y0, y1) - lift;
  const kf = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10, u = 1 - t;
    const x = u * u * x0 + 2 * u * t * mx + t * t * x1, y = u * u * y0 + 2 * u * t * my + t * t * y1;
    const s = k === 0 ? 0.6 : k < 3 ? 1.15 : 1 - (1 - end) * t;
    kf.push({ transform: `translate(${x}px, ${y}px) scale(${s})`, opacity: k === 0 ? 0 : 1 });
  }
  const a = f.animate(kf, { duration: dur, delay, easing: "cubic-bezier(.4, 0, .7, 1)", fill: "both" });
  a.onfinish = () => { f.remove(); onEnd && onEnd(); };
}
/* кілька монеток / зірочок летять у лічильник угорі */
function flyMany(from, content, counterId, n, delay0 = 0) {
  if (!FARM || !from) return;
  const target = $(counterId) && $(counterId).closest(".chip");
  if (!target) return;
  const to = target.getBoundingClientRect();
  for (let k = 0; k < n; k++) {
    flyIcon(content, from, to, { delay: delay0 + k * 70, size: 24, dur: 650, end: 0.7, lift: 40 + Math.random() * 50,
      onEnd: () => { target.classList.remove("bump"); void target.offsetWidth; target.classList.add("bump"); if (k === n - 1) sfx.coin(); } });
  }
}
function burstAt(i) {
  if (!FARM) return;
  const r = cellRect(i); if (!r) return;
  const b = document.createElement("div");
  b.className = "burst";
  b.style.left = (r.left + r.width / 2) + "px"; b.style.top = (r.top + r.height / 2) + "px";
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 460);
}
function bounce(i) {
  const c = $("board").children[i];
  const t = c && c.firstChild; if (!t) return;
  t.classList.remove("tap"); void t.offsetWidth; t.classList.add("tap");
}
function confetti() {
  const L = $("confetti");
  const ems = ["🌸", "✨", "💛", "🌼", "🎉", "⭐"];
  for (let k = 0; k < 28; k++) {
    const s = document.createElement("span");
    s.textContent = pick(ems);
    s.style.left = Math.random() * 100 + "vw";
    s.style.animationDelay = Math.random() * 0.5 + "s";
    s.style.fontSize = 16 + Math.random() * 16 + "px";
    L.appendChild(s);
    setTimeout(() => s.remove(), 2600);
  }
}
let toastT = null;
function toast(text) {
  const t = $("toast");
  t.textContent = text; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200);
}
let bubbleT = null;
function bubble(ch, text, anchor) {
  const b = $("bubble");
  b.innerHTML = `<span class="b-ava">${face(ch, "mini")}</span><span><b>${ch.name}</b><br>${fmtName(text)}</span>`;
  b.classList.add("show");
  clearTimeout(bubbleT); bubbleT = setTimeout(() => b.classList.remove("show"), 2600);
}

/* ---------------- Модалки й діалоги ---------------- */
function modal({ title, html, buttons }) {
  const m = $("modal");
  m.querySelector(".m-title").textContent = title;
  m.querySelector(".m-body").innerHTML = html;
  const bb = m.querySelector(".m-btns");
  bb.innerHTML = "";
  (buttons || [{ label: "Добре" }]).forEach(b => {
    const el = document.createElement("button");
    el.className = "btn " + (b.cls || "");
    el.textContent = b.label;
    el.disabled = !!b.disabled;
    el.onclick = () => { m.classList.remove("show"); b.onClick && b.onClick(); };
    bb.appendChild(el);
  });
  m.classList.add("show");
}
let dlgQueue = [], dlgDone = null;
function playDialog(lines, done) {
  dlgQueue = lines.slice(); dlgDone = done || null;
  nextLine();
}
function nextLine() {
  const d = $("dialog");
  if (!dlgQueue.length) { d.classList.remove("show"); const f = dlgDone; dlgDone = null; f && f(); return; }
  const [who, text] = dlgQueue.shift();
  const ch = CHARS[who];
  const av = d.querySelector(".d-ava");
  av.innerHTML = face(ch, "big");
  av.classList.toggle("has-pic", PORTRAITS.includes(ch.key));
  d.querySelector(".d-name").textContent = ch.name;
  d.querySelector(".d-text").textContent = fmtName(text);
  d.classList.add("show");
  sfx.pop();
}

/* ---------------- Налаштування ---------------- */
function openSettings() {
  modal({
    title: "Налаштування ⚙️",
    html: `
      <label class="set-row">Ім'я <input id="setName" value="${(S.name || "").replace(/"/g, "&quot;")}" maxlength="20"></label>
      <label class="set-row">🔊 Звук <input type="checkbox" id="setSound" ${S.sound ? "checked" : ""}></label>
      <p class="hint-s">Тут немає жодних справжніх покупок — тільки ігрові монетки 💛</p>
      <button class="btn ghost small" id="setReset">Почати гру спочатку</button>`,
    buttons: [{ label: "Зберегти", onClick: () => {
      S.name = $("setName").value.trim();
      S.sound = $("setSound").checked;
      renderAll(); save();
    } }]
  });
  $("setReset").onclick = () => {
    if (!confirm("Точно почати спочатку? Весь прогрес буде видалено.")) return;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  };
}

/* ============================================================
   ВЗАЄМОДІЯ З ДОШКОЮ (тап і перетягування)
   ============================================================ */
let drag = null;
function onDown(e) {
  const tile = e.target.closest(".tile");
  if (!tile) { if (e.target.closest(".cell")) { selected = -1; renderBoard(); renderInfo(); } return; }
  e.preventDefault();
  audio();
  const i = +tile.dataset.i;
  drag = { i, x: e.clientX, y: e.clientY, tile, ghost: null, over: null };
}
function onMove(e) {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.ghost && dx * dx + dy * dy < 64) return;
  if (!drag.ghost) {
    const r = drag.tile.getBoundingClientRect();
    const g = drag.tile.cloneNode(true);
    g.classList.add("drag-ghost"); g.classList.remove("pop", "needed");
    g.style.width = r.width + "px"; g.style.height = r.height + "px";
    document.body.appendChild(g);
    drag.ghost = g; drag.w = r.width; drag.h = r.height;
    drag.tile.classList.add("lifted");
    selected = drag.i;
  }
  drag.ghost.style.transform = `translate(${e.clientX - drag.w / 2}px, ${e.clientY - drag.h / 2 - 10}px) scale(1.15)`;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const cell = el && el.closest && el.closest(".cell");
  if (drag.over && drag.over !== cell) drag.over.classList.remove("over");
  if (cell) {
    const t = S.board[+cell.dataset.i], A = S.board[drag.i];
    cell.classList.add("over");
    cell.classList.toggle("can-merge", !!(t && A && !A.g && !t.g && t.c === A.c && t.l === A.l && +cell.dataset.i !== drag.i && !isMax(A)));
  }
  drag.over = cell;
}
function onUp(e) {
  if (!drag) return;
  const d = drag; drag = null;
  if (d.over) d.over.classList.remove("over", "can-merge");
  if (!d.ghost) { tap(d.i); return; }
  d.ghost.remove();
  d.tile.classList.remove("lifted");
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const cell = el && el.closest && el.closest(".cell");
  if (cell) handleDrop(d.i, +cell.dataset.i);
  else renderBoard();
}
function tap(i) {
  const it = S.board[i];
  if (!it) return;
  if (it.g) { selected = i; produce(i); renderInfo(); return; }
  const ch = CHAINS[it.c];
  if (ch.collect) { collect(i); return; }
  if (ch.open) {
    if (selected === i) { selected = -1; openChest(i); renderInfo(); return; }
    selected = i; bounce(i); renderBoard(); renderInfo(); sfx.pop(); return;
  }
  selected = i; bounce(i); sfx.pop();
  renderBoard(); renderInfo();
}

/* ---------------- Навігація ---------------- */
function showTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.hidden = t.id !== "tab-" + name);
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  if (window.Yard3D) Yard3D.setActive(name === "story");
  if (name === "story") renderStory();
  if (name === "shop") renderShop();
  if (name === "coll") renderCollection();
}

/* ============================================================
   СТАРТ
   ============================================================ */
function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
function isStandalone() { return window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches; }

function startGame() {
  $("start").classList.remove("show");
  $("app").hidden = false;
  fillOrders();
  renderAll();
  showTab("board");
  if (!S.started) {
    S.started = true;
    Object.keys(S.collection).length || S.board.forEach(discover);
    save();
    playDialog(STORY[0].intro);
  } else if (S.storyDone && S.chapter < STORY.length - 1) {
    // з'явилися нові розділи — продовжуємо історію з місця, де вона закінчилась
    S.storyDone = false; S.chapter++; S.task = 0;
    save();
    renderAll();
    const n = STORY.length - S.chapter;
    const what = n === 1 ? "новий розділ" : n < 5 ? "нові розділи" : "нових розділів";
    modal({
      title: n === 1 ? "Новий розділ! 💌" : "Нові розділи! 💌",
      html: `<div class="big-emoji">🏡</div><p>Історія дворика продовжується — на тебе ${n === 1 ? "чекає" : "чекають"} ${n} ${what}: «${STORY[S.chapter].title}»${n > 1 ? " і далі" : ""}!</p>`,
      buttons: [{ label: "Читати ›", onClick: () => playDialog(STORY[S.chapter].intro, checkDaily) }]
    });
  } else {
    checkDaily();
  }
}

function init() {
  S = load();
  const fresh = !S;
  if (fresh) S = defaultState();
  S.board.forEach(it => { if (it && !it.g) S.collection[it.c + ":" + it.l] = 1; });
  if (fresh || !S.started) {
    S.lastDaily = todayStr(); S.streak = 1;
    $("start").classList.add("show");
    $("installHint").hidden = !(isIOS() && !isStandalone());
    $("startBtn").onclick = () => {
      audio();
      S.name = $("nameInput").value.trim();
      startGame();
    };
  } else {
    startGame();
  }

  const board = $("board");
  board.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  document.querySelectorAll(".nav button").forEach(b => b.onclick = () => { audio(); showTab(b.dataset.tab); });
  $("settingsBtn").onclick = openSettings;
  $("inboxBtn").onclick = takeInbox;
  $("teaBtn").onclick = () => { takeTea(); renderShop(); };
  $("energyChip").onclick = () => { showNoEnergyInfo(); };
  $("dialog").onclick = nextLine;

  setInterval(() => {
    if (!S || !S.started) return;
    const before = S.energy;
    renderTop();
    if (!$("tab-shop").hidden) renderShop();
    if (S.energy !== before) save();
  }, 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveNow();
    else if (S && S.started) { renderAll(); checkDaily(); }
  });
  window.addEventListener("pagehide", saveNow);

  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (!window.DVORYK_NO_SW && "serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
function showNoEnergyInfo() {
  const full = energyFullIn();
  modal({
    title: "Енергія ⚡",
    html: `<p>+1 ⚡ кожні ${ENERGY_REGEN_MS / 60000} хвилини, до ${ENERGY_MAX} ⚡.<br>${full ? "Повна шкала за <b>" + hm(full) + "</b>." : "Шкала повна — саме час садити! 🌱"}</p>
      <p class="hint-s">Ще трохи енергії дають ⚡🔋☀️ на дошці, нові рівні, щоденний подарунок і перерва на чай (раз на ${TEA_BREAK_MS / 3600000} год).</p>`,
    buttons: [...energyButtons(false), { label: "Зрозуміло", cls: "ghost" }]
  });
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("yard3d-ready", () => { if (S && S.started) renderStory(); });
