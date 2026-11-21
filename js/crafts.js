"use strict";
/* ============================================================
   НОВІ РЕМЕСЛА МАЙСТЕРНІ 🏺⚒️⛏️ — відкриваються по черзі (за кількістю виробів, відданих у майстерні)
   • Кераміка (20 виробів): «Гончарний круг». Ускладнення — ТРІЩИНИ: злиття від 3-го рівня
     з шансом 12% тріскає — замість виробу лишаються черепки.
   • Кузня (32 вироби): ускладнення — ЖАР. Кожен тап остуджує горн; холодна кузня не кує.
     Розпалювати треба деревом із майстерні: перетягни на кузню тріску, брусок, гілочку чи кривий брусок.
     Стан на генераторі: it.heat
   • Бурштин і ювелірка (45 виробів): «Бурштинова копанка». Ускладнення — ЖИЛА: після 30 тапів
     жила вичерпується, нову копати 2 год (або найняти копачів). Рідко (1/60) трапляється
     бурштин із комашкою — дорогий скарб. Стан на генераторі: it.vein, it.digUntil
   • Електроніка (60 виробів): «Радіомайстерня». Ускладнення — ПЕРЕВІРКА: вироби від 3-го рівня
     після злиття неперевірені (❔) — їх не можна ні злити, ні віддати, доки не перевіриш (тап, −1 ⚡).
     У 25% — коротке замикання 💥: лагодиш, перетягнувши на виріб дріт (перший предмет ланцюжка).
     Стан на предметі: it.untested, it.short
   ============================================================ */
const CRAFT_ART = [];   // мальовані: додаються сюди, коли буде аркуш (clay-0…, forge-0…, amber-0…, gen-*, shards, inclusion)
window.PUA_MAP = window.PUA_MAP || {};
const CRAFT_LIST = [
  { id: "clay", at: 20, gen: ["🏺", "Гончарний круг"], name: "Кераміка", base: 0xE490,
    items: [["🟤", "Грудка глини"], ["☕", "Горнятко"], ["🥣", "Полив'яна миска"], ["🍯", "Макітра"], ["🫖", "Куманець"], ["🏮", "Розписна ваза"], ["🧱", "Кахляна грубка"]],
    line: "Я тут подумав{a}… а давай і посуд ліпити? 🏺 Поставив{a} гончарний круг — горнятка, макітри, а там і кахляна грубка! Тільки обережно: глина при злитті іноді тріскає." },
  { id: "forge", at: 32, gen: ["⚒️", "Кузня"], name: "Кузня", base: 0xE4A0,
    items: [["🔩", "Цвях"], ["🧲", "Підкова на щастя"], ["🗝️", "Кований ключ"], ["🔪", "Ніж"], ["🪝", "Кований гак"], ["🔱", "Кований тризуб"], ["🚪", "Кована хвіртка"]],
    line: "Сюрприз! ⚒️ У нас тепер своя кузня! Тільки горн треба гріти — кидай у нього тріски, бруски й кривий брак із верстака. Холодна кузня не кує!" },
  { id: "amber", at: 45, gen: ["⛏️", "Бурштинова копанка"], name: "Бурштин", base: 0xE4B0, vals: [2, 14, 30, 65, 140, 300, 650],
    items: [["🪨", "Порода з бурштином"], ["🟠", "Крихта бурштину"], ["🔶", "Бурштинова грудка"], ["💎", "Шліфований бурштин"], ["💍", "Перстень із бурштином"], ["📿", "Бурштинове намисто"], ["👑", "Бурштинова діадема"]],
    line: "Знаєш, що в нашому піску? Бурштин! ☀️ Я викопав{a} копанку — злий породу, і буде крихта, а з крихти — персні й намиста. Жила, правда, швидко вичерпується…" },
  { id: "electro", at: 60, gen: ["🛠️", "Радіомайстерня"], name: "Електроніка", base: 0xE4C0, vals: [3, 9, 20, 42, 90, 190, 400],
    items: [["🔌", "Дріт із вилкою"], ["💡", "Лампочка"], ["🔋", "Батарейка"], ["🔦", "Ліхтарик"], ["☎️", "Дисковий телефон"], ["📻", "Лампове радіо"], ["📺", "Ламповий телевізор"]],
    line: "Слухай, у сусідів стільки старої техніки — радіо, телефони… А давай лагодити й збирати! 🛠️ Я облаштував{a} радіомайстерню. Тільки кожну річ треба перевіряти — бо буває й коротке замикання 💥" }
];
CRAFT_LIST.forEach((cr, k) => {
  const art = id => CRAFT_ART.includes(id) ? `items/${id}.webp` : null;
  CHAINS[cr.id] = { name: cr.name, side: true, woody: true, vals: cr.vals, items: cr.items.map(([e, n], l) => {
    const c = String.fromCharCode(cr.base + l); PUA_MAP[c] = { e, img: art(`${cr.id}-${l}`) }; return [c, n]; }) };
  const g = String.fromCharCode(0xE442 + k);
  PUA_MAP[g] = { e: cr.gen[0], img: art("gen-" + cr.id) };
  GENS["w_" + cr.id] = { icon: g, name: cr.gen[1], chain: cr.id, side: true };
});
CHAINS.shards = { name: "Черепки", side: true, woody: true, nomerge: true, value: 1, items: [[String.fromCharCode(0xE481), "Черепки"]] };
PUA_MAP[String.fromCharCode(0xE481)] = { e: "🧩", img: CRAFT_ART.includes("shards") ? "items/shards.webp" : null };
CHAINS.inclusion = { name: "Скарб", side: true, woody: true, nomerge: true, value: 220, items: [[String.fromCharCode(0xE482), "Бурштин із комашкою"]] };
PUA_MAP[String.fromCharCode(0xE482)] = { e: "🐞", img: CRAFT_ART.includes("inclusion") ? "items/inclusion.webp" : null };
/* лише деревина точить інструмент, сохне й гризе шашіль */
CHAINS.wood.timber = CHAINS.carve.timber = true;

