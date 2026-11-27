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
    v: 2, name: "", started: false, board,
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
/* дошка стала вищою (9 рядів) — старі збереження доповнюємо порожніми клітинками знизу */
function padBoards(st) {
  const pad = b => { if (Array.isArray(b)) while (b.length < N) b.push(null); };
  pad(st.board); pad(st.main); if (st.side) pad(st.side.board); if (st.wood) pad(st.wood.board);
}

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
    padBoards(st);
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
  if (window.CLOUD) CLOUD.changed();
}

/* ---------------- Довідка по предметах ---------------- */
function itemIcon(it) {
  if (!it) return "";
  if (it.lock) return "🕸️";
  if (it.st) return "♨️";
  if (it.g) return GENS[it.g].icon;
  return CHAINS[it.c].items[it.l][0];
}
function itemName(it) {
  if (!it) return "";
  if (it.lock) return tt`Павутиння`;
  if (it.st) return tt`Піч`;
  if (it.g) return GENS[it.g].name;
  return CHAINS[it.c].items[it.l][1];
}
function isMax(it) { return it && !it.g && !it.lock && !it.st && (CHAINS[it.c].nomerge || it.l >= CHAINS[it.c].items.length - 1); }
function sellPrice(it) { return Math.max(1, Math.round(itemValue(it.c, it.l) / 5 / (window.HARD && HARD.stale(it) ? 2 : 1))); }
function itemValue(c, l) { return CHAINS[c] && CHAINS[c].vals ? CHAINS[c].vals[l] : CHAINS[c] && CHAINS[c].value ? CHAINS[c].value : Math.round(4 * Math.pow(1.9, l)); }
Object.keys(CHARS).forEach(k => CHARS[k].key = k);
function face(ch, cls = "") {
  if (!PORTRAITS.includes(ch.key)) return ch.icon;
  const src = `portraits/${ch.key}.webp`;
  if (cls !== "mini") return `<img class="face ${cls}" src="${src}" alt="">`;
  const [x, y, w] = PORTRAIT_FACE[ch.key] || [50, 22, 240];
  return `<span class="face mini"><img src="${src}" alt="" style="width:${w}%;transform:translate(-${x}%,-${y}%)"></span>`;
}
function fmtName(t) { return gx(t.replace(/\{name\}/g, S.name || tt`господинько`)); }
/* Звертання до гравця — у чоловічому роді, якщо граєш чоловіком (S.sex === "m").
   Міняємо лише фрази, звернені до гравця; репліки сусідів про себе не чіпаємо. */
const MALE_FORMS = [
  ["І ти, хрещена,", "І ти, хрещений,"], ["звичаєм хрещена вистригає", "звичаєм хрещений вистригає"], ["Перші кроки — до хрещеної", "Перші кроки — до хрещеного"], ["наша старша дружка", "наш старший боярин"],
  ["господинько", "господарю"], ["Ти молодчинка", "Ти молодець"], ["ти неймовірна", "ти неймовірний"], ["Ти впоралася", "Ти впорався"],
  ["Ти зібрала", "Ти зібрав"], ["і отримала ", "і отримав "], ["альбом зібрала", "альбом зібрав"], ["найкраща кулінарка округи", "найкращий кулінар округи"],
  ["справжня чарівниця", "справжній чарівник"], ["Ти чарівниця", "Ти чарівник"], ["Ти одягла", "Ти одягнув"], ["щоб ти знала", "щоб ти знав"],
  ["ти знала,", "ти знав,"], ["вже проголосувала", "вже проголосував"], ["королева дня", "король дня"], ["ще не виступала", "ще не виступав"],
  ["ще не брала участі", "ще не брав участі"], ["ти ще нічого не готувала", "ти ще нічого не готував"], ["справжня господиня", "справжній господар"],
  ["Шлях господині", "Шлях господаря"], ["Набір господині", "Набір господаря"], ["господине!", "господарю!"], ["господиня", "господар"],
  ["вже купила", "вже купив"], ["ти зберігала", "ти зберігав"], ["ти повернула", "ти повернув"], ["донечко", "синку"],
  ["Ти найкраща!", "Ти найкращий!"], ["моя хороша", "мій хороший"], ["самій піти", "самому піти"], ["Ти всіх вдягнула", "Ти всіх вдягнув"],
  ["Моя найкраща сусідка", "Мій найкращий сусід"], ["сама обираєш", "сам обираєш"], ["сама прочитаєш", "сам прочитаєш"],
  ["кулінарок із сусідніх сіл", "кулінарів із сусідніх сіл"], ["Готова?", "Готовий?"], ["справжня майстриня села", "справжній майстер села"], ["Почни, коли маєш", "Почни, коли маєш"]
];
function gx(t) {
  if (!t || !S || S.sex !== "m" || LANG !== "uk") return t;   // інші мови мають окремі форми в словнику ({ f, m })
  MALE_FORMS.forEach(([a, b]) => { t = t.split(a).join(b); });
  return t.replace(/ти (\d+)-а(?=[\s·,.!]|$)/g, tt`ти $1-й`);
}

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
function spendEnergy(n = 1) {
  regen();
  if (window.PAY && PAY.unlimLeft()) return true;      // «година без меж»
  if (S.energy < n) { showNoEnergy(); return false; }
  if (S.energy >= ENERGY_MAX) S.energyAt = Date.now();
  S.energy -= n;
  return true;
}
function addEnergy(n) { regen(); S.energy += n; renderTop(); save(); }
function addCoins(n) { S.coins += n; renderTop(); save(); }

/* ---------------- Дошка: пошук місця ---------------- */
function emptyNear(from) {
  let best = -1, bd = 1e9;
  const fr = Math.floor(from / COLS), fc = from % COLS;
  for (let i = 0; i < N; i++) {
    if (S.board[i] || (typeof cellOpen === "function" && !cellOpen(i))) continue;
    const r = Math.floor(i / COLS), c = i % COLS;
    const d = (r - fr) ** 2 + (c - fc) ** 2 + Math.random() * 0.1;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
function placeItem(item, near = Math.floor(N / 2)) {
  // на дошці пригоди — лише її предмети; подарунки й нагороди чекають у 📥
  if (window.HARD) HARD.stamp(item);
  if (window.SIDE && SIDE.guardPlace(item)) { S.inbox.push(item); renderInbox(); return -1; }
  const i = emptyNear(near);
  if (i < 0) { S.inbox.push(item); renderInbox(); return -1; }
  S.board[i] = item;
  discover(item);
  popIdx.add(i);
  return i;
}
function discover(it) {
  if (!it || it.g || it.lock || it.st) return;
  const k = it.c + ":" + it.l;
  if (!S.collection[k]) {
    S.collection[k] = 1;
    if (PRODUCT_CHAINS.includes(it.c) && S.started) {
      toast(tt`Нове у колекції: ` + itemIcon(it) + " " + itemName(it) + (window.UNL && UNL.on("discover") ? tt` — 🎁 у 📖` : ""));
      renderNavBadge();
    }
  }
}

/* ---------------- Генератор ---------------- */
function produce(i) {
  const gen = GENS[S.board[i].g];
  const gIt = S.board[i];
  MECH.refresh(gIt);
  if (MECH.resting(gIt)) { MECH.restModal(i); return; }
  if (window.HARD && HARD.broken(gIt)) { HARD.repairModal(i); return; }
  if (window.WH && !WH.canTap(i)) return;
  if (window.CRAFT && !CRAFT.canTap(i)) return;
  if (window.FARM2 && !FARM2.canTap(i)) return;
  if (emptyNear(i) < 0) { sfx.nope(); toast(tt`Немає місця 🙈 Об'єднай або продай щось`); return; }
  // сила ×2: 2 ⚡ і 2 заряди — зате предмет одразу на рівень вищий
  const x2 = window.XTRA && XTRA.boosted() && S.energy >= 2;
  if (!spendEnergy(x2 ? 2 : 1)) return;
  const rest = !window.UNL || UNL.on("rest");
  let tired = rest ? MECH.useCharge(gIt) : false;
  if (x2 && rest && !tired) tired = MECH.useCharge(gIt);
  if (window.HARD) HARD.wear(gIt, x2 ? 2 : 1);
  let item;
  const roll = Math.random();
  if (roll < 0.003) item = { c: "energy", l: 0 };          // батарейка з генератора — зрідка
  else if (roll < 0.013) item = { c: "coin", l: 0 };
  else {
    // що вищий рівень гравця, то частіше генератор дає одразу кращі предмети
    const r = Math.random(), tb = MECH.tierBonus(gIt), up = Math.min(0.35, 0.15 + S.level * 0.01) + tb;
    item = { c: gen.chain, l: r < 0.03 + S.level * 0.002 + tb / 2 ? 2 : r < up ? 1 : 0 };
  }
  if (x2) item.l = Math.min(CHAINS[item.c].items.length - 1, item.l + 1);
  if (window.WH) item = WH.afterTap(gIt, item);
  if (window.FARM2) item = FARM2.afterTap(gIt, item, i);
  if (window.SOIL) item = SOIL.afterTap(gIt, item);             // виснажена земля дає брак
  if (!item) { sfx.nope(); bounce(i); renderBoard(); renderTop(); renderInfo(); save(); return; }   // квітка зів'яла на спеці
  const at = placeItem(item, i);
  if (at >= 0) spawnFrom.set(at, i);
  window.QUEST && QUEST.track("tap");
  window.CRAFT && CRAFT.afterTap(i);
  window.RARE && RARE.onTap(i);
  window.SEAS && SEAS.onTap(i);
  window.HERB && HERB.onTap(i);                  // гербарій: рідкісна квітка чи метелик
  sfx.pop();
  bounce(i);
  if (S.tut === 0) setTut(1);
  window.TOUR && TOUR.ev("gen");
  if (tired) setTimeout(() => toast("💤 " + gen.name + tt` відпочиватиме ` + GEN_REST_MIN[MECH.gl(gIt) - 1] + tt` хв`), 400);
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
    if (r < 0.02) item = { c: "energy", l: Math.min(2, rnd(k + 1)) };
    else if (r < 0.08) item = { c: "coin", l: Math.min(3, rnd(k + 1)) };
    else item = { c: pick(unlocked), l: rnd(maxT + 1) };
    const at = placeItem(item, i);
    if (at >= 0) spawnFrom.set(at, i);
  }
  if (k >= 1) MECH.maybeGenCopy(k === 1 ? 0.12 : 0.25, i);
  window.QUEST && QUEST.track("chest");
  window.QUEST && QUEST.onChest(k, i);
  window.DOG && DOG.onChest(i);
  window.ALB && ALB.onChest(k);
  if (k >= 1 && window.CONTEST) CONTEST.give(k, null, k, tt`З подарунка`);
  if (k >= 1 && window.FASH) FASH.add(k * 2, tt`з подарунка`);
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
  if (A.lock || (B && B.lock)) { renderBoard(); return; }   // павутиння не рухається
  if (typeof cellOpen === "function" && !cellOpen(b)) { renderBoard(); return; }   // закрита клітинка
  if (window.CRAFT && CRAFT.feed(a, b)) return;
  if (window.FARM2 && FARM2.drop(a, b)) return;
  if (window.DOG && DOG.drop(a, b)) return;                    // кісточка — Бровкові
  if (MECH.canMergeGens(A, B)) { MECH.mergeGens(a, b); renderBoard(); renderOrders(); renderInfo(); save(); return; }
  if (B && !A.g && !B.g && A.c === B.c && A.l === B.l && window.WH && (!WH.usable(A) || !WH.usable(B))) {
    sfx.nope(); toast(A.worm || B.worm ? tt`🐛 Там шашіль — спершу виведи його` : A.untested || B.untested || A.short || B.short ? tt`❔ Спершу перевір виріб — тапни на нього` : tt`💧 Клей ще сохне — зачекай трохи`); renderBoard(); return;
  }
  if (!B) {
    S.board[b] = A; S.board[a] = null;
    if (selected === a) selected = b;
  } else if (!A.g && !B.g && A.c === B.c && A.l === B.l && !isMax(A)) {
    const nl = A.l + 1;
    S.board[b] = { c: A.c, l: nl };
    if (window.HARD && HARD.perish(A)) { S.board[b].t = HARD.mergedT(A, B); if (A.old || B.old) S.board[b].old = 1; }
    S.board[a] = null;
    S.merges++;
    discover(S.board[b]);
    gainXp(1 + Math.floor(nl / 2));
    sfx.merge(nl);
    sparkle(b, "✨", 5);
    popIdx.add(b); mergedIdx.add(b); burstAt(b);
    selected = b;
    MECH.crackAround(b);
    window.WH && WH.onMerged(b, nl);
    window.CRAFT && CRAFT.onMerged(b, nl);
    window.QUEST && QUEST.track("merge");
    if (nl >= 4) window.QUEST && QUEST.track("high");
    window.TP && TP.onMerge(A.c, nl);
    // невеликий бонус за злиття
    const bonus = Math.random();
    if (bonus < 0.008) placeItem({ c: "energy", l: 0 }, b);
    else if (bonus < 0.025 && nl >= 3) placeItem({ c: "coin", l: 0 }, b);
    if (S.tut === 1) setTut(2);
    window.TOUR && TOUR.ev("merge");
  } else {
    S.board[b] = A; S.board[a] = B;
    if (selected === a) selected = b; else if (selected === b) selected = a;
  }
  renderBoard(); renderOrders(); renderInfo(); save();
}

/* ---------------- Досвід і рівні ---------------- */
/* скільки досвіду до наступного рівня. Перші рівні — за перший день, далі рівень ≈ 1 день (5–9),
   ≈ 3 дні (10–14), ≈ 5 днів (15–19), від 20-го — тиждень і більше (якщо грати щодня до години) */
const XP_TABLE = [0, 30, 50, 80, 120, 300, 450, 600, 750, 900, 1200, 1500, 1800, 2100, 2400, 2800, 3000, 3200, 3400, 3600, 4200];
function xpNeed(l) { return l < XP_TABLE.length ? XP_TABLE[l] : 4200 + 250 * (l - 20); }
function gainXp(n) {
  S.xp += n;
  let ups = 0;
  while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; ups++; }
  if (ups) {
    regen(); S.energy += ENERGY_BONUS.level;
    placeItem({ c: "chest", l: S.level % 5 === 0 ? 1 : 0 });
    if (S.level % 5 === 0) MECH.maybeGenCopy(1);
    sfx.level();
    confetti();
    setTimeout(() => modal({
      title: tt`Рівень ` + S.level + "! 🎉",
      html: tt`<div class="big-emoji">🌟</div><p>Ти молодчинка! Тримай подарунки:</p><p class="rewards">+${ENERGY_BONUS.level} ⚡ &nbsp; ${S.level % 5 === 0 ? "📦" : "🎁"}</p>` + (window.UNL ? UNL.nextHtml() : ""),
      buttons: [{ label: tt`Дякую! 💛` }]
    }), 350);
  }
  renderTop();
}

