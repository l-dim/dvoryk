"use strict";
/* ============================================================
   ПОКРОКОВЕ НАВЧАННЯ 👆 — рука показує просто на дошці, що робити.
   Кроки: злий два однакові → тапни генератор → зроби, що просять сусіди →
   «Віддати» → ☰ «Дворик» і перше завдання. Текст і підказка підлаштовуються
   під те, що зараз на дошці (яку пару злити, який генератор тапнути).
   Після навчання, поки рівень невисокий, рука з'являється сама, якщо гравчиня
   довго нічого не робить.
   Стан: S.tour — номер кроку (5 = пройдено); S.tut = 4 наприкінці, як і раніше.
   ============================================================ */
window.TOUR = (() => {
  const STEPS = ["merge", "gen", "make", "give", "yard"], DONE = STEPS.length;
  const IDLE_MS = 20e3, IDLE_LVL = 8, QUIET_MS = 900;
  let hand = null, rings = [], tip = null, doneMsg = false, focusId = 0, focusUntil = 0, lastKey = "", idleAt = Date.now(), quietUntil = 0, finger = false;

  const busy = () => ["modal", "dialog", "start"].some(id => { const el = $(id); return el && el.classList.contains("show"); });
  const onTab = name => { const t = $("tab-" + name); return t && !t.hidden; };
  function step() {
    if (S.tour == null) S.tour = S.tut >= 4 ? DONE : S.tut >= 3 ? 4 : S.tut >= 2 ? 2 : 0;   // старі збереження
    return S.tour;
  }
  const active = () => S && S.started && step() < DONE;
  function go(n) { S.tour = n; lastKey = ""; quietUntil = Date.now() + QUIET_MS; render(); save(); }
  function finish() {
    S.tour = DONE; if (S.tut < 4) S.tut = 4;
    lastKey = ""; doneMsg = true; render(); save();
  }

  /* події з гри */
  function ev(name) {
    if (!S) return;
    idleAt = Date.now();
    if (step() >= DONE) return;
    if (name === "task") return finish();
    const s = STEPS[S.tour];
    if (s === "merge" && name === "merge") go(1);
    else if (s === "gen" && name === "gen") go(2);
    else if ((s === "make" || s === "give") && name === "give") go(4);
    else { quietUntil = Date.now() + QUIET_MS; render(); }
  }

  /* ---------- що зараз на дошці ---------- */
  const open = i => typeof cellOpen !== "function" || cellOpen(i);
  const plain = it => it && !it.g && !it.lock && !it.st && CHAINS[it.c] && !isMax(it);
  function pairs(c, below) {
    const b = S.board, out = [];
    for (let i = 0; i < b.length; i++) {
      if (!plain(b[i]) || !open(i) || (c && b[i].c !== c) || (below != null && b[i].l >= below)) continue;
      for (let j = i + 1; j < b.length; j++) if (open(j) && b[j] && canMergeAt(i, j)) { out.push([i, j]); break; }
    }
    return out.sort((p, q) => b[q[0]].l - b[p[0]].l);              // спершу вищі рівні — ближче до мети
  }
  const genOf = c => S.board.findIndex((x, i) => x && x.g && open(i) && GENS[x.g] && GENS[x.g].chain === c && !GENS[x.g].pet);
  const anyGen = () => { const v = genOf("veg"); return v >= 0 ? v : S.board.findIndex((x, i) => x && x.g && open(i) && GENS[x.g] && !GENS[x.g].pet); };
  const has = need => S.board.some((x, i) => x && !x.g && x.c === need.c && x.l === need.l && open(i));
  const ic = it => itemIcon(it);
  function want(only) {                                           // перше, чого бракує сусідам
    for (const o of (S.orders || [])) if (!only || o.id === only) for (const need of (o.items || [])) if (CHAINS[need.c] && !has(need)) return { o, need };
    return null;
  }
  function readyBtn() {                                         // «Віддати» на справжньому замовленні (не «докупити місце»)
    const btn = document.querySelector("#orders .order:not(.slot-lock) .o-btn:not(.sl-buy)");
    if (btn) { const r = btn.getBoundingClientRect(); if (r.right > innerWidth || r.left < 0) btn.scrollIntoView({ inline: "nearest", block: "nearest" }); }
    return btn;
  }
  const cell = i => $("board").children[i];

  /* що порадити, щоб наблизитись до замовлення */
  function advise(only) {
    const btn = only ? document.querySelector(`#orders .order.ready[data-id="${only}"] .o-btn`) : readyBtn();
    if (btn) return { text: tt`🧺 Усе є! Натисни «Віддати» — сусіди чекають`, tap: btn };
    const w = want(only);
    if (w) {
      const who = CHARS[w.o.ch] ? CHARS[w.o.ch].name : "";
      const p = pairs(w.need.c, w.need.l)[0];
      const best = best1(w.need);
      if (p && best && best.single) return { text: tt`${who} просить ${ic(w.need)}. Є ${ic({ c: w.need.c, l: best.l })} — злий два ${ic(S.board[p[0]])}, щоб вийшов ще один`, drag: p };
      if (p) return { text: tt`${who} просить ${ic(w.need)}. Перетягни ${ic(S.board[p[0]])} на такий самий ${ic(S.board[p[1]])}`, drag: p };
      const g = genOf(w.need.c);
      if (g >= 0) return { text: tt`${who} просить ${ic(w.need)}. Тапни на генератор «${GENS[S.board[g].g].name}» — з'явиться ${ic({ c: w.need.c, l: 0 })}`, tap: cell(g) };
    }
    const p = pairs()[0];
    if (p) return { text: tt`Злий два однакові ${ic(S.board[p[0]])} — вийде краще`, drag: p };
    const g = anyGen();
    if (g >= 0) return { text: tt`Тапни на генератор «${GENS[S.board[g].g].name}», щоб отримати нові предмети`, tap: cell(g) };
    return null;
  }

  /* найвищий рівень цього ланцюжка, що вже є на дошці (нижче за потрібний) — і чи він один */
  function best1(need) {
    let l = -1, n = 0;
    S.board.forEach((x, i) => { if (plain(x) && open(i) && x.c === need.c && x.l < need.l) { if (x.l > l) { l = x.l; n = 1; } else if (x.l === l) n++; } });
    return l < 0 ? null : { l, single: n === 1 };
  }
  const genKey = c => { const b = genOf(c); if (b >= 0) return S.board[b].g; return Object.keys(GENS).find(g => GENS[g].chain === c && !GENS[g].pet) || null; };

  /* ---------- «Як зібрати» — картка замовлення: ланцюжок крок за кроком ---------- */
  function nextFor(need) {
    if (has(need)) return tt`✅ Уже є на дошці`;
    const ch = CHAINS[need.c], g = genKey(need.c);
    if (need.c === "dish") return tt`🔥 Страви готують у печі — тапни на піч`;
    if (ch.nomerge || need.l === 0)
      return g ? tt`👆 Тапни на генератор «${GENS[g].name}» — з'явиться ${ic(need)}` : tt`🎁 Такі трапляються в подарунках і скринях`;
    for (let k = need.l - 1; k >= 0; k--) {
      if (pairs(need.c).some(p => S.board[p[0]].l === k)) return tt`✌️ Злий два ${ic({ c: need.c, l: k })} — вийде ${ic({ c: need.c, l: k + 1 })}`;
      const one = S.board.some((x, i) => plain(x) && open(i) && x.c === need.c && x.l === k);
      if (one) return k === 0
        ? (g ? tt`Є один ${ic({ c: need.c, l: 0 })} — тапни на генератор «${GENS[g].name}», щоб з'явився другий` : tt`Є один ${ic({ c: need.c, l: 0 })} — потрібен ще один`)
        : tt`Є один ${ic({ c: need.c, l: k })} — зроби ще один: злий два ${ic({ c: need.c, l: k - 1 })}`;
    }
    return g ? tt`👆 Почни з генератора «${GENS[g].name}»: тапай, поки не буде два ${ic({ c: need.c, l: 0 })}` : tt`🎁 Такі трапляються в подарунках і скринях`;
  }
  function recipe(o) {
    const ch = CHARS[o.ch];
    if (!S.tourRecipe) { S.tourRecipe = 1; save(); }
    const row = need => {
      const c = CHAINS[need.c]; if (!c) return "";
      const g = genKey(need.c), chain = !c.nomerge && need.c !== "dish" && need.l > 0;
      const cnt = l => S.board.filter((x, i) => x && !x.g && open(i) && x.c === need.c && x.l === l).length;
      const chip = l => { const n = cnt(l); return `<span class="rc-s${l === need.l ? " goal" : ""}${n ? " have" : ""}">${ic({ c: need.c, l })}${n ? `<i>${n}</i>` : ""}</span>`; };
      let steps = (chain && g ? `<span class="rc-s gen">${GENS[g].icon}</span><b class="rc-a">›</b>` : "") +
        (chain ? Array.from({ length: need.l + 1 }, (_, l) => chip(l)).join(`<b class="rc-a">›</b>`) : chip(need.l));
      let bar = "";
      if (chain) {
        const want = 2 ** need.l;
        let got = 0; S.board.forEach((x, i) => { if (x && !x.g && open(i) && x.c === need.c && x.l <= need.l) got += 2 ** x.l; });
        got = Math.min(want, got);
        bar = `<div class="rc-bar"><i style="width:${Math.round(got / want * 100)}%"></i></div>` +
          `<p class="rc-cnt">${tt`Зібрано ${got} з ${want}`} ${ic({ c: need.c, l: 0 })}</p>`;
      }
      return `<div class="rc"><p class="rc-name">${ic(need)} <b>${itemName(need)}</b></p><div class="rc-chain">${steps}</div>${bar}<p class="rc-next">${nextFor(need)}</p></div>`;
    };
    modal({ title: tt`Як зібрати замовлення`,
      html: `<p class="rc-who">${face(ch, "mini")} <b>${ch.name}:</b> ${fmtName(ch.ask[o.line] || "")}</p>` + o.items.map(row).join("") +
        `<p class="hint-s">${tt`Збирай по черзі: два однакові предмети зливаються в один наступний. Тож для кращого предмета спершу зроби два попередні.`}</p>`,
      buttons: [{ label: tt`👆 Покажи на дошці`, onClick: () => { focusId = o.id; focusUntil = Date.now() + 12e3; idleAt = Date.now(); lastKey = ""; render(); } },
        { label: tt`Добре`, cls: "ghost" }] });
  }
  /* одноразова підказка: тапни на замовлення, щоб побачити ланцюжок */
  function recipeNudge() {
    if (S.tourRecipe || S.level > 10 || !onTab("board")) return null;
    const o = (S.orders || []).find(o => o.items && o.items.some(n => n.l >= 2 && CHAINS[n.c] && !CHAINS[n.c].nomerge) && !matchOrder(o).every(i => i >= 0));
    const card = o && document.querySelector(`#orders .order[data-id="${o.id}"]`);
    return card ? { text: tt`💡 Тапни на замовлення — покажу, як його зібрати крок за кроком`, tap: card, board: 1, banner: 1 } : null;
  }

  /* підказка для поточного кроку */
  function plan() {
    const s = STEPS[step()];
    if (s === "merge") {
      const p = pairs("veg")[0] || pairs()[0];
      if (!p) { S.tour = 1; return plan(); }
      return { text: tt`✌️ Два однакові предмети зливаються в кращий! Перетягни ${ic(S.board[p[0]])} на такий самий ${ic(S.board[p[1]])}`, drag: p, board: 1 };
    }
    if (s === "gen") {
      const g = anyGen();
      if (g < 0) { S.tour = 2; return plan(); }
      return { text: tt`👆 Тапни на генератор «${GENS[S.board[g].g].name}» — так з'являються нові предмети (1 тап = 1 ⚡)`, tap: cell(g), board: 1 };
    }
    if (s === "make" || s === "give") {
      if (s === "make" && readyBtn()) S.tour = 3;
      if (s === "give" && !readyBtn()) S.tour = 2;
      const a = advise();
      return a && Object.assign(a, { board: 1 });
    }
    if (s === "yard") {
      const t0 = STORY[S.chapter] && STORY[S.chapter].tasks[S.task];
      const ok = t0 && (window.ECON ? ECON.taskReady(S.chapter, S.task) : S.stars >= t0.cost);
      if (!ok) { const a = advise(); return a && Object.assign(a, { board: 1, text: tt`⭐ Ще трохи зірочок — ` + a.text }); }
      if (onTab("story")) { const b = document.querySelector("#tasks .t-btn"); return { text: tt`🔨 Натисни на кнопку — і перше завдання у дворику виконано!`, tap: b, top: 1 }; }
      if (document.body.classList.contains("nav-open") || !onTab("board")) return { text: tt`🏡 Відкрий «Дворик»`, tap: document.querySelector('.nav button[data-tab="story"]'), top: 1 };
      return { text: tt`⭐ За замовлення дають зірочки — ними ремонтують дворик. Натисни ☰`, tap: $("menuBtn"), board: 1 };
    }
    return null;
  }

  /* ---------- рука й підсвітка ---------- */
  function els() {
    if (hand) return;
    hand = document.createElement("div"); hand.className = "tour-hand"; hand.hidden = true;
    hand.innerHTML = `<span class="th-item"></span><span class="th-f">👆</span>`;
    tip = document.createElement("div"); tip.className = "tour-tip"; tip.hidden = true;
    rings = [0, 1].map(() => { const r = document.createElement("div"); r.className = "tour-ring"; r.hidden = true; document.body.appendChild(r); return r; });
    document.body.append(hand, tip);
  }
  function hide() { if (!hand) return; hand.hidden = true; rings.forEach(r => r.hidden = true); lastKey = ""; }
  function ring(r, el) {
    const b = el && el.getBoundingClientRect();
    if (!b || !b.width) { r.hidden = true; return null; }
    Object.assign(r.style, { left: b.left - 3 + "px", top: b.top - 3 + "px", width: b.width + 6 + "px", height: b.height + 6 + "px" });
    r.hidden = false; return b;
  }
  function show(p) {
    els();
    let a, b = null;
    if (p.drag) { a = ring(rings[0], cell(p.drag[0])); b = ring(rings[1], cell(p.drag[1])); }
    else { a = ring(rings[0], p.tap); rings[1].hidden = true; }
    if (!a) { hide(); return; }
    const key = (p.drag ? "d" + p.drag.join("-") : "t") + ":" + Math.round(a.left) + "," + Math.round(a.top) + (b ? ":" + Math.round(b.left) + "," + Math.round(b.top) : "");
    if (key === lastKey && !hand.hidden) return;
    lastKey = key;
    const x = a.left + a.width / 2, y = a.top + a.height / 2;
    hand.style.left = x + "px"; hand.style.top = y + "px";
    const low = !p.drag && y > innerHeight - 130;          // кнопки внизу — рука зверху, пальцем донизу
    hand.className = "tour-hand " + (p.drag ? "drag" : "tap") + (low ? " low" : "");
    const f = low ? "👇" : "👆"; if (hand.dataset.f !== f) { hand.dataset.f = f; hand.lastChild.textContent = f; }
    hand.firstChild.textContent = p.drag ? ic(S.board[p.drag[0]]) : "";
    hand.style.setProperty("--dx", b ? (b.left + b.width / 2 - x) + "px" : "0px");
    hand.style.setProperty("--dy", b ? (b.top + b.height / 2 - y) + "px" : "0px");
    hand.hidden = false;
    void hand.offsetWidth;                         // перезапуск анімації на новому місці
  }

  function render() {
    if (!S) return;
    const h = $("tutHint");
    const hideAll = () => { hide(); if (tip) tip.hidden = true; };
    if (!S.started || S.sideOn || S.woodOn) { if (h) h.hidden = true; hideAll(); return; }
    if (doneMsg && !busy()) { doneMsg = false; setTimeout(() => toast(tt`🎉 Навчання пройдено! Далі зливай, виконуй замовлення й прикрашай дворик`), 400); }
    const tutoring = active();
    let p = null;
    if (tutoring) p = plan();
    else if (focusUntil > Date.now() && onTab("board")) { p = advise(focusId); if (!p) focusUntil = 0; else p.banner = 1; }
    else if ((p = recipeNudge())) {}
    else if (S.level < IDLE_LVL && Date.now() - idleAt > IDLE_MS && onTab("board")) p = advise();
    // текст: на дошці — у смужці над дошкою, на інших вкладках — плашкою зверху
    if (h) { h.hidden = !((tutoring || (p && p.banner)) && p && p.text && onTab("board")); if (!h.hidden) h.textContent = gx(p.text); }
    if (tip) { tip.hidden = !(tutoring && p && p.text && p.top && !onTab("board")); if (!tip.hidden) tip.textContent = gx(p.text); }
    const quiet = busy() || finger || (typeof drag !== "undefined" && drag) || (typeof dragAnim !== "undefined" && dragAnim) || Date.now() < quietUntil;
    if (!p || quiet || (p.board && !onTab("board"))) { hide(); return; }
    show(p);
  }

  // рука ховається, щойно торкаєшся екрана, і повертається, коли відпустиш
  document.addEventListener("pointerdown", () => { finger = true; idleAt = Date.now(); hide(); }, true);
  const up = () => { finger = false; idleAt = Date.now(); quietUntil = Date.now() + QUIET_MS; if (focusUntil > Date.now()) focusUntil = Date.now() + 12e3; };
  document.addEventListener("pointerup", up, true);
  document.addEventListener("pointercancel", up, true);
  window.addEventListener("resize", () => { lastKey = ""; });
  setInterval(() => { try { render(); } catch (e) { window.logErr && logErr(e, "TOUR"); } }, 250);

  return { ev, render, active, recipe, steps: STEPS };
})();
