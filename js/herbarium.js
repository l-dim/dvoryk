"use strict";
/* ============================================================
   ГЕРБАРІЙ І МЕТЕЛИКИ 🦋 — колекція на весь рік.
   Кожна пора року (за справжньою датою) має 6 знахідок: 3 рідкісні квітки й 3 метелики
   (узимку — морозні рослини й зимові пташки). Зрідка, коли тапаєш генератор на городі,
   поруч з'являється знахідка: квітку можна зірвати будь-коли, а метелик/пташка
   полетить за півтори хвилини — тапни, щоб упіймати.
   Повна пора року — нагорода; усі чотири — особлива прикраса «Метеликова альтанка».
   Стан: S.herb = { got: { id: 1 }, done: { spring: true, … }, prize }
   ============================================================ */
const HERB_P = 1 / 600, HERB_FLY_MS = 90e3, HERB_DUP = 20;
const HERB_SEASONS = {
  spring: { name: tt`Весняний`, icon: "🌸", list: [["proliska", "🪻", tt`Проліска`], ["sontrava", "🌸", tt`Сон-трава`], ["konvalia", "🌼", tt`Конвалія`],
    ["lymonnytsia", "🦋", tt`Лимонниця`, 1], ["kropyvianka", "🦋", tt`Кропив'янка`, 1], ["avrora", "🦋", tt`Аврора`, 1]] },
  summer: { name: tt`Літній`, icon: "🌻", list: [["voloshka", "🪻", tt`Волошка`], ["dzvinochok", "🌸", tt`Дзвіночок`], ["mak", "🌺", tt`Мак`],
    ["makhaon", "🦋", tt`Махаон`, 1], ["syniavets", "🦋", tt`Синявець`, 1], ["pavychevo", "🦋", tt`Павичеве око`, 1]] },
  autumn: { name: tt`Осінній`, icon: "🍂", list: [["veres", "🪻", tt`Верес`], ["aistra", "🌼", tt`Айстра`], ["shafran", "🌷", tt`Шафран осінній`],
    ["admiral", "🦋", tt`Адмірал`, 1], ["zhalibnytsia", "🦋", tt`Жалібниця`, 1], ["sovka", "🦋", tt`Совка осіння`, 1]] },
  winter: { name: tt`Зимовий`, icon: "❄️", list: [["moroznyk", "🌼", tt`Морозник`], ["omela", "🌿", tt`Омела`], ["yalivets", "🌲", tt`Ялівець`],
    ["snihur", "🐦", tt`Снігур`, 1], ["synychka", "🐦", tt`Синичка`, 1], ["piadun", "🦋", tt`Зимовий п'ядун`, 1]] }
};
const HERB_ORDER = ["spring", "summer", "autumn", "winter"];
const HERB_REWARD = { chest: 2, stars: 10, coins: 300 };
const HERB_PRIZE = ["🎐", tt`Метеликова альтанка`, 10];
const HERB_ART = ["proliska", "sontrava", "konvalia", "lymonnytsia", "kropyvianka", "avrora", "voloshka", "dzvinochok", "mak", "makhaon", "syniavets", "pavychevo",
  "veres", "aistra", "shafran", "admiral", "zhalibnytsia", "sovka", "moroznyk", "omela", "yalivets", "snihur", "synychka", "piadun"].map(id => "herb-" + id);   // аркуші B1–B2

/* знахідки — окремий ланцюжок (кожна — свій «рівень», не об'єднуються) */
window.PUA_MAP = window.PUA_MAP || {};
const HERB_ALL = HERB_ORDER.flatMap(s => HERB_SEASONS[s].list.map(([id, e, name, fly]) => ({ id, e, name, fly: !!fly, season: s })));
CHAINS.herb = { name: tt`Гербарій`, nomerge: true, value: 2, items: HERB_ALL.map((h, l) => { const c = String.fromCharCode(0xE580 + l); PUA_MAP[c] = { e: h.e, img: HERB_ART.includes("herb-" + h.id) ? `items/herb-${h.id}.webp` : null }; return [c, h.name]; }) };
if (typeof DECOR_SHOP !== "undefined" && !DECOR_SHOP.some(x => x[0] === HERB_PRIZE[0])) DECOR_SHOP.push([HERB_PRIZE[0], HERB_PRIZE[1], 0, HERB_PRIZE[2], "souv"]);

