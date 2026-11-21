"use strict";
/* ============================================================
   УСКЛАДНЕННЯ МАЙСТЕРНІ 🪚 (свої, не як на городі)
   1. Тупі інструменти: після ~60 тапів верстат тупиться — 35% тапів дають «брак» (кривий брусок,
      не зливається, займає місце). Наточити: зачекати 30 хв або заплатити.  Стан на генераторі: it.wd, it.dull, it.sharpUntil
   2. Клей сохне: вироби від 3-го рівня після злиття сохнуть 10–40 хв — поки 💧, їх не можна
      ні злити, ні віддати.  Стан на предметі: it.dry (коли висохне)
   3. Шашіль 🐛: раз на кілька годин заводиться у виробі; такий виріб не можна використати,
      а за 6 год шашіль переповзає на сусідній. Лікує злиття поруч або обробка за монети.
      Стан на предметі: it.worm (коли переповзе далі); S.wood.wormAt — коли з'явиться наступна
   4. Гарнітури: іноді просять комплект із 3 різних виробів — 12 годин, нагорода ×1.6 і більше ⭐.
   ============================================================ */
window.PUA_MAP = window.PUA_MAP || {};
CHAINS.woodjunk = { name: "Брак", side: true, woody: true, nomerge: true, value: 2, items: [[String.fromCharCode(0xE480), "Кривий брусок"]] };
PUA_MAP[String.fromCharCode(0xE480)] = { e: "🪃", img: "items/woodjunk.webp" };   // кривий, як бумеранг 😄
const DULL_AT = 60, DULL_JUNK = 0.35, SHARPEN_MIN = 30, SHARPEN_COINS = 120;
const DRY_MIN = l => (l - 2) * 10, WORM_EVERY_H = [3, 6], WORM_SPREAD_H = 6, WORM_CURE = 90;

