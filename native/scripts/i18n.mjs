#!/usr/bin/env node
/* ============================================================
   Інструмент для перекладів гри (див. js/i18n.js)

   node scripts/i18n.mjs tag js/foo.js …   — обгорнути українські рядки тегом tt`…`
                                             (українською гра працює як і раніше: tt повертає той самий текст)
   node scripts/i18n.mjs merge en lang/parts/en-*.json — додати готові переклади в lang/en.js
   node scripts/i18n.mjs check              — покриття: скільки ключів перекладено в lang/*.js,
                                             помилки в {0}-підстановках, необгорнуті рядки;
                                             пише lang/todo-<мова>.json — що ще перекласти

   Не обгортаються: ключі обʼєктів, порівняння (=== "…"), case, перший аргумент
   split/replace/includes/… (це пошук у тексті, а не показ), та масиви з SKIP_DECLS.
   ============================================================ */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import * as acorn from "acorn";
import * as walk from "acorn-walk";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CYR = /[А-Яа-яІіЇїЄєҐґ]/;
const TAG = "tt";
const SKIP_FILES = new Set(["js/i18n.js"]);
const SKIP_DECLS = new Set(["MALE_FORMS"]);          // шаблони пошуку для чоловічих форм — не текст
const MATCH_METHODS = new Set(["split", "replace", "replaceAll", "includes", "startsWith", "endsWith",
  "indexOf", "lastIndexOf", "match", "matchAll", "search", "test"]);

const norm = s => String(s).replace(/\s+/g, " ").trim();
const parse = (src, file) => acorn.parse(src, {
  ecmaVersion: "latest", sourceType: file.endsWith("yard3d.js") ? "module" : "script", allowHashBang: true
});
const jsFiles = () => readdirSync(join(ROOT, "js")).filter(f => f.endsWith(".js")).map(f => "js/" + f)
  .filter(f => !SKIP_FILES.has(f)).sort();

const isTagCall = n => n && n.type === "CallExpression" && n.callee.type === "Identifier" && (n.callee.name === TAG || n.callee.name === "plural");
const isTagged = n => n && n.type === "TaggedTemplateExpression" && n.tag.type === "Identifier" && n.tag.name === TAG;

