"use strict";
/* ============================================================
   ТОЛОКА ВИХІДНОГО ДНЯ 🥄 (як «Садовий бенкет» у записі)
   З п'ятниці 6:00 до понеділка 6:00 усе село разом готує свято.
   За замовлення даються ложки 🥄; ложками крутиш колесо — бали йдуть у спільну скарбничку.
   Троє сусідів-напарників теж докладають бали самі. 5 етапів спільної мети — 5 нагород.
   Стан: S.tol = { id (п'ятниця тижня), spoons, mine, got (етапів забрано), mult }
   ============================================================ */
const TOL_THEMES = [
  { name: tt`Сільський бенкет`, icon: "🍲", what: tt`наготувати частування на все село` },
  { name: tt`Свято врожаю`,     icon: "🌾", what: tt`прикрасити площу снопами й гарбузами` },
  { name: tt`Нова криниця`,     icon: "🪣", what: tt`викопати й прикрасити нову криницю` },
  { name: tt`Вечорниці`,        icon: "🎻", what: tt`приготувати хату для вечорниць` }
];
const TOL_TARGET = 5000;
const TOL_STAGES = [
  { at: 0.2, r: { chest: 0, energy: 10 } },
  { at: 0.4, r: { chest: 1 } },
  { at: 0.6, r: { cards: 3, coins: 100 } },
  { at: 0.8, r: { chest: 1, stars: 3 } },
  { at: 1.0, r: { chest: 2, coins: 300, stars: 5 } }
];
const TOL_WHEEL = [1, 5, 1, 20, 5, 1, 10, 2];       // сегменти колеса (× 10 балів)
const TOL_SPOONS = { order: 1, special: 2, daily: 5 };

