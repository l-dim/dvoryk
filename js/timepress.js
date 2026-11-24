"use strict";
/* ============================================================
   ТИСК ЧАСОМ
   • Терпіння сусідів: звичайне замовлення чекає добу. Потім сусід ображається, іде,
     а дружба падає на 💛. Останні 6 годин на картці видно годинник 😤.
     Стан на замовленні: o.born (коли з'явилось)
   • Великий виклик тижня: раз на тиждень — 3 години, дві цілі з ДВОХ генераторів одночасно
     (наприклад, 12 предметів 3+ рівня з городу й 12 — із саду). Починаєш сама, коли зручно.
     Стан: S.big = { week, a:{c,n,t}, b:{c,n,t}, until, started, over }
   ============================================================ */
const PATIENCE_MS = 24 * 3600e3, PATIENCE_WARN = 6 * 3600e3;
const BIG_DUR = 3 * 3600e3, BIG_MIN_L = 2;          // рахуються злиття в предмети 3-го рівня й вище
const BIG_FULL = { chest: 2, rare: 2, stars: 10, coins: 300 }, BIG_HALF = { chest: 1, coins: 100 };

window.TP = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const on = id => window.UNL && UNL.on(id);
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const hm = ms => { const t = Math.max(0, Math.ceil(ms / 6e4)), h = Math.floor(t / 60); return h >= 24 ? Math.floor(h / 24) + tt` д ` + (h % 24) + tt` год` : h ? h + tt` год ` + (t % 60) + tt` хв` : (t % 60) + tt` хв`; };
  const plain = o => !o.until && !o.paw && !o.rare && !o.ev && !o.catUntil;

  /* ---------- терпіння ---------- */
  function stamp(o) { if (o && !o.born) o.born = now(); return o; }
  function init() { (S.orders || []).forEach(stamp); }
  function patienceLeft(o) { return on("patience") && plain(o) && o.born ? PATIENCE_MS - (now() - o.born) : Infinity; }
  function badge(o) {
    const l = patienceLeft(o);
    return l < PATIENCE_WARN ? `<span class="o-timer o-angry" data-born="${o.born}">😤 ${MECH.hhmm(l)}</span>` : "";
  }
  function patienceTick() {
    if (!on("patience") || S.sideOn) return;
    const gone = S.orders.filter(o => patienceLeft(o) <= 0);
    if (!gone.length) return;
    S.orders = S.orders.filter(o => !gone.includes(o));
    gone.forEach(o => {
      const had = !!(S.fr && S.fr[o.ch]);
      if (had) S.fr[o.ch] = Math.max(0, S.fr[o.ch] - 1);
      const m = ["stepan", "andriy", "ivan", "taras", "cat"].includes(o.ch);
      toast(tt`😤 ${shortName(CHARS[o.ch].name)} не ${m ? tt`дочекався` : tt`дочекалась`} замовлення й ${m ? tt`пішов` : tt`пішла`}…${had ? " −1 💛" : ""}`);
    });
    fillOrders(); renderOrders(); save();
  }
  function timers() {
    document.querySelectorAll(".o-angry").forEach(el => { el.textContent = "😤 " + MECH.hhmm(PATIENCE_MS - (now() - +el.dataset.born)); });
  }

  /* ---------- великий виклик тижня ---------- */
  function weekKey() { const d = new Date(now()); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function big() {
    if (!on("bigflash")) return null;
    if (!S.big || S.big.week !== weekKey()) {
      const chains = S.gens.map(g => GENS[g].chain).filter(c => PRODUCT_CHAINS.includes(c));
      const a = pick(chains); let b = pick(chains); let k = 0; while (b === a && k++ < 9) b = pick(chains);
      const t = 10 + Math.floor(S.level / 4);
      S.big = { week: weekKey(), a: { c: a, n: 0, t }, b: { c: b, n: 0, t }, until: 0, started: false, over: false };
      save();
    }
    return S.big;
  }
  const running = () => { const g = S.big; return !!(g && g.started && !g.over && g.week === weekKey()); };
  function onMerge(c, l) {
    if (!running() || l < BIG_MIN_L || now() >= S.big.until) return;
    const g = S.big; let hit = false;
    [g.a, g.b].forEach(x => { if (x.c === c && x.n < x.t) { x.n++; hit = true; } });
    if (!hit) return;
    save(); renderButton();
    if (g.a.n >= g.a.t && g.b.n >= g.b.t) finish();
  }
  function startBig() {
    const g = big(); if (!g || g.started) return;
    g.started = true; g.until = now() + BIG_DUR; save();
    sfx.level(); renderButton();
    playDialog([["halya", tt`Почали, {name}! Три години — і обидві ділянки разом: ${CHAINS[g.a.c].items[0][0]} і ${CHAINS[g.b.c].items[0][0]}. Тапай обидва генератори, енергії не шкодуй! ⏳`]], panel);
  }
  function grant(r) {
    const p = [];
    if (r.chest !== undefined) { placeItem({ c: "chest", l: r.chest }); p.push(CHAINS.chest.items[r.chest][0]); }
    if (r.rare !== undefined && CHAINS.rare) { placeItem({ c: "rare", l: r.rare }); p.push(CHAINS.rare.items[r.rare][0]); }
    if (r.stars) { S.stars += r.stars; p.push("+" + r.stars + " ⭐"); }
    if (r.coins) { S.coins += r.coins; p.push("+" + r.coins + " 🪙"); }
    return p.join(" &nbsp; ");
  }
  function finish() {
    const g = S.big; if (!g || g.over) return;
    g.over = true;
    const won = g.a.n >= g.a.t && g.b.n >= g.b.t;
    const half = !won && (g.a.n + g.b.n) >= Math.ceil((g.a.t + g.b.t) * 0.6);
    const txt = won ? grant(BIG_FULL) : half ? grant(BIG_HALF) : "";
    save(); renderAll(); renderButton();
    if (won) { confetti(); sfx.level(); }
    modal({ title: won ? tt`Великий виклик подолано! 🏆` : half ? tt`Майже! ⏳` : tt`Час вийшов ⏳`,
      html: `<div class="big-emoji">${won ? "🏆" : "⏳"}</div><p>${CHAINS[g.a.c].items[0][0]} ${g.a.n}/${g.a.t} &nbsp; · &nbsp; ${CHAINS[g.b.c].items[0][0]} ${g.b.n}/${g.b.t}</p>` +
        (txt ? `<p class="rewards">${txt}</p>` : tt`<p>Наступного тижня — новий виклик!</p>`),
      buttons: [{ label: won ? tt`Ура! 💛` : tt`Добре` }] });
  }
  const row = x => tt`<div class="bg-row"><span class="bg-ic">${CHAINS[x.c].items[BIG_MIN_L][0]}</span><span class="bg-mid"><b>${CHAINS[x.c].name}: ${x.t} предметів ${BIG_MIN_L + 1}+ рівня</b>` +
    `<i class="dq-bar"><b style="width:${x.n / x.t * 100}%"></b></i><small>${x.n}/${x.t}</small></span></div>`;
  function panel() {
    const g = big(); if (!g) return;
    const st = g.over ? tt`<p class="dq-when">Цього тижня вже був. Новий — з понеділка.</p>`
      : g.started ? tt`<p class="dq-when">Лишилось: <b>${hm(g.until - now())}</b></p>`
      : tt`<p class="dq-when">Готова? Таймер на <b>3 години</b> почнеться, щойно натиснеш «Почати».</p>`;
    modal({ title: tt`Великий виклик тижня 🏆`,
      html: st + row(g.a) + row(g.b) +
        `<p class="fl-rew"><span>60%: 📦 +${BIG_HALF.coins} 🪙</span><span>100%: 💝 ${CHAINS.rare ? CHAINS.rare.items[BIG_FULL.rare][0] : ""} +${BIG_FULL.stars} ⭐ +${BIG_FULL.coins} 🪙</span></p>` +
        tt`<p class="hint-s">Рахуються злиття в предмети ${BIG_MIN_L + 1}-го рівня й вище з обох генераторів. Без докупівлі енергії й розбудження генераторів — не встигнути.</p>`,
      buttons: [...(!g.started && !g.over ? [{ label: tt`Почати! ⏳`, onClick: startBig }] : []),
        ...(g.started && !g.over ? [{ label: tt`⚡ Енергія`, onClick: () => showNoEnergyInfo() }] : []), { label: tt`Закрити`, cls: "ghost" }] });
  }
  function renderButton() {
    const b = $("bigBtn"); if (!b) return;
    const r = running();
    b.hidden = !r || S.sideOn;
    if (!r) return;
    const g = S.big;
    $("bgTime").textContent = hm(g.until - now()).replace(" год ", tt`г `).replace(" хв", tt`хв`);
    $("bgBar").style.width = ((g.a.n + g.b.n) / (g.a.t + g.b.t) * 100) + "%";
  }
  function bigTick() {
    if (!on("bigflash")) return;
    const g = big();
    if (g && running() && now() >= g.until && !busyUI()) finish();
    renderButton();
  }
  function card() {
    if (!on("bigflash")) return null;
    const g = big();
    return { icon: "🏆", title: tt`Великий виклик тижня`, sub: g.over ? tt`цього тижня вже був` : g.started ? tt`${g.a.n + g.b.n}/${g.a.t + g.b.t} · ще ${hm(g.until - now())}` : tt`${CHAINS[g.a.c].items[0][0]} + ${CHAINS[g.b.c].items[0][0]} · 3 години, почни, коли зручно`,
      btn: g.over ? "" : g.started ? tt`Відкрити` : tt`Почати`, act: g.over ? "" : "big", ready: !g.over && !g.started };
  }

  function tick() { if (!S || !S.started) return; patienceTick(); bigTick(); timers(); }
  return { stamp, init, badge, tick, onMerge, panel, card, renderButton };
})();
