"use strict";
/* ============================================================
   ЕКОНОМІКА
   • Ціни, що ростуть: кожна платна послуга за монети дорожчає на 20% до кінця дня
     (розбудити генератор, розчистити павутиння, пришвидшити піч, майстер-ремонт,
     полиця у сховку, подарунки й зірочка в крамничці). Стан: S.dayBuys = { day, n: { вид: скільки } }
   • Ліміт продажу: 10 предметів на день. Стан: S.sold = { day, n }
   • Платні сюжетні завдання: частина завдань у дворику просить, крім ⭐, ще монети або предмет.
   ============================================================ */
const PRICE_STEP = 1.2, SELL_LIMIT = 10;

window.ECON = (() => {
  const on = id => window.UNL && UNL.on(id);
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  function day() { if (!S.dayBuys || S.dayBuys.day !== today()) S.dayBuys = { day: today(), n: {} }; return S.dayBuys; }
  /* поточна ціна послуги з урахуванням покупок сьогодні */
  function price(kind, base) {
    if (!on("prices")) return base;
    return Math.round(base * Math.pow(PRICE_STEP, day().n[kind] || 0) / 5) * 5;
  }
  function bought(kind) { if (!on("prices")) return; const d = day(); d.n[kind] = (d.n[kind] || 0) + 1; save(); }
  const upNote = (kind, base) => on("prices") && (day().n[kind] || 0) ? tt` (сьогодні вже ×${(price(kind, base) / base).toFixed(1)})` : "";

  /* ---------- продаж ---------- */
  function soldToday() { if (!S.sold || S.sold.day !== today()) S.sold = { day: today(), n: 0 }; return S.sold.n; }
  const canSell = () => !on("selllimit") || soldToday() < SELL_LIMIT;
  function onSold() { if (!on("selllimit")) return; soldToday(); S.sold.n++; save(); }
  const sellNote = () => on("selllimit") ? `${SELL_LIMIT - soldToday()}/${SELL_LIMIT}` : "";

  /* ---------- сюжетні завдання ---------- */
  /* детерміновано: кожне третє завдання — ще й монети, кожне третє — ще й предмет (з 2-го розділу) */
  function taskExtra(chIdx, k) {
    if (!on("paidtasks") || chIdx < 1) return null;
    const t = STORY[chIdx].tasks[k], slot = (chIdx * 3 + k) % 3;
    if (slot === 1) return { coins: Math.round(t.cost * (20 + chIdx) / 5) * 5 };
    if (slot === 2) {
      const chains = S.gens.map(g => GENS[g].chain).filter(c => PRODUCT_CHAINS.includes(c));
      const c = chains[(chIdx * 7 + k) % chains.length];
      return { item: { c, l: Math.min(CHAINS[c].items.length - 3, 2 + Math.floor(Math.min(chIdx, 35) / 7)) } };   // не найвищі рівні
    }
    return null;
  }
  const mainBoard = () => (S.sideOn ? S.main : S.board);
  const findItem = it => mainBoard().findIndex(x => x && !x.g && !x.lock && !x.st && x.c === it.c && x.l === it.l);
  function taskReady(chIdx, k) {
    const t = STORY[chIdx].tasks[k], x = taskExtra(chIdx, k);
    if (S.stars < t.cost) return false;
    if (x && x.coins && S.coins < x.coins) return false;
    if (x && x.item && findItem(x.item) < 0) return false;
    return true;
  }
  function taskLabel(chIdx, k) {
    const t = STORY[chIdx].tasks[k], x = taskExtra(chIdx, k);
    return `${t.cost} ⭐` + (x ? x.coins ? ` + ${x.coins} 🪙` : ` + ${itemIcon(x.item)}` : "");
  }
  function taskMissing(chIdx, k) {
    const t = STORY[chIdx].tasks[k], x = taskExtra(chIdx, k), m = [];
    if (S.stars < t.cost) m.push((t.cost - S.stars) + " ⭐");
    if (x && x.coins && S.coins < x.coins) m.push((x.coins - S.coins) + " 🪙");
    if (x && x.item && findItem(x.item) < 0) m.push(itemIcon(x.item) + " " + itemName(x.item) + tt` на дошці`);
    return m.join(", ");
  }
  /* списати додаткову плату (після перевірки) */
  function payTask(chIdx, k) {
    const x = taskExtra(chIdx, k); if (!x) return;
    if (x.coins) S.coins -= x.coins;
    if (x.item) { const b = mainBoard(), i = findItem(x.item); if (i >= 0) { b[i] = null; if (!S.sideOn && selected === i) selected = -1; } renderBoard(); }
  }
  return { price, bought, upNote, canSell, onSold, sellNote, taskExtra, taskReady, taskLabel, taskMissing, payTask };
})();
