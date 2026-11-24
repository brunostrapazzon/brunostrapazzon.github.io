// Build-time assets made from the project files:
//   public/generated/covers/<slug>.svg   cover art, one per project
//   public/generated/og/<page>.png       1200x630 share images, PT and EN
// Every project file in src/data/projects/ gets its own, so adding a project needs nothing else.
import { readdir, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { decompress } from "wawoff2";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "generated");
const dir = path.join(root, "src", "data", "projects");

const projects = [];
for (const f of (await readdir(dir)).filter((f) => f.endsWith(".ts"))) {
  projects.push((await import(pathToFileURL(path.join(dir, f)).href)).default);
}
projects.sort((a, b) => a.order - b.order);

// ---------- seeded flow-field art ----------
function seedOf(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let s = seed || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// OKLCH -> sRGB hex, so the files work everywhere (resvg has no oklch).
function oklch(L, C, H) {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
  });
  return `#${rgb.join("")}`;
}

/** Cover art as SVG markup (no text). */
function cover(p, W = 1600, H = 1000) {
  const r = rng(seedOf(p.slug));
  const hue = p.hue;
  const f1 = 0.8 + r() * 1.6, f2 = 0.6 + r() * 1.4, ph = r() * Math.PI * 2, swirl = 0.8 + r() * 1.4;
  const lines = [];
  const n = 230;
  for (let i = 0; i < n; i++) {
    let x = r() * W, y = r() * H;
    const pts = [[x, y]];
    for (let k = 0; k < 46; k++) {
      const nx = x / W, ny = y / H;
      const a = Math.sin(nx * f1 * Math.PI + ph) * 2.1 + Math.cos(ny * f2 * Math.PI * swirl) * 1.7 + Math.sin((nx + ny) * 2.3) * 0.6;
      x += Math.cos(a) * 9; y += Math.sin(a) * 9;
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) break;
      pts.push([x, y]);
    }
    if (pts.length < 6) continue;
    const L = 0.8 + r() * 0.18, C = 0.08 + r() * 0.12, Hh = hue + (r() - 0.5) * 46;
    const o = (0.14 + r() * 0.4).toFixed(2), w = (0.8 + r() * 1.8).toFixed(1);
    const d = "M" + pts.map(([a, b]) => `${a.toFixed(0)} ${b.toFixed(0)}`).join("L");
    lines.push(`<path d="${d}" stroke="${oklch(L, C, Hh)}" stroke-opacity="${o}" stroke-width="${w}"/>`);
  }
  // A few nodes where the field gathers: the "points you can check".
  const dots = [];
  for (let i = 0; i < 9; i++) {
    const cx = (0.1 + r() * 0.8) * W, cy = (0.12 + r() * 0.76) * H, rr = 3 + r() * 5;
    dots.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(rr * 3.2).toFixed(1)}" fill="none" stroke="${oklch(0.9, 0.06, hue)}" stroke-opacity=".35"/><circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rr.toFixed(1)}" fill="${oklch(0.93, 0.07, hue)}"/>`);
  }
  const g0 = oklch(0.6, 0.19, hue), g1 = oklch(0.36, 0.15, hue + 24), g2 = oklch(0.78, 0.16, hue - 20);
  return {
    defs: `<linearGradient id="g-${p.slug}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g0}"/><stop offset="1" stop-color="${g1}"/></linearGradient><radialGradient id="r-${p.slug}" cx="${(0.2 + r() * 0.6).toFixed(2)}" cy="${(0.2 + r() * 0.5).toFixed(2)}" r=".7"><stop offset="0" stop-color="${g2}" stop-opacity=".55"/><stop offset="1" stop-color="${g2}" stop-opacity="0"/></radialGradient>`,
    body: `<rect width="${W}" height="${H}" fill="url(#g-${p.slug})"/><rect width="${W}" height="${H}" fill="url(#r-${p.slug})"/><g fill="none" stroke-linecap="round" stroke-linejoin="round">${lines.join("")}</g>${dots.join("")}`,
  };
}

// ---------- fonts for share images ----------
const fontDir = path.join(root, "node_modules", "@fontsource", "mona-sans", "files");
// resvg reads TTF/OTF files, so the woff2 files are unpacked once into a temp folder.
const fontFiles = [];
const tmp = await mkdtemp(path.join(os.tmpdir(), "og-fonts-"));
for (const w of [500, 800]) {
  const woff2 = await readFile(path.join(fontDir, `mona-sans-latin-${w}-normal.woff2`));
  const file = path.join(tmp, `mona-sans-${w}.ttf`);
  await writeFile(file, Buffer.from(await decompress(woff2)));
  fontFiles.push(file);
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Greedy wrap by an average glyph width; good enough for a fixed share image.
function wrap(text, size, maxW, ratio = 0.56) {
  const words = text.split(" "), lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (t.length * size * ratio > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Poster, not a slide: the art fills the frame and the type sits on its grid.
function og({ kicker, title, sub, art }) {
  const W = 1200, H = 630;
  const size = title.length > 30 ? 84 : title.length > 18 ? 104 : 148;
  const tl = wrap(title, size, 1060, 0.62);
  const parts = [];
  let y = H - 64 - (tl.length - 1) * size * 0.9;
  for (const l of tl) { parts.push(`<text x="60" y="${y.toFixed(0)}" font-family="Mona Sans" font-weight="800" font-size="${size}" letter-spacing="${-size * 0.035}" fill="#ffffff">${esc(l)}</text>`); y += size * 0.9; }
  const top = `<text x="62" y="92" font-family="Mona Sans" font-weight="800" font-size="30" fill="#ffffff">${esc(kicker)}</text>` +
    `<text x="62" y="130" font-family="Mona Sans" font-weight="500" font-size="26" fill="#ffffff" fill-opacity=".82">${esc(sub)}</text>` +
    `<text x="${W - 62}" y="92" text-anchor="end" font-family="Mona Sans" font-weight="500" font-size="24" fill="#ffffff" fill-opacity=".82">brunostrapazzon.github.io</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${art.defs}<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs><svg width="${W}" height="${H}" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">${art.body}</svg><rect width="${W}" height="${H}" fill="url(#shade)"/>${top}${parts.join("")}</svg>`;
}
function png(svg) {
  return new Resvg(svg, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Mona Sans" }, fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

await mkdir(path.join(out, "covers"), { recursive: true });
await mkdir(path.join(out, "og"), { recursive: true });

for (const p of projects) {
  const a = cover(p);
  // Covers ship as WebP: a 100 KB vector of hundreds of curves is slow to paint on a phone.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><defs>${a.defs}</defs>${a.body}</svg>`;
  const raster = new Resvg(svg, { fitTo: { mode: "width", value: 1600 } }).render().asPng();
  for (const w of [800, 1600]) {
    await sharp(raster).resize(w).webp({ quality: 78 }).toFile(path.join(out, "covers", `${p.slug}-${w}.webp`));
  }
  if (p.page) {
    for (const lang of ["pt", "en"]) {
      const t = p[lang];
      await writeFile(path.join(out, "og", `${p.slug}-${lang}.png`), png(og({ kicker: "Bruno Strapazzon", title: t.title, sub: t.headline, art: a })));
    }
  }
}

// Home share images: the art of the whole index, layered.
const home = cover({ slug: "home", hue: 262 });
await writeFile(path.join(out, "og", "home-pt.png"), png(og({ kicker: "Bruno Strapazzon", title: "Automação e IA que dá para conferir.", sub: "Ciência da Computação na FIAP", art: home })));
await writeFile(path.join(out, "og", "home-en.png"), png(og({ kicker: "Bruno Strapazzon", title: "Automation and AI you can check.", sub: "Computer Science at FIAP, Brazil", art: home })));

console.log(`generated ${projects.length} covers and share images`);
