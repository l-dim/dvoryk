"use strict";
/* ============================================================
   ВІДБУДОВА СЕЛА 🏗️ — довгі спільні будови на тижні.
   Шість об'єктів по черзі; у кожного 4 етапи. Етап просить партії виробів (з городу, майстерні,
   хліва — з того, що вже маєш) і трохи монет. Вносиш потроху, коли є що віддати;
   щодня хтось із сусідів теж приносить одну річ. Етап готовий — нагорода; будова готова —
   велика нагорода й назавжди бонус для села.
   Стан: S.reb = { idx, stage, need:[{c,l,n,got}], coins, coinsGot, done:[id], next, helpDay, week }
   ============================================================ */
const REB_PROJECTS = [
  { id: "school", icon: "🏫", name: "Сільська школа", host: "iryna",
    stages: ["Фундамент", "Стіни", "Дах", "Класи й парти"],
    intro: "{name}, наша школа зовсім занепала: дах протікає, вікна позабивані дошками 😢 Діти їздять за десять кілометрів. Відбудуймо її всім селом?",
    done: "Дзвоник! 🔔 Наша школа знову відкрита — діти прибігли ще до світанку. Дякую тобі від усього села 💛",
    perk: "+10% досвіду за замовлення" },
  { id: "bridge", icon: "🌉", name: "Міст через річку", host: "stepan",
    stages: ["Опори", "Настил", "Поруччя", "Ліхтарі"],
    intro: "Старий міст ще навесні знесла повінь 🌊 Тепер на пошту й ярмарок — тільки в обхід, через сусіднє село. Збудуймо новий, міцний!",
    done: "Отакий міст — хоч на віки! 🌉 Тепер і пошта швидше ходитиме, і на ярмарок — рукою подати",
    perk: "посилки доходять удвічі швидше" },
  { id: "library", icon: "🏛️", name: "Бібліотека", host: "taras",
    stages: ["Стіни", "Дах", "Полиці", "Книжки й лампи"],
    intro: "{name}, у старій бібліотеці лишилось три полиці книжок і кіт 😄 А я мрію про читальню з фото нашого села. Допоможеш?",
    done: "Бібліотека відкрита! 📚 Я повісив твоє фото біля входу — хай усі знають, хто її відбудував",
    perk: "+2 полиці у сховок" },
  { id: "clinic", icon: "🏥", name: "Амбулаторія", host: "natalia",
    stages: ["Фундамент", "Стіни", "Кабінети", "Обладнання"],
    intro: "Я приймаю людей у старій хаті, де взимку холодно навіть мені 🩺 Збудуймо справжню амбулаторію — щоб ніхто не хворів!",
    done: "Тепер у нас справжня амбулаторія! 🏥 Цієї зими ніхто в селі не зляже — обіцяю",
    perk: "узимку сусіди не хворіють" },
  { id: "culture", icon: "🎭", name: "Будинок культури", host: "andriy",
    stages: ["Стіни", "Сцена", "Зала", "Завіса й світло"],
    intro: "{name}, де ж нам співати, танцювати й святкувати? Клуб стоїть без даху вже років десять. Відбудуємо — і щотижня вечорниці! 🎻",
    done: "Перші вечорниці — і зала повна! 🎭 Тепер щотижня свято, а тобі — подарунок від гурту",
    perk: "щотижня подарунок із вечорниць" },
  { id: "park", icon: "🛝", name: "Дитячий майданчик", host: "marichka",
    stages: ["Пісочниця", "Гойдалки", "Гірка", "Лавки й квіти"],
    intro: "А можна нам майданчик? 🥺 З гойдалками, гіркою і пісочницею! Тоді до нас і гості частіше приїжджатимуть!",
    done: "Ура-а-а! Найкращий майданчик у світі! 🛝 Тепер у нас гості ледь не щодня 😄",
    perk: "гості села приїжджають частіше" }
];
const REB_PAUSE_D = 2, REB_STAGE_COINS = [200, 350, 500, 800];
const REB_STAGE_REWARD = [{ stars: 3, coins: 150 }, { stars: 4, coins: 200, chest: 0 }, { stars: 5, coins: 300 }, { stars: 8, coins: 500, chest: 2 }];
const REB_ART = [];                                     // мальовані: reb-<id> — коли буде аркуш

