"use strict";
/* ============================================================
   ВТОМЛЕНА ЗЕМЛЯ 🚜 — город з часом виснажується (рахуються тапи генераторів на городі).
   • Коли сил лишається чверть — дід Степан попереджає, на дошці з'являється 🚜.
   • Виснажена земля дає брак: спершу 50% тапів, а що довше не орати — тим більше, до 80%.
     Брак не об'єднується — його можна лише викинути.
   • Трактор кума Миколи спахує город за монети: усе з дошки зникає. Лишаються генератори, піч,
     павутиння, подарунки й бабусині скарби, а монетки й енергія збираються самі.
     Зате свіжа земля перші 150 тапів частіше дає предмети на рівень вищі.
   Стан: S.soil = { used (тапів з останньої оранки), bad (тапів на виснаженій землі), fresh, n, warned, told, jt }
   ============================================================ */
const SOIL_LIFE = 2000, SOIL_WARN = 0.25, SOIL_BAD = [0.5, 0.8], SOIL_BAD_RAMP = 300;
const SOIL_FRESH = 150, SOIL_FRESH_UP = 0.25, SOIL_ROW_MS = 260;
const SOIL_COST = L => 150 + 35 * L;
const SOIL_ART = [];                                     // мальовані: junk, ui-tractor, ui-soil-fresh, ui-soil-tired
const SOIL_IMG = (id, e) => SOIL_ART.includes(id) ? `<img class="e3d pnt" src="items/${id}.webp" alt="">` : e;

window.PUA_MAP = window.PUA_MAP || {};
PUA_MAP[String.fromCharCode(0xE540)] = { e: "🥀", img: SOIL_ART.includes("junk") ? "items/junk.webp" : null };
CHAINS.junk = { name: "Брак", nomerge: true, trash: true, value: 1, items: [[String.fromCharCode(0xE540), "Бракований урожай"]] };

if (typeof UNLOCKS !== "undefined") UNLOCKS.push({ id: "soil", lvl: 9, icon: "🚜", title: "Втомлена земля",
  text: "Город з часом втомлюється. Коли земля виснажиться, половина врожаю (а згодом і більше) виходитиме бракованою. Клич трактор 🚜 — він спаше город за монети, але все з дошки зникне, тож спершу віддай замовлення й сховай цінне.",
  lines: [["stepan", "{name}, земля — як людина: працює-працює, а тоді втомлюється 🌾 Як побачиш, що родить брак — клич кума Миколу з трактором 🚜"]] });
if (typeof GUIDE_BASICS !== "undefined") GUIDE_BASICS.push(["🚜", "Втомлена земля",
  "Город виснажується від тапів. Коли сил лишиться чверть — на дошці з'явиться трактор 🚜. Виснажена земля дає 50–80% браку 🥀 (його можна лише викинути). Оранка коштує монети й прибирає з дошки все, крім генераторів, печі, павутиння, подарунків і скарбів. Свіжа земля перші 150 тапів частіше дає кращі предмети."]);

