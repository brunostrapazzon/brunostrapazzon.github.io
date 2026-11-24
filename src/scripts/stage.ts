// The 3D layer: the project objects floating around the name, a small one per index row,
// and a large one on each project page. Loaded after the page is idle; everything works without it.
import {
  CanvasTexture, Color, DirectionalLight, HemisphereLight, MathUtils, Mesh, MeshBasicMaterial, PerspectiveCamera,
  PlaneGeometry, Scene, Vector3, WebGLRenderer, type Object3D,
} from "three";
import { build, tick } from "./objects";

const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const dpr = () => Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.5 : 2);

interface Spec { kind: string; color: string; slug: string; href: string; title: string }
interface Item {
  spec: Spec;
  obj: Object3D;
  home: Vector3;      // resting position (world)
  off: Vector3;       // spring offset from home
  vel: Vector3;
  size: number;
  phase: number;
  hover: number;      // 0..1 eased hover
  spin: number;       // extra spin velocity
  hopV: number;
  hop: number;
  appear: number;     // 0..1 entrance
  delay: number;
  shadow: Mesh;
}

function lights(scene: Scene) {
  scene.add(new HemisphereLight(0xffffff, 0x8890a8, 1.9));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 6);
  scene.add(key);
}

// ---------- soft contact shadows ----------
// A blurred ellipse under each object: it tightens and darkens as the object comes down, spreads as it rises.
let shadowTex: CanvasTexture | null = null;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  shadowTex = new CanvasTexture(c);
  return shadowTex;
}
const shadowGeo = new PlaneGeometry(1, 1);
const darkTheme = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
};
function makeShadow(color: string) {
  const m = new Mesh(shadowGeo, new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.3 }));
  m.userData.tint = color;
  m.renderOrder = -1;
  paintShadow(m);
  return m;
}
/** Light theme: a grey-blue shadow. Dark theme: a pool of the object's own colour. */
function paintShadow(m: Mesh) {
  const mat = m.material as MeshBasicMaterial;
  if (darkTheme()) { mat.color = new Color(m.userData.tint as string); m.userData.alpha = 0.34; }
  else { mat.color = new Color("#141b33"); m.userData.alpha = m.userData.strong ? 0.42 : 0.26; }
}
/** Place a shadow under an object; `lift` is how far it floats above its rest, in object sizes. */
function placeShadow(m: Mesh, x: number, floorY: number, size: number, lift: number) {
  const k = Math.max(0, 1 - lift * 0.55);
  m.position.set(x, floorY, -1.2);
  m.scale.set(size * 2.3 * (1.15 - k * 0.15), size * 0.5 * (1.15 - k * 0.15), 1);
  (m.material as MeshBasicMaterial).opacity = (m.userData.alpha as number) * (0.45 + k * 0.55);
}

function readSpecs(el: HTMLElement): Spec[] {
  try { return JSON.parse(el.dataset.objects || "[]"); } catch { return []; }
}

/** World size visible at z=0 for a camera at distance d. */
function frustum(cam: PerspectiveCamera) {
  const h = 2 * cam.position.z * Math.tan(MathUtils.degToRad(cam.fov / 2));
  return { w: h * cam.aspect, h };
}

// ---------- big views: the hero and the project page ----------
class BigView {
  el: HTMLElement;
  mode: "hero" | "single";
  renderer: WebGLRenderer;
  scene = new Scene();
  cam = new PerspectiveCamera(30, 1, 0.1, 100);
  items: Item[] = [];
  w = 0; h = 0;
  visible = true;
  pointer = { x: -9, y: -9, inside: false };
  drag: { x: number; y: number; rx: number; ry: number } | null = null;
  rot = { x: -0.15, y: 0.6, vx: 0, vy: 0.004 };
  tip: HTMLElement | null = null;
  hovered: Item | null = null;
  started = performance.now();

  constructor(el: HTMLElement) {
    this.el = el;
    this.mode = el.dataset.stage === "single" ? "single" : "hero";
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    const c = this.renderer.domElement;
    c.setAttribute("aria-hidden", "true");
    c.className = "stage-canvas";
    el.append(c);
    lights(this.scene);
    this.cam.position.set(0, 0, 14);
    readSpecs(el).forEach((spec, i) => {
      const obj = build(spec.kind, spec.color);
      const shadow = makeShadow(spec.color);
      if (this.mode === "single") { shadow.userData.strong = true; paintShadow(shadow); }
      this.scene.add(shadow, obj);
      this.items.push({ spec, obj, shadow, home: new Vector3(), off: new Vector3(), vel: new Vector3(), size: 1, phase: i * 1.7, hover: 0, spin: 0, hopV: 0, hop: 0, appear: reduce.matches ? 1 : 0, delay: 250 + i * 110 });
    });
    if (this.mode === "hero") {
      this.tip = document.createElement("span");
      this.tip.className = "stage-tip";
      this.tip.setAttribute("aria-hidden", "true");
      el.append(this.tip);
    }
    this.layout();
    this.bind();
  }

