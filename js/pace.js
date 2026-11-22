"use strict";
/* ============================================================
   ТЕМП ГРИ 🐢 — нові механіки, генератори й сюжет відкриваються повільніше.
   Раніше ~35 нововведень припадали на перші 12 рівнів; тепер — приблизно по одному-два на рівень аж до 22-го.
   Уже відкрите в старих збереженнях лишається відкритим.
   ============================================================ */
const PACE_UNLOCK = {
  daily: 2, discover: 3, mail: 4, rest: 4, deals: 5, webs: 5, urgent: 6, side: 7, decor: 7,
  store: 8, cat: 8, outing: 9, medals: 9, week: 10, map: 10, wear: 11, selllimit: 11,
  path: 12, weather: 12, patience: 13, spoil: 13, rare: 14, prices: 14, album: 15, flash: 15,
  ech: 16, paidtasks: 16, seasonal: 17, fashion: 17, boost: 18, bigflash: 18, contest: 19,
  barn: 20, toloka: 21, look: 22, soil: 9, trips: 12, guests: 10, post: 12, rebuild: 12, dog: 12, herb: 12
};
const PACE_GENS = { forest: 12, poultry: 17, pottery: 23 };
const PACE_BARN = { cow: 20, goat: 25, sheep: 30 };
const PACE_STORY = 1.3;          // сюжетні завдання дорожчі (зірочки), крім першого розділу

if (typeof UNLOCKS !== "undefined") {
  UNLOCKS.forEach(u => { if (PACE_UNLOCK[u.id]) u.lvl = PACE_UNLOCK[u.id]; });
  UNLOCKS.sort((a, b) => a.lvl - b.lvl);          // по черзі, як у «Шляху господині»
}
if (typeof NEW_GENS !== "undefined") NEW_GENS.forEach(g => { if (PACE_GENS[g.id]) g.lvl = PACE_GENS[g.id]; });
if (typeof BARN !== "undefined") BARN.forEach(a => { if (PACE_BARN[a.id]) a.lvl = PACE_BARN[a.id]; });
if (typeof STORY !== "undefined") STORY.forEach((ch, i) => { if (i > 0 && !ch.generated) ch.tasks.forEach(t => { t.cost = Math.round(t.cost * PACE_STORY); }); });
window.PACE = { lvl: id => PACE_UNLOCK[id] || (typeof UNLOCKS !== "undefined" && (UNLOCKS.find(u => u.id === id) || {}).lvl) || 1, story: PACE_STORY };
