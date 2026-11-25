/**
 * Example data for the mock app. EVERYTHING here is made up (all names, numbers, times).
 * The same readings are used by the machine tiles, the charts, the camera feeds, the alerts and the PanelAI answers,
 * so that every screen agrees with every other screen.
 */
import { MACHINES, clock, type Machine } from "../data";
import { zoneById } from "../../../shared/floorplan";
import type { MachineStatus } from "./ui";

/* ---------------------------------- world state ---------------------------------- */

/** How much of CNC mill 3 is set up. The dress rehearsal walks it from "none" to "live". */
export interface World {
  /** none: no camera on the machine. camera: camera picked, values not mapped. live: values read. */
  cnc3: "none" | "camera" | "live";
  /** The camera for CNC mill 3 exists (it was connected in the rehearsal). */
  cam3: boolean;
  /** How often the camera of CNC mill 3 sends a picture to PanelPal. Optional. */
  pics3: PicMode;
}
export const FINISHED: World = { cnc3: "live", cam3: true, pics3: "10min" };

/** What the camera sends to the PanelPal server besides the readings. Always optional. */
export type PicMode = "off" | "10min" | "unsure";
export const PIC_WORDS: Record<PicMode, { label: string; short: string }> = {
  off: { label: "Not now", short: "Readings only" },
  "10min": { label: "A picture every 10 minutes", short: "Picture every 10 min" },
  unsure: { label: "Only when a reading is unsure", short: "Picture when unsure" },
};

/* ---------------------------------- signals ---------------------------------- */

export interface Signal {
  id: string;
  label: string;
  unit: string;
  kind: "number" | "word";
  /** Reader confidence, 0 to 1. */
  conf: number;
  low?: number;
  high?: number;
  /** Counters only go up (a chart of them is a ramp). */
  counter?: boolean;
  /** A word that means a problem (shown red). */
  bad?: boolean;
  /** How the instrument looks on the panel. Default: digits on a screen. */
  style?: "digits" | "seven" | "dial" | "level" | "bar" | "wheel" | "valve" | "lamps";
  /** Full scale for a dial, level or bar. */
  range?: [number, number];
  /** A round gauge fitted on a pipe (not part of a panel): what runs in the pipe. */
  pipe?: "water" | "oil" | "air";
  /** True for a gauge on a pipe. It is drawn as its own round gauge, not on the panel screen. */
  phys?: boolean;
  /** Value on the demo clock, in seconds from the start. Same t, same value. */
  value: (t: number) => number | string;
}

const wave = (t: number, p: number) => Math.sin(t / p);
const rpm = (base: number, conf = 0.97): Signal => ({ id: "rpm", label: "Spindle speed", unit: "rpm", kind: "number", conf, low: 0, high: 12000, value: (t) => base + Math.round(wave(t, 5) * 2) * 10 });
const load = (base: number, conf = 0.96): Signal => ({ id: "load", label: "Spindle load", unit: "%", kind: "number", conf, low: 0, high: 85, value: (t) => base + Math.round(2.2 * wave(t, 3.1) + 1.3 * wave(t, 1.7)) });
const counter = (id: string, label: string, start: number, every: number, conf = 0.98, unit = ""): Signal => ({ id, label, unit, kind: "number", conf, counter: true, value: (t) => start + Math.floor(t / every) });
const level = (id: string, label: string, unit: string, base: number, amp: number, conf: number, extra: Partial<Signal> = {}): Signal => ({ id, label, unit, kind: "number", conf, value: (t) => base + Math.round(wave(t, 4) * amp), ...extra });
const word = (id: string, label: string, v: string, conf = 0.95, bad = false): Signal => ({ id, label, unit: "", kind: "word", conf, bad, value: () => v });

const st = (s: Signal, style: NonNullable<Signal["style"]>, range?: [number, number]): Signal => ({ ...s, style, range });
/** A dial gauge with a slowly moving needle. */
const gauge = (id: string, label: string, unit: string, base: number, amp: number, range: [number, number], conf: number, extra: Partial<Signal> = {}): Signal =>
  ({ id, label, unit, kind: "number", conf, style: "dial", range, phys: true, pipe: "oil", value: (t) => Math.round((base + wave(t, 7) * amp) * 10) / 10, ...extra });