window.SOIL = (() => {
  const on = () => window.UNL && UNL.on("soil");
  const st = () => (S.soil = S.soil || { used: 0, bad: 0, fresh: 0, n: 0 });
  const left = () => Math.max(0, 1 - st().used / SOIL_LIFE);
  const tired = () => st().used >= SOIL_LIFE;
  const badP = () => SOIL_BAD[0] + (SOIL_BAD[1] - SOIL_BAD[0]) * Math.min(1, st().bad / SOIL_BAD_RAMP);
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const pct = () => Math.round(left() * 100);
  let plowing = false;

  /* тап генератора на городі: рахуємо втому, свіжа земля — бонус, виснажена — брак */
  function afterTap(gIt, item) {
    if (!on() || S.sideOn || !item || !gIt) return item;
    const g = GENS[gIt.g];
    if (!g || g.holiday || g.animal || g.side || item.c !== g.chain) return item;
    const s = st();
    s.used++;
    if (s.fresh > 0) {
      s.fresh--;
      if (Math.random() < SOIL_FRESH_UP) item.l = Math.min(CHAINS[item.c].items.length - 1, item.l + 1);
    }
    if (!s.warned && left() <= SOIL_WARN) { s.warned = true; later(() => playDialog([["stepan", `{name}, земля в городі вже втомлюється — сил лишилось ${pct()}% 🌾 Скоро почне родити брак. Як буде змога — клич трактор 🚜 (він на дошці, вгорі праворуч)`]])); }
    if (!tired()) return item;
    if (!s.told) { s.told = true; later(() => playDialog([["stepan", "Ну от, земля зовсім виснажилась 😟 Тепер половина врожаю буде бракована, а далі — ще гірше. Пора орати!"]], () => plowModal())); }
    s.bad++;
    if (Math.random() >= badP()) return item;
    s.jt = (s.jt || 0) + 1;
    if (s.jt % 12 === 1) setTimeout(() => toast("🥀 Виснажена земля дала брак — пора спахати город 🚜"), 350);
    return { c: "junk", l: 0 };
  }
  function later(fn) { setTimeout(() => { if (busyUI()) setTimeout(() => later(fn), 1500); else fn(); }, 700); }

  /* значок трактора на дошці */
  function badge() {
    const wrap = document.querySelector(".board-wrap"); if (!wrap) return;
    let b = $("soilBtn");
    const show = on() && !S.sideOn && left() <= SOIL_WARN;
    if (!show) { if (b) b.hidden = true; return; }
    if (!b) { b = document.createElement("button"); b.id = "soilBtn"; b.className = "soil-btn"; b.onclick = plowModal; wrap.appendChild(b); }
    b.hidden = false;
    const bd = $("board");                                  // у правий верхній кут самої дошки
    b.style.top = (bd.offsetTop - 14) + "px"; b.style.right = Math.max(0, wrap.clientWidth - bd.offsetLeft - bd.offsetWidth - 4) + "px";
    b.classList.toggle("tired", tired());
    b.innerHTML = `<span class="sl-ic">${SOIL_IMG("ui-tractor", "🚜")}</span><small>${tired() ? "брак " + Math.round(badP() * 100) + "%" : "земля " + pct() + "%"}</small>`;
  }
  /* рядок у підказці генератора */
  function genInfo(it) {
    if (!on() || S.sideOn || !it || !GENS[it.g] || GENS[it.g].holiday || GENS[it.g].animal) return "";
    const s = st();
    if (s.fresh > 0) return " · свіжа земля 🌱";
    return tired() ? ` · земля виснажена — брак ${Math.round(badP() * 100)}%` : ` · земля ${pct()}%`;
  }

  function plowModal() {
    if (plowing) return;
    if (S.sideOn) { toast("Трактор оре тільки город — повернись на город 🪴"); return; }
    const cost = SOIL_COST(S.level), s = st();
    const state = tired() ? `<p><b>Земля виснажена</b> — зараз брак ${Math.round(badP() * 100)}% урожаю.</p>` : `<p>Сил у землі: <b>${pct()}%</b>.</p>`;
    modal({
      title: "Спахати город 🚜",
      html: `<div class="big-emoji">${SOIL_IMG(tired() ? "ui-soil-tired" : "ui-tractor", "🚜")}</div>${state}
        <p>Кум Микола приїде трактором і спаше все — <b>з дошки зникнуть усі предмети</b>. Лишаться генератори, піч, павутиння, подарунки 🎁 і бабусині скарби, а монетки й енергія зберуться самі.</p>
        <p class="hint-s">Спершу віддай замовлення й сховай цінне у сховок 🗄️. Свіжа земля перші ${SOIL_FRESH} тапів частіше даватиме кращі предмети 🌱</p>`,
      buttons: [
        { label: S.coins >= cost ? `🚜 Спахати за ${cost} 🪙` : `🚜 Треба ${cost} 🪙 (бракує ${cost - S.coins})`, disabled: S.coins < cost, onClick: plow },
        { label: "Пізніше", cls: "ghost" }
      ]
    });
  }

  /* оранка: трактор проїжджає рядами, предмети зникають */
  const keep = it => it.g || it.st || it.lock || it.c === "chest" || it.c === "rare";
  function plow() {
    const cost = SOIL_COST(S.level);
    if (plowing || S.sideOn || S.coins < cost) return;
    S.coins -= cost; selected = -1; plowing = true;
    renderTop(); renderInfo();
    const board = $("board"), br = board.getBoundingClientRect(), rows = Math.ceil(N / COLS), ch = br.height / rows;
    const tr = document.createElement("div");
    tr.className = "tractor";
    tr.innerHTML = SOIL_IMG("ui-tractor", "🚜");
    tr.style.fontSize = Math.round(ch * 0.8) + "px";
    document.body.appendChild(tr);
    document.body.classList.add("plowing");
    let row = -1, got = { e: 0, c: 0 };
    const t0 = performance.now(), total = rows * SOIL_ROW_MS;
    function clearRow(r) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c, it = S.board[i];
        if (!it || keep(it)) continue;
        const cc = CHAINS[it.c];
        if (cc && cc.collect) { const v = cc.values[it.l]; if (cc.collect === "coins") got.c += v; else got.e += v; }
        S.board[i] = null;
      }
      renderBoard();
      for (let c = 0; c < COLS; c++) { const el = board.children[r * COLS + c]; if (el) { el.classList.add("plowed"); setTimeout(() => el.classList.remove("plowed"), 900); } }
    }
    function step(now) {
      const t = Math.min(total, now - t0), r = Math.min(rows - 1, Math.floor(t / SOIL_ROW_MS)), f = (t - r * SOIL_ROW_MS) / SOIL_ROW_MS;
      if (r !== row) { row = r; clearRow(r); }
      const ltr = r % 2 === 0, x = ltr ? br.left - ch * 0.4 + f * (br.width) : br.right - ch * 0.6 - f * (br.width);
      tr.style.transform = `translate3d(${x}px, ${br.top + r * ch + ch * 0.1}px, 0) scaleX(${ltr ? -1 : 1})`;
      if (t < total) requestAnimationFrame(step); else finish();
    }
    function finish() {
      tr.remove(); document.body.classList.remove("plowing"); plowing = false;
      if (got.e) { regen(); S.energy += got.e; }
      S.coins += got.c;
      const n = st().n + 1;
      S.soil = { used: 0, bad: 0, fresh: SOIL_FRESH, n, warned: false, told: false, jt: 0 };
      save(); renderAll(); confetti(); sfx.level();
      playDialog([["stepan", `Земля — як пух! 🌱 Тепер усе, що посадиш, ростиме краще.${got.e || got.c ? ` А ще я зібрав, що валялось: ${got.e ? "+" + got.e + " ⚡ " : ""}${got.c ? "+" + got.c + " 🪙" : ""}` : ""}`]]);
    }
    requestAnimationFrame(step);
  }

  /* викинути брак (без ліміту продажу) */
  function trash(i) {
    const it = S.board[i]; if (!it || !CHAINS[it.c] || !CHAINS[it.c].trash) return;
    S.board[i] = null; if (selected === i) selected = -1;
    sfx.pop(); renderBoard(); renderInfo(); save();
  }

  return { afterTap, badge, genInfo, plowModal, trash, left, tired };
})();
