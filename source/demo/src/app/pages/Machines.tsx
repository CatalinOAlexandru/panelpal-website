import { useMemo, useState } from "react";
import { A, useNav } from "../nav";
import { useApp } from "../ctx";
import { Button, Card, CardHead, Dialog, Empty, Field, Input, MACHINE_PILL, MachinePill, Note, PageHeader, Select, Seg, Textarea, Cta, type MachineStatus } from "../ui";
import { ALERTS, PIC_WORDS, panelSignals, fmt, history, machineView, machineViews, type MachineView, type PicMode } from "../world";
import { FlatScreen } from "../feed/Feed";
import { typeName } from "../../components/floor/parts";
import { SignalTile, SendingOptions } from "../Tiles";
import { LineChart } from "../Chart";

type Filter = "all" | MachineStatus;

export function MachinesPage({ detail, editing }: { detail?: string; editing?: boolean }) {
  return detail ? <MachineDetail id={detail} editing={editing} /> : <MachineList />;
}

function MachineList() {
  const { world, tick } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"detailed" | "simple">("detailed");
  const rows = useMemo(() => machineViews(world).sort((a, b) => a.area.localeCompare(b.area) || a.name.localeCompare(b.name)), [world]);
  const counts = rows.reduce<Record<string, number>>((m, r) => ({ ...m, [r.status]: (m[r.status] ?? 0) + 1 }), {});
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const live = rows.filter((r) => r.status !== "uncalibrated").length;
  void tick;
  return (
    <>
      <PageHeader title="Machines" sub={`${live} of ${rows.length} machines live`} actions={<Button variant="primary" disabled title="Not available in this demo">+ Add machine</Button>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Seg<Filter> value={filter} onChange={setFilter} items={[{ value: "all", label: `All ${rows.length}` }, ...(Object.keys(MACHINE_PILL) as MachineStatus[]).filter((s) => counts[s]).map((s) => ({ value: s as Filter, label: `${MACHINE_PILL[s].word} ${counts[s]}` }))]} />
        <Seg value={view} onChange={setView} items={[{ value: "detailed", label: "Detailed" }, { value: "simple", label: "Simple" }]} />
      </div>
      {view === "simple" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{shown.map((m) => <MachineRow key={m.id} m={m} />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">{shown.map((m) => <MachineCard key={m.id} m={m} />)}</div>
      )}
    </>
  );
}

function MachineRow({ m }: { m: MachineView }) {
  return (
    <A to={{ page: "machines", id: m.id }} className={`flex min-h-12 items-center gap-3 rounded-[10px] border bg-surface px-3 py-2 hover:border-accent ${m.status === "alarm" ? "border-fault-dot" : "border-border"} ${m.status === "uncalibrated" ? "border-dashed bg-surface-2" : ""}`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${MACHINE_PILL[m.status].dot}`} aria-hidden />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{m.name}</span><span className="block truncate text-xs text-muted">{m.area} · {typeName(m.type, m.id)}</span></span>
      <MachinePill status={m.status} small />
    </A>
  );
}

function MachineCard({ m }: { m: MachineView }) {
  const { tick, cta, guided } = useApp();
  const { go } = useNav();
  const inactive = m.status === "uncalibrated";
  return (
    <Card className={`flex flex-col overflow-hidden ${inactive ? "border-dashed bg-surface-2" : ""} ${m.status === "alarm" ? "border-fault-dot" : ""}`}>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <A to={{ page: "machines", id: m.id }} className="block truncate font-semibold hover:underline">{m.name}</A>
            <div className="break-words text-[13px] text-muted sm:truncate">{m.area} · {typeName(m.type, m.id)}{m.camera ? ` · ${m.camera.id}` : ""}{!inactive ? " · read 1 s ago" : ""}</div>
          </div>
          <MachinePill status={m.status} />
        </div>
        {inactive ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
            <span>{m.camera ? "Camera set. Map the values on its screen." : "No camera yet."}</span>
            <Cta pulse={cta === "setup-cnc3"} variant="primary" size="sm" onClick={() => (cta === "setup-cnc3" ? guided("setup-cnc3") : go({ page: "machines", id: m.id }))}>{m.camera ? "Calibrate" : "Set up"}</Cta>
          </div>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">{m.signals.slice(0, 4).map((s) => <SignalTile key={s.id} machineId={m.id} signal={s} tick={tick} />)}</div>
            <div className="mt-3 flex justify-end"><A to={{ page: "machines", id: m.id }} className="inline-flex h-10 w-full items-center justify-center rounded-[8px] border-[1.5px] border-accent bg-accent-soft px-3 text-[13px] font-semibold text-accent-strong sm:h-8 sm:w-auto">Open machine</A></div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------------------------------- one machine ---------------------------------- */

export function MachineDetail({ id, editing: editingStage }: { id: string; editing?: boolean }) {
  const { world, tick, cta, guided } = useApp();
  const { go } = useNav();
  const m = machineView(id, world);
  const [selId, setSelId] = useState(m.signals[0].id);
  const [editing, setEditing] = useState(!!editingStage);
  const [calOpen, setCalOpen] = useState(true);
  const askCal = !!m.camera && m.status === "uncalibrated" && cta === "calibrate-yes";
  const [win, setWin] = useState<"15m" | "1h">("1h");
  const [asked, setAsked] = useState(false);
  const [pics, setPics] = useState<PicMode | null>(null);
  const sel = m.signals.find((s) => s.id === selId) ?? m.signals[0];
  const mine = ALERTS.filter((a) => a.machineId === id && a.state === "open");
  const live = m.status !== "uncalibrated";
  const mode = pics ?? m.camera?.pics ?? "off";
  const showPic = m.camera && (mode !== "off" || asked);
  const pts = useMemo(() => history(id, sel, tick), [id, sel, tick]);
  const shownPts = win === "15m" ? pts.slice(-15) : pts;
  const lowOrHigh = [sel.low != null ? `below ${sel.low}` : null, sel.high != null ? `above ${sel.high}` : null].filter(Boolean);
    return (
    <>
      <PageHeader back={{ to: { page: "machines" }, label: "Machines" }}
        title={<span className="flex flex-wrap items-center gap-3">{m.name} <MachinePill status={m.status} /></span>}
        sub={<>{typeName(m.type, m.id)} · {m.area}{m.camera ? <> · camera <span className="font-mono">{m.camera.id}</span></> : " · no camera"}{live ? " · read 1 s ago" : ""}</>}
        actions={<>
          <Button variant="primary" disabled={!m.camera} onClick={() => go({ page: "machines", id, sub: "calibrate" })}>{live ? "Recalibrate" : "Calibrate"}</Button>
          <Button onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="ghost" className="text-fault hover:text-fault" disabled title="Not available in this demo">Delete</Button>
        </>} />
      {mine.length > 0 && <div className="mb-4"><Note tone="warning">▲ {mine.length} open alert{mine.length > 1 ? "s" : ""} on this machine. <A to={{ page: "alerts" }} className="font-semibold underline">See alerts</A></Note></div>}
      {!live ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="font-semibold">Not calibrated yet</h2>
            <p className="mt-1 text-sm text-muted">{m.camera ? "Tell PanelPal where the screen is and which values to read. The AI can do a first pass." : "Pick the camera that sees this machine's screen first."}</p>
            <div className="mt-3">
              {m.camera
                ? <Button variant="solid" onClick={() => go({ page: "machines", id, sub: "calibrate" })}>Calibrate now</Button>
                : <Cta pulse={cta === "pick-camera"} onClick={() => (cta === "pick-camera" ? guided("pick-camera") : setEditing(true))}>Pick a camera</Cta>}
            </div>
          </Card>
          {m.camera ? <Card className="p-4"><h2 className="font-semibold">Camera set</h2><p className="mt-1 text-sm text-muted">PanelPal needs one setup picture from the camera. It shows on the calibrate page. After that the camera reads the values itself.</p></Card> : <Empty title="No camera yet">Pick the camera that sees this machine's screen.</Empty>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="min-w-0 space-y-4">
            <Card className="overflow-hidden">
              <CardHead title={panelSignals(id).length ? "Screen" : "Gauges"} sub={panelSignals(id).length ? "Flattened from the latest picture, with the value boxes" : "The gauges on the pipes, from the latest picture, with the value boxes"} />
              <div className="p-3">
                {showPic ? <FlatScreen id={id} tick={tick} /> : (
                  <div className="grid aspect-[16/10] place-items-center rounded-[10px] border border-dashed border-border-strong bg-surface-2 p-4 text-center text-sm text-muted">
                    <div>
                      <div className="font-semibold text-text">No picture is sent to PanelPal</div>
                      <p className="mx-auto mt-1 max-w-xs">The camera still reads every value and sends the numbers. Ask for one picture if you want to check the boxes.</p>
                      <Button className="mt-3" variant="primary" size="sm" onClick={() => setAsked(true)}>Request one picture</Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            {m.camera && (
              <Card>
                <CardHead title="How this camera works" sub={m.camera.id} />
                <div className="p-3"><SendingOptions value={mode} onChange={setPics} highlight={id === "cnc3" && world.pics3 === "off"} /></div>
              </Card>
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <Card>
              <CardHead title="Values" sub={`${m.signals.length} read from the screen`} />
              <div className="grid grid-cols-2 gap-2 p-3">{m.signals.map((s) => <SignalTile key={s.id} machineId={id} signal={s} tick={tick} spark selected={s.id === sel.id} onClick={() => setSelId(s.id)} />)}</div>
            </Card>
            {sel.kind === "number" && (
              <Card>
                <CardHead title={sel.label} sub={[sel.unit, "number", sel.low != null || sel.high != null ? `range ${sel.low ?? "–"} to ${sel.high ?? "–"}` : null].filter(Boolean).join(" · ")}
                  right={<Seg value={win} onChange={setWin} items={[{ value: "15m", label: "15m" }, { value: "1h", label: "1h" }]} />} />
                <div className="p-3"><LineChart lines={[{ label: sel.label, unit: sel.unit, points: shownPts, high: sel.high }]} height={220} tick={tick} /></div>
                <div className="border-t border-border p-3">
                  <h3 className="mb-2 text-sm font-semibold">Alert rules</h3>
                  {lowOrHigh.length ? <ul className="space-y-1 text-sm text-muted">{lowOrHigh.map((r) => <li key={r}>Alert when the value is {r} {sel.unit} for 30 s. <span className="text-faint">AI suggestion on.</span></li>)}</ul> : <p className="text-sm text-muted">No rule on this value.</p>}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      {/* After the camera is saved on the machine: offer to calibrate. Yes opens the calibrate page. */}
      <Dialog open={askCal && calOpen} onClose={() => setCalOpen(false)} title="Calibrate your camera?"
        footer={<><Button variant="ghost" onClick={() => setCalOpen(false)}>Not now</Button><Cta pulse={cta === "calibrate-yes"} onClick={() => (cta === "calibrate-yes" ? guided("calibrate-yes") : go({ page: "machines", id, sub: "calibrate" }))}>Yes</Cta></>}>
        <p className="text-sm">Do you want to calibrate your camera now?</p>
        <p className="mt-1 text-[13px] text-muted">PanelPal looks at the camera's setup picture to find the screen and the values to read.</p>
      </Dialog>
      <EditMachineDialog open={editing} id={id} onClose={() => setEditing(false)} guidedSave={cta === "save-machine"} />
    </>
  );
}

/** "Edit machine": pick the camera for CNC mill 3. In the walkthrough, Save moves the demo on. */
export function EditMachineDialog({ open, id, onClose, guidedSave }: { open: boolean; id: string; onClose: () => void; guidedSave?: boolean }) {
  const { world, guided } = useApp();
  const m = machineView(id, world);
  const [cam, setCam] = useState(m.camera?.id ?? (id === "cnc3" && world.cam3 ? "cam-cnc3" : ""));
  const cams = Object.values(machineViews(world)).filter((x) => x.camera).map((x) => x.camera!);
  const save = () => { if (guidedSave) guided("save-machine"); onClose(); };
  return (
    <Dialog open={open} onClose={onClose} title={`Edit ${m.name}`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Cta pulse={!!guidedSave} onClick={save}>Save</Cta></>}>
      <div className="space-y-4">
        <Field label="Name"><Input defaultValue={m.name} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type"><Input defaultValue="CNC mill" /></Field>
          <Field label="Area"><Select defaultValue={m.area}>{["Machining", "Goods-in", "Press/weld", "Assembly / QA", "Office / QC"].map((a) => <option key={a}>{a}</option>)}</Select></Field>
        </div>
        <Field label="Camera" hint="The camera pointed at this machine's screen.">
          <Select value={cam} onChange={(e) => setCam(e.target.value)}>
            <option value="">No camera yet</option>
            {cams.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
          </Select>
        </Field>
        <Field label="Sensor type" hint="What the camera is pointed at. The AI then maps only that kind of sensor."><Select defaultValue="screen"><option value="screen">Machine screen with numbers and words</option><option value="auto">Let the AI decide</option></Select></Field>
        <Field label="Hint for the AI" hint="What is on the screen and what to read. Helps auto-mapping."><Textarea rows={2} defaultValue="Mill control. Read spindle speed (rpm), spindle load (%), parts today, alarm and feed rate." /></Field>
      </div>
    </Dialog>
  );
}
void fmt;
