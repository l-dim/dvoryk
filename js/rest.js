"use strict";
/* ============================================================
   ЧАС ПЕРЕПОЧИТИ ☕ — грати поспіль можна до години, на складніших рівнях — менше (від 9-го рівня
   щорівня мінус півтори хвилини, аж до пів години).
   Рахується час, коли ти щось робиш на дошці: паузи до 3 хв — теж гра, довша пауза — уже відпочинок.
   Коли час вийшов, генератори не тапаються, поки господиня не перепочине: сили вертаються
   за 4 години відпочинку (знову тапати можна, коли набереться хоча б 20 хв гри).
   Об'єднувати й віддавати замовлення можна й під час перепочинку.
   «Друге дихання» (покупка, поки заглушка) — +1 година гри.
   Стан: S.play = { used (мс зіграно), at (остання дія), rs (до коли зараховано відпочинок), tired, warned }
   ============================================================ */
const REST_GAP = 3 * 60e3, REST_FULL_MS = 4 * 3600e3, REST_WARN = 10 * 60e3, REST_RESUME = 20 * 60e3;

window.REST = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const P = (f, m) => (S.sex === "m" ? m : f);
  const budget = () => { const L = S.level || 1; return Math.round(L <= 8 ? 60 : Math.max(30, 60 - (L - 8) * 1.5)) * 60e3; };
  const st = () => (S.play = S.play || { used: 0, at: 0 });
  const rate = () => budget() / REST_FULL_MS;                 // скільки гри повертає 1 мс відпочинку
  const mins = ms => { const m = Math.max(1, Math.ceil(ms / 6e4)); return m >= 60 ? Math.floor(m / 60) + tt` год` + (m % 60 ? " " + (m % 60) + tt` хв` : "") : m + tt` хв`; };

  /* відпочинок від останньої дії (якщо пауза довша за 3 хв) */
  function settle(t = now()) {
    const p = st();
    if (p.at && t - p.at > REST_GAP) {                        // пауза — уже відпочинок (зараховуємо лише ще не враховане)
      const from = Math.max(p.at, p.rs || 0);
      p.used = Math.max(0, p.used - (t - from) * rate()); p.rs = t;
    }
    if (p.tired && budget() - p.used >= Math.min(budget(), REST_RESUME)) p.tired = false;
    if (p.used < budget() - REST_WARN) p.warned = false;
    return p;
  }
  const left = () => Math.max(0, budget() - settle().used);
  /* скільки ще відпочивати: до 20 хв гри / до повних сил */
  function backIn() { const p = settle(); return Math.max(0, (p.used - (budget() - Math.min(budget(), REST_RESUME))) / rate()); }
  function fullIn() { return Math.max(0, settle().used / rate()); }

  /* будь-яка дія на дошці */
  function mark() {
    const t = now(), p = st();
    if (p.at && t - p.at <= REST_GAP) p.used += t - p.at; else settle(t);
    p.at = p.rs = t;
    const l = budget() - p.used;
    if (!p.warned && l > 0 && l <= REST_WARN) {
      p.warned = true;
      setTimeout(() => toast(tt`☕ Ще ${mins(l)} — і господині час перепочити`), 500);
    }
  }
  /* чи можна тапнути генератор */
  function canTap() {
    const p = settle();
    if (!p.tired && p.used < budget()) return true;
    p.tired = true; save();
    tiredModal();
    return false;
  }
  let tick = null;
  function tiredModal() {
    sfx.nope();
    modal({
      title: tt`Час перепочити ☕`,
      html: tt`<div class="big-emoji">🫖</div>
        <p>${P(tt`Ти так захопилась`, tt`Ти так захопився`)} — ${mins(budget())} гри поспіль! Господині треба перепочити, генераторам — теж.</p>
        <p>Знову тапати можна буде за <b id="rsBack">${mins(backIn())}</b>, а сили повністю повернуться за <b id="rsFull">${mins(fullIn())}</b>.</p>
        <p class="hint-s">Поки відпочиваєш — можна об'єднати й віддати те, що вже є на дошці.</p>`,
      buttons: [
        ...(window.PAY ? [{ label: tt`☕ Друге дихання · 49 ₴`, cls: "ghost", onClick: () => PAY.buy("rest60") }] : []),
        { label: tt`Добре, відпочину 💤` }
      ]
    });
    clearInterval(tick);
    tick = setInterval(() => {
      const a = document.getElementById("rsBack"), b = document.getElementById("rsFull");
      if (!a || !$("modal").classList.contains("show")) { clearInterval(tick); return; }
      a.textContent = mins(backIn()); b.textContent = mins(fullIn());
    }, 5000);
  }
  /* рядок для вікна енергії */
  function line() {
    const p = settle();
    if (p.tired || p.used >= budget()) return tt`<p class="hint-s">☕ Зараз час перепочити — знову тапати можна за <b>${mins(backIn())}</b>.</p>`;
    return tt`<p class="hint-s">☕ Грати поспіль: ще <b>${mins(left())}</b> із ${mins(budget())}, потім — перепочинок.</p>`;
  }
  /* «Друге дихання» */
  function refill(min) { const p = settle(); p.used = Math.max(0, p.used - min * 60e3); p.tired = false; p.warned = false; save(); }

  /* підключаємося до дій гри */
  const _produce = produce, _drop = handleDrop, _deliver = deliver;
  produce = function (i) { if (!canTap()) return; mark(); return _produce.apply(this, arguments); };
  handleDrop = function () { mark(); return _drop.apply(this, arguments); };
  deliver = function () { mark(); return _deliver.apply(this, arguments); };

  return { budget, left, backIn, fullIn, line, refill, canTap, mark };
})();
