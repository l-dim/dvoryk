/* Збирає в native/www лише те, що потрібно грі в застосунку.
   Вихідники малюнків (art/), превʼю, service worker і git сюди не потрапляють. */
import { cpSync, rmSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "..", "..");        // корінь гри (dvoryk/)
const OUT = join(here, "..", "www");

const FILES = ["index.html", "style.css", "farm.css", "manifest.webmanifest"];
const DIRS = ["js", "items", "e3d", "icons", "models", "portraits", "vendor"];
const SKIP = /(^|\/)(\.DS_Store|License\.txt)$|\.(md|txt|swift|sh)$/i;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of FILES) cpSync(join(SRC, f), join(OUT, f));
for (const d of DIRS) {
  if (!existsSync(join(SRC, d))) throw new Error("Немає теки " + d);
  cpSync(join(SRC, d), join(OUT, d), { recursive: true, filter: p => !SKIP.test(p) || p.includes("LICENSE") });
}

const size = p => statSync(p).isDirectory() ? readdirSync(p).reduce((s, n) => s + size(join(p, n)), 0) : statSync(p).size;
console.log(`www зібрано: ${(size(OUT) / 1048576).toFixed(1)} МБ`);
