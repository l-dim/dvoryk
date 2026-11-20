/* ============================================================
   3D-ДВОРИК (Three.js)
   Сцена ремонту у вкладці «Дворик»: острівець-діорама з моделями
   Kenney (CC0). Те, для чого моделі немає (тварини, люди, дрібниці),
   стоїть як об'ємна «фігурка» з 3D-іконки Fluent Emoji.
   Малює кадри лише тоді, коли щось рухається, щоб берегти батарею.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "../vendor/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "../vendor/jsm/controls/OrbitControls.js";

const BASE = new URL("../", import.meta.url).href;   // корінь гри
const R = 6;                                           // радіус острівця
const SIZE = 0.12;                                     // s (% ширини сцени) → одиниці світу

/* Емодзі → модель Kenney. Функція дозволяє обрати модель за розміром. */
const MODELS = {
  "🏡": "suburban/building-type-c", "🏠": "suburban/building-type-b",
  "🌳": "nature/tree_oak", "🌲": "holiday/tree-snow-a",
  "🌷": "nature/flower_redA", "🌺": "nature/flower_redB", "🌼": "nature/flower_yellowB",
  "🌾": "nature/crops_wheatStageB", "🥀": "nature/grass_large", "🌿": "nature/plant_bush",
  "🌱": "nature/crops_leafsStageA", "🥕": "nature/crop_carrot", "🪨": "nature/rock_largeA",
  "🚪": "nature/fence_gate", "🪧": "nature/sign", "🪵": "nature/log_stack", "🎪": "nature/tent_detailedOpen",
  "☕": "food/cup-coffee", "🍰": "food/cake", "🥬": "food/cabbage", "🧅": "food/onion", "🫙": "food/peanut-butter",
  "🧁": "food/cupcake", "🍩": "food/donut-sprinkles", "🥧": "food/pie", "🎃": "food/pumpkin", "🍇": "food/grapes",
  "🥮": "food/cookie", "🍳": "food/frying-pan", "🥛": "food/glass", "🎂": "food/cake-birthday", "🥟": "food/dim-sum",
  "🍯": "food/honey", "🍞": "food/loaf-round", "🥂": "food/glass-wine", "🥗": "food/salad", "🍾": "food/wine-red",
  "🪑": "furniture/chair", "🪴": "furniture/pottedPlant", "🪟": "furniture/wallWindow", "🧱": "furniture/kitchenStove",
  "📻": "furniture/radio", "🛋️": "furniture/loungeSofa",
  "🍽️": d => d.s >= 10 ? "furniture/table" : "furniture/tableCloth",
  "🏮": "holiday/lantern-hanging", "❄️": "holiday/snowflake-a", "🌨️": "holiday/snow-pile", "⛄": "holiday/snowman-hat",
  "🎄": "holiday/tree-decorated-snow",
  "📦": "survival/box", "🪣": "survival/bucket", "🧰": "survival/chest", "🛖": "survival/structure-roof", "💒": "survival/structure",
  "🌸": d => d.s >= 10 ? { m: "nature/tree_detailed", tint: 0xf6a9c8 } : null
};
/* Що висить у повітрі, а не стоїть на землі */
const AIR = new Set(["☁️", "☀️", "🌙", "🎆", "🎇", "🎊", "✨", "🌟", "❄️", "🐦", "🎈", "💕", "💖", "🎶", "🏮", "🕸️", "🕷️", "🕰️", "🐝"]);
/* Що лежить пласко на землі */
const FLAT = new Set(["🍂", "🍁", "🟫", "💨"]);
/* Наскільки збільшити/зменшити окремі речі відносно 2D-розміру */
const SCALE = { "🏡": 1.25, "🏠": 1.2, "🌳": 1.35, "🌲": 1.3, "🛖": 1.25, "💒": 1.1, "🎪": 1.1, "🪟": 1.3, "🧱": 1.0,
  "🌷": 0.75, "🌺": 0.75, "🌼": 0.75, "🎄": 1.2 };

