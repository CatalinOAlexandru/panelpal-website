import type { ReactNode } from "react";
export type MachineStatus = "running" | "idle" | "warning" | "alarm" | "offline" | "uncalibrated";
export type CameraStatus = "online" | "offline" | "error" | "connecting" | "connected" | "waiting";
export type AlertState = "open" | "acknowledged" | "resolved";
export type Severity = "critical" | "warning" | "info";

/** Every status = icon + word + colour (design system rule). */
export type PillTone = "running" | "idle" | "warning" | "fault" | "offline" | "inactive" | "info";
const TONE: Record<PillTone, { c: string; icon: string }> = {
  running: { c: "bg-running-soft text-running", icon: "●" },
  idle: { c: "bg-idle-soft text-idle", icon: "❚❚" },
  warning: { c: "bg-warning-soft text-warning border border-warning-dot", icon: "▲" },
  fault: { c: "bg-fault-soft text-fault", icon: "✕" },
  offline: { c: "bg-offline-soft text-offline border border-dashed border-offline-dot", icon: "◌" },
  inactive: { c: "bg-inactive-soft text-inactive border border-dashed border-inactive-dot", icon: "○" },
  info: { c: "bg-accent-soft text-accent-strong", icon: "●" },
};

export function Pill({ tone, children, small }: { tone: PillTone; children: ReactNode; small?: boolean }) {
  const t = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${small ? "px-2 py-px text-[11px]" : "px-2.5 py-[3px] text-xs"} ${t.c}`}>
      <span aria-hidden className={tone === "idle" ? "text-[7px] tracking-[-1.5px]" : "text-[8px]"}>{t.icon}</span>
      {children}
    </span>
  );
}

export const MACHINE: Record<MachineStatus, { tone: PillTone; word: string; dot: string; soft: string; stroke: string }> = {
  running: { tone: "running", word: "Running", dot: "bg-running-dot", soft: "var(--color-running-soft)", stroke: "var(--color-running-dot)" },
  idle: { tone: "idle", word: "Idle", dot: "bg-idle-dot", soft: "var(--color-idle-soft)", stroke: "var(--color-idle-dot)" },
  warning: { tone: "warning", word: "Check reading", dot: "bg-warning-dot", soft: "var(--color-warning-soft)", stroke: "var(--color-warning-dot)" },
  alarm: { tone: "fault", word: "Alarm", dot: "bg-fault-dot", soft: "var(--color-fault-soft)", stroke: "var(--color-fault-dot)" },
  offline: { tone: "offline", word: "No signal", dot: "bg-offline-dot", soft: "var(--color-offline-soft)", stroke: "var(--color-offline-dot)" },
  uncalibrated: { tone: "inactive", word: "Not calibrated", dot: "bg-inactive-dot", soft: "var(--color-inactive-soft)", stroke: "var(--color-inactive-dot)" },
};

export function MachinePill({ status, small }: { status: MachineStatus; small?: boolean }) {
  return <Pill tone={MACHINE[status].tone} small={small}>{MACHINE[status].word}</Pill>;
}

export function CameraPill({ status, small }: { status: CameraStatus; small?: boolean }) {
  if (status === "online") return <Pill tone="running" small={small}>Online</Pill>;
  if (status === "error") return <Pill tone="fault" small={small}>Error</Pill>;
  if (status === "offline") return <Pill tone="offline" small={small}>Offline</Pill>;
  if (status === "connecting") return <Pill tone="warning" small={small}>Connecting</Pill>;
  // PanelPal camera that checks in but sent no picture in the last few reads
  if (status === "connected") return <span title="The camera is on and talking to PanelPal, but no picture came through in the last few reads."><Pill tone="warning" small={small}>Connected</Pill></span>;
  return <Pill tone="inactive" small={small}>Waiting</Pill>;
}

export function AlertPill({ state }: { state: AlertState }) {
  if (state === "open") return <Pill tone="fault" small>Open</Pill>;
  if (state === "acknowledged") return <Pill tone="warning" small>Acknowledged</Pill>;
  return <Pill tone="running" small>Resolved</Pill>;
}

export function SeverityPill({ severity }: { severity: Severity | string }) {
  if (severity === "critical") return <Pill tone="fault" small>Critical</Pill>;
  if (severity === "warning") return <Pill tone="warning" small>Warning</Pill>;
  return <Pill tone="info" small>Info</Pill>;
}

/** Confidence chip: 0.90+ high, 0.70-0.89 check, below 0.70 unsure. */
export function Conf({ v }: { v: number | null | undefined }) {
  if (v === null || v === undefined) return null;
  const bg = v >= 0.9 ? "bg-cam-high" : v >= 0.7 ? "bg-cam-mid" : "bg-cam-low";
  const tail = v >= 0.9 ? "" : v >= 0.7 ? " ▲ check" : " ✕ unsure";
  return (
    <span title="How sure the reader is" className={`whitespace-nowrap rounded-[3px] px-[5px] py-[3px] font-mono text-[10px] font-medium leading-none text-white ${bg}`}>
      {v.toFixed(2)}{tail}
    </span>
  );
}

/** Live connection indicator. */
export function LiveDot({ conn }: { conn: "connecting" | "live" | "offline" }) {
  if (conn === "live")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-running-soft px-2 py-1 text-xs font-semibold text-running sm:px-2.5 sm:py-0.5" title="Receiving live readings" aria-label="Live">
        <span className="pp-pulse h-1.5 w-1.5 rounded-full bg-running-dot" /><span className="hidden sm:inline">Live</span>
      </span>
    );
  if (conn === "connecting")
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">◌ Connecting</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-fault-soft px-2.5 py-0.5 text-xs font-semibold text-fault">✕ Offline</span>;
}

export const MACHINE_PILL = MACHINE;
