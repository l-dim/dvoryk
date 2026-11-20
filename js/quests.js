"use strict";
/* ============================================================
   КВЕСТИ
   • Завдання дня: S.dq = { day, list:[{k,t,n}], claimed, streak, lastClaim }
   • Дружба: S.fr = { <сусід>: сердечка }, S.frSeen = { <сусід>: скільки історій показано }
   • Карта старої скрині: S.map = { n, seen, done }
   ============================================================ */
window.QUEST = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const dayStr = t => { const d = new Date(t); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const today = () => dayStr(now());
  const yesterday = () => dayStr(now() - 864e5);
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const queue = [];            // сцени й нагороди чекають, поки звільниться екран

  function init() {
    if (!S.fr) S.fr = {};
    if (!S.frSeen) S.frSeen = {};
    if (!S.map) S.map = { n: 0, seen: false, done: false };
    if (!S.dq || S.dq.day !== today()) newDay();
    if (!S.wq || S.wq.week !== weekKey()) newWeek();
  }

  /* ---------- завдання тижня ---------- */
  function weekKey() {            // понеділок поточного тижня
    const d = new Date(now()); d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dayStr(d.getTime());
  }
  function daysToSunday() { return 7 - ((new Date(now()).getDay() + 6) % 7); }
  function newWeek() {
    const lvl = S.level, k = Math.min(1.6, 1 + lvl / 40);
    const list = [{ k: "deliver", t: Math.round(30 * k) }, { k: "daily", t: 5 }];
    list.push(Math.random() < 0.5 ? { k: "merge", t: Math.round(120 * k) } : { k: "tap", t: Math.round(160 * k) });
    const extra = [{ k: "chest", t: Math.round(7 * k) }];
    if (lvl >= 5) extra.push({ k: "high", t: Math.round(10 * k) });
    if (S.oven) extra.push({ k: "cook", t: 4 }, { k: "dish", t: 3 });
    if (lvl >= 4) extra.push({ k: "urgent", t: 2 });
    if (S.board.some(x => x && x.lock)) extra.push({ k: "lock", t: Math.min(4, S.board.filter(x => x && x.lock).length) });
    list.push(pick(extra));
    S.wq = { week: weekKey(), list: list.map(q => ({ k: q.k, t: q.t, n: 0 })), claimed: false };
    save();
  }
  const weekDone = () => S.wq.list.every(q => q.n >= q.t);
  function trackWeek(k, n) {
    if (!S.wq || S.wq.week !== weekKey()) newWeek();
    let fin = false;
    S.wq.list.forEach(q => { if (q.k === k && q.n < q.t) { q.n = Math.min(q.t, q.n + n); if (q.n >= q.t) fin = true; } });
    if (fin && weekDone() && !S.wq.claimed) setTimeout(() => toast("🗓️ Усі завдання тижня виконано — забери велику нагороду!"), 2600);
  }
  function claimWeek() {
    if (!weekDone() || S.wq.claimed) return;
    S.wq.claimed = true;
    const r = WEEKLY_REWARD;
    placeItem({ c: "chest", l: r.chest }); S.coins += r.coins; S.stars += r.stars; regen(); S.energy += r.energy;
    save(); renderAll(); renderButton();
    confetti(); sfx.level();
    modal({
      title: "Тиждень виконано! 🗓️",
      html: `<div class="big-emoji">💝</div><p>Ти впоралася з усіма завданнями тижня — ти неймовірна!</p>` +
        `<p class="rewards">💝 &nbsp; +${r.coins} 🪙 &nbsp; +${r.stars} ⭐ &nbsp; +${r.energy} ⚡</p><p class="hint-s">Нові завдання тижня — з понеділка.</p>`,
      buttons: [{ label: "Дякую! 💛" }]
    });
  }

  /* ---------- завдання дня ---------- */
  /* усі можливі завдання дня з урахуванням того, що зараз є в грі */
  function dayCandidates() {
    const lvl = S.level, c = [];
    c.push({ k: "deliver", t: Math.min(7, 4 + Math.floor(lvl / 8)) });
    c.push(Math.random() < 0.5 ? { k: "merge", t: Math.min(30, 15 + lvl) } : { k: "tap", t: Math.min(40, 20 + lvl) });
    c.push({ k: "chest", t: lvl < 8 ? 1 : 2 });
    if (lvl >= 5) c.push({ k: "high", t: 2 });
    if (S.oven) c.push({ k: "cook", t: 1 });
    const locks = S.board.filter(x => x && x.lock).length;
    if (locks) c.push({ k: "lock", t: Math.min(2, locks) });
    // пара однакових генераторів на дошці — можна злити
    const seen = {};
    if (S.board.some(x => { if (!x || !x.g || (x.gl || 1) >= GEN_MAX_LEVEL) return false; const key = x.g + (x.gl || 1); seen[key] = (seen[key] || 0) + 1; return seen[key] >= 2; }))
      c.push({ k: "genmerge", t: 1 });
    if (lvl >= 4) c.push({ k: "urgent", t: 1 });
    const who = Object.keys(FRIENDS).filter(k => CHARS[k] && (CHARS[k].from || 0) <= S.chapter);
    if (who.length) c.push({ k: "heart", who: pick(who), t: lvl < 6 ? 1 : 2 });
    if (window.EV && EV.active()) c.push({ k: "snow", t: lvl < 8 ? 10 : 16 });
    return c;
  }
  const TO = { halya: "бабусі Галі", stepan: "дідові Степану", olya: "Олі", marichka: "Марічці", andriy: "Андрієві",
    liza: "Лізі", cat: "котику Пиріжку", ivan: "Іванові", taras: "Тарасові", iryna: "Ірині" };
  const qText = q => q.k === "heart" ? `Віддай ${q.t > 1 ? q.t + " замовлення" : "замовлення"} ${TO[q.who] || CHARS[q.who].name}` : DAILY[q.k].text;
  const qIcon = q => q.k === "heart" ? face(CHARS[q.who], "mini") : DAILY[q.k].icon;
  function newDay() {
    const old = S.dq || {};
    const cand = dayCandidates();
    const list = [cand[0]];                                   // віддати замовлення — завжди
    const rest = cand.slice(1).sort(() => Math.random() - 0.5);
    list.push(...rest.slice(0, 2));
    S.dq = { day: today(), list: list.map(q => ({ k: q.k, t: q.t, n: 0, who: q.who })), claimed: false, swapped: false,
      streak: old.streak || 0, lastClaim: old.lastClaim || "" };
    // серія переривається, якщо вчора не забрала нагороду
    if (S.dq.lastClaim !== yesterday() && S.dq.lastClaim !== today()) S.dq.streak = 0;
    save();
  }
  /* раз на день можна замінити одне завдання */
  function swap(i) {
    const d = S.dq;
    if (d.swapped || d.claimed || !d.list[i] || d.list[i].n >= d.list[i].t) return;
    const busy = d.list.map(q => q.k);
    const opts = dayCandidates().filter(q => !busy.includes(q.k) && !(busy.includes("merge") && q.k === "tap") && !(busy.includes("tap") && q.k === "merge"));
    if (!opts.length) { toast("Поки що немає іншого завдання на заміну 🙈"); return; }
    const q = pick(opts);
    d.list[i] = { k: q.k, t: q.t, n: 0, who: q.who };
    d.swapped = true;
    sfx.pop(); toast("🔄 Завдання замінено!");
    save(); renderButton(); panel("day");
  }
  function track(k, n = 1, who) {
    if (!S || !S.dq) return;
    trackWeek(k, n);
    if (S.dq.day !== today()) newDay();
    let finished = null;
    S.dq.list.forEach(q => {
      if (q.k !== k || q.n >= q.t || (q.who && q.who !== who)) return;
      q.n = Math.min(q.t, q.n + n);
      if (q.n >= q.t) finished = q;
    });
    if (finished) {
      toast("✅ Завдання дня: " + qText(finished).toLowerCase() + "!");
      if (allDone()) setTimeout(() => toast("📋 Усі три завдання виконано — забери нагороду!"), 2400);
    }
    renderButton(); save();
  }
  const allDone = () => S.dq.list.every(q => q.n >= q.t);
  function claim() {
    if (!allDone() || S.dq.claimed) return;
    const d = S.dq;
    d.streak = d.lastClaim === yesterday() ? d.streak + 1 : 1;
    d.lastClaim = today(); d.claimed = true;
    trackWeek("daily", 1);
    const big = d.streak >= 7;
    placeItem({ c: "chest", l: big ? 2 : 0 });
    regen(); S.energy += 10;
    if (big) d.streak = 0;     // після тижня серія починається знову
    save(); renderAll(); renderButton();
    confetti(); sfx.level();
    modal({
      title: big ? "Тиждень поспіль! 🏆" : "Завдання дня виконано! ✅",
      html: `<div class="big-emoji">${big ? "💝" : "🎁"}</div><p>${big ? "Сім днів поспіль — ти неймовірна! Тримай скриню-сюрприз:" : "Тримай подарунок — він уже на дошці:"}</p>` +
        `<p class="rewards">${big ? "💝" : "🎁"} &nbsp; +10 ⚡</p><p class="hint-s">Нові завдання — завтра. ${big ? "" : "Виконуй щодня 7 днів поспіль — і отримаєш скриню-сюрприз 💝"}</p>`,
      buttons: [{ label: "Дякую! 💛" }]
    });
  }

  /* ---------- дружба ---------- */
  const hearts = who => (S.fr && S.fr[who]) || 0;
  function heartsTag(who) {
    if (!FRIENDS[who]) return "";
    const h = hearts(who);
    return `<span class="fr-tag">💛 ${h}/${FRIEND_STEPS[2]}</span>`;
  }
  function onDeliver(o) {
    const who = o.ch;
    track("heart", 1, who);
    if (!FRIENDS[who]) return;
    if (hearts(who) >= FRIEND_STEPS[2]) return;
    S.fr[who] = hearts(who) + 1;
    const step = FRIEND_STEPS.indexOf(S.fr[who]);
    if (step >= 0 && (S.frSeen[who] || 0) <= step) queue.push(() => friendScene(who, step));
    save();
  }
  function friendScene(who, step) {
    S.frSeen[who] = step + 1;
    const f = FRIENDS[who], r = FRIEND_REWARD[step];
    playDialog(f.scenes[step], () => {
      const p = [];
      if (r.coins) { S.coins += r.coins; p.push("+" + r.coins + " 🪙"); }
      if (r.chest !== undefined) { placeItem({ c: "chest", l: r.chest }); p.push(CHAINS.chest.items[r.chest][0]); }
      if (r.stars) { S.stars += r.stars; p.push("+" + r.stars + " ⭐"); }
      save(); renderAll();
      confetti(); sfx.level();
      modal({
        title: r.gift ? "Найкращі друзі! 💛" : "Дружба міцнішає 💛",
        html: `<div class="big-emoji">${r.gift ? f.gift : "💛"}</div><p><b>${CHARS[who].name}</b> — ${FRIEND_STEPS[step]} 💛</p><p class="rewards">${p.join(" &nbsp; ")}</p>` +
          (r.gift ? `<p class="hint-s">«${f.giftName}» тепер стоїть у твоєму дворику 🏡</p>` : `<p class="hint-s">Наступна історія — на ${FRIEND_STEPS[step + 1]} 💛</p>`),
        buttons: [{ label: "Дякую! 💛" }]
      });
    });
  }
  function friendsPanelHtml() {
    const rows = Object.keys(FRIENDS).filter(k => CHARS[k] && (CHARS[k].from || 0) <= S.chapter).map(k => {
      const h = hearts(k), max = FRIEND_STEPS[2];
      const dots = Array.from({ length: max }, (_, i) => `<i class="${i < h ? "on" : ""}${FRIEND_STEPS.includes(i + 1) ? " st" : ""}"></i>`).join("");
      return `<button class="fr-row" data-who="${k}"><span class="fr-ava">${face(CHARS[k], "mini")}</span>` +
        `<span class="fr-mid"><b>${CHARS[k].name}</b><span class="fr-dots">${dots}</span></span>` +
        `<span class="fr-n">${h >= max ? FRIENDS[k].gift : h + "/" + max}</span></button>`;
    }).join("");
    return `<div class="coll-sec"><div class="coll-h">Сусіди 💛 <small>сердечка за кожне замовлення</small></div><div class="fr-list">${rows}</div></div>`;
  }
  function friendModal(who) {
    const seen = S.frSeen[who] || 0, f = FRIENDS[who];
    const items = FRIEND_STEPS.map((s, k) => `<button class="btn ${k < seen ? "" : "ghost"} small fr-sc" data-k="${k}" ${k < seen ? "" : "disabled"}>${k < seen ? "📜 Історія " + (k + 1) : "🔒 на " + s + " 💛"}</button>`).join("");
    modal({
      title: CHARS[who].name,
      html: `<div class="big-emoji">${face(CHARS[who], "big")}</div><p>💛 ${hearts(who)} з ${FRIEND_STEPS[2]} — сердечко за кожне виконане замовлення.</p>` +
        `<p class="hint-s">На 10 💛 — подарунок для дворика: «${f.giftName}» ${f.gift}</p>${items}`,
      buttons: [{ label: "Закрити", cls: "ghost" }]
    });
    document.querySelectorAll(".fr-sc").forEach(b => b.onclick = () => { $("modal").classList.remove("show"); playDialog(f.scenes[+b.dataset.k]); });
  }

  /* ---------- карта старої скрині ---------- */
  function onChest(level, near) {
    if (S.map.done || S.ordersDone < 3) return;
    const chance = [0.1, 0.25, 0.5][level] || 0.1;
    if (Math.random() >= chance) return;
    S.map.n = Math.min(TREASURE.pieces, S.map.n + 1);
    save();
    setTimeout(() => {
      const r = cellRect(near), b = $("qBtn");
      if (r && b && typeof flyIcon === "function") flyIcon("🗺️", r, b.getBoundingClientRect(), { size: 34, dur: 800, end: 0.5, lift: 90 });
      toast("🗺️ Шматочок карти! " + S.map.n + "/" + TREASURE.pieces);
      renderButton();
    }, 500);
    if (!S.map.seen) { S.map.seen = true; queue.push(() => playDialog(TREASURE.first)); }
    if (S.map.n >= TREASURE.pieces) queue.push(treasureFinale);
  }
  function treasureFinale() {
    if (S.map.done) return;
    S.map.done = true;
    playDialog(TREASURE.final, () => {
      const r = TREASURE.reward;
      placeItem({ c: "chest", l: r.chest }); S.coins += r.coins; S.stars += r.stars;
      save(); renderAll(); renderButton();
      confetti(); sfx.level();
      modal({ title: "Скарб знайдено! 🗺️",
        html: `<div class="big-emoji">${TREASURE.gift}</div><p>Дідова скриня тепер стоїть у твоєму дворику.</p><p class="rewards">💝 &nbsp; +${r.coins} 🪙 &nbsp; +${r.stars} ⭐</p>`,
        buttons: [{ label: "Неймовірно! 💛" }] });
    });
  }

  /* ---------- подарунки в дворику ---------- */
  function yardGifts(ch, all) {
    if (ch.indoor) return [];
    const list = Object.keys(FRIENDS).filter(k => hearts(k) >= FRIEND_STEPS[2]).map(k => ({ e: FRIENDS[k].gift, k: "g-" + k }));
    if (S.map && S.map.done) list.push({ e: TREASURE.gift, k: "g-treasure" });
    if (!list.length) return [];
    const slots = [[13, 64], [87, 64], [20, 80], [80, 80], [33, 92], [67, 92], [9, 52], [91, 52], [50, 95], [40, 68], [60, 68], [26, 70], [74, 70]];
    const taken = all.filter(d => d.y >= 34).map(d => [d.x, d.y, d.who ? 12 : d.s]);
    const out = [];
    for (const g of list) {
      const s = 7;
      const free = slots.find(([x, y]) => taken.every(([tx, ty, ts]) => Math.hypot(tx - x, (ty - y) * 1.4) > (ts + s) * 0.6));
      if (!free) break;
      taken.push([free[0], free[1], s]);
      out.push({ key: g.k, e: g.e, x: free[0], y: free[1], s });
    }
    return out;
  }

  /* ---------- кнопка й панель ---------- */
  function renderButton() {
    const b = $("qBtn"); if (!b || !S || !S.dq) return;
    const done = S.dq.list.filter(q => q.n >= q.t).length;
    $("qProg").textContent = S.dq.claimed ? "✓" : done + "/3";
    const wReady = S.wq && weekDone() && !S.wq.claimed;
    b.classList.toggle("ready", (allDone() && !S.dq.claimed) || !!wReady);
    b.classList.toggle("claimed", S.dq.claimed);
  }
  let panelTab = "day";
  const qRows = (list, canSwap) => list.map((q, i) => `<div class="dq-row${q.n >= q.t ? " ok" : ""}"><span class="dq-ic">${qIcon(q)}</span>` +
    `<span class="dq-mid"><b>${qText(q)}</b><i class="dq-bar"><b style="width:${q.n / q.t * 100}%"></b></i></span>` +
    `<span class="dq-n">${q.n >= q.t ? "✅" : q.n + "/" + q.t}${canSwap && q.n < q.t ? `<button class="dq-swap" data-i="${i}" title="Замінити">🔄</button>` : ""}</span></div>`).join("");
  function panel(tab) {
    if (S.dq.day !== today()) newDay();
    if (!S.wq || S.wq.week !== weekKey()) newWeek();
    if (tab) panelTab = tab;
    const d = S.dq, w = S.wq;
    const shown = d.claimed ? d.streak : d.lastClaim === yesterday() ? d.streak : 0;
    const week = Array.from({ length: 7 }, (_, i) => `<i class="${i < shown ? "on" : ""}">${i === 6 ? "💝" : ""}</i>`).join("");
    const m = S.map, pieces = Array.from({ length: TREASURE.pieces }, (_, i) => `<i class="${m.done || i < m.n ? "on" : ""}"></i>`).join("");
    const dayReady = allDone() && !d.claimed, wkReady = weekDone() && !w.claimed;
    const btn = (ready, claimed, label, done, todo) => ready ? `<button class="btn dq-claim" data-c="1">${label}</button>`
      : `<button class="btn dq-claim" disabled>${claimed ? done : todo}</button>`;
    const canSwap = !d.swapped && !d.claimed;
    const dayHtml = `<div class="dq-list">${qRows(d.list, canSwap)}</div>` +
      (canSwap ? `<p class="dq-hint">🔄 Не подобається завдання? Одне можна замінити — раз на день.</p>` : "") +
      `<div class="dq-week"><span>Днів поспіль:</span><span class="dq-days">${week}</span></div>` +
      btn(dayReady, d.claimed, "Забрати нагороду 🎁", "Нагороду забрано ✓ Нові завдання завтра", "Виконай усі 3 — отримаєш 🎁") +
      `<div class="dq-map"><span>🗺️ <b>Таємниця старої скрині</b><br><small>${m.done ? "Скарб знайдено! Скриня — у дворику 🧰" : m.n ? "Шматочки карти: " + m.n + " з " + TREASURE.pieces : "Шматочки карти іноді трапляються в подарунках"}</small></span><span class="dq-pieces">${pieces}</span></div>`;
    const left = daysToSunday();
    const wkHtml = `<p class="dq-when">До кінця тижня: <b>${left === 1 ? "останній день!" : left + (left < 5 ? " дні" : " днів")}</b></p>` +
      `<div class="dq-list">${qRows(w.list)}</div>` +
      `<p class="dq-prize">Нагорода: 💝 · +${WEEKLY_REWARD.coins} 🪙 · +${WEEKLY_REWARD.stars} ⭐ · +${WEEKLY_REWARD.energy} ⚡</p>` +
      btn(wkReady, w.claimed, "Забрати велику нагороду 💝", "Нагороду тижня забрано ✓ Нові — з понеділка", "Виконай усі 4 — отримаєш 💝");
    modal({
      title: "Завдання 📋",
      html: `<div class="dq-tabs"><button class="dq-tab${panelTab === "day" ? " on" : ""}" data-t="day">Сьогодні${dayReady ? " ❗" : ""}</button>` +
        `<button class="dq-tab${panelTab === "week" ? " on" : ""}" data-t="week">Тиждень${wkReady ? " ❗" : ""}</button></div>` +
        (panelTab === "day" ? dayHtml : wkHtml),
      buttons: [
        { label: "💛 Мої сусіди", cls: "ghost", onClick: () => { showTab("coll"); $("tab-coll").scrollTop = 0; } },
        { label: "Закрити", cls: "ghost" }
      ]
    });
    document.querySelectorAll(".dq-tab").forEach(b => b.onclick = () => { sfx.pop(); panel(b.dataset.t); });
    document.querySelectorAll(".dq-swap").forEach(b => b.onclick = () => swap(+b.dataset.i));
    const c = document.querySelector(".dq-claim[data-c]");
    if (c) c.onclick = () => { $("modal").classList.remove("show"); panelTab === "day" ? claim() : claimWeek(); };
  }

  /* ---------- щосекунди ---------- */
  function tick() {
    if (!S || !S.started) return;
    if (S.dq && S.dq.day !== today()) { newDay(); renderButton(); }
    if (S.wq && S.wq.week !== weekKey()) { newWeek(); renderButton(); }
    if (queue.length && !busyUI()) queue.shift()();
  }

  return { init, track, claim, panel, renderButton, tick, onDeliver, onChest, heartsTag, friendsPanelHtml, friendModal, yardGifts, hearts };
})();