const key = s => [...s].filter(c => c !== "️").map(c => c.codePointAt(0).toString(16)).join("-");

let renderer, scene, camera, controls, host, island, islandTop, islandSide, backWall, sun;
let active = false, chapterShown = -1, frames = 0, raf = 0, indoorNow = false;
const items = new Map();     // key → { obj, d, anim }
const anims = new Set();
const loader = new GLTFLoader();
const modelCache = new Map();
const texCache = new Map();
const billboards = new Set();

function req(n = 2) { frames = Math.max(frames, n); if (!raf && active) raf = requestAnimationFrame(tick); }

function init(el) {
  host = el;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "yard3d";
  host.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 10.5, 18);

  hemi = new THREE.HemisphereLight(0xfff4e0, 0x8a6a4a, 1.6);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(6, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  // острівець-діорама
  islandTop = new THREE.MeshStandardMaterial({ color: 0x9fd18b, roughness: 1 });
  islandSide = new THREE.MeshStandardMaterial({ color: 0x9a6b45, roughness: 1 });
  const geo = new THREE.CylinderGeometry(R, R * 0.9, 1.1, 72, 1);
  island = new THREE.Mesh(geo, [islandSide, islandTop, islandSide]);
  island.position.y = -0.55;
  island.receiveShadow = true;
  scene.add(island);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.08, 8, 96), new THREE.MeshStandardMaterial({ color: 0x7fb46b, roughness: 1 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.0;
  scene.add(rim);
  island.userData.rim = rim;

  // задня стіна для сцен у приміщенні
  backWall = new THREE.Mesh(new THREE.BoxGeometry(R * 1.9, 4.2, 0.3), new THREE.MeshStandardMaterial({ color: 0xf3dcc0, roughness: 1 }));
  backWall.position.set(0, 2.1, -R * 0.78);
  backWall.receiveShadow = true;
  backWall.visible = false;
  scene.add(backWall);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.9, 0);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.55;
  controls.minDistance = 12; controls.maxDistance = 27;
  controls.minPolarAngle = 0.55; controls.maxPolarAngle = 1.32;
  controls.minAzimuthAngle = -1.1; controls.maxAzimuthAngle = 1.1;
  controls.addEventListener("change", () => req(2));
  controls.addEventListener("start", () => { hideHint(); req(120); });
  controls.addEventListener("end", () => req(60));
  controls.update();

  new ResizeObserver(resize).observe(host);
  resize();
}

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  req(2);
}

function tick() {
  raf = 0;
  if (!active) return;
  const now = performance.now();
  for (const a of anims) {
    const t = Math.min(1, (now - a.t0) / a.dur);
    a.step(t);
    if (t >= 1) { anims.delete(a); a.done && a.done(); }
  }
  const moved = controls.update();
  for (const b of billboards) {
    b.rotation.y = Math.atan2(camera.position.x - b.parent.position.x, camera.position.z - b.parent.position.z);
  }
  renderer.render(scene, camera);
  if (anims.size || moved || --frames > 0) raf = requestAnimationFrame(tick);
}

/* ---------- координати 2D-сцени → 3D ---------- */
function place(d) {
  let X = (d.x - 50) / 50 * R * 0.95;
  const air = AIR.has(d.e);
  let Z, Y = 0;
  if (indoorNow && d.y < 34) { Z = -R * 0.78 + 0.2; Y = 1.2 + (34 - d.y) / 34 * 2.2; return new THREE.Vector3(X * 0.9, Y, Z); }
  if (air && d.y < 34) { Z = -R * 0.55 + d.y / 34 * R * 0.6; Y = 2.0 + (34 - d.y) / 34 * 3.0; }
  else {
    Z = ((Math.max(26, d.y) - 26) / 66) * 2 * R - R;
    if (air) Y = 1.6 + Math.max(0, 70 - d.y) / 30;
  }
  const r = Math.hypot(X, Z), max = R - 0.45;
  if (!air && r > max) { X *= max / r; Z *= max / r; }
  return new THREE.Vector3(X, Y, Z);
}

