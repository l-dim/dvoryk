"use strict";
/* ============================================================
   ПРОФІЛЬ 👤 · ПОШТА 📮 · КАЛЕНДАР ВХОДІВ 📅 · ВИКЛИК ЕНЕРГІЇ ⚡
   (з запису: «Мой профиль», «Почта», «Вход в игру: 6 дн.», «Вызов энергии»)
   Стан: S.ava — аватарка; S.mail = [{ id, from, title, text, gift, at, read, got }], S.mailDay
         S.login = { day, n (днів поспіль у тижні 1…7) }
         S.ech = { id (номер триденки), base: { лічильники на старті }, got: [індекси забраних] }
   ============================================================ */
const AVATARS = ["👩‍🌾", "🧑‍🌾", "👩", "👩‍🦰", "👱‍♀️", "👩‍🍳", "👵", "👧", "🐱", "🌻"];

window.PROFILE = (() => {
  const stat = k => (S.stat && S.stat[k]) || 0;
  function avatar() { return window.HERO ? HERO.emoji() : S.ava || "👩‍🌾"; }
  function open() {
    const need = xpNeed(S.level), days = Math.max(1, Math.ceil((Date.now() - (S.created || Date.now())) / 864e5));
    const cards = window.ALB ? ALB.haveN() : 0, medals = window.MEDAL ? MEDAL.total() : 0;
    const wins = S.ctWins || {}, troph = S.trophies || [];
    const stats = [
      ["🧺", tt`Замовлень`, S.ordersDone], ["✨", tt`Злиттів`, S.merges], ["🏅", tt`Медалей`, medals],
      ["💌", tt`Листівок`, cards], ["🏆", tt`Призових місць`, (wins[1] || 0) + (wins[2] || 0) + (wins[3] || 0)], ["📅", tt`Днів у грі`, days]
    ].map(([i, n, v]) => `<div class="pf-st"><span>${i}</span><b>${v}</b><small>${n}</small></div>`).join("");
    modal({ title: tt`Мій профіль`,
      html: tt`<div class="pf-top"><button class="pf-ava" id="pfAva">${window.HERO ? HERO.faceHtml(null, "big") : avatar()}<i>змінити</i></button>` +
        tt`<div class="pf-mid"><input id="pfName" value="${(S.name || "").replace(/"/g, "&quot;")}" maxlength="20" placeholder="Твоє ім'я">` +
        `<div class="pf-lvl"><span>${S.level}</span><i class="dq-bar"><b style="width:${S.xp / need * 100}%"></b></i><small>${S.xp}/${need}</small></div></div></div>` +
        `<div class="pf-stats">${stats}</div>` +
        (troph.length || wins[1] ? tt`<div class="pf-tr"><small>Трофеї у дворику</small><div>${troph.join(" ")}${wins[1] ? " " + "🥇".repeat(Math.min(5, wins[1])) : ""}</div></div>` : "") +
        (window.PHOTO ? tt`<button class="pf-album" id="pfAlbum"><span>📷</span><span class="pfa-t"><b>Фотоальбом дворика</b><small>${PHOTO.count()} фото${PHOTO.missing() ? tt` · ще ` + PHOTO.missing() + tt` розділів можна сфотографувати` : ""}</small></span><i>›</i></button>` : "") +
        tt`<div class="pf-btns"><button class="btn small ghost" id="pfSet">⚙️ Налаштування</button><button class="btn small ghost" id="pfSave">💾 Зберегти прогрес</button><button class="btn small ghost" id="pfGuide">📖 Довідник</button></div>`,
      buttons: [{ label: tt`Готово`, onClick: saveName }] });
    $("pfAva").onclick = () => { saveName(); window.HERO ? HERO.picker(open) : pickAvatar(); };
    $("pfSet").onclick = () => { saveName(); openSettings(); };
    $("pfSave").onclick = () => { saveName(); showExport(); };
    $("pfGuide").onclick = () => { saveName(); GUIDE.open(); };
    const al = $("pfAlbum"); if (al) al.onclick = () => { saveName(); PHOTO.album(); };
  }
  function saveName() { const i = $("pfName"); if (i) { S.name = i.value.trim(); save(); } }
  function pickAvatar() {
    modal({ title: tt`Обери аватарку`, html: `<div class="pf-avas">${AVATARS.map(a => `<button class="pf-a${a === avatar() ? " on" : ""}">${a}</button>`).join("")}</div>`,
      buttons: [{ label: tt`Назад`, cls: "ghost", onClick: open }] });
    document.querySelectorAll(".pf-a").forEach((b, k) => b.onclick = () => { S.ava = AVATARS[k]; save(); renderAva(); sfx.pop(); open(); });
  }
  function renderAva() { if (window.HERO) { HERO.render(); return; } const el = $("lvlAva"); if (el) el.textContent = avatar(); }
  return { open, renderAva, avatar };
})();

