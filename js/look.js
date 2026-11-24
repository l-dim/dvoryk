"use strict";
/* ============================================================
   ОБРАЗ ДНЯ 💃 (як «Вызов наряда дня» з голосуванням у записі)
   • Щодня нова тема. Одягаєш сусіда в речі з гардероба (6 місць).
   • Журі-село голосує: бали за кожну річ, за збіг із темою, рідкісність, повний образ і цілий стрій.
   • Таблиця з 9 суперницями з сусідніх сіл → нагорода за місце. Один виступ на день.
   • «Голосувати»: тричі на день обираєш кращий з двох чужих образів — +1 🪢 за кожен голос.
   Стан: S.look = { day, who, sel: { місце: "колекція:індекс" }, done: { score, place }, votes }
   ============================================================ */
const LOOK_SLOTS = [["head", tt`Головний убір`, "👒"], ["top", tt`Сорочка / сукня`, "👚"], ["outer", tt`Верхнє`, "🧥"], ["bottom", tt`Спідниця / штани`, "👖"], ["shoes", tt`Взуття`, "👢"], ["acc", tt`Прикраса`, "📿"]];
const LOOK_SLOT_OF = {
  vinok:    ["head", "top", "outer", "bottom", "acc", "acc", "shoes", "head"],
  kozak:    ["top", "bottom", "acc", "outer", "head", "shoes", "acc", "acc"],
  nedilia:  ["head", "top", "bottom", "outer", "outer", "acc", "shoes", "acc"],
  yarmarok: ["head", "top", "head", "shoes", "head", "acc", "acc", "acc"]
};
const LOOK_TAGS = { vinok: ["fest", "folk", "bright"], kozak: ["folk", "brave", "fest"], nedilia: ["cozy", "elegant", "folk"], yarmarok: ["summer", "bright", "fun"] };
const LOOK_THEMES = [
  { name: tt`Свято Купала`, icon: "🔥", tags: ["fest", "summer"] },
  { name: tt`Недільна служба`, icon: "⛪", tags: ["elegant", "cozy"] },
  { name: tt`Козацькі забави`, icon: "🪕", tags: ["brave", "folk"] },
  { name: tt`Ярмарок у районі`, icon: "🎪", tags: ["fun", "bright"] },
  { name: tt`Весільна гостя`, icon: "💐", tags: ["fest", "elegant"] },
  { name: tt`Вечорниці`, icon: "🎻", tags: ["folk", "fun"] },
  { name: tt`Осінній затишок`, icon: "🍂", tags: ["cozy", "folk"] },
  { name: tt`Літня прогулянка`, icon: "🌻", tags: ["summer", "fun"] },
  { name: tt`День вишиванки`, icon: "🌸", tags: ["folk", "bright"] },
  { name: tt`Святковий концерт`, icon: "🎶", tags: ["fest", "bright"] }
];
const LOOK_RIVALS = [["👩‍🦰", tt`Оксана`], ["👧", tt`Соломійка`], ["👩", tt`Ганна`], ["👱‍♀️", tt`Ірина з Липового`], ["👩‍🍳", tt`Тетяна`], ["🧕", tt`Віра`], ["👵", tt`Баба Явдоха`], ["👩‍🎤", tt`Даринка`], ["🧑‍🍳", tt`Марко`]];
const LOOK_REWARDS = [
  { chest: 2, coins: 150, thread: 10, stars: 2 }, { chest: 1, coins: 80, thread: 6 }, { chest: 1, coins: 80, thread: 6 },
  { chest: 0, coins: 40, thread: 4 }, { chest: 0, coins: 40, thread: 4 }, { chest: 0, coins: 40, thread: 4 },
  { coins: 20, thread: 2 }, { coins: 20, thread: 2 }, { coins: 20, thread: 2 }, { coins: 20, thread: 2 }
];
const LOOK_VOTES = 3;