  layout() {
    const r = this.el.getBoundingClientRect();
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.renderer.setPixelRatio(dpr());
    this.renderer.setSize(this.w, this.h, false);
    this.cam.aspect = this.w / this.h;
    this.cam.updateProjectionMatrix();
    const f = frustum(this.cam);
    if (this.mode === "single") {
      const it = this.items[0];
      if (it) { it.size = Math.min(f.h * 0.3, f.w * 0.2); it.home.set(0, 0, 0); }
      return;
    }
    // Hero: on wide screens the objects gather in the open space right of "Bruno";
    // on phones they line up on a shelf under the name.
    if (window.innerWidth < 720) {
      const shelf = 46 / this.h; // shelf centre, from the bottom of the stage
      const n = this.items.length;
      this.items.forEach((it, i) => {
        it.home.set((-0.4 + (0.8 * i) / Math.max(1, n - 1)) * f.w, (-0.5 + shelf) * f.h, 0);
        it.size = (27 / this.h) * f.h * (i % 2 ? 0.92 : 1.04);
      });
      return;
    }
    const spots = [[0.1, 0.27], [0.32, 0.29], [0.2, 0.06], [0.41, 0.04], [0.43, 0.33]];
    const base = f.h * 0.13;
    this.items.forEach((it, i) => {
      const spot = spots[i];
      if (!spot) { it.size = 0; return; }
      it.home.set(spot[0] * f.w, spot[1] * f.h, 0);
      it.size = base * (i % 2 ? 0.92 : 1.06);
    });
  }