/* ============================================================ */
const MAIL_MAX = 12;
const MAIL_LETTERS = [
  ["halya", tt`Пиріжки з печі 🥧`, tt`{name}, напекла пиріжків — бери, поки теплі! І не забувай відпочивати, а то все в роботі та в роботі 💛`],
  ["stepan", tt`Насіння на весну 🌱`, tt`Відібрав тобі найкраще насіння. Посадиш — побачиш, яка морква виросте! Мені ще мій дід такого насіння давав.`],
  ["olya", tt`Мед від бджілок 🍯`, tt`Мої бджілки цього тижня розстаралися! Відливаю тобі баночку — на здоров'я.`],
  ["marichka", tt`Малюнок для тебе 🎨`, tt`Я намалювала наш дворик! Там ти, бабуся Галя і котик Пиріжок. Повісь на стіну, будь ласка 🥰`],
  ["andriy", tt`Рецепт від кухаря 👨‍🍳`, tt`Записав тобі секрет моїх вареників: тісто на кефірі, і ліпити з любов'ю. Решта — дрібниці 😉`],
  ["ivan", tt`Листівка з району 📮`, tt`Розношу пошту — бачу, тобі листівка. А до неї я ще дещо від себе доклав 😊`],
  ["liza", tt`Дякую за все 💛`, tt`Ти так допомагаєш усім у селі… Хочу, щоб ти знала: ми тебе дуже цінуємо!`],
  ["taras", tt`Фото на згадку 📸`, tt`Проявив плівку — вийшов чудовий кадр з тобою біля паркану. Тримай!`],
  ["iryna", tt`Від учнів 📚`, tt`Мої учні зробили для тебе подарунок на уроці праці. Вони дуже старалися!`],
  ["cat", tt`Мяу 🐾`, tt`(У конверті — кілька котячих шерстинок і… щось блискуче. Пиріжок явно щось знайшов і вирішив поділитися.)`],
  ["halya", tt`Чай на травах 🍵`, tt`Зібрала м'яти й чебрецю — заваришся ввечері, і сон буде солодкий.`],
  ["stepan", tt`Про погоду 🌦️`, tt`Кажуть, завтра буде дощ. Значить, гриби полізуть! Не пропусти 🍄`],
  ["olya", tt`Квіточки 🌷`, tt`Розсадила тюльпани й лишилося кілька цибулинок — бери, посадиш біля ґанку.`],
  ["andriy", tt`Смаколик ☕`, tt`Заходь на каву, як буде хвилинка. А поки — ось тобі гостинчик.`]
];
const MAIL_GIFTS = [{ chest: 0 }, { energy: 5 }, { coins: 60 }, { ing: 2 }, { cards: 1 }, { stars: 1 }, { energy: 8 }, { coins: 100 }, { thread: 5 }];

