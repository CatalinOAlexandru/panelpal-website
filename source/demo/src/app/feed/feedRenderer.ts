/**
 * Light 3D "camera feeds": one shared WebGL renderer draws a small scene per machine (low-poly body, a tilted screen
 * showing the machine's own values) and copies the picture into each card's 2D canvas. One WebGL context for all
 * feeds, a few pictures a second at most (the real camera sends one picture a second too). No video, no server.
 * Without WebGL the flat screen is drawn instead.
 */
import * as THREE from "three";
import type { MachineType } from "../../../../shared/floorplan";
import { MACHINES, clock } from "../../data";
import { gaugeSignals, panelSignals, type Signal } from "../world";
import { HMI_H, HMI_W, MEDIUM, drawGaugeFace, drawHmi, hmiTitle, isPlate } from "./hmi";

export const FEED_W = 560, FEED_H = 350;

let gl: THREE.WebGLRenderer | null | undefined;
function renderer() {
  if (gl !== undefined) return gl;
  try {
    gl = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    gl.setPixelRatio(1); gl.setSize(FEED_W, FEED_H, false);
  } catch { gl = null; }
  return gl;
}

interface GaugeTex { sig: Signal; cv: HTMLCanvasElement; tex: THREE.CanvasTexture }
interface Entry { mount: THREE.Group | null; gauges: GaugeTex[]; hasScreen: boolean; panel: THREE.Group; scene: THREE.Scene; cam: THREE.PerspectiveCamera; hmi: HTMLCanvasElement; tex: THREE.CanvasTexture; look: THREE.Vector3; home: THREE.Vector3; at: number }
const cache = new Map<string, Entry>();

const mat = (c: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.05, ...o });
function box(g: THREE.Group, w: number, h: number, d: number, c: string, x: number, y: number, z: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x, y, z); g.add(m); return m;
}
function cyl(g: THREE.Group, r: number, h: number, c: string, x: number, y: number, z: number) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat(c)); m.position.set(x, y, z); g.add(m); return m;
}

/** The machine's body, behind and beside the screen. The screen is at x 0, y 1.3, z 0.4 in every scene. */
function body(g: THREE.Group, type: MachineType) {
  const enamel = "#e7e9e5", dark = "#2b3036", blue = "#8da0b6";
  switch (type) {
    case "cnc-mill":
      box(g, 2.8, 2.3, 1.7, enamel, -1.7, 1.15, -0.5);
      box(g, 1.4, 0.95, 0.04, "#1b2a33", -2.0, 1.4, 0.37, { roughness: 0.2, metalness: 0.3 });
      box(g, 0.5, 0.18, 0.04, dark, -0.5, 0.7, 0.37);
      break;
    case "press":
      box(g, 0.4, 2.7, 0.7, blue, -1.4, 1.35, -0.3); box(g, 0.4, 2.7, 0.7, blue, 1.4, 1.35, -0.3);
      box(g, 3.2, 0.5, 0.9, blue, 0, 2.6, -0.3); box(g, 3.2, 0.45, 1.1, dark, 0, 0.22, -0.3);
      box(g, 1.1, 0.6, 0.6, "#c9ced4", 0, 1.9, -0.3); 
      break;
    case "welder":
      box(g, 1.6, 1.7, 0.9, "#d6d9d4", -1.2, 0.85, -0.2); box(g, 0.5, 0.5, 0.5, dark, 1.1, 0.25, 0); cyl(g, 0.05, 1.4, dark, 1.0, 1.0, 0.1);
      
      break;
    case "bandsaw":
      box(g, 2.6, 0.9, 1.1, "#d9dcd6", -1.0, 0.45, -0.2); cyl(g, 0.7, 0.12, dark, -1.9, 1.55, -0.2).rotation.x = Math.PI / 2;
      box(g, 0.2, 1.9, 0.3, "#d9dcd6", -2.1, 1.2, -0.2);
      break;
    case "washer":
      box(g, 2.4, 1.3, 1.3, "#d9dfe4", -1.3, 0.65, -0.3); box(g, 2.4, 0.15, 1.4, dark, -1.3, 1.37, -0.3);
      
      break;
    case "robot-cell":
      for (const x of [-2.4, 0.9]) box(g, 0.08, 2.0, 0.08, "#e0b023", x, 1.0, -1.2);
      box(g, 3.4, 0.5, 0.04, "#cfd6dc", -0.75, 0.5, -1.2, { transparent: true, opacity: 0.5 });
      box(g, 0.7, 0.4, 0.7, dark, -1.3, 0.2, -0.6); cyl(g, 0.12, 1.2, "#e7e9e5", -1.3, 1.0, -0.6);
      box(g, 1.2, 0.18, 0.18, "#e7e9e5", -0.8, 1.6, -0.6); 
      break;
    case "cmm":
      box(g, 2.2, 0.8, 1.4, "#b9bdb8", -1.3, 0.4, -0.4); box(g, 1.6, 0.14, 1.0, "#555b61", -1.3, 0.87, -0.4);
      box(g, 0.14, 1.1, 0.14, "#d9dcd6", -2.2, 1.4, -0.4); box(g, 0.14, 1.1, 0.14, "#d9dcd6", -0.4, 1.4, -0.4); box(g, 1.9, 0.16, 0.16, "#d9dcd6", -1.3, 1.95, -0.4);
      
      break;
    default:
      box(g, 2.2, 1.8, 1.2, enamel, -1.4, 0.9, -0.3);
  }
}

