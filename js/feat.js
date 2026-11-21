"use strict";
/* ============================================================
   ПОСТУПОВЕ ВІДКРИТТЯ МЕХАНІК і нові дрібниці
   • UNL — «Шлях господині»: ускладнення й доповнення відкриваються з рівнями,
     кожне — з коротким знайомством. Стан: S.unl = { id: true }
   • XTRA — котик на скрині (S.cat), сховок (S.store), сила ×2 (S.boost),
     нагороди за нові предмети в колекції (S.claimD)
   ============================================================ */
const UNLOCKS = [
  { id: "daily",    lvl: 2, icon: "📋", title: "Завдання дня",
    text: "Щодня — три маленькі завдання, а за них подарунок 🎁. Кнопка 📋 під дошкою.",
    lines: [["halya", "{name}, я тобі списочок склала на день 📋 Зробиш — буде гостинець!"]] },
  { id: "discover", lvl: 2, icon: "🎁", title: "Нагороди за відкриття",
    text: "Кожен новий предмет у «Колекції» 📖 тепер приносить монетки. Забирай їх там — біля нових предметів світиться 🎁." },
  { id: "deals",    lvl: 3, icon: "🛍️", title: "Вигода дня",
    text: "У крамничці щодня — нові пропозиції: готові предмети високого рівня за монетки. Кількість обмежена, о півночі — нові!" },
  { id: "mail",     lvl: 3, icon: "📮", title: "Пошта",
    text: "Тепер щодня листоноша Іван приносить лист від когось із сусідів — і в кожному конверті маленький подарунок. Кнопка ✉️ угорі. Налаштування тепер у твоєму профілі — тапни на рівень ліворуч угорі.",
    lines: [["ivan", "{name}, тепер я й до тебе заходитиму щодня! 📮 Сусіди тобі пишуть — а в листах часом і гостинці 😉"]] },
  { id: "wear",     lvl: 5, icon: "🔧", title: "Генератори зношуються",
    text: "Після ~90 тапів генератор ламається. Дід Степан полагодить, якщо принесеш два предмети, — або заплати майстрові. Два однакові генератори, злиті разом, дають новенький.",
    lines: [["stepan", "{name}, техніка не вічна 🔧 Як щось зламається — клич мене, полагоджу. Тільки матеріал принеси!"]] },
  { id: "spoil",    lvl: 6, icon: "🍞‍🥀", title: "Свіжі продукти",
    text: "Молочне, фрукти й випічка, що лежать на дошці понад добу, черствіють і коштують удвічі менше. Віддавай свіжим! У сховку 🗄️ продукти не псуються.",
    lines: [["halya", "Молоко скисає, хліб черствіє, {name}… Не тримай довго — неси сусідам, поки свіже 🥛"]] },
  { id: "rest",     lvl: 3, icon: "💤", title: "Генератори втомлюються",
    text: "Після кількох тапів генератор відпочиває. Два однакові генератори зливаються в кращий — з більшим зарядом.",
    lines: [["stepan", "Земля теж має відпочивати, {name} 🌱 Потапала — дай грядці перепочити."]] },
  { id: "webs",     lvl: 3, icon: "🕸️", title: "Павутиння",
    text: "У кутку дошки завелося павутиння. Об'єднуй предмети поруч — і під ним знайдеш сюрприз.",
    lines: [["olya", "Ой, павучки сплели сіточки по кутках 🕸️ Розчисти — там щось блищить!"]] },
  { id: "urgent",   lvl: 4, icon: "⏰", title: "Термінові замовлення",
    text: "Іноді сусід дуже поспішає: термінове замовлення має годинник, зате платить більше й дає зайву ⭐." },
  { id: "side",     lvl: 4, icon: "🧭", title: "Пригоди",
    text: "Час від часу сусіди кличуть на окрему маленьку дошку з власними предметами. Встигни за 2 дні!" },
  { id: "outing",   lvl: 4, icon: "🎣", title: "Рибалка й гриби",
    text: "У вкладці «Події» 🎪 можна самій піти на рибалку 🎣 або по гриби 🍄 — раз на добу кожне. Окрема дошка: що більший улов, то більша нагорода!",
    lines: [["stepan", "{name}, бери вудку — ставок чекає! 🎣 А як не клює, то в ліс по гриби 🍄"]] },
  { id: "medals",   lvl: 5, icon: "🏅", title: "Почесні медалі",
    text: "За кожну справу — замовлення, злиття, подарунки, павутиння, страви — тепер даються медалі 🥉🥈🥇 з нагородами. Дивись у «Подіях» 🎪." },
  { id: "rare",     lvl: 6, icon: "💎", title: "Бабусині скарби",
    text: "Генератори іноді дають рідкісну знахідку: намисто — раз на ~50 тапів, ложку — раз на ~100. Два однакові скарби зливаються в цінніший — аж до родинної реліквії 👑. А колекціонер Орест приходить по них без черги й чекає три доби — платить щедро!",
    lines: [["stepan", "{name}, у землі тут чого тільки не знайдеш! Мій дід казав — колись тут бабуся скарби ховала 💎"]] },
  { id: "flash",    lvl: 7, icon: "⏳", title: "Виклик на час",
    text: "Кілька разів на день — виклик на 90 хвилин: дуже багато тапів, злиттів чи замовлень. Сама енергія шкали цього не потягне — доведеться докупити ⚡. За повну ціль — скриня-сюрприз і рідкісна знахідка, за 60% — половина нагороди." },
  { id: "patience", lvl: 5, icon: "😤", title: "Терпіння сусідів",
    text: "Тепер сусіди чекають на замовлення лише добу. Не встигнеш — ображаються, ідуть, і дружба падає на 💛. Останні 6 годин на картці видно годинник 😤. А термінових замовлень ⏰ стало більше — і чекають вони лише 1–2 години.",
    lines: [["olya", "{name}, у всіх справи… Добу почекаю, а далі — вибач, піду до інших 😅"]] },
  { id: "bigflash", lvl: 9, icon: "🏆", title: "Великий виклик тижня",
    text: "Раз на тиждень — великий виклик на 3 години: обидва генератори одночасно, дві цілі. Почни, коли маєш час і енергію, — без докупівлі не встигнути. Нагорода — скриня-сюрприз, рідкісний скарб, +10 ⭐ і +300 🪙." },
  { id: "prices",   lvl: 6, icon: "📈", title: "Ціни ростуть",
    text: "Кожна платна послуга — розбудити генератор, розчистити павутиння, пришвидшити піч, майстер, полиця у сховку, подарунки в крамничці — після кожної покупки дорожчає на 20% до кінця дня. Опівночі ціни повертаються." },
  { id: "selllimit", lvl: 4, icon: "🛍️", title: "Ярмарок до вечора",
    text: "Продавати можна лише 10 предметів на день — на кнопці «продати» видно, скільки лишилось. Думай, що віддати сусідам, а що продати." },
  { id: "paidtasks", lvl: 7, icon: "🔨", title: "Ремонт коштує",
    text: "Тепер частина завдань у дворику просить, крім зірочок, ще монети або потрібний предмет із дошки — матеріал для ремонту. На кнопці завдання видно, що треба.",
    lines: [["stepan", "{name}, на ремонт самих зірочок мало — треба й матеріал, і копійка. Цвяхи самі не забиваються 🔨"]] },
  { id: "seasonal", lvl: 8, icon: "🍂", title: "Сезонні знахідки",
    text: "Кожна пора року — свій рідкісний ланцюжок: узимку бурштинові сніжинки, навесні писанки, влітку липовий мед, восени золоте листя. Падають із генераторів рідко, а сусіди платять за них щедро. Але наприкінці сезону всі сезонні речі розтають — встигни злити й віддати!",
    lines: [["halya", "{name}, кожна пора має свої скарби 🍂 Тільки не зволікай — сезон мине, і все розтане, як сніг навесні."]] },
  { id: "cat",      lvl: 5, icon: "🐱", title: "Котик на скрині",
    text: "Пиріжок умостився на старій скрині й теж замовляє 🐾 Виконуй його замовлення — і скриня відкриється з розкішною нагородою!",
    lines: [["cat", "Мур-р. (Сідає на скриню й багатозначно дивиться на тебе.) 🐾"], ["halya", "Хитрун! Не злізе, поки не нагодуєш. А в скрині — щось цінне 🧰"]] },
  { id: "map",      lvl: 5, icon: "🗺️", title: "Таємниця старої скрині",
    text: "У подарунках трапляються шматочки старої карти. Збери всі — і знайдеш дідів скарб." },
  { id: "week",     lvl: 6, icon: "🗓️", title: "Завдання тижня",
    text: "Великі завдання на тиждень і велика нагорода 💝 — у 📋, вкладка «Тиждень»." },
  { id: "store",    lvl: 6, icon: "🗄️", title: "Сховок",
    text: "Тепер зайве можна сховати в сховок і дістати потім. Тапни предмет → 🗄️. Місць мало, але можна докупити.",
    lines: [["stepan", "Я тобі шафу-сховок змайстрував, {name} 🗄️ Що не треба зараз — клади туди, не пропаде."]] },
  { id: "ech",      lvl: 7, icon: "⚡", title: "Виклик енергії",
    text: "Кожні 3 дні — чотири завдання: замовлення, злиття, подарунки, тапи. За кожне — щедра порція енергії ⚡. У «Подіях» 🎪." },
  { id: "path",     lvl: 7, icon: "🍂", title: "Сезонна стежка",
    text: "Щомісяця — нова стежка на 30 рівнів. Кроки дають замовлення, завдання й пригоди, а кожен рівень — нагороду. Наприкінці — сезонна прикраса у дворик! У 📋, вкладка «Стежка».",
    lines: [["olya", "{name}, а в нас нова традиція: щомісяця — своя стежка 🍂 Хто пройде до кінця, тому — прикраса на подвір'я!"]] },
  { id: "album",    lvl: 8, icon: "💌", title: "Альбом листівок",
    text: "За замовлення й подарунки тепер дають листівки 💌 Збирай набори в «Колекції» — за кожен повний набір нагорода!",
    lines: [["ivan", "Пошта прийшла! 📮 Цілий стос листівок — і всі різні. Збереш альбом?"]] },
  { id: "contest",  lvl: 10, icon: "🏆", title: "Кулінарний конкурс",
    text: "Кожні 3 дні — конкурс кулінарок із сусідніх сіл! За замовлення й завдання тепер дають інгредієнти 🧺 — їх аж 60. На кухні сама обираєш, що покласти в каструлю: за рецептом — більше балів. Борись за 🥇! Вкладка «Події» 🎪.",
    lines: [["andriy", "{name}, у районі конкурс кулінарок! 🏆 Баба Явдоха з Вишневого вже тісто місить… Покажемо їм, як печуть у нашому дворику?"]] },
  { id: "toloka",   lvl: 11, icon: "🥄", title: "Толока вихідного дня",
    text: "Щовихідних усе село разом готує свято! За замовлення — ложки 🥄, ними крутиш колесо, а бали йдуть у спільну скарбничку. 5 етапів — 5 нагород для всіх.",
    lines: [["halya", "{name}, у нас звичай: на вихідних — толока! 🥄 Гуртом і хату звести легше, а вже свято наготувати — й поготів 💛"]] },
  { id: "fashion",  lvl: 9, icon: "👗", title: "Гардероб сусідів",
    text: "Збирай колекції вбрання для сусідів! За замовлення й завдання даються клаптики 🪢 — з них шиєш речі. Повна колекція — і сусід перевдягається в новий стрій. У «Подіях» 🎪.",
    lines: [["olya", "{name}, а пошиймо нам святкове вбрання! 👗 Я давно мрію про віночок зі стрічками… Клаптиків назбираємо — і за роботу!"]] },
  { id: "look",     lvl: 12, icon: "💃", title: "Образ дня",
    text: "Щодня — нова тема: «Свято Купала», «Весільна гостя», «Вечорниці»… Вбери сусіда в речі з гардероба, і село проголосує! Місце в таблиці — нагорода. А за голоси за чужі образи — клаптики 🪢.",
    lines: [["marichka", "{name}, у клубі сьогодні показ! 💃 Вбери когось із нас — і хай усе село голосує!"]] },
  { id: "boost",    lvl: 9, icon: "⚡", title: "Подвійна сила ×2",
    text: "Кнопка ×2 біля енергії: генератор бере 2 ⚡, зате дає одразу предмет на рівень вищий. Менше злиттів — більше місця." }
];
// що вже було в грі до «Шляху» — у тих, хто грав, лишається відкритим
const UNL_LEGACY = { daily: 0, rest: 0, webs: 0, map: 0, week: 0, urgent: 4, side: 4 };

