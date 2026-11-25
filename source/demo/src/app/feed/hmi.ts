/** The generic machine screen (no brand), drawn on a canvas. Used flat (the "Screen" view) and as the texture in the 3D feed. */
import { isBad, fmt, type Signal } from "../world";

export type Box = [number, number, number, number];
export const HMI_W = 512, HMI_H = 320;

/** Where value i of n sits on the screen, as fractions of the screen. The value boxes in the app use the same numbers. */
export function slotBox(n: number, i: number): Box {
  const L: Record<number, Box[]> = {
    2: [[0.05, 0.24, 0.9, 0.32], [0.05, 0.6, 0.9, 0.32]],
    3: [[0.05, 0.24, 0.43, 0.34], [0.52, 0.24, 0.43, 0.34], [0.05, 0.64, 0.9, 0.28]],
    4: [[0.05, 0.24, 0.43, 0.32], [0.52, 0.24, 0.43, 0.32], [0.05, 0.6, 0.43, 0.32], [0.52, 0.6, 0.43, 0.32]],
    6: [[0.04, 0.22, 0.29, 0.34], [0.355, 0.22, 0.29, 0.34], [0.67, 0.22, 0.29, 0.34], [0.04, 0.6, 0.29, 0.34], [0.355, 0.6, 0.29, 0.34], [0.67, 0.6, 0.29, 0.34]],
    5: [[0.05, 0.22, 0.43, 0.25], [0.52, 0.22, 0.43, 0.25], [0.05, 0.5, 0.43, 0.25], [0.52, 0.5, 0.43, 0.25], [0.05, 0.79, 0.9, 0.15]],
  };
  return (L[Math.min(6, Math.max(2, n))] ?? L[4])[i] ?? [0, 0, 0.1, 0.1];
}

/** Machines whose panel is a light plate with instruments (dials, tubes, counters), not a dark screen. */
const PLATE = new Set(["saw", "wash", "press1", "press2", "weld1", "weld2"]);
export const isPlate = (id: string) => PLATE.has(id);

type Ctx = CanvasRenderingContext2D;
interface Pal { bg: string; slot: string; stroke: string; bad: string; badStroke: string; label: string; ink: string; badInk: string; track: string; fill: string }
const LCD: Pal = { bg: "#0e1620", slot: "#14212e", stroke: "#2b3f55", bad: "#3a1518", badStroke: "#d03b3b", label: "#8ea3b8", ink: "#f4f8fc", badInk: "#ff8a8a", track: "#2b3f55", fill: "#4aa3ff" };
const PLT: Pal = { bg: "#d7dad5", slot: "#eef0ec", stroke: "#9a9d99", bad: "#f6dcdc", badStroke: "#d03b3b", label: "#4a4f55", ink: "#161616", badInk: "#b42d2d", track: "#c1c3bc", fill: "#2874d2" };

const PIPE = { water: "#3d8fe0", oil: "#d9a21b", air: "#9aa6ad" } as const;
const SEG: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg" };
/** One seven-segment digit in the box (x, y, w, h). */
function seven(c: Ctx, ch: string, x: number, y: number, w: number, h: number, on: string, off: string) {
  const t = Math.max(3, w * 0.16), m = h / 2;
  const seg: Record<string, [number, number, number, number]> = {
    a: [x + t, y, w - 2 * t, t], b: [x + w - t, y + t, t, m - t], c: [x + w - t, y + m, t, m - t], d: [x + t, y + h - t, w - 2 * t, t],
    e: [x, y + m, t, m - t], f: [x, y + t, t, m - t], g: [x + t, y + m - t / 2, w - 2 * t, t],
  };
  const lit = SEG[ch] ?? "";
  for (const k of Object.keys(seg)) { c.fillStyle = lit.includes(k) ? on : off; c.fillRect(...seg[k]); }
}