/* ---------- моделі ---------- */
function loadModel(path) {
  if (!modelCache.has(path)) {
    modelCache.set(path, loader.loadAsync(BASE + "models/" + path + ".glb").then(g => {
      g.scene.traverse(o => {
        if (o.isMesh) {
          o.castShadow = true; o.receiveShadow = true;
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach(m => { if ("metalness" in m) { m.metalness = 0; m.roughness = Math.max(0.65, m.roughness ?? 1); } });
        }
      });
      return g.scene;
    }));
  }
  return modelCache.get(path);
}
function normalize(obj, target) {
  const b = new THREE.Box3().setFromObject(obj);
  const sz = b.getSize(new THREE.Vector3());
  const m = Math.max(sz.x, sz.y, sz.z) || 1;
  obj.scale.multiplyScalar(target / m);
  const b2 = new THREE.Box3().setFromObject(obj);
  const c = b2.getCenter(new THREE.Vector3());
  obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= b2.min.y;
}
function tint(obj, color) {
  obj.traverse(o => {
    if (!o.isMesh) return;
    o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(m => {
      const c = m.color;
      if (c && c.g > c.r * 1.15 && c.g > c.b) { const n = m.clone(); n.color = new THREE.Color(color); return n; }
      return m;
    });
    if (o.material.length === 1) o.material = o.material[0];
  });
}

/* ---------- мальовані персонажі (портрети) ---------- */
const picCache = new Map();
function portraitTexture(who, fade) {
  const k = who + (fade ? ":f" : "");
  if (!picCache.has(k)) {
    picCache.set(k, new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        if (fade) {
          // низ портрета (по пояс) м'яко розчиняється, щоб не було «обрізаної» фігури
          g.globalCompositeOperation = "destination-out";
          const gr = g.createLinearGradient(0, c.height * 0.62, 0, c.height * 0.9);
          gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
          g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        res({ tex: t, aspect: c.width / c.height });
      };
      img.onerror = rej;
      img.src = BASE + (who.startsWith("animal-") ? "items/" + who : "portraits/" + who + (fade || who === "cat" || who.includes("-") ? "" : "-full")) + ".webp";
    }));
  }
  return picCache.get(k);
}
async function portraitFigure(who, height, full) {
  const { tex, aspect } = await portraitTexture(who, !full);
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(height * aspect, height);
  geo.translate(0, height / 2 - (full ? 0 : height * 0.16), 0);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.03, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  billboards.add(mesh);
  g.add(mesh);
  if (!full) {
    // пухкий кущик біля ніг
    try {
      const src = await loadModel("nature/plant_bushLarge");
      [[-0.22, 0.2, 0.62, 0x4e9e2b], [0.24, 0.16, 0.56, 0x5cad33], [0, 0.3, 0.5, 0x66b83a]].forEach(([x, z, k, col]) => {
        const b = paint(src.clone(true), col);
        normalize(b, height * k);
        const h = new THREE.Group(); h.add(b); h.position.set(x * height, 0, z * height);
        h.rotation.y = x * 7;
        g.add(h);
      });
    } catch (e) {}
  }
  return g;
}

