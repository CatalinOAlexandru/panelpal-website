/**
 * PanelAI in the demo: three example questions with answers written in advance. There is no server, no model and no
 * lookup at run time. The answers have the same shape as the real app's (text, "How I got this" lookups) and use the
 * same example data as the rest of the demo (world.ts), so the numbers agree with the dashboards and alerts.
 */
import { ALERTS, DOWNTIME, TOTAL_DOWNTIME, downtimeByArea, hm } from "./world";
import { MACHINES } from "../data";

export interface Source { lookup: string; args: Record<string, string>; rows: (string | number)[][] }
export interface Answer {
  id: string;
  text: string;
  table?: { head: string[]; rows: (string | number)[][]; groups: number[] };
  sources: Source[];
  /** Time the real app takes for a question like this (shown as "How I got this · 2.4 s"). */
  ms: number;
}

export const PROMPTS = [
  { id: "downtime", text: "Give me a summary of downtime broken down per area, per machine", complex: true, note: "Complex: it joins every machine to its area, adds up the stops and says why." },
  { id: "alerts", text: "What alerts are open right now?", complex: false, note: "" },
  { id: "active", text: "Which machines are active today?", complex: false, note: "" },
] as const;

const areas = downtimeByArea();
const rows: (string | number)[][] = [];
const groups: number[] = [];
for (const a of areas) {
  groups.push(rows.length);
  rows.push([a.zoneName, "All machines", hm(a.minutes), `${Math.round((a.minutes / TOTAL_DOWNTIME) * 100)}%`]);
  for (const m of a.machines) rows.push(["", m.name, hm(m.minutes), m.why]);
}

const openAlerts = ALERTS.filter((a) => a.state === "open");
const name = (id: string) => MACHINES.find((m) => m.id === id)!.name;

export const ANSWERS: Record<string, Answer> = {
  downtime: {
    id: "downtime",
    text: [
      `Last 7 days: ${hm(TOTAL_DOWNTIME)} of downtime across the 12 machines that make parts.`,
      `- Machining cell: ${hm(areas[0].minutes)}. CNC mill 2 is the largest at ${hm(DOWNTIME.cnc2.minutes)}, and ${hm(150)} of that was low coolant.`,
      `- Press & weld: ${hm(areas[1].minutes)}. Welder 2 stood idle for ${hm(DOWNTIME.weld2.minutes)} at shift handover.`,
      `- Assembly / QA: ${hm(areas[2].minutes)}.`,
      `- Goods-in / raw stock: ${hm(areas[3].minutes)}.`,
      `- Office / QC room: ${hm(areas[4].minutes)}.`,
      "The table has every machine, with its main reason. Shares are rounded.",
    ].join("\n"),
    table: { head: ["Area", "Machine", "Downtime", "Main reason"], rows, groups },
    sources: [
      { lookup: "downtime summary", args: { window: "7d", group_by: "area, machine" }, rows: areas.flatMap((a) => a.machines.map((m) => [a.zoneName, m.name, m.minutes])).slice(0, 10) },
      { lookup: "downtime reasons", args: { window: "7d", top: "12" }, rows: Object.entries(DOWNTIME).slice(0, 5).map(([id, d]) => [name(id), d.why]) },
    ],
    ms: 2400,
  },
  alerts: {
    id: "alerts",
    text: [`${openAlerts.length} alerts are open right now:`, ...openAlerts.map((a) => `- ${name(a.machineId)}: ${a.title}. ${a.suggestion?.title ?? ""}.`)].join("\n"),
    sources: [{ lookup: "open alerts", args: { site: "Unit 1" }, rows: openAlerts.map((a) => [name(a.machineId), a.title, a.when]) }],
    ms: 900,
  },
  active: {
    id: "active",
    text: "All 13 machines sent readings today.\n- 10 are running, including the utilities cabinet.\n- 2 are idle: Parts washer and Welder 2.\n- 1 is in alarm: CNC mill 2, with low coolant.",
    sources: [{ lookup: "machines active", args: { day: "today" }, rows: MACHINES.map((m) => [m.name, m.status]) }],
    ms: 800,
  },
};

export const FREE_TEXT_REPLY = "In this demo PanelAI answers the three example questions. In the real app you can ask about your own machines, cameras and alerts.";