type Mount = "pendant" | "flush" | "cabinet" | "pedestal" | "desk" | "post" | "pipes";
interface Cfg { mount: Mount; pos: [number, number, number]; yaw: number; pitch: number; scale: number; cam: [number, number, number]; /** Look this far above or below the panel (a machine with gauges below its screen). */ lookDy?: number }
/** Where each machine's panel is, how it is mounted and where the camera stands: a different view for each machine. */
const CFG: Record<string, Cfg> = {
  cnc1: { mount: "pendant", pos: [0.15, 1.3, 0.45], yaw: -0.3, pitch: -0.08, scale: 1, cam: [1.0, 1.5, 2.6] },
  cnc2: { mount: "pendant", pos: [0.05, 1.5, 0.5], yaw: 0.35, pitch: -0.18, scale: 0.95, cam: [-0.3, 1.9, 2.4] },
  cnc3: { mount: "flush", pos: [-0.68, 1.15, 0.43], yaw: 0, pitch: 0, scale: 0.7, cam: [0.2, 1.4, 2.4] },
  cnc4: { mount: "pedestal", pos: [0.2, 1.25, 0.7], yaw: -0.2, pitch: -0.05, scale: 1, cam: [0.9, 1.4, 2.5] },
  saw: { mount: "cabinet", pos: [1.0, 1.3, 0.2], yaw: 0.15, pitch: 0, scale: 0.8, cam: [0.8, 1.2, 3.3], lookDy: -0.2 },
  wash: { mount: "cabinet", pos: [0.75, 1.3, 0.2], yaw: 0.45, pitch: 0, scale: 0.9, cam: [-0.2, 1.3, 3.1], lookDy: -0.2 },
  press1: { mount: "flush", pos: [-1.4, 1.35, 0.14], yaw: 0, pitch: -0.12, scale: 0.62, cam: [0.4, 1.0, 2.3] },
  press2: { mount: "cabinet", pos: [2.2, 1.35, 0.2], yaw: -0.4, pitch: 0, scale: 0.85, cam: [0.5, 1.4, 3.5], lookDy: -0.2 },
  weld1: { mount: "flush", pos: [-1.2, 1.15, 0.3], yaw: 0.12, pitch: -0.05, scale: 0.75, cam: [0.5, 1.3, 2.3] },
  weld2: { mount: "post", pos: [0.6, 1.55, 0.0], yaw: -0.2, pitch: -0.3, scale: 0.8, cam: [0.1, 0.9, 2.4] },
  robot: { mount: "pedestal", pos: [0.0, 1.25, 0.5], yaw: 0.5, pitch: -0.08, scale: 0.95, cam: [1.5, 1.5, 2.4] },
  util: { mount: "pipes", pos: [0, 1.2, 0], yaw: 0.12, pitch: 0, scale: 1, cam: [0.5, 1.25, 4.4] },
  cmm: { mount: "desk", pos: [0.1, 1.08, 0.5], yaw: -0.35, pitch: -0.12, scale: 0.9, cam: [-0.8, 1.5, 2.5] },
};
const PW = 0.98, PH = 0.64;

