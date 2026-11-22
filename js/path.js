"use strict";
/* ============================================================
   СЕЗОННА СТЕЖКА 🍂 (безкоштовна, щомісяця нова)
   Кроки за замовлення, завдання й пригоди → рівні стежки з нагородами.
   30 рівнів; на 30-му — сезонна прикраса у дворик. Далі — «нескінченні» подарунки.
   Стан: S.path = { id: "рік-місяць", pts, got (скільки рівнів забрано), inf (скільки подарунків після 30) }
         S.trophies = [ емодзі сезонних прикрас ]
   ============================================================ */
const PATH_SEASONS = [
  { name: "Зимова стежка",        icon: "❄️", prize: "⛄", prizeName: "Сніговик" },
  { name: "Стежка тепла",         icon: "💛", prize: "🕯️", prizeName: "Стрітенська свічка" },
  { name: "Весняна стежка",       icon: "🌷", prize: "🌷", prizeName: "Клумба тюльпанів" },
  { name: "Великодня стежка",     icon: "🥚", prize: "🧺", prizeName: "Великодній кошик" },
  { name: "Квітуча стежка",       icon: "🌸", prize: "🌸", prizeName: "Квітуча гілка" },
  { name: "Вишнева стежка",       icon: "🍒", prize: "🍒", prizeName: "Вишенька в саду" },
  { name: "Соняшникова стежка",   icon: "🌻", prize: "🌻", prizeName: "Соняшник до неба" },
  { name: "Жнивна стежка",        icon: "🌾", prize: "🌾", prizeName: "Святковий сніп" },
  { name: "Садова стежка",        icon: "🍐", prize: "🍐", prizeName: "Грушка-дичка" },
  { name: "Гарбузова стежка",     icon: "🎃", prize: "🎃", prizeName: "Гарбуз-велетень" },
  { name: "Осіння стежка",        icon: "🍂", prize: "🍁", prizeName: "Осінній вінок" },
  { name: "Святкова стежка",      icon: "🎄", prize: "🎄", prizeName: "Ялинка у дворі" }
];
const PATH_LEVELS = 30, PATH_COST = 35, PATH_INF = 50;
const PATH_PTS = { order: 2, special: 3, daily: 10, week: 30, side: 15 };
const MONTHS_GEN = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];

