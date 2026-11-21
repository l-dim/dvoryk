"use strict";
/* ============================================================
   ГАРДЕРОБ СУСІДІВ 👗 (як «Центр моди» в записі)
   • 4 колекції вбрання, кожна — для свого сусіда, по 8 речей.
   • Клаптики 🪢 дають замовлення, завдання, вилазки, подарунки й листи.
   • «Пошити» (10 🪢) — випадкова річ з обраної колекції; останні речі рідкісніші.
     Повтор повертає 3 🪢.
   • Повна колекція — нагорода, а сусід перевдягається в новий стрій і так стоїть у дворику.
   Стан: S.fash = { thr, have: { колекція: { індекс: к-сть } }, done: {}, wear: { сусід: колекція }, sel }
   ============================================================ */
const FASH_COST = 10, FASH_DUP = 3;
const FASH_W = [10, 10, 10, 10, 10, 5, 5, 2];          // вага речей: остання — найрідкісніша
const FASHION = [
  { id: "vinok", host: "olya", name: "Святковий віночок", icon: "🌸", bg: "#ffe0ea",
    items: [["🌸", "Віночок зі стрічками"], ["👚", "Вишиванка"], ["🧥", "Оксамитова керсетка"], ["👗", "Плахта"], ["🎀", "Тканий пояс-крайка"], ["📿", "Коралове намисто"], ["👢", "Червоні чобітки"], ["🎗️", "Різнокольорові стрічки"]] },
  { id: "kozak", host: "andriy", name: "Козацький стрій", icon: "🪕", bg: "#e3edff",
    items: [["👕", "Сорочка-вишиванка"], ["👖", "Сині шаровари"], ["🎗️", "Червоний кушак"], ["🧥", "Жупан"], ["🧢", "Смушкова шапка"], ["👢", "Чоботи"], ["👜", "Шкіряна торба"], ["🪈", "Сопілка"]] },
  { id: "nedilia", host: "halya", name: "Бабусин недільний", icon: "🧣", bg: "#fff0d6",
    items: [["🧣", "Квітчаста хустка"], ["👚", "Біла сорочка"], ["👗", "Темна спідниця"], ["🥼", "Вишитий фартух"], ["🧥", "Гуцульський кептар"], ["📿", "Червоні коралі"], ["👞", "Недільні черевички"], ["🧺", "Кошик із рушником"]] },
  { id: "yarmarok", host: "marichka", name: "Ярмаркове літо", icon: "👒", bg: "#e7f8dc",
    items: [["👒", "Солом'яний бриль"], ["👗", "Сарафан у квіточку"], ["🎀", "Бантик у косу"], ["👡", "Сандалики"], ["🌼", "Ромашковий віночок"], ["🧺", "Ягідний кошичок"], ["🍭", "Півник на паличці"], ["🎈", "Повітряна кулька"]] }
];
const FASH_REWARD = { chest: 2, coins: 300, stars: 5, hearts: 3 };
const FASH_ALL = { chest: 2, coins: 800, stars: 10 };
const FASH_ART = ["vinok", "kozak", "nedilia", "yarmarok"].flatMap(c => [0, 1, 2, 3, 4, 5, 6, 7].map(i => `fash-${c}-${i}`));   // мальовані речі; фігури в строях — FASH_LOOKS
const FASH_LOOKS = [];        // які фігури вже намальовані (portraits/<сусід>-<колекція>.webp)

function fashIcon(c, i) { const id = `fash-${c.id}-${i}`; return FASH_ART.includes(id) ? `<img class="e3d pnt" src="items/${id}.webp" alt="">` : c.items[i][0]; }