/** A real round gauge on a pipe: chrome case, white face with a needle, brass stem bolted into a pipe segment. Returns its face texture. */
const R3 = 0.15;
function addGauge(g: THREE.Group, x: number, pipeY: number, z: number, sig: Signal, segW: number): GaugeTex {
  const med = MEDIUM[sig.pipe ?? "oil"], stem = 0.15, cy = pipeY + 0.045 + stem + R3 * 1.06;
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, segW, 20), mat(med, { metalness: 0.3, roughness: 0.5 })); pipe.rotation.z = Math.PI / 2; pipe.position.set(x, pipeY, z); g.add(pipe);
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 20), mat("#6b7078")); f.rotation.z = Math.PI / 2; f.position.set(x + (sx * segW) / 2, pipeY, z); g.add(f); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, stem + 0.02, 12), mat("#b08a3a", { metalness: 0.6, roughness: 0.4 })); st.position.set(x, pipeY + 0.045 + stem / 2, z); g.add(st);
  box(g, 0.06, 0.03, 0.06, "#b08a3a", x, pipeY + 0.06, z);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R3 * 1.07, R3 * 1.07, 0.07, 28), mat("#b8bec4", { metalness: 0.7, roughness: 0.3 })); body.rotation.x = Math.PI / 2; body.position.set(x, cy, z); g.add(body);
  const cv = document.createElement("canvas"); cv.width = cv.height = 256;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.CircleGeometry(R3 * 1.07, 40), new THREE.MeshBasicMaterial({ map: tex })); face.position.set(x, cy, z + 0.037); g.add(face);
  return { sig, cv, tex };
}

/** A row of gauges, each on its own pipe segment (the colour says what is in the pipe), with end flanges and a hand valve. */
function gaugeRow(g: THREE.Group, sigs: Signal[], cx: number, pipeY: number, z: number, spacing: number): GaugeTex[] {
  return sigs.map((s, i) => addGauge(g, cx + (i - (sigs.length - 1) / 2) * spacing, pipeY, z, s, spacing - 0.04));
}

/** The thing the screen is fixed to, in the screen's own space (x right, y up, z towards the camera). */
function fixture(g: THREE.Group, mount: Mount, plate: boolean, y: number) {
  const dark = "#2b3036", metal = "#cfd3cd";
  const gauge = (x: number, yy: number, z: number) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 24), mat("#f2f2ee")); m.rotation.x = Math.PI / 2; m.position.set(x, yy, z); g.add(m);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 24), mat("#3a3f45")); r.rotation.x = Math.PI / 2; r.position.set(x, yy, z - 0.01); g.add(r);
    const n = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.06, 0.005), mat("#c33")); n.position.set(x + 0.01, yy + 0.01, z + 0.022); n.rotation.z = -0.7; g.add(n);
  };
  switch (mount) {
    case "pendant": // an arm swinging out from the machine
      box(g, 0.9, 0.07, 0.07, dark, -0.55, 0.05, -0.12); cyl(g, 0.06, 0.12, dark, -1.0, 0.05, -0.12); box(g, 0.1, 0.1, 0.1, dark, -0.05, 0.05, -0.06);
      break;
    case "flush": // a small control box bolted to the machine
      box(g, PW + 0.1, PH + 0.1, 0.16, plate ? metal : "#3a3f45", 0, 0, -0.09);
      break;
    case "cabinet": { // a utilities cabinet: door, handle, hazard strip and spare gauges
      const h = y + 0.1;
      box(g, PW + 0.35, h, 0.3, metal, 0, -h / 2 + PH / 2 + 0.3 - 0.1, -0.17);
      box(g, 0.05, 0.3, 0.05, dark, PW / 2 + 0.12, -0.35, 0.0);
      break;
    }
    case "pedestal": // a floor stand BEHIND the screen
      cyl(g, 0.045, y + 0.1, dark, 0, -(y + 0.1) / 2 + PH * 0.1, -0.12); cyl(g, 0.22, 0.04, dark, 0, -y + 0.02, -0.12); box(g, 0.28, 0.18, 0.1, dark, 0, -0.02, -0.08);
      break;
    case "desk": // a monitor on a desk
      box(g, 1.5, 0.05, 0.8, "#b9a07a", 0, -PH / 2 - 0.3, -0.2); box(g, 0.05, y - 0.1, 0.05, "#7a6a50", -0.65, -y / 2 - 0.1, -0.2); box(g, 0.05, y - 0.1, 0.05, "#7a6a50", 0.65, -y / 2 - 0.1, -0.2);
      box(g, 0.12, 0.28, 0.06, dark, 0, -PH / 2 - 0.12, -0.06); box(g, 0.36, 0.03, 0.24, dark, 0, -PH / 2 - 0.26, -0.06); box(g, 0.5, 0.02, 0.17, "#c9ced4", 0, -PH / 2 - 0.26, 0.28);
      break;
    case "post": // a junction box on a steel post
      box(g, PW + 0.12, PH + 0.12, 0.2, metal, 0, 0, -0.12); box(g, 0.1, y + 0.4, 0.1, "#7f8a94", 0, -(y + 0.4) / 2, -0.28); cyl(g, 0.035, 0.7, dark, 0.3, PH / 2 + 0.4, -0.15);
      break;
  }
}