if (typeof UNLOCKS !== "undefined") UNLOCKS.push({ id: "rebuild", lvl: 12, icon: "🏗️", title: "Відбудова села",
  text: "Усе село разом відбудовує школу, міст, бібліотеку, амбулаторію, будинок культури й дитячий майданчик. Вноси вироби й монети, сусіди теж допомагають щодня. Кожна збудована будівля назавжди дає селу бонус. Шукай у «Подіях».",
  lines: [["halya", "{name}, а давай не тільки свій дворик, а й усе село до ладу приведемо? 🏗️ Гуртом і батька легше бити 😄"]] });
if (typeof GUIDE_BASICS !== "undefined") GUIDE_BASICS.push(["🏗️", "Відбудова села",
  "У «Подіях» — спільна будова на тижні. Кожен етап просить партії виробів і монети: вноси потроху, коли маєш що віддати (з городу чи майстерні). Щодня хтось із сусідів теж щось приносить. Готова будівля дає назавжди бонус: досвід, швидша пошта, полиці, здоров'я сусідів, подарунки з вечорниць, частіші гості."]);

window.REB = (() => {
  const on = () => window.UNL && UNL.on("rebuild");
  const now = () => window.DVORYK_NOW || Date.now();
  const day = () => { const d = new Date(now()); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const st = () => (S.reb = S.reb || { idx: 0, stage: 0, need: null, coins: 0, coinsGot: 0, done: [], next: 0, helpDay: "", week: "" });
  const has = id => !!(S && S.reb && S.reb.done.includes(id));
  const proj = () => REB_PROJECTS[st().idx] || null;
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const mainB = () => S.main || S.board;
  const woodB = () => S.woodOn ? S.board : (S.wood && S.wood.board) || [];
  const boards = () => [mainB(), woodB()];
  const hm = ms => { const t = Math.max(0, Math.ceil(ms / 6e4)), h = Math.floor(t / 60); return h >= 24 ? Math.floor(h / 24) + " д " + (h % 24) + " год" : h ? h + " год " + (t % 60) + " хв" : (t % 60) + " хв"; };

  /* з чого будуємо: ланцюжки, генератори яких у тебе є */
  function chains() {
    const have = new Set();
    boards().forEach(b => b.forEach(x => { if (x && x.g && GENS[x.g] && !GENS[x.g].holiday) have.add(GENS[x.g].chain); }));
    return [...have].filter(c => CHAINS[c] && !CHAINS[c].nomerge && !CHAINS[c].collect && !CHAINS[c].open && c !== "mykolai" && !c.startsWith("hol_") && !c.startsWith("side_"));
  }
  function makeStage(stage) {
    const cs = chains().sort(() => Math.random() - 0.5);
    const lv = [3, 4, 4, 5][stage], n = [5, 4, 3, 2][stage];
    const need = cs.slice(0, Math.min(3, cs.length)).map((c, k) => {
      const len = CHAINS[c].items.length, l = Math.min(len - 1, lv - (k === 2 ? 1 : 0));
      return { c, l, n: k === 2 ? n + 2 : n, got: 0 };
    });
    return { need, coins: Math.round(REB_STAGE_COINS[stage] * (1 + st().idx * 0.25)) };
  }
  function startStage() {
    const s = st(), m = makeStage(s.stage);
    Object.assign(s, { need: m.need, coins: m.coins, coinsGot: 0 });
  }
  function startProject() {
    const s = st(), p = proj(); if (!p) return;
    Object.assign(s, { stage: 0, next: 0 }); startStage(); save();
    playDialog([[p.host, p.intro]], () => panel());
  }
  const stageDone = () => { const s = st(); return s.need && s.need.every(r => r.got >= r.n) && s.coinsGot >= s.coins; };

  function find(r) {
    for (const b of boards()) { const i = b.findIndex(x => x && !x.g && !x.lock && !x.st && x.c === r.c && x.l === r.l); if (i >= 0) return { b, i }; }
    return null;
  }
  const count = r => boards().reduce((a, b) => a + b.filter(x => x && !x.g && !x.lock && !x.st && x.c === r.c && x.l === r.l).length, 0);
  /* внести все, що є на дошках, для цієї вимоги */
  function give(k) {
    const s = st(), r = s.need[k]; if (!r || r.got >= r.n) return;
    let n = 0;
    while (r.got < r.n) { const f = find(r); if (!f) break; f.b[f.i] = null; r.got++; n++; }
    if (!n) { sfx.nope(); toast(`Спершу зроби ${itemIcon(r)} ${itemName(r)}`); return; }
    if (selected >= 0 && !S.board[selected]) selected = -1;
    sfx.deliver(); save(); renderAll(); toast(`🧱 Внесено на будову: ${itemIcon(r)} ×${n}`);
    after();
  }
  function pay() {
    const s = st(), left = s.coins - s.coinsGot; if (left <= 0) return;
    const n = Math.min(left, S.coins); if (n <= 0) { sfx.nope(); toast("Немає монет 🪙"); return; }
    S.coins -= n; s.coinsGot += n; sfx.coin(); save(); renderTop(); after();
  }
  function after() {
    if (!stageDone()) { panel(); return; }
    const s = st(), p = proj(), rw = REB_STAGE_REWARD[s.stage], parts = [];
    if (rw.stars) { S.stars += rw.stars; parts.push("+" + rw.stars + " ⭐"); }
    if (rw.coins) { S.coins += rw.coins; parts.push("+" + rw.coins + " 🪙"); }
    if (rw.chest !== undefined) { placeItem({ c: "chest", l: rw.chest }); parts.push(CHAINS.chest.items[rw.chest][0]); }
    confetti(); sfx.level();
    if (s.stage < 3) {
      const name = p.stages[s.stage]; s.stage++; startStage(); save(); renderAll();
      modal({ title: `${p.icon} ${name} — готово!`, html: `<div class="big-emoji">${p.icon}</div><p>${p.name}: етап ${s.stage} з 4 завершено.</p><p class="rewards">${parts.join(" &nbsp; ")}</p><p class="hint-s">Далі — «${p.stages[s.stage]}».</p>`, buttons: [{ label: "Будуємо далі! 🧱", onClick: panel }] });
      return;
    }
    // будову завершено
    s.done.push(p.id);
    if (p.id === "library") { S.store = S.store || { slots: typeof STORE_START !== "undefined" ? STORE_START : 3, items: [] }; S.store.slots += 2; }
    s.idx++; s.stage = 0; s.need = null; s.next = now() + REB_PAUSE_D * 864e5;
    save(); renderAll();
    playDialog([[p.host, p.done]], () => modal({ title: `${p.icon} ${p.name} збудовано!`, html: `<div class="big-emoji">${p.icon}</div><p class="rewards">${parts.join(" &nbsp; ")}</p><p>Бонус для села назавжди: <b>${p.perk}</b>.</p>` +
      (proj() ? `<p class="hint-s">Наступна будова — ${proj().icon} ${proj().name} — почнеться за ${REB_PAUSE_D} дні.</p>` : `<p class="hint-s">Усе село відбудоване! 💛</p>`), buttons: [{ label: "Ура! 🎉" }] }));
  }

  function tick() {
    if (!S || !S.started || !on() || busyUI()) return;
    const s = st();
    if (!proj()) return;
    if (!s.need) { if (now() >= (s.next || 0)) startProject(); return; }
    // щодня хтось із сусідів приносить одну річ
    if (s.helpDay !== day()) {
      s.helpDay = day();
      const open = s.need.filter(r => r.got < r.n);
      if (open.length) {
        const r = open[Math.floor(Math.random() * open.length)]; r.got++;
        const who = pick(["halya", "stepan", "olya", "ivan", "liza", "andriy", "taras", "iryna"].filter(k => CHARS[k] && (CHARS[k].from || 0) <= S.chapter));
        save(); setTimeout(() => toast(`🧱 ${CHARS[who].name} ${/[ая]$/.test(CHARS[who].name.split(" ").pop()) ? "принесла" : "приніс"} на будову ${itemIcon(r)} ${itemName(r)}`), 800);
        if (stageDone()) after();
      }
    }
    // вечорниці щотижня
    if (has("culture")) {
      const d = new Date(now()), wk = d.getFullYear() + "-" + Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 6048e5);
      if (s.week !== wk) { s.week = wk; placeItem({ c: "chest", l: 1 }); save(); setTimeout(() => toast("🎻 Вечорниці в будинку культури — тобі подарунок на дошці!"), 1200); }
    }
  }

  function panel() {
    const s = st(), p = proj();
    const doneList = s.done.map(id => { const q = REB_PROJECTS.find(x => x.id === id); return `<div class="wd-row done"><span class="wd-ava">${q.icon}</span><span class="wd-mid"><b>${q.name}</b><small>✅ ${q.perk}</small></span></div>`; }).join("");
    let body;
    if (!p) body = `<p><b>Усе село відбудоване! 💛</b></p>`;
    else if (!s.need) body = `<p>Наступна будова — <b>${p.icon} ${p.name}</b> — почнеться за <b>${hm(s.next - now())}</b>.</p>`;
    else {
      const total = s.need.reduce((a, r) => a + r.n, 0) + 1, got = s.need.reduce((a, r) => a + Math.min(r.got, r.n), 0) + (s.coinsGot >= s.coins ? 1 : s.coinsGot / s.coins);
      const rows = s.need.map((r, k) => {
        const ok = r.got >= r.n, have = count(r);
        return `<div class="wd-row${ok ? " done" : ""}"><span class="wd-ava">${itemIcon(r)}</span><span class="wd-mid"><b>${itemName(r)}</b><small>внесено ${Math.min(r.got, r.n)} з ${r.n}${ok ? "" : have ? ` · на дошці: ${have}` : ""}</small></span>` +
          (ok ? `<span class="wd-ok">✅</span>` : `<button class="s-btn reb-give${have ? "" : " dim"}" data-k="${k}">Внести</button>`) + `</div>`;
      }).join("");
      const cOk = s.coinsGot >= s.coins;
      const coins = `<div class="wd-row${cOk ? " done" : ""}"><span class="wd-ava">🪙</span><span class="wd-mid"><b>Монети на матеріали</b><small>внесено ${s.coinsGot} з ${s.coins}</small></span>` +
        (cOk ? `<span class="wd-ok">✅</span>` : `<button class="s-btn reb-pay${S.coins > 0 ? "" : " dim"}">Внести</button>`) + `</div>`;
      body = `<p class="dq-when">${p.icon} <b>${p.name}</b> · етап ${s.stage + 1} з 4: «${p.stages[s.stage]}»</p>` +
        `<div class="reb-bar"><b style="width:${Math.round(got / total * 100)}%"></b></div>` +
        `<div class="wd-list">${rows}${coins}</div><p class="hint-s">Вноси, що маєш, — потроху. Щодня хтось із сусідів теж щось приносить. Бонус після будови: <b>${p.perk}</b>.</p>`;
    }
    modal({ title: "Відбудова села 🏗️", html: body + (doneList ? `<p class="dq-when">Уже збудовано</p><div class="wd-list">${doneList}</div>` : ""), buttons: [{ label: "Готово", cls: "ghost" }] });
    document.querySelectorAll(".reb-give").forEach(b => b.onclick = () => give(+b.dataset.k));
    const pb = document.querySelector(".reb-pay"); if (pb) pb.onclick = pay;
  }

  function card() {
    if (!on()) return { icon: "🏗️", title: "Відбудова села", sub: `відкриється на ${window.PACE ? PACE.lvl("rebuild") : 12} рівні`, locked: true };
    const s = st(), p = proj();
    if (!p) return { icon: "🏘️", title: "Відбудова села", sub: "усе село відбудоване 💛", btn: "Відкрити", act: "reb" };
    if (!s.need) return { icon: p.icon, title: "Відбудова: " + p.name, sub: s.next ? "почнеться за " + hm(s.next - now()) : "скоро почнемо", btn: "Відкрити", act: "reb" };
    const ready = s.need.some(r => r.got < r.n && count(r) > 0);
    return { icon: p.icon, title: "Відбудова: " + p.name, sub: `етап ${s.stage + 1}/4 «${p.stages[s.stage]}»` + (ready ? " · є що внести!" : ""), btn: "Відкрити", act: "reb", ready };
  }
  return { tick, panel, card, has, give, pay, list: REB_PROJECTS };
})();

/* бонуси збудованого */
(() => {
  const _xp = gainXp;
  gainXp = function (n) { return _xp.call(this, window.REB && REB.has("school") ? Math.round(n * 1.1) : n); };
})();
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => REB.card()]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { reb: () => REB.panel() });