const CRACK_AT = 3, CRACK_P = 0.12;
const HEAT_START = 40, HEAT_MAX = 80;
const FUEL = { "wood:0": 4, "wood:1": 10, "wood:2": 18, "carve:0": 4, "woodjunk:0": 8 };
const TEST_AT = 3, SHORT_P = 0.25;
const VEIN = 30, DIG_MIN = 120, DIG_COINS = 150, INCL_P = 1 / 60;

window.CRAFT = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const gx = s => s.replace(/\{a\}/g, LOVE.who() && LOVE.who().startsWith("man") ? "" : "ла");
  const hm = ms => { const t = Math.max(1, Math.ceil(ms / 6e4)); return t >= 60 ? Math.floor(t / 60) + " год " + (t % 60) + " хв" : t + " хв"; };
  function hint(flag, lines) {
    if (!S.wood || S.wood["seen_" + flag]) return;
    S.wood["seen_" + flag] = true; save();
    setTimeout(() => playDialog(lines), 600);
  }
  const heat = it => (it.heat == null ? HEAT_START : it.heat);
  const digging = it => !!(it.digUntil && now() < it.digUntil);

  /* ---------- відкриття ремесел ---------- */
  function unlock() {
    const w = S.wood; if (!w || !S.woodOn) return false;
    const cr = CRAFT_LIST.find(x => w.done >= x.at && !w.gens.includes(x.id));
    if (!cr) return false;
    w.gens.push(cr.id); (w.since = w.since || {})[cr.id] = w.done;
    placeItem({ g: "w_" + cr.id, gl: 1 });
    save(); renderAll(); confetti(); sfx.level();
    playDialog([[LOVE.who(), gx(cr.line)]], () => modal({ title: `Нове ремесло: ${cr.name}! 🎉`,
      html: `<div class="big-emoji">${GENS["w_" + cr.id].icon}</div><p><b>${cr.gen[1]}</b> — уже в майстерні.</p><p class="rewards">${CHAINS[cr.id].items.map(x => x[0]).join(" → ")}</p>`,
      buttons: [{ label: "До роботи! 💪" }] }));
    return true;
  }
  function onDeliver() { setTimeout(() => { if (!busyUI()) unlock(); }, 1800); }
  function next() { const w = S.wood; return w && CRAFT_LIST.find(x => !w.gens.includes(x.id)); }

  /* ---------- тап генератора ---------- */
  function canTap(i) {
    const it = S.board[i];
    if (!it || !it.g) return true;
    if (it.g === "w_forge" && heat(it) <= 0) {
      sfx.nope(); hint("cold", [[LOVE.who(), "Горн охолов 🥶 Перетягни на кузню тріску, брусок чи кривий брак із верстака — розпалимо!"]]);
      toast("🔥 Кузня холодна — перетягни на неї деревину з верстака"); return false;
    }
    if (it.g === "w_amber") {
      if (it.digUntil && !digging(it)) { delete it.digUntil; it.vein = 0; }
      if (digging(it)) { digModal(i); return false; }
    }
    return true;
  }
  function afterTap(i) {
    const it = S.board[i]; if (!it || !it.g) return;
    if (it.g === "w_forge") it.heat = heat(it) - 1;
    if (it.g === "w_amber") {
      it.vein = (it.vein || 0) + 1;
      if (Math.random() < INCL_P) {
        const at = placeItem({ c: "inclusion", l: 0 }, i);
        if (at >= 0) { spawnFrom.set(at, i); setTimeout(() => sparkle(at, "✨", 10), 250); }
        setTimeout(() => toast("🐞 Бурштин із комашкою! Рідкісний скарб — за нього дадуть 220 🪙"), 300);
      }
      if (it.vein >= VEIN) {
        it.digUntil = now() + DIG_MIN * 60e3; it.vein = 0;
        hint("vein", [[LOVE.who(), "Жилу вибрали до крихти ⛏️ Нову доведеться покопати — пару годин. Або покличемо копачів, але за гроші."]]);
        toast("⛏️ Жила вичерпана — копаємо нову");
      }
    }
  }
  const digPrice = () => (window.ECON ? ECON.price("dig", DIG_COINS) : DIG_COINS);
  function digModal(i) {
    const it = S.board[i];
    modal({ title: "Жила вичерпана ⛏️",
      html: `<div class="big-emoji">${GENS[it.g].icon}</div><p>Бурштину тут більше нема. Нову жилу відкопаємо за <b>${hm(it.digUntil - now())}</b>.</p><p class="hint-s">Копачі знайдуть нову одразу.</p>`,
      buttons: [{ label: `Найняти копачів · ${digPrice()} 🪙`, disabled: S.coins < digPrice(), onClick: () => { S.coins -= digPrice(); window.ECON && ECON.bought("dig"); delete it.digUntil; it.vein = 0; sfx.coin(); toast("⛏️ Нова жила!"); renderBoard(); renderTop(); renderInfo(); save(); } },
        { label: "Почекаю", cls: "ghost" }] });
  }

  /* ---------- паливо для кузні: перетягнути деревину на горн ---------- */
  function feed(a, b) {
    const A = S.board[a], B = S.board[b];
    if (A && B && !A.g && !B.g && B.short && A.c === "electro" && A.l === 0) {      // дріт лагодить замикання
      delete B.short; delete B.untested; S.board[a] = null; selected = b;
      sfx.merge(B.l); sparkle(b, "✨", 6); popIdx.add(b); toast("🔌 Полагоджено — працює!");
      renderBoard(); renderInfo(); renderOrders(); save(); return true;
    }
    if (!A || A.g || !B || B.g !== "w_forge") return false;
    const v = FUEL[A.c + ":" + A.l];
    if (!v) { sfx.nope(); toast("🔥 У горн — тільки деревину: тріску, брусок, гілочку чи кривий брак"); renderBoard(); return true; }
    if (heat(B) >= HEAT_MAX) { sfx.nope(); toast("🔥 Горн і так розпечений"); renderBoard(); return true; }
    B.heat = Math.min(HEAT_MAX, heat(B) + v);
    S.board[a] = null; if (selected === a) selected = b;
    sfx.pop(); popIdx.add(b); sparkle(b, "🔥", 6); floatAt(b, "+" + v + " 🔥");
    renderBoard(); renderInfo(); save();
    return true;
  }

  /* ---------- тріщини в кераміці ---------- */
  function onMerged(b, nl) {
    const it = S.board[b];
    if (it && it.c === "electro" && nl >= TEST_AT) {
      it.untested = true;
      hint("test", [[LOVE.who(), "Техніку перед тим, як віддати, треба перевірити ❔ Тапни на виріб — і побачимо, чи працює. Якщо замкне 💥 — перетягни на нього дріт, полагодимо."]]);
      return;
    }
    if (!it || it.c !== "clay" || nl < CRACK_AT || Math.random() >= CRACK_P) return;
    S.board[b] = { c: "shards", l: 0 };
    setTimeout(() => { sfx.nope(); toast("💥 Тріснуло! Лишились черепки…"); }, 200);
    hint("crack", [[LOVE.who(), "Ох, тріснуло 😢 Так буває з глиною — великі речі іноді лускають при злитті. Черепки продай або викинь."]]);
  }

  /* ---------- перевірка електроніки ---------- */
  const unusable = it => !!(it && (it.untested || it.short));
  function testModal(i) {
    const it = S.board[i];
    if (it.short) {
      modal({ title: "Коротке замикання 💥", html: `<div class="big-emoji">${itemIcon(it)}</div><p>«${itemName(it)}» не працює.</p><p class="hint-s">Перетягни на нього <b>${CHAINS.electro.items[0][0]} ${CHAINS.electro.items[0][1].toLowerCase()}</b> — і полагодиш.</p>`, buttons: [{ label: "Добре" }] });
      return;
    }
    modal({ title: "Перевірити виріб ❔", html: `<div class="big-emoji">${itemIcon(it)}</div><p>«${itemName(it)}» ще не перевірений — віддати чи злити його поки не можна.</p><p class="hint-s">Буває, що замикає (${Math.round(SHORT_P * 100)}%) — тоді знадобиться дріт.</p>`,
      buttons: [{ label: "Перевірити · 1 ⚡", onClick: () => test(i) }, { label: "Пізніше", cls: "ghost" }] });
  }
  function test(i) {
    const it = S.board[i]; if (!it || !it.untested) return;
    if (!spendEnergy(1)) return;
    delete it.untested;
    if (Math.random() < SHORT_P) { it.short = true; sfx.nope(); toast("💥 Замикання! Перетягни на виріб дріт 🔌"); }
    else { sfx.merge(it.l); sparkle(i, "✨", 6); toast("✅ Працює!"); }
    popIdx.add(i); renderBoard(); renderInfo(); renderOrders(); renderTop(); save();
  }
  const tileKey = it => (it && it.untested ? ":u" : "") + (it && it.short ? ":x" : "");
  function decorate(t, it) {
    if (!t || !it || it.g) return;
    const want = it.short ? "💥" : it.untested ? "❔" : "";
    let b = t.querySelector(".test-b");
    if (want && !b) { b = document.createElement("span"); b.className = "test-b"; t.appendChild(b); }
    if (b && !want) b.remove(); else if (b && b.dataset.v !== want) { b.dataset.v = want; b.textContent = want; }
    t.classList.toggle("wet", !!want);
  }

  function genInfo(it) {
    if (it.g === "w_forge") return ` · 🔥 жар ${heat(it)}/${HEAT_MAX}`;
    if (it.g === "w_amber") return digging(it) ? ` · ⛏️ нова жила за ${hm(it.digUntil - now())}` : ` · жила ${VEIN - (it.vein || 0)}/${VEIN}`;
    return "";
  }
  function cardSub() {
    const n = next();
    return n ? ` · далі: ${n.name.toLowerCase()} (${n.at} виробів)` : "";
  }
  function tick() { if (S && S.started && S.woodOn && !busyUI()) unlock(); }
  return { canTap, afterTap, feed, onMerged, onDeliver, genInfo, cardSub, tick, unusable, testModal, tileKey, decorate, list: CRAFT_LIST };
})();