/* ---------- фігурки з 3D-іконок ---------- */
function iconTexture(e) {
  const k = key(e);
  if (!texCache.has(k)) {
    const t = new THREE.TextureLoader().load(BASE + "e3d/" + k + ".webp", () => req(3));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    texCache.set(k, t);
  }
  return texCache.get(k);
}
/* мальована картинка (items/…) з правильними пропорціями */
const urlTexCache = new Map();
function urlTexture(path) {
  if (!urlTexCache.has(path)) {
    urlTexCache.set(path, new Promise((res, rej) => {
      new THREE.TextureLoader().load(BASE + path, t => {
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        res({ tex: t, aspect: t.image.width / t.image.height });
      }, undefined, rej);
    }));
  }
  return urlTexCache.get(path);
}
function standee(d, size, pic) {
  const tex = pic ? pic.tex : iconTexture(d.e);
  const flat = FLAT.has(d.e);
  const onWall = indoorNow && d.y < 34;
  // найбільший бік = size; мальовані картинки зберігають свої пропорції
  const a = pic ? pic.aspect : 1, gw = a >= 1 ? size : size * a, gh = a >= 1 ? size / a : size;
  const geo = new THREE.PlaneGeometry(gw, gh);
  if (!flat) geo.translate(0, gh / 2, 0);
  const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: pic ? 0.3 : 0.45, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = !flat && !AIR.has(d.e);
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45 });
  if (flat) { mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.02; }
  else if (!onWall) billboards.add(mesh);
  return mesh;
}
function cloud(size) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.25 });
  [[0, 0, 0, 1], [0.8, -0.1, 0, 0.75], [-0.8, -0.15, 0, 0.7], [0.3, 0.35, 0, 0.7]].forEach(([x, y, z, r]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r * size * 0.35, 16, 12), mat);
    m.position.set(x * size * 0.35, y * size * 0.35, z);
    g.add(m);
  });
  return g;
}

async function build(d) {
  const holder = new THREE.Group();
  holder.position.copy(place(d));
  const size = d.s * SIZE * (SCALE[d.e] || 1);
  let spec = indoorNow && d.y < 34 ? null : MODELS[d.e];
  if (typeof spec === "function") spec = spec(d);
  // мальовані тварини (аркуш sheet-animals)
  const animal = typeof YARD_ANIMALS !== "undefined" && YARD_ANIMALS[d.e];
  if (animal) {
    try {
      const fig = await portraitFigure(animal, size * (AIR.has(d.e) ? 0.85 : 1.15), true);
      if (AIR.has(d.e)) fig.traverse(o => { if (o.isMesh) o.castShadow = false; });
      holder.add(fig); return holder;
    } catch (e) { /* лишаємо 3D-іконку */ }
  }
  if (d.pic && typeof YARD_PICS !== "undefined" && YARD_PICS.includes(d.pic)) {
    try { holder.add(await portraitFigure(d.pic, size * 2.35, true)); return holder; } catch (e) { /* лишаємо смайлик */ }
  }
  if (d.who || (d.e === "🐱" && typeof PORTRAITS !== "undefined" && PORTRAITS.includes("cat"))) {
    try { holder.add(await portraitFigure(d.who || "cat", d.who ? size * 2.35 : size * 1.6, true)); return holder; }
    catch (e) { if (d.who) return holder; }
  }
  if (d.e === "☁️") holder.add(cloud(size * 1.6));
  else if (spec) {
    const path = typeof spec === "string" ? spec : spec.m;
    try {
      const src = await loadModel(path);
      const obj = src.clone(true);
      if (spec.tint) tint(obj, spec.tint);
      normalize(obj, size);
      // трохи повертаємо до центру, щоб сцена виглядала живішою
      obj.rotation.y = holder.position.x * -0.06;
      holder.add(obj);
    } catch (e) { holder.add(standee(d, size)); }
  } else {
    // якщо цей предмет уже намальований (дошка, прикраси) — беремо мальовану картинку
    const painted = window.PAINTED && window.PAINTED[key(d.e)];
    let pic = null;
    if (painted) { try { pic = await urlTexture(painted); } catch (e) {} }
    holder.add(standee(d, size * (AIR.has(d.e) ? 0.9 : 1) * (pic ? 1.1 : 1), pic));
  }
  return holder;
}