const open = (id: string, label: string, v: string, conf = 0.94): Signal => ({ ...word(id, label, v, conf), style: "valve" });

export const SIGNALS: Record<string, Signal[]> = {
  cnc1: [rpm(7200), st(load(55), "bar", [0, 100]), counter("parts", "Parts today", 288, 7), word("alarm", "Alarm", "None", 0.93)],
  cnc2: [word("coolant", "Coolant", "Low", 0.96, true), rpm(6800), st(load(61), "bar", [0, 100]), counter("parts", "Parts today", 241, 9)],
  cnc3: [rpm(8000), load(42), counter("parts", "Parts today", 312, 6), word("alarm", "Alarm", "None", 0.88), level("feed", "Feed rate", "mm/min", 1250, 10, 0.93, { low: 0, high: 3000 })],
  cnc4: [rpm(6500), st(load(48), "bar", [0, 100]), counter("parts", "Parts today", 265, 8), word("alarm", "Alarm", "None", 0.94)],
  saw: [st(level("blade", "Blade speed", "m/min", 62, 1, 0.95, { low: 20, high: 90 }), "dial", [0, 100]), st(counter("cuts", "Cut count", 540, 8, 0.97), "wheel"), gauge("hyd", "Hydraulic pressure", "bar", 40, 1, [0, 100], 0.94, { low: 25, high: 80 }), gauge("coolant", "Coolant pressure", "bar", 3, 0.1, [0, 6], 0.92, { low: 1.5, high: 5, pipe: "water" }), gauge("motor", "Gearbox oil temperature", "°C", 48, 1, [0, 120], 0.93, { high: 85 })],
  wash: [st(level("tank", "Tank temperature", "°C", 58, 1, 0.96, { low: 40, high: 75 }), "dial", [0, 100]), st(level("tanklvl", "Tank level", "%", 72, 1, 0.93, { low: 30, high: 95 }), "level", [0, 100]), { ...word("state", "Cycle state", "Idle", 0.92), style: "lamps" }, st(counter("cycles", "Cycles today", 37, 400, 0.98), "wheel"), gauge("water", "Water pressure", "bar", 3.5, 0.1, [0, 6], 0.94, { low: 2, high: 5, pipe: "water" })],
  press1: [st(counter("strokes", "Stroke count", 1904, 2, 0.97), "wheel"), st(level("tonnage", "Tonnage", "t", 142, 2, 0.95, { low: 0, high: 180 }), "dial", [0, 200]), st(level("die", "Die temperature", "°C", 64, 1, 0.94, { low: 20, high: 90 }), "seven"), open("valve", "Hydraulic valve", "Open")],
  press2: [st(counter("strokes", "Stroke count", 1766, 2, 0.97), "wheel"), st(level("tonnage", "Tonnage", "t", 138, 2, 0.95, { low: 0, high: 180 }), "dial", [0, 200]), st(level("die", "Die temperature", "°C", 61, 1, 0.94, { low: 20, high: 90 }), "seven"), open("valve", "Hydraulic valve", "Open"), gauge("oilp", "Oil pressure", "bar", 150, 2, [0, 250], 0.95, { low: 100, high: 200 }), gauge("oilt", "Oil temperature", "°C", 46, 1, [0, 100], 0.93, { high: 70 })],
  weld1: [st(level("current", "Weld current", "A", 185, 4, 0.95, { low: 0, high: 260 }), "seven"), st(level("arc", "Arc-on time", "%", 61, 1, 0.93), "level", [0, 100]), st(level("gas", "Gas flow", "l/min", 14, 1, 0.92, { low: 8, high: 25 }), "dial", [0, 30])],
  weld2: [st({ id: "current", label: "Weld current", unit: "A", kind: "number", conf: 0.95, low: 0, high: 260, value: () => 0 }, "seven"), st(level("arc", "Arc-on time", "%", 38, 0, 0.93), "level", [0, 100]), st(level("gas", "Gas flow", "l/min", 0, 0, 0.92, { high: 25 }), "dial", [0, 30])],
  robot: [{ ...word("state", "Program state", "Auto", 0.96), style: "lamps" }, st(counter("cycles", "Cycle count", 1120, 5, 0.97), "wheel"), word("fault", "Fault codes", "None", 0.9)],
  util: [gauge("water", "Water pressure", "bar", 4.2, 0.1, [0, 10], 0.96, { low: 2, high: 8, pipe: "water" }), gauge("oil", "Oil pressure", "bar", 6.1, 0.1, [0, 10], 0.95, { low: 3, high: 9, pipe: "oil" }), gauge("air", "Air pressure", "bar", 7, 0.1, [0, 12], 0.95, { low: 5, high: 10, pipe: "air" }), gauge("oilt", "Oil temperature", "°C", 48, 1, [0, 120], 0.94, { high: 90, pipe: "oil" })],
  cmm: [st(counter("measured", "Parts measured", 96, 20, 0.98), "seven"), st(level("pass", "Pass rate", "%", 98, 0, 0.96, { low: 90, high: 100 }), "dial", [80, 100])],
};

