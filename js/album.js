"use strict";
/* ============================================================
   АЛЬБОМ ЛИСТІВОК 💌
   Листівки падають за замовлення, подарунки, завдання й котика.
   6 наборів по 6 листівок; рідкість ★ / ★★ / ★★★.
   Повтори дають «марочки» 📮 — за них можна обміняти нову листівку.
   Стан: S.alb = { have: { id: кількість }, stamps, sets: { набір: true }, all }
   ============================================================ */
const ALBUM = [
  { id: "garden", name: tt`Город`,       icon: "🌻", cards: [["🥕", tt`Морквина`], ["🍅", tt`Помідор`], ["🥒", tt`Огірочок`], ["🌽", tt`Качанчик`], ["🎃", tt`Гарбуз`], ["🌻", tt`Соняшник`]] },
  { id: "home",   name: tt`Хата`,        icon: "🏡", cards: [["🫖", tt`Чайник`], ["🧺", tt`Кошик`], ["🕯️", tt`Свічечка`], ["🧸", tt`Ведмедик`], ["🖼️", tt`Картина`], ["🛏️", tt`Перина`]] },
  { id: "nature", name: tt`Природа`,     icon: "🌳", cards: [["🐞", tt`Сонечко`], ["🐝", tt`Бджілка`], ["🦋", tt`Метелик`], ["🦔", tt`Їжачок`], ["🌳", tt`Старий дуб`], ["🦢", tt`Лебідь`]] },
  { id: "craft",  name: tt`Ремесла`,     icon: "🧵", cards: [["🧵", tt`Нитки`], ["🪡", tt`Голка`], ["🧶", tt`Клубок`], ["🧣", tt`Шарф`], ["🏺", tt`Глечик`], ["🎻", tt`Скрипка`]] },
  { id: "food",   name: tt`Смаколики`,   icon: "🥟", cards: [["🍞", tt`Паляниця`], ["🥛", tt`Молоко`], ["🍒", tt`Вишні`], ["🥞", tt`Млинці`], ["🥟", tt`Вареники`], ["🍰", tt`Торт`]] },
  { id: "holy",   name: tt`Свята`,       icon: "🎄", cards: [["🔔", tt`Дзвіночок`], ["🍯", tt`Мед`], ["🥚", tt`Писанка`], ["🎄", tt`Ялинка`], ["🕊️", tt`Голубка`], ["⭐", tt`Різдвяна зірка`]] }
];
const ALB_RARE = k => (k < 3 ? 1 : k < 5 ? 2 : 3);        // позиція в наборі → кількість зірок
const ALB_SET_REWARD = { coins: 150, chest: 1, stars: 2 };
const ALB_ALL_REWARD = { coins: 600, chest: 2, stars: 8 };
const ALB_SWAP = 12;
const ALB_ART = true;                                       // усі 36 листівок мальовані                                        // марочок за обмін

