"use strict";
/* ============================================================
   СВЯТКОВА ПОДІЯ (зараз — Свято Миколая)
   Стан у S.ev: { id, pts, got (скільки нагород видано), intro, ended }
   Для перевірки можна задати window.DVORYK_NOW (мітка часу).
   ============================================================ */
window.EV = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const inWindow = () => now() >= EVENT.start && now() < EVENT.end;
  const st = () => (S.ev && S.ev.id === EVENT.id ? S.ev : null);
  const active = () => !!st() && st().intro && !st().ended && inWindow();
  const ready = () => S && S.started && S.ordersDone >= 3;   // після навчання
  const busyUI = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");

  function daysLeft() {
    const ms = EVENT.end - now();
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5);
    return d >= 1 ? d + " дн" : h >= 1 ? h + " год" : Math.max(1, Math.ceil(ms / 6e4)) + " хв";
  }
  function nextMilestone() { return EVENT.milestones[st() ? st().got : 0]; }

  /* ---------- старт і завершення ---------- */
  function tick() {
    if (!ready() || busyUI()) return;
    if (inWindow() && !st()) {
      S.ev = { id: EVENT.id, pts: 0, got: 0, intro: false, ended: false };
    }
    const e = st();
    if (!e) return;
    if (inWindow() && !e.intro) {
      e.intro = true;
      placeItem({ g: EVENT.gen });
      save(); renderAll(); renderButton();
      playDialog(EVENT.story.intro, () => {
        modal({ title: EVENT.title + " 🎁", html: panelHtml(), buttons: [{ label: "Почнімо! ❄️" }] });
      });
      return;
    }
    if (!inWindow() && e.intro && !e.ended) finish();
  }

  function finish() {
    const e = st();
    e.ended = true;
    let coins = 0, n = 0;
    S.board.forEach((it, i) => {
      if (!it) return;
      if (it.g === EVENT.gen) { S.board[i] = null; return; }
      if (it.c === EVENT.chain) { coins += Math.max(1, Math.round(itemValue(it.c, it.l) / 2)); n++; S.board[i] = null; }
    });
    S.inbox = S.inbox.filter(it => {
      if (it.g === EVENT.gen) return false;
      if (it.c === EVENT.chain) { coins += Math.max(1, Math.round(itemValue(it.c, it.l) / 2)); n++; return false; }
      return true;
    });
    S.orders = S.orders.filter(o => !o.ev);
    S.coins += coins;
    fillOrders(); save(); renderAll(); renderButton();
    modal({
      title: "Свято минуло ❄️",
      html: `<div class="big-emoji">🎁</div><p>Ти зібрала <b>${e.pts} ❄️</b> і отримала ${e.got} з ${EVENT.milestones.length} нагород.</p>` +
        (n ? `<p class="hint-s">Залишки подарунків (${n} шт.) обміняно на ${coins} 🪙</p>` : ""),
      buttons: [{ label: "Дякую 💛", onClick: () => playDialog(EVENT.story.ending) }]
    });
  }

  /* ---------- замовлення ---------- */
  function maybeOrder() {
    if (!active()) return null;
    if (S.orders.some(o => o.ev)) return null;
    if (Math.random() > 0.75) return null;
    const busy = S.orders.map(o => o.ch);
    const who = EVENT.who.filter(c => !busy.includes(c) && (CHARS[c].from || 0) <= S.chapter);
    const ch = who.length ? pick(who) : null;
    if (!ch) return null;
    const max = S.level < 8 ? 3 : 4;
    const items = [{ c: EVENT.chain, l: 1 + rnd(max) }];
    if (S.level >= 10 && Math.random() < 0.3) items.push({ c: EVENT.chain, l: 1 + rnd(2) });
    let coins = 0, xp = 0, pts = 0;
    items.forEach(it => { coins += itemValue(it.c, it.l) * 2; xp += (it.l + 1) * 3; pts += it.l + 1; });
    return { id: ++S.orderSeq, ch, items, coins, xp, stars: 1, pts, ev: true, line: rnd(3) };
  }

  function onDeliver(o, card) {
    const e = st(); if (!e) return;
    e.pts += o.pts || 0;
    if (card && typeof flyIcon === "function") {
      const from = card.getBoundingClientRect(), to = $("evBtn").getBoundingClientRect();
      for (let k = 0; k < 4; k++) flyIcon("❄️", from, to, { delay: 300 + k * 80, size: 22, dur: 650, end: 0.6, lift: 50 });
    }
    setTimeout(() => { renderButton(); grantMilestones(); }, 900);
  }

  function rewardText(r) {
    const p = [];
    if (r.energy) p.push("+" + r.energy + " ⚡");
    if (r.coins) p.push("+" + r.coins + " 🪙");
    if (r.stars) p.push("+" + r.stars + " ⭐");
    if (r.chest !== undefined) p.push(CHAINS.chest.items[r.chest][0]);
    return p.join(" &nbsp; ");
  }
  function grantMilestones() {
    const e = st(); if (!e || busyUI()) return;
    const m = EVENT.milestones[e.got];
    if (!m || e.pts < m.pts) return;
    e.got++;
    const r = m.reward;
    if (r.energy) { regen(); S.energy += r.energy; }
    if (r.coins) S.coins += r.coins;
    if (r.stars) S.stars += r.stars;
    if (r.chest !== undefined) placeItem({ c: "chest", l: r.chest });
    save(); renderAll(); renderButton();
    confetti(); sfx.level();
    modal({
      title: e.got === EVENT.milestones.length ? "Свято зібрано! 🎉" : "Нагорода свята! ❄️",
      html: `<div class="big-emoji">🎁</div><p>Ти зібрала ${m.pts} ❄️ — тримай:</p><p class="rewards">${rewardText(r)}</p>`,
      buttons: [{ label: "Дякую! 💛", onClick: () => {
        const next = () => setTimeout(grantMilestones, 300);
        if (m.story) playDialog(EVENT.story[m.story], next); else next();
      } }]
    });
  }

  /* ---------- кнопка й панель ---------- */
  function renderButton() {
    const b = $("evBtn"); if (!b) return;
    const on = active();
    b.hidden = !on;
    if (!on) return;
    const e = st(), m = nextMilestone(), prev = e.got ? EVENT.milestones[e.got - 1].pts : 0;
    $("evTime").textContent = daysLeft();
    $("evBar").style.width = (m ? Math.min(100, (e.pts - prev) / (m.pts - prev) * 100) : 100) + "%";
    b.classList.toggle("done", !m);
  }
  function panelHtml() {
    const e = st();
    const rows = EVENT.milestones.map((m, k) => {
      const got = e && k < e.got;
      return `<div class="ev-ms${got ? " got" : e && e.pts >= m.pts ? " ready" : ""}"><span class="ev-pts">${m.pts} ❄️</span>` +
        `<span class="ev-rw">${rewardText(m.reward)}</span><span class="ev-ok">${got ? "✅" : "🔒"}</span></div>`;
    }).join("");
    const m = e && nextMilestone();
    return `<p>Допоможи Ірині й Марічці зібрати подарунки для сільських дітей! Тапай скриньку 📮, об'єднуй подарунки й віддавай їм.</p>
      <p class="ev-sum"><b>${e ? e.pts : 0} ❄️</b>${m ? ` · до наступної нагороди ще ${m.pts - e.pts} ❄️` : " · усі нагороди зібрано! 🎉"}<br><small>До свята: ${daysLeft()}</small></p>
      <div class="ev-list">${rows}</div>`;
  }
  function panel() {
    modal({ title: EVENT.title + " 🎁", html: panelHtml(),
      buttons: [{ label: "Зрозуміло" }, { label: "📜 Історія свята", cls: "ghost", onClick: () => playDialog(EVENT.story.intro) }] });
  }

  return { tick, maybeOrder, onDeliver, renderButton, panel, active, finish };
})();
