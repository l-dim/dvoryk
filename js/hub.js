"use strict";
/* ============================================================
   ПОДІЇ 🎪 — вкладка з усім, що відбувається: конкурс, рибалка, гриби,
   сезонна стежка, альбом, котик, пригода сусіда.
   СКАРБНИЧКА 💎 — справжні покупки (енергія, монетки, доповнення).
   Поки що гроші НЕ підключені: PAY_MODE = "soon" — кнопки показують ціну
   й пояснюють, що оплата ще не працює.
     "free" — тестовий режим: покупка видається без оплати (для перевірки);
     "live" — справжня оплата через window.DVORYK_PAY(offer) → Promise<boolean>
              (підключимо пізніше: Apple Pay / Stripe / Monobank тощо).
   ============================================================ */
const PAY_MODE = window.DVORYK_PAY_MODE || "soon";
const PAY_OFFERS = [
  { id: "en60",   icon: "⚡", title: "Жменька енергії",   sub: "+60 ⚡",                     price: 39,  give: { energy: 60 } },
  { id: "en160",  icon: "🔋", title: "Відро енергії",     sub: "+160 ⚡",                    price: 89,  give: { energy: 160 }, tag: "вигідно" },
  { id: "unlim",  icon: "☀️", title: "Година без меж",    sub: "енергія не витрачається 60 хв", price: 69, give: { unlim: 60 } },
  { id: "co1500", icon: "💰", title: "Мішечок монет",     sub: "+1500 🪙",                   price: 49,  give: { coins: 1500 } },
  { id: "co5000", icon: "👛", title: "Скриня монет",      sub: "+5000 🪙",                   price: 129, give: { coins: 5000 }, tag: "вигідно" },
  { id: "st10",   icon: "⭐", title: "Зірочки для ремонту", sub: "+10 ⭐",                   price: 59,  give: { stars: 10 } },
  { id: "store3", icon: "🗄️", title: "Три полиці у сховок", sub: "+3 місця назавжди",        price: 49,  give: { store: 3 } },
  { id: "rest60", icon: "☕", title: "Друге дихання",     sub: "+1 година гри без перепочинку", price: 49, give: { rest: 60 } },
  { id: "pack",   icon: "💝", title: "Набір господині",   sub: "100 ⚡ · 2000 🪙 · 💝 · 5 ⭐",  price: 149, give: { energy: 100, coins: 2000, chest: 2, stars: 5 }, tag: "хіт" }
];