window.ALB = (() => {
  const on = () => window.UNL && UNL.on("album");
  const st = () => (S.alb || (S.alb = { have: {}, stamps: 0, sets: {}, all: false }));
  const cid = (s, k) => s.id + ":" + k;
  const total = ALBUM.length * 6;
  const haveN = () => ALBUM.reduce((n, s) => n + s.cards.filter((_, k) => st().have[cid(s, k)]).length, 0);
  const pending = [];

  function roll(minRare = 1) {
    const r = Math.random();
    let rare = r < 0.07 ? 3 : r < 0.32 ? 2 : 1;
    rare = Math.max(rare, minRare);
    const pool = [];
    ALBUM.forEach(s => s.cards.forEach((_, k) => { if (ALB_RARE(k) === rare) pool.push([s, k]); }));
    return pick(pool);
  }
  /* видати n листівок; why — звідки (для заголовка) */
  function give(n, why, minRare) {
    if (!on()) return [];
    const a = st(), got = [];
    for (let i = 0; i < n; i++) {
      const [s, k] = roll(i === n - 1 ? minRare || 1 : 1), id = cid(s, k);
      const fresh = !a.have[id];
      a.have[id] = (a.have[id] || 0) + 1;
      if (!fresh) a.stamps += ALB_RARE(k);
      got.push({ s, k, fresh });
    }
    save();
    got.forEach(g => checkSet(g.s));
    if (n === 1) {
      const g = got[0], c = g.s.cards[g.k];
      setTimeout(() => toast(g.fresh ? tt`💌 Нова листівка: ${c[0]} ${c[1]}!` : tt`💌 ${c[0]} ${c[1]} — повтор, +${ALB_RARE(g.k)} 📮`), 1200);
    } else pending.push({ got, why });
    renderNavBadge();
    return got;
  }
  function checkSet(s) {
    const a = st();
    if (a.sets[s.id] || !s.cards.every((_, k) => a.have[cid(s, k)])) return;
    a.sets[s.id] = true;
    pending.push({ set: s });
    if (!a.all && ALBUM.every(x => a.sets[x.id])) { a.all = true; pending.push({ all: true }); }
    save();
  }
  function cardHtml(s, k, extra = "") {
    const have = st().have[cid(s, k)] || 0, c = s.cards[k];
    // мальована листівка: items/pc-<набір>-<k>.webp (поки не знайдена — сіра й розмита)
    if (ALB_ART) return `<div class="pc art r${ALB_RARE(k)}${have ? "" : " no"}${extra}"><img src="items/pc-${s.id}-${k}.webp" alt="">` +
      `<small>${have ? c[1] : "★".repeat(ALB_RARE(k))}</small>${have > 1 ? `<i>×${have}</i>` : ""}</div>`;
    return `<div class="pc r${ALB_RARE(k)}${have ? "" : " no"}${extra}"><span class="pc-e">${have ? c[0] : "❔"}</span>` +
      `<small>${have ? c[1] : "★".repeat(ALB_RARE(k))}</small>${have > 1 ? `<i>×${have}</i>` : ""}</div>`;
  }
  function showNext() {
    const p = pending.shift();
    if (!p) return false;
    if (p.got) {
      sfx.open();
      modal({ title: tt`Листівки! 💌`,
        html: tt`<p>${p.why ? p.why + " — " : ""}${p.got.length} ${p.got.length < 5 ? tt`листівки` : tt`листівок`} у твій альбом:</p><div class="pc-row">${p.got.map(g => cardHtml(g.s, g.k, g.fresh ? " fresh" : "")).join("")}</div>` +
          (p.got.some(g => !g.fresh) ? tt`<p class="hint-s">Повтори перетворилися на марочки 📮 — за ${ALB_SWAP} 📮 можна обміняти нову листівку.</p>` : ""),
        buttons: [{ label: tt`До альбому 💌`, onClick: () => panel() }, { label: tt`Добре`, cls: "ghost" }] });
    } else if (p.set) {
      const r = ALB_SET_REWARD;
      placeItem({ c: "chest", l: r.chest }); S.coins += r.coins; S.stars += r.stars;
      save(); renderAll(); confetti(); sfx.level();
      modal({ title: tt`Набір зібрано! 💌`,
        html: tt`<div class="big-emoji">${p.set.icon}</div><p>Набір «${p.set.name}» повний!</p><p class="rewards">📦 &nbsp; +${r.coins} 🪙 &nbsp; +${r.stars} ⭐</p>`,
        buttons: [{ label: tt`Ура! 💛` }] });
    } else if (p.all) {
      const r = ALB_ALL_REWARD;
      placeItem({ c: "chest", l: r.chest }); S.coins += r.coins; S.stars += r.stars;
      save(); renderAll(); confetti(); sfx.level();
      playDialog([["ivan", tt`Увесь альбом зібрала?! {name}, такого на нашій пошті ще не бачили! 📮💛`]], () =>
        modal({ title: tt`Альбом повний! 🏆`, html: tt`<div class="big-emoji">📮</div><p>Усі ${total} листівок — твої!</p><p class="rewards">💝 &nbsp; +${r.coins} 🪙 &nbsp; +${r.stars} ⭐</p>`, buttons: [{ label: tt`Неймовірно! 💛` }] }));
    }
    return true;
  }
  function swap() {
    const a = st();
    const miss = [];
    ALBUM.forEach(s => s.cards.forEach((_, k) => { if (!a.have[cid(s, k)]) miss.push([s, k]); }));
    if (!miss.length || a.stamps < ALB_SWAP) { sfx.nope(); return; }
    a.stamps -= ALB_SWAP;
    // обмін дає найпростішу з бракуючих — зірочки рідкісних треба шукати самій
    miss.sort((x, y) => ALB_RARE(x[1]) - ALB_RARE(y[1]));
    const low = miss.filter(m => ALB_RARE(m[1]) === ALB_RARE(miss[0][1]));
    const [s, k] = pick(low);
    a.have[cid(s, k)] = 1;
    save(); sfx.open();
    toast(tt`📮 Обмін: ${s.cards[k][0]} ${s.cards[k][1]}!`);
    checkSet(s);
    panel();
  }
  function panel() {
    const a = st();
    const sets = ALBUM.map(s => {
      const n = s.cards.filter((_, k) => a.have[cid(s, k)]).length;
      return `<div class="pc-set${a.sets[s.id] ? " done" : ""}"><div class="pc-h"><b>${s.icon} ${s.name}</b><small>${a.sets[s.id] ? tt`✅ зібрано` : n + "/6 · 📦 +" + ALB_SET_REWARD.coins + "🪙"}</small></div>` +
        `<div class="pc-row">${s.cards.map((_, k) => cardHtml(s, k)).join("")}</div></div>`;
    }).join("");
    const canSwap = a.stamps >= ALB_SWAP && haveN() < total;
    modal({ title: tt`Альбом листівок 💌 ${haveN()}/${total}`,
      html: tt`<div class="pc-stamps">📮 Марочки: <b>${a.stamps}</b> <button class="s-btn${canSwap ? "" : " dim"}" id="pcSwap">Обміняти за ${ALB_SWAP} 📮</button></div>` +
        tt`<div class="pc-sets">${sets}</div><p class="hint-s">Листівки дають за замовлення сусідів, подарунки, завдання й котика 🐾. ★★★ — найрідкісніші.</p>`,
      buttons: [{ label: tt`Закрити`, cls: "ghost" }] });
    $("pcSwap").onclick = () => { if (a.stamps < ALB_SWAP) { sfx.nope(); toast(tt`Треба ${ALB_SWAP} 📮 — повтори листівок дають марочки`); return; } swap(); };
  }
  function entryHtml() {
    if (!on()) return "";
    return tt`<button class="alb-entry" id="albOpen"><span class="alb-ic">💌</span><span class="alb-mid"><b>Альбом листівок</b><small>${haveN()} з ${total} · 📮 ${st().stamps}</small></span><span class="alb-go">›</span></button>`;
  }

  /* ---------- звідки падають ---------- */
  function onDeliver(o) {
    if (!on()) return;
    const sure = o.paw || o.urgent || o.dish || o.ev;
    if (sure || Math.random() < 0.12) give(1);
  }
  function onChest(level) {
    if (!on()) return;
    const n = [Math.random() < 0.15 ? 1 : 0, 1, 2][level] || 0;
    if (n) give(n, n > 1 ? tt`Зі скрині` : "");
  }

  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  function tick() { if (pending.length && !busyUI()) showNext(); }

  return { give, panel, entryHtml, onDeliver, onChest, tick, haveN };
})();
