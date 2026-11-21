"use strict";
/* ============================================================
   СІМ'Я 💍🏡👶 — продовження романтичної лінії після переїзду (LOVE.stage 4)
   S.fam.st:
     0 — ще нічого
     1 — сватання відбулося, готуємось до весілля (S.fam.need — що зібрати)
     2 — весілля зіграли (S.fam.wedAt): 3 дні дворик святковий; відкрита «Наша хата»
     3 — чекаємо малюка (S.fam.babyAt — коли народиться)
     4 — малюк є (S.fam.baby = { name, born }): «допомагає» — приносить тріски в майстерню
   Хата: S.fam.house = { slotId: true } — які місця вже обставлені виробами
   ============================================================ */
const FAM_WED_DAYS = 3, BABY_WAIT_H = 48, BABY_AFTER_WED_D = 2, BABY_NEED_SLOTS = 6;
const WED_NEED = [
  { c: "flower", l: 6, why: "букет нареченої" },
  { c: "bake", l: 8, why: "весільний торт" },
  { c: "tea", l: 6, why: "тістечка для гостей" },
  { c: "sweet", l: 6, why: "солодкий стіл" },
  { c: "wood", l: 5, why: "скриня-посаг (з майстерні)" }
];
/* місця в хаті: [id, кімната, ланцюжок, рівень] */
const HOUSE_SLOTS = [
  ["sv1", "Світлиця", "wood", 6], ["sv2", "Світлиця", "wood", 8], ["sv3", "Світлиця", "carve", 4], ["sv4", "Світлиця", "carve", 6], ["sv5", "Світлиця", "carve", 5],
  ["ku1", "Кухня", "wood", 3], ["ku2", "Кухня", "wood", 4], ["ku3", "Кухня", "clay", 3], ["ku4", "Кухня", "clay", 4], ["ku5", "Кухня", "clay", 6],
  ["si1", "Сіни й подвір'я", "forge", 1], ["si2", "Сіни й подвір'я", "forge", 5], ["si3", "Сіни й подвір'я", "forge", 6],
  ["sk1", "Скарби", "amber", 5], ["sk2", "Скарби", "electro", 5], ["sk3", "Скарби", "electro", 6],
  ["dy1", "Дитяча", "wood", 7], ["dy2", "Дитяча", "carve", 2], ["dy3", "Дитяча", "carve", 3], ["dy4", "Дитяча", "wool", 3]
];
const BABY_NAMES = { girl: ["Соломійка", "Марійка", "Даринка", "Злата", "Ганнуся"], boy: ["Остапчик", "Тарасик", "Богданчик", "Матвійко", "Назарчик"] };
const BABY_EVERY_MIN = [25, 45];