  bind() {
    const target = this.mode === "hero" ? (this.el.closest(".hero") as HTMLElement) || this.el : this.el;
    const local = (e: PointerEvent) => {
      const r = this.el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    target.addEventListener("pointermove", (e) => {
      const p = local(e);
      this.pointer = { x: p.x, y: p.y, inside: true };
      if (this.drag) {
        this.rot.vy = (p.x - this.drag.x) * 0.0006;
        this.rot.y = this.drag.ry + (p.x - this.drag.x) * 0.01;
        this.rot.x = MathUtils.clamp(this.drag.rx + (p.y - this.drag.y) * 0.006, -0.9, 0.9);
      }
    }, { passive: true });
    target.addEventListener("pointerleave", () => { this.pointer.inside = false; this.setHover(null); }, { passive: true });
    if (this.mode === "single") {
      this.el.addEventListener("pointerdown", (e) => {
        const p = local(e);
        this.drag = { x: p.x, y: p.y, rx: this.rot.x, ry: this.rot.y };
        this.el.setPointerCapture(e.pointerId);
      });
      const end = () => { this.drag = null; };
      this.el.addEventListener("pointerup", end);
      this.el.addEventListener("pointercancel", end);
    } else {
      target.addEventListener("click", (e) => {
        if (!this.hovered || (e.target as HTMLElement).closest("a, button")) return;
        const it = this.hovered;
        it.hopV = 0.22; it.spin = 0.5;
        const go = () => { window.location.href = it.spec.href; };
        reduce.matches ? go() : setTimeout(go, 320);
      });
    }
  }

  setHover(it: Item | null) {
    if (this.hovered === it) return;
    this.hovered = it;
    const hero = this.el.closest(".hero") as HTMLElement | null;
    if (hero) hero.style.cursor = it ? "pointer" : "";
    if (this.tip) {
      this.tip.textContent = it ? it.spec.title : "";
      this.tip.style.setProperty("--tc", it ? it.spec.color : "transparent");
      this.tip.toggleAttribute("data-on", !!it);
    }
    if (it && !reduce.matches) { it.hopV = Math.max(it.hopV, 0.09); it.spin += 0.18; }
  }

  toScreen(v: Vector3) {
    const p = v.clone().project(this.cam);
    return { x: (p.x * 0.5 + 0.5) * this.w, y: (-p.y * 0.5 + 0.5) * this.h };
  }

  frame(now: number, dt: number) {
    const still = reduce.matches;
    const t = (now - this.started) / 1000;
    const f = frustum(this.cam);
    const px = this.pointer.inside ? (this.pointer.x / this.w - 0.5) * f.w : 0;
    const py = this.pointer.inside ? -(this.pointer.y / this.h - 0.5) * f.h : 0;
    let best: Item | null = null, bestD = Infinity;

    for (const it of this.items) {
      const o = it.obj;
      o.visible = it.shadow.visible = it.size > 0;
      if (!o.visible) continue;
      // entrance
      if (!still && it.appear < 1 && now - this.started > it.delay) it.appear = Math.min(1, it.appear + dt * 2.2);
      const a = still ? 1 : easeOutBack(it.appear);

      if (this.mode === "hero") {
        // pointer repels a little; a spring brings it home
        if (!still && this.pointer.inside) {
          const dx = it.home.x + it.off.x - px, dy = it.home.y + it.off.y - py;
          const d = Math.hypot(dx, dy), R = it.size * 2.2;
          if (d < R && d > 0.0001) {
            const k = (1 - d / R) * 0.9;
            it.vel.x += (dx / d) * k * dt * 10; it.vel.y += (dy / d) * k * dt * 10;
          }
        }
        it.vel.addScaledVector(it.off, -dt * 9);
        it.vel.multiplyScalar(Math.pow(0.02, dt));
        it.off.addScaledVector(it.vel, dt * 6);
        // hop
        it.hopV -= dt * 1.1; it.hop = Math.max(0, it.hop + it.hopV * dt * 12); if (it.hop === 0) it.hopV = Math.max(0, it.hopV);
        const bob = still ? 0 : Math.sin(t * 1.3 + it.phase) * it.size * 0.08;
        o.position.set(it.home.x + it.off.x, it.home.y + it.off.y + bob + it.hop * it.size, 0);
        placeShadow(it.shadow, o.position.x, it.home.y + it.off.y - it.size * 1.25, it.size * a, (bob + it.hop * it.size) / it.size + 0.08);
        it.spin *= Math.pow(0.15, dt);
        o.rotation.y = (still ? 0.5 : t * 0.35 + it.phase) + it.spin * 6;
        o.rotation.x = still ? -0.12 : Math.sin(t * 0.8 + it.phase) * 0.18 + (this.pointer.inside ? (py - o.position.y) * -0.03 : 0);
        o.rotation.z = Math.sin(t * 0.6 + it.phase * 2) * (still ? 0 : 0.08);
        // hover pick in screen space
        const s = this.toScreen(o.position);
        const rpx = (it.size / f.h) * this.h * 1.1;
        const d = Math.hypot(s.x - this.pointer.x, s.y - this.pointer.y);
        if (this.pointer.inside && d < rpx && d < bestD) { best = it; bestD = d; }
      } else {
        if (!this.drag && !still) { this.rot.y += this.rot.vy * dt * 60; this.rot.vy += (0.004 - this.rot.vy) * dt * 1.5; this.rot.x += (-0.15 - this.rot.x) * dt * 0.8; }
        o.rotation.set(this.rot.x, this.rot.y, 0);
        const lift = still ? 0 : Math.sin(t * 1.2) * 0.05;
        o.position.set(0, lift * it.size, 0);
        placeShadow(it.shadow, 0, -it.size * 1.3, it.size * a, lift + 0.05);
      }
      it.hover += ((this.hovered === it ? 1 : 0) - it.hover) * Math.min(1, dt * 10);
      o.scale.setScalar(it.size * a * (1 + it.hover * 0.14));
      tick(o, t, still);
    }
    if (this.mode === "hero") {
      this.setHover(best);
      if (this.tip && this.hovered) {
        const s = this.toScreen(this.hovered.obj.position);
        this.tip.style.transform = `translate(${s.x.toFixed(0)}px, ${(s.y - (this.hovered.size / f.h) * this.h * 1.25).toFixed(0)}px) translate(-50%, -100%)`;
      }
    }
    this.renderer.render(this.scene, this.cam);
  }
}

// ---------- row thumbnails: one shared renderer, copied into each row ----------
class Thumbs {
  renderer: WebGLRenderer;
  cam = new PerspectiveCamera(30, 1, 0.1, 50);
  rows: { el: HTMLElement; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; scene: Scene; obj: Object3D; shadow: Mesh; hot: number; spin: number; visible: boolean; drawn: boolean }[] = [];
  size = 128;
  constructor(els: HTMLElement[]) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power", preserveDrawingBuffer: true });
    this.cam.position.set(0, 0, 9);
    this.renderer.setPixelRatio(1);
    for (const el of els) {
      const spec = readSpecs(el)[0];
      if (!spec) continue;
      const canvas = document.createElement("canvas");
      canvas.className = "thumb-canvas";
      canvas.setAttribute("aria-hidden", "true");
      el.append(canvas);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      const scene = new Scene();
      lights(scene);
      const obj = build(spec.kind, spec.color);
      obj.scale.setScalar(1.25);
      const shadow = makeShadow(spec.color);
      scene.add(shadow, obj);
      const row = { el, canvas, ctx, scene, obj, shadow, hot: 0, spin: 0, visible: true, drawn: false };
      const link = el.closest(".row-link") as HTMLElement | null;
      const on = () => { row.hot = 1; row.spin += 0.6; };
      const off = () => { row.hot = 0; };
      link?.addEventListener("pointerenter", on);
      link?.addEventListener("focus", on);
      link?.addEventListener("pointerleave", off);
      link?.addEventListener("blur", off);
      this.rows.push(row);
      el.classList.add("has-3d");
    }
    this.layout();
  }
  layout() {
    const px = Math.round(Math.max(64, ...this.rows.map((r) => r.el.getBoundingClientRect().width)) * Math.min(window.devicePixelRatio || 1, 2));
    this.size = px;
    this.renderer.setSize(px, px, false);
    this.rows.forEach((r) => { r.canvas.width = px; r.canvas.height = px; r.drawn = false; });
  }
  frame(now: number, dt: number) {
    const still = reduce.matches;
    const t = now / 1000;
    for (const r of this.rows) {
      if (!r.visible || (still && r.drawn)) continue;
      r.spin *= Math.pow(0.2, dt);
      const speed = r.hot ? 1.6 : 0.35;
      r.obj.rotation.y = still ? 0.6 : r.obj.rotation.y + dt * speed + r.spin * dt * 8;
      r.obj.rotation.x = -0.18 + (still ? 0 : Math.sin(t + r.obj.id) * 0.08);
      r.obj.position.y = still ? 0.1 : Math.sin(t * 1.4 + r.obj.id) * 0.06 + r.hot * 0.22 + 0.1;
      placeShadow(r.shadow, 0, -1.5, 1.25, (r.obj.position.y - 0.04) / 1.3);
      tick(r.obj, t, still);
      this.renderer.render(r.scene, this.cam);
      r.ctx.clearRect(0, 0, this.size, this.size);
      r.ctx.drawImage(this.renderer.domElement, 0, 0);
      r.drawn = true;
    }
  }
}