/* ---------- анімації ---------- */
const easeBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function appear(obj, delay = 0) {
  const y0 = obj.position.y;
  obj.scale.setScalar(0.001);
  anims.add({ t0: performance.now() + delay, dur: 650, step: t => {
    const k = Math.max(0, t);
    obj.scale.setScalar(Math.max(0.001, easeBack(k)));
    obj.position.y = y0 + (1 - k) * 1.2;
  } });
  req(2);
}
function vanish(obj) {
  anims.add({ t0: performance.now(), dur: 380, step: t => {
    obj.scale.setScalar(Math.max(0.001, 1 - t));
    obj.rotation.y += 0.15;
  }, done: () => { scene.remove(obj); obj.traverse(o => billboards.delete(o)); } });
  req(2);
}

/* ---------- травичка навколо (для живості) ---------- */
let grassGroup = null;
async function scatter(on) {
  if (grassGroup) { scene.remove(grassGroup); grassGroup = null; }
  if (!on) return;
  const g = new THREE.Group(); grassGroup = g; scene.add(g);
  const kinds = ["nature/grass", "nature/grass_leafs", "nature/grass", "nature/flower_purpleB"];
  let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const srcs = await Promise.all(kinds.map(loadModel));
  if (grassGroup !== g) return;
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2, r = 1.2 + Math.sqrt(rand()) * (R - 1.6);
    const kind = i % kinds.length;
    const o = kinds[kind].includes("flower") ? srcs[kind].clone(true) : paint(srcs[kind].clone(true), rand() < 0.5 ? 0x4e9e2b : 0x66b83a);
    normalize(o, 0.35 + rand() * 0.25);
    const h = new THREE.Group(); h.add(o);
    h.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); h.rotation.y = rand() * 6.28;
    g.add(h);
  }
  req(3);
}

/* ---------- огорожа, стежка з каменів і кущі ---------- */
let decoGroup = null, hemi = null;
function juicy(hex) {
  // соковитіша трава: більше насиченості, трохи світліше
  const c = new THREE.Color(hex), hsl = {};
  c.getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, Math.min(0.85, hsl.s * 1.25 + 0.12), Math.min(0.5, hsl.l * 0.78));
}
function paint(obj, color) {
  obj.traverse(o => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    o.material = ms.map(m => { const n = m.clone(); n.map = null; n.color = new THREE.Color(color); return n; });
    if (o.material.length === 1) o.material = o.material[0];
  });
  return obj;
}
async function decorate(ch, outdoor, winter) {
  if (decoGroup) { scene.remove(decoGroup); decoGroup = null; }
  if (!outdoor) return;
  const g = new THREE.Group(); decoGroup = g; scene.add(g);
  let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // стежка з плаского каміння від краю до центру
  const stoneMat = new THREE.MeshStandardMaterial({ color: winter ? 0xd9dde3 : 0xe9e3d6, roughness: 1 });
  for (let k = 0; k < 9; k++) {
    const t = k / 8, z = R - 0.6 - t * (R * 0.95), x = Math.sin(t * 3.2) * 0.55;
    for (let j = 0; j < 2; j++) {
      const r = 0.22 + rand() * 0.12;
      const st = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.05, 0.06, 7), stoneMat);
      st.position.set(x + (j ? 0.32 : -0.28) + (rand() - 0.5) * 0.12, 0.02, z + (rand() - 0.5) * 0.2);
      st.rotation.y = rand() * 6.28; st.receiveShadow = true;
      g.add(st);
    }
  }
  try {
    // біла огорожа по краю (спереду — відкрита хвіртка, щоб не заступала)
    const fenceSrc = await loadModel("nature/fence_simple");
    if (decoGroup !== g) return;
    const fence = paint(fenceSrc.clone(true), 0xfbf6ec);
    normalize(fence, 0.95);
    const Rf = R - 0.22, step = 0.9 / Rf;
    for (let a = 0; a < Math.PI * 2; a += step) {
      const ang = a + step / 2;
      const dz = Math.cos(ang); // 1 = до камери
      if (dz > 0.72) continue;
      const h = new THREE.Group(); h.add(fence.clone(true));
      h.position.set(Math.sin(ang) * Rf, 0, Math.cos(ang) * Rf);
      h.rotation.y = ang + Math.PI / 2;
      g.add(h);
    }
    // пухкі кущі вздовж заднього краю
    if (!winter) {
      const bush = await loadModel("nature/plant_bushLarge");
      const bush2 = await loadModel("nature/plant_bush");
      if (decoGroup !== g) return;
      for (let k = 0; k < 9; k++) {
        const ang = Math.PI * (0.72 + k * 0.07) + (rand() - 0.5) * 0.05;
        const o = (k % 2 ? bush2 : bush).clone(true);
        normalize(o, 0.75 + rand() * 0.35);
        const h = new THREE.Group(); h.add(o);
        const rr = R - 0.75;
        h.position.set(Math.sin(ang) * rr * (k % 2 ? 1 : 0.97), 0, Math.cos(ang) * rr);
        h.rotation.y = rand() * 6.28;
        g.add(h);
      }
    }
  } catch (e) { /* без огорожі — не страшно */ }
  req(3);
}