window.MAIL = (() => {
  const on = () => window.UNL && UNL.on("mail");
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const list = () => (S.mail || (S.mail = []));
  const unread = () => list().filter(m => !m.got).length;
  function send(from, title, text, gift) {
    list().unshift({ id: Date.now() + rnd(1000), from, title, text, gift, at: Date.now(), got: false });
    S.mail = list().slice(0, MAIL_MAX);
    save(); render();
  }
  function giftText(g) {
    if (!g) return "";
    const p = [];
    if (g.chest !== undefined) p.push(CHAINS.chest.items[g.chest][0]);
    if (g.energy) p.push("+" + g.energy + " ⚡"); if (g.coins) p.push("+" + g.coins + " 🪙"); if (g.stars) p.push("+" + g.stars + " ⭐");
    if (g.ing) p.push(g.ing + " 🧺"); if (g.cards) p.push(g.cards + " 💌"); if (g.thread) p.push(g.thread + " 🪢");
    return p.join(" ");
  }
  function giftOk(g) { return !((g.ing && !(window.UNL && UNL.on("contest"))) || (g.cards && !(window.UNL && UNL.on("album"))) || (g.thread && !(window.UNL && UNL.on("fashion")))); }
  function take(id, quiet) {
    const m = list().find(x => x.id === id); if (!m || m.got) return;
    m.got = true;
    const g = m.gift || {};
    if (g.chest !== undefined) placeItem({ c: "chest", l: g.chest });
    if (g.energy) { regen(); S.energy += g.energy; }
    if (g.coins) S.coins += g.coins; if (g.stars) S.stars += g.stars;
    if (g.ing && window.CONTEST) CONTEST.give(g.ing, null, 1, tt`З листа`);
    if (g.cards && window.ALB) ALB.give(g.cards);
    if (g.thread && window.FASH) FASH.add(g.thread);
    save(); if (quiet) return giftText(g);
    renderAll(); render(); sfx.coin();
    if (giftText(g)) toast("📮 " + giftText(g));
    panel();
  }
  function openLetter(id) {
    const m = list().find(x => x.id === id); if (!m) return;
    const ch = CHARS[m.from] || CHARS.ivan;
    modal({ title: m.title,
      html: `<div class="ml-letter"><div class="ml-from">${face(ch, "mini")}<b>${ch.name}</b></div><p>${fmtName(m.text)}</p>` +
        (m.gift && giftText(m.gift) ? `<div class="ml-gift">${m.got ? tt`Подарунок забрано ✓` : tt`🎁 У конверті: ` + giftText(m.gift)}</div>` : "") + `</div>`,
      buttons: m.got || !giftText(m.gift) ? [{ label: tt`До пошти`, cls: "ghost", onClick: () => { m.got = true; save(); render(); panel(); } }]
        : [{ label: tt`Забрати 💛`, onClick: () => take(id) }, { label: tt`Пізніше`, cls: "ghost", onClick: panel }] });
  }
  function panel() {
    const rows = list().map(m => { const ch = CHARS[m.from] || CHARS.ivan;
      return `<button class="ml-row${m.got ? " got" : ""}" data-id="${m.id}"><span class="ml-ava">${face(ch, "mini")}</span><span class="ml-mid"><b>${m.title}</b><small>${ch.name}</small></span><span class="ml-st">${m.got ? "✉️" : "🎁"}</span></button>`; }).join("");
    modal({ title: tt`Пошта 📮`, html: rows ? `<div class="ml-list">${rows}</div>` : tt`<div class="big-emoji">📭</div><p>Поштова скринька порожня. Листоноша Іван приходить щодня 📮</p>`,
      buttons: [...(unread() > 1 ? [{ label: tt`Забрати все 🎁`, onClick: takeAll }] : []), { label: tt`Закрити`, cls: "ghost" }] });
    document.querySelectorAll(".ml-row").forEach(b => b.onclick = () => openLetter(+b.dataset.id));
  }
  function takeAll() {
    const got = list().filter(m => !m.got).map(m => take(m.id, true)).filter(Boolean);
    renderAll(); render(); sfx.coin(); confetti();
    toast(tt`📮 Забрано подарунків: ` + got.length);
  }
  function render() {
    const b = $("mailBtn"); if (!b) return;
    b.hidden = !on();
    const g = $("settingsBtn"); if (g) g.hidden = on();      // налаштування тоді — у профілі
    const n = unread(), i = b.querySelector("i");
    i.textContent = n; i.hidden = !n;
    b.classList.toggle("has", !!n);
  }
  /* щодня — лист від когось із сусідів */
  function tick() {
    if (!on() || !S.started) return;
    if (S.mailDay === today()) return;
    S.mailDay = today();
    const known = MAIL_LETTERS.filter(([w]) => CHARS[w] && (CHARS[w].from || 0) <= S.chapter && !(window.WD && WD.isSick(w)));
    const [from, title, text] = pick(known.length ? known : MAIL_LETTERS);
    let g = pick(MAIL_GIFTS); let tries = 0; while (!giftOk(g) && tries++ < 8) g = pick(MAIL_GIFTS);
    send(from, title, text, giftOk(g) ? g : { coins: 60 });
    setTimeout(() => toast(tt`📮 Тобі лист! Листоноша Іван уже біля хвіртки`), 2500);
  }
  return { send, panel, render, tick, unread };
})();

