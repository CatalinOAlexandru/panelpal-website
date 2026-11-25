import { useEffect, useRef, useState, type ReactNode } from "react";
import { MACHINES, clock } from "../../data";
import { SIGNALS, isBad, panelSignals } from "../world";
import { HMI_H, HMI_W, boardBox, drawGaugeBoard, drawHmi, hmiTitle, isPlate, slotBox } from "./hmi";

/** A 3D camera feed of one machine (see feedRenderer.ts). Draws only while on screen. Three.js loads when the first feed shows. */
export function Feed({ id, tick, running = true, className = "", fps = 2, still = false, children }: { id: string; tick: number; running?: boolean; className?: string; fps?: number; still?: boolean; children?: ReactNode }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [seen, setSeen] = useState(false);
  const t = useRef(tick); t.current = tick;
  const run = useRef(running); run.current = running;
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!seen) return;
    let alive = true, phase = still ? 0 : id.length, timer = 0;
    void import("./feedRenderer").then((m) => {
      if (!alive || !ref.current) return;
      const frame = () => { if (!still) phase += 0.35; m.drawFeed(ref.current!, id, t.current, phase, run.current); };
      frame();
      timer = window.setInterval(frame, Math.round(1000 / fps));
    });
    return () => { alive = false; window.clearInterval(timer); };
  }, [seen, id, fps, still]);
  return (
    <div className={`relative aspect-[16/10] overflow-hidden bg-[#1f2328] ${className}`}>
      <canvas ref={ref} width={560} height={350} className="absolute inset-0 h-full w-full object-cover" role="img" aria-label={`Camera picture of the ${MACHINES.find((m) => m.id === id)?.name} screen. Example data.`} />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.28))]" />
      {children}
    </div>
  );
}

const confColor = (c: number) => (c >= 0.9 ? "var(--color-cam-high)" : c >= 0.7 ? "var(--color-cam-mid)" : "var(--color-cam-low)");

/** The flattened screen of a machine with the value boxes on it (the "Screen" card). `boxes` can be limited while the AI maps. */
export function FlatScreen({ id, tick, boxes = true, count, conf, className = "" }: { id: string; tick: number; boxes?: boolean; count?: number; conf?: Record<string, number>; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const panel = panelSignals(id);
  // a machine with no screen (the utilities cabinet) shows its gauges side by side
  const sigs = panel.length ? panel : SIGNALS[id];
  const board = panel.length === 0;
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const m = MACHINES.find((x) => x.id === id)!;
    const vals = sigs.map((s) => s.value(tick));
    if (board) drawGaugeBoard(c.getContext("2d")!, hmiTitle(id), sigs, vals);
    else drawHmi(c.getContext("2d")!, hmiTitle(id), sigs, vals, clock(tick, true), m.status !== "idle", isPlate(id));
  }, [id, tick, sigs, board]);
  const n = count ?? sigs.length;
  return (
    <div className={`relative w-full overflow-hidden rounded-[10px] bg-[#0e1620] ${className}`} style={{ aspectRatio: `${HMI_W} / ${HMI_H}` }}>
      <canvas ref={ref} width={HMI_W} height={HMI_H} className="absolute inset-0 h-full w-full" role="img" aria-label="The machine screen, flattened. Example data." />
      {boxes && sigs.slice(0, n).map((s, i) => {
        const [x, y, w, h] = board ? boardBox(i) : slotBox(sigs.length, i);
        const c = conf?.[s.id] ?? s.conf;
        return (
          <div key={s.id} className="pointer-events-none absolute" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, border: `1.5px ${c < 0.7 ? "dashed" : "solid"} ${confColor(c)}` }}>
            <span className="absolute bottom-full left-[-1.5px] mb-px hidden whitespace-nowrap rounded-[3px] px-1 py-px text-[10px] font-medium text-white sm:block" style={{ background: confColor(c) }}>
              {s.label} · {c.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
