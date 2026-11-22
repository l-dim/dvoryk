"use strict";
/* ============================================================
   СОБАКА БРОВКО 🐕 — другий улюбленець поруч із котиком.
   • На дошці — його будка. Перетягни на неї кісточку 🦴 — Бровко ситий (до 6 мисок).
   • Ворони 🐦 час від часу сідають на врожай і за 2 хвилини його крадуть.
     Ситий Бровко проганяє ворону сам (−1 миска); голодний — ні, тоді тапни на предмет і прожени сама.
   • Ситий Бровко раз на кілька годин приносить знахідку: монетки, енергію, подарунок,
     іноді — кісточку чи навіть бабусин скарб (−1 миска).
   • Кісточки: зрідка в подарунках, або купити в будці за монети.
   Стан: S.dog = { full, crowNext, findNext, buys:{day,n}, stolen, chased }
   ============================================================ */
const DOG_MAX = 6, DOG_BONE = 3, DOG_CROW_MIN = [40, 90], DOG_STEAL_MS = 2 * 60e3, DOG_FIND_H = [3, 5];
const DOG_BONE_PRICE = [40, 80, 160];                  // за день — тричі, щоразу дорожче
const DOG_ART = ["gen-dog", "bone", "ui-crow"];          // аркуш sheet-dog
window.PUA_MAP = window.PUA_MAP || {};
PUA_MAP[String.fromCharCode(0xE548)] = { e: "🦴", img: DOG_ART.includes("bone") ? "items/bone.webp" : null };
PUA_MAP[String.fromCharCode(0xE549)] = { e: "🐕", img: DOG_ART.includes("gen-dog") ? "items/gen-dog.webp" : "items/animal-dog.webp" };
CHAINS.bone = { name: "Кісточка", nomerge: true, value: 3, items: [[String.fromCharCode(0xE548), "Кісточка"]] };
GENS.dog = { icon: String.fromCharCode(0xE549), name: "Будка Бровка", chain: "bone", pet: true };

if (typeof UNLOCKS !== "undefined") UNLOCKS.push({ id: "dog", lvl: 12, icon: "🐕", title: "Собака Бровко",
  text: "На дошці з'явилась будка Бровка. Перетягни на неї кісточку 🦴 — ситий Бровко проганяє ворон, що крадуть урожай, і приносить знахідки. Кісточки бувають у подарунках, а ще їх можна купити, тапнувши на будку.",
  lines: [["stepan", "{name}, ворони геть знахабніли — тягнуть усе з городу! 🐦 Віддаю тобі свого Бровка. Тільки годуй кісточками — і він нікого до врожаю не підпустить 🐕"]] });
if (typeof GUIDE_BASICS !== "undefined") GUIDE_BASICS.push(["🐕", "Собака Бровко",
  "Будка на дошці. Перетягни на неї кісточку 🦴 (до 6 мисок). Ворона сідає на врожай і за 2 хв краде — ситий Бровко прожене її сам, голодний — ні (тоді тапни на предмет). Ситий Бровко ще й приносить знахідки. Кісточки — у подарунках або в будці за монети."]);