/* ============================================================ */
/* КАЛЕНДАР ВХОДІВ: 7 днів поспіль — щодня подарунок, 7-й — найбільший */
const LOGIN_REWARDS = [
  { energy: 8 }, { chest: 0, energy: 5 }, { coins: 80, energy: 5 }, { energy: 10 },
  { chest: 1, energy: 5 }, { stars: 2, energy: 5 }, { chest: 2, energy: 12, coins: 150 }
];
window.LOGIN = (() => {
  const rText = r => [r.chest !== undefined ? CHAINS.chest.items[r.chest][0] : "", r.energy ? "+" + r.energy + "⚡" : "", r.coins ? "+" + r.coins + "🪙" : "", r.stars ? "+" + r.stars + "⭐" : ""].filter(Boolean).join(" ");
  /* викликається з checkDaily: streak — день поспіль (1, 2, …) */
  function show(streak, onDone) {
    const n = ((streak - 1) % 7) + 1, r = LOGIN_REWARDS[n - 1];
    if (r.chest !== undefined) placeItem({ c: "chest", l: r.chest });
    if (r.energy) { regen(); S.energy += r.energy; }
    if (r.coins) S.coins += r.coins; if (r.stars) S.stars += r.stars;
    save();
    const days = LOGIN_REWARDS.map((x, k) => tt`<div class="lg-d${k < n - 1 ? " got" : k === n - 1 ? " now" : ""}${k === 6 ? " big" : ""}"><small>День ${k + 1}</small>` +
      `<span>${k < n - 1 ? "✅" : x.chest !== undefined ? CHAINS.chest.items[x.chest][0] : x.stars ? "⭐" : x.coins ? "🪙" : "⚡"}</span></div>`).join("");
    modal({ title: tt`Щоденний подарунок 📅`,
      html: tt`<div class="lg-row">${days}</div><p>День ${n} з 7${n === 7 ? tt` — найбільший подарунок тижня! 💝` : ""}</p><p class="rewards">${rText(r)}</p>` +
        `<p class="hint-s">${n < 7 ? tt`Заходь щодня — сьомого дня чекає скриня-сюрприз 💝` : tt`Завтра календар почнеться знову 🌱`}</p>`,
      buttons: [{ label: tt`Забрати 💛`, onClick: () => { renderAll(); onDone && onDone(); } }] });
  }
  return { show };
})();

