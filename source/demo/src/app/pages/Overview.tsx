import { useMemo, useState } from "react";
import { A, useNav } from "../nav";
import { useApp } from "../ctx";
import { ALERTS, fmt, machineViews } from "../world";
import { Card, CardHead, MachinePill, PageHeader, Seg, Stat, type MachineStatus } from "../ui";
import { DashFilterRow, FloorDashboard, planMachines, useDashFilter } from "../../components/plan";

const WORD: Record<MachineStatus, { word: string; dot: string }> = {
  running: { word: "Running", dot: "bg-running-dot" }, idle: { word: "Idle", dot: "bg-idle-dot" }, alarm: { word: "Alarm", dot: "bg-fault-dot" },
  offline: { word: "No signal", dot: "bg-offline-dot" }, uncalibrated: { word: "Not calibrated", dot: "bg-inactive-dot" }, warning: { word: "Check reading", dot: "bg-warning-dot" },
};

export function Overview({ plan: initial = "2d", select }: { plan?: "2d" | "3d"; select?: string }) {
  const { world, tick } = useApp();
  const { go } = useNav();
  const [view, setView] = useState<"2d" | "3d">(initial);
  const [sel, setSel] = useState<string | null>(select ?? null);
  const filter = useDashFilter();
  const ms = useMemo(() => machineViews(world), [world]);
  const off = ms.filter((m) => m.status === "uncalibrated").map((m) => m.id);
  const plan = useMemo(() => planMachines("final", tick, [], off), [tick, off.join()]);  // eslint-disable-line react-hooks/exhaustive-deps
  const count = (s: MachineStatus) => ms.filter((m) => m.status === s).length;
  const live = ms.length - off.length;
  const cams = ms.filter((m) => m.camera).length;
  const open = ALERTS.filter((a) => a.state === "open");
  return (
    <>
      <PageHeader title="Overview" sub={`Example Factory · Unit 1 · ${live} of ${ms.length} machines live · ${cams} of ${cams} cameras online · last read 1 s ago`} />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(["running", "idle", "alarm", "offline", "uncalibrated"] as MachineStatus[]).map((s) => <Stat key={s} label={WORD[s].word} value={count(s)} dot={WORD[s].dot} />)}
        <Stat label="Open alerts" value={open.length} dot="bg-fault-dot" />
      </div>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHead title="Floor plan" sub={view === "3d" ? "Status shows on each machine's light and floor ring. Tap one to open it." : "Machines coloured by status. Tap one to open it."}
            right={<Seg value={view} onChange={setView} items={[{ value: "2d", label: "2D" }, { value: "3d", label: "3D" }]} />} />
          <div className="p-3 sm:p-4">
            <div className="mb-2"><DashFilterRow mode="final" machines={plan} filter={filter} /></div>
            <FloorDashboard machines={plan} mode="final" view={view} selectedId={sel} onSelect={setSel} filter={filter} onOpenMachine={(id) => go({ page: "machines", id })} onAddDevice={() => go({ page: "machines", id: "cnc3" })} />
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-1 2xl:content-start">
          <Card>
            <CardHead title="Open alerts" right={<A to={{ page: "alerts" }} className="text-[13px] font-semibold text-accent">All alerts</A>} />
            <ul className="divide-y divide-border">
              {open.map((a) => (
                <li key={a.id} className="px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full bg-fault-dot" /><span className="truncate font-semibold">{a.suggestion?.title ?? a.title}</span></div>
                  <div className="ml-4 text-[13px] text-muted">{ms.find((m) => m.id === a.machineId)!.name} · {a.when.replace(", still open", "")}</div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHead title="Machines" right={<A to={{ page: "machines" }} className="text-[13px] font-semibold text-accent">All machines</A>} />
            <ul className="divide-y divide-border">
              {ms.map((m) => (
                <li key={m.id}>
                  <A to={{ page: "machines", id: m.id }} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-surface-2">
                    <span className="min-w-0"><span className="block truncate font-medium">{m.name}</span>{m.status !== "uncalibrated" && <span className="tnum block truncate text-[13px] text-muted">{fmt(m.signals[0], m.signals[0].value(tick))}</span>}</span>
                    <MachinePill status={m.status} small />
                  </A>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
