import { useEffect, useState } from "react";
import { useApp } from "../ctx";
import { Button, Card, CardHead, Conf, PageHeader, Note, Spinner, Cta } from "../ui";
import { Feed, FlatScreen } from "../feed/Feed";
import { fmt, machineView } from "../world";

export type CalPhase = "corners" | "mapping" | "mapped" | "tested";
const DEFAULT: [number, number][] = [[0.3, 0.28], [0.7, 0.28], [0.7, 0.7], [0.3, 0.7]];
/** What the first test read scores: the feed-rate box sits a little off, so it asks for a check. */
const TEST_CONF: Record<string, number> = { feed: 0.61 };

/** Calibration, as in the app: corners on the camera picture, boxes on the flat screen, test read, save. Driven by the script. */
export function Calibrate({ id, phase }: { id: string; phase: CalPhase }) {
  const { world, tick, cta, guided } = useApp();
  const m = machineView(id, world);
  const [found, setFound] = useState<[number, number][] | null>(null);
  const [secs, setSecs] = useState(0);
  useEffect(() => { void import("../feed/feedRenderer").then((r) => setFound(r.screenCorners(id))); }, [id]);
  useEffect(() => {
    if (phase !== "mapping") return;
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);
  // a machine that is already set up (Recalibrate) starts with its corners on the screen; a new one starts with them in the middle
  const connected = m.status !== "uncalibrated";
  // a new machine shows no corners until the AI has read the screen
  const showCorners = connected || phase === "mapped" || phase === "tested";
  const corners = found ?? DEFAULT;
  const flat = phase === "mapped" || phase === "tested" || (connected && phase !== "mapping");
  const conf = phase === "tested" ? TEST_CONF : undefined;
  return (
    <>
      <PageHeader back={{ to: { page: "machines", id }, label: m.name }} title={`Calibrate ${m.name}`}
        sub="Drag the four corners onto the screen, then check the value boxes. Auto-map does both with AI."
        actions={<>
          <Cta pulse={cta === "automap"} variant={cta === "automap" ? "solid" : "primary"} disabled={phase === "mapping"} onClick={() => guided("automap")}>✦ Auto-map with AI</Cta>
          <Cta pulse={cta === "test-read"} variant="primary" disabled={!flat} onClick={() => guided("test-read")}>Test read</Cta>
          <Cta pulse={cta === "save-cal"} disabled={phase !== "tested"} onClick={() => guided("save-cal")}>Save</Cta>
        </>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHead title="1 · Camera picture" sub="The four corners of the screen" />
          <Feed id={id} tick={tick} still fps={1}>
            {showCorners && <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pp-fade absolute inset-0 h-full w-full" aria-hidden>
              <polygon points={corners.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")} fill="rgba(47,143,208,0.12)" stroke="var(--color-cam-box)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" style={{ transition: "all .6s ease" }} />
            </svg>}
            {showCorners && corners.map(([x, y], i) => <span key={i} className="pp-fade absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cam-box shadow" style={{ left: `${x * 100}%`, top: `${y * 100}%`, transition: "all .6s ease" }} />)}
            {phase === "mapping" && <div className="absolute inset-0 grid place-items-center bg-black/40 text-white"><div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm"><Spinner className="h-4 w-4" /> The AI is reading the screen… {secs} s</div></div>}
          </Feed>
        </Card>
        <Card className="overflow-hidden">
          <CardHead title="2 · Flat screen and value boxes" sub={flat ? `${m.signals.length} values mapped` : "Appears when the corners are set"} />
          <div className="p-3">
            {flat ? <FlatScreen id={id} tick={tick} conf={conf} /> : <div className="grid aspect-[16/10] place-items-center rounded-[10px] border border-dashed border-border-strong bg-surface-2 text-sm text-muted">{phase === "mapping" ? "Mapping…" : "Set the corners, or use Auto-map with AI"}</div>}
          </div>
        </Card>
      </div>
      {flat && (
        <Card className="mt-4">
          <CardHead title="Values" sub={phase === "tested" ? "Test read of the latest picture" : "Check each box, then run a test read"} />
          <ul className="divide-y divide-border">
            {m.signals.map((s) => {
              const c = conf?.[s.id] ?? s.conf;
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 font-medium">{s.label}</span>
                  <span className="text-[13px] text-muted">{s.kind === "word" ? "word" : `number${s.unit ? ` · ${s.unit}` : ""}`}</span>
                  {phase === "tested" ? <><span className="tnum w-28 text-right font-semibold">{fmt(s, s.value(tick))}</span><Conf v={c} /></> : <Button size="sm" variant="ghost" disabled>Edit box</Button>}
                </li>
              );
            })}
          </ul>
          {phase === "tested" && <div className="border-t border-border p-3"><Note tone="warning">▲ Feed rate scored 0.61. Low scores ask for a check: nudge its box on the flat screen, then test again. Values at 0.90 and above need no check.</Note></div>}
        </Card>
      )}
    </>
  );
}
