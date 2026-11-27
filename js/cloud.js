"use strict";
/* ============================================================
   ХМАРА (Supabase): прогрес зберігається ще й на сервері
   • Гра й далі живе з localStorage, хмара — копія, що оновлюється у фоні.
   • Під час першого запуску створюється анонімний акаунт (без пошти й пароля).
     До нього можна привʼязати Apple (iOS) або Google — і відкрити гру на іншому телефоні.
     Google входить через сторінку Supabase у системному вікні (PKCE), Apple — нативно (NativeAuthPlugin.swift).
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
    if (auth) headers.Authorization = "Bearer " + (typeof auth === "string" ? auth : await token());
    const payload = body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body));
    const r = await fetch(SB_URL + path, { method, headers, body: payload, keepalive: keepalive && payload && payload.length < 60000 });
    const txt = await r.text();
    let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) {
      const err = new Error((j && (j.msg || j.message || j.error_description || j.error)) || "HTTP " + r.status);
      err.status = r.status;
      err.code = j && (j.error_code || j.code);
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
  /* відбиток збереження, що не залежить від порядку ключів (jsonb у базі їх переставляє) */
  function canon(v) {
    if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
    if (v && typeof v === "object") return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
    return JSON.stringify(v);
  }
  function fingerprint(data) {
    const str = canon(data);
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
  }

  async function push({ force = false, keepalive = false } = {}) {
    clearTimeout(timer); timer = null;
    if (meta.off || busy || (waiting && !force) || !hasGame()) return;
    if (!meta.dirty && !force) return;
    busy = true;
    const g = gen;
    try {
      const data = JSON.stringify(S);
      // запамʼятовуємо, що відправили: якщо сторінка закриється раніше, ніж прийде відповідь
      // (зміна мови, перезапуск), під час наступного запуску впізнаємо своє ж збереження в хмарі
      meta.sent = { base: meta.rev || 0, fp: fingerprint(JSON.parse(data)) }; writeMeta();
      const rows = await call("/rest/v1/rpc/push_save", {
        method: "POST", keepalive,
        body: '{"p_data":' + data + ',"p_base_rev":' + (meta.rev || 0) +
              ',"p_device":"' + device() + '","p_force":' + (force ? "true" : "false") + "}"
      });
      const r = rows && rows[0];
      if (r && r.ok) {
        meta.rev = r.rev; meta.last = Date.now(); delete meta.sent;
        if (gen === g) meta.dirty = false;
        writeMeta(); setState("ok");
      } else if (r) {
        delete meta.sent; writeMeta();
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
      if (await ownLostPush(r)) { meta.rev = r.rev; meta.last = Date.parse(r.updated_at) || Date.now(); delete meta.sent; writeMeta(); setState("ok"); return push(); }
      resolveConflict(r);
    } catch (e) {
      checked = false;   // повторимо з наступною зміною в грі
      setState("err");
    }
  }

  /* хмара на одну версію попереду, і це рівно те, що цей телефон відправив перед закриттям */
  async function ownLostPush(r) {
    const sent = meta.sent;
    if (!sent || sent.base !== (meta.rev || 0) || r.rev !== sent.base + 1) return false;
    try {
      const rows = await call("/rest/v1/saves?select=data,rev");
      const c = rows && rows[0];
      return !!(c && c.rev === r.rev && c.data && fingerprint(c.data) === sent.fp);
    } catch (e) { return false; }
  }

  /* у хмарі інша версія, ніж та, від якої йде цей телефон: питаємо, яку залишити */
  function resolveConflict(r) {
    waiting = true; setState("conflict");
    whenIdle(() => {
      const here = hasGame() ? tt`рівень ${S.level}, розділ ${Math.min(S.chapter, STORY.length - 1) + 1}` : tt`нова гра`;
      const there = tt`рівень ${r.level || 1}, розділ ${(r.chapter || 0) + 1}`;
      const when = r.updated_at ? new Date(r.updated_at).toLocaleString(LOCALE, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
      modal({
        title: tt`Два різні збереження ☁️`,
        html: tt`<p>У хмарі є прогрес з іншого пристрою, і він відрізняється від цього.</p>
          <p>📱 <b>Цей телефон:</b> ${here}</p>
          <p>☁️ <b>Хмара:</b> ${there}${when ? ` <span class="hint-s">(${when})</span>` : ""}</p>
          <p class="hint-s">Інший варіант не пропаде — ми зберігаємо кілька попередніх версій.</p>`,
        buttons: [
          { label: tt`☁️ Взяти з хмари`, onClick: takeCloud },
          { label: tt`📱 Залишити цей телефон`, cls: "ghost", onClick: () => { waiting = false; push({ force: true }); } }
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
      toast(tt`Не вдалося завантажити з хмари 🙈 Спробуй пізніше`);
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
    if (meta.s && meta.s.rt) {
      if (needsAppleRevoke()) await revokeApple();     // скасувала вікно Apple — акаунт не чіпаємо
      await call("/rest/v1/rpc/delete_me", { method: "POST", body: {} });
    }
    clearTimeout(timer); timer = null;
    meta = { off: true }; writeMeta(); setState("off");
  }
  /* Apple вимагає відкликати Sign in with Apple разом з акаунтом (App Review 5.1.1(v)).
     Потрібен свіжий код: гравчиня ще раз підтверджує вхід через Apple, а сервер
     (supabase/functions/apple-revoke) міняє код на токен і відкликає його. */
  const needsAppleRevoke = () => canApple && account().providers.includes("apple");
  async function revokeApple() {
    const { code } = await NativeAuth.apple({ nonce: b64url(rand(24)) });
    if (!code) return;                                  // стара збірка застосунку без коду
    try { await call("/functions/v1/apple-revoke", { method: "POST", body: { code } }); }
    catch (e) { console.warn("apple revoke", e); }     // акаунт і дані однаково видаляємо
  }
  function enable() {
    meta = { dirty: true, rev: 0 }; writeMeta(); setState("new");
    checked = false; check();
  }

  /* ============================================================
     ВХІД: Apple / Google
     • Анонімний акаунт → привʼязуємо до нього Apple / Google (той самий акаунт, прогрес на місці).
     • Якщо цей Apple / Google уже належить іншому акаунту (грала на іншому телефоні) —
       входимо в той акаунт, а старий анонімний видаляємо; далі як із двома збереженнями.
     ============================================================ */
  const SCHEME = "ua.dvoryk.app";                       // повернення в застосунок після входу
  const AUTH_KEY = "dvoryk_auth";                       // вебверсія: незавершений вхід (сторінка йде на Google і повертається)
  const Cap = window.Capacitor;
  const platform = window.NATIVE ? NATIVE.platform : "web";
  // власний плагін застосунку (ios/App/App/NativeAuthPlugin.swift), реєструється в MainViewController
  const NativeAuth = platform === "ios" ? Cap.Plugins.NativeAuth : null;
  const canApple = platform === "ios" && !!NativeAuth;

  function claims(t) {
    try {
      const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(p + "=".repeat((4 - p.length % 4) % 4));
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    } catch (e) { return {}; }
  }
  function account() {
    if (!meta.s) return { signed: false, providers: [] };
    const c = claims(meta.s.at);
    const prov = ((c.app_metadata && c.app_metadata.providers) || []).filter(p => p !== "anonymous");
    const via = prov.map(p => ({ apple: "Apple", google: "Google" })[p] || p).join(tt` і `);
    return { signed: !c.is_anonymous && prov.length > 0, anon: !!c.is_anonymous, email: c.email || "", via, providers: prov };
  }

  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  const b64url = bytes => btoa(String.fromCharCode.apply(null, bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  async function pkce() {
    const verifier = b64url(rand(32));
    try {
      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
      return { verifier, challenge: b64url(hash), method: "s256" };
    } catch (e) {
      return { verifier, challenge: verifier, method: "plain" };   // без crypto.subtle
    }
  }
  function readReturn(href) {
    const u = new URL(href);
    const p = new URLSearchParams(u.search);
    new URLSearchParams(u.hash.replace(/^#/, "")).forEach((v, k) => { if (!p.has(k)) p.set(k, v); });
    return { code: p.get("code"), error: p.get("error_code") || p.get("error"), desc: p.get("error_description") || "" };
  }
  const alreadyLinked = e => e && (e.code === "identity_already_exists" || /already (linked|exists)/i.test(e.message || e.desc || ""));
  const canceled = e => e && (e.code === "CANCELED" || e.message === "canceled");
  const fail = (msg, code) => Object.assign(new Error(msg), { code });

  /* одне коло входу через Google: адреса Supabase → вибір акаунта → повернення з ?code= → сесія */
  async function googleRound(mode) {
    const redirect = platform === "web" ? location.origin + location.pathname : SCHEME + "://auth";
    const { verifier, challenge, method } = await pkce();
    const q = `provider=google&redirect_to=${encodeURIComponent(redirect)}&code_challenge=${challenge}&code_challenge_method=${method}`;
    const url = mode === "link"
      ? (await call("/auth/v1/user/identities/authorize?" + q + "&skip_http_redirect=true")).url
      : SB_URL + "/auth/v1/authorize?" + q;
    if (platform === "web") {
      if (typeof saveNow === "function") saveNow();
      localStorage.setItem(AUTH_KEY, JSON.stringify({ mode, verifier, t: Date.now() }));
      location.assign(url);
      return new Promise(() => {});   // сторінка йде на Google
    }
    const back = platform === "ios" ? (await NativeAuth.webAuth({ url, scheme: SCHEME })).url : await androidWebAuth(url);
    return exchange(back, verifier);
  }
  async function exchange(href, verifier) {
    const r = readReturn(href);
    if (r.error) throw fail(r.desc || r.error, r.error);
    return exchangeCode(r.code, verifier);
  }
  function exchangeCode(code, verifier) {
    if (!code) throw fail("no code");
    return call("/auth/v1/token?grant_type=pkce", { method: "POST", body: { auth_code: code, code_verifier: verifier }, auth: false });
  }
  /* Android: Chrome Custom Tab, повернення через ua.dvoryk.app://auth (intent-filter у AndroidManifest) */
  function androidWebAuth(url) {
    const { Browser, App } = Cap.Plugins;
    return new Promise((resolve, reject) => {
      let done = false;
      const handles = [];
      const finish = (fn, v) => { if (done) return; done = true; handles.forEach(h => h.remove()); fn(v); };
      const keep = p => Promise.resolve(p).then(h => { if (done) h.remove(); else handles.push(h); });
      keep(App.addListener("appUrlOpen", e => {
        if (!e.url || !e.url.startsWith(SCHEME + "://")) return;
        Browser.close().catch(() => {});
        finish(resolve, e.url);
      }));
      // вкладку закрили без входу (даємо секунду: при поверненні через посилання вона теж закривається)
      keep(Browser.addListener("browserFinished", () => setTimeout(() => finish(reject, fail("canceled", "CANCELED")), 1500)));
      Browser.open({ url }).catch(e => finish(reject, e));
    });
  }
  async function appleSession(mode) {
    const nonce = b64url(rand(24));
    const { idToken } = await NativeAuth.apple({ nonce });
    const body = { provider: "apple", id_token: idToken, nonce };
    if (mode === "link") body.link_identity = true;
    return call("/auth/v1/token?grant_type=id_token", { method: "POST", body, auth: mode === "link" });
  }

  let signing = false;
  async function signIn(provider) {
    if (signing) return;
    signing = true;
    document.querySelectorAll("[data-signin]").forEach(b => (b.disabled = true));
    try {
      const round = provider === "apple" ? appleSession : googleRound;
      if (meta.s && account().anon) {
        try { return await adopt(await round("link"), "link"); }
        catch (e) { if (!alreadyLinked(e)) throw e; }
      }
      await adopt(await round("signin"), "signin");
    } catch (e) {
      if (!canceled(e)) toast(tt`Не вдалося увійти 🙈 Перевір інтернет і спробуй ще раз`);
    } finally {
      signing = false;
      document.querySelectorAll("[data-signin]").forEach(b => (b.disabled = false));
    }
  }

  /* нова сесія після входу */
  async function adopt(sess, mode) {
    const old = meta.s;
    const same = old && sess.user && old.uid === sess.user.id;
    setSession(sess);
    if (meta.off) delete meta.off;
    if (same || mode === "link") {
      writeMeta(); setState(meta.last ? "ok" : "new");
      toast(tt`Готово 💛 Тепер гру можна відкрити на іншому телефоні`);
      if (!checked && hasGame()) check();
      return;
    }
    // увійшли в інший акаунт: старий анонімний більше не потрібен
    if (old && claims(old.at).is_anonymous) await dropAccount(old);
    Object.assign(meta, { rev: 0, dirty: true, last: 0 }); writeMeta();
    waiting = false; checked = true;
    const rows = await call("/rest/v1/saves?select=rev,level,chapter,updated_at,device");
    const r = rows && rows[0];
    if (!r) {
      setState("new"); toast(tt`Вхід виконано 💛`);
      if (hasGame()) push(); else checked = false;
      return;
    }
    // на цьому телефоні гра лише почалась — просто беремо прогрес з хмари
    if (!hasGame() || (S.level <= 1 && !S.chapter)) return takeCloud();
    resolveConflict(r);
  }
  async function dropAccount(sess) {
    try {
      let at = sess.at;
      if (!at || sess.exp - 60e3 < Date.now()) {
        at = (await call("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: sess.rt }, auth: false })).access_token;
      }
      await call("/rest/v1/rpc/delete_me", { method: "POST", body: {}, auth: at });
    } catch (e) { /* не вийшло — залишиться порожній анонімний акаунт, нічого страшного */ }
  }
  async function signOut() {
    try { await call("/auth/v1/logout?scope=local", { method: "POST" }); } catch (e) {}
    clearTimeout(timer); timer = null;
    meta = { dirty: true, rev: 0 }; writeMeta();
    checked = false; waiting = false; setState("new");
    toast(tt`Вихід з акаунта виконано`);
    check();
  }
  /* вебверсія: повернулись зі сторінки входу Google */
  async function resumeWebSignIn() {
    let pend = null;
    try { pend = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) {}
    if (!pend) return false;
    const r = readReturn(location.href);
    if (!r.code && !r.error) return false;
    localStorage.removeItem(AUTH_KEY);
    history.replaceState(null, "", location.pathname);
    if (Date.now() - pend.t > 15 * 60e3) return false;
    try {
      if (r.error) {
        if (pend.mode === "link" && alreadyLinked({ code: r.error, desc: r.desc })) { await googleRound("signin"); return true; }
        throw fail(r.desc || r.error, r.error);
      }
      await adopt(await exchangeCode(r.code, pend.verifier), pend.mode);
    } catch (e) {
      if (!canceled(e)) toast(tt`Не вдалося увійти 🙈 Спробуй ще раз`);
    }
    return true;
  }
  /* стартовий екран нового телефона: «Вже граєш? Увійти» */
  function addStartSignin() {
    const startBtn = document.getElementById("startBtn");
    if (!startBtn || document.getElementById("startSignin") || meta.off) return;
    const b = document.createElement("button");
    b.id = "startSignin"; b.className = "btn ghost small";
    b.textContent = tt`Вже граєш на іншому телефоні? Увійти`;
    b.onclick = () => {
      modal({
        title: tt`Увійти ☁️`,
        html: tt`<p>Увійди тим самим акаунтом, що й на іншому телефоні — і гра продовжиться з того місця.</p>
          <div class="set-backup">${signinButtons()}</div>`,
        buttons: [{ label: tt`Скасувати`, cls: "ghost" }]
      });
      bindSignin(() => { if (account().signed) document.getElementById("modal").classList.remove("show"); });
    };
    startBtn.after(b);
  }

  /* ---------- стан для налаштувань ---------- */
  function setState(s) {
    state = s;
    const box = document.getElementById("cloudBox");
    if (box) { box.innerHTML = boxHtml(); bindSettings(); }
  }
  function statusText() {
    if (state === "off") return tt`Хмару вимкнено — прогрес зберігається лише на цьому пристрої.`;
    if (state === "conflict") return tt`У хмарі інша версія гри — вибери, яку залишити.`;
    if (state === "err") return tt`Немає звʼязку з хмарою — збережемо, щойно зʼявиться інтернет.`;
    if (meta.last) {
      const t = new Date(meta.last).toLocaleString(LOCALE, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      return tt`Прогрес зберігається в хмарі ☁️ Востаннє: ${t}.`;
    }
    return tt`Підключаємось до хмари…`;
  }
  const APPLE_LOGO = '<svg viewBox="0 0 17 20" aria-hidden="true"><path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9C3.6 4.8 2 5.8 1.1 7.4c-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.6 1-1.5 1.4-2.9 1.4-3 0 0-2.7-1-2.7-4.3zM11.6 3c.7-.9 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/></svg>';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function signinButtons() {
    return (canApple ? tt`<button class="btn small apple" data-signin="apple">${APPLE_LOGO}Увійти через Apple</button>` : "") +
      tt`<button class="btn ghost small" data-signin="google">Увійти через Google</button>`;
  }
  function boxHtml() {
    let h = tt`<b>Хмара ☁️</b><p class="hint-s">${statusText()}</p>`;
    if (state === "off") return h + tt`<button class="btn ghost small" id="cloudOn">☁️ Увімкнути хмару</button>`;
    const a = account();
    if (a.signed) {
      h += tt`<p class="hint-s">👤 Акаунт ${a.via}${a.email ? ` (${esc(a.email)})` : ""} — гру можна відкрити на будь-якому телефоні.</p>
        <button class="btn ghost small" id="cloudOut">Вийти з акаунта</button>`;
    } else {
      h += tt`<p class="hint-s">Увійди, щоб не загубити гру й відкрити її на іншому телефоні.</p>` + signinButtons();
    }
    if (meta.s) h += tt`<button class="btn ghost small" id="cloudDel">🗑 Видалити акаунт і дані з хмари</button>`;
    return h;
  }
  function bindSignin(after) {
    document.querySelectorAll("[data-signin]").forEach(b => b.onclick = () => signIn(b.dataset.signin).then(after));
  }
  function settingsHtml() { return `<div class="set-backup" id="cloudBox">${boxHtml()}</div>`; }
  function bindSettings() {
    const $c = id => document.getElementById(id);
    const del = $c("cloudDel"), on = $c("cloudOn"), out = $c("cloudOut");
    if (on) on.onclick = enable;
    if (out) out.onclick = () => {
      if (confirm(tt`Вийти з акаунта? Гра на цьому пристрої залишиться, а хмара почне нову копію.`)) signOut();
    };
    if (del) del.onclick = async () => {
      const ask = tt`Видалити акаунт і всі збереження з хмари? Цього не скасувати. Гра на цьому пристрої залишиться.` +
        (needsAppleRevoke() ? " " + tt`Apple попросить ще раз підтвердити вхід.` : "");
      if (!confirm(ask)) return;
      del.disabled = true;
      try { await deleteAccount(); toast(tt`Акаунт і хмарні дані видалено`); }
      catch (e) { del.disabled = false; if (!canceled(e)) toast(tt`Не вдалося видалити 🙈 Перевір інтернет і спробуй ще раз`); }
    };
    bindSignin();
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
    addStartSignin();
    resumeWebSignIn().then(resumed => {
      if (!resumed) setTimeout(check, 3000);  // дати грі показати свої вікна й не гальмувати запуск
    });
  }

  window.CLOUD = { start, changed, push, settingsHtml, bindSettings, state: () => state };
})();
