"use strict";
/* ============================================================
   ДЕНЬ І НІЧ, ПОРИ РОКУ 🌙🍂 — дворик живе за справжнім часом і датою.
   • Пора доби (за схід/захід сонця в Україні по місяцях): світанок, день, вечір, ніч.
     Небо й освітлення 3D-дворика міняються; увечері й уночі — місяць і ліхтарики, улітку — світлячки.
   • Пора року за датою на всіх вуличних локаціях: узимку сніг (і всі в теплому),
     восени золота трава й листопад, навесні тюльпани, улітку метелики.
   У хаті (indoor) — без змін.
   ============================================================ */
/* схід і захід сонця по місяцях (місцевий час, години) */
const ENV_SUN = [[7.8, 16.5], [7.2, 17.3], [6.3, 18.1], [6.2, 19.8], [5.3, 20.6], [4.9, 21.1], [5.2, 20.9], [5.9, 20.1], [6.7, 19.0], [7.4, 18.0], [7.1, 16.3], [7.8, 16.0]];
const ENV_SKY = { dawn: ["#ffb8a0", "#ffe3b8"], dusk: ["#ee8a6e", "#ffc98f"], night: ["#15204a", "#3b4380"] };

window.ENV = (() => {
  const now = () => new Date(window.DVORYK_NOW || Date.now());
  function phase() {
    const d = now(), h = d.getHours() + d.getMinutes() / 60, [rise, set] = ENV_SUN[d.getMonth()];
    if (h >= rise - 0.6 && h < rise + 1) return "dawn";
    if (h >= rise + 1 && h < set - 1) return "day";
    if (h >= set - 1 && h < set + 0.8) return "dusk";
    return "night";
  }
  function season() { const m = now().getMonth(); return m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn"; }
  const outdoor = ch => !!ch && !ch.indoor;
  const key = () => phase() + ":" + season();
  /* небо для розділу */
  function sky(ch) { const p = phase(); return outdoor(ch) && ENV_SKY[p] ? ENV_SKY[p] : ch.sky; }
  /* що додати в дворик: місяць, ліхтарики, сезонні дрібниці */
  function yard(ch, all) {
    if (!outdoor(ch)) return [];
    const p = phase(), s = season(), out = [];
    const hasMoon = all.some(d => d.e === "🌙");
    if ((p === "night" || p === "dusk") && !hasMoon) out.push({ key: "env-moon", e: "🌙", x: 86, y: 9, s: 7 });
    if (p === "night" || p === "dusk") out.push({ key: "env-lamp1", e: "🏮", x: 14, y: 40, s: 5 }, { key: "env-lamp2", e: "🏮", x: 86, y: 40, s: 5 });
    if (s === "autumn") out.push({ key: "env-leaf1", e: "🍂", x: 30, y: 84, s: 5 }, { key: "env-leaf2", e: "🍁", x: 72, y: 88, s: 4 });
    if (s === "spring") out.push({ key: "env-tulip1", e: "🌷", x: 24, y: 82, s: 5 }, { key: "env-tulip2", e: "🌷", x: 78, y: 84, s: 5 });
    if (s === "summer" && p === "day") out.push({ key: "env-fly", e: "🦋", x: 68, y: 46, s: 4 });
    if (s === "winter" && !all.some(d => d.e === "⛄")) out.push({ key: "env-snowman", e: "⛄", x: 18, y: 82, s: 8 });
    return out;
  }
  /* частинки поверх сцени: світлячки, листопад, сніжинки */
  function fx(scene, ch) {
    let el = scene.querySelector(".env-fx");
    if (!el) { el = document.createElement("div"); el.className = "env-fx"; scene.appendChild(el); }
    const p = phase(), s = season();
    const kind = !outdoor(ch) ? "" : s === "winter" ? "snow" : s === "autumn" ? "leaves" : p === "night" || p === "dusk" ? "flies" : "";
    if (el.dataset.kind === kind) return;
    el.dataset.kind = kind; el.className = "env-fx " + kind;
    let seed = 5; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    el.innerHTML = kind ? Array.from({ length: kind === "flies" ? 10 : 12 }, () =>
      `<i style="left:${Math.round(r() * 96)}%;top:${kind === "flies" ? 35 + Math.round(r() * 55) : -8}%;animation-delay:-${(r() * 8).toFixed(1)}s;animation-duration:${(kind === "flies" ? 5 : 7) + r() * 5}s"></i>`).join("") : "";
  }
  return { phase, season, key, sky, yard, fx, outdoor };
})();
