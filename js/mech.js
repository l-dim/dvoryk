"use strict";
/* ============================================================
   МЕХАНІКИ ГРИ
   • Генератори мають заряд і «відпочивають»; два однакові → кращий
   • Павутиння 🕸️ на клітинках: розчищається злиттям поруч, під ним сюрприз
   • Піч 🔥: страви з двох інгредієнтів, готуються з таймером
   • Термінові замовлення ⏰ за подвійну нагороду
   ============================================================ */
window.MECH = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const gl = it => Math.min(GEN_MAX_LEVEL, it.gl || 1);
  const cap = it => GEN_CHARGE[gl(it) - 1];
  const restMs = it => GEN_REST_MIN[gl(it) - 1] * 60e3;
  const mins = ms => { const m = Math.ceil(ms / 60e3); return m >= 60 ? Math.floor(m / 60) + " год " + (m % 60) + " хв" : m + " хв"; };

  /* ---------- генератори ---------- */
  function refresh(it) {            // повертає true, якщо генератор щойно прокинувся
    if (it.rest && now() >= it.rest) { delete it.rest; it.ch = cap(it); return true; }
    if (it.ch === undefined) it.ch = cap(it);
    return false;
  }
  const resting = it => !!it.rest && now() < it.rest;
  function useCharge(it) {
    refresh(it);
    it.ch = Math.max(0, it.ch - 1);
    if (it.ch === 0) { it.rest = now() + restMs(it); return true; }
    return false;
  }
  function wake(i) {
    const it = S.board[i];
    if (!it || !resting(it)) return;
    if (S.coins < WAKE_COINS) { sfx.nope(); toast("Не вистачає монеток 🪙"); return; }
    S.coins -= WAKE_COINS; delete it.rest; it.ch = cap(it);
    sfx.coin(); toast(GENS[it.g].icon + " " + GENS[it.g].name + " знову працює!");
    renderBoard(); renderTop(); renderInfo(); save();
  }
  function restModal(i) {
    const it = S.board[i];
    sfx.nope();
    modal({
      title: "Відпочиває 💤",
      html: `<div class="big-emoji">${GENS[it.g].icon}</div><p><b>${GENS[it.g].name}</b> відпочиває ще <b>${mins(it.rest - now())}</b> і знову буде повний сил.</p>
        <p class="hint-s">Поки що потапай інші генератори або об'єднай те, що вже є. Два однакові генератори зливаються в кращий — з більшим зарядом.</p>`,
      buttons: [{ label: `Розбудити за ${WAKE_COINS} 🪙`, disabled: S.coins < WAKE_COINS, onClick: () => wake(i) }, { label: "Хай відпочине", cls: "ghost" }]
    });
  }
  function canMergeGens(A, B) { return A && B && A.g && B.g && A.g === B.g && gl(A) === gl(B) && gl(A) < GEN_MAX_LEVEL; }
  function mergeGens(a, b) {
    const A = S.board[a], nl = gl(A) + 1;
    S.board[b] = { g: A.g, gl: nl, ch: GEN_CHARGE[nl - 1] };
    S.board[a] = null;
    gainXp(5);
    window.QUEST && QUEST.track("merge");
    window.QUEST && QUEST.track("genmerge");
    sfx.merge(4); sparkle(b, "✨", 8); popIdx.add(b); mergedIdx.add(b); burstAt(b);
    selected = b;
    setTimeout(() => modal({
      title: "Кращий генератор! ⭐",
      html: `<div class="big-emoji">${GENS[A.g].icon}</div><p><b>${GENS[A.g].name}</b> тепер рівня ${nl}!</p>
        <p class="rewards">${GEN_CHARGE[nl - 1]} ⚡ заряду · відпочинок ${GEN_REST_MIN[nl - 1]} хв</p><p class="hint-s">І частіше дає одразу кращі предмети.</p>`,
      buttons: [{ label: "Чудово! 💛" }]
    }), 300);
  }
  const tierBonus = it => (gl(it) - 1) * 0.08;
  function maybeGenCopy(chance, near) {
    if (Math.random() >= chance) return false;
    const pool = S.gens.filter(g => GENS[g]);
    if (!pool.length) return false;
    const g = pick(pool);
    placeItem({ g, gl: 1, ch: GEN_CHARGE[0] }, near);
    setTimeout(() => toast(`Ще один ${GENS[g].icon} ${GENS[g].name}! Об'єднай два однакові — буде кращий`), 600);
    return true;
  }

  /* ---------- павутиння ---------- */
  function lockReward() {
    const r = Math.random();
    if (r < 0.3) return { c: "chest", l: 0 };
    if (r < 0.5) return { c: "coin", l: 1 };
    if (r < 0.65) return { c: "energy", l: 1 };
    return { c: pick(S.gens.map(g => GENS[g].chain)), l: 2 };
  }
  function addLocks(n) {
    const free = [];
    for (let i = N - 1; i >= COLS * (ROWS - 3); i--) if (!S.board[i]) free.push(i);
    free.sort(() => Math.random() - 0.5).slice(0, n).forEach(i => { S.board[i] = { lock: 1 + rnd(2), hide: lockReward() }; });
  }
  function openLock(i, viaCoins) {
    const it = S.board[i];
    if (!it || !("lock" in it)) return;
    S.board[i] = it.hide || lockReward();
    window.QUEST && QUEST.track("lock");
    discover(S.board[i]);
    popIdx.add(i); burstAt(i); sparkle(i, "✨", 6);
    sfx.open();
    if (selected === i) selected = -1;
    if (viaCoins) { renderBoard(); renderTop(); renderInfo(); renderOrders(); save(); }
  }
  function crackAround(b) {   // злиття поруч розчищає павутиння
    const r = Math.floor(b / COLS), c = b % COLS;
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) return;
      const j = rr * COLS + cc, it = S.board[j];
      if (!it || !it.lock) return;
      it.lock--;
      if (it.lock <= 0) openLock(j); else { popIdx.add(j); sparkle(j, "💨", 3); }
    });
  }
  function lockModal(i) {
    const it = S.board[i];
    modal({
      title: "Павутиння 🕸️",
      html: `<div class="big-emoji">🕸️</div><p>Під павутинням щось є! Об'єднай предмети на сусідній клітинці — і воно зникне${it.lock > 1 ? ` (ще ${it.lock} рази)` : ""}.</p>`,
      buttons: [{ label: `Розчистити за ${LOCK_COINS} 🪙`, disabled: S.coins < LOCK_COINS, onClick: () => { S.coins -= LOCK_COINS; openLock(i, true); } }, { label: "Добре", cls: "ghost" }]
    });
  }

  /* ---------- піч ---------- */
  const ovenState = it => !it.r && it.r !== 0 ? "idle" : now() >= it.done ? "done" : "cook";
  const recipeOpen = r => r.need.every(n => S.gens.some(g => GENS[g].chain === n.c));
  function findItems(need) {
    const used = new Set(), out = [];
    for (const n of need) {
      let hit = -1;
      for (let i = 0; i < N; i++) { const it = S.board[i]; if (it && !used.has(i) && it.c === n.c && it.l === n.l) { hit = i; break; } }
      out.push(hit); if (hit >= 0) used.add(hit);
    }
    return out;
  }
  function ovenModal(i) {
    const it = S.board[i], s = ovenState(it);
    if (s === "done") {
      const l = it.r;
      delete it.r; delete it.done; delete it.ready;
      const at = placeItem({ c: "dish", l }, i);
      if (at >= 0) popIdx.add(at);
      sfx.level(); sparkle(i, "✨", 8);
      window.QUEST && QUEST.track("cook");
      toast("Готово: " + CHAINS.dish.items[l][0] + " " + CHAINS.dish.items[l][1] + "!");
      renderBoard(); renderOrders(); renderInfo(); save();
      return;
    }
    if (s === "cook") {
      const d = CHAINS.dish.items[it.r];
      modal({
        title: "Піч 🔥",
        html: `<div class="big-emoji">${d[0]}</div><p>Готується <b>${d[1]}</b> — ще <b>${mins(it.done - now())}</b>.</p>`,
        buttons: [{ label: `Пришвидшити за ${OVEN_RUSH_COINS} 🪙`, disabled: S.coins < OVEN_RUSH_COINS,
          onClick: () => { S.coins -= OVEN_RUSH_COINS; it.done = now(); renderBoard(); renderTop(); save(); } }, { label: "Зачекаю", cls: "ghost" }]
      });
      return;
    }
    const rows = RECIPES.filter(recipeOpen).map(r => {
      const f = findItems(r.need), ok = f.every(x => x >= 0), d = CHAINS.dish.items[r.l];
      const ing = r.need.map((n, k) => `<span class="rc-ing${f[k] >= 0 ? " have" : ""}">${itemIcon(n)}</span>`).join("<b>+</b>");
      return `<div class="rc-row"><span class="rc-out">${d[0]}</span><span class="rc-mid"><b>${d[1]}</b><span class="rc-need">${ing} · ⏱ ${r.min} хв</span></span>` +
        `<button class="s-btn rc-go${ok ? "" : " dim"}" data-l="${r.l}">${ok ? "Готувати" : "Бракує"}</button></div>`;
    }).join("") || `<p class="hint-s">Рецепти відкриються, коли з'являться нові генератори.</p>`;
    modal({ title: "Піч 🔥", html: `<p class="hint-s">Поклади два інгредієнти — і за кілька хвилин буде страва. Страви просять сусіди за ⭐⭐ і багато монеток.</p><div class="rc-list">${rows}</div>`,
      buttons: [{ label: "Закрити", cls: "ghost" }] });
    document.querySelectorAll(".rc-go").forEach(b => b.onclick = () => {
      const r = RECIPES.find(x => x.l === +b.dataset.l), f = findItems(r.need);
      if (f.some(x => x < 0)) { sfx.nope(); toast("Бракує інгредієнтів — назбирай на дошці"); return; }
      f.forEach(j => { flyFrom(j, document.querySelector(`.cell[data-i="${i}"]`)); S.board[j] = null; if (selected === j) selected = -1; });
      it.r = r.l; it.done = now() + r.min * 60e3;
      $("modal").classList.remove("show");
      sfx.pop(); toast("🔥 " + CHAINS.dish.items[r.l][1] + " готується " + r.min + " хв");
      renderBoard(); renderOrders(); renderInfo(); save();
    });
  }

  /* ---------- замовлення ---------- */
  function specialOrder() {
    // страва з печі
    const hasOven = S.board.some(x => x && x.st === "oven") || S.inbox.some(x => x && x.st === "oven");
    if (hasOven && !S.orders.some(o => o.dish) && Math.random() < 0.22) {
      const opts = RECIPES.filter(recipeOpen);
      const busy = S.orders.map(o => o.ch);
      const who = ["andriy", "halya", "stepan"].filter(c => !busy.includes(c) && (CHARS[c].from || 0) <= S.chapter && !(window.WD && WD.isSick(c)));
      if (opts.length && who.length) {
        const r = pick(opts);
        return { id: ++S.orderSeq, ch: pick(who), items: [{ c: "dish", l: r.l }], coins: 90, xp: 25, stars: 2, dish: true, line: rnd(3) };
      }
    }
    return null;
  }
  function maybeUrgent(o) {
    if (S.level < 4 || o.ev || o.dish || S.orders.some(x => x.until) || Math.random() >= 0.15) return o;
    o.until = now() + (2 + rnd(3)) * 3600e3;
    o.coins = Math.round(o.coins * 1.6); o.stars += 1; o.urgent = true;
    return o;
  }
  function expireOrders() {
    const gone = S.orders.filter(o => o.until && now() >= o.until);
    if (!gone.length) return;
    S.orders = S.orders.filter(o => !gone.includes(o));
    gone.forEach(o => toast(CHARS[o.ch].name + " вже не чекає — термінове замовлення минуло ⏰"));
    fillOrders(); renderOrders(); save();
  }
  const hhmm = ms => { const m = Math.max(0, Math.ceil(ms / 60e3)); return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); };

  /* ---------- вигляд плиток ---------- */
  function tileKey(it) {
    if (it.lock) return "lk:" + it.lock;
    if (it.st) return "st:" + ovenState(it) + ":" + (it.r ?? "");
    if (it.g) return "g:" + it.g + ":" + gl(it) + ":" + (resting(it) ? "z" : "a");
    return null;
  }
  function decorate(t, it) {
    if (!t || !it) return;
    if (it.g) {
      refresh(it);
      let bar = t.querySelector(".gen-bar"), z = t.querySelector(".gen-z"), lv = t.querySelector(".gen-lv");
      if (gl(it) > 1 && !lv) { lv = document.createElement("span"); lv.className = "gen-lv"; lv.textContent = gl(it); t.appendChild(lv); }
      if (resting(it)) {
        if (bar) bar.remove();
        if (!z) { z = document.createElement("span"); z.className = "gen-z"; t.appendChild(z); }
        z.textContent = "💤 " + Math.ceil((it.rest - now()) / 60e3) + "хв";
        t.classList.add("tired");
      } else {
        if (z) z.remove(); t.classList.remove("tired");
        if (!bar) { bar = document.createElement("i"); bar.className = "gen-bar"; bar.innerHTML = "<b></b>"; t.appendChild(bar); }
        bar.firstChild.style.width = (it.ch / cap(it) * 100) + "%";
      }
    } else if (it.lock) {
      t.classList.add("lock");
      let b = t.querySelector(".lock-hp");
      if (it.lock > 1) { if (!b) { b = document.createElement("span"); b.className = "lock-hp"; t.appendChild(b); } b.textContent = "×" + it.lock; }
      else if (b) b.remove();
    } else if (it.st) {
      t.classList.add("oven");
      const s = ovenState(it);
      t.classList.toggle("ready", s === "done");
      let tm = t.querySelector(".oven-t");
      if (s === "idle") { if (tm) tm.remove(); return; }
      if (!tm) { tm = document.createElement("span"); tm.className = "oven-t"; t.appendChild(tm); }
      tm.textContent = s === "done" ? "✅" : CHAINS.dish.items[it.r][0] + " " + Math.ceil((it.done - now()) / 60e3) + "хв";
    }
  }

  /* ---------- щосекунди ---------- */
  let woke = false;
  function tick() {
    let rer = false;
    S.board.forEach(it => {
      if (!it) return;
      if (it.g && it.rest && refresh(it)) rer = true;
      if (it.st && it.r !== undefined && it.done && now() >= it.done && !it.ready) { it.ready = 1; rer = true; }
    });
    if (rer) { renderBoard(); save(); }
    document.querySelectorAll(".tile").forEach(t => { const it = S.board[+t.dataset.i]; if (it && (it.g || it.st)) decorate(t, it); });
    document.querySelectorAll(".o-timer").forEach(el => { el.textContent = "⏰ " + hhmm(+el.dataset.until - now()); });
    expireOrders();
  }

  /* ---------- оновлення збережень і поява печі ---------- */
  function migrate() {
    if ((S.v || 1) < 2) {
      S.v = 2;
      addLocks(S.ordersDone < 3 ? 10 : 6);
    }
    checkOven();
    save();
  }
  function checkOven() {
    if (S.oven || S.chapter < OVEN_FROM_CHAPTER || !S.started) return;
    S.oven = true;
    const at = placeItem({ st: "oven" });
    if (at >= 0) popIdx.add(at);
    renderBoard(); save();
    setTimeout(() => playDialog([
      ["andriy", "{name}, я полагодив стару піч! 🔥 Тепер можна готувати справжні страви."],
      ["andriy", "Тапни піч — там рецепти. Борщ, вареники з вишнями… Клади інгредієнти й чекай, поки зготується."],
      ["halya", "Ох, і замовлятиму ж я в тебе вареники! За страви плататимемо щедро — і зірочками теж ⭐⭐"]
    ]), 800);
  }

  return { refresh, resting, useCharge, restModal, canMergeGens, mergeGens, tierBonus, maybeGenCopy,
    crackAround, lockModal, ovenModal, hhmm, specialOrder, maybeUrgent, tileKey, decorate, tick, migrate, checkOven, gl, cap };
})();