/** Signals drawn on the panel screen or plate, and gauges fitted on pipes. */
export const panelSignals = (id: string) => SIGNALS[id].filter((s) => !s.phys);
export const gaugeSignals = (id: string) => SIGNALS[id].filter((s) => s.phys);

export const fmt = (s: Signal, v: number | string): string => {
  if (typeof v === "string") return v;
  const n = v.toLocaleString("en-GB");
  return s.unit ? `${n} ${s.unit}` : n;
};
export const outOfRange = (s: Signal, v: number | string) => typeof v === "number" && ((s.high != null && v > s.high) || (s.low != null && v < s.low));
export const isBad = (s: Signal, v: number | string) => outOfRange(s, v) || (s.kind === "word" && !!s.bad);

/** 60 points for the last hour. Counters ramp up to now; others wobble, with a short stop (as on the real chart). */
export function history(machineId: string, sig: Signal, t: number): { t: number; v: number }[] {
  const n = 60;
  const now = Number(sig.value(t));
  const key = machineId.length * 7 + sig.id.length * 13;
  return Array.from({ length: n }, (_, i) => {
    const age = n - 1 - i;
    if (sig.counter) return { t: -age, v: Math.max(0, Math.round(now - age * (Number(sig.value(60)) - Number(sig.value(0))) / 1)) };
    const stop = (sig.id === "load" || sig.id === "rpm") && machineId.startsWith("cnc") && i >= 35 && i <= 40;
    const base = Number(sig.value(0));
    const wob = Math.sin((i + key) / 4) * (Math.abs(base) > 100 ? base * 0.012 : Math.max(1, Math.abs(base) * 0.04)) + Math.sin((i * 1.7 + key) / 2.3) * (Math.abs(base) > 100 ? base * 0.006 : 0.6);
    return { t: -age, v: stop ? (i === 35 || i === 40 ? base * 0.4 : base * 0.04) : Math.round((base + wob) * 10) / 10 };
  });
}

/* ---------------------------------- machines ---------------------------------- */

export interface MachineView extends Omit<Machine, "status"> {
  status: MachineStatus;
  signals: Signal[];
  /** The camera that reads this machine, or null. */
  camera: Camera | null;
}

export const statusOf = (m: Machine, w: World): MachineStatus =>
  m.id === "cnc3" && w.cnc3 !== "live" ? "uncalibrated" : m.status === "alarm" ? "alarm" : m.status === "idle" ? "idle" : "running";

export function machineViews(w: World): MachineView[] {
  const cams = cameras(w);
  return MACHINES.map((m) => ({ ...m, status: statusOf(m, w), signals: SIGNALS[m.id], camera: cams.find((c) => c.machineId === m.id) ?? null }));
}
export const machineView = (id: string, w: World) => machineViews(w).find((m) => m.id === id)!;

export const AREAS = Array.from(new Set(MACHINES.map((m) => m.area)));

/* ---------------------------------- cameras ---------------------------------- */