/* ============================================================ */
/* ВИКЛИК ЕНЕРГІЇ: кожні 3 дні — 4 завдання, за кожне — енергія (як «Вызов энергии», тільки безкоштовно) */
const ECH_ROUND = 3 * 864e5, ECH_EPOCH = new Date(2026, 0, 3, 6).getTime();
const ECH_TASKS = [
  { k: "deliver", icon: "🧺", text: tt`Віддай замовлень`, base: 15, energy: 10 },
  { k: "merge",   icon: "✨", text: tt`Зроби злиттів`,     base: 120, energy: 10 },
  { k: "chest",   icon: "🎁", text: tt`Відкрий подарунків`, base: 10, energy: 12 },
  { k: "tap",     icon: "🪴", text: tt`Тапни генератори`,  base: 200, energy: 15 }
];
window.ECH = (() => {
  const on = () => window.UNL && UNL.on("ech");
  const rid = () => Math.floor((Date.now() - ECH_EPOCH) / ECH_ROUND);
  const cnt = k => k === "deliver" ? S.ordersDone : k === "merge" ? S.merges : (S.stat && S.stat[k]) || 0;
  const target = t => Math.round(t.base * (1 + Math.min(1, S.level / 25)));
  function st() {
    if (!S.ech || S.ech.id !== rid()) { S.ech = { id: rid(), base: Object.fromEntries(ECH_TASKS.map(t => [t.k, cnt(t.k)])), got: [], tg: ECH_TASKS.map(target) }; save(); }
    return S.ech;
  }
  const prog = (e, i) => Math.min(e.tg[i], cnt(ECH_TASKS[i].k) - e.base[ECH_TASKS[i].k]);
  const can = (e, i) => !e.got.includes(i) && prog(e, i) >= e.tg[i];
  const ready = () => on() && (() => { const e = st(); return ECH_TASKS.some((_, i) => can(e, i)); })();
  function left() { const ms = ECH_EPOCH + (rid() + 1) * ECH_ROUND - Date.now(), h = Math.floor(ms / 36e5); return h >= 24 ? Math.floor(h / 24) + tt` д ` + (h % 24) + tt` год` : h + tt` год`; }
  function claim(i) {
    const e = st(); if (!can(e, i)) return;
    e.got.push(i); regen(); S.energy += ECH_TASKS[i].energy;
    save(); renderTop(); sfx.coin(); flyMany($("energyChip").getBoundingClientRect(), "⚡", "energy", 4);
    toast(tt`⚡ +${ECH_TASKS[i].energy} енергії!`);
    panel();
  }
  function panel() {
    const e = st();
    const rows = ECH_TASKS.map((t, i) => { const p = prog(e, i), g = e.got.includes(i), c = can(e, i);
      return `<div class="ec-row${g ? " got" : c ? " can" : ""}"><span class="ec-ic">${t.icon}</span><span class="ec-mid"><b>${t.text}: ${e.tg[i]}</b>` +
        `<i class="dq-bar"><b style="width:${p / e.tg[i] * 100}%"></b></i><small>${p}/${e.tg[i]}</small></span>` +
        (g ? `<span class="ec-ok">✅</span>` : `<button class="s-btn ec-go${c ? "" : " dim"}" data-i="${i}">+${t.energy} ⚡</button>`) + `</div>`; }).join("");
    const sum = ECH_TASKS.reduce((a, t) => a + t.energy, 0);
    modal({ title: tt`Виклик енергії ⚡`, html: tt`<p class="dq-when">До нового виклику: <b>${left()}</b> · разом до <b>${sum} ⚡</b></p><div class="ec-list">${rows}</div><p class="hint-s">Тут усе безкоштовно — енергію заробляєш грою 💛</p>`,
      buttons: [{ label: tt`Закрити`, cls: "ghost" }] });
    document.querySelectorAll(".ec-go").forEach(b => b.onclick = () => claim(+b.dataset.i));
  }
  function card() {
    if (!on()) return null;
    const e = st(), done = e.got.length;
    return { icon: "⚡", title: tt`Виклик енергії`, sub: ready() ? tt`Є енергія — забирай!` : tt`${done}/4 завдань · ще ${left()}`, btn: tt`Відкрити`, act: "ech", ready: ready() };
  }
  return { panel, card, ready };
})();
