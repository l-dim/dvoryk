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
const FAM_WED_DAYS = 3, BABY_WAIT_H = 30 * 24, BABY_AFTER_WED_D = 14, BABY_NEED_SLOTS = 10;   // новина — через 2 тижні після весілля; чекаємо місяць
/* поки чекаємо малюка — щотижня хтось із сусідів навідується з гостинцем */
const BABY_VISITS = [
  ["halya", "я вам пелюшок нашила — вишиваних, як годиться 🧵 І ось вам енергії, бережіть себе!", 20, 100],
  ["olya", "принесла дитячих книжечок і пиріжків — їжте, вам тепер за двох 😄", 25, 150],
  ["marichka", "сплела маленький віночок-оберіг на колиску 🌼", 30, 200],
  ["stepan", "колиску вже пробували гойдати? Ото ж! А це від нас із бабою — на дитячу 🪵", 40, 300]
];
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
/* вік: 0 — немовля (2 тижні, лише в колисці), 1 — малюк ~1 рік (до 6 тижнів), 2 — дитина ~4 роки */
const KID_AGE_D = [14, 42];
const KID_HELP = [null, { min: [25, 45], up: 0.2, up2: 0 }, { min: [15, 30], up: 0.35, up2: 0.05 }];
const KID_ART = [];   // portraits/kid-girl-1, kid-girl-2, kid-boy-1, kid-boy-2 — коли буде картинка

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
      if (room === "Дитяча" && f.st < 3) return `<div class="fm-room"><div class="fm-rh">${room} <small>🔒 колись знадобиться 😉</small></div></div>`;
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
    ], () => { renderHub(); toast("👶 Малюк з'явиться десь за місяць — а поки готуйте дитячу в «Нашій хаті»!"); });
  }
  function born() {
    modal({ title: "Народився малюк! 👶",
      html: `<div class="big-emoji">👶</div><p>Усе село прибігло вітати! Хто ж у нас?</p>`,
      buttons: [{ label: "👧 Донечка", onClick: () => setTimeout(() => nameIt("girl"), 50) }, { label: "👦 Синочок", onClick: () => setTimeout(() => nameIt("boy"), 50) }] });
  }
  function nameIt(sex) {
    const opts = BABY_NAMES[sex];
    modal({ title: sex === "girl" ? "Донечка! 👧" : "Синочок! 👦",
      html: `<div class="big-emoji">👶</div><p>Як назвемо?</p><div class="fm-names">${opts.map(n => `<button class="s-btn ghost fm-nm" data-n="${n}">${n}</button>`).join("")}</div><input id="fmName" class="fm-in" maxlength="16" placeholder="або своє ім'я…">`,
      buttons: [{ label: "Так і назвемо 💛", onClick: () => { const v = ($("fmName").value || "").trim(); finishBorn(v || opts[0], sex); } }] });
    document.querySelectorAll(".fm-nm").forEach(b => b.onclick = () => { $("fmName").value = b.dataset.n; });
  }
  function finishBorn(name, sex) {
    const f = st(); f.st = 4; f.baby = { name, sex, born: now(), age: 0 }; save();
    S.energy += 30; confetti(); sfx.level(); renderAll();
    playDialog([
      ["ivan", `Вітаю! ${name} — найгарніше ім'я в селі! 🍼`],
      [who(), `${sex === "girl" ? "Яка вона крихітна" : "Який він крихітний"}… 🥹 Підросте — буде в майстерні помагати, побачиш! А поки — колиска й колискові 💛`]
    ], () => toast(`👶 ${name} підростатиме: за 2 тижні почне повзати й носити тріски в майстерню`));
  }
  /* малюк «допомагає»: приносить тріску на дошку майстерні */
  function babyHelp() {
    const f = st(), b = wboard(), h = KID_HELP[age()]; if (!b || !S.woodOn || !h) return;      // допомагає, коли ти в майстерні й уже не немовля
    const free = b.map((x, i) => (!x && (typeof cellOpen !== "function" || cellOpen(i)) ? i : -1)).filter(i => i >= 0);
    f.babyNext = now() + (h.min[0] + Math.random() * (h.min[1] - h.min[0])) * 60e3;
    if (!free.length) { save(); return; }
    const r = Math.random(), lv = r < h.up2 ? 2 : r < h.up ? 1 : 0;
    const near = b.findIndex(x => x && x.g === "w_wood"), j = placeItem({ c: "wood", l: lv }, near >= 0 ? near : undefined);
    if (j >= 0) { popIdx.add(j); sparkle(j, "👶", 5); } renderBoard();
    save();
    toast(`${kidIcon()} ${f.baby.name} приносить ${lv === 2 ? "дошки! 🪜" : lv === 1 ? "брусок! 🟫" : "тріску! 🪵"}`);
  }
  /* вік малюка й підростання */
  function age() { const k = S.fam && S.fam.baby; if (!k) return -1; const d = (now() - k.born) / 864e5; return d < KID_AGE_D[0] ? 0 : d < KID_AGE_D[1] ? 1 : 2; }
  const kidSex = () => { const k = S.fam.baby; return k.sex || (BABY_NAMES.boy.includes(k.name) ? "boy" : "girl"); };
  const kidIcon = () => age() <= 0 ? "👶" : kidSex() === "girl" ? "👧" : "👦";
  const AGE_NAMES = ["немовля", "повзає й лепече", "бігає й помагає"];
  function grow() {
    const k = S.fam.baby, a = age(); if (k.age === a) return false;
    const was = k.age || 0; k.age = a; f0next(); save();
    if (a > was) {
      const lines = a === 1 ? [[who(), `{name}, дивись! ${k.name} вже повзає — і тягне в рот кожну стружку 😄 Візьмімо в майстерню — хай подає тріски.`], ["halya", "Ой, як швидко ростуть! Ще вчора в колисці лежало 🥹"]]
        : [[who(), `${k.name} сьогодні ${kidSex() === "girl" ? "сама принесла" : "сам приніс"} цілий оберемок трісок! І навіть брусок 🪵 Справжній помічник!`], ["stepan", "Майстер росте! Скоро й рубанок тримати навчиться 👏"]];
      playDialog(lines, () => { renderAll(); toast(`${kidIcon()} ${k.name} — ${AGE_NAMES[a]}`); });
      return true;
    }
    return false;
  }
  function f0next() { const f = S.fam, h = KID_HELP[age()]; if (h && (!f.babyNext || f.babyNext < now())) f.babyNext = now() + h.min[0] * 60e3; }

  /* ---------- дворик ---------- */
  function yard(ch) {
    const out = [], f = S.fam;
    if (!f) return out;
    if (wedding()) out.push(
      { key: "wd-arch", e: "💒", x: 50, y: 62, s: 12 }, { key: "wd-table", e: "🍽️", x: 30, y: 60, s: 11 },
      { key: "wd-ball1", e: "🎈", x: 18, y: 40, s: 6 }, { key: "wd-ball2", e: "🎈", x: 82, y: 40, s: 6 },
      { key: "wd-notes", e: "🎶", x: 66, y: 30, s: 5 }, { key: "wd-hearts", e: "💕", x: 40, y: 30, s: 5 }, { key: "wd-cake", e: "🎂", x: 30, y: 54, s: 5 });
    if (f.baby) {
      const a = age(), id = `kid-${kidSex()}-${a}`;
      if (a > 0 && KID_ART.includes(id)) out.push({ key: "kid-" + id, who: id, x: 58, y: 90, s: a === 1 ? 3.5 : 5 });
      else out.push({ key: "kid-" + a, e: a === 0 ? "👶" : kidSex() === "girl" ? "👧" : "👦", x: 58, y: 90, s: a === 0 ? 5 : 6 });
    }
    return out;
  }

  /* ---------- плин ---------- */
  function tick() {
    if (!S || !S.started || busyUI() || S.sideOn && !S.woodOn || !window.LOVE || !LOVE.together() || !S.wood) return;
    const f = st();
    if (f.st === 0 && S.wood.done >= 12 && S.level >= 13) { matchmaking(); return; }
    if (f.st === 2 && now() - f.wedAt >= BABY_AFTER_WED_D * 864e5 && filled() >= BABY_NEED_SLOTS) { expecting(); return; }
    if (f.st === 3 && now() >= f.babyAt) { born(); return; }
    if (f.st === 3) { const wk = Math.floor((now() - (f.babyAt - BABY_WAIT_H * 3600e3)) / (7 * 864e5)), v = BABY_VISITS[wk - 1];
      if (wk >= 1 && v && (f.visits || 0) < wk) { f.visits = wk; S.energy += v[2]; S.coins += v[3]; save(); renderTop();
        playDialog([[v[0], `{name}, ${v[1]}`]], () => toast(`🎁 Гостинець для малюка: +${v[2]} ⚡ +${v[3]} 🪙`)); return; } }
    if (f.st === 4 && f.baby && grow()) return;
    if (f.st === 4 && f.baby && f.babyNext && now() >= f.babyNext) babyHelp();
    if (wedding() !== lastWed) { lastWed = wedding(); if (typeof renderStory === "function") renderStory(); }
  }
  let lastWed = null;
  function renderHub() { if (typeof renderAll === "function") renderAll(); }
  function card() {
    const f = S.fam; if (!f || !f.st) return null;
    if (f.st === 1) { const d = f.need.filter(n => n.done).length; return { icon: "💍", title: "Готуємось до весілля", sub: `зібрано ${d} з ${f.need.length}: ${f.need.map(n => n.done ? "✅" : itemIcon(n)).join(" ")}`, btn: "Відкрити", act: "fam-prep", ready: f.need.some(n => !n.done && findOn(n.c, n.l) >= 0) }; }
    const n = filled(), gift = n > 0 && f.giftDay !== new Date(now()).toDateString();
    const left = f.babyAt - now(), dd = Math.ceil(left / 864e5);
    const sub = f.st === 3 ? `чекаємо малюка 👶 ще ${left > 2 * 864e5 ? dd + " дн." : Math.max(1, Math.ceil(left / 3600e3)) + " год"} · готуй дитячу · затишок ${n}` :
      f.st === 4 ? `${kidIcon()} ${f.baby.name} — ${AGE_NAMES[Math.max(0, age())]}${age() === 0 ? ` (ще ${Math.ceil((f.baby.born + KID_AGE_D[0] * 864e5 - now()) / 864e5)} дн.)` : ""} · затишок ${n}${gift ? " · є гостинець!" : ""}` :
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
  ["👶", "Малюк", "Через 2 тижні після весілля, коли в хаті стоятиме 10 речей, — новина про малюка; ще місяць чекання (сусіди щотижня навідуються з гостинцями, а дитячу можна готувати заздалегідь). Малюк підростає: перші 2 тижні лише в колисці; потім повзає й раз на пів години-годину приносить у майстерню тріску; а з 6 тижнів бігає — приносить частіше, іноді брусок чи дошки. Помагає, коли ти в майстерні.", w => S.fam && S.fam.st >= 4]
);