function drawInstrument(c: Ctx, s: Signal, v: number | string, x: number, y: number, w: number, h: number, p: Pal, bad: boolean) {
  const ink = bad ? p.badInk : p.ink;
  const frac = (n: number) => { const [lo, hi] = s.range ?? [0, 100]; return Math.max(0, Math.min(1, (n - lo) / (hi - lo))); };
  const text = typeof v === "number" ? v.toLocaleString("en-GB") : v;
  const style = s.style ?? "digits";
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  const narrow = w < 200;
  if (style === "dial" && typeof v === "number") {
    const r = Math.min(w * (narrow ? 0.36 : 0.3), h - 28), cx = x + w * (narrow ? 0.38 : 0.34), cy = y + h - 10;
    if (s.pipe) { // the gauge sits on a pipe: a coloured pipe runs behind it, edge to edge
      c.fillStyle = PIPE[s.pipe]; c.fillRect(x, cy - 6, w, 14); c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(x, cy - 4, w, 3);
      c.fillStyle = "#6b7078"; c.fillRect(x + w * 0.1, cy - 9, 7, 20); c.fillRect(x + w * 0.9 - 7, cy - 9, 7, 20);
    }
    c.lineWidth = 7; c.strokeStyle = p.track; c.beginPath(); c.arc(cx, cy, r, Math.PI, 2 * Math.PI); c.stroke();
    if (s.high != null && s.range) { c.strokeStyle = "#d03b3b"; c.beginPath(); c.arc(cx, cy, r, Math.PI + frac(s.high) * Math.PI, 2 * Math.PI); c.stroke(); }
    c.lineWidth = 2; c.strokeStyle = p.label;
    for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; c.beginPath(); c.moveTo(cx + Math.cos(a) * (r - 11), cy + Math.sin(a) * (r - 11)); c.lineTo(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5)); c.stroke(); }
    const a = Math.PI + frac(v) * Math.PI;
    c.lineWidth = 3; c.strokeStyle = bad ? "#d03b3b" : ink; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); c.stroke();
    c.fillStyle = ink; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill();
    c.font = `600 ${Math.min(narrow ? 17 : 26, h * 0.3)}px 'JetBrains Mono', monospace`; c.fillStyle = ink; c.fillText(text, x + w * (narrow ? 0.68 : 0.66), y + h * 0.58);
    c.font = "500 13px Inter, sans-serif"; c.fillStyle = p.label; c.fillText(s.unit, x + w * (narrow ? 0.68 : 0.66), y + h * 0.58 + 16);
  } else if (style === "level" && typeof v === "number") {
    const th = h - 30, tx = x + 16, ty = y + 22;
    c.fillStyle = p.track; c.fillRect(tx, ty, 18, th);
    c.fillStyle = bad ? "#d03b3b" : p.fill; const fh = th * frac(v); c.fillRect(tx, ty + th - fh, 18, fh);
    c.strokeStyle = p.label; c.lineWidth = 2; c.strokeRect(tx, ty, 18, th);
    c.font = `600 ${Math.min(30, h * 0.36)}px 'JetBrains Mono', monospace`; c.fillStyle = ink; c.fillText(text, x + 48, y + h * 0.66);
    c.font = "500 14px Inter, sans-serif"; c.fillStyle = p.label; c.fillText(s.unit, x + 52 + c.measureText(text).width * 2.2, y + h * 0.66);
  } else if (style === "bar" && typeof v === "number") {
    c.fillStyle = p.track; c.fillRect(x + 10, y + h * 0.5, w - 20, 14);
    c.fillStyle = bad ? "#d03b3b" : p.fill; c.fillRect(x + 10, y + h * 0.5, (w - 20) * frac(v), 14);
    c.font = `600 ${Math.min(28, h * 0.3)}px 'JetBrains Mono', monospace`; c.fillStyle = ink; c.textAlign = "right"; c.fillText(`${text} ${s.unit}`, x + w - 10, y + 24 + h * 0.12); c.textAlign = "left";
  } else if (style === "wheel" && typeof v === "number") {
    const n = 5, ds = String(v).padStart(n, "0").slice(-n), dw = Math.min(30, (w - 24) / n), dh = Math.min(44, h - 32);
    for (let i = 0; i < n; i++) {
      c.fillStyle = "#15181b"; c.fillRect(x + 12 + i * (dw + 3), y + h - dh - 8, dw, dh);
      c.fillStyle = "#f2f2ee"; c.font = `600 ${dh * 0.75}px 'JetBrains Mono', monospace`; c.textAlign = "center"; c.fillText(ds[i], x + 12 + i * (dw + 3) + dw / 2, y + h - 14); c.textAlign = "left";
    }
  } else if (style === "seven" && typeof v === "number") {
    const ds = String(Math.round(v)), dh = Math.min(48, h - 30), dw = Math.min(dh * 0.55, (w * 0.6) / Math.max(2, ds.length));
    c.fillStyle = "#170d0d"; c.fillRect(x + 8, y + h - dh - 14, ds.length * (dw + 8) + 14, dh + 12);
    for (let i = 0; i < ds.length; i++) seven(c, ds[i], x + 15 + i * (dw + 8), y + h - dh - 8, dw, dh, "#ff6a3d", "#3a1a14");
    c.font = "500 15px Inter, sans-serif"; c.fillStyle = p.label; c.fillText(s.unit, x + 24 + ds.length * (dw + 8), y + h - 12);
  } else if (style === "valve") {
    const cx = x + w * (narrow ? 0.25 : 0.3), cy = y + h * 0.62, isOpen = String(v).toLowerCase() === "open";
    c.fillStyle = "#7f8a94"; c.fillRect(x + 10, cy - 7, w * (narrow ? 0.5 : 0.6), 14);
    c.fillStyle = "#4a5560"; c.fillRect(cx - 5, cy - 18, 10, 36);
    c.fillStyle = "#2b3036"; c.beginPath(); c.arc(cx, cy, 12, 0, 7); c.fill();
    c.lineWidth = 7; c.lineCap = "round"; c.strokeStyle = isOpen ? "#2fd05a" : "#d03b3b";
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(isOpen ? cx + 42 : cx, isOpen ? cy : cy - 38); c.stroke(); c.lineCap = "butt";
    c.font = `600 ${narrow ? 17 : 22}px Inter, sans-serif`; c.fillStyle = ink; c.fillText(text, x + w * (narrow ? 0.58 : 0.72), cy + 7);
  } else if (style === "lamps") {
    const t = String(v).toLowerCase(), col = /auto|run/.test(t) ? "#2fd05a" : /fault|alarm|low/.test(t) ? "#d03b3b" : "#f2b233";
    const cols = ["#2fd05a", "#f2b233", "#d03b3b"];
    cols.forEach((k, i) => { c.fillStyle = k === col ? k : "#3a3f45"; c.beginPath(); c.arc(x + 22 + i * (narrow ? 24 : 34), y + h * 0.6, narrow ? 9 : 12, 0, 7); c.fill(); if (k === col) { c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke(); } });
    c.font = "600 22px Inter, sans-serif"; c.fillStyle = ink; c.fillText(text, x + (narrow ? 90 : 118), y + h * 0.6 + 8);
  } else {
    const big = Math.min(h * 0.58, 46);
    c.fillStyle = ink; c.font = `600 ${big}px 'JetBrains Mono', monospace`; c.fillText(text, x + 10, y + h - 9);
    if (s.unit) { const tw = c.measureText(text).width; c.fillStyle = p.label; c.font = `500 ${Math.max(14, big * 0.42)}px Inter, sans-serif`; c.fillText(s.unit, x + 16 + tw, y + h - 10); }
  }
}