window.UNL = (() => {
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  let lastAt = 0;
  const on = id => !!(S && S.unl && S.unl[id]);
  function init() {
    if (S.unl) return;
    S.unl = {};
    if (S.started) Object.keys(UNL_LEGACY).forEach(k => { if (S.level >= UNL_LEGACY[k]) S.unl[k] = true; });
    save();
  }
  const next = () => UNLOCKS.find(u => !on(u.id));
  function nextHtml() {
    const n = UNLOCKS.find(u => !on(u.id) && u.lvl > S.level);
    return n ? `<p class="hint-s unl-next">Далі, на рівні ${n.lvl}: ${n.icon} ${n.title}</p>` : "";
  }
  function open(u) {
    S.unl[u.id] = true;
    lastAt = Date.now();
    if (u.id === "webs") { MECH.addLocks(6); renderBoard(); }
    if (u.id === "week" && window.QUEST) QUEST.init();
    save(); renderAll(); if (window.QUEST) QUEST.renderButton(); if (window.XTRA) XTRA.renderBoost();
    sfx.open();
    modal({
      title: "Нове відкрито! ✨",
      html: `<div class="big-emoji">${u.id === "cat" ? CAT_ICON : u.icon}</div><p><b>${u.title}</b></p><p>${u.text}</p>`,
      buttons: [{ label: "Чудово! 💛", onClick: () => { if (u.lines) playDialog(u.lines); } }]
    });
  }
  function tick() {
    if (!S || !S.started || !S.unl || S.sideOn || busyUI() || Date.now() - lastAt < 3500 || S.tut < 4) return;
    const u = UNLOCKS.find(x => !on(x.id) && x.lvl <= S.level);
    if (u) open(u);
  }
  function roadHtml() {
    const rows = UNLOCKS.map(u => `<div class="unl-row${on(u.id) ? " ok" : ""}"><span class="unl-ic">${on(u.id) ? u.icon : "🔒"}</span>` +
      `<span class="unl-t"><b>${u.title}</b><small>${on(u.id) ? "відкрито" : "рівень " + u.lvl}</small></span></div>`).join("");
    const n = UNLOCKS.filter(u => on(u.id)).length;
    return gx(`<div class="coll-sec"><div class="coll-h">Шлях господині 🌱 <small>${n} з ${UNLOCKS.length}</small></div><div class="unl-list">${rows}</div></div>`);
  }
  return { on, init, tick, nextHtml, roadHtml, next };
})();