function build(id: string, type: MachineType): Entry {
  const c = CFG[id] ?? CFG.cnc1;
  const plate = isPlate(id);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#d3d6d2");
  scene.add(new THREE.HemisphereLight("#ffffff", "#8a8d89", 1.5));
  const sun = new THREE.DirectionalLight("#ffffff", 1.6); sun.position.set(2, 4, 4); scene.add(sun);
  const g = new THREE.Group(); scene.add(g);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), mat("#9c9f9a")); floor.rotation.x = -Math.PI / 2; g.add(floor);
  box(g, 14, 0.12, 0.02, "#e0b023", 0, 0.01, 1.3); // safety line on the floor
  box(g, 14, 4, 0.1, "#c4c8c3", 0, 2, -2.6);
  if (id !== "util") body(g, type); // the utilities cabinet has no machine behind it, only its pipes
  const hmi = document.createElement("canvas"); hmi.width = HMI_W; hmi.height = HMI_H;
  const tex = new THREE.CanvasTexture(hmi); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const gauges: GaugeTex[] = [];
  const hasScreen = c.mount !== "pipes";
  const panel = new THREE.Group();
  let mountGroup: THREE.Group | null = null;
  if (c.mount === "pipes") {
    // a utilities cabinet: pipes for water, oil and air run across its front, each with a real round gauge on it
    box(g, 2.9, 2.4, 0.3, "#cfd3cd", 0, 1.2, -0.3); box(g, 2.9, 0.08, 0.34, "#7f8a94", 0, 2.4, -0.3);
    const rows: [Signal[], number][] = [[gaugeSignals(id).slice(0, 2), 0.55], [gaugeSignals(id).slice(2, 4), 1.4]];
    for (const [sigs, y] of rows) {
      gauges.push(...gaugeRow(g, sigs, 0, y, 0.0, 1.05));
      const colour = (i: number) => MEDIUM[sigs[i]?.pipe ?? "oil"];
      for (const [i, sx] of [[0, -1], [sigs.length - 1, 1]] as const) {
        const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.35, 20), mat(colour(i), { metalness: 0.3, roughness: 0.5 })); stub.rotation.z = Math.PI / 2; stub.position.set(sx * (0.525 * sigs.length + 0.2), y, 0); g.add(stub);
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 16), mat("#c33")); wheel.rotation.x = Math.PI / 2; wheel.position.set(sx * (0.525 * sigs.length + 0.12), y + 0.1, 0); g.add(wheel);
        box(g, 0.02, 0.1, 0.02, "#444", sx * (0.525 * sigs.length + 0.12), y + 0.05, 0);
      }
    }
    cyl(g, 0.045, 1.3, MEDIUM[gaugeSignals(id)[0].pipe ?? "oil"], -1.3, 1.9, 0.0); cyl(g, 0.045, 1.3, MEDIUM.oil, 1.3, 1.9, 0.0);
  } else {
    const mount = new THREE.Group(); mountGroup = mount; mount.position.set(...c.pos); mount.rotation.y = c.yaw; mount.scale.setScalar(c.scale); g.add(mount);
    fixture(mount, c.mount, plate, c.pos[1] / c.scale);
    panel.rotation.x = c.pitch; mount.add(panel);
    panel.add(new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 0.07), mat(plate ? "#9aa0a6" : "#22262b")));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9 * HMI_H / HMI_W), new THREE.MeshBasicMaterial({ map: tex })); screen.position.z = 0.04; panel.add(screen);
    // gauges on a pipe below the screen, on the same cabinet
    const gs = gaugeSignals(id);
    if (gs.length) gauges.push(...gaugeRow(mount, gs, 0, -0.98, 0.07, 0.42));
  }
  const cam = new THREE.PerspectiveCamera(36, FEED_W / FEED_H, 0.1, 40);
  const home = new THREE.Vector3(...c.cam);
  cam.position.copy(home);
  const look = new THREE.Vector3(c.pos[0], c.pos[1] + (c.lookDy ?? 0), c.pos[2]);
  cam.lookAt(look);
  return { mount: mountGroup, gauges, hasScreen, panel, scene, cam, hmi, tex, look, home, at: -1 };
}

