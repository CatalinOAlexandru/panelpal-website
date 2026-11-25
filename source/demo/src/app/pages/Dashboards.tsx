import { useMemo, useState } from "react";
import { useNav } from "../nav";
import { usePulse } from "../../components/Btn";
import { useApp } from "../ctx";
import { Card, CardHead, Button, PageHeader, Seg, MachinePill, SparkIc, PlusIc } from "../ui";
import { alertsFor, DASHBOARDS, DOWNTIME, downtimeByArea, fmt, history, hm, machineView, type Widget } from "../world";
import { LineChart, Spark, lineColor } from "../Chart";
import { SignalTile } from "../Tiles";
import { FlatScreen } from "../feed/Feed";
import { DashFilterRow, FloorDashboard, planMachines, useDashFilter } from "../../components/plan";

export function DashboardsPage({ id, view: initial }: { id?: string; view?: "tiles" | "2d" | "3d" }) {
  return id ? <DashboardView id={id} view={initial} /> : <DashboardList />;
}

function DashboardList() {
  const { cta, guided } = useApp();
  const { go } = useNav();
  return (
    <>
      <PageHeader title="Dashboards" sub="Live views of the values that matter"
        actions={<><Button variant="primary" disabled title="Not available in this demo"><SparkIc /> Generate with AI</Button><Button disabled title="Not available in this demo"><PlusIc /> New</Button></>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DASHBOARDS.map((d, i) => <DashCard key={d.id} d={d} pulse={i === 0 && cta === "open-dashboard"} onOpen={() => { if (i === 0 && cta === "open-dashboard") guided("open-dashboard"); else go({ page: "dashboards", id: d.id }); }} />)}
      </div>
    </>
  );
}
function DashCard({ d, pulse, onOpen }: { d: (typeof DASHBOARDS)[number]; pulse: boolean; onOpen: () => void }) {
  const hl = usePulse(pulse);
  return (
    <Card className={`flex items-start gap-3 p-4 hover:border-accent ${hl}`}>
      <a href="#" onClick={(e) => { e.preventDefault(); onOpen(); }} className="min-w-0 flex-1">
        <div className="truncate font-semibold">{d.name}</div>
        <div className="text-[13px] text-muted">{d.widgets.length} widgets · updated {d.updated}</div>
      </a>
    </Card>
  );
}

const SPAN: Record<number, string> = { 3: "lg:col-span-3", 4: "lg:col-span-4", 6: "lg:col-span-6", 8: "lg:col-span-8", 12: "lg:col-span-12" };

function DashboardView({ id, view: initial = "tiles" }: { id: string; view?: "tiles" | "2d" | "3d" }) {
  const d = DASHBOARDS.find((x) => x.id === id) ?? DASHBOARDS[0];
  const [view, setView] = useState(initial);
  const { world, tick } = useApp();
  const { go } = useNav();
  const [sel, setSel] = useState<string | null>(null);
  const filter = useDashFilter();
  const plan = useMemo(() => planMachines("final", tick, [], world.cnc3 === "live" ? [] : ["cnc3"]), [tick, world.cnc3]);
  return (
    <>
      <PageHeader back={{ to: { page: "dashboards" }, label: "Dashboards" }} title={d.name} actions={view === "tiles" ? <><Button disabled title="Not available in this demo">Ask AI</Button><Button disabled title="Not available in this demo">Edit</Button></> : undefined} />
      <div className="mb-4"><Seg value={view} onChange={setView} items={[{ value: "tiles", label: "Custom tiles" }, { value: "2d", label: "2D" }, { value: "3d", label: "3D" }]} /></div>
      {view !== "tiles" ? (
        <div><div className="mb-2"><DashFilterRow mode="final" machines={plan} filter={filter} /></div>
          <FloorDashboard machines={plan} mode="final" view={view} selectedId={sel} onSelect={setSel} filter={filter} onOpenMachine={(m) => go({ page: "machines", id: m })} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">{d.widgets.map((w, i) => <WidgetCard key={i} w={w} />)}</div>
      )}
    </>
  );
}