/* ------------------------------ round gauges on pipes ------------------------------ */

export const MEDIUM = { water: "#3d8fe0", oil: "#d9a21b", air: "#9aa6ad" } as const;
const fnum = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** A round pressure gauge like a real one: chrome case, white face, 270 degree scale, black needle. (cx, cy) is the centre, R the outer radius. */
export function drawGaugeFace(c: CanvasRenderingContext2D, cx: number, cy: number, R: number, s: Signal, v: number) {
  const [lo, hi] = s.range ?? [0, 100];
  const start = Math.PI * 0.75, sweep = Math.PI * 1.5, ang = (f: number) => start + Math.max(0, Math.min(1, f)) * sweep;
  const g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
  g.addColorStop(0, "#eef0f2"); g.addColorStop(1, "#8d949a");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
  c.fillStyle = "#fbfbfa"; c.beginPath(); c.arc(cx, cy, R * 0.9, 0, 7); c.fill();
  c.strokeStyle = "#6f767c"; c.lineWidth = Math.max(1, R * 0.015); c.beginPath(); c.arc(cx, cy, R * 0.9, 0, 7); c.stroke();
  if (s.high != null && s.high < hi) { // the zone to stay out of
    c.strokeStyle = "#d03b3b"; c.lineWidth = R * 0.05; c.beginPath(); c.arc(cx, cy, R * 0.8, ang((s.high - lo) / (hi - lo)), ang(1)); c.stroke();
  }
  c.strokeStyle = "#161616"; c.fillStyle = "#161616"; c.textAlign = "center"; c.textBaseline = "middle";
  const N = 25;
  for (let i = 0; i <= N; i++) {
    const a = ang(i / N), major = i % 5 === 0, r1 = R * 0.9 - 2, r0 = r1 - R * (major ? 0.14 : 0.07);
    c.lineWidth = Math.max(1, R * (major ? 0.035 : 0.016));
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.stroke();
  }
  c.font = `600 ${R * 0.16}px Inter, sans-serif`;
  for (let k = 0; k <= 5; k++) { const a = ang(k / 5); c.fillText(fnum(lo + ((hi - lo) * k) / 5), cx + Math.cos(a) * R * 0.58, cy + Math.sin(a) * R * 0.58); }
  c.font = `500 ${R * 0.15}px Inter, sans-serif`; c.fillText(s.unit, cx, cy + R * 0.42);
  const a = ang((v - lo) / (hi - lo)), tip = R * 0.76, tail = R * 0.2;
  c.fillStyle = "#111"; c.beginPath();
  c.moveTo(cx + Math.cos(a) * tip, cy + Math.sin(a) * tip);
  c.lineTo(cx + Math.cos(a + Math.PI / 2) * R * 0.035, cy + Math.sin(a + Math.PI / 2) * R * 0.035);
  c.lineTo(cx - Math.cos(a) * tail, cy - Math.sin(a) * tail);
  c.lineTo(cx + Math.cos(a - Math.PI / 2) * R * 0.035, cy + Math.sin(a - Math.PI / 2) * R * 0.035);
  c.closePath(); c.fill();
  c.fillStyle = "#3a3f45"; c.beginPath(); c.arc(cx, cy, R * 0.06, 0, 7); c.fill();
}

