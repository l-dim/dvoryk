"use strict";
/* ============================================================
   УСКЛАДНЕННЯ
   1. Менша дошка: спершу 5×7 (35 клітинок), ще 4 смуги відкриваються за ⭐ і 🪙.
      Стан S.bstage = 0…4 (скільки смуг відкрито). Дошка пригоди не обмежена.
   2. Генератори зношуються: після ~90 тапів ламаються, лагодить дід Степан —
      треба принести 2 предмети або заплатити монетами. Злиття генераторів дає новий.
      Стан на генераторі: it.wr (знос), it.broken, it.fix = [{c,l},{c,l}]
   3. (у game.js) замовлення частіше просять дорожчі предмети.
   4. Продукти черствіють: молочне, сад і випічка через 24 год на дошці коштують удвічі менше.
      Злиття бере вік старшого предмета. Сховок зберігає свіжість.
      Стан на предметі: it.t (коли з'явився), it.old (зачерствів)
   ============================================================ */
const BOARD_STRIPS = [
  { cells: Array.from({ length: ROWS - 2 }, (_, k) => (k + 1) * COLS + COLS - 1), stars: 3, coins: 150, name: "праву грядку" },
  { cells: Array.from({ length: ROWS - 2 }, (_, k) => (k + 1) * COLS), stars: 5, coins: 300, name: "ліву грядку" },
  { cells: Array.from({ length: COLS }, (_, c) => (ROWS - 1) * COLS + c), stars: 8, coins: 500, name: "нижній ряд" },
  { cells: Array.from({ length: COLS }, (_, c) => c), stars: 12, coins: 800, name: "верхній ряд" }
];
const WEAR_MAX = gl => 90 + 30 * (gl - 1);
const PERISH = ["dairy", "fruit", "bake"], SPOIL_MS = 24 * 3600e3;

/* відкрита клітинка головної дошки? */
/* скільки смуг відкрито на поточній дошці (город — S.bstage, майстерня — S.wood.stage) */
function boardStage() { return S && S.woodOn && S.wood ? S.wood.stage : S ? S.bstage : undefined; }
function cellOpen(i) {
  if (!S || (S.sideOn && !S.woodOn)) return true;
  const st = boardStage();
  if (st === undefined || st >= BOARD_STRIPS.length) return true;
  for (let k = st; k < BOARD_STRIPS.length; k++) if (BOARD_STRIPS[k].cells.includes(i)) return false;
  return true;
}