window.PATH = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const on = () => window.UNL && UNL.on("path");
  const sid = () => { const d = new Date(now()); return d.getFullYear() + "-" + d.getMonth(); };
  const season = () => PATH_SEASONS[new Date(now()).getMonth()];
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");

  /* нагорода рівня n (1…30) */
  function reward(n) {
    if (n === PATH_LEVELS) return { chest: 2, coins: 300, trophy: true };
    if (n % 10 === 0) return { chest: 2, gen: true };
    if (n % 5 === 0) return { chest: 1 };
    switch ((n - 1) % 4) {
      case 0: return { coins: 40 + 5 * n };
      case 1: return { energy: 4 + Math.floor(n / 5) };
      case 2: return { cards: 2 };
      default: return { stars: n >= 16 ? 2 : 1 };
    }
  }
  function rewIcon(r) {
    if (r.trophy) return season().prize;
    if (r.chest !== undefined) return CHAINS.chest.items[r.chest][0];
    if (r.coins) return "🪙"; if (r.energy) return "⚡"; if (r.cards) return window.UNL && UNL.on("album") ? "💌" : "🪙"; if (r.stars) return "⭐";
    return "🎁";
  }
  function rewText(r) {
    const p = [];
    if (r.trophy) p.push(season().prizeName + " у дворик");
    if (r.chest !== undefined) p.push(CHAINS.chest.items[r.chest][1]);
    if (r.gen) p.push("+ генератор");
    if (r.coins) p.push("+" + r.coins + " 🪙");
    if (r.energy) p.push("+" + r.energy + " ⚡");
    if (r.cards) p.push(window.UNL && UNL.on("album") ? r.cards + " листівки" : "+" + 30 * r.cards + " 🪙");
    if (r.stars) p.push("+" + r.stars + " ⭐");
    return p.join(" ");
  }
  function grant(r, seasonObj) {
    if (r.chest !== undefined) placeItem({ c: "chest", l: r.chest });
    if (r.gen) MECH.maybeGenCopy(1);
    if (r.coins) S.coins += r.coins;
    if (r.energy) { regen(); S.energy += r.energy; }
    if (r.cards) { if (window.UNL && UNL.on("album")) ALB.give(r.cards, "Зі стежки"); else S.coins += 30 * r.cards; }
    if (r.stars) S.stars += r.stars;
    if (r.trophy) { S.trophies = S.trophies || []; const e = (seasonObj || season()).prize; if (!S.trophies.includes(e)) S.trophies.push(e); }
  }

  const st = () => (S.path && S.path.id === sid() ? S.path : null);
  const reached = p => Math.min(PATH_LEVELS, Math.floor(p.pts / PATH_COST));
  const infReached = p => Math.max(0, Math.floor((p.pts - PATH_LEVELS * PATH_COST) / PATH_INF));
  const claimable = p => !!p && (p.got < reached(p) || p.inf < infReached(p));
  const ready = () => on() && claimable(st());

  /* новий місяць: доздаємо незабране з минулого сезону */
  function roll() {
    const old = S.path;
    S.path = { id: sid(), pts: 0, got: 0, inf: 0 };
    save();
    if (!old || !claimable(old)) return;
    const [y, m] = old.id.split("-").map(Number), so = PATH_SEASONS[m], parts = [];
    for (let n = old.got + 1; n <= reached(old); n++) { const r = reward(n); grant(r, so); parts.push(r.trophy ? so.prize : rewIcon(r)); }
    for (let k = old.inf; k < infReached(old); k++) { placeItem({ c: "chest", l: 0 }); parts.push("🎁"); }
    save(); renderAll();
    pendingEnd = { so, parts };
  }
  let pendingEnd = null;

  /* ---------- кроки ---------- */
  function add(n, why) {
    if (!on() || !S.started) return;
    if (!st()) roll();
    const p = S.path, before = reached(p), bInf = infReached(p);
    p.pts += n;
    save();
    if (reached(p) > before) setTimeout(() => toast(`${season().icon} Стежка: рівень ${reached(p)}! Нагорода — у 📋`), 1500);
    else if (infReached(p) > bInf) setTimeout(() => toast(`${season().icon} Стежка: ще один подарунок 🎁 — у 📋`), 1500);
    if (window.QUEST) QUEST.renderButton();
  }
  function onDeliver(o) { add(o.paw || o.urgent || o.dish || o.ev ? PATH_PTS.special : PATH_PTS.order); }

  /* забрати рівень n (і всі незабрані перед ним) */
  function claim(n) {
    const p = st(); if (!p || n <= p.got || n > reached(p)) return;
    while (p.got < n - 1) { const r0 = reward(p.got + 1); if (r0.trophy) break; p.got++; grant(r0); }
    const r = reward(n);
    p.got = n; grant(r);
    save(); renderAll(); sfx.coin();
    if (r.trophy) {
      confetti(); sfx.level();
      modal({ title: "Стежку пройдено! 🏆", html: `<div class="big-emoji">${season().prize}</div><p>«${season().prizeName}» тепер прикрашає твій дворик 🏡</p><p class="rewards">💝 &nbsp; +${r.coins} 🪙</p><p class="hint-s">А кроки й далі приносять подарунки 🎁 — кожні ${PATH_INF}.</p>`,
        buttons: [{ label: "Ура! 💛", onClick: () => QUEST.panel("path") }] });
      return;
    }
    toast(`${rewIcon(r)} ${rewText(r)}`);
    QUEST.panel("path");
  }
  function claimAll() {
    const p = st(); if (!p) return;
    let n = 0;
    while (p.got < reached(p)) { const r = reward(p.got + 1); if (r.trophy) break; p.got++; grant(r); n++; }
    while (p.inf < infReached(p)) { p.inf++; placeItem({ c: "chest", l: 0 }); n++; }
    save(); renderAll(); sfx.coin(); confetti();
    if (p.got < reached(p)) { claim(p.got + 1); return; }   // трофей — окремим вікном
    toast(`${season().icon} Забрано нагород: ${n}`);
    QUEST.panel("path");
  }

  /* ---------- вкладка ---------- */
  function daysLeft() {
    const d = new Date(now()), end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    return Math.max(1, Math.ceil((end - now()) / 864e5));
  }
  function html() {
    if (!st()) roll();
    const p = S.path, R = reached(p), s = season();
    const inLvl = R >= PATH_LEVELS ? (p.pts - PATH_LEVELS * PATH_COST) % PATH_INF : p.pts % PATH_COST;
    const need = R >= PATH_LEVELS ? PATH_INF : PATH_COST;
    const dl = daysLeft(), endD = new Date(new Date(now()).getFullYear(), new Date(now()).getMonth() + 1, 0);
    const rows = Array.from({ length: PATH_LEVELS }, (_, k) => {
      const n = k + 1, r = reward(n), got = n <= p.got, can = n > p.got && n <= R, big = r.chest !== undefined || r.trophy;
      return `<div class="ph-row${got ? " got" : can ? " can" : n <= R ? " open" : ""}${big ? " big" : ""}${r.trophy ? " trophy" : ""}" data-n="${n}">` +
        `<span class="ph-n">${n}</span><span class="ph-ic">${rewIcon(r)}</span><span class="ph-t">${rewText(r)}</span>` +
        (got ? `<span class="ph-ok">✅</span>` : can ? `<button class="s-btn ph-go" data-n="${n}">Забрати</button>` : `<span class="ph-lock">🔒</span>`) + `</div>`;
    }).join("");
    const infCan = p.inf < infReached(p);
    const inf = `<div class="ph-row inf${infCan ? " can" : ""}"><span class="ph-n">∞</span><span class="ph-ic">🎁</span><span class="ph-t">Після 30-го — подарунок кожні ${PATH_INF} кроків${p.inf ? ` (уже ${p.inf})` : ""}</span>` +
      (infCan ? `<button class="s-btn ph-inf">Забрати</button>` : `<span class="ph-lock">🔒</span>`) + `</div>`;
    const many = (R - p.got) + (infReached(p) - p.inf) > 1;
    return `<div class="ph-head"><span class="ph-big">${s.icon}</span><span><b>${s.name}</b><small>до ${endD.getDate()} ${MONTHS_GEN[endD.getMonth()]} · ще ${dl} ${dl === 1 ? "день" : dl < 5 ? "дні" : "днів"}</small></span>` +
      `<span class="ph-lvl"><b>${R}</b><small>рівень</small></span></div>` +
      `<div class="ph-bar"><i style="width:${inLvl / need * 100}%"></i><span>${inLvl}/${need} кроків</span></div>` +
      `<p class="dq-hint">Кроки: замовлення +${PATH_PTS.order} (особливі +${PATH_PTS.special}) · завдання дня +${PATH_PTS.daily} · тиждень +${PATH_PTS.week} · пригода +${PATH_PTS.side}</p>` +
      (many ? `<button class="btn dq-claim ph-all">Забрати все 🎁</button>` : "") +
      `<div class="ph-list" id="phList">${rows}${inf}</div>` +
      `<p class="dq-hint">Головна нагорода — ${s.prize} «${s.prizeName}» у твій дворик. Щомісяця — нова стежка.</p>`;
  }
  function bind() {
    document.querySelectorAll(".ph-go").forEach(b => b.onclick = () => { $("modal").classList.remove("show"); claim(+b.dataset.n); });
    const i = document.querySelector(".ph-inf"); if (i) i.onclick = () => { $("modal").classList.remove("show"); claimAll(); };
    const a = document.querySelector(".ph-all"); if (a) a.onclick = () => { $("modal").classList.remove("show"); claimAll(); };
    const list = $("phList"), cur = list && (list.querySelector(".ph-row.can") || list.querySelector(".ph-row:not(.got)"));
    if (list && cur) list.scrollTop = Math.max(0, cur.offsetTop - list.offsetTop - 40);
  }

  /* ---------- щосекунди ---------- */
  function tick() {
    if (!on() || !S.started) return;
    if (!st()) { roll(); if (window.QUEST) QUEST.renderButton(); }
    if (pendingEnd && !busyUI()) {
      const e = pendingEnd; pendingEnd = null;
      modal({ title: e.so.name + " завершилась", html: `<div class="big-emoji">${e.so.icon}</div><p>Незабрані нагороди вже чекають на тебе:</p><p class="rewards">${e.parts.join(" ")}</p><p class="hint-s">Починається «${season().name}» ${season().icon}</p>`,
        buttons: [{ label: "До нової стежки ›", onClick: () => QUEST.panel("path") }] });
    }
  }
  function init() { if (on() && !st()) roll(); }

  return { add, onDeliver, ready, html, bind, tick, init, season, reward };
})();