/** Where gauge i of 4 sits when a machine has gauges and no screen (the flat gauge board). Fractions of the picture. */
export const boardBox = (i: number): Box => ([[0.03, 0.03, 0.45, 0.45], [0.52, 0.03, 0.45, 0.45], [0.03, 0.52, 0.45, 0.45], [0.52, 0.52, 0.45, 0.45]] as Box[])[i] ?? [0, 0, 0.1, 0.1];

/** The gauges of a machine with no screen, side by side on their pipes, flat. */
export function drawGaugeBoard(ctx: CanvasRenderingContext2D, title: string, sigs: Signal[], values: (number | string)[]) {
  const W = HMI_W, H = HMI_H;
  ctx.fillStyle = "#c9cdc7"; ctx.fillRect(0, 0, W, H);
  sigs.forEach((s, i) => {
    const [fx, fy, fw, fh] = boardBox(i), x = fx * W, y = fy * H, w = fw * W, h = fh * H;
    const R = Math.min(w * 0.5, h * 0.42), cx = x + w / 2, cy = y + R + 2, py = y + h - 16;
    ctx.fillStyle = MEDIUM[s.pipe ?? "oil"]; ctx.fillRect(x, py, w, 16);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x, py + 2, w, 3);
    ctx.fillStyle = "#6b7078"; ctx.fillRect(x + 8, py - 3, 6, 22); ctx.fillRect(x + w - 14, py - 3, 6, 22);
    ctx.fillStyle = "#b08a3a"; ctx.fillRect(cx - 6, cy + R * 0.95, 12, py - (cy + R * 0.95)); // brass stem
    drawGaugeFace(ctx, cx, cy, R, s, Number(values[i]));
  });
  void title;
}

export function drawHmi(ctx: Ctx, title: string, sigs: Signal[], values: (number | string)[], clockText: string, running: boolean, plate = false) {
  const W = HMI_W, H = HMI_H, p = plate ? PLT : LCD;
  ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = plate ? "#c3c7c1" : "#1b2a3a"; ctx.fillRect(0, 0, W, H * 0.15);
  ctx.fillStyle = plate ? "#161616" : "#e8eef5"; ctx.font = "600 22px Inter, sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillText(title.toUpperCase(), 16, H * 0.075);
  if (!plate) {
    ctx.textAlign = "right"; ctx.font = "500 18px 'JetBrains Mono', monospace"; ctx.fillStyle = "#9fb3c8";
    ctx.fillText(clockText, W - 16, H * 0.075);
  }
  ctx.fillStyle = running ? "#2fd05a" : "#f2b233"; ctx.beginPath(); ctx.arc(W - (plate ? 24 : 150), H * 0.075, 6, 0, 7); ctx.fill();
  sigs.forEach((s, i) => {
    const [fx, fy, fw, fh] = slotBox(sigs.length, i);
    const x = fx * W, y = fy * H, w = fw * W, h = fh * H;
    const v = values[i], bad = isBad(s, v);
    ctx.fillStyle = bad ? p.bad : p.slot; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = bad ? p.badStroke : p.stroke; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    drawInstrument(ctx, s, v, x, y, w, h, p, bad);
    ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillStyle = p.label; ctx.font = `500 ${h > 70 ? 16 : 14}px Inter, sans-serif`;
    ctx.fillText(s.label.toUpperCase(), x + 10, y + 7);
  });
}

export const hmiTitle = (id: string) => ({ cnc1: "Mill 1", cnc2: "Mill 2", cnc3: "Mill 3", cnc4: "Mill 4", saw: "Band saw", wash: "Washer", press1: "Press 1", press2: "Press 2", weld1: "Weld 1", weld2: "Weld 2", util: "Utilities", robot: "Robot cell", cmm: "Measuring" } as Record<string, string>)[id] ?? id;
export { fmt };