/* ---------------- Замовлення ---------------- */
function unlockedChains() { return S.gens.map(g => GENS[g].chain); }
function newOrder() {
  // святкова подія іноді підкидає своє замовлення
  const evo = window.EV && EV.maybeOrder();
  if (evo) return evo;
  const spo = MECH.specialOrder();
  if (spo) return spo;
  const so = window.SEAS && SEAS.order();
  if (so) return window.TP ? TP.stamp(so) : so;
  const busy = S.orders.map(o => o.ch);
  const catBox = window.UNL && UNL.on("cat");   // котик на скрині замовляє окремо
  const healthy = Object.keys(CHARS).filter(c => (CHARS[c].from || 0) <= S.chapter && !(window.WD && WD.isSick(c)) && !(catBox && c === "cat"));
  let pool = healthy.filter(c => !busy.includes(c));
  if (!pool.length) pool = healthy;          // мало здорових сусідів — хтось замовить двічі
  if (!pool.length) return null;             // усі на лікарняному
  const ch = pick(pool);
  const chains = unlockedChains();
  const count = S.level < 3 ? 1 : (Math.random() < 0.55 ? 1 : 2);
  const items = [];
  for (let n = 0; n < count; n++) {
    const c = pick(chains), len = CHAINS[c].items.length;
    // стеля складності: не більше рів. 6 (до 15-го рівня гравця — рів. 5), щоб не було виснажливого гринду
    // дорожчі замовлення: стеля вища, а рівень частіше ближче до стелі
    const cap = S.level < 8 ? 4 : S.level < 15 ? 5 : S.level < 20 ? 6 : S.level < 26 ? 7 : S.level < 32 ? 8 : 9;
    const maxT = Math.min(len - 1, cap, 2 + Math.floor(S.level / 2));
    const minT = S.level >= 10 ? 3 : S.level >= 4 ? 2 : 1;
    const l = Math.max(minT, Math.min(maxT, maxT - Math.floor(Math.pow(Math.random(), 1.8) * (maxT - minT + 1))));
    items.push({ c, l: Math.min(l, len - 1) });
  }
  // для перших замовлень — дуже прості речі
  if (S.ordersDone < 3) { items.length = 1; items[0].l = 1; items[0].c = pick(["veg", "bake"]); }
  let coins = 0, xp = 0, top = 0;
  items.forEach(it => { coins += Math.round(itemValue(it.c, it.l) * 0.9); xp += (it.l + 1) * 3; top = Math.max(top, it.l); });
  const stars = top >= 5 || items.length >= 2 && top >= 4 ? 2 : 1;
  const o = MECH.maybeUrgent({ id: ++S.orderSeq, ch, items, coins, xp, stars, line: rnd(3) });
  return window.TP ? TP.stamp(o) : o;
}
function orderSlots() { return window.XTRA ? XTRA.slots() : 3; }
/* у майстерні — свій список замовлень */
const OL = () => (S.woodOn && S.wood ? S.wood.orders : S.orders);
function setOL(list) { if (S.woodOn && S.wood) S.wood.orders = list; else S.orders = list; }
function fillOrders() {
  if (S.woodOn && S.wood && window.WOOD) {
    S.wood.orders = S.wood.orders.filter(o => o && CHARS[o.ch]);
    while (S.wood.orders.length < 3) { const o = WOOD.order(); if (!o) break; S.wood.orders.push(o); }
    return;
  }
  S.orders = S.orders.filter(o => o && CHARS[o.ch]);
  // котик — без черги, тож його замовлення не займає місця
  const regular = () => S.orders.filter(o => !o.paw && !o.rare).length;
  while (regular() < orderSlots()) { const o = newOrder(); if (!o) break; S.orders.push(o); }
}
function matchOrder(o) {
  const used = new Set(), found = [];
  for (const need of o.items) {
    let hit = -1;
    for (let i = 0; i < N; i++) {
      const it = S.board[i];
      if (it && !it.g && !used.has(i) && it.c === need.c && it.l === need.l && !(window.WH && !WH.usable(it))) { if (hit < 0 || (it && !it.old && S.board[hit].old)) hit = i; if (!it.old) break; }
    }
    found.push(hit);
    if (hit >= 0) used.add(hit);
  }
  return found;
}
function deliver(id) {
  const o = OL().find(x => x.id === id);
  if (!o) return;
  const found = matchOrder(o);
  if (found.some(i => i < 0)) { sfx.nope(); return; }
  const card = document.querySelector(`.order[data-id="${id}"]`);
  const stalePen = window.HARD ? HARD.stalePenalty(found) : 0;
  found.forEach((i, k) => { flyFrom(i, card, k * 70); S.board[i] = null; if (selected === i) selected = -1; });
  if (stalePen) setTimeout(() => toast(tt`🥀 Частина продуктів зачерствіла — −${stalePen} 🪙`), 1200);
  if (card && FARM) {
    const cr = card.getBoundingClientRect();
    setTimeout(() => { flyMany(cr, "🪙", "coins", 4); if (o.stars) flyMany(cr, "⭐", "stars", o.stars + 1, 120); }, 380);
  }
  S.coins += Math.max(1, o.coins - stalePen);
  S.stars += o.stars;
  S.ordersDone++;
  if (o.ev && window.EV) EV.onDeliver(o, card);
  window.QUEST && QUEST.onDeliver(o);
  window.QUEST && QUEST.track("deliver");
  window.WD && WD.onDeliver(o);
  window.XTRA && XTRA.onDeliver(o, card);
  window.ALB && ALB.onDeliver(o);
  window.PATH && PATH.onDeliver(o);
  window.TOLOKA && TOLOKA.onDeliver(o);
  window.CONTEST && CONTEST.onDeliver(o);
  window.RARE && RARE.onDeliver(o);
  window.LOVE && LOVE.onDeliver(o);
  window.WOOD && WOOD.onDeliver(o);
  window.GUESTS && GUESTS.onDeliver(o);
  window.FASH && FASH.onDeliver(o);
  if (o.dish) window.QUEST && QUEST.track("dish");
  if (o.urgent) window.QUEST && QUEST.track("urgent");
  sfx.deliver();
  bubble(CHARS[o.ch], pick(CHARS[o.ch].thanks), card);
  setOL(OL().filter(x => x.id !== id));
  if (S.ordersDone % 7 === 0) placeItem({ c: "chest", l: 0 });          // подарунок — за кожне 7-ме замовлення
  gainXp(o.xp);
  if (S.tut === 2) setTut(3);
  window.TOUR && TOUR.ev("give");
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
  if (window.ECON && !ECON.taskReady(S.chapter, S.task)) { sfx.nope(); toast(tt`Бракує: ` + ECON.taskMissing(S.chapter, S.task)); return; }
  if (S.stars < t.cost) { sfx.nope(); toast(tt`Потрібно ще ` + (t.cost - S.stars) + tt` ⭐ — виконуй замовлення сусідів`); return; }
  if (window.ECON) ECON.payTask(S.chapter, S.task);
  S.stars -= t.cost;
  S.task++;
  if (S.tut === 3) setTut(4);
  window.TOUR && TOUR.ev("task");
  sfx.deliver();
  renderTop(); renderStory(true);
  $("tab-story").scrollTo({ top: 0, behavior: "smooth" });
  save();
  const finished = S.task >= ch.tasks.length;
  playDialog(t.lines, () => {
    if (!finished) return;
    // кінець розділу — знімок готового дворика у фотоальбом
    if (window.PHOTO) PHOTO.take(Math.min(S.chapter, STORY.length - 1), "chapter", true);
    const r = ch.reward || {};
    confetti(); sfx.level();
    const parts = [];
    if (r.gen && !S.gens.includes(r.gen)) { S.gens.push(r.gen); placeItem({ g: r.gen }); parts.push(GENS[r.gen].icon + " " + GENS[r.gen].name); }
    if (r.chest !== undefined) { placeItem({ c: "chest", l: r.chest }); parts.push(CHAINS.chest.items[r.chest][0]); }
    if (r.souv && window.VILLAGE) parts.push(VILLAGE.give(r.souv));          // сувенір розділу села — у «Двір на свій смак»
    regen(); S.energy += ENERGY_BONUS.chapter; parts.push("+" + ENERGY_BONUS.chapter + " ⚡");
    S.chapter++; S.task = 0;
    if (window.ENDLESS) ENDLESS.ensure(S.chapter + 5);
    if (S.chapter >= STORY.length) { S.storyDone = true; S.chapter = STORY.length - 1; S.task = STORY[S.chapter].tasks.length; }
    save();
    modal({
      title: tt`Розділ завершено! 🎉`,
      html: tt`<p class="chapter-done">«${ch.title}»</p><p>Нагорода чекає на дошці:</p><p class="rewards">${parts.join(" &nbsp; ")}</p>` +
        (r.gen ? tt`<p class="hint-s">Новий генератор! Тепер сусіди замовлятимуть і ${CHAINS[GENS[r.gen].chain].name.toLowerCase()}.</p>` : "") +
        (r.souv ? tt`<p class="hint-s">🎨 Сувенір розділу — у «Двір на свій смак» (кнопка 🎨 у «Дворику»).</p>` : "") +
        (window.PHOTO && window.Yard3D ? tt`<p class="hint-s">📷 Дворик сфотографовано — знімок у фотоальбомі (профіль).</p>` : ""),
      buttons: [{ label: S.storyDone ? tt`Ура! 💛` : tt`Далі ›`, onClick: () => {
        renderAll();
        if (!S.storyDone) playDialog(STORY[S.chapter].intro);
        else playDialog([["halya", tt`Це ще не кінець, {name}! Нові розділи вже пишуться 💌 А поки — сусіди чекають на замовлення!`]]);
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
  if (window.LOGIN) { save(); LOGIN.show(S.streak); return; }
  const big = S.streak % 3 === 0;
  regen(); S.energy += ENERGY_BONUS.daily;
  placeItem({ c: "chest", l: big ? 1 : 0 });
  save();
  modal({
    title: tt`Щоденний подарунок 🎁`,
    html: tt`<div class="big-emoji">${big ? "📦" : "🎁"}</div><p>День ${S.streak} поспіль! ${big ? tt`Кожен третій день — велика посилка!` : ""}</p><p class="rewards">+${ENERGY_BONUS.daily} ⚡ &nbsp; ${big ? "📦" : "🎁"}</p>`,
    buttons: [{ label: tt`Забрати 💛`, onClick: () => { renderAll(); } }]
  });
}
function teaReady() { return Date.now() - S.teaAt >= TEA_BREAK_MS; }
function takeTea() {
  if (!teaReady()) return;
  S.teaAt = Date.now();
  addEnergy(TEA_BREAK_ENERGY);
  sfx.pop();                                   // не «монетковий» звук — чай дає лише енергію
  toast(tt`☕ Смачного! +` + TEA_BREAK_ENERGY + tt` ⚡ · наступна перерва за ` + Math.round(TEA_BREAK_MS / 3600000) + tt` год`);
}
function hm(ms) {
  const m = Math.ceil(ms / 60000);
  if (m < 60) return m + tt` хв`;
  return Math.floor(m / 60) + tt` год` + (m % 60 ? " " + (m % 60) + tt` хв` : "");
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
  if (teaReady()) btns.push({ label: tt`☕ Перерва на чай: +` + TEA_BREAK_ENERGY + tt` ⚡ (раз на ` + Math.round(TEA_BREAK_MS / 3600000) + tt` год)`, onClick: takeTea });
  else btns.push({ label: tt`☕ Чай буде за ` + hm(TEA_BREAK_MS - (Date.now() - S.teaAt)), disabled: true });
  const p = energyPrice();
  if (p) btns.push({ label: tt`Купити ` + ENERGY_SHOP.amount + tt` ⚡ за ` + p + " 🪙", cls: "ghost", disabled: S.coins < p, onClick: () => buy("energy") });
  if (window.PAY) btns.push({ label: tt`💎 Більше енергії · від 39 ₴`, cls: "ghost", onClick: () => PAY.offers(["en60", "en160", "unlim", "pack"], tt`Більше енергії ⚡`) });
  if (withWait) btns.push({ label: tt`Зачекаю 💤`, cls: "ghost" });
  return btns;
}
let noEnergyTick = null;
function showNoEnergy() {
  sfx.nope();
  regen();
  const next = () => mmss(Math.max(0, ENERGY_REGEN_MS - (Date.now() - S.energyAt)));
  modal({
    title: tt`Енергія скінчилась 😴`,
    html: tt`<div class="big-emoji">🫖</div>
      <p>Город відпочиває. Наступна ⚡ буде за <b id="neNext">${next()}</b>,<br>повна шкала (${ENERGY_MAX} ⚡) — за <b id="neFull">${hm(energyFullIn())}</b>.</p>
      <p class="hint-s">Поки чекаєш — об'єднуй те, що вже є на дошці, і виконуй замовлення.${energyPrice() ? "" : tt`<br>Енергію на сьогодні вже купувала — завтра крамничка знову відкриється.`}</p>`,
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
  { id: "energy", icon: "⚡", title: ENERGY_SHOP.amount + tt` енергії`, price: 0 },
  { id: "chest0", icon: "🎁", title: tt`Подарунок`, price: 250 },
  { id: "chest1", icon: "📦", title: tt`Посилка`, price: 650 },
  { id: "star",   icon: "⭐", title: tt`Зірочка для ремонту`, price: 700 },
  { id: "chest2", icon: "💝", title: tt`Скриня-сюрприз`, price: 1400 }
];
function buy(id) {
  const s = SHOP.find(x => x.id === id);
  const price = id === "energy" ? energyPrice() : (window.ECON ? ECON.price("shop-" + id, s.price) : s.price);
  if (!price) { sfx.nope(); toast(tt`Енергію на сьогодні вже купила — завтра знову можна 🌙`); return; }
  if (S.coins < price) { sfx.nope(); toast(tt`Не вистачає монеток 🪙`); return; }
  S.coins -= price;
  if (id === "energy") { regen(); S.energy += ENERGY_SHOP.amount; S.energyBuys.n++; }
  else if (id === "star") S.stars += 1;
  if (id !== "energy" && window.ECON) ECON.bought("shop-" + id);
  else placeItem({ c: "chest", l: +id.slice(-1) });
  sfx.coin();
  toast(tt`Куплено: ` + s.icon + " " + s.title);
  renderAll(); save();
}

/* ---------------- Продаж ---------------- */
function sellSelected() {
  const it = S.board[selected];
  if (!it || it.g) return;
  if (window.ECON && !ECON.canSell()) { sfx.nope(); toast(tt`Сьогодні вже продано 10 предметів — ярмарок закрився до завтра 🌙`); return; }
  window.ECON && ECON.onSold();
  const price = sellPrice(it);
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
  const ul = window.PAY ? PAY.unlimLeft() : 0;
  if (ul) { t.textContent = "∞ " + mmss(ul); t.hidden = false; }
  else if (S.energy < ENERGY_MAX) {
    t.textContent = mmss(ENERGY_REGEN_MS - (Date.now() - S.energyAt));
    t.hidden = false;
  } else t.hidden = true;
  $("coins").textContent = S.coins;
  $("stars").textContent = S.stars;
  renderNavBadge();          // позначка над «Двориком» — завжди за поточними зірочками й монетами
}

function renderOrders() {
  const box = $("orders");
  neededIdx = new Set();
  box.innerHTML = "";
  const sideMode = !!(S.sideOn && !S.woodOn && S.side && window.SIDE);
  box.classList.toggle("side", sideMode); if (sideMode) box.classList.remove("more");
  if (sideMode) { SIDE.renderGoals(box); return; }
  OL().forEach(o => {
    const found = matchOrder(o);
    const ready = found.every(i => i >= 0);
    found.forEach(i => { if (i >= 0) neededIdx.add(i); });
    const ch = CHARS[o.ch];
    const el = document.createElement("div");
    const pic = FARM && PORTRAITS.includes(ch.key);
    el.className = "order" + (ready ? " ready" : "") + (pic ? " pic" : "") + (o.ev ? " ev" : "") + (o.paw ? " paw" : "") + (o.rare ? " rare" : "") + (o.seas ? " seas" : "") + (o.wood ? " woody" : "") + (o.urgent ? " urgent" : "") + (o.dish ? " dish" : "");
    el.dataset.id = o.id;
    const itemsHtml = `<div class="o-items">${o.items.map((it, k) => `<span class="o-item${found[k] >= 0 ? " have" : ""}">${itemIcon(it)}</span>`).join("")}</div>`;
    el.innerHTML = (pic
      ? `<div class="o-who"><span class="o-name">${shortName(ch.name)}</span></div>` +
        `<div class="o-body"><div class="o-pic"><img src="portraits/${ch.key}.webp" alt=""></div>${itemsHtml}</div>`
      : `<div class="o-who"><span class="o-ava">${face(ch, "mini")}</span><span class="o-name">${shortName(ch.name)}</span></div>` + itemsHtml) +
      (ready
        ? tt`<button class="o-btn">Віддати</button>`
        : `<div class="o-rew">🪙${o.coins} · ${o.ev ? "❄️" + o.pts : o.paw ? "🐾" + XTRA.catProg() : "⭐".repeat(o.stars)}</div>`) +
      (o.paw ? `<span class="o-paw">${CAT_ICON}</span>` + (o.bonus ? `<span class="o-bonus">+${XTRA.bonusIcon(o)}</span>` : "") : "") +
      (window.TP ? TP.badge(o) : "") +
      (o.until || o.catUntil ? `<span class="o-timer" data-until="${o.until || o.catUntil}">⏰ ${MECH.hhmm((o.until || o.catUntil) - Date.now())}</span>` : "");
    el.addEventListener("click", e => {
      if (ready && e.target.closest(".o-btn")) { deliver(o.id); return; }
      if (!ready && window.TOUR && !S.woodOn) { TOUR.recipe(o); return; }   // «Як зібрати» — ланцюжок крок за кроком
      bubble(ch, ch.ask[o.line] + "  " + o.items.map(it => itemIcon(it) + " " + itemName(it)).join(", ") + (o.paw && o.bonus ? tt` · бонус: ` + XTRA.bonusIcon(o) : ""), el);
    });
    box.appendChild(el);
  });
  if (window.XTRA) {
    box.insertAdjacentHTML("beforeend", XTRA.slotCardHtml());
    const sl = box.querySelector(".slot-lock"); if (sl) sl.onclick = () => XTRA.buyQueue();
  }
  box.classList.toggle("more", box.children.length > 3);
  // підсвітити потрібні предмети на дошці
  document.querySelectorAll(".tile").forEach(t => t.classList.toggle("needed", neededIdx.has(+t.dataset.i)));
}

function renderBoard() {
  const board = $("board");
  if (board.children.length !== N) {
    board.innerHTML = "";
    for (let i = 0; i < N; i++) { const c = document.createElement("div"); c.className = "cell"; c.dataset.i = i; board.appendChild(c); }
  }
  // одноразові анімації забираємо й очищаємо одразу: навіть якщо якась клітинка зламається,
  // наступне відмальовування не повторить старі вильоти з генератора
  const spawnNow = new Map(spawnFrom), popNow = new Set(popIdx), mergedNow = new Set(mergedIdx);
  popIdx.clear(); spawnFrom.clear(); mergedIdx.clear();
  for (let i = 0; i < N; i++) {
    const cell = board.children[i], it = S.board[i];
    try {
      cell.classList.toggle("sel", i === selected);
      const shut = window.HARD ? HARD.shutKey(i) : null;
      cell.classList.toggle("shut", !!shut); cell.classList.toggle("shut-next", !!shut && shut !== "shut");
      if (shut) { if (cell.dataset.key !== shut) { cell.dataset.key = shut; cell.innerHTML = HARD.shutHtml(i); } continue; }
      const key = it ? (MECH.tileKey(it) || it.c + ":" + it.l + (it.old ? ":o" : "") + (window.WH ? WH.tileKey(it) : "")) : "";
      if (cell.dataset.key === key && !popNow.has(i) && !spawnNow.has(i) && !mergedNow.has(i)) { cell.firstChild && cell.firstChild.classList.toggle("needed", neededIdx.has(i)); MECH.decorate(cell.firstChild, it); window.WH && WH.decorate(cell.firstChild, it); window.DOG && DOG.decorate(cell.firstChild, it); continue; }
      cell.dataset.key = key;
      cell.innerHTML = "";
      if (!it) continue;
      const t = document.createElement("div");
      const from = spawnNow.has(i) && FARM ? cellRect(spawnNow.get(i)) : null, to = from && cellRect(i);
      const anim = from && to ? " spawn" : mergedNow.has(i) && FARM ? " merged" : popNow.has(i) ? " pop" : "";
      t.className = "tile" + (it.g ? " gen" : "") + (it.c && CHAINS[it.c] && CHAINS[it.c].open ? " chest" : "") + (it.c === "dish" ? " dish" : "") +
        (it.c && CHAINS[it.c] && CHAINS[it.c].collect ? " collect" : "") + (isMax(it) && PRODUCT_CHAINS.includes(it.c) ? " max" : "") + (window.HARD && HARD.stale(it) ? " stale" : "") +
        anim + (neededIdx.has(i) ? " needed" : "");
      if (from && to) { t.style.setProperty("--fx", (from.left - to.left) + "px"); t.style.setProperty("--fy", (from.top - to.top) + "px"); }
      if (anim) setTimeout(() => { t.classList.remove("spawn", "merged", "pop"); t.style.removeProperty("--fx"); t.style.removeProperty("--fy"); }, 1200);   // запасний варіант, якщо animationend не прийшов
      t.dataset.i = i;
      if (it.g) t.dataset.gen = it.g;
      t.textContent = itemIcon(it);
      if (it.g && !(GENS[it.g] && GENS[it.g].pet)) { const b = document.createElement("span"); b.className = "gen-badge"; b.textContent = "⚡"; t.appendChild(b); }
      cell.appendChild(t);
      MECH.decorate(t, it);
      window.WH && WH.decorate(t, it);
      window.DOG && DOG.decorate(t, it);
    } catch (e) {
      cell.dataset.key = "";                       // наступного разу спробуємо намалювати знову
      logErr(e, tt`клітинка ` + i + (it ? " " + (it.g ? "g:" + it.g : it.c + ":" + it.l) : ""));
    }
  }
  try { window.SOIL && SOIL.badge(); } catch (e) { logErr(e, "SOIL.badge"); }
}

/* журнал помилок — останні кілька, показуються в налаштуваннях під версією гри */
function logErr(e, where) {
  try {
    const sl = e && e.stack ? (String(e.stack).split("\n").find(l => /\.js/.test(l)) || "") : "";
    const at = (sl.match(/(js\/[\w.-]+\.js)[^:]*:(\d+)/) || []).slice(1).join(":");
    const msg = ((where ? where + ": " : "") + (e && e.message ? e.message : String(e)) + (at ? " @ " + at : "")).slice(0, 220);
    const L = JSON.parse(localStorage.getItem("dvoryk_errs") || "[]");
    if (L[0] && L[0].m === msg) { L[0].n = (L[0].n || 1) + 1; L[0].t = Date.now(); } else L.unshift({ m: msg, v: APP_VER, t: Date.now() });
    localStorage.setItem("dvoryk_errs", JSON.stringify(L.slice(0, 5)));
  } catch (_) {}
}
function errsHtml() {
  let L = []; try { L = JSON.parse(localStorage.getItem("dvoryk_errs") || "[]"); } catch (_) {}
  L = L.filter(x => x.v === APP_VER);              // лише помилки поточної версії
  if (!L.length) return "";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return `<p class="hint-s" style="font-size:10px;opacity:.6;word-break:break-all;text-align:left">⚠️ ${L.map(x => esc(x.m) + (x.n > 1 ? " ×" + x.n : "")).join("<br>⚠️ ")}</p>`;
}
window.addEventListener("error", e => logErr(e.error || e.message));
window.addEventListener("unhandledrejection", e => logErr(e.reason));

function renderInfo() {
  const box = $("info");
  const it = S.board[selected];
  if (!it) {
    const hb = window.XTRA ? XTRA.hintBtn() : "";
    // поруч із кнопкою сховку підказці тісно — тоді лишаємо тільки кнопку
    box.innerHTML = (hb ? "" : tt`<span class="info-hint">Тапни на предмет — підкажу, що це</span>`) + hb;
    const so = $("storeOpen"); if (so) so.onclick = () => XTRA.openStore();
    return;
  }
  let text = "", btn = "";
  if (it.lock) {
    text = tt`<b>Павутиння</b><small>Об'єднай щось поруч${it.lock > 1 ? tt` ще ` + it.lock + tt` рази` : ""} — під ним сюрприз</small>`;
  } else if (it.st) {
    text = tt`<b>Піч 🔥</b><small>Тапни, щоб приготувати страву</small>`;
  } else if (it.g && GENS[it.g] && GENS[it.g].pet && window.DOG) {
    text = DOG.info();
  } else if (it.g) {
    const ch = CHAINS[GENS[it.g].chain];
    MECH.refresh(it);
    const lv = MECH.gl(it) > 1 ? tt` <span class="lvl-tag">рів. ${MECH.gl(it)}</span>` : "";
    text = MECH.resting(it)
      ? tt`<b>${GENS[it.g].name}</b>${lv}<small>💤 Відпочиває ще ${Math.ceil((it.rest - Date.now()) / 60e3)} хв</small>`
      : tt`<b>${GENS[it.g].name}</b>${lv}<small>Заряд ${it.ch}/${MECH.cap(it)}${window.HARD ? HARD.genInfo(it) : ""}${window.WH ? WH.genInfo(it) : ""}${window.CRAFT ? CRAFT.genInfo(it) : ""}${window.FARM2 ? FARM2.genInfo(it) : ""}${window.SOIL ? SOIL.genInfo(it) : ""} · тапай, щоб отримати ${ch.items[0][0]} (−1 ⚡)</small>`;
  } else if (it.c === "dish") {
    text = tt`<b>${itemName(it)}</b><small>Страву просять сусіди за ⭐⭐</small>`;
    btn = tt`<button class="sell${window.ECON && !ECON.canSell() ? " dim" : ""}" id="sellBtn"><small>продати</small><span>+${sellPrice(it)}🪙</span>${window.ECON && ECON.sellNote() ? `<i class="sell-n">${ECON.sellNote().split("/")[0]}</i>` : ""}</button>`;
  } else if (CHAINS[it.c].open) {
    text = tt`<b>${itemName(it)}</b><small>Тапни ще раз, щоб відкрити!${isMax(it) ? "" : tt` Або об'єднай два однакові`}</small>`;
  } else if (CHAINS[it.c].trash) {
    text = tt`<b>${itemName(it)}</b><small>Виснажена земля дала брак — його можна лише викинути</small>`;
    btn = tt`<button class="sell" id="trashBtn"><small>викинути</small><span>🗑️</span></button>`;
  } else if (CHAINS[it.c].collect) {
    text = tt`<b>${itemName(it)}</b><small>Тапни ще раз, щоб забрати +${CHAINS[it.c].values[it.l]} ${it.c === "coin" ? "🪙" : "⚡"}</small>`;
  } else {
    const ch = CHAINS[it.c];
    const next = (isMax(it) ? tt`Найвищий рівень! 🏆` : tt`Два таких → ${ch.items[it.l + 1][0]} ${ch.items[it.l + 1][1]}`) + (window.HARD ? HARD.freshInfo(it) : "");
    text = tt`<b>${itemName(it)} <span class="lvl-tag">рів. ${it.l + 1}</span></b><small>${next}</small>`;
    btn = tt`<button class="sell${window.ECON && !ECON.canSell() ? " dim" : ""}" id="sellBtn"><small>продати</small><span>+${sellPrice(it)}🪙</span>${window.ECON && ECON.sellNote() ? `<i class="sell-n">${ECON.sellNote().split("/")[0]}</i>` : ""}</button>`;
  }
  box.innerHTML = `<span class="info-ic">${itemIcon(it)}</span><span class="info-txt">${text}</span>${window.XTRA ? XTRA.storeBtn(it) : ""}${window.WH && it.g ? WH.genButton(it) : ""}${btn}`;
  const shb = $("sharpBtn"); if (shb) shb.onclick = () => WH.sharpenModal(selected);
  const stb = $("storeBtn"); if (stb) stb.onclick = () => XTRA.stash(selected);
  const tb = $("trashBtn"); if (tb && window.SOIL) tb.onclick = () => SOIL.trash(selected);
  const sb = $("sellBtn");
  if (sb) sb.onclick = () => {
    if (it.l >= 3 && !sb.dataset.sure) { sb.dataset.sure = 1; sb.innerHTML = tt`<small>точно?</small>Так`; return; }
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
  if (S.sideOn) { sfx.nope(); toast(tt`Це для городу — повернись на город 🪴, щоб забрати`); return; }
  const i = emptyNear(Math.floor(N / 2));
  if (i < 0) { sfx.nope(); toast(tt`Звільни місце на дошці 🙂`); return; }
  const it = S.inbox.shift();
  S.board[i] = it; discover(it); popIdx.add(i);
  sfx.pop();
  renderBoard(); renderInbox(); renderOrders(); save();
}

/* Хто з сусідів стоїть у дворику: ті, хто найбільше говорить у розділі (до трьох) */
/* Зимове вбрання: сусід отримав теплу річ і зараз зима (зимовий розділ або справжні морози) */
/* зимова сцена: сніжний розділ або справжні морози (15 грудня — 1 березня) */
function sceneWinter(ch) {
  const s = window.WD && WD.season();
  return !!(ch && (ch.winter || /Зимов/.test(ch.title))) || !!(s && s.phase === "winter") ||
    !!(ch && !ch.indoor && window.ENV && ENV.season() === "winter");            // з грудня по лютий — сніг на всіх вуличних локаціях
}
/* узимку в дворику всі, хто має зимове вбрання, — у ньому (хто змерз без теплої речі, той на лікарняному й не виходить) */
function winterLook(who, ch) { return PORTRAITS_WINTER.includes(who) && sceneWinter(ch); }
function yardPeople(ch, all) {
  const count = {};
  [ch.intro || [], ...ch.tasks.map(t => t.lines || [])].forEach(lines => lines.forEach(([who]) => {
    if (CHARS[who] && who !== "cat" && PORTRAITS_FULL.includes(who) && !(window.WD && WD.isSick(who))) count[who] = (count[who] || 0) + 1;
  }));
  // хто вже стоїть у дворику окремою фігуркою (наречені) — двічі не ставимо
  all.forEach(d => { if (d.pic) delete count[d.pic.split("-")[0]]; });
  const wed = window.FAM && FAM.wedding();              // весілля — гостей повен двір
  if (wed) ["halya", "stepan", "olya", "marichka", "andriy", "liza", "ivan", "taras", "iryna"].forEach(w => { if (PORTRAITS_FULL.includes(w) && !(window.WD && WD.isSick(w))) count[w] = (count[w] || 0) + 0.5; });
  const who = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, wed ? 7 : 3);
  const slots = [[27, 72], [73, 72], [36, 87], [64, 87], [17, 60], [83, 60], [40, 76], [60, 76], [12, 74], [88, 74], [24, 86], [76, 86], [50, 64], [8, 66], [92, 66], [30, 94], [70, 94], [50, 92]];
  const taken = all.filter(d => d.y >= 34 && (!d.who || d.hero)).map(d => [d.x, d.y, d.s, !!d.hero]);
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
    const wl = winterLook(w, ch);
    const fl = !wl && window.FASH && FASH.look(w);      // стрій з гардероба (взимку — тепле вбрання важливіше)
    out.push({ key: "p-" + w + (wl ? "-w" : fl ? "-" + fl : ""), who: wl ? w + "-winter" : fl || w, x: free[0], y: free[1], s });
  }
  return out;
}
/* ---------- Місцини: який розділ показувати ---------- */
let viewCh = null;                       // індекс розділу, який переглядаємо (null — поточний)
const curIdx = () => Math.min(S.chapter, STORY.length - 1);
const locOf = i => STORY[i].loc || "yard";
function lastIdxOf(loc) { let r = -1; for (let i = 0; i <= curIdx(); i++) if (locOf(i) === loc) r = i; return r; }
function renderLocBar() {
  const bar = $("locBar");
  const open = LOCS.filter(l => lastIdxOf(l.id) >= 0);
  bar.hidden = open.length < 2;
  if (bar.hidden) return;
  const shown = viewCh === null ? curIdx() : viewCh;
  bar.innerHTML = open.map(l => `<button class="loc-chip${locOf(shown) === l.id ? " on" : ""}" data-loc="${l.id}"><span>${l.icon}</span>${l.name}</button>`).join("");
  bar.querySelectorAll(".loc-chip").forEach(b => b.onclick = () => {
    const i = b.dataset.loc === locOf(curIdx()) ? null : lastIdxOf(b.dataset.loc);
    if (i === viewCh) return;
    viewCh = i; sfx.pop(); renderStory();
  });
}
function renderStory(animateLast) {
  if (viewCh !== null && (viewCh >= curIdx() || animateLast)) viewCh = null;
  const idx = viewCh === null ? curIdx() : viewCh;
  const ch = STORY[idx];
  const doneN = idx < curIdx() ? ch.tasks.length : S.task;
  renderLocBar();
  const scene = $("scene");
  const sky = window.ENV ? ENV.sky(ch) : ch.sky;          // небо за порою доби
  scene.style.setProperty("--sky1", sky[0]);
  scene.style.setProperty("--sky2", sky[1]);
  scene.style.setProperty("--ground", ch.ground);
  const removed = new Set();
  const added = [];
  ch.tasks.slice(0, doneN).forEach((t, k) => {
    (t.remove || []).forEach(r => removed.add(r));
    (t.add || []).forEach((a, j) => added.push(Object.assign({ fresh: animateLast && k === doneN - 1, key: "t" + k + "-" + j }, a)));
  });
  const all = [
    ...ch.base.map((d, j) => Object.assign({ key: "b" + j }, d)),
    ...ch.clutter.map((d, j) => Object.assign({ key: "c" + j }, d)).filter(c => !removed.has(c.id)),
    ...added
  ];
  if (window.Yard3D) {
    // котик у светрику, якщо йому видали светрик і зараз зима
    if (winterLook("cat", ch)) all.forEach(d => { if (d.e === "🐱") { d.catPic = "cat-winter"; d.key += "-w"; } });
    if (window.DECOR) all.push(...DECOR.yard(ch));
    if (window.FAM) all.push(...FAM.yard(ch));
    if (window.HOL) all.push(...HOL.yard(ch));
    if (window.ENV) all.push(...ENV.yard(ch, all));
    if (window.DOG) all.push(...DOG.yard(ch, all));            // Бровко            // місяць, ліхтарики, сезонні дрібниці                // прикраси, які поставила сама
    if (window.HERO) all.push(...HERO.yard(ch, all));          // героїня — попереду, сусіди стають довкола
    all.push(...yardPeople(ch, all));
    if (window.GUESTS) all.push(...GUESTS.yard(ch, all));       // гість села
    if (window.QUEST && !ch.loc) all.push(...QUEST.yardGifts(ch, all));
    // справжній 3D-дворик
    scene.classList.add("is3d");
    if (!scene.querySelector("canvas")) scene.innerHTML = "";
    Yard3D.mount(scene);
    Yard3D.render(idx, ch, all, !!animateLast);
    if (window.ENV) ENV.fx(scene, ch);
    Yard3D.setActive(!$("tab-story").hidden);
  } else {
    const deco = d => `<span class="deco${d.fresh ? " fresh" : ""}" style="left:${d.x}%;top:${d.y}%;font-size:${d.s}cqw">${d.e}</span>`;
    scene.innerHTML = `<div class="ground"></div>` + all.map(deco).join("");
  }

  $("chapterTitle").textContent = tt`Розділ ${idx + 1}. ${ch.title}`;
  const done = Math.min(doneN, ch.tasks.length);
  $("chapterBar").style.width = (done / ch.tasks.length * 100) + "%";
  $("chapterProg").textContent = done + "/" + ch.tasks.length;

  const list = $("tasks");
  list.innerHTML = "";
  ch.tasks.forEach((t, k) => {
    const row = document.createElement("div");
    const state = k < doneN ? "done" : k === doneN ? "now" : "locked";
    row.className = "task " + state;
    row.innerHTML = `<span class="t-ic">${state === "done" ? "✅" : state === "now" ? "🔨" : "🔒"}</span>` +
      `<span class="t-title">${t.title}</span>` +
      (state === "now" ? `<button class="t-btn${(window.ECON ? ECON.taskReady(idx, k) : S.stars >= t.cost) ? "" : " dim"}">${window.ECON ? ECON.taskLabel(idx, k) : t.cost + " ⭐"}</button>` :
        state === "locked" ? `<span class="t-cost">${window.ECON ? ECON.taskLabel(idx, k) : t.cost + " ⭐"}</span>` : "");
    const btn = row.querySelector(".t-btn");
    if (btn) btn.onclick = doTask;
    list.appendChild(row);
  });
  if (idx < curIdx()) {
    const note = document.createElement("div");
    note.className = "loc-note";
    note.innerHTML = tt`Цю місцину вже відновлено 💛 <button class="btn small">↩ До поточного розділу</button>`;
    note.querySelector("button").onclick = () => { viewCh = null; renderStory(); };
    list.appendChild(note);
  }
  $("storyEnd").hidden = !S.storyDone || idx < curIdx();
  $("replayIntro").onclick = () => playDialog(ch.intro);
  const sb = $("snapBtn"); if (sb) sb.onclick = () => window.PHOTO && PHOTO.manual();
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
      title += `<small class="s-sub">${left ? tt`сьогодні ще ` + left + tt` з ` + ENERGY_SHOP.prices.length : tt`завтра знову`}</small>`;
    }
    if (s.id !== "energy" && window.ECON) price = ECON.price("shop-" + s.id, s.price);
    lbl = price ? price + " 🪙" : "🌙";
    row.innerHTML = `<span class="s-ic">${s.icon}</span><span class="s-title">${title}</span><button class="s-btn${price && S.coins >= price ? "" : " dim"}">${lbl}</button>`;
    row.querySelector("button").onclick = () => buy(s.id);
    box.appendChild(row);
  });
  if (window.DEALS) DEALS.render();
  const pb = $("payBox");
  if (pb && window.PAY && !pb.dataset.ok) { pb.innerHTML = PAY.html(); PAY.bind(pb); pb.dataset.ok = 1; }
  const tb = $("teaBtn");
  if (teaReady()) { tb.textContent = tt`☕ Перерва на чай: +` + TEA_BREAK_ENERGY + tt` ⚡ безкоштовно`; tb.classList.remove("dim"); }
  else { tb.textContent = tt`☕ Наступна перерва на чай за ` + hm(TEA_BREAK_MS - (Date.now() - S.teaAt)); tb.classList.add("dim"); }
}

function renderCollection() {
  const box = $("collList");
  let have = 0, total = 0;
  const dn = window.XTRA ? XTRA.discCount() : 0;
  box.innerHTML = (window.ALB ? ALB.entryHtml() : "") +
    (dn ? tt`<button class="btn small disc-all" id="discAll">🎁 Забрати нагороди за нові предмети (${dn})</button>` : "") +
    (window.QUEST ? QUEST.friendsPanelHtml() : "");
  box.querySelectorAll(".fr-row").forEach(b => b.onclick = () => QUEST.friendModal(b.dataset.who));
  const ao = $("albOpen"); if (ao) ao.onclick = () => ALB.panel();
  const da = $("discAll"); if (da) da.onclick = () => XTRA.claimAll();
  PRODUCT_CHAINS.forEach(c => {
    const ch = CHAINS[c];
    const sec = document.createElement("div");
    sec.className = "coll-sec";
    const items = ch.items.map((x, l) => {
      total++;
      const got = S.collection[c + ":" + l], gift = window.XTRA && XTRA.discReady(c + ":" + l);
      if (got) have++;
      return `<span class="coll-it${got ? "" : " no"}${gift ? " gift" : ""}" data-k="${c}:${l}" title="${got ? x[1] : "?"}">${got ? x[0] : "❔"}</span>`;
    }).join("");
    const locked = !unlockedChains().includes(c);
    sec.innerHTML = `<div class="coll-h">${ch.name}${locked ? tt` <small>🔒 відкриється за сюжетом</small>` : ""}</div><div class="coll-row">${items}</div>`;
    box.appendChild(sec);
  });
  if (window.UNL) box.insertAdjacentHTML("beforeend", UNL.roadHtml());
  box.querySelectorAll(".coll-it.gift").forEach(el => el.onclick = () => {
    const n = XTRA.claimDisc(el.dataset.k, el);
    if (n) { sfx.coin(); floatEl(el, "+" + n + " 🪙"); }
    renderTop(); renderCollection(); renderNavBadge(); save();
  });
  $("collProg").textContent = have + " / " + total;
}

function renderNavBadge() {
  const ch = STORY[S.chapter];
  const can = !S.storyDone && ch && ch.tasks[S.task] && (window.ECON ? ECON.taskReady(S.chapter, S.task) : S.stars >= ch.tasks[S.task].cost);
  $("navStoryDot").hidden = !can;
  const cd = $("navCollDot"); if (cd) cd.hidden = !(window.XTRA && XTRA.discCount());
  const md = $("menuDot"); if (md) md.hidden = [...document.querySelectorAll(".nav .dot")].every(d => d.hidden);
}

/* ---------------- Підказки-навчання ---------------- */
const TUT = [
  tt`👆 Тапни на 🪴 Грядку — вона дасть насіннячко`,
  tt`✌️ Перетягни 🌱 на такий самий 🌱 — вийде 🌿`,
  tt`🧺 Збери, що просять сусіди, і натисни «Віддати»`,
  tt`🏡 Зірочки ⭐ витрачай у «Дворику» на ремонт`
];
function setTut(n) { S.tut = n; renderTut(); }
function renderTut() {
  if (window.TOUR) { TOUR.render(); return; }      // покрокове навчання з рукою — js/tour.js
  const h = $("tutHint");
  if (S.tut < TUT.length && !S.sideOn) { h.textContent = TUT[S.tut]; h.hidden = false; }
  else h.hidden = true;
}

/* ---------------- Ефекти ---------------- */
function cellRect(i) { const c = $("board").children[i]; return c ? c.getBoundingClientRect() : null; }
function floatEl(el, text) {
  const r = el.getBoundingClientRect();
  const f = document.createElement("div");
  f.className = "float"; f.textContent = text;
  f.style.left = (r.left + r.width / 2) + "px"; f.style.top = r.top + "px";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}
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
  t.textContent = gx(text); t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200);
}
let bubbleT = null;
function bubble(ch, text, anchor) {
  const b = $("bubble");
  b.innerHTML = `<span class="b-ava">${face(ch, "mini")}</span><span><b>${ch.name}</b> ${window.QUEST && S ? QUEST.heartsTag(ch.key) : ""}<br>${fmtName(text)}</span>`;
  b.classList.add("show");
  clearTimeout(bubbleT); bubbleT = setTimeout(() => b.classList.remove("show"), 2600);
}

/* ---------------- Модалки й діалоги ---------------- */
function modal({ title, html, buttons }) {
  const m = $("modal");
  m.querySelector(".m-title").textContent = gx(title);
  m.querySelector(".m-body").innerHTML = gx(html);
  const bb = m.querySelector(".m-btns");
  bb.innerHTML = "";
  (buttons || [{ label: tt`Добре` }]).forEach(b => {
    const el = document.createElement("button");
    el.className = "btn " + (b.cls || "");
    el.textContent = b.label;
    el.disabled = !!b.disabled;
    el.onclick = () => { m.classList.remove("show"); b.onClick && b.onClick(); };
    bb.appendChild(el);
  });
  m.classList.add("show");
  m.scrollTop = 0;
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

/* ---------------- Резервна копія прогресу ----------------
   Код = "DVORYK1:" + base64(gzip(JSON)) або "DVORYK0:" + base64(JSON), якщо стискання недоступне. */
const b64 = bytes => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
async function pipeBytes(bytes, stream) {
  const out = await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(out);
}
async function makeBackup() {
  saveNow();
  const json = new TextEncoder().encode(JSON.stringify(S));
  if (window.CompressionStream) {
    try { return "DVORYK1:" + b64(await pipeBytes(json, new CompressionStream("gzip"))); } catch (e) {}
  }
  return "DVORYK0:" + b64(json);
}
async function readBackup(code) {
  code = (code || "").replace(/\s+/g, "");
  const m = code.match(/DVORYK([01]):([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error("bad");
  let bytes = unb64(m[2]);
  if (m[1] === "1") bytes = await pipeBytes(bytes, new DecompressionStream("gzip"));
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || typeof data !== "object" || !Array.isArray(data.board) || data.board.length > N) throw new Error("bad");
  return data;
}
async function showExport() {
  const code = await makeBackup();
  window.GUIDE && GUIDE.exported();
  modal({
    title: tt`Зберегти прогрес 💾`,
    html: tt`<p>Це твій код прогресу (рівень ${S.level}, розділ ${Math.min(S.chapter, STORY.length - 1) + 1}). Збережи його в Нотатки або надішли собі в месенджер.</p>
      <textarea class="backup-code" id="bkCode" readonly>${code}</textarea>`,
    buttons: [
      ...(navigator.share ? [{ label: tt`📤 Поділитися (Нотатки, Telegram…)`, onClick: () => navigator.share({ title: tt`Затишний дворик — прогрес`, text: code }).catch(() => {}) }] : []),
      { label: tt`📋 Скопіювати`, cls: navigator.share ? "ghost" : "", onClick: () => copyText(code) },
      { label: tt`Закрити`, cls: "ghost" }
    ]
  });
  const ta = $("bkCode"); ta.onfocus = () => ta.select();
}
function copyText(t) {
  const ok = () => toast(tt`Скопійовано 📋 Встав у Нотатки`);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, () => fallbackCopy(t, ok));
  else fallbackCopy(t, ok);
}
function fallbackCopy(t, ok) {
  const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch (e) { toast(tt`Не вдалося скопіювати — виділи код вручну`); }
  ta.remove();
}
/* у застосунку сейв дублюється в нативне сховище — перед перезавантаженням дочекатися запису */
function reloadAfterSave() { (window.NATIVE ? NATIVE.flush() : Promise.resolve()).then(() => location.reload()); }
function showImport() {
  modal({
    title: tt`Відновити прогрес 📥`,
    html: tt`<p>Встав сюди код прогресу, який ти зберігала раніше.</p>
      <textarea class="backup-code" id="bkIn" placeholder="DVORYK1:…"></textarea>
      <p class="hint-s">Увага: поточна гра на цьому телефоні заміниться збереженою.</p>`,
    buttons: [
      { label: tt`Відновити`, onClick: async () => {
        const code = $("bkIn").value;
        try {
          const data = await readBackup(code);
          if (!confirm(tt`Відновити гру: рівень ${data.level}, розділ ${(data.chapter || 0) + 1}? Поточний прогрес на цьому телефоні заміниться.`)) return;
          S = null; // щоб автозбереження не перезаписало відновлене
          localStorage.setItem(SAVE_KEY, JSON.stringify(data));
          reloadAfterSave();
        } catch (e) { toast(tt`Код не підходить 🙈 Перевір, що скопіювала його повністю`); }
      } },
      { label: tt`Скасувати`, cls: "ghost" }
    ]
  });
}

/* ---------------- Налаштування ---------------- */
/* ---------------- Мова ---------------- */
function langRow(id) {
  // кнопки замість <select>: системний список у WKWebView на iOS не відкривався
  const pills = Object.entries(LANGS).map(([k, v]) =>
    `<button type="button" class="lang-pill${k === LANG ? " on" : ""}" data-lang="${k}">${v}</button>`).join("");
  return `<div class="set-row">🌐 ${tt`Мова`}${LANG !== "uk" ? "" : " · Language"} <span id="${id}" class="lang-pick">${pills}</span></div>`;
}
function bindLang(id) {
  const box = $(id); if (!box) return;
  box.querySelectorAll("[data-lang]").forEach(b => b.onclick = e => {
    e.preventDefault();
    if (!I18NX.setLang(b.dataset.lang)) return;
    box.querySelectorAll("[data-lang]").forEach(x => x.classList.toggle("on", x === b));
    if (S && S.started) saveNow();
    reloadAfterSave();
  });
}
function openSettings() {
  modal({
    title: tt`Налаштування ⚙️`,
    html: langRow("setLang") + tt`
      <label class="set-row">Ім'я <input id="setName" value="${(S.name || "").replace(/"/g, "&quot;")}" maxlength="20"></label>
      <label class="set-row"><span id="setSoundIc">${S.sound ? "🔊" : "🔇"}</span> Звук <input type="checkbox" id="setSound" ${S.sound ? "checked" : ""}></label>
      <div class="set-backup">
        <b>Прогрес гри</b>
        <p class="hint-s">Збережи код прогресу в Нотатки — і зможеш відновити гру на новому телефоні чи після перевстановлення.${window.GUIDE ? " " + GUIDE.note() : ""}</p>
        <button class="btn small" id="setExport">💾 Зберегти прогрес</button>
        <button class="btn ghost small" id="setImport">📥 Відновити прогрес</button>
      </div>
      ${window.CLOUD ? CLOUD.settingsHtml() : ""}
      <button class="btn ghost small" id="setGuide">📖 Довідник господині</button>
      <p class="hint-s">Справжні покупки поки не підключені — гроші гра не списує 💛</p>
      <button class="btn ghost small" id="setReset">Почати гру спочатку</button>
      <p class="hint-s" style="text-align:center;opacity:.6">Версія гри: ${APP_VER}</p>${errsHtml()}`,
    buttons: [{ label: tt`Зберегти`, onClick: () => {
      S.name = $("setName").value.trim();
      S.sound = $("setSound").checked;
      renderAll(); save();
    } }]
  });
  const ss = $("setSound"); if (ss) ss.onchange = () => { $("setSoundIc").textContent = ss.checked ? "🔊" : "🔇"; };
  $("setExport").onclick = showExport;
  $("setImport").onclick = showImport;
  $("setGuide").onclick = () => window.GUIDE && GUIDE.open();
  bindLang("setLang");
  if (window.CLOUD) CLOUD.bindSettings();
  $("setReset").onclick = () => {
    if (!confirm(tt`Точно почати спочатку? Весь прогрес буде видалено.`)) return;
    localStorage.removeItem(SAVE_KEY);
    reloadAfterSave();
  };
}

/* ============================================================
   ВЗАЄМОДІЯ З ДОШКОЮ (тап і перетягування)
   ============================================================ */
const APP_VER = "v161";   // разом із VERSION у sw.js
let drag = null, dragAnim = false, dragGhost = null, envKeyShown = "";
/* привид створюється один раз і живе весь час (новий шар на кожен дотик змушував дошку блимати) */
function ghostEl() {
  if (!dragGhost) { dragGhost = document.createElement("div"); dragGhost.className = "tile drag-ghost idle"; dragGhost.innerHTML = '<div class="dg-in"></div>'; document.body.appendChild(dragGhost); }
  return dragGhost;
}
/* привид предмета трохи над пальцем (на дотик), щоб палець його не закривав.
   Ціль — клітинка під пальцем (куди відпустила — туди й лягло); клітинка, з якою можна об'єднати,
   «притягує» здалеку — і від пальця, і від привида. Підсвітка цілі — окрема рамка, що ковзає між
   клітинками, тож дошка під час руху взагалі не перемальовується. */
const DRAG_START = 4, DRAG_LIFT = 0.32, DRAG_SNAP = 0.8, DRAG_MAGNET = 1.1, DRAG_INSIDE = 0.4;
let dragHl = null;
function hlEl() {
  if (!dragHl) { dragHl = document.createElement("div"); dragHl.className = "drag-hl"; document.body.appendChild(dragHl); }
  return dragHl;
}
function canMergeAt(a, b) {
  if (a === b) return false;
  const t = S.board[b], A = S.board[a];
  return !!(t && A && !A.g && !t.g && !t.lock && !t.st && t.c === A.c && t.l === A.l && !isMax(A)) || MECH.canMergeGens(A, t);
}
function dragTarget(d, x, y) {
  const gy = y - d.lift;
  let best = null, bd = Infinity, merge = null, md = Infinity;
  for (const c of d.cells) {
    const df = Math.hypot(c.x - x, c.y - y), dist = Math.min(df, Math.hypot(c.x - x, c.y - gy));
    if (df < bd) { bd = df; best = c; }
    if (dist < c.w * DRAG_MAGNET && dist < md && canMergeAt(d.i, c.i)) { md = dist; merge = c; }
  }
  if (best && bd < best.w * DRAG_INSIDE) return best;      // палець усередині клітинки — саме вона
  if (merge) return merge;                                  // палець між клітинками — притягує пара
  return best && bd < best.w * DRAG_SNAP ? best : null;
}
function onDown(e) {
  document.body.classList.remove("nav-open");
  if (drag || dragAnim) return;
  const tile = e.target.closest(".tile");
  if (!tile) {
    const sc = e.target.closest(".cell.shut");
    if (sc && window.HARD) { HARD.expandModal(); return; }
    if (e.target.closest(".cell")) { selected = -1; renderBoard(); renderInfo(); } return;
  }
  e.preventDefault();
  audio();
  const i = +tile.dataset.i;
  drag = { i, pid: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, tile, ghost: null, over: null, can: false, touch: e.pointerType !== "mouse", raf: 0 };
}
/* привид рухається прямо в обробнику руху — без очікування наступного кадру */
function placeGhost(d) { d.ghost.style.transform = `translate3d(${d.px - d.w / 2}px, ${d.py - d.h / 2 - d.lift}px, 0)`; }
function dragFrame() {
  const d = drag; if (!d || !d.ghost) return;
  d.raf = 0;
  const t = dragTarget(d, d.lx, d.ly), can = !!(t && canMergeAt(d.i, t.i));
  if (d.over !== t || d.can !== can) {
    const hl = hlEl();
    if (t) {
      hl.style.width = t.w + "px"; hl.style.height = t.h + "px";
      hl.style.transform = `translate3d(${t.x - t.w / 2}px, ${t.y - t.h / 2}px, 0)`;
      hl.classList.toggle("can", can);
      if (!d.over) { hl.style.transition = "none"; void hl.offsetWidth; hl.style.transition = ""; }   // з'являється на місці, далі — ковзає
      hl.classList.add("show");
    } else hl.classList.remove("show");
    if (can && !d.can && navigator.vibrate) try { navigator.vibrate(8); } catch (_) {}
    d.ghost.firstChild.classList.toggle("big", can);          // над парою — більшає
    d.over = t; d.can = can;
  }
}
function onMove(e) {
  const d = drag;
  if (!d || e.pointerId !== d.pid) return;
  d.lx = e.clientX; d.ly = e.clientY;
  if (!d.ghost) {
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (dx * dx + dy * dy < DRAG_START * DRAG_START) return;
    if (S.board[d.i] && S.board[d.i].lock) return;
    const r = d.tile.getBoundingClientRect();
    const g = ghostEl();
    g.firstChild.innerHTML = d.tile.innerHTML; g.firstChild.classList.remove("big"); g.style.transition = "none";
    g.style.width = r.width + "px"; g.style.height = r.height + "px";
    Object.assign(d, { ghost: g, w: r.width, h: r.height, lift: d.touch ? r.height * DRAG_LIFT : 0 });
    d.cells = [...$("board").children].map(c => { const q = c.getBoundingClientRect(); return { el: c, i: +c.dataset.i, x: q.left + q.width / 2, y: q.top + q.height / 2, w: q.width, h: q.height }; });
    g.classList.remove("idle"); $("board").classList.add("dragging");
    d.tile.classList.add("lifted");
    selected = d.i;
  }
  e.preventDefault();
  /* найсвіжіша точка: передбачена браузером (якщо вміє) — привид не відстає від пальця */
  let px = d.lx, py = d.ly;
  const pr = e.getPredictedEvents ? e.getPredictedEvents() : null;
  if (pr && pr.length) { const q = pr[pr.length - 1]; if (Math.abs(q.clientX - px) < 60 && Math.abs(q.clientY - py) < 60) { px = q.clientX; py = q.clientY; } }
  d.px = px; d.py = py; placeGhost(d);
  if (!d.raf) d.raf = requestAnimationFrame(dragFrame);
}
/* привид швидко долітає до клітинки (або вертається назад), потім — сама дія */
function settleGhost(d, x, y, scale, ms, done) {
  dragAnim = true;
  const g = d.ghost;
  g.style.transition = `transform ${ms}ms cubic-bezier(.2, .8, .3, 1)`;
  g.style.transform = `translate3d(${x - d.w / 2}px, ${y - d.h / 2}px, 0)`;
  g.firstChild.classList.remove("big"); g.firstChild.style.transform = `scale(${scale})`;
  setTimeout(() => { g.classList.add("idle"); g.style.transition = "none"; g.firstChild.innerHTML = ""; g.firstChild.style.transform = ""; d.tile.classList.remove("lifted"); $("board").classList.remove("dragging"); dragAnim = false; done(); }, ms);
}
function onUp(e) {
  const d = drag;
  if (!d || (e.pointerId !== undefined && e.pointerId !== d.pid)) return;
  drag = null;
  if (d.raf) cancelAnimationFrame(d.raf);
  if (dragHl) dragHl.classList.remove("show", "can");
  if (!d.ghost) { if (e.type !== "pointercancel") tap(d.i); return; }
  const t = e.type === "pointercancel" ? null : dragTarget(d, e.clientX || d.lx, e.clientY || d.ly);
  const home = d.cells.find(c => c.i === d.i);
  if (t && t.i !== d.i) settleGhost(d, t.x, t.y, canMergeAt(d.i, t.i) ? 0.9 : 1, 60, () => handleDrop(d.i, t.i));
  else settleGhost(d, home.x, home.y, 1, 130, () => renderBoard());
}
function tap(i) {
  const it = S.board[i];
  if (!it) return;
  if (it.lock) { selected = i; renderBoard(); renderInfo(); MECH.lockModal(i); return; }
  if (it.crow && window.DOG && DOG.shoo(i)) return;            // прогнати ворону
  if (it.c === "herb" && window.HERB && HERB.collect(i)) return;   // у гербарій
  if (it.worm && window.WH) { selected = i; renderBoard(); renderInfo(); WH.wormModal(i); return; }
  if ((it.untested || it.short) && window.CRAFT) { selected = i; renderBoard(); renderInfo(); CRAFT.testModal(i); return; }
  if (it.st) { selected = i; renderInfo(); MECH.ovenModal(i); return; }
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
  // на дошці нижнє меню сховане — більше місця для городу; відкривається кнопкою ☰
  document.body.classList.toggle("on-board", name === "board");
  document.body.classList.remove("nav-open");
  document.querySelectorAll(".tab").forEach(t => t.hidden = t.id !== "tab-" + name);
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  if (window.Yard3D) Yard3D.setActive(name === "story");
  if (name === "story") { viewCh = null; renderStory(); }
  if (name === "shop") renderShop();
  if (name === "coll") renderCollection();
  if (name === "hub" && window.HUB) HUB.render();
}

/* ============================================================
   СТАРТ
   ============================================================ */
function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
function isStandalone() { return !!window.NATIVE || window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches; }

function startGame() {
  if (window.ENDLESS) ENDLESS.ensure(S.chapter + 10);     // історія без кінця
  $("start").classList.remove("show");
  $("app").hidden = false;
  if (S.woodOn && window.WOOD) WOOD.leave();
  if (window.SIDE) SIDE.onStart();
  if (window.UNL) UNL.init();
  if (window.HARD) HARD.init();
  if (window.TP) TP.init();
  if (window.XTRA) { XTRA.initDisc(); XTRA.renderBoost(); }
  if (window.PATH) PATH.init();
  if (window.LOVE) LOVE.init();
  if (window.MAIL) MAIL.render();
  if (window.PROFILE) PROFILE.renderAva();
  MECH.migrate();
  if (window.QUEST) { QUEST.init(); QUEST.renderButton(); }
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
    const what = n === 1 ? tt`новий розділ` : n < 5 ? tt`нові розділи` : tt`нових розділів`;
    modal({
      title: n === 1 ? tt`Новий розділ! 💌` : tt`Нові розділи! 💌`,
      html: tt`<div class="big-emoji">🏡</div><p>Історія дворика продовжується — на тебе ${n === 1 ? tt`чекає` : tt`чекають`} ${n} ${what}: «${STORY[S.chapter].title}»${n > 1 ? tt` і далі` : ""}!</p>`,
      buttons: [{ label: tt`Читати ›`, onClick: () => playDialog(STORY[S.chapter].intro, checkDaily) }]
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
    $("startLangBox").innerHTML = langRow("startLang"); bindLang("startLang");
    $("start").classList.add("show");
    $("installHint").hidden = !(isIOS() && !isStandalone());
    if (window.HERO) HERO.startRow();
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
  /* одноразові анімації (виліт із генератора, злиття, поява, тап) знімаються, щойно скінчились —
     інакше айфон програє їх наново, коли дошка на мить ставить анімації на паузу під час перетягування */
  board.addEventListener("animationend", e => {
    const t = e.target;
    if (!t.classList || !t.classList.contains("tile")) return;
    if (t.classList.contains("spawn") || t.classList.contains("merged") || t.classList.contains("pop") || t.classList.contains("tap")) {
      t.classList.remove("spawn", "merged", "pop", "tap"); t.style.removeProperty("--fx"); t.style.removeProperty("--fy");
    }
  });
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  // iPhone: дотик до предмета не повинен ні прокручувати, ні «пружинити» сторінку, ні вмикати лупу
  board.addEventListener("touchstart", e => { if (e.target.closest(".tile")) e.preventDefault(); }, { passive: false });
  window.addEventListener("touchmove", e => { if (drag) e.preventDefault(); }, { passive: false });

  document.querySelectorAll(".nav button").forEach(b => b.onclick = () => { audio(); showTab(b.dataset.tab); });
  $("settingsBtn").onclick = openSettings;
  $("woodBtn").onclick = () => window.WOOD && WOOD.toggle();
  $("menuBtn").onclick = () => { audio(); document.body.classList.toggle("nav-open"); };
  $("profileBtn").onclick = () => window.PROFILE ? PROFILE.open() : openSettings();
  $("mailBtn").onclick = () => window.MAIL && MAIL.panel();
  $("inboxBtn").onclick = takeInbox;
  $("evBtn").onclick = () => window.EV && EV.panel();
  $("qBtn").onclick = () => window.QUEST && QUEST.panel();
  $("sideBtn").onclick = () => window.SIDE && SIDE.toggle();
  $("flashBtn").onclick = () => window.RARE && RARE.panel();
  $("bigBtn").onclick = () => window.TP && TP.panel();
  $("boostBtn").onclick = () => window.XTRA && XTRA.toggleBoost();
  $("teaBtn").onclick = () => { takeTea(); renderShop(); };
  $("energyChip").onclick = () => { showNoEnergyInfo(); };
  $("dialog").onclick = nextLine;

  setInterval(() => {
    if (!S || !S.started || drag || dragAnim) return;      // під час перетягування нічого не перемальовуємо
    const before = S.energy;
    renderTop();
    if (window.EV) { EV.renderButton(); if (Date.now() % 5000 < 1000) EV.tick(); }
    MECH.tick();
    if (window.QUEST) QUEST.tick();
    if (window.WD) WD.tick();
    if (window.SIDE) SIDE.tick();
    if (window.UNL) UNL.tick();
    if (window.ALB) ALB.tick();
    if (window.PATH) PATH.tick();
    if (window.XTRA) { XTRA.catTick(); XTRA.slotsTick(); }
    if (window.RARE) RARE.tick();
    if (window.HARD) HARD.tick();
    if (window.TP) TP.tick();
    if (window.SEAS) SEAS.tick();
    if (window.ENDLESS) ENDLESS.tick();
    if (window.LOVE) LOVE.tick();
    if (window.WOOD) WOOD.tick();
    if (window.GUESTS) GUESTS.tick();
    if (window.POST) POST.tick();
    if (window.REB) REB.tick();
    if (window.DOG) DOG.tick();
    if (window.HERB) HERB.tick();
    if (window.ANDR) ANDR.tick();
    if (window.ENV && ENV.key() !== envKeyShown) { envKeyShown = ENV.key(); renderStory(); if (window.Yard3D && Yard3D.refreshEnv) Yard3D.refreshEnv(); }   // світанок/вечір/ніч — перемальовуємо дворик
    if (window.WH) WH.tick();
    if (window.CRAFT) CRAFT.tick();
    if (window.GUIDE) GUIDE.tick();
    if (window.FARM2) FARM2.tick();
    if (window.FAM) FAM.tick();
    if (window.CONTEST) CONTEST.tick();
    if (window.TOLOKA) TOLOKA.tick();
    if (window.MAIL) MAIL.tick();
    if (window.HERO) HERO.tick();
    if (window.UNL && UNL.on("mail") && $("mailBtn").hidden) MAIL.render();
    if (window.HUB && Date.now() % 5000 < 1000) { HUB.renderDot(); if (!$("tab-hub").hidden) HUB.render(); }
    if (Date.now() % 5000 < 1000) MECH.checkOven();
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
    title: tt`Енергія ⚡`,
    html: tt`<p>+1 ⚡ кожні ${ENERGY_REGEN_MS / 60000} хвилини, до ${ENERGY_MAX} ⚡.<br>${full ? tt`Повна шкала за <b>` + hm(full) + "</b>." : tt`Шкала повна — саме час садити! 🌱`}</p>
      <p class="hint-s">Ще трохи енергії дають ⚡🔋☀️ на дошці (зрідка), нові рівні, щоденний подарунок і перерва на чай (раз на ${TEA_BREAK_MS / 3600000} год).</p>` + (window.REST ? REST.line() : ""),
    buttons: [...energyButtons(false), { label: tt`Зрозуміло`, cls: "ghost" }]
  });
}

/* у застосунку спершу відновлюємо сейв із нативного сховища (js/native.js) */
document.addEventListener("DOMContentLoaded", () => (window.NATIVE ? NATIVE.ready : Promise.resolve()).then(init).then(() => window.CLOUD && CLOUD.start()));
window.addEventListener("yard3d-ready", () => { if (S && S.started) renderStory(); });
