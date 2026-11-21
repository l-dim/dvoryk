"use strict";
/* ============================================================
   3D-ІКОНКИ: замінює емодзі на об'ємні картинки Fluent Emoji 3D
   (Microsoft, ліцензія MIT — github.com/microsoft/fluentui-emoji).
   Вмикається, якщо на сторінці стоїть window.DVORYK_3D = true.
   ============================================================ */
const EMOJI3D = new Set(["1f326","1f404","1f327","1f975","1f976","1f526","260e","1f4fa","1f4a5","1f9e9","1f529","1f9f2","1f52a","2692","1f6e0","26cf","1f7e0","1f531","1f5dd","1f7e4","1fa9d","1fab2","1f4a1","1f50c","1fa83", "1f41b", "1fa9a", "1fa93", "1fa9c", "1fa86", "1f434", "1fa88", "1f468-200d-1f527", "1f469-200d-1f3a8", "1f37f", "1f357", "1f346", "1f9c4", "1f956", "1f96f", "1f348", "1fabb", "1fab7", "1f3f5", "1f376", "1f9c9", "1f361", "1f367", "1f362", "1f953", "1f356", "1fab6", "1f424", "1f986", "1f99a", "1fab9", "1f98c", "1f989", "1fa94", "1f9ca", "1f536", "1faba", "1f330", "1f527", "1f4ff", "1f451", "1f9d0", "1f3a9", "1fab1", "1f41f", "1f420", "1f421", "1f3a3", "1f344-200d-1f7eb", "1f344", "1f469-200d-1f373", "1f947", "1f948", "1f949", "1f3c5", "23f3", "1f4b3", "1f54a", "1f994", "1f41e", "1f98b", "1f9a2", "1f3fa", "1f5c4", "1f43e", "1f45a", "1f6d2", "1f95c", "1f37c", "1f476", "1f6cf", "1f9e5", "1f9e2", "1f912", "1f514", "1f34a", "1f411", "1f47c", "1f504", "1f6f6", "1f457", "1f97e", "1fa9e", "2709", "1f5bc", "1f4cb", "1f5fa", "1f4da", "1f372", "1f958", "1f9c7", "1f9f6", "1f9e4", "1f9e6", "1f9f8", "1f6f7", "1f3a0", "1f0cf", "1f305", "1f319", "1f31f", "1f328", "1f331", "1f332", "1f333", "1f337", "1f338", "1f339", "1f33a", "1f33b", "1f33c", "1f33d", "1f33e", "1f33f", "1f341", "1f342", "1f343", "1f345", "1f347", "1f349", "1f34b", "1f34f", "1f350", "1f351", "1f352", "1f353", "1f35e", "1f366", "1f368", "1f369", "1f36a", "1f36b", "1f36c", "1f36d", "1f36e", "1f36f", "1f370", "1f373", "1f375", "1f37d", "1f37e", "1f380", "1f381", "1f382", "1f383", "1f384", "1f386", "1f387", "1f388", "1f389", "1f38a", "1f392", "1f3a4", "1f3a8", "1f3aa", "1f3b2", "1f3b6", "1f3bb", "1f3c6", "1f3e0", "1f3e1", "1f3ee", "1f410", "1f413", "1f414", "1f415", "1f41d", "1f423", "1f425", "1f426", "1f431", "1f446", "1f44d", "1f45b", "1f467", "1f468-200d-1f373", "1f468-200d-1f9b1", "1f469", "1f469-200d-1f3eb", "1f469-200d-1f9b0", "1f470", "1f474", "1f475", "1f483", "1f485", "1f48c", "1f48d", "1f48e", "1f490", "1f492", "1f495", "1f496", "1f49b", "1f49d", "1f4a6", "1f4a8", "1f4aa", "1f4b0", "1f4d6", "1f4dc", "1f4e5", "1f4e6", "1f4ee", "1f4f1", "1f4f8", "1f4fb", "1f50a", "1f50b", "1f512", "1f525", "1f528", "1f56f", "1f570", "1f577", "1f578", "1f57a", "1f602", "1f604", "1f605", "1f609", "1f60a", "1f60b", "1f60d", "1f60f", "1f618", "1f62d", "1f62e-200d-1f4a8", "1f631", "1f634", "1f63b", "1f642", "1f643", "1f648", "1f6aa", "1f6cb", "1f6cd", "1f6d6", "1f7eb", "1f935", "1f940", "1f942", "1f944", "1f950", "1f952", "1f955", "1f957", "1f95a", "1f95b", "1f95e", "1f95f", "1f963", "1f967", "1f968", "1f96c", "1f96e", "1f972", "1f973", "1f979", "1f97a", "1f9c0", "1f9c1", "1f9c3", "1f9c5", "1f9c8", "1f9cb", "1f9d1-200d-1f33e", "1f9d1-200d-1f373", "1f9d4", "1f9e3", "1f9f0", "1f9f1", "1f9f5", "1f9fa", "1fa91", "1fa97", "1fa99", "1fa9f", "1faa1", "1faa3", "1faa7", "1faa8", "1fab4", "1fab5", "1fad0", "1fad3", "1fad5", "1fad6", "1fad9", "23f0", "2600", "2601", "2615", "2699", "26a1", "26c4", "26f1", "26f2", "26f8", "2705", "270c", "2728", "2744", "2754", "2764", "2b50", "35-20e3"]);

(function () {
  if (!window.DVORYK_3D) return;
  const BASE = (window.DVORYK_E3D_BASE || "") + "e3d/";
  const RE = /(?:[\uE000-\uF8FF]|[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#*]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*)/gu;
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, TITLE: 1 };
  const key = s => [...s].filter(c => c !== "\uFE0F").map(c => c.codePointAt(0).toString(16)).join("-");

  function fixText(node) {
    const t = node.nodeValue;
    if (!t || !RE.test(t)) return;
    RE.lastIndex = 0;
    const p = node.parentNode;
    if (!p || SKIP[p.nodeName]) return;
    let last = 0, m, frag = null;
    while ((m = RE.exec(t))) {
      // символи приватної зони — предмети пригод: мальована картинка або 3D-іконка-замінник
      const pua = window.PUA_MAP && window.PUA_MAP[m[0]];
      if (/[\uE000-\uF8FF]/.test(m[0]) && !pua) continue;
      const k = pua ? key(pua.e) : key(m[0]);
      const painted = pua ? pua.img : window.PAINTED && window.PAINTED[k];
      if (!painted && !EMOJI3D.has(k)) continue;
      frag = frag || document.createDocumentFragment();
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const img = document.createElement("img");
      img.className = painted ? "e3d pnt" : "e3d"; img.src = painted || BASE + k + ".webp"; img.alt = pua ? pua.e : m[0]; img.draggable = false;
      frag.appendChild(img);
      last = m.index + m[0].length;
    }
    RE.lastIndex = 0;
    if (!frag) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    p.replaceChild(frag, node);
  }
  function walk(root) {
    if (root.nodeType === 3) { fixText(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(fixText);
  }
  // попередньо завантажуємо всі картинки, щоб не блимали при першій появі
  function preload() { EMOJI3D.forEach(k => { const i = new Image(); i.src = BASE + k + ".webp"; }); }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("td");
    walk(document.body);
    new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === "characterData") fixText(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    setTimeout(preload, 300);
  });
})();