export interface Camera {
  id: string;
  name: string;
  machineId: string;
  pics: PicMode;
  fw: string;
  rssi: number;
  /** Chip temperature, °C. */
  temp: number;
}
const PICS: Record<string, PicMode> = { saw: "off", cmm: "off", wash: "unsure", weld2: "unsure" };
export function cameras(w: World): Camera[] {
  return MACHINES.filter((m) => m.id !== "cnc3" || w.cam3).map((m, i) => ({
    id: `cam-${m.id}`,
    name: `${m.id === "cmm" ? "CMM" : m.name} camera`,
    machineId: m.id,
    pics: m.id === "cnc3" ? w.pics3 : PICS[m.id] ?? "10min",
    fw: "0.9.4",
    rssi: -52 - ((i * 7) % 18),
    temp: 44 + ((i * 5) % 14),
  }));
}
/** The machine a camera is pointed at only counts once it is picked on the machine. */
export const cameraName = (id: string) => `${id === "cmm" ? "CMM" : MACHINES.find((m) => m.id === id)!.name} camera`;

/* ---------------------------------- alerts ---------------------------------- */

export interface AlertItem {
  id: number;
  state: "open" | "acknowledged" | "resolved";
  machineId: string;
  label: string;
  title: string;
  detail: string;
  when: string;
  suggestion?: { title: string; body: string };
}
export const ALERTS: AlertItem[] = [
  { id: 1, state: "open", machineId: "cnc2", label: "Coolant", title: "Coolant is low", detail: "The screen shows “Low”. It has shown this 4 times this week.", when: "Today 09:14, still open",
    suggestion: { title: "Top up the coolant and log the stop", body: "Each time, the machine ran on without coolant for a while and nobody logged downtime (about 2 h 30 min in total). A coolant check at shift start would catch it." } },
  { id: 2, state: "open", machineId: "cnc3", label: "Spindle load", title: "Spindle load is 18% above usual", detail: "Program O1042, since Tuesday. The limit is 85%, so no alarm yet.", when: "Today 08:02, still open",
    suggestion: { title: "Check the cutting tool (T4)", body: "A higher load on the same program usually means a worn tool. Change it at the next tool change." } },
  { id: 3, state: "open", machineId: "weld2", label: "Weld current", title: "Welder 2 idle for 40 minutes", detail: "Three shifts running, at shift handover.", when: "Today 10:02, still open",
    suggestion: { title: "Stagger the handover", body: "The handover overlaps with a break. Moving one of them could recover about 2 h a week." } },
  { id: 4, state: "acknowledged", machineId: "press1", label: "Die temperature", title: "Die temperature above 85 °C", detail: "Peaked at 88 °C, then fell back.", when: "Yesterday 15:20 to 15:48" },
  { id: 5, state: "resolved", machineId: "robot", label: "Fault codes", title: "Robot fault code E31", detail: "Cleared after a restart.", when: "Wed 11:05 to 11:12" },
  { id: 6, state: "resolved", machineId: "cnc4", label: "Spindle load", title: "Spindle load above 85%", detail: "Heavy cut on a new program.", when: "Tue 14:41 to 14:44" },
];

/* ---------------------------------- downtime (last 7 days) ---------------------------------- */