window.FAM = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const st = () => (S.fam || (S.fam = { st: 0, house: {} }));
  const who = () => LOVE.who();
  const pm = () => who().startsWith("man");                 // партнер — чоловік?
  const P = (f, m) => (S.sex === "m" ? m : f);             // форма для гравця
  const Q = (f, m) => (pm() ? m : f);                      // форма для партнера
  const pname = () => CHARS[who()].name.split(" ").pop();
  const wboard = () => (S.woodOn ? S.board : S.wood && S.wood.board);
  const mboard = () => (S.sideOn ? S.main : S.board);
  const boardFor = c => (CHAINS[c] && CHAINS[c].side ? wboard() : mboard());
  const usable = x => !(window.WH && !WH.usable(x));
  const findOn = (c, l) => { const b = boardFor(c); return b ? b.findIndex(x => x && !x.g && x.c === c && x.l === l && usable(x)) : -1; };
  const hasChain = c => (S.wood && S.wood.gens.includes(c)) || S.gens.some(g => GENS[g] && GENS[g].chain === c);
  const wedding = () => { const f = S && S.fam; return !!(f && f.wedAt && now() - f.wedAt < FAM_WED_DAYS * 864e5); };
  const filled = () => Object.keys(st().house || {}).length;

  /* ---------- 1. сватання ---------- */
  function matchmaking() {
    const f = st();
    playDialog([
      ["halya", `{name}, а ти ${P("чула", "чув")}? До тебе старости йдуть! 😄 З хлібом, з рушниками — усе як годиться!`],
      ["stepan", `Добрий вечір у хату! Маємо ми ${Q("куницю", "мисливця")}, а у вас, кажуть, — ${P("куниця", "мисливець")}. ${Q("Майстриня", "Майстер")} ${pname()} шукає пару на все життя 🥖`],
      [who(), `{name}… я без тебе вже й не уявляю ні майстерні, ні хати. Будеш ${P("моєю дружиною", "моїм чоловіком")}? 💍`]
    ], () => modal({ title: "Сватання 💍",
      html: `<div class="big-emoji">🎀</div><p>Старости чекають на відповідь. Подати рушники — це «так», а гарбуз… ну, ти знаєш 😄</p>`,
      buttons: [{ label: "Подати рушники 🎀", onClick: accept }, { label: "Дати гарбуза 🎃", cls: "ghost", onClick: () => playDialog([["halya", "Ой, та ти жартуєш! 😂 Бачу ж, як очі світяться. Ану, подавай рушники!"]], accept) }] }));
  }
  function accept() {
    const f = st(); f.st = 1; f.need = WED_NEED.map(n => Object.assign({ done: false }, n)); save(); confetti(); sfx.level();
    playDialog([
      ["olya", "Ура-а! Весілля! 💃 А весілля без короваю й частування не буває — готуймося всім селом!"],
      [who(), `Збери для весілля: ${WED_NEED.map(n => itemIcon(n) + " " + n.why).join(", ")}. Скриню я в майстерні допоможу зробити 😉`]
    ], () => { renderHub(); toast("💍 Готуємось до весілля — список у «Подіях»"); });
  }

  /* ---------- 2. підготовка й весілля ---------- */
  function prepPanel() {
    const f = st();
    const rows = f.need.map((n, k) => {
      const has = !n.done && findOn(n.c, n.l) >= 0;
      return `<div class="fm-row${n.done ? " done" : ""}"><span class="fm-ic">${itemIcon(n)}</span><span class="fm-t"><b>${itemName(n)}</b><small>${n.why}</small></span>` +
        (n.done ? `<span class="fm-ok">✅</span>` : `<button class="s-btn fm-give${has ? "" : " dim"}" data-k="${k}">${has ? "Віддати" : "Немає"}</button>`) + `</div>`;
    }).join("");
    modal({ title: "Готуємось до весілля 💍", html: `<p class="hint-s">Збери все — і заграє весілля на весь дворик!</p><div class="fm-list">${rows}</div>`, buttons: [{ label: "Закрити", cls: "ghost" }] });
    document.querySelectorAll(".fm-give").forEach(b => b.onclick = () => give(+b.dataset.k));
  }
  function give(k) {
    const f = st(), n = f.need[k]; if (n.done) return;
    const i = findOn(n.c, n.l);
    if (i < 0) { sfx.nope(); toast(`Спершу збери ${itemIcon(n)} ${itemName(n)}${CHAINS[n.c].side ? " у майстерні" : " на городі"}`); return; }
    boardFor(n.c)[i] = null; if (selected === i) selected = -1;
    n.done = true; sfx.coin(); save(); renderBoard(); renderOrders();
    if (f.need.every(x => x.done)) { $("modal").classList.remove("show"); setTimeout(wed, 300); }
    else prepPanel();
  }
  function wed() {
    const f = st(); f.st = 2; f.wedAt = now(); save();
    S.energy += 50; S.coins += 500; placeItem({ c: "chest", l: 2 });
    confetti(); sfx.level(); renderAll();
    playDialog([
      ["halya", "Гості, гості, до столу! 🥹 Наречені вже йдуть — ох, яка ж пара!"],
      ["andriy", "Коровай удався на славу — найвищий у селі! 🎂"],
      ["stepan", "Гірко! Гірко! 🥂"],
      ["marichka", "А я весільний вінок плела всю ніч — трохи не заснула над ним 😄💐"],
      ["ivan", "Музики, грайте! Сьогодні танцюють усі — навіть дід Степан!"],
      [who(), `{name}… ${P("моя дружино", "мій чоловіче")} 💛 Ходімо додому — у НАШУ хату.`]
    ], () => modal({ title: "Весілля! 💍🎉",
      html: `<div class="big-emoji">💒</div><p>Усе село гуляло на вашому весіллі! Подарунки від гостей:</p><p class="rewards">+50 ⚡ &nbsp; +500 🪙 &nbsp; ${CHAINS.chest.items[2][0]}</p><p class="hint-s">Три дні дворик святковий. А ще відкрилась <b>«Наша хата»</b> — обставляй її виробами з майстерні (у «Подіях»).</p>`,
      buttons: [{ label: "Гірко! 🥂", onClick: () => { if (window.PHOTO && PHOTO.manual) setTimeout(() => toast("📸 Не забудь сфотографувати святковий дворик!"), 600); } }] }));
  }

  /* ---------- 3. наша хата ---------- */
  function housePanel() {
    const f = st(), house = f.house || (f.house = {});
    const rooms = [...new Set(HOUSE_SLOTS.map(s => s[1]))];
    const html = rooms.map(room => {
      if (room === "Дитяча" && f.st < 4) return `<div class="fm-room"><div class="fm-rh">${room} <small>🔒 колись знадобиться 😉</small></div></div>`;
      const cells = HOUSE_SLOTS.filter(s => s[1] === room).map(([id, , c, l]) => {
        const it = { c, l }, ok = house[id], open = hasChain(c) && CHAINS[c] && l < CHAINS[c].items.length;
        if (!open) return `<div class="fm-slot lock"><span>🔒</span><small>${c === "wool" ? "з хліва" : "нове ремесло"}</small></div>`;
        const have = !ok && findOn(c, l) >= 0;
        return `<button class="fm-slot${ok ? " ok" : have ? " can" : ""}" data-id="${id}"><span>${itemIcon(it)}</span><small>${ok ? "✓" : itemName(it)}</small></button>`;
      }).join("");
      return `<div class="fm-room"><div class="fm-rh">${room}</div><div class="fm-slots">${cells}</div></div>`;
    }).join("");
    const n = filled(), today = new Date(now()).toDateString(), canGift = n > 0 && f.giftDay !== today;
    modal({ title: "Наша хата 🏡",
      html: `<p class="hint-s">Тапни на місце — і постав туди виріб (з майстерні${hasChain("wool") ? " чи з хліва" : ""}). Затишок: <b>${n}</b> 💛 Щодня в хаті чекає гостинець.</p><div class="fm-house">${html}</div>`,
      buttons: [...(canGift ? [{ label: `Забрати гостинець · ${n * 8} 🪙 + ${Math.min(20, n)} ⚡`, onClick: houseGift }] : []), { label: "Закрити", cls: "ghost" }] });
    document.querySelectorAll(".fm-slot[data-id]").forEach(b => b.onclick = () => putSlot(b.dataset.id));
  }
  function putSlot(id) {
    const f = st(); if (f.house[id]) return;
    const [, room, c, l] = HOUSE_SLOTS.find(s => s[0] === id), i = findOn(c, l);
    if (i < 0) { sfx.nope(); toast(`Зроби ${itemIcon({ c, l })} ${itemName({ c, l })}${CHAINS[c].side ? " у майстерні" : ""} — і постав сюди`); return; }
    boardFor(c)[i] = null; if (selected === i) selected = -1;
    f.house[id] = true; S.stars += 1; gainXp(5); sfx.coin(); save(); renderBoard(); renderTop();
    toast(`🏡 ${itemName({ c, l })} — у ${room === "Кухня" ? "кухні" : room === "Світлиця" ? "світлиці" : room === "Дитяча" ? "дитячій" : room === "Скарби" ? "скриньці зі скарбами" : "сінях"}! +1 ⭐`);
    housePanel();
  }
  function houseGift() {
    const f = st(), n = filled(); f.giftDay = new Date(now()).toDateString();
    S.coins += n * 8; S.energy += Math.min(20, n); sfx.coin(); renderTop(); save();
    toast(`🏡 Гостинець із хати: +${n * 8} 🪙 +${Math.min(20, n)} ⚡`);
  }

  /* ---------- 4. малюк ---------- */
  function expecting() {
    const f = st(); f.st = 3; f.babyAt = now() + BABY_WAIT_H * 3600e3; save();
    playDialog([
      [who(), `{name}… сядь, ${P("будь ласка", "будь ласка")}. У мене новина 🥹 У нас буде малюк!`],
      ["halya", "Ой, Господи, яка радість! Я вже й пелюшки шию 🧵"],
      ["olya", "А колиску — ну ви ж майстри, самі зробите! 😉"]
    ], () => { renderHub(); toast("👶 Малюк з'явиться за два дні — готуйте колиску!"); });
  }
  function born() {
    const f = st();
    const opts = [...BABY_NAMES.girl.slice(0, 3), ...BABY_NAMES.boy.slice(0, 3)];
    modal({ title: "Народився малюк! 👶",
      html: `<div class="big-emoji">👶</div><p>Усе село прибігло вітати! Як назвемо?</p><div class="fm-names">${opts.map(n => `<button class="s-btn ghost fm-nm" data-n="${n}">${n}</button>`).join("")}</div><input id="fmName" class="fm-in" maxlength="16" placeholder="або своє ім'я…">`,
      buttons: [{ label: "Так і назвемо 💛", onClick: () => { const v = ($("fmName").value || "").trim(); finishBorn(v || opts[0]); } }] });
    document.querySelectorAll(".fm-nm").forEach(b => b.onclick = () => { $("fmName").value = b.dataset.n; });
  }
  function finishBorn(name) {
    const f = st(); f.st = 4; f.baby = { name, born: now() }; f.babyNext = now() + 20 * 60e3; save();
    S.energy += 30; confetti(); sfx.level(); renderAll();
    playDialog([
      ["ivan", `Вітаю! ${name} — найгарніше ім'я в селі! 🍼`],
      [who(), `Дивись, ${name} вже тягнеться до тріски 😄 Справжній майстер росте! Будемо ${Q("брати", "брати")} в майстерню — хай допомагає.`]
    ], () => toast(`👶 ${name} іноді приноситиме тріски в майстерню. А в хаті відкрилась дитяча!`));
  }
  /* малюк «допомагає»: приносить тріску на дошку майстерні */
  function babyHelp() {
    const f = st(), b = wboard(); if (!b || !S.woodOn) return;            // допомагає, коли ти в майстерні
    const free = b.map((x, i) => (!x && (typeof cellOpen !== "function" || cellOpen(i)) ? i : -1)).filter(i => i >= 0);
    f.babyNext = now() + (BABY_EVERY_MIN[0] + Math.random() * (BABY_EVERY_MIN[1] - BABY_EVERY_MIN[0])) * 60e3;
    if (!free.length) { save(); return; }
    const near = b.findIndex(x => x && x.g === "w_wood"), j = placeItem({ c: "wood", l: Math.random() < 0.2 ? 1 : 0 }, near >= 0 ? near : undefined);
    if (j >= 0) { popIdx.add(j); sparkle(j, "👶", 5); } renderBoard();
    save();
    toast(`👶 ${f.baby.name} приносить тріску! 🪵`);
  }

  /* ---------- дворик ---------- */
  function yard(ch) {
    const out = [], f = S.fam;
    if (!f) return out;
    if (wedding()) out.push(
      { key: "wd-arch", e: "💒", x: 50, y: 62, s: 12 }, { key: "wd-table", e: "🍽️", x: 30, y: 60, s: 11 },
      { key: "wd-ball1", e: "🎈", x: 18, y: 40, s: 6 }, { key: "wd-ball2", e: "🎈", x: 82, y: 40, s: 6 },
      { key: "wd-notes", e: "🎶", x: 66, y: 30, s: 5 }, { key: "wd-hearts", e: "💕", x: 40, y: 30, s: 5 }, { key: "wd-cake", e: "🎂", x: 30, y: 54, s: 5 });
    if (f.baby) out.push({ key: "baby", e: "👶", x: 58, y: 90, s: 5 });
    return out;
  }

  /* ---------- плин ---------- */
  function tick() {
    if (!S || !S.started || busyUI() || S.sideOn && !S.woodOn || !window.LOVE || !LOVE.together() || !S.wood) return;
    const f = st();
    if (f.st === 0 && S.wood.done >= 12 && S.level >= 13) { matchmaking(); return; }
    if (f.st === 2 && now() - f.wedAt >= BABY_AFTER_WED_D * 864e5 && filled() >= BABY_NEED_SLOTS) { expecting(); return; }
    if (f.st === 3 && now() >= f.babyAt) { born(); return; }
    if (f.st === 4 && f.baby && now() >= (f.babyNext || 0)) babyHelp();
    if (wedding() !== lastWed) { lastWed = wedding(); if (typeof renderStory === "function") renderStory(); }
  }
  let lastWed = null;
  function renderHub() { if (typeof renderAll === "function") renderAll(); }
  function card() {
    const f = S.fam; if (!f || !f.st) return null;
    if (f.st === 1) { const d = f.need.filter(n => n.done).length; return { icon: "💍", title: "Готуємось до весілля", sub: `зібрано ${d} з ${f.need.length}: ${f.need.map(n => n.done ? "✅" : itemIcon(n)).join(" ")}`, btn: "Відкрити", act: "fam-prep", ready: f.need.some(n => !n.done && findOn(n.c, n.l) >= 0) }; }
    const n = filled(), gift = n > 0 && f.giftDay !== new Date(now()).toDateString();
    const sub = f.st === 3 ? `чекаємо малюка 👶 ще ${Math.max(1, Math.ceil((f.babyAt - now()) / 3600e3))} год · затишок ${n}` :
      f.st === 4 ? `${f.baby.name} підростає 👶 · затишок ${n}${gift ? " · є гостинець!" : ""}` :
      `затишок ${n} з ${HOUSE_SLOTS.length - 4}${gift ? " · є гостинець!" : ""}${wedding() ? " · весільні дні 💒" : ""}`;
    return { icon: "🏡", title: "Наша хата", sub, btn: "Відкрити", act: "fam-house", ready: gift };
  }
  return { tick, card, yard, wedding, prepPanel, housePanel, festive: wedding };
})();

/* ---------- підключення ---------- */
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => FAM.card()]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { "fam-prep": () => FAM.prepPanel(), "fam-house": () => FAM.housePanel() });
if (typeof GUIDE_WOOD !== "undefined") GUIDE_WOOD.push(
  ["💍", "Сватання й весілля", "Коли майстерня розкрутиться (12 виробів, 13 рівень), прийдуть старости. Для весілля збери букет, торт, тістечка, солодощі й скриню з майстерні — список у «Подіях».", w => S.fam && S.fam.st >= 1],
  ["🏡", "Наша хата", "Після весілля обставляй хату виробами: світлиця, кухня, сіни, скарби, а згодом і дитяча. Кожна річ — +1 ⭐ і більший затишок; щодня в хаті чекає гостинець — монети й енергія.", w => S.fam && S.fam.st >= 2],
  ["👶", "Малюк", "Коли ти в майстерні, малюк раз на пів години-годину приносить тріску (іноді й брусок). Справжній помічник росте!", w => S.fam && S.fam.st >= 4]
);