function entry(id: string): Entry {
  let e = cache.get(id);
  if (!e) { const m = MACHINES.find((x) => x.id === id)!; e = build(id, m.type); cache.set(id, e); }
  return e;
}

/** Redraw the screen texture when the demo clock moves on. */
function paint(e: Entry, id: string, tick: number, running: boolean) {
  if (e.at === tick) return;
  e.at = tick;
  if (e.hasScreen) {
    const sigs = panelSignals(id);
    drawHmi(e.hmi.getContext("2d")!, hmiTitle(id), sigs, sigs.map((s) => s.value(tick)), clock(tick, true), running, isPlate(id));
    e.tex.needsUpdate = true;
  }
  for (const gt of e.gauges) { // the needles move with the readings
    const c = gt.cv.getContext("2d")!; c.clearRect(0, 0, 256, 256);
    drawGaugeFace(c, 128, 128, 126, gt.sig, Number(gt.sig.value(tick)));
    gt.tex.needsUpdate = true;
  }
}

/** Draw one feed picture into `target`. */
export function drawFeed(target: HTMLCanvasElement, id: string, tick: number, phase: number, running: boolean): boolean {
  const e = entry(id);
  paint(e, id, tick, running);
  const ctx = target.getContext("2d");
  const r = renderer();
  if (!ctx) return false;
  if (!r) { ctx.drawImage(e.hmi, 0, 0, target.width, target.height); return false; }
  e.cam.position.copy(e.home); // a fixed mount: the picture does not drift
  void phase;
  e.cam.lookAt(e.look);
  r.render(e.scene, e.cam);
  ctx.drawImage(r.domElement, 0, 0, target.width, target.height);
  return true;
}

/** Where the camera's four corners are in the picture (0 to 1, from the top left): round the screen, or for a machine with only gauges, round the gauges. */
export function screenCorners(id: string): [number, number][] {
  const e = entry(id);
  e.cam.position.copy(e.home); e.cam.lookAt(e.look); e.cam.updateMatrixWorld(); e.cam.updateProjectionMatrix();
  e.scene.updateMatrixWorld(true); // the scene may not have been drawn yet
  // one box round everything the camera reads: the screen, plus the gauges on the pipe below it, or just the gauges
  let pts: [number, number, number][];
  let local: THREE.Object3D | null = e.panel;
  if (!e.hasScreen) pts = [[-1.15, 2.0, 0], [1.15, 2.0, 0], [1.15, 0.4, 0], [-1.15, 0.4, 0]];
  else if (e.gauges.length && e.mount) { local = e.mount; pts = [[-0.68, 0.36, 0.07], [0.68, 0.36, 0.07], [0.68, -1.05, 0.07], [-0.68, -1.05, 0.07]]; }
  else { const w = 0.45, h = 0.45 * HMI_H / HMI_W; pts = [[-w, h, 0.04], [w, h, 0.04], [w, -h, 0.04], [-w, -h, 0.04]]; }
  return pts.map(([x, y, z]) => {
    const v = new THREE.Vector3(x, y, z);
    if (local) v.applyMatrix4(local.matrixWorld);
    v.project(e.cam);
    return [(v.x + 1) / 2, (1 - v.y) / 2] as [number, number];
  });
}
