import { useMemo, type ReactNode } from "react";
import { Conf } from "./ui";
import { Spark } from "./Chart";
import { fmt, history, isBad, PIC_WORDS, type PicMode, type Signal } from "./world";

/** Reading tile: label, live value, confidence chip, optional sparkline (as in the PanelPal app). */
export function SignalTile({ machineId, signal: s, tick, stale, spark, selected, onClick, large }: { machineId: string; signal: Signal; tick: number; stale?: boolean; spark?: boolean; selected?: boolean; onClick?: () => void; large?: boolean }) {
  const v = s.value(tick);
  const out = !stale && isBad(s, v);
  const Tag = onClick ? "button" : "div";
  const pts = useMemo(() => (spark && s.kind === "number" ? history(machineId, s, 0).slice(-30) : null), [spark, machineId, s]);
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick}
      className={`block w-full min-w-0 rounded-[10px] px-2.5 py-2.5 text-left sm:px-3 ${selected ? "border-[1.5px] border-accent bg-accent-soft" : out ? "border-2 border-fault-dot bg-fault-soft" : "border border-border-strong bg-surface"} ${onClick ? "hover:border-accent" : ""}`}>
      <div className="flex items-center justify-between gap-1.5 text-xs text-muted"><span className="truncate">{s.label}</span>{!stale && <Conf v={s.conf} />}</div>
      <div className={`tnum mt-0.5 truncate font-semibold ${large ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"} ${stale ? "text-offline" : out ? "text-fault" : ""}`}>{stale ? "No signal" : fmt(s, v)}</div>
      {out && s.kind === "word" && <div className="text-[11px] font-semibold text-fault">✕ Needs attention</div>}
      {out && s.kind === "number" && <div className="text-[11px] font-semibold text-fault">✕ Outside {s.low ?? "–"} to {s.high ?? "–"}</div>}
      {pts && <Spark points={pts} className="mt-1 h-7 w-full" />}
    </Tag>
  );
}

/**
 * Where a camera's work happens, and what it sends. The camera reads its machine screen itself and sends only the values.
 * Sending pictures to the PanelPal server is optional, and off unless somebody turns it on.
 * `highlight` draws the optional part with a steady blue ring, for the guided stage.
 */
export function SendingOptions({ value, onChange, highlight, compact }: { value: PicMode; onChange?: (v: PicMode) => void; highlight?: boolean; compact?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-[10px] border-[1.5px] border-running-dot bg-running-soft px-3 py-2.5 text-sm">
        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-running text-[11px] text-white">✓</span>
        <div>
          <div className="font-semibold text-running">The camera reads the screen itself</div>
          {!compact && <div className="text-[13px] text-text">It finds each value on its own and sends only the number or word, a few bytes each time. The reading does not need the PanelPal computer.</div>}
        </div>
      </div>
      <div className={`rounded-[10px] border p-3 ${highlight ? "pp-optional border-accent bg-bg" : "border-border-strong bg-bg"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold">Send pictures to PanelPal</div>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Optional</span>
          <span className="text-[12px] text-muted">Off unless you turn it on</span>
        </div>
        {!compact && <p className="mt-1 text-[13px] text-muted">Readings reach PanelPal without any pictures. Send a picture only if you want to look at the screen from your desk or check a reading.</p>}
        <div className="mt-2 grid gap-1.5 sm:grid-cols-3" role="radiogroup" aria-label="Send pictures to PanelPal">
          {(Object.keys(PIC_WORDS) as PicMode[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange?.(k)}
              className={`rounded-[8px] border px-3 py-2 text-left text-[13px] ${value === k ? "border-[1.5px] border-accent bg-accent-soft font-semibold text-accent-strong" : "border-border-strong hover:bg-surface-2"} ${onChange ? "" : "cursor-default"}`}>
              {PIC_WORDS[k].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) { return <div className="flex flex-wrap items-center gap-2">{children}</div>; }