window.PAY = (() => {
  const fmt = p => p + " ₴";
  function grant(g) {
    const p = [];
    if (g.energy) { regen(); S.energy += g.energy; p.push("+" + g.energy + " ⚡"); }
    if (g.coins) { S.coins += g.coins; p.push("+" + g.coins + " 🪙"); }
    if (g.stars) { S.stars += g.stars; p.push("+" + g.stars + " ⭐"); }
    if (g.chest !== undefined) { placeItem({ c: "chest", l: g.chest }); p.push(CHAINS.chest.items[g.chest][0]); }
    if (g.unlim) { S.unlimUntil = Math.max(Date.now(), S.unlimUntil || 0) + g.unlim * 60e3; p.push("☀️ " + g.unlim + " хв без меж"); }
    if (g.rest && window.REST) { REST.refill(g.rest); p.push("☕ +" + g.rest + " хв гри"); }
    if (g.store) { S.store = S.store || { slots: 3, items: [] }; S.store.slots += g.store; p.push("+" + g.store + " 🗄️"); }
    save(); renderAll(); confetti(); sfx.level();
    return p.join(" &nbsp; ");
  }
  async function buy(id) {
    const o = PAY_OFFERS.find(x => x.id === id); if (!o) return;
    if (PAY_MODE === "soon") {
      modal({ title: "Скоро 💎", html: `<div class="big-emoji">${o.icon}</div><p><b>${o.title}</b> — ${o.sub}</p><p>Справжні покупки ще не підключені, тож гроші ніде не списуються 🙂</p><p class="hint-s">Поки що все в грі — за монетки 🪙, зірочки ⭐ і терпіння ☕</p>`,
        buttons: [{ label: "Зрозуміло" }] });
      return;
    }
    if (PAY_MODE === "free") {
      modal({ title: "Тестова покупка", html: `<div class="big-emoji">${o.icon}</div><p><b>${o.title}</b> (${fmt(o.price)}) — у тестовому режимі видається без оплати.</p>`,
        buttons: [{ label: "Отримати", onClick: () => modal({ title: "Готово! 💝", html: `<div class="big-emoji">${o.icon}</div><p class="rewards">${grant(o.give)}</p>`, buttons: [{ label: "Дякую!" }] }) }, { label: "Скасувати", cls: "ghost" }] });
      return;
    }
    // "live": оплату проводить зовнішній обробник
    try {
      const ok = typeof window.DVORYK_PAY === "function" && await window.DVORYK_PAY({ id: o.id, title: o.title, price: o.price, currency: "UAH" });
      if (ok) modal({ title: "Дякуємо! 💝", html: `<div class="big-emoji">${o.icon}</div><p class="rewards">${grant(o.give)}</p>`, buttons: [{ label: "Ура!" }] });
      else toast("Покупку скасовано");
    } catch (e) { toast("Оплата не вдалася 🙈 Гроші не списано"); }
  }
  function html() {
    return `<div class="pay-sec"><div class="pay-h"><b>💎 Скарбничка</b><small>${PAY_MODE === "live" ? "справжні покупки" : "справжні покупки — ще не підключені"}</small></div>` +
      `<div class="pay-grid">${PAY_OFFERS.map(o => `<button class="pay-card" data-id="${o.id}">${o.tag ? `<i class="pay-tag">${o.tag}</i>` : ""}<span class="pay-ic">${o.icon}</span>` +
        `<b>${o.title}</b><small>${o.sub}</small><span class="pay-price">${fmt(o.price)}</span></button>`).join("")}</div></div>`;
  }
  function bind(root) { root.querySelectorAll(".pay-card").forEach(b => b.onclick = () => buy(b.dataset.id)); }
  const unlimLeft = () => Math.max(0, (S.unlimUntil || 0) - Date.now());
  /* вікно з кількома пропозиціями (коли скінчилась енергія чи сили) */
  function offers(ids, title, lead = "") {
    const list = PAY_OFFERS.filter(o => ids.includes(o.id));
    modal({ title, html: (lead ? `<p>${lead}</p>` : "") + `<div class="pay-grid">${list.map(o => `<button class="pay-card" data-id="${o.id}">${o.tag ? `<i class="pay-tag">${o.tag}</i>` : ""}<span class="pay-ic">${o.icon}</span>` +
      `<b>${o.title}</b><small>${o.sub}</small><span class="pay-price">${fmt(o.price)}</span></button>`).join("")}</div>` +
      (PAY_MODE === "live" ? "" : `<p class="hint-s">Справжні покупки ще не підключені — гроші ніде не списуються.</p>`),
      buttons: [{ label: "Не зараз", cls: "ghost" }] });
    bind($("modal"));
  }
  return { html, bind, buy, unlimLeft, grant, offers };
})();

