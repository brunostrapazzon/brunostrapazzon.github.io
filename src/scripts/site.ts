// Interactions shared by every page. Small on purpose: the 3D layer loads later, on its own.
const root = document.documentElement;
const EN = root.lang.toLowerCase().startsWith("en");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");

// ---------- theme ----------
const themeBtn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
function syncTheme() {
  const dark = isDark();
  themeBtn?.setAttribute("aria-label", EN ? (dark ? "Switch to light theme" : "Switch to dark theme") : (dark ? "Mudar para o tema claro" : "Mudar para o tema escuro"));
  metaTheme?.setAttribute("content", dark ? "#0c0e13" : "#f3f4f7");
}
themeBtn?.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  const apply = () => { root.dataset.theme = next; syncTheme(); };
  try { localStorage.setItem("theme", next); } catch {}
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && !reduce.matches) doc.startViewTransition(apply); else apply();
});
syncTheme();

// ---------- header ----------
const header = document.querySelector<HTMLElement>(".site-header");
const onScroll = () => header?.toggleAttribute("data-scrolled", window.scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const menuBtn = document.querySelector<HTMLButtonElement>(".menu-btn");
if (header && menuBtn) {
  const label = menuBtn.querySelector(".label");
  const set = (open: boolean, focusBack = false) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    header.toggleAttribute("data-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    // Keep keyboard and screen reader focus inside the open menu.
    document.querySelectorAll<HTMLElement>("main, .site-footer, .brand").forEach((el) => { el.inert = open; });
    if (label) label.textContent = open ? menuBtn.dataset.close || "" : menuBtn.dataset.open || "";
    if (open) header.querySelector<HTMLElement>(".nav a")?.focus();
    else if (focusBack) menuBtn.focus();
  };
  menuBtn.addEventListener("click", () => set(menuBtn.getAttribute("aria-expanded") !== "true"));
  header.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", () => set(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && header.hasAttribute("data-open")) set(false, true); });
  matchMedia("(min-width: 820px)").addEventListener("change", (m) => m.matches && set(false));
}

// Current section in the nav.
const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.nav a[href*="#"]')];
if (navLinks.length && "IntersectionObserver" in window) {
  const byId = new Map(navLinks.map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const a = byId.get(e.target.id);
      if (a && e.isIntersecting) { navLinks.forEach((x) => x.removeAttribute("aria-current")); a.setAttribute("aria-current", "true"); }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

// ---------- the name: letters set loose, then locked into the grid ----------
const name = document.querySelector<HTMLElement>(".hero-name");
if (name) {
  const lines = [...name.querySelectorAll<HTMLElement>(".line")];
  name.setAttribute("aria-label", lines.map((l) => l.textContent).join(" "));
  lines.forEach((l) => l.setAttribute("aria-hidden", "true"));
  let i = 0;
  lines.forEach((line) => {
    const text = line.textContent || "";
    line.textContent = "";
    for (const ch of text) {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch;
      s.style.setProperty("--d", `${i * 45}ms`);
      s.style.setProperty("--dy", `${(((i * 37) % 9) - 4) * 0.025}em`);
      line.append(s);
      i++;
    }
  });
  const chars = [...name.querySelectorAll<HTMLElement>(".ch")];
  const enter = () => {
    name.classList.add("entered");
    requestAnimationFrame(() => root.classList.remove("js-enter"));
  };
  if (root.classList.contains("js-enter")) {
    const fonts = document.fonts?.load ? document.fonts.load('800 100px "Mona Sans"') : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 700))]).then(() => requestAnimationFrame(enter));
  }
  // Letters near the pointer stretch and ease off: the type is alive, not set in stone.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce.matches) {
    let rects: DOMRect[] = [];
    const measure = () => { rects = chars.map((c) => c.getBoundingClientRect()); };
    let raf = 0, px = -1e4, py = -1e4;
    const paint = () => {
      raf = 0;
      chars.forEach((c, k) => {
        const r = rects[k]; if (!r) return;
        const d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py);
        const f = Math.max(0, 1 - d / 340) ** 2;
        c.style.setProperty("--w", (125 - f * 32).toFixed(1));
        c.style.setProperty("--g", (800 + f * 60).toFixed(0));
      });
    };
    name.closest(".hero")?.addEventListener("pointerenter", measure);
    addEventListener("resize", measure, { passive: true });
    addEventListener("scroll", () => { rects = []; }, { passive: true });
    name.closest(".hero")?.addEventListener("pointermove", (e) => {
      const ev = e as PointerEvent;
      if (!rects.length) measure();
      px = ev.clientX; py = ev.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
    name.closest(".hero")?.addEventListener("pointerleave", () => { px = py = -1e4; if (!raf) raf = requestAnimationFrame(paint); });
  }
}

// ---------- project filters ----------
const chips = [...document.querySelectorAll<HTMLButtonElement>("[data-filter]")];
const rows = [...document.querySelectorAll<HTMLElement>(".row[data-themes]")];
const status = document.querySelector<HTMLElement>("[data-filter-status]");
const PARAM = EN ? "theme" : "tema";
function filterBy(chip: HTMLButtonElement, animate: boolean) {
  const f = chip.dataset.filter!;
  chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
  const apply = () => {
    let n = 0;
    rows.forEach((r) => { const on = f === "*" || (r.dataset.themes || "").split(" ").includes(f); r.hidden = !on; if (on) n++; });
    if (status) status.textContent = EN ? `${n} ${n === 1 ? "project" : "projects"} listed` : `${n} ${n === 1 ? "projeto" : "projetos"} na lista`;
  };
  // The filter lives in the URL, so a filtered list can be shared or bookmarked.
  const url = new URL(location.href);
  if (f === "*") url.searchParams.delete(PARAM); else url.searchParams.set(PARAM, f);
  history.replaceState(history.state, "", url);
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (animate && doc.startViewTransition && !reduce.matches) doc.startViewTransition(apply); else apply();
}
chips.forEach((chip) => chip.addEventListener("click", () => filterBy(chip, true)));
const initial = new URLSearchParams(location.search).get(PARAM);
const initialChip = initial ? chips.find((c) => c.dataset.filter === initial) : undefined;
if (initialChip) filterBy(initialChip, false);

