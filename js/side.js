"use strict";
/* ============================================================
   ПРИГОДИ — тимчасові окремі дошки
   Раз на кілька днів сусід просить допомоги: відкривається своя дошка
   з власним генератором і ланцюжком. Цілі треба виконати за 2 дні.
   Стан: S.side = { kind, until, board, goals:[{l,t,n}], done }
         S.sideOn — зараз відкрита дошка пригоди (тоді S.main — дошка городу)
         S.sideNext — коли може з'явитися наступна пригода
   Предмети пригод показуються символами приватної зони Unicode:
   PUA_MAP[символ] = { e: емодзі-замінник, img: мальована картинка або null }.
   ============================================================ */
const SIDE_DUR = 48 * 3600e3, SIDE_GAP = 24 * 3600e3;
const SIDE_ART = ["side-jam-0", "side-jam-1", "side-jam-2", "side-jam-3", "side-jam-4", "side-shirt-0", "side-shirt-1", "side-shirt-2", "side-shirt-3", "side-shirt-4", "side-fair-0", "side-fair-1", "side-fair-2", "side-fair-3", "side-fair-4", "side-garden-0", "side-garden-1", "side-garden-2", "side-garden-3", "side-garden-4", "side-gen-jam", "side-gen-shirt", "side-gen-fair", "side-gen-garden"];                    // мальовані: "side-jam-0", "side-gen-jam"…
const SIDE_KINDS = [
  { id: "jam", host: "halya", title: "Вишневе варення", gen: ["🪣", "Відро вишень"],
    items: [["🍒", "Вишенька"], ["🥣", "Миска вишень"], ["🫕", "Казанок варення"], ["🫙", "Банка варення"], ["🥧", "Вишневий пиріг"]],
    goals: [{ l: 3, t: 2 }, { l: 4, t: 1 }],
    ask: "{name}, вишні поспіли — аж гілки гнуться! 🍒 Допоможи наварити варення, поки не пообсипались. Дві банки й пиріг — і на всю зиму вистачить!",
    thanks: "Ох і варення вийшло! Густе, запашне — як у моєї мами. А пиріг — тобі, з чаєм 💛" },
  { id: "shirt", host: "marichka", title: "Вишиванка для Марічки", gen: ["🧺", "Кошик рукодільниці"],
    items: [["🪡", "Голка з ниткою"], ["🧵", "Котушка ниток"], ["🧶", "Клубок вовни"], ["👚", "Сорочка-заготовка"], ["👗", "Вишиванка"]],
    goals: [{ l: 3, t: 2 }, { l: 4, t: 1 }],
    ask: "{name}, у школі свято вишиванок, а в мене тільки стара, з якої я виросла 😢 Бабуся Галя каже, що разом ми встигнемо пошити нову!",
    thanks: "Вона така гарна! Я найщасливіша дівчинка в усій школі! Дякую-дякую-дякую! 👗💛" },
  { id: "fair", host: "andriy", title: "Ярмарок ласощів", gen: ["🛒", "Ярмарковий візок"],
    items: [["🥜", "Горішки"], ["🍪", "Медяник"], ["🍭", "Півник на паличці"], ["🍫", "Шоколадна плитка"], ["🧺", "Кошик гостинців"]],
    goals: [{ l: 3, t: 2 }, { l: 4, t: 1 }],
    ask: "{name}, у суботу ярмарок у районі! Хочу привезти найкращі ласощі в окрузі. Допоможеш наготувати? 🍪",
    thanks: "Розкупили все за годину! Люди питали, хто це таке смачне робить. Я сказав — ми з тобою 😎" },
  { id: "garden", host: "olya", title: "Квітник до свята", gen: ["🪴", "Ящик із розсадою"],
    items: [["🌱", "Розсада"], ["🌼", "Ромашка"], ["🌷", "Тюльпан"], ["🌹", "Троянда"], ["💐", "Святковий букет"]],
    goals: [{ l: 3, t: 2 }, { l: 4, t: 1 }],
    ask: "{name}, у неділю день села, а клумба біля клубу — суцільний бур'ян 😩 Допоможи виростити квіти й зібрати букет для гостей!",
    thanks: "Клумба — як із листівки! Голова сільради навіть сфотографувався біля неї 🌹" }
];
const SIDE_REWARD = { chest: 1, stars: 4, coins: 150, hearts: 2 };

