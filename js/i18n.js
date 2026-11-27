"use strict";
/* ============================================================
   МОВИ ГРИ
   • Українська — мова оригіналу. Текст у коді лишається українським, лише позначений тегом:
       tt`Зберегти прогрес`             → "Save progress"
       tt`Рівень ${S.level}, розділ ${n}` → ключ "Рівень {0}, розділ {1}" → "Level {0}, chapter {1}"
     Українською tt повертає рівно той самий рядок, що й без тегу.
   • Переклади — у lang/<мова>.js: I18N.en = { "український текст": "переклад", … }.
     Ключ — український текст зі сплющеними пробілами; ${…} стають {0}, {1}… (порядок можна міняти).
     Значення може бути { f, m } — окремо для героїні й героя.
   • Чого немає в словнику — показується українською (і збирається в I18N_MISSING для перевірки).
   • Статичний текст index.html перекладається під час завантаження (translateDom).
   • Перевірка покриття й обгортання нових файлів: node native/scripts/i18n.mjs (див. там).
   ============================================================ */
(function () {
  const LANGS = { uk: "Українська", en: "English" };
  const LANG_KEY = "dvoryk_lang";
  const CYR = /[А-Яа-яІіЇїЄєҐґ]/;

  function detect() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && LANGS[saved]) return saved;
      // хто вже грав до появи мов — лишається з українською, хоч би яка мова телефона
      if (localStorage.getItem("dvoryk_save_v1")) return "uk";
    } catch (e) {}
    const prefs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
    // перша мова зі списку телефона, яку гра вміє; якщо жодної — англійська
    for (const l of prefs) { const code = String(l).slice(0, 2).toLowerCase(); if (LANGS[code]) return code; }
    return "en";
  }
  const LANG = detect();
  const I18N = window.I18N = window.I18N || {};
  const missing = window.I18N_MISSING = new Set();
  document.documentElement.lang = LANG;
  // словник потрібен до data.js — підвантажуємо синхронно, поки сторінка ще розбирається
  if (LANG !== "uk" && !I18N[LANG]) document.write('<script src="lang/' + LANG + '.js"><\/script>');

  const norm = s => String(s).replace(/\s+/g, " ").trim();
  const keepWs = (orig, text) => {
    const lead = /^\s*/.exec(orig)[0], trail = /\s*$/.exec(orig)[0];
    return lead + text + (trail.length < orig.length ? trail : "");
  };
  const keys = new WeakMap();
  function keyOf(strings) {
    let k = keys.get(strings);
    if (k === undefined) { k = norm(strings.reduce((a, s, i) => a + "{" + (i - 1) + "}" + s)); keys.set(strings, k); }
    return k;
  }
  function lookup(key) {
    const dict = I18N[LANG];
    let v = dict && dict[key];
    if (v == null) { if (CYR.test(key)) missing.add(key); return null; }
    if (typeof v === "object") {
      const male = typeof S !== "undefined" && S && S.sex === "m";
      v = (male && v.m) || v.f || v.m || null;
    }
    return v;
  }

  /* tt`текст ${x}` — тег для шаблонів; tt("текст") — для готового рядка */
  function tt(strings, ...vals) {
    if (typeof strings === "string" || strings == null) {
      if (LANG === "uk" || strings == null) return strings;
      const v = lookup(norm(strings));
      return v == null ? strings : keepWs(strings, v);
    }
    if (LANG !== "uk") {
      const v = lookup(keyOf(strings));
      if (v != null) {
        const s = v.replace(/\{(\d+)\}/g, (m, i) => (+i < vals.length ? vals[+i] : m));
        // пробіли на початку й у кінці оригіналу зберігаємо (ключ їх не містить)
        const lead = /^\s*/.exec(strings[0])[0], trail = /\s*$/.exec(strings[strings.length - 1])[0];
        return lead + s + (strings.length > 1 || trail.length < strings[0].length ? trail : "");
      }
    }
    let out = strings[0];
    for (let i = 0; i < vals.length; i++) out += vals[i] + strings[i + 1];
    return out;
  }

  /* Множина: plural(n, "монетка", "монетки", "монеток") — українські форми як ключ;
     у словнику: "монетка|монетки|монеток": { one: "coin", other: "coins" } */
  const rules = {};
  function plural(n, one, few, many) {
    if (LANG === "uk") {
      const r = (rules.uk = rules.uk || new Intl.PluralRules("uk")).select(n);
      return r === "one" ? one : r === "few" ? few : many;
    }
    const dict = I18N[LANG] || {};
    const key = one + "|" + few + "|" + many;
    const forms = dict[key];
    if (!forms) { missing.add(key); return many; }
    const r = (rules[LANG] = rules[LANG] || new Intl.PluralRules(LANG)).select(n);
    return forms[r] || forms.other || many;
  }

  /* Статичний текст сторінки: текстові вузли, placeholder / aria-label / title, а елементи з data-t — цілим HTML */
  function translateDom(root) {
    if (LANG === "uk") return;
    root.querySelectorAll("[data-t]").forEach(el => {
      const v = lookup(norm(el.innerHTML));
      if (v != null) el.innerHTML = v;
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentNode && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName)) || n.parentNode.closest("[data-t]")
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      if (!CYR.test(n.nodeValue)) return;
      const v = lookup(norm(n.nodeValue));
      if (v != null) n.nodeValue = keepWs(n.nodeValue, v);
    });
    root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el => {
      ["placeholder", "aria-label", "title"].forEach(a => {
        const s = el.getAttribute(a);
        if (!s || !CYR.test(s)) return;
        const v = lookup(norm(s));
        if (v != null) el.setAttribute(a, v);
      });
    });
  }

  function setLang(code) {
    if (!LANGS[code] || code === LANG) return false;
    try { localStorage.setItem(LANG_KEY, code); } catch (e) { return false; }
    return true;
  }

  /* «1-е» / «1st» — для місць у конкурсах: tt`${ordinal(n)} місце` */
  function ordinal(n) {
    if (LANG === "en") { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
    return n + "-е";
  }

  /* коротке імʼя для карток: «Бабуся Галя» → «Галя»; «Olya next door» / «Ivan the mailman» → «Olya» / «Ivan» */
  function shortName(full) {
    full = String(full || "");
    if (LANG !== "uk") full = full.replace(/,.*$/, "").replace(/\s+(the|next)\s.*$/i, "");
    return full.split(" ").pop();
  }

  window.tt = tt;
  window.shortName = shortName;
  window.ordinal = ordinal;
  window.plural = plural;
  window.LANG = LANG;
  window.LOCALE = LANG === "uk" ? "uk-UA" : LANG;   // для дат: toLocaleDateString(LOCALE, …)
  window.LANGS = LANGS;
  window.I18NX = { translateDom, setLang, norm, lookup };

  document.addEventListener("DOMContentLoaded", () => {
    if (LANG === "uk") return;
    document.title = tt(document.title);
    const appTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appTitle) appTitle.content = tt(appTitle.content);
    translateDom(document.body);
  });
})();