window.FASH = (() => {
  const on = () => window.UNL && UNL.on("fashion");
  const st = () => (S.fash || (S.fash = { thr: 0, have: {}, done: {}, wear: {}, sel: FASHION[0].id }));
  const coll = id => FASHION.find(c => c.id === id);
  const got = c => Object.keys(st().have[c.id] || {}).length;
  const known = c => CHARS[c.host] && (CHARS[c.host].from || 0) <= S.chapter;

  /* клаптики */
  function add(n, why) {
    if (!on() || !n) return;
    st().thr += n; save();
    if (why) setTimeout(() => toast(`🪢 +${n} клаптиків${why ? " — " + why : ""}`), 1800);
    if (window.HUB) HUB.renderDot();
  }
  function onDeliver() { if (on()) { st().thr += 1; save(); } }
  const ready = () => on() && st().thr >= FASH_COST && FASHION.some(c => known(c) && got(c) < 8);

  /* пошити одну річ */
  function pull() {
    const s = st(), c = coll(s.sel);
    if (!c || !known(c)) return;
    if (got(c) >= 8) { sfx.nope(); toast("Колекцію вже зібрано — обери іншу"); return; }
    if (s.thr < FASH_COST) { sfx.nope(); toast(`Треба ${FASH_COST} 🪢 — клаптики дають за замовлення й завдання`); return; }
    s.thr -= FASH_COST;
    const h = s.have[c.id] = s.have[c.id] || {};
    // речі, яких ще немає, випадають утричі частіше — щоб колекцію можна було зібрати за кілька днів
    const w = FASH_W.map((x, k) => x * (h[k] ? 1 : 3)), total = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * total, i = 0;
    while (r >= w[i]) { r -= w[i]; i++; }
    const fresh = !h[i];
    h[i] = (h[i] || 0) + 1;
    if (!fresh) s.thr += FASH_DUP;
    save(); sfx.open();
    reveal(c, i, fresh);
  }
  function reveal(c, i, fresh) {
    const rare = FASH_W[i] < 10;
    modal({ title: fresh ? "Нова річ! ✨" : "Повтор",
      html: `<div class="fs-reveal${rare ? " rare" : ""}" style="--bg:${c.bg}"><span>${fashIcon(c, i)}</span></div>` +
        `<p><b>${c.items[i][1]}</b><br><small>«${c.name}» · ${got(c)}/8</small></p>` +
        (fresh ? (rare ? `<p class="hint-s">${FASH_W[i] <= 2 ? "Найрідкісніша річ колекції! 🌟" : "Рідкісна річ! ⭐"}</p>` : "") : `<p class="hint-s">Така вже є — повертаю ${FASH_DUP} 🪢</p>`),
      buttons: [{ label: "Далі ›", onClick: () => { if (got(c) >= 8 && !st().done[c.id]) complete(c); else panel(); } }] });
  }
  function complete(c) {
    const s = st(); s.done[c.id] = true; s.wear[c.host] = c.id;
    const r = FASH_REWARD;
    placeItem({ c: "chest", l: r.chest }); S.coins += r.coins; S.stars += r.stars;
    if (S.fr && FRIENDS[c.host]) S.fr[c.host] = Math.min(FRIEND_STEPS[2], (S.fr[c.host] || 0) + r.hearts);
    save(); renderAll(); confetti(); sfx.level();
    const all = FASHION.every(x => s.done[x.id]);
    playDialog([[c.host, pick([
      "Ой, яке ж гарне! Я в цьому вбранні — як на свято 🥹 Дякую тобі, {name}!",
      "Подивись-но на мене! Тепер хоч на ярмарок, хоч на весілля 💃",
      "Ніколи в мене такого стрóю не було… Ти — справжня чарівниця, {name} 💛"])]], () => modal({
      title: "Колекцію зібрано! 👗",
      html: `<div class="big-emoji">${c.icon}</div><p>«${c.name}» — повна! ${CHARS[c.host].name} тепер у новому строї${FASH_LOOKS.includes(c.host + "-" + c.id) ? " — подивись у дворику 🏡" : "."}</p>` +
        `<p class="rewards">💝 &nbsp; +${r.coins} 🪙 &nbsp; +${r.stars} ⭐ &nbsp; +${r.hearts} 💛</p>` +
        (FASH_LOOKS.includes(c.host + "-" + c.id) ? "" : `<p class="hint-s">Мальована фігура в цьому строї з'явиться, щойно її намалюємо 🎨</p>`),
      buttons: [{ label: all ? "Ще одна новина ›" : "Чудово! 💛", onClick: () => all && !s.allDone ? allDone() : panel() }] }));
  }
  function allDone() {
    const s = st(); s.allDone = true; const r = FASH_ALL;
    placeItem({ c: "chest", l: r.chest }); S.coins += r.coins; S.stars += r.stars;
    save(); renderAll(); confetti(); sfx.level();
    modal({ title: "Увесь гардероб зібрано! 🏆", html: `<div class="big-emoji">👗</div><p>Ти одягла все село! Тепер на кожне свято сусіди вбираються в твої строї.</p><p class="rewards">💝 &nbsp; +${r.coins} 🪙 &nbsp; +${r.stars} ⭐</p>`, buttons: [{ label: "Неймовірно! 💛" }] });
  }
  function toggleWear(c) {
    const s = st(); s.wear[c.host] = s.wear[c.host] === c.id ? null : c.id;
    save(); sfx.pop(); toast(s.wear[c.host] ? `👗 ${CHARS[c.host].name.split(" ").pop()} вбирається у «${c.name}»` : "Повсякденний одяг");
    if (window.renderStory) renderStory();
    panel();
  }
  /* для дворика: яку фігуру показувати сусідові */
  function look(who) {
    if (!on() || !S.fash) return null;
    const c = S.fash.wear && S.fash.wear[who];
    return c && FASH_LOOKS.includes(who + "-" + c) ? who + "-" + c : null;
  }

  /* ---------- вікно ---------- */
  function panel(selId) {
    const s = st();
    if (selId) s.sel = selId;
    let c = coll(s.sel);
    if (!c || !known(c)) { c = FASHION.find(known) || FASHION[0]; s.sel = c.id; }
    const tiles = FASHION.map(x => {
      const k = known(x), n = got(x);
      return `<button class="fs-col${x.id === c.id ? " on" : ""}${k ? "" : " locked"}" data-id="${x.id}" style="--bg:${x.bg}">` +
        `<span class="fs-face">${k ? face(CHARS[x.host], "mini") : "🔒"}</span><b>${x.name}</b>` +
        `<i class="dq-bar"><b style="width:${n / 8 * 100}%"></b></i><small>${s.done[x.id] ? "✅ зібрано" : n + "/8"}</small></button>`;
    }).join("");
    const h = s.have[c.id] || {};
    const items = c.items.map((it, i) => `<div class="fs-it${h[i] ? "" : " no"}${FASH_W[i] < 10 ? " r" + (FASH_W[i] <= 2 ? 3 : 2) : ""}"><span>${h[i] ? fashIcon(c, i) : "❔"}</span><small>${h[i] ? it[1] : FASH_W[i] <= 2 ? "★★★" : FASH_W[i] < 10 ? "★★" : "★"}</small></div>`).join("");
    const done = s.done[c.id], hasLook = FASH_LOOKS.includes(c.host + "-" + c.id);
    modal({ title: "Гардероб сусідів 👗",
      html: `<div class="fs-cols">${tiles}</div>` +
        `<div class="fs-cur" style="--bg:${c.bg}"><div class="fs-cur-h"><b>${c.icon} ${c.name}</b><small>для: ${CHARS[c.host].name}</small></div><div class="fs-items">${items}</div></div>` +
        (done ? `<button class="btn small fs-wear" id="fsWear">${s.wear[c.host] === c.id ? "👕 Зняти стрій" : "👗 Вдягти стрій"}${hasLook ? "" : " (фігура — скоро)"}</button>`
          : `<div class="fs-pull"><span class="fs-thr">🪢 <b>${s.thr}</b></span><button class="btn fs-go${s.thr >= FASH_COST ? "" : " dim"}" id="fsPull">Пошити річ · ${FASH_COST} 🪢</button></div>`) +
        `<p class="hint-s">Клаптики 🪢: замовлення +1, завдання дня +5, тиждень +15, вилазки +5, подарунки й листи. Повтор повертає ${FASH_DUP} 🪢.</p>`,
      buttons: [{ label: "Закрити", cls: "ghost" }] });
    document.querySelectorAll(".fs-col").forEach(b => b.onclick = () => { const x = coll(b.dataset.id); if (!known(x)) { sfx.nope(); toast(`${CHARS[x.host].name} з'явиться в історії пізніше`); return; } sfx.pop(); panel(x.id); });
    const p = $("fsPull"); if (p) p.onclick = pull;
    const w = $("fsWear"); if (w) w.onclick = () => toggleWear(c);
  }
  function card() {
    if (!on()) return null;
    const s = st(), n = FASHION.reduce((a, c) => a + got(c), 0);
    return { icon: "👗", title: "Гардероб сусідів", sub: `🪢 ${s.thr} клаптиків · ${n}/${FASHION.length * 8} речей`, btn: "Відкрити", act: "fashion", ready: ready() };
  }
  return { add, onDeliver, panel, card, ready, look };
})();