window.DOG = (() => {
  const on = () => window.UNL && UNL.on("dog");
  const now = () => window.DVORYK_NOW || Date.now();
  const st = () => (S.dog = S.dog || { full: DOG_BONE, crowNext: 0, findNext: 0, buys: { day: "", n: 0 }, stolen: 0, chased: 0 });
  const rndIn = ([a, b]) => a + Math.random() * (b - a);
  const today = () => { const d = new Date(now()); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const mainB = () => S.main || S.board;
  const kennel = () => mainB().findIndex(x => x && x.g === "dog");
  const isDog = it => !!(it && it.g === "dog");
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const bowls = () => "🍖".repeat(st().full) + "▫️".repeat(DOG_MAX - st().full);

  /* будка з'являється на дошці один раз */
  function ensure() {
    if (!on() || S.sideOn || kennel() >= 0 || S.dogPlaced) return;
    placeItem({ g: "dog", gl: 1 });                 // нема місця — будка чекатиме в 📥
    S.dogPlaced = true; st(); save(); renderBoard();
  }
  function price() { const b = st().buys; if (b.day !== today()) { b.day = today(); b.n = 0; } return b.n < DOG_BONE_PRICE.length ? DOG_BONE_PRICE[b.n] : 0; }

  function feed(n = DOG_BONE) {
    const s = st(); s.full = Math.min(DOG_MAX, s.full + n);
    sfx.merge(3); save(); renderInfo();
    setTimeout(() => toast(`🐕 Хрум-хрум! Бровко ситий: ${bowls()}`), 200);
  }
  /* кісточку перетягнули на будку */
  function drop(a, b) {
    const A = S.board[a], B = S.board[b];
    if (!isDog(B) || !A || A.c !== "bone") return false;
    if (st().full >= DOG_MAX) { sfx.nope(); toast("🐕 Бровко вже ситий — віддай кісточку пізніше"); renderBoard(); return true; }
    S.board[a] = null; if (selected === a) selected = b;
    feed(); renderBoard();
    return true;
  }
  function buy(i) {
    const p = price();
    if (!p) { sfx.nope(); toast("Кісточок на сьогодні вже не продають — завтра 🌙"); return; }
    if (S.coins < p) { sfx.nope(); toast(`Бракує ${p - S.coins} 🪙`); return; }
    if (st().full >= DOG_MAX) { sfx.nope(); toast("🐕 Бровко ситий — купиш, коли зголодніє"); return; }
    S.coins -= p; st().buys.n++; renderTop(); feed(); panel(i);
  }
  /* тап по будці */
  function panel(i) {
    const s = st(), p = price();
    modal({ title: "Будка Бровка 🐕", html: `<div class="big-emoji">${GENS.dog.icon}</div><p>Ситість: <b>${bowls()}</b></p>` +
      `<p class="hint-s">Ситий Бровко проганяє ворон (−1 миска) і приносить знахідки. Перетягни на будку кісточку 🦴 з дошки — або купи тут.${s.chased || s.stolen ? `<br>Прогнав ворон: ${s.chased} · вкрали: ${s.stolen}` : ""}</p>`,
      buttons: [{ label: p ? `🦴 Купити кісточку · ${p} 🪙` : "🦴 Кісточок до завтра немає", disabled: !p || S.coins < p || s.full >= DOG_MAX, onClick: () => buy(i) }, { label: "Добре", cls: "ghost" }] });
  }

  /* ворона прилітає на врожай */
  function crow() {
    const b = mainB(), pool = b.map((x, i) => x && !x.g && !x.lock && !x.st && !x.crow && PRODUCT_CHAINS.includes(x.c) && x.l >= 1 ? i : -1).filter(i => i >= 0);
    if (!pool.length) return;
    const i = pool[Math.floor(Math.random() * pool.length)], s = st();
    if (s.full > 0 && kennel() >= 0) {            // Бровко на варті
      s.full--; s.chased++; save(); renderInfo();
      toast(`🐕 Гав-гав! Бровко прогнав ворону від ${itemIcon(b[i])}`); sfx.pop();
      return;
    }
    b[i].crow = now() + DOG_STEAL_MS; save(); renderBoard();
    toast(`🐦 Ворона сіла на ${itemIcon(b[i])}! Тапни, щоб прогнати${kennel() >= 0 ? " — Бровко голодний" : ""}`);
  }
  function shoo(i) {
    const it = S.board[i]; if (!it || !it.crow) return false;
    delete it.crow; sfx.pop(); toast("Киш! 🐦 Ворона полетіла"); save(); renderBoard();
    return true;
  }
  function steal() {
    const b = mainB(), t = now(); let n = 0;
    b.forEach((x, i) => { if (x && x.crow && t >= x.crow) { b[i] = null; n++; } });
    if (n) { st().stolen += n; save(); renderBoard(); renderOrders(); toast(`🐦 Ворона вкрала врожай${n > 1 ? " (" + n + ")" : ""}! Нагодуй Бровка — він вартуватиме`); }
  }
  /* знахідка */
  function find() {
    const s = st(), k = kennel(); if (k < 0 || s.full <= 0) return;
    const r = Math.random();
    const it = r < 0.04 && CHAINS.rare ? { c: "rare", l: 0 } : r < 0.16 ? { c: "bone", l: 0 } : r < 0.36 ? { c: "chest", l: 0 } : r < 0.66 ? { c: "coin", l: 1 } : { c: "energy", l: 0 };
    const at = placeItem(it, k); if (at < 0) return;
    s.full--; spawnFrom.set(at, k); save(); renderBoard();
    toast(`🐕 Бровко щось приніс: ${itemIcon(it)} ${itemName(it)}!`);
  }

  function tick() {
    if (!S || !S.started || !on()) return;
    ensure();
    if (S.sideOn || busyUI() || (typeof drag !== "undefined" && drag)) return;
    const s = st(), t = now();
    steal();
    if (!s.crowNext) s.crowNext = t + rndIn(DOG_CROW_MIN) * 60e3;
    if (t >= s.crowNext) { s.crowNext = t + rndIn(DOG_CROW_MIN) * 60e3; crow(); }
    if (!s.findNext) s.findNext = t + rndIn(DOG_FIND_H) * 3600e3;
    if (t >= s.findNext) { s.findNext = t + rndIn(DOG_FIND_H) * 3600e3; find(); }
    if (S.board.some(x => x && x.crow)) document.querySelectorAll(".crow-b").forEach(el => { const it = S.board[+el.parentNode.dataset.i]; if (it && it.crow) el.dataset.t = Math.max(0, Math.ceil((it.crow - t) / 1000)); });
  }
  /* значок ворони на плитці */
  function decorate(t, it) {
    if (!t) return;
    let b = t.querySelector(".crow-b");
    if (it && it.crow) { if (!b) { b = document.createElement("span"); b.className = "crow-b"; b.innerHTML = DOG_ART.includes("ui-crow") ? `<img class="e3d pnt" src="items/ui-crow.webp" alt="">` : "🐦"; t.appendChild(b); } }
    else if (b) b.remove();
  }
  function info() {
    return `<b>Будка Бровка 🐕</b><small>Ситість ${bowls()} · перетягни кісточку 🦴 або тапни — купити</small>`;
  }
  /* кісточка іноді в подарунках */
  function onChest(near) { if (on() && Math.random() < 0.25) { const at = placeItem({ c: "bone", l: 0 }, near); if (at >= 0) spawnFrom.set(at, near); } }
  /* Бровко в дворику (якщо в розділі його ще немає) */
  function yard(ch, all) { return on() && !ch.indoor && !all.some(d => d.e === "🐕") ? [{ key: "dog-brovko", e: "🐕", x: 22, y: 88, s: 6 }] : []; }

  return { tick, drop, panel, shoo, decorate, info, onChest, yard, isDog, feed };
})();

/* тап по будці — відкрити будку, а не «генерувати» */
(() => {
  const _p = produce;
  produce = function (i) { if (window.DOG && DOG.isDog(S.board[i])) { selected = i; renderBoard(); renderInfo(); DOG.panel(i); return; } return _p.apply(this, arguments); };
})();