// ---------- copy contact details ----------
const copyStatus = document.querySelector<HTMLElement>("[data-copy-status]");
document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
  const label = btn.textContent;
  let t = 0;
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy!;
    let ok = false;
    try { await navigator.clipboard.writeText(value); ok = true; } catch {
      const ta = document.createElement("textarea");
      ta.value = value; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.append(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch {}
      ta.remove();
    }
    if (!ok) return;
    btn.textContent = btn.dataset.doneLabel || "";
    btn.setAttribute("data-done", "");
    if (copyStatus) copyStatus.textContent = EN ? `${value} copied` : `${value} copiado`;
    clearTimeout(t);
    t = window.setTimeout(() => { btn.textContent = label; btn.removeAttribute("data-done"); }, 2000);
  });
});

// ---------- screenshots open over the page ----------
const viewer = document.querySelector<HTMLDialogElement>("dialog.viewer");
if (viewer && typeof viewer.showModal === "function") {
  const img = document.createElement("img");
  viewer.append(img);
  viewer.querySelector("button")?.addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener("close", () => img.removeAttribute("src"));
  document.querySelectorAll<HTMLAnchorElement>("a.shot-frame").forEach((a) => a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    img.alt = a.querySelector("img")?.alt || "";
    img.src = a.href;
    viewer.showModal();
  }));
}

// ---------- entrances ----------
function splitChars(el: HTMLElement, words = false) {
  let k = 0;
  const text = el.textContent || "";
  el.setAttribute("aria-label", text);
  el.textContent = "";
  const add = (parent: HTMLElement, ch: string) => {
    const s = document.createElement("span");
    s.className = "ch"; s.textContent = ch; s.setAttribute("aria-hidden", "true");
    s.style.setProperty("--k", String(k++));
    parent.append(s);
  };
  if (words) {
    text.split(" ").forEach((w, i, all) => {
      const span = document.createElement("span");
      span.className = "word"; span.setAttribute("aria-hidden", "true");
      for (const ch of w) add(span, ch);
      el.append(span);
      if (i < all.length - 1) el.append(" ");
    });
  } else for (const ch of text) {
    // Spaces stay plain text: inside an inline-block they would collapse to nothing.
    if (ch === " ") el.append(" "); else add(el, ch);
  }
}
document.querySelectorAll<HTMLElement>(".sec-title").forEach((el) => splitChars(el));
document.querySelectorAll<HTMLElement>(".contact-h").forEach((el) => splitChars(el, true));

// Stagger order inside each group.
document.querySelectorAll(".rows").forEach((list) => list.querySelectorAll<HTMLElement>(".row").forEach((r, i) => r.style.setProperty("--i", String(i))));
document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((g) => g.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => el.style.setProperty("--i", String(i))));
document.querySelectorAll(".stickers").forEach((g) => g.querySelectorAll<HTMLElement>(".sticker").forEach((el, i) => el.style.setProperty("--i", String(i))));

function countUp(el: HTMLElement) {
  const raw = el.textContent || "";
  const m = raw.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m || reduce.matches) return;
  const [, pre, num, post] = m;
  const dec = (num.split(/[.,]/)[1] || "").length;
  const sep = num.includes(",") ? "," : ".";
  const end = parseFloat(num.replace(",", "."));
  if (!end) return;
  const t0 = performance.now(), dur = 1100;
  el.setAttribute("aria-label", raw);
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + (end * e).toFixed(dec).replace(".", sep) + post;
    if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
  };
  requestAnimationFrame(step);
}

if (root.classList.contains("anim")) {
  const targets = document.querySelectorAll<HTMLElement>("[data-reveal], .row, .rows, .sec-title, .stickers, .contact-h, [data-count]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      el.classList.add("in");
      if (el.hasAttribute("data-count")) countUp(el);
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  targets.forEach((el) => io.observe(el));
  root.classList.add("anim-ok");
}

// ---------- the 3D layer, once the page has settled ----------
// It is decoration, so it never competes with the first paint: it loads on the visitor's first
// move (pointer, touch, scroll or key) or, failing that, a few seconds after the page has loaded.
if (document.querySelector("[data-stage], [data-thumb]")) {
  let started = false;
  const events = ["pointermove", "pointerdown", "touchstart", "scroll", "keydown", "wheel"];
  const load = () => {
    if (started) return;
    started = true;
    events.forEach((ev) => removeEventListener(ev, load));
    const run = () => import("./stage").then((m) => m.start()).catch(() => {});
    "requestIdleCallback" in window ? (window as any).requestIdleCallback(run, { timeout: 800 }) : setTimeout(run, 50);
  };
  events.forEach((ev) => addEventListener(ev, load, { once: true, passive: true }));
  const later = () => setTimeout(load, 6000);
  if (document.readyState === "complete") later(); else addEventListener("load", later, { once: true });
}
