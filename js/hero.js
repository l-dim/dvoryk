"use strict";
/* ============================================================
   ГЕРОЇНЯ — зовнішність персонажа, яким граєш
   • 6 варіантів зовнішності: обираєш на старті або в профілі («змінити»).
   • Мальована героїня стоїть у дворику серед сусідів, її обличчя — в аватарці,
     профілі, таблицях конкурсу й «Образу дня».
   • Поки картинки не намальовані — показується емодзі-замінник.
   • Стать: жінка або чоловік (S.sex = "f" | "m") — по 6 варіантів; для чоловіка звертання
     в текстах гри перемикаються на чоловічий рід (gx у game.js).
   Картинки: portraits/<id>-full.webp (на повний зріст). Стан: S.hero = id, S.sex
   ============================================================ */
const HEROES = [
  { id: "hero1", sex: "f", e: "👱‍♀️", title: "Світла коса",      look: "світла коса, блакитний сарафан" },
  { id: "hero2", sex: "f", e: "👩",   title: "Темне каре",        look: "темне каре, зелена сукня з фартушком" },
  { id: "hero3", sex: "f", e: "👩‍🦰", title: "Руді кучері",       look: "руді кучері, гірчичний кардиган" },
  { id: "hero4", sex: "f", e: "👩‍🦱", title: "Гулька",            look: "темна гулька, червона сукня в горошок" },
  { id: "hero5", sex: "f", e: "👩‍🌾", title: "Хвостик",           look: "русявий хвостик, комбінезон і картата сорочка" },
  { id: "hero6", sex: "f", e: "👒",   title: "Солом'яний капелюх", look: "коротка стрижка, лавандова блузка й бриль" },
  { id: "man1", sex: "m", e: "👱‍♂️", title: "Русявий чуб", look: "русявий чуб, вишиванка й джинси" },
  { id: "man2", sex: "m", e: "🧔",   title: "Борода",      look: "темна борідка, картата фланелева сорочка" },
  { id: "man3", sex: "m", e: "👨‍🦰", title: "Рудий",       look: "руді кучері, ластовиння, гірчичний светр" },
  { id: "man4", sex: "m", e: "👨",   title: "Вуса",        look: "чорне волосся, охайні вуса, вишиванка з червоним поясом" },
  { id: "man5", sex: "m", e: "👨‍🌾", title: "Кашкет",      look: "кашкет, картата сорочка й комбінезон" },
  { id: "man6", sex: "m", e: "🧑‍🦱", title: "Бриль",       look: "солом'яний бриль, лляна сорочка з закатаними рукавами" }
];
const HERO_ART = ["hero1", "hero2", "hero3", "hero4", "hero5", "hero6", "man1", "man2", "man3", "man4", "man5", "man6"];   // намальовані (portraits/<id>-full.webp)
/* де обличчя на картинці (знайдено Apple Vision): центр x, центр y (% від ширини/висоти), ширина лиця (%), пропорції картинки */
const HERO_FACE = { hero1: [52.6, 11.0, 30.4, 0.373], hero2: [52.6, 11.3, 30.2, 0.380], hero3: [46.9, 12.4, 29.7, 0.406], hero4: [51.4, 13.5, 28.6, 0.456], hero5: [51.0, 13.4, 29.8, 0.422], hero6: [54.4, 14.0, 27.3, 0.452], man1: [48.8, 12.1, 25.5, 0.466], man2: [47.6, 11.1, 24.3, 0.473], man3: [43.7, 11.5, 27.6, 0.412], man4: [43.1, 11.0, 25.8, 0.450], man5: [41.9, 11.3, 28.7, 0.434], man6: [50.7, 12.9, 26.2, 0.459] };