/* ============================================================ */
const CAT_CHEST = { first: 4, max: 7 };
const CAT_ICON = `<img class="e3d pnt" src="items/ui-catchest.webp" alt="">`;   // мальований «котик на скрині»
const CAT_VISIT = { firstMin: 5, gapMin: [25, 60], stayH: 3 };     // котик приходить без черги
const CAT_BONUS = [
  { id: "battery", icon: "🔋", text: "батарейка ⚡" },
  { id: "purse",   icon: "👛", text: "гаманець 🪙" },
  { id: "gift",    icon: "🎁", text: "подарунок" },
  { id: "cards",   icon: "💌", text: "2 листівки", need: "album" },
  { id: "star",    icon: "⭐", text: "зайва зірочка" },
  { id: "chest",   icon: "📦", text: "посилка", rare: true }
];
/* черги замовлень: спершу 3, далі відкриваються з рівнем або купуються раніше */
const ORDER_SLOTS = [{ lvl: 5, coins: 400 }, { lvl: 8, coins: 700 }, { lvl: 11, coins: 1100 }, { lvl: 14, coins: 1600 }, { lvl: 17, coins: 2200 }, { lvl: 20, coins: 3000 }];
const STORE_START = 3, STORE_PRICES = [150, 300, 500, 800, 1200];
const DISC_COINS = l => 2 + l * l;

