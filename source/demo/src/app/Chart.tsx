import { useId } from "react";
import { clock } from "../data";

const COLORS = ["var(--color-chart-line)", "var(--color-chart-line-2)", "var(--color-idle)", "var(--color-warning)"];
export interface Line { label: string; unit?: string; points: { t: number; v: number }[]; high?: number }

/** Line chart of the last hour or less (one point a minute; the axis follows the number of points). Several lines share one axis. A dashed red line marks a limit. */
export function LineChart({ lines, height = 200, tick = 0, showStops = true }: { lines: Line[]; height?: number; tick?: number; showStops?: boolean }) {
  const id = useId();
  const W = 600, H = height, L = 44, R = 8, T = 8, B = 22;
  const all = lines.flatMap((l) => l.points.map((p) => p.v));
  const hi0 = Math.max(...all, ...lines.map((l) => l.high ?? -Infinity).filter((x) => isFinite(x) && lines.length === 1));
  const lo0 = Math.min(...all, 0);
  const pad = (hi0 - lo0) * 0.08 || 1;
  const hi = hi0 + pad, lo = Math.max(0, lo0);
  const x = (i: number, n: number) => L + (i / (n - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = [0, 0.5, 1].map((f) => lo + (hi - lo) * f);
  const base = lines[0]?.points ?? [];
  const n = Math.max(2, base.length);
  const labelAt = (i: number) => clock(tick - (n - 1 - i) * 60, false);
  const labelIdx = [0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1];
  const stops: number[] = [];
  if (showStops && lines.length === 1) base.forEach((p, i) => { if (p.v < (hi0 * 0.15)) stops.push(i); });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ height }} role="img" aria-label={`Line chart of the last ${n >= 60 ? "hour" : `${n} minutes`}. Example data.`}>
      {ticks.map((v, i) => (
        <g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--color-chart-grid)" /><text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-chart-axis)">{Math.round(v).toLocaleString("en-GB")}</text></g>
      ))}
      {labelIdx.map((i) => <text key={i} x={x(i, n)} y={H - 5} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="11" fill="var(--color-chart-axis)">{labelAt(i)}</text>)}
      {stops.length > 0 && <rect x={x(Math.max(0, stops[0] - 1), n)} width={x(Math.min(n - 1, stops[stops.length - 1] + 1), n) - x(Math.max(0, stops[0] - 1), n)} y={T} height={H - T - B} fill="var(--color-fault-soft)" />}
      {lines.length === 1 && lines[0].high != null && lines[0].high < hi && <line x1={L} x2={W - R} y1={y(lines[0].high!)} y2={y(lines[0].high!)} stroke="var(--color-chart-limit)" strokeDasharray="4 4" />}
      {lines.map((l, k) => (
        <polyline key={`${id}${k}`} fill="none" stroke={COLORS[k % COLORS.length]} strokeWidth="1.8" strokeLinejoin="round" points={l.points.map((p, i) => `${x(i, l.points.length).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")} />
      ))}
    </svg>
  );
}
export const lineColor = (k: number) => COLORS[k % COLORS.length];

/** Small line for a tile. */
export function Spark({ points, className = "" }: { points: { v: number }[]; className?: string }) {
  const lo = Math.min(...points.map((p) => p.v)), hi = Math.max(...points.map((p) => p.v));
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${28 - ((p.v - lo) / (hi - lo || 1)) * 24}`).join(" ");
  return <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden><polyline points={d} fill="none" stroke="var(--color-chart-line)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" /></svg>;
}