/** Minutes stopped in the last 7 days, and why. Used by the dashboards and by PanelAI, so the two always agree. */
export const DOWNTIME: Record<string, { minutes: number; why: string }> = {
  cnc1: { minutes: 95, why: "Tool changes" },
  cnc2: { minutes: 210, why: "Coolant low (150 min), tool changes" },
  cnc3: { minutes: 70, why: "Tool changes" },
  cnc4: { minutes: 55, why: "Tool changes" },
  saw: { minutes: 40, why: "Blade change" },
  press1: { minutes: 85, why: "Die change" },
  press2: { minutes: 60, why: "Die change" },
  weld1: { minutes: 45, why: "Wire change" },
  weld2: { minutes: 140, why: "Idle at shift handover" },
  robot: { minutes: 50, why: "Restart after fault E31" },
  wash: { minutes: 35, why: "Tank refill" },
  cmm: { minutes: 25, why: "Probe calibration" },
};
export const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min` : `${min} min`);

export interface AreaDowntime { area: string; zoneName: string; minutes: number; machines: { id: string; name: string; minutes: number; why: string }[] }
export function downtimeByArea(): AreaDowntime[] {
  const out = new Map<string, AreaDowntime>();
  for (const m of MACHINES) {
    const d = DOWNTIME[m.id];
    if (!d) continue; // the utilities cabinet does not make parts, so it has no downtime
    const a = out.get(m.area) ?? { area: m.area, zoneName: zoneById(m.zone).name, minutes: 0, machines: [] };
    a.minutes += d.minutes;
    a.machines.push({ id: m.id, name: m.id === "cmm" ? "CMM" : m.name, minutes: d.minutes, why: d.why });
    out.set(m.area, a);
  }
  return Array.from(out.values()).map((a) => ({ ...a, machines: a.machines.sort((x, y) => y.minutes - x.minutes) })).sort((x, y) => y.minutes - x.minutes);
}
export const TOTAL_DOWNTIME = Object.values(DOWNTIME).reduce((s, d) => s + d.minutes, 0);

/* ---------------------------------- dashboards ---------------------------------- */

export type Widget =
  | { type: "number"; w: number; title: string; value: string; about: string }
  | { type: "value"; w: number; machineId: string; signal: string }
  | { type: "chart"; w: number; h?: number; title: string; series: { machineId: string; signal: string }[] }
  | { type: "status"; w: number; machineId: string }
  | { type: "screen"; w: number; machineId: string }
  | { type: "alerts"; w: number }
  | { type: "bars"; w: number; title: string };

export interface DashboardDef { id: string; name: string; updated: string; widgets: Widget[] }
export const DASHBOARDS: DashboardDef[] = [
  { id: "machining", name: "Machining shift view", updated: "today", widgets: [
    { type: "number", w: 3, title: "Machines running", value: "10 of 13", about: "Now" },
    { type: "number", w: 3, title: "Open alerts", value: "3", about: "All areas" },
    { type: "number", w: 3, title: "Parts today (CNC 1 to 4)", value: "1,106", about: "Sum of the four counters" },
    { type: "number", w: 3, title: "Downtime, last 7 days", value: hm(TOTAL_DOWNTIME), about: "All machines" },
    { type: "chart", w: 8, h: 2, title: "Spindle load, CNC mills 1 to 4", series: [{ machineId: "cnc1", signal: "load" }, { machineId: "cnc2", signal: "load" }, { machineId: "cnc3", signal: "load" }, { machineId: "cnc4", signal: "load" }] },
    { type: "screen", w: 4, machineId: "cnc3" },
    { type: "value", w: 3, machineId: "cnc1", signal: "rpm" },
    { type: "value", w: 3, machineId: "cnc3", signal: "rpm" },
    { type: "status", w: 3, machineId: "cnc2" },
    { type: "alerts", w: 3 },
  ] },
  { id: "downtime", name: "Downtime by area", updated: "yesterday", widgets: [
    { type: "number", w: 4, title: "Downtime, last 7 days", value: hm(TOTAL_DOWNTIME), about: "All 12 machines" },
    { type: "number", w: 4, title: "Longest single machine", value: "CNC mill 2", about: hm(DOWNTIME.cnc2.minutes) },
    { type: "number", w: 4, title: "Biggest area", value: "Machining cell", about: hm(downtimeByArea()[0].minutes) },
    { type: "bars", w: 12, title: "Downtime per area, last 7 days" },
  ] },
  { id: "press-weld", name: "Press and weld", updated: "Tue", widgets: [
    { type: "status", w: 3, machineId: "press1" }, { type: "status", w: 3, machineId: "press2" },
    { type: "status", w: 3, machineId: "weld1" }, { type: "status", w: 3, machineId: "weld2" },
    { type: "chart", w: 6, h: 2, title: "Tonnage", series: [{ machineId: "press1", signal: "tonnage" }, { machineId: "press2", signal: "tonnage" }] },
    { type: "chart", w: 6, h: 2, title: "Weld current", series: [{ machineId: "weld1", signal: "current" }] },
  ] },
];

/** Alerts, times and the like on the demo clock. */
export const NOW_LABEL = (tick: number) => `Fri 30 Oct · ${clock(tick, false)}`;