if (typeof UNLOCKS !== "undefined") UNLOCKS.push({ id: "herb", lvl: 12, icon: "🦋", title: tt`Гербарій і метелики`,
  text: tt`Кожна пора року ховає на городі 6 рідкісних знахідок: квіти й метеликів (узимку — морозні рослини й пташок). Вони трапляються зрідка, коли тапаєш генератори. Квітку можна зірвати будь-коли, а метелик полетить за півтори хвилини — встигни тапнути! Повна пора — нагорода, усі чотири — «Метеликова альтанка».`,
  lines: [["marichka", tt`{name}, дивись, який метелик! 🦋 А давай збирати гербарій — на кожну пору року свій? Тільки вони ж такі рідкісні…`]] });
if (typeof GUIDE_BASICS !== "undefined") GUIDE_BASICS.push(["🦋", tt`Гербарій і метелики`,
  tt`Кожна пора року — 6 знахідок (3 квітки й 3 метелики, узимку — пташки). Зрідка з'являються біля генератора, коли тапаєш на городі. Метелик полетить за 1,5 хв — тапни, щоб упіймати. Повна пора — 💝, 10 ⭐ і 300 🪙; усі чотири — «Метеликова альтанка» у дворик.`]);

window.HERB = (() => {
  const on = () => window.UNL && UNL.on("herb");
  const now = () => window.DVORYK_NOW || Date.now();
  const st = () => (S.herb = S.herb || { got: {}, done: {}, prize: false });
  const season = () => (window.ENV ? ENV.season() : "summer");
  const ofSeason = s => HERB_ALL.filter(h => h.season === s);
  const have = s => ofSeason(s).filter(h => st().got[h.id]).length;
  const icon = h => CHAINS.herb.items[HERB_ALL.indexOf(h)][0];

  /* тап генератора на городі: зрідка — знахідка поруч */
  function onTap(near) {
    if (!on() || S.sideOn) return;
    const g = S.board[near] && GENS[S.board[near].g];
    if (!g || g.holiday || g.pet || g.side) return;
    if (Math.random() >= HERB_P) return;
    const list = ofSeason(season()), h = list[Math.floor(Math.random() * list.length)];
    const it = { c: "herb", l: HERB_ALL.indexOf(h) };
    if (h.fly) it.fly = now() + HERB_FLY_MS;
    const at = placeItem(it, near); if (at < 0) return;
    spawnFrom.set(at, near);
    setTimeout(() => { sparkle(at, "✨", 8); toast(h.fly ? tt`${h.e} ${h.name}! Тапни швидше, поки не полетів!` : tt`${h.e} Рідкісна квітка: ${h.name}! Тапни, щоб зірвати в гербарій`); }, 300);
  }
  /* тап по знахідці */
  function collect(i) {
    const it = S.board[i]; if (!it || it.c !== "herb") return false;
    const h = HERB_ALL[it.l]; S.board[i] = null; if (selected === i) selected = -1;
    const s = st();
    if (s.got[h.id]) { S.coins += HERB_DUP; sfx.coin(); toast(tt`${h.e} ${h.name} уже є в гербарії — +${HERB_DUP} 🪙`); }
    else {
      s.got[h.id] = 1; sfx.level(); confetti();
      const n = have(h.season);
      toast(tt`📖 У гербарії: ${h.name}! ${HERB_SEASONS[h.season].name} розділ — ${n}/6`);
      if (n >= 6 && !s.done[h.season]) setTimeout(() => complete(h.season), 900);
    }
    save(); renderBoard(); renderTop(); renderInfo();
    return true;
  }
  function complete(ss) {
    const s = st(); s.done[ss] = true;
    placeItem({ c: "chest", l: HERB_REWARD.chest }); S.stars += HERB_REWARD.stars; S.coins += HERB_REWARD.coins;
    const all = HERB_ORDER.every(k => s.done[k]);
    let prize = "";
    if (all && !s.prize) { s.prize = true; S.decor = S.decor || { inv: {}, placed: {}, seq: 0 }; S.decor.inv[HERB_PRIZE[0]] = (S.decor.inv[HERB_PRIZE[0]] || 0) + 1; prize = tt`<p class="rewards">Увесь рік зібрано! ${HERB_PRIZE[0]} ${HERB_PRIZE[1]} — у «Двір на свій смак» 🎨</p>`; }
    save(); renderAll(); sfx.level(); confetti();
    modal({ title: tt`${HERB_SEASONS[ss].icon} ${HERB_SEASONS[ss].name} гербарій зібрано!`, html: `<div class="big-emoji">📖</div><p class="rewards">${CHAINS.chest.items[HERB_REWARD.chest][0]} &nbsp; +${HERB_REWARD.stars} ⭐ &nbsp; +${HERB_REWARD.coins} 🪙</p>${prize}`, buttons: [{ label: tt`Красота! 🦋` }] });
  }
  /* метелики відлітають */
  function tick() {
    if (!S || !S.started) return;
    const t = now(); let n = 0;
    [S.board, S.main].forEach(b => b && b.forEach((x, i) => { if (x && x.c === "herb" && x.fly && t >= x.fly) { b[i] = null; n++; } }));
    if (n) { renderBoard(); save(); toast(tt`🦋 Метелик полетів… Наступного разу встигни тапнути!`); }
  }

  function panel() {
    const s = st(), cur = season();
    const block = ss => {
      const L = ofSeason(ss);
      return `<div class="hb-sec${ss === cur ? " now" : ""}"><p class="dq-when">${HERB_SEASONS[ss].icon} ${HERB_SEASONS[ss].name} · ${have(ss)}/6${s.done[ss] ? " ✅" : ss === cur ? tt` · зараз` : ""}</p><div class="hb-grid">` +
        L.map(h => s.got[h.id] ? `<span class="hb-c got"><b>${icon(h)}</b><small>${h.name}</small></span>` : `<span class="hb-c"><b>❔</b><small>${ss === cur ? tt`шукай!` : "—"}</small></span>`).join("") + `</div></div>`;
    };
    modal({ title: tt`Гербарій 🦋`, html: tt`<p class="hint-s">Знахідки поточної пори року трапляються біля генераторів на городі. Метелика тапни, поки не полетів!</p>` +
      [cur, ...HERB_ORDER.filter(k => k !== cur)].map(block).join("") +
      tt`<p class="hint-s">Усі чотири пори — ${HERB_PRIZE[0]} «${HERB_PRIZE[1]}»${s.prize ? " ✅" : ""}.</p>`, buttons: [{ label: tt`Готово`, cls: "ghost" }] });
  }
  function card() {
    if (!on()) return { icon: "🦋", title: tt`Гербарій і метелики`, sub: tt`відкриється на ${window.PACE ? PACE.lvl("herb") : 12} рівні`, locked: true };
    const cur = season(), done = HERB_ORDER.filter(k => st().done[k]).length;
    return { icon: "🦋", title: tt`Гербарій і метелики`, sub: tt`${HERB_SEASONS[cur].name}: ${have(cur)}/6 · пір року зібрано: ${done}/4`, btn: tt`Відкрити`, act: "herb" };
  }
  return { onTap, collect, tick, panel, card, all: HERB_ALL };
})();
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => HERB.card()]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { herb: () => HERB.panel() });
