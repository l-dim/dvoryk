"use strict";
/* ============================================================
   ФОТОАЛЬБОМ ДВОРИКА 📷 (як «Мій альбом» у профілі з запису)
   • Після кожного завершеного розділу — автоматичний знімок дворика.
   • Кнопка 📸 у дворику — знімок будь-коли.
   • Минулі розділи можна «дофотографувати» одним натиском.
   • Фото можна відкрити великим і поділитися (зберегти в Фото на iPhone).
   Фото зберігаються ОКРЕМО від гри (localStorage "<сейв>_photos"), щоб код резервної копії
   лишався коротким. Тому в резервну копію фото не потрапляють.
   ============================================================ */
const PHOTO_MAX = 40;
window.PHOTO = (() => {
  const KEY = SAVE_KEY + "_photos";
  let cache = null;
  function list() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { cache = []; }
    return cache;
  }
  function store() {
    // якщо місця забракне — прибираємо найстаріші ручні знімки
    for (let tries = 0; tries < 12; tries++) {
      try { localStorage.setItem(KEY, JSON.stringify(list())); return true; }
      catch (e) {
        const k = list().map((p, i) => [p, i]).reverse().find(([p]) => p.kind !== "chapter");
        if (!k) list().pop(); else list().splice(k[1], 1);
      }
    }
    return false;
  }
  const can = () => !!(window.Yard3D && Yard3D.snapshot);
  function snap(idx) {
    const ch = STORY[idx];
    return can() ? Yard3D.snapshot(ch.sky[0], ch.sky[1]) : null;
  }
  /* kind: "chapter" (після розділу) або "manual" */
  function take(idx, kind, quiet) {
    const img = snap(idx); if (!img) return null;
    const ch = STORY[idx];
    const p = { id: Date.now() + rnd(1000), ch: idx, kind, title: `Розділ ${idx + 1}. ${ch.title}`, at: Date.now(), img };
    if (kind === "chapter") cache = list().filter(x => !(x.kind === "chapter" && x.ch === idx));
    list().unshift(p);
    cache = list().slice(0, PHOTO_MAX);
    store();
    if (!quiet) { flash(); sfx.open(); toast(kind === "chapter" ? "📷 Знімок дворика — у фотоальбомі (профіль)" : "📸 Клац! Фото — у фотоальбомі"); }
    return p;
  }
  function flash() {
    const f = document.createElement("div"); f.className = "photo-flash"; document.body.appendChild(f);
    setTimeout(() => f.remove(), 600);
  }
  /* знімок поточного розділу з дворика (кнопка 📸) */
  function manual() {
    if (!can()) { toast("На цьому телефоні дворик без 3D — фото не вийде 🙈"); return; }
    const idx = viewCh === null ? Math.min(S.chapter, STORY.length - 1) : viewCh;
    take(idx, "manual");
  }
  /* знімки пройдених розділів, яких ще немає в альбомі */
  const missing = () => { const have = new Set(list().filter(p => p.kind === "chapter").map(p => p.ch)); const cur = S.storyDone ? STORY.length : Math.min(S.chapter, STORY.length);
    return Array.from({ length: cur }, (_, i) => i).filter(i => !have.has(i)); };
  let busy = false;
  async function backfill() {
    if (busy || !can()) return;
    const todo = missing(); if (!todo.length) return;
    busy = true;
    $("modal").classList.remove("show");
    showTab("story");
    const cover = document.createElement("div"); cover.className = "photo-busy"; document.body.appendChild(cover);
    for (let k = 0; k < todo.length; k++) {
      cover.innerHTML = `<div>📸 Фотографую дворик…<br><b>${k + 1} з ${todo.length}</b><small>${STORY[todo[k]].title}</small></div>`;
      viewCh = todo[k]; renderStory();
      await new Promise(r => setTimeout(r, 1700));      // поки довантажаться фігурки
      take(todo[k], "chapter", true);
    }
    viewCh = null; renderStory();
    cover.remove(); busy = false;
    sfx.level(); toast(`📷 Готово! У фотоальбомі ${todo.length} нових знімків`);
    album();
  }
  const fmtDate = t => { const d = new Date(t); return d.getDate() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear(); };
  function album() {
    const ps = list().slice().sort((a, b) => a.kind === b.kind ? (a.kind === "chapter" ? a.ch - b.ch : b.at - a.at) : a.kind === "chapter" ? -1 : 1);
    const miss = missing().length;
    const grid = ps.map(p => `<button class="ph-card" data-id="${p.id}"><img src="${p.img}" alt=""><small>${p.kind === "chapter" ? p.title : "📸 " + fmtDate(p.at)}</small></button>`).join("");
    modal({ title: `Фотоальбом 📷 ${ps.length}`,
      html: (miss && can() ? `<button class="btn small ph-back" id="phBack">📸 Сфотографувати пройдені розділи (${miss})</button>` : "") +
        (grid ? `<div class="ph-grid">${grid}</div>` : `<div class="big-emoji">📷</div><p>Альбом поки порожній. Після кожного розділу дворик фотографується сам, а ще є кнопка 📸 у дворику.</p>`) +
        `<p class="hint-s">Фото зберігаються лише на цьому телефоні — у код резервної копії вони не входять. Щоб зберегти назавжди, відкрий фото й натисни «Поділитися» → «Зберегти зображення».</p>`,
      buttons: [{ label: "Закрити", cls: "ghost" }] });
    const b = $("phBack"); if (b) b.onclick = backfill;
    document.querySelectorAll(".ph-card").forEach(c => c.onclick = () => view(+c.dataset.id));
  }
  function view(id) {
    const p = list().find(x => x.id === id); if (!p) return;
    modal({ title: p.kind === "chapter" ? p.title : "Мій дворик",
      html: `<div class="ph-big"><img src="${p.img}" alt=""><small>${p.kind === "chapter" ? fmtDate(p.at) : p.title + " · " + fmtDate(p.at)}</small></div>`,
      buttons: [{ label: "📤 Поділитися / зберегти", onClick: () => share(p) },
        ...(p.kind === "manual" ? [{ label: "🗑 Видалити", cls: "ghost", onClick: () => { cache = list().filter(x => x.id !== id); store(); album(); } }] : []),
        { label: "До альбому", cls: "ghost", onClick: album }] });
  }
  async function share(p) {
    try {
      const blob = await (await fetch(p.img)).blob();
      const file = new File([blob], "dvoryk-" + (p.ch + 1) + ".jpg", { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Затишний дворик", text: p.title }); view(p.id); return; }
    } catch (e) { if (e && e.name === "AbortError") { view(p.id); return; } }
    // запасний варіант — завантажити файл
    const a = document.createElement("a"); a.href = p.img; a.download = "dvoryk-" + (p.ch + 1) + ".jpg"; document.body.appendChild(a); a.click(); a.remove();
    view(p.id);
  }
  return { take, manual, album, backfill, count: () => list().length, missing: () => missing().length };
})();
