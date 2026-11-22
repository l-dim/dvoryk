"use strict";
/* ============================================================
   НАРОДНІ МАЙСТЕР-КЛАСИ 🥚🌼🧵 — короткі спокійні міні-ігри «за зразком».
   • Писанка (Великдень): розфарбуй пояски яйця, як на зразку.
   • Купальський вінок (Трійця, Купала): вплети квіти по колу в тому самому порядку.
   • Вишитий рушник: виший хрестиком орнамент за зразком (червоне й чорне).
   Кожен — раз на добу. На своє свято нагорода подвійна. Без помилок з першої спроби — більша.
   Готова річ — у дворик (прикраса) або в подарунок сусідові (+💛 дружби).
   Стан: S.folk = { <id>: { day, n } }
   ============================================================ */
const FOLK = {
  pysanka: { title: "Писанка", icon: "🥚", host: "halya", hol: ["velykden"], decor: ["🥚", "Писанка", 5],
    intro: "Сідай поруч, {name}. Писанку пишуть із молитвою й тишею в душі. Дивись на зразок — і фарбуй пояски так само 🥚",
    palette: ["#c62828", "#f9a825", "#1b1b1b", "#2e7d32", "#1565c0", "#fafafa"] },
  vinok: { title: "Купальський вінок", icon: "🌼", host: "liza", hol: ["kupala", "triytsia"], decor: ["🏵️", "Купальський вінок", 6],
    intro: "Вінок плетуть по колу, квітка до квітки 🌼 Подивись, як на зразку, — і вплітай у тому ж порядку!",
    palette: ["🌼", "🌸", "🌻", "🪻", "🌿", "🌺"] },
  rushnyk: { title: "Вишитий рушник", icon: "🧵", host: "olya", hol: ["pokrova", "rizdvo", "nezalezhnist"], decor: ["📜", "Вишитий рушник", 6],
    intro: "Рушник вишивають хрестиком — червоним і чорним, як бабусі вчили 🧵 Повтори орнамент зі зразка клітинка в клітинку.",
    palette: ["#c62828", "#1b1b1b", "#fffaf0"] }
};
const FOLK_REWARD = { coins: 60, stars: 1 }, FOLK_GIFT_COINS = 50;

if (typeof DECOR_SHOP !== "undefined") Object.values(FOLK).forEach(g => { if (!DECOR_SHOP.some(x => x[0] === g.decor[0])) DECOR_SHOP.push([g.decor[0], g.decor[1], 0, g.decor[2], "souv"]); });
if (typeof UNLOCKS !== "undefined") UNLOCKS.push({ id: "folk", lvl: 12, icon: "🥚", title: "Народні майстер-класи",
  text: "Розпиши писанку, сплети купальський вінок, виший рушник — за зразком, спокійно, без поспіху. Кожен майстер-клас — раз на добу, на своє свято нагорода подвійна. Готову річ ставиш у дворик або даруєш сусідові. Шукай у «Подіях».",
  lines: [["halya", "{name}, а я ж колись найкращі писанки в селі писала 🥚 Хочеш, навчу? І Оля рушники вишиває, і Ліза вінки плете!"]] });
if (typeof GUIDE_BASICS !== "undefined") GUIDE_BASICS.push(["🥚", "Народні майстер-класи",
  "У «Подіях»: писанка, купальський вінок, вишитий рушник — міні-ігри «за зразком». Обери колір чи квітку внизу й тапай на поясок, місце у вінку чи клітинку рушника. Раз на добу кожен; на своє свято — подвійна нагорода. Готову річ — у дворик або в подарунок сусідові."]);