window.HARD = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const on = id => window.UNL && UNL.on(id);

  /* ---------- оновлення збережень ---------- */
  function init() {
    if (S.bstage === undefined) {
      if (!S.started) S.bstage = 0;
      else {
        // давня гра: не витісняємо жодного предмета — відкрито стільки смуг, скільки зайнято
        let need = 0;
        BOARD_STRIPS.forEach((s, k) => { if (s.cells.some(i => S.board[i] && !S.board[i].lock)) need = k + 1; });
        S.bstage = need;
        for (let k = need; k < BOARD_STRIPS.length; k++) BOARD_STRIPS[k].cells.forEach(i => { if (S.board[i] && S.board[i].lock) S.board[i] = null; });
      }
    }
    const t = now(), stamp = it => { if (it && PERISH.includes(it.c) && !it.t) it.t = t; };
    (S.sideOn ? S.main : S.board).forEach(stamp); (S.inbox || []).forEach(stamp); ((S.store && S.store.items) || []).forEach(stamp);
    save();
  }

  /* ---------- 1. розширення дошки ---------- */
  const nextStrip = () => { const st = boardStage(); if (st >= BOARD_STRIPS.length) return null;
    const s = BOARD_STRIPS[st]; if (!S.woodOn) return s;
    const p = WOOD.stripPrice(st); return Object.assign({}, s, { stars: p[0], coins: p[1], name: s.name.replace("грядку", "стіну").replace("ряд", "ряд майстерні") }); };
  const isNextLabel = i => { const s = nextStrip(); return !!s && s.cells[Math.floor(s.cells.length / 2)] === i; };
  function expandModal() {
    const s = nextStrip(); if (!s) return;
    const ok = S.stars >= s.stars && S.coins >= s.coins;
    modal({ title: "Більше місця 🌱",
      html: `<div class="big-emoji">${face(CHARS.stepan, "big")}</div><p>Дід Степан розчистить <b>${s.name}</b> — це ще ${s.cells.length} клітинок для городу.</p>` +
        `<p class="rewards">${s.stars} ⭐ &nbsp; + &nbsp; ${s.coins} 🪙</p>` +
        `<p class="hint-s">Відкрито ${boardStage()} з ${BOARD_STRIPS.length}. Зірочки потрібні й для ремонту дворика — обирай, що важливіше 🙂</p>`,
      buttons: [{ label: ok ? "Розчистити" : `Бракує ${S.stars < s.stars ? (s.stars - S.stars) + " ⭐" : ""}${S.stars < s.stars && S.coins < s.coins ? " і " : ""}${S.coins < s.coins ? (s.coins - S.coins) + " 🪙" : ""}`, disabled: !ok, onClick: () => {
        S.stars -= s.stars; S.coins -= s.coins; if (S.woodOn) S.wood.stage++; else S.bstage++;
        s.cells.forEach(i => popIdx.add(i));
        sfx.level(); confetti(); toast("🌱 Дошка більшає: +" + s.cells.length + " клітинок!");
        renderAll(); save();
      } }, { label: "Пізніше", cls: "ghost" }] });
  }
  /* для renderBoard: що показати в закритій клітинці */
  function shutKey(i) { return cellOpen(i) ? null : isNextLabel(i) ? "shut:lbl" : nextStrip() && nextStrip().cells.includes(i) ? "shut:next" : "shut"; }
  function shutHtml(i) { return isNextLabel(i) ? `<span class="shut-lbl">🔒<small>${nextStrip().stars}⭐</small></span>` : ""; }

  /* ---------- 2. знос генераторів ---------- */
  const wears = it => it && it.g && GENS[it.g] && !GENS[it.g].side && it.g !== (window.EVENT && EVENT.gen);
  const broken = it => on("wear") && wears(it) && !!it.broken;
  function wear(it, n = 1) {
    if (!on("wear") || !wears(it)) return;
    it.wr = (it.wr || 0) + n;
    const max = WEAR_MAX(MECH.gl(it));
    if (it.wr >= max) {
      it.broken = true;
      const own = GENS[it.g].chain, others = S.gens.map(g => GENS[g].chain).filter(c => c !== own);
      it.fix = [{ c: own, l: Math.min(CHAINS[own].items.length - 1, 3) }, { c: others.length ? pick(others) : own, l: 2 }];
      setTimeout(() => toast(`🔧 ${GENS[it.g].name} зламалась! Тапни — дід Степан скаже, що треба для ремонту`), 500);
    } else if (it.wr === Math.round(max * 0.8)) setTimeout(() => toast(`🔧 ${GENS[it.g].name} уже скрипить — скоро треба буде лагодити`), 500);
  }
  const fixCoins = it => { const b = 200 + 100 * MECH.gl(it); return window.ECON ? ECON.price("repair", b) : b; };
  function findFix(fix) {
    const used = new Set();
    return fix.map(n => { const i = S.board.findIndex((x, k) => x && !x.g && !x.lock && !x.st && !used.has(k) && x.c === n.c && x.l === n.l); if (i >= 0) used.add(i); return i; });
  }
  function repairModal(i) {
    const it = S.board[i], f = findFix(it.fix), ok = f.every(x => x >= 0), price = fixCoins(it);
    sfx.nope();
    modal({ title: "Ремонт 🔧",
      html: `<div class="big-emoji">${GENS[it.g].icon}</div><p><b>${GENS[it.g].name}</b> зламалась. Дід Степан полагодить, якщо принесеш:</p>` +
        `<div class="fx-need">${it.fix.map((n, k) => `<span class="fx-it${f[k] >= 0 ? " have" : ""}"><b>${itemIcon(n)}</b><small>${itemName(n)}</small></span>`).join("")}</div>` +
        `<p class="hint-s">Або заплати майстрові з міста. А ще два однакові генератори, злиті разом, дають новенький.</p>`,
      buttons: [{ label: ok ? "Полагодити 🔧" : "Бракує предметів", disabled: !ok, onClick: () => {
          f.forEach(j => { S.board[j] = null; if (selected === j) selected = -1; }); fixed(i);
        } },
        { label: `Майстер за ${price} 🪙`, cls: "ghost", disabled: S.coins < price, onClick: () => { S.coins -= price; window.ECON && ECON.bought("repair"); fixed(i); } },
        { label: "Пізніше", cls: "ghost" }] });
  }
  function fixed(i) {
    const it = S.board[i]; delete it.broken; delete it.fix; it.wr = 0;
    sfx.level(); sparkle(i, "✨", 8); popIdx.add(i);
    playDialog([["stepan", "Готово! Як новенька — ще послужить 🔧"]]);
    renderBoard(); renderTop(); renderInfo(); renderOrders(); save();
  }
  function genInfo(it) {
    if (!on("wear") || !wears(it)) return "";
    if (it.broken) return " · 🔧 зламана — тапни для ремонту";
    return ` · знос ${it.wr || 0}/${WEAR_MAX(MECH.gl(it))}`;
  }

  /* ---------- 4. продукти, що черствіють ---------- */
  const perish = it => it && !it.g && PERISH.includes(it.c);
  function stamp(it) { if (perish(it) && !it.t) it.t = now(); }
  const mergedT = (A, B) => Math.min(A.t || now(), B.t || now());
  const stale = it => on("spoil") && perish(it) && !!it.old;
  function freshInfo(it) {
    if (!on("spoil") || !perish(it)) return "";
    if (it.old) return " · 🍞‍🥀 зачерствіло — коштує вдвічі менше";
    const h = Math.max(1, Math.ceil((SPOIL_MS - (now() - (it.t || now()))) / 36e5));
    return ` · свіже ще ${h} год`;
  }
  let lastSpoil = 0;
  function spoilTick() {
    if (!on("spoil") || S.sideOn || Date.now() - lastSpoil < 15000) return;
    lastSpoil = Date.now();
    let ch = false;
    S.board.forEach((it, i) => { if (perish(it) && !it.old && it.t && now() - it.t >= SPOIL_MS) { it.old = 1; ch = true; popIdx.add(i); } });
    if (ch) { renderBoard(); renderInfo(); save(); toast("🍞‍🥀 Частина продуктів на дошці зачерствіла — віддай чи продай свіжими!"); }
  }
  /* скільки монет зняти з замовлення за зачерствілі предмети */
  function stalePenalty(idx) {
    return idx.reduce((s, i) => s + (stale(S.board[i]) ? Math.round(itemValue(S.board[i].c, S.board[i].l) * 0.45) : 0), 0);
  }

  function tick() { if (!S || !S.started) return; spoilTick(); }
  return { init, expandModal, shutKey, shutHtml, broken, wear, repairModal, genInfo, stamp, mergedT, stale, freshInfo, stalePenalty, tick, perish };
})();
