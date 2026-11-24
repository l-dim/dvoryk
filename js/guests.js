"use strict";
/* ============================================================
   ГОСТІ СЕЛА 🧳 — раз на 3–7 днів хтось приїздить на 2–3 дні.
   Гість стоїть у дворику, робить свої замовлення (3 штуки — і він задоволений),
   а на прощання дарує щось своє. Не встигли — поїде без подарунка.
   Вигляд: на свята — святковий, з грудня по лютий — зимовий, решту часу — звичайний.
   Стан: S.guest = { id, until, n, need }, S.guestNext (коли наступний), S.guestLast, S.guestsMet = { id: разів }
   ============================================================ */
const GUEST_GAP_D = [3, 7], GUEST_STAY_H = [48, 72], GUEST_NEED = 3, GUEST_FIRST_MIN = 20;
const GUESTS_LIST = [
  { id: "bohdan", icon: "🧔", name: tt`Коваль Богдан`, face: [52, 22, 250],
    arrive: [["bohdan", tt`Доброго здоров'я, {name}! Я — Богдан, коваль із сусіднього села 🔨 Кую підкови, а апетит у мене — як ковадло: великий!`],
             ["bohdan", tt`Побуду у вас кілька днів — підгодуєте коваля? А я віддячу, як ніхто`]],
    ask: [tt`Коваль без обіду — що кузня без вогню 🔥`, tt`Мені б підкріпитися перед роботою`, tt`Допоможеш ковалеві?`],
    thanks: [tt`Оце сила! Тепер хоч дві підкови за раз 🔨`, tt`Дякую щиро — на щастя тобі!`, tt`Смачно, як у мами!`],
    bye: tt`Спасибі за гостину! На прощання — кована скриня, а в ній дещо цінне 🔨💛`, gift: { chest: 2 } },
  { id: "natalia", f: true, icon: "👩‍⚕️", name: tt`Фельдшерка Наталя`, face: [55, 20, 260],
    arrive: [["natalia", tt`Добрий день! Я — Наталя, нова фельдшерка 🩺 Обходжу село, знайомлюся з усіма`],
             ["natalia", tt`Кажуть, у вас найсмачніше в окрузі. Поділитеся? А я подбаю про здоров'я сусідів 💛`]],
    ask: [tt`Від цього ще й імунітет кріпне 😉`, tt`Мені б вітамінчиків — свіжих!`, tt`Це для хворого сусіда`],
    thanks: [tt`Ліки — ліками, а це — найкраще 💛`, tt`Дякую! Будьте здорові!`, tt`Саме те, що лікар прописав 😄`],
    bye: tt`Дякую за поміч! Усіх, хто прихворів, я вже вилікувала, а тобі — вітамінки на силу ⚡`, gift: { cure: true, energy: 20, coins: 100 } },
  { id: "vasyl", icon: "👨‍🌾", name: tt`Вівчар Василь`, face: [48, 30, 250],
    arrive: [["vasyl", tt`Добрий день у хату! Я — Василь, вівчар із полонини ⛰️ Гнав отару на ярмарок, та й заблукав до вас 😄`],
             ["vasyl", tt`Перебуду кілька днів, поки вівці відпочинуть? А за гостину — віддячу по-гуцульськи!`]],
    ask: [tt`У горах такого не скуштуєш!`, tt`Мені б у дорогу, на полонину`, tt`Вівці чекають, а я — голодний 😄`],
    thanks: [tt`Файно! Дякую красно 🐑`, tt`Аж трембіта в душі заграла!`, tt`Добрі в тебе руки!`],
    bye: tt`Дякую за гостину! Лишаю тобі ягнятко — хай пасеться в дворику 🐑 А будеш у горах — заходь до колиби!`, gift: { decor: "🐑", coins: 150 } },
  { id: "yaroslav", icon: "🧑‍💻", name: tt`Ярослав`, face: [47, 22, 260],
    arrive: [["yaroslav", tt`Привіт! Я Ярослав, переїхав із міста — працюю віддалено, а тепер ось вирішив і город садити 🌱`],
             ["yaroslav", tt`Тільки я ще не дуже розумію, що робити 😅 Допоможеш перші дні? Я швидко вчуся!`]],
    ask: [tt`Це для відео в мій блог про село 📱`, tt`Я гуглив — кажуть, це смачно!`, tt`Мені б для натхнення 😅`],
    thanks: [tt`Вау! Сфоткаю й викладу 📸`, tt`Дякую! Це краще за будь-яку доставку`, tt`Тепер я розумію, чому всі сюди переїжджають`],
    bye: tt`Дякую за науку! На прощання змайстрував тобі полицю у сховок — за відеоуроком, але міцну! 🗄️`, gift: { store: 1, coins: 100 } },
  { id: "vira", f: true, icon: "👩‍🦱", name: tt`Тітка Віра`, face: [52, 28, 220],
    arrive: [["vira", tt`Ой, дитинко, здрастуй! Я — Віра, на всіх ярмарках у районі торгую 🧺 Чула, у вас тут таке родить — аж завидно!`],
             ["vira", tt`Побуду кілька днів, закуплю товару. Плачу чесно — ще й з надбавкою!`]],
    ask: [tt`Беру, не торгуючись!`, tt`Мені б на ярмарок — розхапають!`, tt`Скільки маєш — усе заберу!`],
    thanks: [tt`От спасибі! Продам — ще приїду 😄`, tt`Товар — перший сорт!`, tt`Тримай, і ще трохи зверху!`],
    bye: tt`Розторгувалась я як ніколи! Тримай свою частку з виручки 💰`, gift: { coins: 400 } },
  { id: "petryk", icon: "👦", name: tt`Петрик`, face: [55, 28, 250],
    arrive: [["petryk", tt`Привіт! Я Петрик, онук баби Галі 😄 Приїхав на канікули!`],
             ["halya", tt`Ох, {name}, догляну я цього шибеника кілька днів… Побалуєш його смаколиками?`]],
    ask: [tt`А можна ще? Дуже-дуже треба!`, tt`Баба каже — їж, бо вітер здує 😄`, tt`Я тільки скуштую!`],
    thanks: [tt`Ура! Це найсмачніше в світі!`, tt`Дякую! Я вже не голодний… майже 😄`, tt`Клас! А можна завтра ще?`],
    bye: tt`Мені вже додому… Але глянь, що я знайшов у вас за повіткою — справжній скарб! Дарую! 💎`, gift: { rare: 0 } }
];
/* персонажі для діалогів і карток замовлень */
GUESTS_LIST.forEach(g => {
  CHARS[g.id] = { key: g.id, icon: g.icon, name: g.name, from: 999, ask: g.ask, thanks: g.thanks };
  if (!PORTRAITS.includes(g.id)) PORTRAITS.push(g.id);
  PORTRAIT_FACE[g.id] = g.face;
});
if (typeof UNLOCKS !== "undefined") UNLOCKS.push({ id: "guests", lvl: 10, icon: "🧳", title: tt`Гості села`,
  text: tt`Раз на кілька днів до села хтось приїздить: коваль, фельдшерка, вівчар із гір, хлопець із міста, торговка з ярмарку чи онук баби Галі. Гість побуде 2–3 дні — виконай три його замовлення, і на прощання він щось подарує.`,
  lines: [["halya", tt`{name}, у нас село гостинне — до нас частенько хтось заїжджає 🧳 Пригостиш — і людям приємно, і тобі віддячать!`]] });
