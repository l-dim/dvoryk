"use strict";
/* ============================================================
   ХМАРА (Supabase): прогрес зберігається ще й на сервері
   • Гра й далі живе з localStorage, хмара — копія, що оновлюється у фоні.
   • Під час першого запуску створюється анонімний акаунт (без пошти й пароля).
     Пізніше до нього можна буде привʼязати Apple / Google, щоб перенести гру на інший телефон.
   • Кожен запис має версію rev. Сервер приймає сейв, лише якщо він базується на останній
     хмарній версії; інакше (грали на іншому пристрої) гравчиня сама вибирає, що залишити.
   • Попередні 10 версій зберігаються в save_history — на випадок «пропав прогрес».
   Схема бази: supabase/migrations/.
   ============================================================ */
(function () {
  const SB_URL = "https://irfvpbnkfovedzyqeudq.supabase.co";
  // publishable-ключ можна тримати в коді: доступ до даних обмежують правила (RLS) у базі
  const SB_KEY = "sb_publishable_XLKqzULV1f0wQFXKqCRbow_OdGdjBXg";
  const META_KEY = "dvoryk_cloud_v1";
  const PUSH_DELAY = 45e3;          // не частіше, ніж раз на 45 с активної гри

  // превʼю-сторінка має окремий сейв — у хмару його не пишемо
  const previewSave = window.DVORYK_SAVE_KEY && window.DVORYK_SAVE_KEY !== "dvoryk_save_v1";
  if (!SB_URL || !SB_KEY || previewSave || !window.fetch) { window.CLOUD = null; return; }

  /* meta: { s: {at, rt, exp, uid}, rev, dirty, last, off } */
  let meta = readMeta();
  function readMeta() { try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { return {}; } }
  function writeMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} }

  let state = meta.last ? "ok" : "new";   // new | ok | err | conflict | off
  let timer = null, busy = false, gen = 0, waiting = false, started = false, checked = false;
  if (meta.off) state = "off";

  /* ---------- HTTP ---------- */
  async function call(path, { method = "GET", body, auth = true, keepalive = false } = {}) {
    const headers = { apikey: SB_KEY, "Content-Type": "application/json" };
    if (auth) headers.Authorization = "Bearer " + await token();
    const payload = body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body));
    const r = await fetch(SB_URL + path, { method, headers, body: payload, keepalive: keepalive && payload && payload.length < 60000 });
    const txt = await r.text();
    let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) {
      const err = new Error((j && (j.msg || j.message || j.error_description || j.error)) || "HTTP " + r.status);
      err.status = r.status;
      throw err;
    }
    return j;
  }

  /* ---------- сесія ---------- */
  let sessP = null;
  function setSession(j) {
    meta.s = { at: j.access_token, rt: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, uid: j.user && j.user.id };
    writeMeta();
  }
  async function token() {
    const s = meta.s;
    if (s && s.at && s.exp - 60e3 > Date.now()) return s.at;
    if (!sessP) sessP = (async () => {
      if (s && s.rt) {
        try {
          setSession(await call("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: s.rt }, auth: false }));
          return;
        } catch (e) {
          // мережа / сервер / забагато запитів — спробуємо пізніше; 4xx — сесії більше немає
          if (!e.status || e.status >= 500 || e.status === 429) throw e;
        }
      }
      setSession(await call("/auth/v1/signup", { method: "POST", body: { data: {} }, auth: false }));
      meta.rev = 0; meta.dirty = true; writeMeta();   // новий акаунт — хмара порожня
    })().finally(() => { sessP = null; });
    await sessP;
    return meta.s.at;
  }

  /* ---------- запис у хмару ---------- */
  const device = () => (window.NATIVE ? NATIVE.platform : "web");
  const hasGame = () => typeof S !== "undefined" && S && S.started;

  function schedule(ms) {
    if (timer || meta.off || waiting) return;
    timer = setTimeout(() => { timer = null; push(); }, ms);
  }
  function changed() {
    if (meta.off) return;
    gen++;
    if (!meta.dirty) { meta.dirty = true; writeMeta(); }
    if (!started) return;
    // акаунт створюємо, лише коли гру справді почали (а не для кожного, хто відкрив сторінку)
    if (!checked) { if (hasGame()) check(); return; }
    schedule(PUSH_DELAY);
  }
  async function push({ force = false, keepalive = false } = {}) {
    clearTimeout(timer); timer = null;
    if (meta.off || busy || (waiting && !force) || !hasGame()) return;
    if (!meta.dirty && !force) return;
    busy = true;
    const g = gen;
    try {
      const rows = await call("/rest/v1/rpc/push_save", {
        method: "POST", keepalive,
        body: '{"p_data":' + JSON.stringify(S) + ',"p_base_rev":' + (meta.rev || 0) +
              ',"p_device":"' + device() + '","p_force":' + (force ? "true" : "false") + "}"
      });
      const r = rows && rows[0];
      if (r && r.ok) {
        meta.rev = r.rev; meta.last = Date.now();
        if (gen === g) meta.dirty = false;
        writeMeta(); setState("ok");
      } else if (r) {
        resolveConflict(r);
      }
    } catch (e) {
      setState("err");
    } finally {
      busy = false;
      if (meta.dirty && state === "ok") schedule(PUSH_DELAY);
    }
  }

  /* ---------- перевірка під час запуску ---------- */
  async function check() {
    if (meta.off || checked || !hasGame()) return;
    checked = true;
    try {
      const rows = await call("/rest/v1/saves?select=rev,level,chapter,updated_at,device");
      const r = rows && rows[0];
      if (!r) { meta.rev = 0; meta.dirty = true; writeMeta(); return push(); }
      if (r.rev === meta.rev) { setState("ok"); return push(); }
      resolveConflict(r);
    } catch (e) {
      checked = false;   // повторимо з наступною зміною в грі
      setState("err");
    }
  }

  /* у хмарі інша версія, ніж та, від якої йде цей телефон: питаємо, яку залишити */
  function resolveConflict(r) {
    waiting = true; setState("conflict");
    whenIdle(() => {
      const here = hasGame() ? `рівень ${S.level}, розділ ${Math.min(S.chapter, STORY.length - 1) + 1}` : "нова гра";
      const there = `рівень ${r.level || 1}, розділ ${(r.chapter || 0) + 1}`;
      const when = r.updated_at ? new Date(r.updated_at).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
      modal({
        title: "Два різні збереження ☁️",
        html: `<p>У хмарі є прогрес з іншого пристрою, і він відрізняється від цього.</p>
          <p>📱 <b>Цей телефон:</b> ${here}</p>
          <p>☁️ <b>Хмара:</b> ${there}${when ? ` <span class="hint-s">(${when})</span>` : ""}</p>
          <p class="hint-s">Інший варіант не пропаде — ми зберігаємо кілька попередніх версій.</p>`,
        buttons: [
          { label: "☁️ Взяти з хмари", onClick: takeCloud },
          { label: "📱 Залишити цей телефон", cls: "ghost", onClick: () => { waiting = false; push({ force: true }); } }
        ]
      });
    });
  }
  async function takeCloud() {
    try {
      const rows = await call("/rest/v1/saves?select=data,rev");
      const r = rows && rows[0];
      if (!r || !r.data || !Array.isArray(r.data.board)) throw new Error("empty");
      S = null; // щоб автозбереження не перезаписало те, що беремо з хмари
      localStorage.setItem(SAVE_KEY, JSON.stringify(r.data));
      meta.rev = r.rev; meta.dirty = false; meta.last = Date.now(); writeMeta();
      reloadAfterSave();
    } catch (e) {
      waiting = false; setState("err");
      toast("Не вдалося завантажити з хмари 🙈 Спробуй пізніше");
    }
  }
  /* не перебиваємо вікна гри (історія, щоденний подарунок, стартовий екран) */
  function whenIdle(fn) {
    const busyUI = () => ["modal", "dialog", "start"].some(id => { const el = document.getElementById(id); return el && el.classList.contains("show"); });
    if (!busyUI()) return fn();
    setTimeout(() => whenIdle(fn), 1500);
  }

  /* ---------- видалення акаунта (вимога магазинів) ---------- */
  async function deleteAccount() {
    clearTimeout(timer); timer = null;
    if (meta.s && meta.s.rt) await call("/rest/v1/rpc/delete_me", { method: "POST", body: {} });
    meta = { off: true }; writeMeta(); setState("off");
  }
  function enable() {
    meta = { dirty: true, rev: 0 }; writeMeta(); setState("new");
    checked = false; check();
  }

  /* ---------- стан для налаштувань ---------- */
  function setState(s) {
    state = s;
    const el = document.getElementById("cloudStat");
    if (el) el.textContent = statusText();
    const del = document.getElementById("cloudDel"), on = document.getElementById("cloudOn");
    if (del) del.hidden = s === "off";
    if (on) on.hidden = s !== "off";
  }
  function statusText() {
    if (state === "off") return "Хмару вимкнено — прогрес зберігається лише на цьому пристрої.";
    if (state === "conflict") return "У хмарі інша версія гри — вибери, яку залишити.";
    if (state === "err") return "Немає звʼязку з хмарою — збережемо, щойно зʼявиться інтернет.";
    if (meta.last) {
      const t = new Date(meta.last).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      return `Прогрес зберігається в хмарі ☁️ Востаннє: ${t}.`;
    }
    return "Підключаємось до хмари…";
  }
  function settingsHtml() {
    return `<div class="set-backup">
        <b>Хмара ☁️</b>
        <p class="hint-s" id="cloudStat">${statusText()}</p>
        <button class="btn ghost small" id="cloudOn" ${state === "off" ? "" : "hidden"}>☁️ Увімкнути хмару</button>
        <button class="btn ghost small" id="cloudDel" ${state === "off" ? "hidden" : ""}>🗑 Видалити акаунт і дані з хмари</button>
      </div>`;
  }
  function bindSettings() {
    const del = document.getElementById("cloudDel"), on = document.getElementById("cloudOn");
    if (on) on.onclick = enable;
    if (del) del.onclick = async () => {
      if (!confirm("Видалити акаунт і всі збереження з хмари? Цього не скасувати. Гра на цьому пристрої залишиться.")) return;
      del.disabled = true;
      try { await deleteAccount(); toast("Акаунт і хмарні дані видалено"); }
      catch (e) { del.disabled = false; toast("Не вдалося видалити 🙈 Перевір інтернет і спробуй ще раз"); }
    };
  }

  /* ---------- старт ---------- */
  function start() {
    if (started) return;
    started = true;
    // згортання / закриття — відправляємо одразу
    const flushNow = () => { if (meta.dirty && !waiting) push({ keepalive: true }); };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushNow();
      else if (!checked) check();
      else if (meta.dirty || state === "err") push();   // повернулась у гру — дотягуємо, що не встигло
    });
    window.addEventListener("pagehide", flushNow);
    window.addEventListener("online", () => (checked ? push() : check()));
    setTimeout(check, 3000);  // дати грі показати свої вікна й не гальмувати запуск
  }

  window.CLOUD = { start, changed, push, settingsHtml, bindSettings, state: () => state };
})();