window.TOLOKA = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const on = () => window.UNL && UNL.on("toloka");
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  /* п'ятниця 6:00 поточного «тижня толоки» */
  function friStart(t) {
    const d = new Date(t || now()); d.setHours(6, 0, 0, 0);
    const back = (d.getDay() + 2) % 7;                 // скільки днів від п'ятниці
    d.setDate(d.getDate() - back);
    if (d.getTime() > (t || now())) d.setDate(d.getDate() - 7);
    return d.getTime();
  }
  const winEnd = s => s + 3 * 864e5;
  const active = () => { const s = friStart(); return now() < winEnd(s); };
  const theme = id => TOL_THEMES[Math.floor(id / (7 * 864e5)) % TOL_THEMES.length];
  function rng(seed) { let s = (Math.floor(seed / 1e5) * 2654435761) >>> 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  /* напарники: троє знайомих сусідів, кожен докладає свою частку з часом */
  function mates(id) {
    const r = rng(id), pool = Object.keys(CHARS).filter(c => c !== "cat" && (CHARS[c].from || 0) <= S.chapter && PORTRAITS.includes(c));
    const out = [];
    while (out.length < 3 && pool.length) { const k = pool.splice(Math.floor(r() * pool.length), 1)[0]; out.push({ who: k, target: 350 + Math.floor(r() * 450), p: 0.6 + r() * 0.8 }); }
    const f = Math.max(0, Math.min(1, (now() - id) / (3 * 864e5)));
    out.forEach(m => m.pts = Math.round(m.target * Math.pow(f, m.p) / 5) * 5);
    return out;
  }
  const st = () => (S.tol && S.tol.id === friStart() && active() ? S.tol : null);
  const teamPts = t => t.mine + mates(t.id).reduce((a, m) => a + m.pts, 0);

  function sync() {
    if (!on()) return null;
    if (!active()) return null;
    if (!S.tol || S.tol.id !== friStart()) { S.tol = { id: friStart(), spoons: 3, mine: 0, got: 0, mult: 1, intro: false }; save(); }
    return S.tol;
  }
  function add(n) { const t = sync(); if (!t) return; t.spoons += n; save(); if (window.HUB) HUB.renderDot(); }
  function onDeliver(o) { add(o.paw || o.urgent || o.dish || o.ev ? TOL_SPOONS.special : TOL_SPOONS.order); }

  function grantStages(t, silent) {
    const total = teamPts(t), done = [];
    while (t.got < TOL_STAGES.length && total >= TOL_STAGES[t.got].at * TOL_TARGET) {
      const r = TOL_STAGES[t.got].r; t.got++;
      if (r.chest !== undefined) placeItem({ c: "chest", l: r.chest });
      if (r.energy) { regen(); S.energy += r.energy; }
      if (r.coins) S.coins += r.coins; if (r.stars) S.stars += r.stars;
      if (r.cards) { if (window.UNL && UNL.on("album")) ALB.give(r.cards, tt`З толоки`); else S.coins += 30 * r.cards; }
      done.push(t.got);
    }
    if (done.length) {
      save(); renderAll();
      if (!silent) { sfx.level(); toast(tt`🥄 Толока: етап ${done[done.length - 1]}/5 — нагорода вже на дошці!`); if (t.got === 5) confetti(); }
    }
  }

  /* ---------- колесо ---------- */
  let spinning = false, angle = 0;
  function spin() {
    const t = st(); if (!t || spinning) return;
    if (t.spoons < t.mult) { sfx.nope(); toast(tt`Бракує ложок 🥄 — їх дають за замовлення сусідів`); return; }
    t.spoons -= t.mult;
    const k = rnd(TOL_WHEEL.length), seg = 360 / TOL_WHEEL.length;
    angle += 360 * 4 + (360 - (angle % 360)) - k * seg - seg / 2 + (Math.random() - 0.5) * seg * 0.6;
    const w = $("tolWheel"); spinning = true; sfx.pop();
    if (w) w.style.transform = `rotate(${angle}deg)`;
    setTimeout(() => {
      spinning = false;
      const pts = TOL_WHEEL[k] * 10 * t.mult;
      t.mine += pts; save();
      sfx.coin(); if (TOL_WHEEL[k] >= 10) { sfx.level(); confetti(); }
      toast(tt`🎡 ×${TOL_WHEEL[k]}${t.mult > 1 ? " ×" + t.mult : ""}: +${pts} балів у спільну скарбничку!`);
      grantStages(t);
      panel(true);
    }, w ? 2300 : 50);
  }
  function setMult(m) { const t = st(); if (!t) return; t.mult = m; save(); panel(true); }

  function left() {
    const ms = winEnd(friStart()) - now(), t = Math.ceil(ms / 6e4), h = Math.floor(t / 60);
    return h >= 24 ? Math.floor(h / 24) + tt` д ` + (h % 24) + tt` год` : h + tt` год ` + (t % 60) + tt` хв`;
  }
  function panel(keep) {
    const t = sync();
    if (!t) { modal({ title: tt`Толока 🥄`, html: tt`<div class="big-emoji">🥄</div><p>Толока буває щовихідних — з п'ятниці до понеділка. Наступна — через ${untilNext()}.</p>`, buttons: [{ label: tt`Добре` }] }); return; }
    const th = theme(t.id), team = mates(t.id), total = teamPts(t), pct = Math.min(1, total / TOL_TARGET);
    const seg = 360 / TOL_WHEEL.length;
    const labels = TOL_WHEEL.map((v, i) => `<span style="transform:rotate(${i * seg + seg / 2}deg)"><b>${v}</b></span>`).join("");
    const stages = TOL_STAGES.map((s, i) => `<i class="${i < t.got ? "on" : ""}" style="left:${s.at * 100}%">${i < t.got ? "✓" : i === 4 ? "🎁" : i + 1}</i>`).join("");
    const mateRows = [tt`<div class="tl-mate me"><span>🏡</span><b>Ти</b><em>${t.mine}</em></div>`].concat(team.map(m =>
      `<div class="tl-mate"><span>${face(CHARS[m.who], "mini")}</span><b>${shortName(CHARS[m.who].name)}</b><em>${m.pts}</em></div>`)).join("");
    modal({ title: tt`Толока: ${th.name} ${th.icon}`,
      html: tt`<p class="tl-sub">Разом ${th.what}! До кінця: <b>${left()}</b></p>` +
        `<div class="tl-prog"><div class="tl-bar"><b style="width:${pct * 100}%"></b>${stages}</div><small>${total} / ${TOL_TARGET}</small></div>` +
        `<div class="tl-team">${mateRows}</div>` +
        `<div class="tl-wheel-wrap"><div class="tl-pin">▼</div><div class="tl-wheel" id="tolWheel" style="transform:rotate(${angle}deg)">${labels}</div>` +
        `<button class="tl-spin" id="tolSpin"><span>🥄</span><b>${t.mult}</b></button></div>` +
        tt`<div class="tl-row"><span class="tl-sp">🥄 <b>${t.spoons}</b> ложок</span><span class="tl-mult">${[1, 2, 3].map(m => `<button class="tl-m${t.mult === m ? " on" : ""}" data-m="${m}">×${m}</button>`).join("")}</span></div>` +
        tt`<p class="hint-s">Ложки 🥄 — за замовлення (+1, особливі +2) і завдання дня (+5). Крутиш колесо — бали в спільну скарбничку. ×2 і ×3 — більше ложок, більше балів.</p>`,
      buttons: [{ label: tt`Закрити`, cls: "ghost" }] });
    $("tolSpin").onclick = spin;
    document.querySelectorAll(".tl-m").forEach(b => b.onclick = () => setMult(+b.dataset.m));
  }
  function untilNext() {
    const n = friStart() + 7 * 864e5, ms = n - now(), d = Math.floor(ms / 864e5), h = Math.ceil(ms % 864e5 / 36e5);
    return d ? d + tt` д ` + h + tt` год` : h + tt` год`;
  }

  function tick() {
    if (!on() || !S.started) return;
    const t = sync(); if (!t) return;
    if (Date.now() % 10000 < 1000) grantStages(t);
    if (!t.intro && !busyUI() && !S.sideOn) {
      t.intro = true; save();
      const th = theme(t.id), m = mates(t.id);
      playDialog([[m[0] ? m[0].who : "halya", tt`{name}, на вихідних — толока! ${th.icon} Збираємося разом ${th.what}. Ти з нами?`],
        ["halya", tt`За кожне замовлення — ложка 🥄. Ложками крутиш колесо, а бали йдуть у спільну скарбничку. Що більше назбираємо — то щедріші гостинці всім!`]],
        () => panel());
    }
  }
  function card() {
    if (!on()) return null;
    const t = sync();
    if (!t) return { icon: "🥄", title: tt`Толока вихідного дня`, sub: tt`Наступна — через ` + untilNext(), btn: "", act: "" };
    const th = theme(t.id);
    return { icon: th.icon, title: tt`Толока: ` + th.name, sub: tt`🥄 ${t.spoons} · етап ${t.got}/5 · ще ${left()}`, btn: tt`Крутити`, act: "toloka", ready: t.spoons > 0 };
  }
  return { add, onDeliver, panel, tick, card, ready: () => { const t = on() && sync(); return !!(t && t.spoons > 0); } };
})();