window.XTRA = (() => {
  const on = id => window.UNL && UNL.on(id);

  /* ---------- котик на скрині ---------- */
  const cat = () => (S.cat || (S.cat = { n: 0, t: CAT_CHEST.first, round: 1 }));
  const catProg = () => cat().n + "/" + cat().t;
  /* рідкісне замовлення котика: щось високе, або дві різні речі, або страва з печі */
  function catOrder() {
    if (window.WD && WD.isSick("cat")) return null;
    const chains = S.gens.map(g => GENS[g].chain), items = [];
    const hiL = c => Math.min(CHAINS[c].items.length - 1, 3 + rnd(2) + (S.level >= 12 ? 1 : 0));
    const r = Math.random(), hasOven = S.board.some(x => x && x.st === "oven");
    if (hasOven && r < 0.2) items.push({ c: "dish", l: rnd(Math.min(CHAINS.dish.items.length, 2 + Math.floor(S.level / 10))) });
    else if (r < 0.55 && chains.length > 1) { const a = pick(chains); let b = pick(chains); while (b === a) b = pick(chains); items.push({ c: a, l: 2 + rnd(2) }, { c: b, l: 2 + rnd(2) }); }
    else { const c = pick(chains); items.push({ c, l: hiL(c) }); }
    let coins = 0, xp = 0;
    items.forEach(it => { coins += Math.round(itemValue(it.c, it.l) * 1.4); xp += (it.l + 1) * 4; });
    const pool = CAT_BONUS.filter(b => !b.need || on(b.need)).filter(b => !b.rare || Math.random() < 0.35);
    return { id: ++S.orderSeq, ch: "cat", items, coins, xp, stars: 1, paw: true, line: rnd(3), bonus: pick(pool).id,
      catUntil: Date.now() + CAT_VISIT.stayH * 3600e3 };
  }
  function catTick() {
    if (!on("cat") || S.sideOn) return;
    const now = Date.now(), o = S.orders.find(x => x.paw);
    if (o && o.catUntil && now >= o.catUntil) {
      S.orders = S.orders.filter(x => x !== o);
      S.catNext = now + (CAT_VISIT.gapMin[0] + rnd(CAT_VISIT.gapMin[1] - CAT_VISIT.gapMin[0])) * 60e3;
      toast("🐾 Пиріжок не дочекався й пішов гуляти…"); renderOrders(); save(); return;
    }
    if (o) return;
    if (!S.catNext) { S.catNext = now + CAT_VISIT.firstMin * 60e3; save(); return; }
    if (now < S.catNext) return;
    const co = catOrder(); if (!co) { S.catNext = now + 30 * 60e3; return; }
    S.orders.unshift(co); S.catNext = 0;
    sfx.pop(); toast("🐾 Пиріжок прийшов без черги — у нього рідкісне замовлення!");
    renderOrders(); save();
  }
  function grantBonus(id, card) {
    const r = card && card.getBoundingClientRect();
    if (id === "battery") placeItem({ c: "energy", l: 1 });
    else if (id === "purse") placeItem({ c: "coin", l: 2 });
    else if (id === "gift") placeItem({ c: "chest", l: 0 });
    else if (id === "chest") placeItem({ c: "chest", l: 1 });
    else if (id === "cards" && window.ALB) ALB.give(2, "Від котика");
    else if (id === "star") { S.stars += 1; if (r) flyMany(r, "⭐", "stars", 2, 300); }
    const b = CAT_BONUS.find(x => x.id === id);
    if (b) setTimeout(() => toast(`🐾 Бонус від котика: ${b.icon} ${b.text}!`), 700);
  }
  const bonusIcon = o => { const b = o.bonus && CAT_BONUS.find(x => x.id === o.bonus); return b ? b.icon : ""; };

  /* ---------- черги замовлень ---------- */
  const people = () => Object.keys(CHARS).filter(c => c !== "cat" && (CHARS[c].from || 0) <= S.chapter && !(window.WD && WD.isSick(c))).length;
  const extraSlots = () => Math.max(ORDER_SLOTS.filter(s => S.level >= s.lvl).length, S.slotBuy || 0);
  const slots = () => Math.max(1, Math.min(3 + extraSlots(), people()));
  function nextSlot() {
    const k = extraSlots(), s = ORDER_SLOTS[k];
    return s && 3 + k < people() ? s : null;
  }
  function slotCardHtml() {
    const s = nextSlot(); if (!s || S.sideOn) return "";
    return `<div class="order slot-lock"><div class="o-who"><span class="o-name">Ще черга</span></div>` +
      `<div class="sl-body"><span class="sl-ic">🔒</span><small>з рівня ${s.lvl}</small></div><button class="o-btn sl-buy">${s.coins} 🪙</button></div>`;
  }
  function buyQueue() {
    const s = nextSlot(); if (!s) return;
    modal({ title: "Ще одна черга 🧺", html: `<div class="big-emoji">👥</div><p>Відкрити ще одне місце для замовлень зараз — за <b>${s.coins} 🪙</b>?</p><p class="hint-s">Без монеток воно відкриється само на ${s.lvl}-му рівні. Більше черг — більше замовлень одночасно.</p>`,
      buttons: [{ label: `Відкрити за ${s.coins} 🪙`, disabled: S.coins < s.coins, onClick: () => {
        S.coins -= s.coins; S.slotBuy = extraSlots() + 1;
        fillOrders(); sfx.level(); confetti(); renderTop(); renderOrders(); save();
        toast("🧺 Ще одна черга відкрита!");
      } }, { label: "Пізніше", cls: "ghost" }] });
  }
  let lastSlots = 0;
  function slotsTick() {
    const n = slots();
    if (lastSlots && n > lastSlots && !S.sideOn) { fillOrders(); renderOrders(); save(); toast("🧺 Відкрилась ще одна черга замовлень!"); }
    lastSlots = n;
  }

  function onDeliver(o, card) {
    if (!o.paw) return;
    if (o.bonus) grantBonus(o.bonus, card);
    S.catNext = Date.now() + (CAT_VISIT.gapMin[0] + rnd(CAT_VISIT.gapMin[1] - CAT_VISIT.gapMin[0])) * 60e3;
    const k = cat();
    k.n++;
    if (k.n < k.t) { setTimeout(() => toast(`🐾 Котик на скрині: ${k.n}/${k.t}`), 900); return; }
    const round = k.round;
    S.cat = { n: 0, t: Math.min(CAT_CHEST.max, k.t + 1), round: round + 1 };
    const coins = 80 + 40 * Math.min(round, 6), en = 10;
    setTimeout(() => playDialog([["cat", "Мр-р-ряу! 😻 (Потягується, злазить зі скрині й муркоче.)"]], () => {
      placeItem({ c: "chest", l: 2 }); S.coins += coins; regen(); S.energy += en;
      if (window.ALB) ALB.give(2, "Від котика");
      save(); renderAll(); confetti(); sfx.level();
      modal({ title: "Скриня відкрита! 🧰",
        html: `<div class="big-emoji">${CAT_ICON}</div><p>Пиріжок наївся й пустив до скрині. А там…</p><p class="rewards">💝 &nbsp; +${coins} 🪙 &nbsp; +${en} ⚡${on("album") ? " &nbsp; 💌💌" : ""}</p>` +
          `<p class="hint-s">Котик уже вмощується назад 🐾 Наступна скриня — за ${S.cat.t} його замовлень.</p>`,
        buttons: [{ label: "Мур! 💛" }] });
    }), 900);
  }

  /* ---------- сховок ---------- */
  const store = () => (S.store || (S.store = { slots: STORE_START, items: [] }));
  const canStore = it => it && !it.lock && !it.st && !(window.SIDE && SIDE.isSideItem && SIDE.isSideItem(it));
  function storeBtn(it) {
    if (!on("store") || S.sideOn || !canStore(it)) return "";
    return `<button class="sell store-b" id="storeBtn"><small>сховати</small><span>🗄️</span></button>`;
  }
  function hintBtn() {
    if (!on("store") || S.sideOn) return "";
    const s = store();
    return `<button class="store-open" id="storeOpen">🗄️ <small>${s.items.length}/${s.slots}</small></button>`;
  }
  function stash(i) {
    const s = store(), it = S.board[i];
    if (!canStore(it)) return;
    if (s.items.length >= s.slots) { sfx.nope(); toast("Сховок повний 🗄️ Звільни місце або докупи ще одне"); openStore(); return; }
    const cell = document.querySelector(`.cell[data-i="${i}"]`);
    const btn = $("storeBtn");
    if (cell && btn) flyIcon(itemIcon(it), cell.getBoundingClientRect(), btn.getBoundingClientRect(), { size: 34, end: 0.5 });
    if (it.t) it.age = Date.now() - it.t;          // у сховку продукти не черствіють
    s.items.push(it);
    S.board[i] = null; if (selected === i) selected = -1;
    sfx.pop(); toast(`🗄️ ${itemName(it)} — у сховку`);
    renderBoard(); renderInfo(); renderOrders(); save();
  }
  function take(k) {
    const s = store();
    if (!s.items[k]) return;
    const i = emptyNear(Math.floor(N / 2));
    if (i < 0) { sfx.nope(); toast("Звільни місце на дошці 🙂"); return; }
    S.board[i] = s.items.splice(k, 1)[0]; popIdx.add(i);
    if (S.board[i].age !== undefined) { S.board[i].t = Date.now() - S.board[i].age; delete S.board[i].age; }
    sfx.pop();
    renderBoard(); renderOrders(); renderInfo(); save();
    openStore();
  }
  const slotPrice = s => { const b = STORE_PRICES[s.slots - STORE_START]; return b && window.ECON ? ECON.price("slot", b) : b; };
  function buySlot() {
    const s = store(), p = slotPrice(s);
    if (!p) return;
    if (S.coins < p) { sfx.nope(); toast("Не вистачає монеток 🪙"); return; }
    S.coins -= p; s.slots++; window.ECON && ECON.bought("slot");
    sfx.coin(); toast("🗄️ Нова полиця у сховку!");
    renderTop(); renderInfo(); save(); openStore();
  }
  function openStore() {
    const s = store(), p = slotPrice(s);
    const cells = Array.from({ length: s.slots }, (_, k) => s.items[k]
      ? `<button class="st-cell full" data-k="${k}"><span>${itemIcon(s.items[k])}</span><small>${itemName(s.items[k])}</small></button>`
      : `<div class="st-cell"></div>`).join("") +
      (p ? `<button class="st-cell buy" id="stBuy"><span>➕</span><small>${p} 🪙</small></button>` : "");
    modal({ title: "Сховок 🗄️",
      html: `<p class="hint-s">Тапни річ, щоб повернути її на дошку. Сховати — тапни предмет на дошці й натисни 🗄️.</p><div class="st-grid">${cells}</div>`,
      buttons: [{ label: "Закрити", cls: "ghost" }] });
    document.querySelectorAll(".st-cell.full").forEach(b => b.onclick = () => take(+b.dataset.k));
    const bb = $("stBuy"); if (bb) bb.onclick = buySlot;
  }

  /* ---------- сила ×2 ---------- */
  const boosted = () => on("boost") && !!S.boost;
  function renderBoost() {
    const b = $("boostBtn"); if (!b) return;
    b.hidden = !on("boost");
    b.classList.toggle("on", !!S.boost);
    b.textContent = S.boost ? "×2" : "×1";
  }
  function toggleBoost() {
    S.boost = !S.boost; sfx.pop();
    toast(S.boost ? "⚡×2: тап коштує 2 ⚡, предмет — на рівень вищий" : "⚡×1: звичайні тапи");
    renderBoost(); save();
  }

  /* ---------- нагороди за відкриття ---------- */
  function initDisc() {
    if (S.claimD) return;
    S.claimD = {};
    if (S.started) Object.keys(S.collection).forEach(k => S.claimD[k] = 1);   // давні знахідки — без нагороди
  }
  const discReady = k => on("discover") && S.collection[k] && !S.claimD[k];
  const discCount = () => on("discover") ? PRODUCT_CHAINS.reduce((n, c) => n + CHAINS[c].items.filter((_, l) => discReady(c + ":" + l)).length, 0) : 0;
  function claimDisc(k, el) {
    if (!discReady(k)) return 0;
    const [c, l] = k.split(":"); const lv = +l;
    S.claimD[k] = 1;
    let coins = DISC_COINS(lv);
    S.coins += coins;
    const top = lv >= CHAINS[c].items.length - 1;
    if (top) S.stars += 1;
    if (el) { const r = el.getBoundingClientRect(); flyMany(r, "🪙", "coins", 3); if (top) flyMany(r, "⭐", "stars", 2, 150); }
    return coins;
  }
  function claimAll() {
    let sum = 0;
    PRODUCT_CHAINS.forEach(c => CHAINS[c].items.forEach((_, l) => { sum += claimDisc(c + ":" + l); }));
    if (sum) { sfx.coin(); toast(`🎁 Нагороди за відкриття: +${sum} 🪙`); }
    renderTop(); renderCollection(); renderNavBadge(); save();
  }

  return { catOrder, catTick, bonusIcon, slots, slotCardHtml, buyQueue, slotsTick, onDeliver, catProg, storeBtn, hintBtn, stash, openStore, boosted, renderBoost, toggleBoost,
    initDisc, discReady, discCount, claimDisc, claimAll };
})();