/* ============================================================ */
window.HUB = (() => {
  const lvlOf = id => (UNLOCKS.find(u => u.id === id) || {}).lvl;
  const on = id => window.UNL && UNL.on(id);
  const hm = ms => { const t = Math.ceil(ms / 6e4), h = Math.floor(t / 60), m = t % 60; return h ? h + " год " + m + " хв" : m + " хв"; };
  function cards() {
    const out = [];
    const lock = (icon, title, id) => ({ icon, title, sub: "🔒 відкриється на рівні " + lvlOf(id), locked: true });
    // конкурс
    if (on("contest")) { const c = CONTEST.card(); out.push(Object.assign(c, { act: "contest", btn: "Відкрити" })); }
    else out.push(lock("🏆", "Кулінарний конкурс", "contest"));
    // образ дня
    if (on("look")) out.push(LOOK.card());
    else out.push(lock("💃", "Образ дня", "look"));
    // гардероб
    if (on("fashion")) out.push(FASH.card());
    else out.push(lock("👗", "Гардероб сусідів", "fashion"));
    // виклик енергії
    if (on("ech")) out.push(ECH.card());
    else out.push(lock("⚡", "Виклик енергії", "ech"));
    if (window.RARE) out.unshift(...RARE.cards());
    if (window.TP && TP.card()) out.unshift(TP.card());
    if (window.SEAS && SEAS.card()) out.unshift(SEAS.card());
    if (window.WOOD && WOOD.card()) out.unshift(WOOD.card());
    if (window.LOVE && LOVE.card()) out.unshift(LOVE.card());
    (window.HUB_EXTRA || []).forEach(f => { const c = f(); if (c) (c.locked ? out.push(c) : out.unshift(c)); });
    // толока
    if (on("toloka")) { const c = TOLOKA.card(); out.push(c); }
    else out.push(lock("🥄", "Толока вихідного дня", "toloka"));
    // медалі
    if (on("medals")) out.push(MEDAL.card());
    else out.push(lock("🏅", "Почесні медалі", "medals"));
    // вилазки
    ["fish", "mush"].forEach(id => {
      const k = SIDE.kinds().find(x => x.id === id);
      if (!on("outing")) { out.push(lock((GENS["side_" + id] || {}).icon || k.icon, k.title, "outing")); return; }
      let sub, btn, ready = false;
      if (S.side && S.side.kind === id) { sub = S.side.done ? "Ціль є — можна йти додому або ловити ще" : "Ти зараз тут"; btn = S.sideOn ? "Ти тут" : "Перейти"; ready = true; }
      else if (S.side) { sub = "Спершу заверши іншу пригоду"; btn = "—"; }
      else if (SIDE.canGo(id)) { sub = `${k.items[0][0]} → ${k.items[4][0]} · доба на дошці · нагорода 🎁 ⭐ 🪙`; btn = "Іти!"; ready = true; }
      else { sub = "Знову можна за " + hm(S.outNext[id] - Date.now()); btn = "⏳"; }
      out.push({ icon: (GENS["side_" + id] || {}).icon || k.icon, title: k.title, sub, btn, act: "out:" + id, ready });
    });
    // пригода сусіда
    if (S.side && !(SIDE.kinds().find(x => x.id === S.side.kind) || {}).outing) {
      const k = SIDE.kinds().find(x => x.id === S.side.kind);
      out.push({ icon: CHAINS["side_" + k.id].items[0][0], title: "Пригода: " + k.title, sub: "до кінця " + hm(S.side.until - Date.now()), btn: S.sideOn ? "Ти тут" : "Перейти", act: "side", ready: true });
    }
    // стежка
    if (on("path")) { const s = PATH.season(); out.push({ icon: s.icon, title: s.name, sub: PATH.ready() ? "Є нагорода — забирай!" : "Кроки за замовлення й завдання", btn: "Відкрити", act: "path", ready: PATH.ready() }); }
    else out.push(lock("🍂", "Сезонна стежка", "path"));
    // котик
    if (on("cat")) out.push({ icon: CAT_ICON, title: "Котик на скрині", sub: `🐾 ${XTRA.catProg()} до скрині · приходить без черги з рідкісними замовленнями`, act: "", btn: "" });
    else out.push(lock(CAT_ICON, "Котик на скрині", "cat"));
    // альбом
    if (on("album")) out.push({ icon: "💌", title: "Альбом листівок", sub: `${ALB.haveN()} з 36 листівок`, btn: "Відкрити", act: "album" });
    else out.push(lock("💌", "Альбом листівок", "album"));
    return out;
  }
  function render() {
    const box = $("hubList"); if (!box) return;
    box.innerHTML = gx(cards().map((c, i) => `<div class="hub-card${c.locked ? " locked" : ""}${c.ready ? " ready" : ""}"><span class="hub-ic">${c.icon}</span>` +
      `<span class="hub-mid"><b>${c.title}</b><small>${c.sub}</small></span>` +
      (c.btn ? `<button class="s-btn hub-go${c.btn === "⏳" || c.btn === "—" || c.btn === "Ти тут" ? " dim" : ""}" data-act="${c.act}">${c.btn}</button>` : "") + `</div>`).join(""));
    box.querySelectorAll(".hub-go").forEach(b => b.onclick = () => act(b.dataset.act));
    renderDot();
  }
  function act(a) {
    sfx.pop();
    if (a === "contest") CONTEST.show();
    else if (a.startsWith("out:")) {
      const id = a.slice(4);
      if (S.side && S.side.kind === id) { if (!S.sideOn) { SIDE.enter(); SIDE.renderButton(); showTab("board"); } return; }
      SIDE.goOut(id); showTab("board");
    }
    else if (a === "side") { if (!S.sideOn) { SIDE.enter(); SIDE.renderButton(); } showTab("board"); }
    else if (a === "path") QUEST.panel("path");
    else if (a === "album") ALB.panel();
    else if (a === "toloka") TOLOKA.panel();
    else if (a === "ech") ECH.panel();
    else if (a === "flash") RARE.panel();
    else if (a === "big") TP.panel();
    else if (a === "love-gift") LOVE.giveGift();
    else if (a === "wood") { if (!S.woodOn) WOOD.enter(); showTab("board"); }
    else if (a === "fashion") FASH.panel();
    else if (a === "look") LOOK.panel();
    else if (a === "medals") MEDAL.panel();
    else if (window.HUB_ACTS && HUB_ACTS[a]) HUB_ACTS[a]();
  }
  function renderDot() {
    const d = $("navHubDot"); if (!d || !S) return;
    const outReady = on("outing") && !S.side && ["fish", "mush"].some(id => SIDE.canGo(id));
    const md = $("menuDot");
    d.hidden = !(outReady || (window.PATH && PATH.ready()) || (window.TOLOKA && TOLOKA.ready()) || (window.MEDAL && MEDAL.ready()) || (window.ECH && ECH.ready()) || (window.FASH && FASH.ready()));
    if (md) md.hidden = [...document.querySelectorAll(".nav .dot")].every(x => x.hidden);
  }
  return { render, renderDot };
})();