window.FOLKC = (() => {
  const on = () => window.UNL && UNL.on("folk");
  const now = () => window.DVORYK_NOW || Date.now();
  const today = () => { const d = new Date(now()); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const st = id => { S.folk = S.folk || {}; return (S.folk[id] = S.folk[id] || { day: "", n: 0 }); };
  const ready = id => st(id).day !== today();
  const festive = id => !!(window.EV && EV.active && EV.active() && FOLK[id].hol.includes(EVENT.key));
  const P = (f, m) => (S.sex === "m" ? m : f);
  let game = null;                                   // { id, target:[], cur:[], pick, tries }

  /* ---------- зразок ---------- */
  function makeTarget(id) {
    const pal = FOLK[id].palette, rnd = n => Math.floor(Math.random() * n);
    if (id === "pysanka") {                          // 7 поясків, дзеркально від середини
      const cols = [...pal].sort(() => Math.random() - 0.5).slice(0, 4);
      const a = [cols[0], cols[1], cols[2], cols[3]];
      return [a[0], a[1], a[2], a[3], a[2], a[1], a[0]];
    }
    if (id === "vinok") {                            // 8 квітів по колу з повтором (ABCA BCAB…)
      const fl = [...pal].sort(() => Math.random() - 0.5).slice(0, 3 + rnd(2));
      return Array.from({ length: 8 }, (_, k) => fl[k % fl.length]);
    }
    // рушник 9×5: ліва половина випадкова, права — дзеркальна; червоне й чорне на білому
    const W = 9, H = 5, out = Array(W * H).fill(pal[2]);
    for (let y = 0; y < H; y++) for (let x = 0; x <= 4; x++) {
      const r = Math.random(), c = r < 0.38 ? pal[0] : r < 0.52 ? pal[1] : pal[2];
      out[y * W + x] = c; out[y * W + (W - 1 - x)] = c;
    }
    for (let x = 0; x < W; x++) out[2 * W + x] = x % 2 ? pal[0] : out[2 * W + x];   // середня смуга — завжди орнамент
    return out;
  }
  const blank = id => id === "vinok" ? Array(8).fill("") : id === "pysanka" ? Array(7).fill("#efe6d6") : Array(45).fill(FOLK.rushnyk.palette[2]);

  /* ---------- малюємо поле ---------- */
  const EGG = "M50 4 C78 4 94 50 94 80 C94 108 74 126 50 126 C26 126 6 108 6 80 C6 50 22 4 50 4 Z";
  const BANDS = [4, 26, 44, 60, 74, 90, 106, 126];
  function eggSvg(cols, live) {
    const bands = cols.map((c, k) => `<rect ${live ? `class="fk-z" data-z="${k}"` : ""} x="0" y="${BANDS[k]}" width="100" height="${BANDS[k + 1] - BANDS[k] + 0.5}" fill="${c}"/>`).join("");
    const zig = BANDS.slice(1, -1).map(y => `<polyline points="${Array.from({ length: 11 }, (_, i) => `${i * 10},${y + (i % 2 ? 3 : -3)}`).join(" ")}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.4"/>`).join("");
    return `<svg class="fk-egg${live ? " live" : ""}" viewBox="0 0 100 130"><defs><clipPath id="eggc${live ? "L" : "S"}"><path d="${EGG}"/></clipPath></defs>` +
      `<g clip-path="url(#eggc${live ? "L" : "S"})">${bands}${zig}</g><path d="${EGG}" fill="none" stroke="#7a4b23" stroke-width="2"/></svg>`;
  }
  function ring(cols, live) {
    const pos = cols.map((f, k) => { const a = -Math.PI / 2 + k * Math.PI / 4; return [50 + 36 * Math.cos(a), 50 + 36 * Math.sin(a)]; });
    return `<div class="fk-ring${live ? " live" : ""}"><span class="fk-hoop"></span>` + cols.map((f, k) =>
      `<span class="fk-fl${live ? " fk-z" : ""}" data-z="${k}" style="left:${pos[k][0]}%;top:${pos[k][1]}%">${f || "◯"}</span>`).join("") + `</div>`;
  }
  function grid(cols, live) {
    return `<div class="fk-grid${live ? " live" : ""}">` + cols.map((c, k) => `<span class="${live ? "fk-z" : ""}" data-z="${k}" style="background:${c}"></span>`).join("") + `</div>`;
  }
  const draw = (id, cols, live) => id === "pysanka" ? eggSvg(cols, live) : id === "vinok" ? ring(cols, live) : grid(cols, live);

  function render() {
    const g = game, F = FOLK[g.id];
    const pal = F.palette.map((p, k) => `<button class="fk-p${g.pick === k ? " on" : ""}" data-p="${k}" ${g.id === "vinok" ? "" : `style="background:${p}"`}>${g.id === "vinok" ? p : ""}</button>`).join("");
    modal({ title: F.title + " " + F.icon,
      html: `<div class="fk-wrap fk-${g.id}"><div class="fk-sample"><small>Зразок</small>${draw(g.id, g.target, false)}</div><div class="fk-work">${draw(g.id, g.cur, true)}</div></div>` +
        `<div class="fk-pal">${pal}</div><p class="hint-s" id="fkMsg">${g.msg || (g.id === "vinok" ? "Обери квітку й тапай місце у вінку" : g.id === "pysanka" ? "Обери фарбу й тапай поясок" : "Обери нитку й веди пальцем по клітинках (ще раз — розпороти)")}</p>`,
      buttons: [{ label: "Готово ✓", onClick: check }, { label: "Пізніше", cls: "ghost", onClick: () => { game = null; } }] });
    // натискання на модалку не закриваємо, а оновлюємо
    document.querySelectorAll(".fk-p").forEach(b => b.onclick = () => { g.pick = +b.dataset.p; document.querySelectorAll(".fk-p").forEach(x => x.classList.toggle("on", x === b)); sfx.pop(); });
    const paint = (z, toggle) => {
      const k = +z.dataset.z; let v = F.palette[g.pick];
      if (g.id === "rushnyk" && toggle && g.cur[k] === v) v = F.palette[2];        // повторний тап тим самим кольором — розпороти
      if (g.cur[k] === v) return;
      g.cur[k] = v; sfx.pop();
      if (g.id === "vinok") z.textContent = v; else if (g.id === "rushnyk") z.style.background = v; else z.setAttribute("fill", v);
    };
    if (g.id === "rushnyk") {                       // рушник вишиваємо, ведучи пальцем по клітинках
      const gr = document.querySelector(".fk-work .fk-grid"); let on = false;
      const at = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest && el.closest(".fk-work .fk-z"); };
      gr.addEventListener("pointerdown", e => { e.preventDefault(); on = true; const z = at(e); if (z) paint(z, true); });
      gr.addEventListener("pointermove", e => { if (!on) return; const z = at(e); if (z) paint(z, false); });
      ["pointerup", "pointercancel", "pointerleave"].forEach(t => gr.addEventListener(t, () => { on = false; }));
    } else document.querySelectorAll(".fk-work .fk-z").forEach(z => z.onclick = () => paint(z, false));
  }
  function start(id) {
    if (!ready(id)) { sfx.nope(); toast("Цей майстер-клас уже був сьогодні — приходь завтра 🌙"); return; }
    game = { id, target: makeTarget(id), cur: blank(id), pick: 0, tries: 0 };
    playDialog([[FOLK[id].host, FOLK[id].intro]], render);
  }
  function check() {
    const g = game; if (!g) return;
    const wrong = g.target.reduce((a, c, k) => a + (g.cur[k] !== c ? 1 : 0), 0);
    if (wrong) { g.tries++; g.msg = `Ще не зовсім так — відмінностей: <b>${wrong}</b>. Придивись до зразка 🙂`; sfx.nope(); render(); return; }
    finish();
  }
  function finish() {
    const g = game, F = FOLK[g.id], s = st(g.id); game = null;
    s.day = today(); s.n++;
    const mult = (festive(g.id) ? 2 : 1) * (g.tries === 0 ? 1.5 : 1);
    const coins = Math.round(FOLK_REWARD.coins * mult), stars = Math.max(1, Math.round(FOLK_REWARD.stars * mult));
    S.coins += coins; S.stars += stars; save(); renderTop(); confetti(); sfx.level();
    if (window.QUEST) QUEST.track("deliver");
    modal({ title: `${F.title} готов${g.id === "vinok" || g.id === "rushnyk" ? "ий" : "а"}! ${F.icon}`,
      html: `<div class="fk-done">${draw(g.id, g.target, false)}</div><p class="rewards">+${coins} 🪙 &nbsp; +${stars} ⭐${festive(g.id) ? " &nbsp; 🎉 святкова ×2" : ""}${g.tries === 0 ? " &nbsp; ✨ без жодної помилки" : ""}</p><p>Куди подінемо ${F.title.toLowerCase()}?</p>`,
      buttons: [{ label: "🎨 Поставити в дворик", onClick: () => toYard(F) }, { label: "💝 Подарувати сусідові", cls: "ghost", onClick: () => giftPick(F) }] });
  }
  function toYard(F) {
    S.decor = S.decor || { inv: {}, placed: {}, seq: 0 };
    S.decor.inv[F.decor[0]] = (S.decor.inv[F.decor[0]] || 0) + 1; save();
    toast(`${F.decor[0]} ${F.decor[1]} — у «Двір на свій смак» 🎨`);
  }
  function giftPick(F) {
    const who = Object.keys(FRIENDS).filter(k => k !== "cat" && CHARS[k] && (CHARS[k].from || 0) <= S.chapter && !(window.WD && WD.isSick(k))).sort(() => Math.random() - 0.5).slice(0, 3);
    modal({ title: "Кому подарувати? 💝", html: `<p>Хто сьогодні отримає ${F.title.toLowerCase()}?</p>`,
      buttons: who.map(k => ({ label: CHARS[k].name, onClick: () => gift(F, k) })).concat([{ label: "Краще в дворик", cls: "ghost", onClick: () => toYard(F) }]) });
  }
  function gift(F, who) {
    S.fr = S.fr || {}; S.fr[who] = Math.min(FRIEND_STEPS[2], (S.fr[who] || 0) + 1);
    S.coins += FOLK_GIFT_COINS; save(); renderTop();
    const she = ["halya", "olya", "marichka", "liza", "iryna"].includes(who);
    playDialog([[who, pick([she ? "Ой, яка краса! Сама б так не змогла 🥹 Дякую від щирого серця!" : "Ой, яка краса! Сам би так не зміг 🥹 Дякую від щирого серця!", "Це ж справжній оберіг! Повішу на найпочесніше місце 💛", "Ну й руки в тебе, {name}! Тримай гостинця — від мене 🍯"])]]);
    toast(`💛 ${CHARS[who].name.split(" ").pop()}: дружба +1 · +${FOLK_GIFT_COINS} 🪙`);
  }

  function panel() {
    const rows = Object.entries(FOLK).map(([id, F]) => {
      const ok = ready(id), fest = festive(id);
      return `<div class="wd-row${ok ? "" : " done"}"><span class="wd-ava">${F.icon}</span><span class="wd-mid"><b>${F.title}</b><small>${ok ? (fest ? "🎉 сьогодні свято — нагорода ×2" : "раз на добу · за зразком") : "сьогодні вже було — завтра знову"} · зроблено: ${st(id).n}</small></span>` +
        `<button class="s-btn fk-go${ok ? "" : " dim"}" data-id="${id}">${ok ? "Почати" : "Завтра"}</button></div>`;
    }).join("");
    modal({ title: "Народні майстер-класи 🥚", html: `<div class="wd-list">${rows}</div><p class="hint-s">Готову річ можна поставити в дворик або подарувати сусідові (+💛 дружби).</p>`, buttons: [{ label: "Готово", cls: "ghost" }] });
    document.querySelectorAll(".fk-go").forEach(b => b.onclick = () => start(b.dataset.id));
  }
  function card() {
    if (!on()) return { icon: "🥚", title: "Народні майстер-класи", sub: `відкриється на ${window.PACE ? PACE.lvl("folk") : 12} рівні`, locked: true };
    const left = Object.keys(FOLK).filter(ready), fest = Object.keys(FOLK).filter(id => festive(id) && ready(id));
    return { icon: "🥚", title: "Народні майстер-класи", sub: left.length ? `сьогодні можна: ${left.map(id => FOLK[id].icon).join(" ")}${fest.length ? " · свято — ×2!" : ""}` : "на сьогодні все — завтра знову", btn: "Відкрити", act: "folk", ready: left.length > 0 };
  }
  return { panel, card, start, list: FOLK };
})();
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => FOLKC.card()]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { folk: () => FOLKC.panel() });