/* чи можна обгортати рядок у цьому місці */
function skipReason(node, ancestors) {
  const parent = ancestors[ancestors.length - 2];
  for (const a of ancestors) {
    if (a.type === "VariableDeclarator" && a.id.type === "Identifier" && SKIP_DECLS.has(a.id.name)) return "skip-decl";
    if (isTagCall(a) && a !== node) return "inside-tag";
    if (isTagged(a) && a !== node) return "inside-tag";
  }
  if (!parent) return null;
  if ((parent.type === "Property" || parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") && parent.key === node && !parent.computed) return "key";
  if (parent.type === "MemberExpression" && parent.property === node && parent.computed) return "lookup";
  if (parent.type === "BinaryExpression" && ["==", "===", "!=", "!==", "in"].includes(parent.operator)) return "compare";
  if (parent.type === "SwitchCase" && parent.test === node) return "case";
  if (parent.type === "CallExpression" && parent.callee.type === "MemberExpression" && !parent.callee.computed &&
      MATCH_METHODS.has(parent.callee.property.name) && parent.arguments[0] === node) return "match";
  if (parent.type === "TaggedTemplateExpression") return "tagged";
  return null;
}

/* усі українські рядки файлу: {node, kind, skip} */
function scan(src, file) {
  const ast = parse(src, file);
  const out = [];
  walk.fullAncestor(ast, (node, _state, ancestors) => {
    if (node.type === "Literal" && typeof node.value === "string" && CYR.test(node.value)) {
      out.push({ node, kind: "literal", skip: skipReason(node, ancestors) });
    } else if (node.type === "TemplateLiteral" && node.quasis.some(q => CYR.test(q.value.cooked || ""))) {
      const parent = ancestors[ancestors.length - 2];
      if (isTagged(parent)) return;
      out.push({ node, kind: "template", skip: skipReason(node, ancestors) });
    }
  });
  return { ast, items: out };
}

const escTpl = s => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")
  .replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/[\u2028\u2029]/g, c => "\\u" + c.charCodeAt(0).toString(16));

function tagFile(file) {
  const path = join(ROOT, file);
  let src = readFileSync(path, "utf8");
  const { items } = scan(src, file);
  const todo = items.filter(i => !i.skip).sort((a, b) => b.node.start - a.node.start);
  for (const { node, kind } of todo) {
    if (kind === "literal") src = src.slice(0, node.start) + TAG + "`" + escTpl(node.value) + "`" + src.slice(node.end);
    else src = src.slice(0, node.start) + TAG + src.slice(node.start);
  }
  parse(src, file);   // перевірка, що файл досі парситься
  writeFileSync(path, src);
  const skipped = items.filter(i => i.skip);
  console.log(`${file}: обгорнуто ${todo.length}, пропущено ${skipped.length}`);
  for (const s of skipped.filter(s => s.skip !== "inside-tag" && s.skip !== "skip-decl")) {
    const line = src.slice(0, s.node.start).split("\n").length;
    console.log(`   ${s.skip.padEnd(8)} :${line}  ${src.slice(s.node.start, Math.min(s.node.end, s.node.start + 70)).replace(/\s+/g, " ")}`);
  }
}

/* ключі: що реально шукатиметься в словнику */
function collectKeys() {
  const keys = new Map();    // key → [місце]
  const add = (k, where) => { if (!CYR.test(k)) return; if (!keys.has(k)) keys.set(k, []); keys.get(k).push(where); };
  const untagged = {};
  for (const file of jsFiles()) {
    const src = readFileSync(join(ROOT, file), "utf8");
    const ast = parse(src, file);
    const lineOf = pos => src.slice(0, pos).split("\n").length;
    walk.full(ast, node => {
      if (isTagged(node)) {
        const k = norm(node.quasi.quasis.map(q => q.value.cooked).reduce((a, s, i) => a + "{" + (i - 1) + "}" + s));
        add(k, file + ":" + lineOf(node.start));
      } else if (node.type === "CallExpression" && node.callee.type === "Identifier") {
        const lit = node.arguments.map(a => a.type === "Literal" && typeof a.value === "string" ? a.value : null);
        if (node.callee.name === TAG && lit[0] != null) add(norm(lit[0]), file + ":" + lineOf(node.start));
        if (node.callee.name === "plural" && lit[1] && lit[2] && lit[3]) add(lit[1] + "|" + lit[2] + "|" + lit[3], file + ":" + lineOf(node.start));
      }
    });
    const left = scan(src, file).items.filter(i => !i.skip);
    if (left.length) untagged[file] = left.length;
  }
  // index.html: текстові вузли, атрибути, data-t
  const html = readFileSync(join(ROOT, "index.html"), "utf8")
    .replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const body = html.slice(html.indexOf("<body"));
  const dataT = [...body.matchAll(/<(\w+)[^>]*\sdata-t[\s>=][^>]*>([\s\S]*?)<\/\1>/g)];
  let rest = body;
  for (const m of dataT) { add(norm(m[2]), "index.html data-t"); rest = rest.replace(m[0], ""); }
  for (const m of rest.matchAll(/>([^<>]+)</g)) add(norm(m[1]), "index.html");
  for (const m of rest.matchAll(/\s(?:placeholder|aria-label|title)="([^"]+)"/g)) add(norm(m[1]), "index.html attr");
  const t = /<title>([^<]+)<\/title>/.exec(html); if (t) add(norm(t[1]), "index.html title");
  const at = /apple-mobile-web-app-title" content="([^"]+)"/.exec(html); if (at) add(norm(at[1]), "index.html title");
  return { keys, untagged };
}

function loadDicts() {
  const dir = join(ROOT, "lang");
  const ctx = { window: { I18N: {} } };
  ctx.I18N = ctx.window.I18N;
  if (existsSync(dir)) for (const f of readdirSync(dir).filter(f => /^[a-z]{2}\.js$/.test(f))) {
    vm.runInNewContext(readFileSync(join(dir, f), "utf8"), ctx, { filename: f });
  }
  return ctx.window.I18N;
}

function check() {
  const { keys, untagged } = collectKeys();
  const dicts = loadDicts();
  const words = [...keys.keys()].reduce((n, k) => n + k.replace(/<[^>]+>|\{\d+\}/g, " ").split(/\s+/).filter(w => CYR.test(w)).length, 0);
  console.log(`Ключів: ${keys.size} (~${words} українських слів)`);
  for (const [lang, dict] of Object.entries(dicts)) {
    const missing = [], bad = [];
    let done = 0;
    for (const [k, where] of keys) {
      const v = dict[k];
      if (v == null) { missing.push({ key: k, where: where[0] }); continue; }
      done++;
      const need = (k.match(/\{\d+\}/g) || []).sort().join();
      for (const s of typeof v === "object" ? Object.values(v) : [v]) {
        const has = (String(s).match(/\{\d+\}/g) || []).sort().join();
        if (need && has !== need && !k.includes("|")) bad.push(k);
      }
    }
    const unused = Object.keys(dict).filter(k => !keys.has(k));
    console.log(`${lang}: перекладено ${done}/${keys.size} (${Math.round(done / keys.size * 100)}%)` +
      (bad.length ? `, підстановки не збігаються: ${bad.length}` : "") + (unused.length ? `, зайвих ключів: ${unused.length}` : ""));
    bad.slice(0, 10).forEach(k => console.log("   ! " + k.slice(0, 90)));
    writeFileSync(join(ROOT, "lang", `todo-${lang}.json`), JSON.stringify(missing, null, 1));
  }
  const left = Object.entries(untagged);
  if (left.length) {
    console.log("Ще не обгорнуті рядки:");
    left.forEach(([f, n]) => console.log(`   ${f}: ${n}`));
  }
}

/* merge en lang/parts/en-*.json — дописати переклади в lang/en.js (у порядку появи в коді) */
function merge(lang, files) {
  const path = join(ROOT, "lang", lang + ".js");
  const dict = Object.assign({}, loadDicts()[lang] || {});
  for (const f of files) Object.assign(dict, JSON.parse(readFileSync(join(process.cwd(), f), "utf8")));
  const { keys } = collectKeys();
  const order = [...keys.keys()].filter(k => k in dict);
  const rest = Object.keys(dict).filter(k => !keys.has(k));       // ключі, яких уже немає в коді
  const head = existsSync(path) ? readFileSync(path, "utf8").split("(window.I18N")[0] : "";
  const body = [...order, ...rest].map(k => "  " + JSON.stringify(k) + ": " + JSON.stringify(dict[k])).join(",\n");
  writeFileSync(path, head + "(window.I18N = window.I18N || {})." + lang + " = {\n" + body + "\n};\n");
  console.log(`${lang}.js: ${order.length} ключів` + (rest.length ? ` (+${rest.length} невикористаних)` : ""));
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "merge") merge(args[0], args.slice(1));
else if (cmd === "tag") (args.length ? args.map(a => relative(ROOT, join(process.cwd(), a))) : jsFiles()).forEach(tagFile);
else if (cmd === "check") check();
else console.log("node scripts/i18n.mjs tag [файли…] | check");