function WidgetCard({ w }: { w: Widget }) {
  const { world, tick } = useApp();
  const { go } = useNav();
  const span = `${SPAN[w.w] ?? ""} ${w.w >= 6 ? "sm:col-span-2" : ""}`;
  const title =
    w.type === "number" || w.type === "chart" || w.type === "bars" ? w.title
    : w.type === "value" ? `${machineView(w.machineId, world).name} · ${machineView(w.machineId, world).signals.find((s) => s.id === w.signal)!.label}`
    : w.type === "status" ? machineView(w.machineId, world).name
    : w.type === "screen" ? `${machineView(w.machineId, world).name} · screen`
    : "Alerts";
  return (
    <Card className={`flex min-h-[132px] flex-col overflow-hidden ${span}`}>
      <div className="truncate px-3 pt-2.5 text-[13px] font-semibold">{title}</div>
      <div className="min-h-0 flex-1 p-3 pt-1">
        {w.type === "number" && <div className="flex h-full flex-col justify-center"><div className="tnum text-3xl font-semibold">{w.value}</div><div className="text-[11px] text-faint">{w.about} · example data</div></div>}
        {w.type === "value" && (() => { const m = machineView(w.machineId, world); const s = m.signals.find((x) => x.id === w.signal)!; return <><div className="tnum text-3xl font-semibold">{fmt(s, s.value(tick))}</div><Spark points={history(m.id, s, tick).slice(-30)} className="mt-1 h-10 w-full" /></>; })()}
        {w.type === "chart" && <><div className="mb-1 flex flex-wrap gap-x-3 text-[11px] text-muted">{w.series.map((s, k) => <span key={k} className="inline-flex items-center gap-1"><span className="h-0.5 w-3" style={{ background: lineColor(k) }} />{machineView(s.machineId, world).name}</span>)}<span className="ml-auto text-faint">last 1 h</span></div>
          <LineChart height={(w.h ?? 1) * 130} tick={tick} showStops={false} lines={w.series.map((s) => { const m = machineView(s.machineId, world); const g = m.signals.find((x) => x.id === s.signal)!; return { label: m.name, unit: g.unit, points: history(m.id, g, tick) }; })} /></>}
        {w.type === "status" && (() => { const m = machineView(w.machineId, world); return <div className="space-y-2"><div className="flex items-center justify-between gap-2"><span className="truncate text-[13px] text-muted">{m.area}</span><MachinePill status={m.status} small /></div>
          {m.status !== "uncalibrated" && <div className="grid grid-cols-2 gap-2">{m.signals.slice(0, 2).map((s) => <SignalTile key={s.id} machineId={m.id} signal={s} tick={tick} />)}</div>}
          <a href="#" onClick={(e) => { e.preventDefault(); go({ page: "machines", id: m.id }); }} className="text-[13px] font-semibold text-accent">Open machine</a></div>; })()}
        {w.type === "screen" && <FlatScreen id={w.machineId} tick={tick} boxes={false} />}
        {w.type === "alerts" && <div className="space-y-1.5 text-[13px]">{alertsFor(world).filter((a) => a.state === "open").map((a) => <div key={a.id} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fault-dot" /><span><b className="font-semibold">{machineView(a.machineId, world).name}</b> · {a.title}</span></div>)}</div>}
        {w.type === "bars" && <div className="space-y-2.5">{downtimeByArea().map((a) => (
          <div key={a.area}><div className="flex items-baseline justify-between gap-2 text-[13px]"><span>{a.zoneName}</span><span className="tnum font-semibold">{hm(a.minutes)}</span></div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-accent" style={{ width: `${(a.minutes / downtimeByArea()[0].minutes) * 100}%` }} /></div>
            <div className="mt-0.5 truncate text-[11px] text-faint">{a.machines.map((m) => `${m.name} ${DOWNTIME[m.id].minutes} min`).join(" · ")}</div></div>))}</div>}
      </div>
    </Card>
  );
}
