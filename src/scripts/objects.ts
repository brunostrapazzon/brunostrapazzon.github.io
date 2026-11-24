// Small toy-like objects, one per project. Built from primitives so they weigh nothing to download.
// To give a future project its own object, add a builder here and name it in the project file.
import {
  BackSide, Box3, CapsuleGeometry, Color, ConeGeometry, CylinderGeometry, DataTexture, ExtrudeGeometry,
  Group, IcosahedronGeometry, Mesh, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat, Shape,
  SphereGeometry, TorusGeometry, Vector3, type BufferGeometry, type Object3D,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

let ramp: DataTexture | null = null;
function toonRamp() {
  if (ramp) return ramp;
  ramp = new DataTexture(new Uint8Array([90, 170, 255]), 3, 1, RedFormat);
  ramp.minFilter = ramp.magFilter = NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

const outlineMat = new MeshBasicMaterial({ color: 0x10131a, side: BackSide });
export function setOutline(hex: string) { outlineMat.color.set(hex); }

function part(geo: BufferGeometry, color: string | Color, outline = 0.045): Group {
  const g = new Group();
  const m = new Mesh(geo, new MeshToonMaterial({ color, gradientMap: toonRamp() }));
  g.add(m);
  if (outline > 0) {
    const o = new Mesh(geo, outlineMat);
    o.scale.setScalar(1 + outline);
    g.add(o);
  }
  return g;
}
const shade = (hex: string, l: number) => new Color(hex).offsetHSL(0, 0, l);

function router(c: string) {
  const g = new Group();
  const body = part(new RoundedBoxGeometry(1.7, 0.42, 1.05, 4, 0.16), c);
  g.add(body);
  for (const x of [-0.6, 0.6]) {
    const a = part(new CylinderGeometry(0.06, 0.07, 0.95, 12), shade(c, -0.12));
    a.position.set(x, 0.62, -0.38);
    a.rotation.z = x < 0 ? 0.18 : -0.18;
    g.add(a);
    const tip = part(new SphereGeometry(0.11, 16, 12), shade(c, 0.12));
    tip.position.set(x * 1.15, 1.1, -0.38);
    g.add(tip);
  }
  ["#1db47c", "#1db47c", "#ffc62e"].forEach((led, i) => {
    const l = part(new SphereGeometry(0.06, 12, 8), led, 0.08);
    l.position.set(-0.45 + i * 0.22, 0.05, 0.54);
    g.add(l);
  });
  [0.35, 0.6, 0.85].forEach((r, i) => {
    const arc = part(new TorusGeometry(r, 0.055, 8, 32, Math.PI * 0.6), "#ffffff", 0.06);
    arc.rotation.z = Math.PI * 0.2;
    arc.position.set(0, 0.55 + i * 0.02, 0.15);
    arc.userData.pulse = i;
    g.add(arc);
  });
  return g;
}

function bubble(c: string) {
  const g = new Group();
  g.add(part(new RoundedBoxGeometry(1.7, 1.15, 0.5, 6, 0.42), c));
  const tail = part(new ConeGeometry(0.26, 0.55, 16), c);
  tail.position.set(-0.45, -0.72, 0);
  tail.rotation.z = Math.PI + 0.5;
  g.add(tail);
  const tickA = part(new CapsuleGeometry(0.075, 0.28, 4, 10), "#ffffff", 0.08);
  tickA.position.set(-0.17, -0.02, 0.3);
  tickA.rotation.z = Math.PI / 4;
  const tickB = part(new CapsuleGeometry(0.075, 0.62, 4, 10), "#ffffff", 0.08);
  tickB.position.set(0.13, 0.1, 0.3);
  tickB.rotation.z = -Math.PI / 5;
  g.add(tickA, tickB);
  return g;
}

function bolt(c: string) {
  const s = new Shape();
  s.moveTo(0.15, 1.05); s.lineTo(-0.55, -0.05); s.lineTo(-0.05, -0.05); s.lineTo(-0.25, -1.05);
  s.lineTo(0.6, 0.15); s.lineTo(0.08, 0.15); s.lineTo(0.35, 1.05); s.closePath();
  const geo = new ExtrudeGeometry(s, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3 });
  geo.center();
  const g = new Group();
  g.add(part(geo, c, 0.035));
  return g;
}

function planet(c: string) {
  const g = new Group();
  g.add(part(new IcosahedronGeometry(0.78, 5), c, 0.035));
  const craters: [number, number, number, number][] = [[0.35, 0.3, 0.62, 0.14], [-0.3, -0.25, 0.66, 0.11], [0.05, -0.5, 0.55, 0.08], [-0.45, 0.35, 0.5, 0.09]];
  craters.forEach(([x, y, z, r]) => {
    const cr = part(new SphereGeometry(r, 16, 10), shade(c, -0.14), 0);
    cr.position.copy(new Vector3(x, y, z).normalize().multiplyScalar(0.74));
    cr.scale.set(1, 1, 0.35);
    cr.lookAt(0, 0, 0);
    g.add(cr);
  });
  const ring = part(new TorusGeometry(1.15, 0.05, 8, 64), "#ffffff", 0.08);
  ring.rotation.x = Math.PI / 2.4;
  ring.rotation.y = 0.3;
  g.add(ring);
  const moon = part(new SphereGeometry(0.14, 16, 12), "#ffc62e", 0.08);
  moon.userData.orbit = 1.25;
  g.add(moon);
  return g;
}

function tree(c: string) {
  const g = new Group();
  const nodes: [number, number][] = [[0, 0.85], [-0.6, 0.15], [0.6, 0.15], [-0.95, -0.6], [-0.25, -0.6], [0.6, -0.6]];
  const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
  edges.forEach(([a, b]) => {
    const A = new Vector3(nodes[a][0], nodes[a][1], 0), B = new Vector3(nodes[b][0], nodes[b][1], 0);
    const len = A.distanceTo(B);
    const e = part(new CylinderGeometry(0.05, 0.05, len, 8), shade(c, -0.15), 0.1);
    e.position.copy(A).add(B).multiplyScalar(0.5);
    e.rotation.z = Math.atan2(B.y - A.y, B.x - A.x) - Math.PI / 2;
    g.add(e);
  });
  nodes.forEach(([x, y], i) => {
    const n = part(new SphereGeometry(i === 0 ? 0.27 : 0.21, 20, 14), i === 0 ? "#ffffff" : c);
    n.position.set(x, y, 0);
    n.userData.pulse = i;
    g.add(n);
  });
  return g;
}

function cube(c: string) {
  const g = new Group();
  g.add(part(new RoundedBoxGeometry(1.2, 1.2, 1.2, 5, 0.22), c));
  const dot = new SphereGeometry(0.1, 12, 8);
  [[0, 0], [-0.3, 0.3], [0.3, -0.3]].forEach(([x, y]) => {
    const d = part(dot, "#ffffff", 0.1);
    d.position.set(x, y, 0.6);
    g.add(d);
  });
  return g;
}

const builders: Record<string, (c: string) => Group> = { router, bubble, bolt, planet, tree, cube };

/** Builds the object centred on the origin and sized so its largest side is 2 units. */
export function build(kind: string, color: string): Object3D {
  const inner = (builders[kind] || cube)(color);
  const box = new Box3().setFromObject(inner);
  const size = box.getSize(new Vector3()), centre = box.getCenter(new Vector3());
  const k = 2 / Math.max(size.x, size.y, size.z);
  inner.scale.setScalar(k);
  inner.position.copy(centre).multiplyScalar(-k);
  const g = new Group();
  g.add(inner);
  g.userData.kind = kind;
  return g;
}

/** Per-frame flourish for objects that have moving parts. */
export function tick(o: Object3D, t: number, still: boolean) {
  if (still) return;
  o.traverse((c) => {
    if (c.userData.orbit) {
      const r = c.userData.orbit as number;
      c.position.set(Math.cos(t * 0.9) * r, Math.sin(t * 0.9) * r * 0.32, Math.sin(t * 0.9) * r * 0.5);
    }
    if (typeof c.userData.pulse === "number") {
      const k = 1 + Math.max(0, Math.sin(t * 3 - c.userData.pulse * 0.9)) * 0.08;
      c.scale.setScalar(k);
    }
  });
}