window.HERO = (() => {
  const cur = () => HEROES.find(h => h.id === (S && S.hero)) || null;
  const has = h => !!h && HERO_ART.includes(h.id);
  /* обличчя: мальоване (обрізане з фігури) або емодзі */
  function faceHtml(h, cls = "") {
    h = h || cur();
    if (has(h)) return `<span class="hero-face ${cls}"><img src="portraits/${h.id}-full.webp" alt="" style="${faceStyle(h)}"></span>`;
    return h ? h.e : (S && S.ava) || "👩‍🌾";
  }
  /* обличчя по центру кружечка: лице займає ~58% ширини */
  function faceStyle(h) {
    const f = HERO_FACE[h.id]; if (!f) return "";
    const [cx, cy, w, asp] = f, W = 58 / (w / 100), H = W / asp;
    return `width:${W.toFixed(1)}%;left:${(50 - cx / 100 * W).toFixed(1)}%;top:${(50 - cy / 100 * H).toFixed(1)}%;transform:none`;
  }
  function emoji() { const h = cur(); return h ? h.e : (S && S.ava) || "👩‍🌾"; }
  const sex = () => (S && S.sex) || "f";
  const list = () => HEROES.filter(h => h.sex === sex());
  function setSex(x) { S.sex = x; if (!cur() || cur().sex !== x) S.hero = list()[0].id; S.ava = cur().e; save(); render(); }
  function set(id) {
    S.hero = id; const h = cur(); if (h) { S.ava = h.e; S.sex = h.sex; }
    save(); sfx.pop(); render();
    if (!$("tab-story").hidden) renderStory();
  }
  function render() { const el = $("lvlAva"); if (el) el.innerHTML = faceHtml(null, "mini"); }
  function cards(sel) {
    return list().map(h => `<button class="hr-card${h.id === sel ? " on" : ""}" data-id="${h.id}">` +
      (has(h) ? `<img src="portraits/${h.id}-full.webp" alt="">` : `<span class="hr-e">${h.e}</span>`) +
      `<b>${h.title}</b></button>`).join("");
  }
  /* вибір у профілі */
  function picker(back) {
    const c = cur();
    modal({ title: "Моя зовнішність",
      html: sexHtml() + `<p class="hint-s">Так тебе бачитимуть сусіди — у дворику, в аватарці й на конкурсах.</p><div class="hr-grid">${cards(c && c.id)}</div>` +
        (c ? `<p class="hr-look">${c.look}</p>` : "") +
        (HERO_ART.length ? "" : `<p class="hint-s">Мальовані героїні скоро з'являться 🎨 Поки — значки.</p>`),
      buttons: [{ label: "Готово", onClick: back }] });
    document.querySelectorAll(".hr-card").forEach(b => b.onclick = () => { set(b.dataset.id); picker(back); });
    document.querySelectorAll(".hr-sex").forEach(b => b.onclick = () => { setSex(b.dataset.s); sfx.pop(); if (!$("tab-story").hidden) renderStory(); picker(back); });
  }
  /* для дворика: героїня стоїть попереду, біля стежки */
  function yard() {
    const h = cur(); if (!has(h)) return [];
    return [{ key: "hero-" + h.id, who: h.id + "-full", hero: true, x: 50, y: 80, s: 10 }];
  }
  /* стартовий екран */
  const sexHtml = () => `<div class="hr-sexes"><button class="hr-sex${sex() === "f" ? " on" : ""}" data-s="f">👩 Жінка</button><button class="hr-sex${sex() === "m" ? " on" : ""}" data-s="m">👨 Чоловік</button></div>`;
  function startRow() {
    const box = $("heroPick"); if (!box) return;
    S.heroAsked = true;          // нова гра: героя обирають тут, окремо питати не треба
    if (!S.hero || !cur() || cur().sex !== sex()) S.hero = list()[0].id;
    box.innerHTML = sexHtml() + `<div class="hr-row">${list().map(h => `<button class="hr-mini${h.id === S.hero ? " on" : ""}" data-id="${h.id}" title="${h.title}">${has(h) ? `<span class="hero-face"><img src="portraits/${h.id}-full.webp" alt="" style="${faceStyle(h)}"></span>` : h.e}</button>`).join("")}</div>`;
    box.querySelectorAll(".hr-mini").forEach(b => b.onclick = () => { S.hero = b.dataset.id; S.ava = cur().e; startRow(); });
    box.querySelectorAll(".hr-sex").forEach(b => b.onclick = () => { S.sex = b.dataset.s; S.hero = list()[0].id; S.ava = cur().e; startRow(); });
  }
  /* коли з'являться мальовані героїні — один раз запропонувати вибрати (для давніх ігор) */
  function tick() {
    if (!S || !S.started || S.heroAsked || !HERO_ART.length || S.sideOn) return;
    if ($("modal").classList.contains("show") || $("dialog").classList.contains("show")) return;
    S.heroAsked = true; save();
    playDialog([["halya", "{name}, а покажися-но сусідам — щоб і в дворику тебе бачили! 💛"]], () => picker(() => { render(); if (!$("tab-story").hidden) renderStory(); }));
  }
  return { faceHtml, emoji, picker, render, yard, startRow, cur, tick };
})();
