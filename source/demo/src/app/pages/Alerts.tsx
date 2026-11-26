import { useState } from "react";
import { A } from "../nav";
import { Button, Card, Seg, PageHeader, AlertPill } from "../ui";
import { alertsFor, machineView, type AlertItem } from "../world";
import { useApp } from "../ctx";

type Tab = "open" | "acknowledged" | "resolved";

export function AlertsPage() {
  const { world } = useApp();
  const [tab, setTab] = useState<Tab>("open");
  const [done, setDone] = useState<Record<number, "acknowledged" | "resolved">>({});
  const state = (a: AlertItem): AlertItem["state"] => done[a.id] ?? a.state;
  const all = alertsFor(world);
  const items = all.filter((a) => state(a) === tab);
  const open = all.filter((a) => state(a) === "open").length;
  return (
    <>
      <PageHeader title="Alerts" sub={open ? `${open} open` : "Rules are set per value on each machine page."} />
      <div className="mb-4"><Seg<Tab> value={tab} onChange={setTab} items={[{ value: "open", label: open ? `Open ${open}` : "Open" }, { value: "acknowledged", label: "Acknowledged" }, { value: "resolved", label: "Resolved" }]} /></div>
      {!items.length ? <div className="rounded-[10px] border border-dashed border-border-strong bg-surface-2 px-5 py-10 text-center text-[15px] font-semibold">Nothing here.</div> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((a) => {
            const s = state(a);
            const m = machineView(a.machineId, world);
            return (
              <Card key={a.id} className="relative overflow-hidden pl-4">
                <span className={`absolute inset-y-0 left-0 w-1 ${s === "open" ? "bg-fault-dot" : s === "acknowledged" ? "bg-warning-dot" : "bg-running-dot"}`} aria-hidden />
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted"><AlertPill state={s} /><A to={{ page: "machines", id: m.id }} className="font-medium text-text hover:underline">{m.name}</A><span>· {a.label}</span><span className="ml-auto">{a.when}</span></div>
                  <div className="mt-1.5 text-[15px] font-semibold">{a.title}</div>
                  <div className="mt-0.5 text-sm text-muted">{a.detail}</div>
                  {a.suggestion && <div className="mt-2 rounded-[8px] bg-surface-2 p-3"><div className="flex items-center gap-1.5 text-xs font-medium text-accent-strong"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> AI suggestion</div><div className="mt-0.5 text-sm font-semibold">{a.suggestion.title}</div><div className="mt-0.5 text-sm text-muted">{a.suggestion.body}</div></div>}
                  {s !== "resolved" && <div className="mt-3 flex flex-wrap gap-2">{s === "open" && <Button size="sm" variant="primary" onClick={() => setDone((d) => ({ ...d, [a.id]: "acknowledged" }))}>Acknowledge</Button>}<Button size="sm" onClick={() => setDone((d) => ({ ...d, [a.id]: "resolved" }))}>Resolve</Button></div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