window.WH = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const woody = it => !!(it && !it.g && CHAINS[it.c] && CHAINS[it.c].timber);   // лише деревина
  const woodGen = it => !!(it && it.g && GENS[it.g] && CHAINS[GENS[it.g].chain] && CHAINS[GENS[it.g].chain].timber);
  const wboard = () => (S.woodOn ? S.board : S.wood && S.wood.board);
  const hm = ms => { const t = Math.max(1, Math.ceil(ms / 6e4)); return t >= 60 ? Math.floor(t / 60) + " год " + (t % 60) + " хв" : t + " хв"; };
  function hint(flag, lines) {
    if (!S.wood || S.wood["seen_" + flag]) return;
    S.wood["seen_" + flag] = true; save();
    setTimeout(() => playDialog(lines), 600);
  }

  /* ---------- 1. тупі інструменти ---------- */
  const sharpening = it => !!(it.sharpUntil && now() < it.sharpUntil);
  function afterTap(gIt, item) {
    if (!woodGen(gIt)) return item;
    if (gIt.sharpUntil && now() >= gIt.sharpUntil) { delete gIt.sharpUntil; gIt.dull = false; gIt.wd = 0; }
    gIt.wd = (gIt.wd || 0) + 1;
    if (!gIt.dull && gIt.wd >= DULL_AT) {
      gIt.dull = true;
      hint("dull", [[LOVE.who(), "Ой, інструмент затупився 😅 Тепер частина виробів виходить кривою. Тапни верстат і натисни «Наточити» — або почекай, або заплати точильникові."]]);
    }
    if (gIt.dull && Math.random() < DULL_JUNK) return { c: "woodjunk", l: 0 };
    return item;
  }
  function canTap(i) {
    const it = S.board[i];
    if (!woodGen(it) || !sharpening(it)) return true;
    sfx.nope(); toast(`🪨 Точиться ще ${hm(it.sharpUntil - now())}`);
    return false;
  }
  const sharpPrice = () => (window.ECON ? ECON.price("sharpen", SHARPEN_COINS) : SHARPEN_COINS);
  function sharpenModal(i) {
    const it = S.board[i];
    modal({ title: "Наточити інструмент 🪨",
      html: `<div class="big-emoji">${GENS[it.g].icon}</div><p><b>${GENS[it.g].name}</b> затупився — ${Math.round(DULL_JUNK * 100)}% виробів виходять кривими.</p><p class="hint-s">Самому наточити — ${SHARPEN_MIN} хв (верстат тим часом не працює). Точильник зробить одразу.</p>`,
      buttons: [{ label: `Наточити самому · ${SHARPEN_MIN} хв`, onClick: () => { it.sharpUntil = now() + SHARPEN_MIN * 60e3; save(); renderBoard(); renderInfo(); toast("🪨 Точимо…"); } },
        { label: `Точильник · ${sharpPrice()} 🪙`, cls: "ghost", disabled: S.coins < sharpPrice(), onClick: () => { S.coins -= sharpPrice(); window.ECON && ECON.bought("sharpen"); it.dull = false; it.wd = 0; delete it.sharpUntil; sfx.coin(); toast("✨ Як бритва!"); renderBoard(); renderTop(); renderInfo(); save(); } },
        { label: "Пізніше", cls: "ghost" }] });
  }
  function genInfo(it) {
    if (!woodGen(it)) return "";
    if (sharpening(it)) return ` · 🪨 точиться ще ${hm(it.sharpUntil - now())}`;
    if (it.dull) return " · 🪨 тупий — брак 35%";
    return ` · гострота ${Math.max(0, DULL_AT - (it.wd || 0))}/${DULL_AT}`;
  }
  function genButton(it) { return woodGen(it) && it.dull && !sharpening(it) ? `<button class="sell sharp-b" id="sharpBtn"><small>наточити</small><span>🪨</span></button>` : ""; }

  /* ---------- 2. клей сохне ---------- */
  const wet = it => !!(it && it.dry && now() < it.dry);
  function onMerged(b, nl) {
    const it = S.board[b];
    if (!woody(it)) return;
    if (nl >= 3) { it.dry = now() + DRY_MIN(nl) * 60e3; hint("dry", [[LOVE.who(), "Клей ще не висох 💧 Поки сохне — не зливай і не віддавай цей виріб. Великі речі сохнуть довше!"]]); }
    cureAround(b);
  }
  /* чи можна зливати/віддавати */
  const usable = it => !wet(it) && !(it && it.worm) && !(window.CRAFT && CRAFT.unusable(it));

  /* ---------- 3. шашіль ---------- */
  function cureAround(b) {
    const r = Math.floor(b / COLS), c = b % COLS;
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) return;
      const j = rr * COLS + cc, it = S.board[j];
      if (it && it.worm) { delete it.worm; popIdx.add(j); sparkle(j, "✨", 5); toast("🐛 Шашіль вигнали!"); }
    });
  }
  const wormPrice = () => (window.ECON ? ECON.price("worm", WORM_CURE) : WORM_CURE);
  function wormModal(i) {
    const it = S.board[i];
    modal({ title: "Шашіль 🐛",
      html: `<div class="big-emoji">🐛</div><p>У «${itemName(it)}» завівся шашіль! Такий виріб не можна ні злити, ні віддати, а за ${WORM_SPREAD_H} год шашіль переповзе на сусідній.</p><p class="hint-s">Злий щось на сусідній клітинці — і шашіль втече. Або оброби воском.</p>`,
      buttons: [{ label: `Обробити воском · ${wormPrice()} 🪙`, disabled: S.coins < wormPrice(), onClick: () => { S.coins -= wormPrice(); window.ECON && ECON.bought("worm"); delete it.worm; sfx.coin(); popIdx.add(i); renderBoard(); renderTop(); save(); } },
        { label: "Добре", cls: "ghost" }] });
  }
  function wormTick() {
    const b = wboard(); if (!b) return;
    const w = S.wood;
    if (!w.wormAt) { w.wormAt = now() + (WORM_EVERY_H[0] + Math.random() * (WORM_EVERY_H[1] - WORM_EVERY_H[0])) * 3600e3; save(); return; }
    let ch = false;
    if (now() >= w.wormAt) {
      const c = b.map((it, i) => woody(it) && it.c !== "woodjunk" && it.l >= 1 && !it.worm ? i : -1).filter(i => i >= 0);
      if (c.length) { const i = pick(c); b[i].worm = now() + WORM_SPREAD_H * 3600e3; ch = true;
        if (S.woodOn) { popIdx.add(i); hint("worm", [[LOVE.who(), "Ой лихо — шашіль! 🐛 Злий щось поруч — і він утече. Не зволікай, бо переповзе на інші вироби!"]]); } }
      w.wormAt = now() + (WORM_EVERY_H[0] + Math.random() * (WORM_EVERY_H[1] - WORM_EVERY_H[0])) * 3600e3;
    }
    b.forEach((it, i) => {
      if (!it || !it.worm || now() < it.worm) return;
      it.worm = now() + WORM_SPREAD_H * 3600e3;
      const r = Math.floor(i / COLS), cc = i % COLS;
      const nb = [[r - 1, cc], [r + 1, cc], [r, cc - 1], [r, cc + 1]].filter(([a, d]) => a >= 0 && a < ROWS && d >= 0 && d < COLS).map(([a, d]) => a * COLS + d).filter(j => woody(b[j]) && !b[j].worm);
      if (nb.length) { const j = pick(nb); b[j].worm = now() + WORM_SPREAD_H * 3600e3; ch = true; if (S.woodOn) popIdx.add(j); }
    });
    if (ch) { save(); if (S.woodOn) renderBoard(); }
  }

  /* ---------- 4. гарнітури ---------- */
  const SETS = ["Весільний гарнітур", "Дитяча кімнатка", "Святковий стіл", "Подарунок на новосілля", "Кухонний набір"];
  function maybeSet(o) {
    const w = S.wood;
    if (!w || w.done < 8 || w.orders.some(x => x.set) || Math.random() >= 0.22) return o;
    const avail = [];
    w.gens.forEach(c => { const len = CHAINS[c].items.length; for (let l = 2; l <= Math.min(len - 1, 2 + Math.floor(w.done / 8)); l++) avail.push({ c, l }); });
    if (avail.length < 3) return o;
    const items = avail.sort(() => Math.random() - 0.5).slice(0, 3);
    let coins = 0; items.forEach(it => coins += itemValue(it.c, it.l));
    return Object.assign(o, { items, coins: Math.round(coins * 1.6), stars: 4, xp: 40, set: pick(SETS), until: now() + 12 * 3600e3 });
  }
  function expireSets() {
    if (!S.wood) return;
    const gone = S.wood.orders.filter(o => o.until && now() >= o.until);
    if (!gone.length) return;
    S.wood.orders = S.wood.orders.filter(o => !gone.includes(o));
    gone.forEach(o => toast(`⏰ «${o.set || "Замовлення"}» — не встигли, замовник пішов до іншого майстра`));
    if (S.woodOn) { fillOrders(); renderOrders(); }
    save();
  }

  /* ---------- вигляд плиток ---------- */
  function tileKey(it) { return (wet(it) ? ":w" : "") + (it && it.worm ? ":b" : "") + (window.CRAFT ? CRAFT.tileKey(it) : ""); }
  function decorate(t, it) {
    if (!t || !it || it.g) return;
    t.classList.toggle("wet", wet(it));
    if (window.CRAFT && (it.untested || it.short || t.querySelector(".test-b"))) CRAFT.decorate(t, it);
    t.classList.toggle("worm", !!it.worm);
    let w = t.querySelector(".worm-b");
    if (it.worm && !w) { w = document.createElement("span"); w.className = "worm-b"; w.textContent = "🐛"; t.appendChild(w); }
    else if (!it.worm && w) w.remove();
    let d = t.querySelector(".wet-t");
    if (wet(it)) { if (!d) { d = document.createElement("span"); d.className = "wet-t"; t.appendChild(d); } d.textContent = "💧" + Math.ceil((it.dry - now()) / 6e4); }
    else if (d) d.remove();
  }
  let lastRedraw = 0;
  function tick() {
    if (!S || !S.started || !S.wood) return;
    wormTick(); expireSets();
    if (S.woodOn && Date.now() - lastRedraw > 5000) {
      lastRedraw = Date.now();
      document.querySelectorAll(".tile").forEach(t => { const it = S.board[+t.dataset.i]; if (it && !it.g) decorate(t, it); });
      if (S.board.some(it => it && it.dry && now() >= it.dry && !it.dryDone)) { S.board.forEach(it => { if (it && it.dry && now() >= it.dry) { delete it.dry; } }); renderBoard(); renderOrders(); save(); }
    }
  }
  return { afterTap, canTap, sharpenModal, genInfo, genButton, wet, usable, onMerged, wormModal, maybeSet, tileKey, decorate, tick, woody };
})();