window.LOOK = (() => {
  const on = () => window.UNL && UNL.on("look");
  const now = () => window.DVORYK_NOW || Date.now();
  const dayStr = () => { const d = new Date(now()); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const dayNum = () => Math.floor((new Date(now()).setHours(12, 0, 0, 0)) / 864e5);
  const theme = () => LOOK_THEMES[dayNum() % LOOK_THEMES.length];
  function rng(seed) { let s = (seed * 2654435761) >>> 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function st() {
    if (!S.look || S.look.day !== dayStr()) S.look = { day: dayStr(), who: (S.look && S.look.who) || "olya", sel: {}, done: null, votes: 0 };
    return S.look;
  }
  const coll = id => FASHION.find(c => c.id === id);
  const owned = () => { const out = []; FASHION.forEach(c => Object.keys((S.fash && S.fash.have[c.id]) || {}).forEach(i => out.push(c.id + ":" + i))); return out; };
  const pieceOf = key => { const [c, i] = key.split(":"); return { c: coll(c), i: +i, slot: LOOK_SLOT_OF[c][+i], tags: LOOK_TAGS[c], w: FASH_W[+i] }; };
  const icon = key => { const p = pieceOf(key); return fashIcon(p.c, p.i); };

  /* оцінка журі */
  function score(sel) {
    const th = theme(), keys = Object.values(sel).filter(Boolean);
    if (!keys.length) return { total: 0, parts: [] };
    let total = 0; const parts = [];
    keys.forEach(k => { const p = pieceOf(k), match = p.tags.filter(t => th.tags.includes(t)).length;
      total += 10 + match * 6 + (p.w <= 2 ? 12 : p.w < 10 ? 5 : 0); });
    parts.push(tt`речі: ${keys.length}`);
    if (keys.length >= 5) { total += 15; parts.push(tt`повний образ +15`); }
    const byColl = {}; keys.forEach(k => { const c = k.split(":")[0]; byColl[c] = (byColl[c] || 0) + 1; });
    if (Object.values(byColl).some(n => n >= 4)) { total += 10; parts.push(tt`цілий стрій +10`); }
    return { total, parts };
  }
  /* суперниці на сьогодні */
  function rivals() {
    const r = rng(dayNum() + 991), base = 50 + Math.min(60, S.level * 3);
    return LOOK_RIVALS.map(([e, name]) => ({ e, name, pts: Math.round(base * (0.55 + r() * 0.95)) }));
  }
  function table(myPts) {
    const list = rivals().concat([{ me: true, e: window.HERO ? HERO.faceHtml(null, "mini") : "🏡", name: S.name || tt`Ти`, pts: myPts }]);
    list.sort((a, b) => b.pts - a.pts || (a.me ? -1 : 1));
    return list;
  }

  /* ---------- виступ ---------- */
  let pickSlot = null;
  function put(key) {
    const s = st(), p = pieceOf(key);
    s.sel[p.slot] = s.sel[p.slot] === key ? null : key;
    pickSlot = null; sfx.pop(); save(); panel();
  }
  function submit() {
    const s = st(); if (s.done) return;
    const sc = score(s.sel);
    if (Object.values(s.sel).filter(Boolean).length < 2) { sfx.nope(); toast(tt`Одягни хоча б дві речі 👗`); return; }
    const list = table(sc.total), place = list.findIndex(x => x.me) + 1;
    s.done = { score: sc.total, place };
    const r = LOOK_REWARDS[place - 1] || LOOK_REWARDS[LOOK_REWARDS.length - 1];
    if (r.chest !== undefined) placeItem({ c: "chest", l: r.chest });
    S.coins += r.coins || 0; S.stars += r.stars || 0;
    if (r.thread && window.FASH) FASH.add(r.thread);
    save(); renderAll();
    voting(sc.total, () => {
      if (place <= 3) { confetti(); sfx.level(); } else sfx.coin();
      panel();
    });
  }
  /* «голосування села»: сердечка набігають */
  function voting(total, done) {
    modal({ title: tt`Село голосує… 💌`, html: tt`<div class="lk-vote"><span id="lkHearts">💗 0</span><small>сердечок від сусідів</small></div>`, buttons: [] });
    let n = 0; const el = $("lkHearts"), step = Math.max(1, Math.round(total / 30));
    const t = setInterval(() => {
      n = Math.min(total, n + step); if (el) el.textContent = "💗 " + n; sfx.pop();
      if (n >= total) { clearInterval(t); setTimeout(() => { $("modal").classList.remove("show"); done(); }, 600); }
    }, 60);
  }

  /* ---------- голосувати за інших ---------- */
  function randomLook(r) {
    const all = []; FASHION.forEach(c => c.items.forEach((_, i) => all.push(c.id + ":" + i)));
    const sel = {}; LOOK_SLOTS.forEach(([sl]) => { const opts = all.filter(k => pieceOf(k).slot === sl); if (r() < 0.8) sel[sl] = opts[Math.floor(r() * opts.length)]; });
    return sel;
  }
  function vote() {
    const s = st();
    if (s.votes >= LOOK_VOTES) { sfx.nope(); toast(tt`Сьогодні вже проголосувала — завтра знову 🗳️`); return; }
    const r = rng(dayNum() * 7 + s.votes + 3), A = randomLook(r), B = randomLook(r), names = LOOK_RIVALS.slice().sort(() => r() - 0.5);
    const card = (sel, who, k) => `<button class="lk-opt" data-k="${k}"><b>${who[0]} ${who[1]}</b><div class="lk-mini">${Object.values(sel).filter(Boolean).map(icon).join("")}</div></button>`;
    modal({ title: tt`Голосування ${s.votes + 1}/${LOOK_VOTES} 🗳️`, html: tt`<p>Тема: <b>${theme().icon} ${theme().name}</b>. Чий образ кращий?</p><div class="lk-pair">${card(A, names[0], 0)}${card(B, names[1], 1)}</div>`,
      buttons: [{ label: tt`Пізніше`, cls: "ghost", onClick: panel }] });
    document.querySelectorAll(".lk-opt").forEach(b => b.onclick = () => {
      s.votes++; save(); if (window.FASH) FASH.add(1); sfx.coin(); toast(tt`🗳️ Голос зараховано! +1 🪢`);
      s.votes < LOOK_VOTES ? vote() : panel();
    });
  }

  /* ---------- вікно ---------- */
  function panel() {
    const s = st(), th = theme(), mine = owned();
    const who = CHARS[s.who] ? s.who : "olya";
    const sc = score(s.sel);
    const slots = LOOK_SLOTS.map(([id, name, ph]) => `<button class="lk-slot${s.sel[id] ? " full" : ""}${pickSlot === id ? " on" : ""}" data-s="${id}"><span>${s.sel[id] ? icon(s.sel[id]) : ph}</span><small>${name}</small></button>`).join("");
    const models = FASHION.map(c => c.host).filter((h, i, a) => a.indexOf(h) === i && CHARS[h] && (CHARS[h].from || 0) <= S.chapter)
      .map(h => `<button class="lk-who${h === who ? " on" : ""}" data-w="${h}">${face(CHARS[h], "mini")}</button>`).join("");
    const list = mine.filter(k => !pickSlot || pieceOf(k).slot === pickSlot);
    const pieces = list.length ? list.map(k => { const p = pieceOf(k), used = s.sel[p.slot] === k, m = p.tags.filter(t => th.tags.includes(t)).length;
      return `<button class="lk-pc${used ? " used" : ""}${m ? " hot" : ""}" data-k="${k}"><span>${icon(k)}</span><small>${p.c.items[p.i][1]}</small>${m ? `<i>${"♥".repeat(m)}</i>` : ""}</button>`; }).join("")
      : `<p class="hint-s">${mine.length ? tt`Для цього місця ще немає речей.` : tt`Гардероб порожній — спершу поший речі у «Гардеробі сусідів» 🪢`}</p>`;
    let body;
    if (s.done) {
      const tb = table(s.done.score);
      body = `<div class="lk-res"><div class="lk-model">${face(CHARS[who], "big")}<div class="lk-mini">${Object.values(s.sel).filter(Boolean).map(icon).join("")}</div></div>` +
        tt`<p>Твій образ: <b>${s.done.score} 💗</b> · <b>${s.done.place}-е місце</b>${s.done.place === 1 ? tt` — королева дня! 👑` : ""}</p></div>` +
        `<div class="ct-table">${tb.map((x, k) => `<div class="ct-row${x.me ? " me" : ""}"><span class="ct-pl">${["🥇", "🥈", "🥉"][k] || k + 1}</span><span class="ct-ava">${x.me || typeof rivalFace !== "function" ? x.e : rivalFace(x.name, x.e)}</span><span class="ct-name"><b>${x.me ? tt`Ти — ` + (S.name || tt`господиня`) : x.name}</b></span><span class="ct-pts">${x.pts} 💗</span></div>`).join("")}</div>` +
        tt`<p class="hint-s">Нова тема — завтра. А поки можна проголосувати за чужі образи: ще ${LOOK_VOTES - s.votes} з ${LOOK_VOTES} (+1 🪢 за голос).</p>`;
    } else {
      body = `<div class="lk-who-row">${models}</div><div class="lk-board"><div class="lk-model">${face(CHARS[who], "big")}</div><div class="lk-slots">${slots}</div></div>` +
        tt`<div class="lk-score">Оцінка журі: <b>${sc.total} 💗</b>${sc.parts.length ? `<small>${sc.parts.join(" · ")}</small>` : ""}</div>` +
        `<p class="lk-lbl">${pickSlot ? tt`Речі для: ` + LOOK_SLOTS.find(x => x[0] === pickSlot)[1] + tt` (тапни місце ще раз, щоб показати все)` : tt`Твої речі (♥ — пасує до теми):`}</p><div class="lk-pcs">${pieces}</div>` +
        tt`<button class="btn lk-go" id="lkGo">На подіум! 💃</button>`;
    }
    modal({ title: tt`Образ дня: ${th.icon} ${th.name}`, html: body,
      buttons: [...(s.votes < LOOK_VOTES ? [{ label: tt`🗳️ Голосувати (${LOOK_VOTES - s.votes})`, cls: "ghost", onClick: vote }] : []), { label: tt`Закрити`, cls: "ghost" }] });
    document.querySelectorAll(".lk-who").forEach(b => b.onclick = () => { s.who = b.dataset.w; save(); sfx.pop(); panel(); });
    document.querySelectorAll(".lk-slot").forEach(b => b.onclick = () => { pickSlot = pickSlot === b.dataset.s ? null : b.dataset.s; sfx.pop(); panel(); });
    document.querySelectorAll(".lk-pc").forEach(b => b.onclick = () => put(b.dataset.k));
    const g = $("lkGo"); if (g) g.onclick = submit;
  }
  function card() {
    if (!on()) return null;
    const s = st(), th = theme();
    return { icon: "💃", title: tt`Образ дня`, sub: `«${th.name}» · ${s.done ? tt`${ordinal(s.done.place)} місце · ${s.done.score} 💗` : tt`ще не виступала`}${s.votes < LOOK_VOTES ? ` · 🗳️ ${LOOK_VOTES - s.votes}` : ""}`,
      btn: s.done ? tt`Таблиця` : tt`Вбрати`, act: "look", ready: !s.done && owned().length >= 2 };
  }
  return { panel, card };
})();