/* ---------- публічне API ---------- */
async function render(chIndex, ch, list, animate) {
  if (!renderer) return;
  const newChapter = chIndex !== chapterShown;
  if (newChapter) {
    for (const [, it] of items) { scene.remove(it.obj); it.obj.traverse(o => billboards.delete(o)); }
    items.clear();
    chapterShown = chIndex;
    const winter = /Зимов/.test(ch.title);
    hemi.color.set(winter ? 0xe8f0ff : 0xfff4e0); sun.color.set(winter ? 0xf4f8ff : 0xfff1d6);
    islandTop.color.copy(winter ? new THREE.Color(0xeef4ff) : ch.indoor ? new THREE.Color(ch.ground).lerp(new THREE.Color(0xe8d2b0), 0.35) : juicy(ch.ground));
    island.userData.rim.material.color.copy(islandTop.color).multiplyScalar(0.8);
    backWall.visible = indoorNow = !!ch.indoor;
    controls.reset && controls.reset();
    camera.position.set(0, 10.5, 18); controls.update();
    scatter(!ch.indoor && !winter);
    decorate(ch, !ch.indoor, winter);
  }
  const want = new Map(list.map(d => [d.key, d]));
  for (const [k, it] of items) if (!want.has(k)) { items.delete(k); vanish(it.obj); }
  let delay = 0;
  for (const [k, d] of want) {
    if (items.has(k)) continue;
    const entry = { obj: null };
    items.set(k, entry);
    build(d).then(obj => {
      if (items.get(k) !== entry || chapterShown !== chIndex) return;
      entry.obj = obj;
      scene.add(obj);
      if (animate && !newChapter) { appear(obj, delay); delay += 120; }
      req(3);
    });
  }
  req(3);
}
function setActive(on) {
  active = on;
  if (on) { resize(); req(4); }
  else if (raf) { cancelAnimationFrame(raf); raf = 0; }
}
let hintEl = null;
function hideHint() { if (hintEl) { hintEl.remove(); hintEl = null; try { localStorage.setItem("dvoryk_hint3d", "1"); } catch (e) {} } }
function mount(el) {
  if (renderer) { if (renderer.domElement.parentNode !== el) el.appendChild(renderer.domElement); return; }
  init(el);
  let seen = false; try { seen = !!localStorage.getItem("dvoryk_hint3d"); } catch (e) {}
  if (!seen) { hintEl = document.createElement("div"); hintEl.className = "yard-hint"; hintEl.textContent = "👆 Крути дворик пальцем"; el.appendChild(hintEl); }
}

try {
  const test = document.createElement("canvas");
  if (!(test.getContext("webgl2") || test.getContext("webgl"))) throw new Error("no webgl");
  window.Yard3D = { mount, render, setActive };
  window.dispatchEvent(new Event("yard3d-ready"));
} catch (e) { /* без WebGL лишається звичайна 2D-сцена */ }