function easeOutBack(x: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function start() {
  const bigEls = [...document.querySelectorAll<HTMLElement>("[data-stage]")];
  const thumbEls = [...document.querySelectorAll<HTMLElement>("[data-thumb]")];
  if (!bigEls.length && !thumbEls.length) return;
  let views: BigView[] = [];
  let thumbs: Thumbs | null = null;
  try {
    views = bigEls.map((el) => new BigView(el));
    if (thumbEls.length) thumbs = new Thumbs(thumbEls);
  } catch {
    return; // no WebGL: the page keeps its still fallbacks
  }
  document.documentElement.classList.add("has-stage");

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = views.find((x) => x.el === e.target);
      if (v) v.visible = e.isIntersecting;
      const r = thumbs?.rows.find((x) => x.el === e.target);
      if (r) r.visible = e.isIntersecting;
    }
    kick();
  }, { rootMargin: "120px" });
  views.forEach((v) => io.observe(v.el));
  thumbs?.rows.forEach((r) => io.observe(r.el));

  const ro = new ResizeObserver(() => { views.forEach((v) => v.layout()); thumbs?.layout(); kick(); });
  views.forEach((v) => ro.observe(v.el));
  thumbs?.rows.forEach((r) => ro.observe(r.el));

  let last = performance.now(), raf = 0, idleFrames = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    views.forEach((v) => v.visible && v.frame(now, dt));
    thumbs?.frame(now, dt);
    // With reduced motion, draw a few frames after each change and stop.
    if (reduce.matches && ++idleFrames > 3) { raf = 0; return; }
    raf = document.hidden ? 0 : requestAnimationFrame(loop);
  };
  function kick() { idleFrames = 0; if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  document.addEventListener("visibilitychange", kick);
  const repaint = () => {
    views.forEach((v) => v.items.forEach((it) => paintShadow(it.shadow)));
    thumbs?.rows.forEach((r) => { paintShadow(r.shadow); r.drawn = false; });
    kick();
  };
  new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaint);
  reduce.addEventListener("change", () => { thumbs?.rows.forEach((r) => (r.drawn = false)); kick(); });
  addEventListener("pointermove", () => reduce.matches && kick(), { passive: true });
  kick();
}