/* реєструємо ланцюжки й генератори пригод */
window.PUA_MAP = window.PUA_MAP || {};
(() => {
  let code = 0xE100;
  const ch = () => String.fromCharCode(code++);
  SIDE_KINDS.forEach(k => {
    const items = k.items.map(([e, name], l) => { const c = ch(); PUA_MAP[c] = { e, img: null, art: `side-${k.id}-${l}` }; return [c, name]; });
    CHAINS["side_" + k.id] = { name: k.title, items, side: true };
    const g = ch(); PUA_MAP[g] = { e: k.gen[0], img: null, art: `side-gen-${k.id}` };
    GENS["side_" + k.id] = { icon: g, name: k.gen[1], chain: "side_" + k.id, side: true };
  });
  Object.values(PUA_MAP).forEach(p => { if (p.art && SIDE_ART.includes(p.art)) p.img = "items/" + p.art + ".webp"; });
})();

window.SIDE = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const kind = () => S.side && SIDE_KINDS.find(k => k.id === S.side.kind);
  const chainId = () => "side_" + S.side.kind;
  const isSideItem = it => !!it && (it.g ? !!(GENS[it.g] && GENS[it.g].side) : !!(CHAINS[it.c] && (CHAINS[it.c].side || CHAINS[it.c].collect)));
  const left = () => Math.max(0, S.side.until - now());
  const hm = ms => { const h = Math.floor(ms / 36e5), m = Math.ceil(ms % 36e5 / 6e4); return h >= 24 ? Math.floor(h / 24) + "д " + (h % 24) + "г" : h ? h + "г " + m + "хв" : m + "хв"; };

  /* ---------- перемикання дошок ---------- */
  function enter() {
    if (!S.side || S.sideOn) return;
    S.main = S.board; S.board = S.side.board; S.sideOn = true; selected = -1;
    sfx.pop(); renderAll(); save();
  }
  function leave() {
    if (!S.sideOn) return;
    S.side ? (S.side.board = S.board) : null;
    S.board = S.main; delete S.main; S.sideOn = false; selected = -1;
    renderAll(); save();
  }
  /* на дошці пригоди — тільки її предмети; решта (подарунки, нагороди) йде у 📥 */
  function guardPlace(item) { return S.sideOn && !isSideItem(item); }

  /* ---------- поява, завершення ---------- */
  function offer() {
    const idx = (S.sideIdx || 0) % SIDE_KINDS.length, k = SIDE_KINDS[idx];
    if (!CHARS[k.host] || (CHARS[k.host].from || 0) > S.chapter || (window.WD && WD.isSick(k.host))) { S.sideIdx = idx + 1; return; }
    const board = Array(N).fill(null), mid = Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2);
    board[mid] = { g: "side_" + k.id, gl: 1 };
    [mid - 1, mid + 1, mid - COLS].forEach(i => { board[i] = { c: "side_" + k.id, l: 0 }; });
    S.side = { kind: k.id, until: now() + SIDE_DUR, board, goals: k.goals.map(g => ({ l: g.l, t: g.t, n: 0 })), done: false };
    S.sideIdx = idx + 1;
    save(); renderButton();
    playDialog([[k.host, k.ask]], () => modal({
      title: "Пригода: " + k.title,
      html: `<div class="big-emoji">${CHAINS[chainId()].items[k.goals[1].l][0]}</div>` +
        `<p>Окрема дошка з генератором ${GENS[S.side.board[mid].g].icon}. Зроби: ` +
        k.goals.map(g => `<b>${g.t} × ${CHAINS[chainId()].items[g.l][0]} ${CHAINS[chainId()].items[g.l][1]}</b>`).join(" і ") +
        `.</p><p>Час: <b>2 дні</b>. Нагорода: 📦 · +${SIDE_REWARD.stars} ⭐ · +${SIDE_REWARD.coins} 🪙 · 💛</p>`,
      buttons: [{ label: "До пригоди! ✨", onClick: enter }, { label: "Пізніше", cls: "ghost" }]
    }));
  }
  function finish(ok) {
    const k = kind();
    if (S.sideOn) leave();
    if (ok) {
      const r = SIDE_REWARD;
      placeItem({ c: "chest", l: r.chest }); S.stars += r.stars; S.coins += r.coins;
      if (S.fr && FRIENDS[k.host]) S.fr[k.host] = Math.min(FRIEND_STEPS[2], (S.fr[k.host] || 0) + r.hearts);
      confetti(); sfx.level();
    }
    S.side = null; S.sideNext = now() + SIDE_GAP;
    save(); renderAll(); renderButton();
    if (ok) playDialog([[k.host, k.thanks]], () => modal({ title: "Пригоду завершено! 🎉", html: `<div class="big-emoji">📦</div><p class="rewards">📦 &nbsp; +${SIDE_REWARD.stars} ⭐ &nbsp; +${SIDE_REWARD.coins} 🪙 &nbsp; +${SIDE_REWARD.hearts} 💛</p>`, buttons: [{ label: "Дякую! 💛" }] }));
    else modal({ title: "Пригода минула ⏰", html: `<div class="big-emoji">${CHARS[k.host].icon}</div><p>«${k.title}» — не встигли цього разу. Нічого, наступна пригода — вже скоро!</p>`, buttons: [{ label: "Добре" }] });
  }

  /* ---------- цілі пригоди ---------- */
  const findItem = l => S.board.findIndex(x => x && x.c === chainId() && x.l === l);
  function giveGoal(i) {
    const g = S.side.goals[i];
    if (!g || g.n >= g.t) return;
    const at = findItem(g.l);
    if (at < 0) { sfx.nope(); toast("Спершу створи " + itemName({ c: chainId(), l: g.l })); return; }
    const card = document.querySelector(`.order[data-goal="${i}"]`);
    flyFrom(at, card); S.board[at] = null; if (selected === at) selected = -1;
    g.n++; sfx.deliver();
    if (window.QUEST) QUEST.track("deliver");
    renderBoard(); renderOrders(); renderInfo(); save();
    if (S.side.goals.every(x => x.n >= x.t)) setTimeout(() => finish(true), 700);
  }
  function renderGoals(box) {
    const k = kind(), cid = chainId();
    const host = document.createElement("div");
    host.className = "order side-host pic";
    host.innerHTML = `<div class="o-who"><span class="o-name">${CHARS[k.host].name.split(" ").pop()}</span></div>` +
      `<div class="o-body"><div class="o-pic">${PORTRAITS_FULL.includes(k.host) || PORTRAITS.includes(k.host) ? `<img src="portraits/${k.host}.webp" alt="" style="object-position:${(PORTRAITS_FACE_X(k.host))}% 0">` : CHARS[k.host].icon}</div>` +
      `<div class="side-info"><b>${k.title}</b><span class="side-time">⏰ ${hm(left())}</span></div></div>`;
    box.appendChild(host);
    S.side.goals.forEach((g, i) => {
      const have = findItem(g.l) >= 0, done = g.n >= g.t;
      const el = document.createElement("div");
      el.className = "order side-goal" + (have && !done ? " ready" : "");
      el.dataset.goal = i;
      el.innerHTML = `<div class="o-who"><span class="o-name">Мета ${i + 1}</span></div>` +
        `<div class="o-items"><span class="o-item${have ? " have" : ""}">${CHAINS[cid].items[g.l][0]}</span></div>` +
        (done ? `<div class="o-rew">✅ ${g.t}/${g.t}</div>` : have ? `<button class="o-btn">Віддати ${g.n}/${g.t}</button>` : `<div class="o-rew">${g.n}/${g.t}</div>`);
      const b = el.querySelector(".o-btn"); if (b) b.onclick = () => giveGoal(i);
      el.onclick = e => { if (!e.target.closest(".o-btn")) toast(`${CHAINS[cid].items[g.l][0]} ${CHAINS[cid].items[g.l][1]} — потрібно ${g.t}, уже ${g.n}`); };
      box.appendChild(el);
    });
    document.querySelectorAll(".tile").forEach(t => { const it = S.board[+t.dataset.i]; t.classList.toggle("needed", !!it && S.side.goals.some(g => g.n < g.t && it.c === cid && it.l === g.l)); });
  }
  const PORTRAITS_FACE_X = who => (typeof PORTRAIT_FACE !== "undefined" && PORTRAIT_FACE[who] ? PORTRAIT_FACE[who][0] : 50);

  /* ---------- кнопка ---------- */
  function renderButton() {
    const b = $("sideBtn"); if (!b || !S) return;
    b.hidden = !S.side;
    if (!S.side) return;
    const k = kind();
    b.classList.toggle("on", !!S.sideOn);
    b.innerHTML = S.sideOn ? `<span class="sd-ic">🪴</span><small>Город</small>`
      : `<span class="sd-ic">${CHAINS[chainId()].items[0][0]}</span><small>${hm(left())}</small>`;
  }
  function toggle() { S.sideOn ? leave() : enter(); renderButton(); }

  /* ---------- щосекунди ---------- */
  function tick() {
    if (!S || !S.started) return;
    if (S.side && now() >= S.side.until && !busyUI()) { finish(false); return; }
    if (!S.side && !busyUI() && (window.UNL ? UNL.on("side") : S.level >= 4) && S.ordersDone >= 8 && now() >= (S.sideNext || 0) && !(S.ev && S.ev.intro === false)) offer();
    const t = document.querySelector(".side-time"); if (t && S.side) t.textContent = "⏰ " + hm(left());
    renderButton();
  }
  function onStart() { if (S.sideOn) leave(); renderButton(); }

  return { enter, leave, toggle, tick, onStart, guardPlace, renderGoals, renderButton, isSideItem, finish };
})();
