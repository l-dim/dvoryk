"use strict";
/* ============================================================
   НАТИВНИЙ ЗАСТОСУНОК (Capacitor: App Store / Google Play)
   У браузері цей файл нічого не робить.

   • Сховище. iOS може стерти localStorage вебвʼю, коли телефону бракує місця, тому в застосунку
     кожен запис у localStorage дублюється в Preferences (UserDefaults / SharedPreferences),
     а під час запуску — відновлюється звідти. Код гри й далі працює зі звичайним localStorage.
   • Без service worker і підказки «На початковий екран» — це вже застосунок.
   • Android: системна кнопка «Назад» гортає діалог / закриває вікно, а не виходить із гри.
   ============================================================ */
(function () {
  const Cap = window.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  if (!isNative) { window.NATIVE = null; return; }

  const P = Cap.Plugins || {};
  const Prefs = P.Preferences;
  const platform = Cap.getPlatform();      // "ios" | "android"
  window.DVORYK_NO_SW = true;
  document.documentElement.classList.add("native", "native-" + platform);

  /* ---------- localStorage ⇄ Preferences ---------- */
  const proto = Storage.prototype;
  const origSet = proto.setItem, origRemove = proto.removeItem, origClear = proto.clear;
  const ls = window.localStorage;
  let mirroring = false;            // вмикаємо після відновлення, щоб не писати те саме назад
  const pending = new Set();        // незавершені записи — дочекатися перед перезавантаженням
  const track = pr => { const t = pr.catch(() => {}).then(() => pending.delete(t)); pending.add(t); return t; };
  const flush = () => Promise.all([...pending]);

  function hydrate() {
    if (!Prefs) return Promise.resolve();
    return Prefs.keys().then(({ keys }) => Promise.all((keys || []).map(key =>
      Prefs.get({ key }).then(({ value }) => {
        if (value == null) return;
        // відновлюємо лише те, чого вебвʼю не має (або що стерлося)
        if (ls.getItem(key) == null) origSet.call(ls, key, value);
      })
    ))).then(() => {
      // перший запуск після оновлення: копіюємо в Preferences те, що досі жило тільки в localStorage
      const jobs = [];
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        jobs.push(Prefs.set({ key, value: ls.getItem(key) }));
      }
      return Promise.all(jobs);
    }).catch(() => {});
  }

  proto.setItem = function (key, value) {
    origSet.call(this, key, value);
    if (mirroring && this === ls && Prefs) track(Prefs.set({ key: String(key), value: String(value) }));
  };
  proto.removeItem = function (key) {
    origRemove.call(this, key);
    if (mirroring && this === ls && Prefs) track(Prefs.remove({ key: String(key) }));
  };
  proto.clear = function () {
    origClear.call(this);
    if (mirroring && this === ls && Prefs) track(Prefs.clear());
  };

  const ready = hydrate().then(() => { mirroring = true; });

  /* ---------- життєвий цикл ---------- */
  const App = P.App;
  if (App && App.addListener) {
    // застосунок згортають — зберігаємо негайно (pagehide у вебвʼю застосунку не приходить)
    App.addListener("pause", () => { if (typeof saveNow === "function") saveNow(); });

    if (platform === "android") {
      App.addListener("backButton", () => {
        const $id = id => document.getElementById(id);
        const modal = $id("modal"), dialog = $id("dialog");
        if (modal && modal.classList.contains("show")) {
          // остання кнопка у вікнах гри — «Закрити» / «Скасувати» / «Добре»
          const btns = modal.querySelectorAll(".m-btns button");
          if (btns.length) btns[btns.length - 1].click(); else modal.classList.remove("show");
        } else if (dialog && dialog.classList.contains("show")) {
          dialog.click();
        } else if (document.body.classList.contains("nav-open")) {
          document.body.classList.remove("nav-open");
        } else {
          if (typeof saveNow === "function") saveNow();
          App.minimizeApp();
        }
      });
    }
  }

  window.NATIVE = { platform, ready, flush };
})();