if (typeof GUIDE_BASICS !== "undefined") GUIDE_BASICS.push(["🧳", tt`Гості села`,
  tt`Раз на 3–7 днів приїздить гість на 2–3 дні. Він стоїть у дворику й робить свої замовлення — виконай три, і на прощання отримаєш подарунок (у кожного гостя свій). У засніженому дворику гості в теплому, а на свята — у святковому.`]);

window.GUESTS = (() => {
  const on = () => window.UNL && UNL.on("guests");
  const now = () => window.DVORYK_NOW || Date.now();
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  const rndIn = ([a, b]) => a + Math.random() * (b - a);
  const cur = () => S.guest && GUESTS_LIST.find(g => g.id === S.guest.id);
  const hm = ms => { const t = Math.max(0, Math.ceil(ms / 6e4)), h = Math.floor(t / 60); return h >= 24 ? Math.floor(h / 24) + tt` д ` + (h % 24) + tt` год` : h ? h + tt` год ` + (t % 60) + tt` хв` : (t % 60) + tt` хв`; };

  /* який вигляд зараз: свято → святковий, зима → тепле, інакше звичайний */
  function look(id, ch) {
    if (typeof sceneWinter === "function" ? sceneWinter(ch || (typeof curChapter === "function" ? curChapter() : null)) : false) return id + "-winter";   // сніг — тепле
    if (window.EV && EV.active && EV.active()) return id + "-fest";
    return id;
  }

  /* замовлення гостя — як звичайне, тільки щедріше */
  function order() {
    const g = cur(); if (!g) return null;
    let o = null;
    for (let k = 0; k < 6 && (!o || o.ev || o.dish || o.seas || o.paw || o.rare || o.urgent || o.wood); k++) o = newOrder();
    if (!o || o.ev || o.dish || o.seas || o.paw || o.rare || o.wood) return null;
    delete o.urgent; delete o.until;
    return Object.assign(o, { ch: g.id, guest: true, coins: Math.round(o.coins * 1.4), stars: o.stars + 1, until: S.guest.until + 60e3, born: now() });
  }
  function ensureOrder() {
    if (!S.guest || S.sideOn || S.orders.some(o => o.guest)) return;
    const o = order(); if (!o) return;
    S.orders.unshift(o); renderOrders(); save();
  }

  function arrive() {
    const pool = GUESTS_LIST.filter(g => g.id !== S.guestLast);
    const g = pool[Math.floor(Math.random() * pool.length)];
    S.guest = { id: g.id, until: now() + rndIn(GUEST_STAY_H) * 3600e3, n: 0, need: GUEST_NEED };
    S.guestsMet = S.guestsMet || {}; S.guestsMet[g.id] = (S.guestsMet[g.id] || 0) + 1;
    save();
    playDialog(g.arrive, () => {
      modal({ title: tt`У гостях: ` + g.name + " 🧳", html: tt`<img class="face" src="portraits/${g.id}.webp" alt="" style="max-height:160px"><p>${shortName(g.name)} побуде у вас <b>${hm(S.guest.until - now())}</b>. Виконай <b>${GUEST_NEED}</b> замовлення гостя — і на прощання буде подарунок 🎁</p>`, buttons: [{ label: tt`Ласкаво просимо! 💛` }] });
      ensureOrder(); renderStory();
    });
  }
  function leave(ok) {
    const g = cur(); if (!g) return;
    S.orders = S.orders.filter(o => !o.guest);
    S.guest = null; S.guestLast = g.id;
    S.guestNext = now() + rndIn(window.REB && REB.has("park") ? [2, 5] : GUEST_GAP_D) * 864e5;   // майданчик — гості частіше
    if (ok) {
      const parts = give(g.gift);
      playDialog([[g.id, g.bye]], () => modal({ title: tt`До зустрічі! 💛`, html: `<img class="face" src="portraits/${g.id}.webp" alt="" style="max-height:140px"><p class="rewards">${parts.join(" &nbsp; ")}</p>`, buttons: [{ label: tt`До зустрічі!` }] }));
      confetti(); sfx.level();
    } else toast(tt`${g.name} ${g.f ? tt`поїхала` : tt`поїхав`} — цього разу не встигли 🧳`);
    save(); renderAll();
  }
  function give(gf) {
    const p = [];
    if (gf.chest !== undefined) { placeItem({ c: "chest", l: gf.chest }); p.push(CHAINS.chest.items[gf.chest][0]); }
    if (gf.rare !== undefined && CHAINS.rare) { placeItem({ c: "rare", l: gf.rare }); p.push(CHAINS.rare.items[gf.rare][0] + " " + CHAINS.rare.items[gf.rare][1]); }
    if (gf.energy) { regen(); S.energy += gf.energy; p.push("+" + gf.energy + " ⚡"); }
    if (gf.coins) { S.coins += gf.coins; p.push("+" + gf.coins + " 🪙"); }
    if (gf.store) { S.store = S.store || { slots: STORE_START || 3, items: [] }; S.store.slots += gf.store; p.push("+" + gf.store + tt` 🗄️ полиця`); }
    if (gf.decor) { S.decor = S.decor || { inv: {}, placed: {}, seq: 0 }; S.decor.inv[gf.decor] = (S.decor.inv[gf.decor] || 0) + 1; p.push(gf.decor + tt` у «Двір на свій смак»`); }
    if (gf.cure && S.wd && S.wd.sick) { const n = Object.keys(S.wd.sick).length; S.wd.sick = {}; if (n) p.push(tt`🩺 сусіди здорові`); }
    return p;
  }

  function onDeliver(o) {
    if (!o.guest || !S.guest) return;
    S.guest.n++;
    if (S.guest.n >= S.guest.need) { setTimeout(() => leave(true), 1200); return; }
    setTimeout(() => toast(tt`🧳 ${shortName(cur().name)}: ${S.guest.n}/${S.guest.need} замовлень`), 900);
    setTimeout(ensureOrder, 1000);
  }

  function tick() {
    if (!S || !S.started || !on() || busyUI()) return;
    if (S.guest) {
      if (now() >= S.guest.until) { leave(false); return; }
      ensureOrder();
      return;
    }
    if (S.sideOn) return;
    if (!S.guestNext) { S.guestNext = now() + GUEST_FIRST_MIN * 60e3; save(); return; }
    if (now() >= S.guestNext) arrive();
  }

  /* гість у дворику */
  function yard(ch, all) {
    const g = cur(); if (!g) return [];
    const slots = [[84, 68], [16, 68], [88, 82], [12, 82], [70, 90], [30, 90]];
    const free = slots.find(([x, y]) => all.every(d => Math.hypot((d.x || 0) - x, ((d.y || 0) - y) * 1.4) > 14)) || slots[0];
    const w = look(g.id, ch);
    return [{ key: "guest-" + w, who: w, x: free[0], y: free[1], s: g.id === "petryk" ? 8 : 10 }];
  }

  function card() {
    if (!on()) return { icon: "🧳", title: tt`Гості села`, sub: tt`відкриється на ${window.PACE ? PACE.lvl("guests") : 10} рівні`, locked: true };
    const g = cur();
    if (g) return { icon: `<img class="e3d pnt" src="portraits/${g.id}.webp" alt="" style="border-radius:50%;object-fit:cover;object-position:50% 0">`, title: tt`У гостях: ` + g.name,
      sub: tt`замовлення ${S.guest.n}/${S.guest.need} · поїде за ${hm(S.guest.until - now())}`, ready: true };
    const met = Object.keys(S.guestsMet || {}).length;
    return { icon: "🧳", title: tt`Гості села`, sub: (S.guestNext ? tt`хтось приїде за ` + hm(S.guestNext - now()) : tt`скоро хтось приїде`) + (met ? tt` · знайомих: ${met} з ${GUESTS_LIST.length}` : "") };
  }

  return { tick, onDeliver, yard, card, look, list: GUESTS_LIST, arrive, leave };
})();
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => GUESTS.card()]);
