import { useEffect, useState } from "react";
import { A } from "../nav";
import { useApp } from "../ctx";
import { Button, Card, CameraPill, CloseIc, Dialog, Field, Input, Note, PageHeader, PasswordInput, PlusIc, Spinner, Cta } from "../ui";
import { Feed } from "../feed/Feed";
import { SendingOptions } from "../Tiles";
import { PIC_WORDS, cameras, machineView, type Camera, type PicMode } from "../world";

export type ConnectPhase = "start" | "usb" | "install" | "wifi" | "live" | "reading";

export function CamerasPage({ dialog }: { dialog?: ConnectPhase }) {
  const { world, cta, guided } = useApp();
  const cams = cameras(world);
  const [open, setOpen] = useState(false);
  const isOpen = open || !!dialog;
  return (
    <>
      <PageHeader title="Cameras" sub={`${cams.length} of ${cams.length} cameras online`}
        actions={<><Button disabled title="Not available in this demo"><PlusIc /> Add camera</Button>
          <Cta pulse={cta === "connect-camera"} onClick={() => (cta === "connect-camera" ? guided("connect-camera") : setOpen(true))}><PlusIc /> Connect camera</Cta></>} />
      <div className="pp-optional mb-5 rounded-[10px] border border-accent bg-accent-soft p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Optional</span>
          <h2 className="text-[15px] font-semibold">Sending pictures to PanelPal is optional</h2>
        </div>
        <p className="mt-1.5 text-sm text-text">Each camera reads its machine screen itself and sends only the values. In the real app a camera usually sends no picture unless you ask for one. Most cards below show "No picture sent", and you can request one picture when you want to look. A few are set to send a picture so you can see what a camera sees.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cams.map((c) => <CameraCard key={c.id} c={c} fresh={c.machineId === "cnc3" && world.cnc3 === "none"} />)}</div>
      {isOpen && <ConnectDialog phase={dialog ?? "start"} onClose={() => setOpen(false)} />}
    </>
  );
}

function CameraCard({ c, fresh }: { c: Camera; fresh: boolean }) {
  const { tick } = useApp();
  const { world } = useApp();
  const m = machineView(c.machineId, world);
  const [pics, setPics] = useState<PicMode>(c.pics);
  const [asked, setAsked] = useState(false);
  useEffect(() => setPics(c.pics), [c.pics]);
  const used = !(c.machineId === "cnc3" && world.cnc3 === "none");
  return (
    <Card className={`flex flex-col overflow-hidden ${fresh ? "border-[1.5px] border-accent" : ""}`}>
      {pics !== "off" || asked ? (
        <Feed id={c.machineId} tick={tick} running={m.status !== "idle"} className="!aspect-video">
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-cam-scrim/85 px-2 py-0.5 text-[11px] font-semibold text-white"><span className="pp-pulse h-1.5 w-1.5 rounded-full bg-cam-live" />{pics === "off" ? "REQUESTED" : "PICTURE"} · <span className="font-mono font-normal">{c.id}</span></span>
        </Feed>
      ) : (
        <div className="grid aspect-video place-items-center border-b border-border bg-surface-2 px-4 text-center text-[13px] text-muted">
          <div><div className="font-semibold text-text">No picture sent</div>Readings only. Pictures are optional.<div><button type="button" onClick={() => setAsked(true)} className="mt-1.5 font-semibold text-accent hover:underline">Request one picture</button></div></div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><div className="truncate font-semibold">{c.name}</div><div className="text-[13px] text-muted">PanelPal camera</div></div>
          <div className="shrink-0"><CameraPill status="online" /></div>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
          <div><dt className="text-faint">Reads on</dt><dd className="font-medium">The camera</dd></div>
          <div><dt className="text-faint">Sends</dt><dd className="font-medium">{PIC_WORDS[pics].short}</dd></div>
          <div><dt className="text-faint">Last seen</dt><dd className="tnum font-medium">Now</dd></div>
          <div><dt className="text-faint">Chip</dt><dd className="tnum font-medium">{c.temp} °C</dd></div>
        </dl>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]"><span className="text-faint">Pictures to PanelPal</span>
          <select aria-label="Send pictures to PanelPal" value={pics} onChange={(e) => setPics(e.target.value as PicMode)} className="min-w-0 max-w-full rounded-[6px] border border-border-strong bg-bg px-1.5 py-0.5 text-[13px]">{(Object.keys(PIC_WORDS) as PicMode[]).map((k) => <option key={k} value={k}>{PIC_WORDS[k].label}</option>)}</select>
          <span className="rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent-strong">Optional</span></div>
        <div className="text-[12px] text-faint">OV3660 · 1600×1200 · Wi-Fi Example-Factory-2.4G ({c.rssi} dBm) · firmware {c.fw}</div>
        <div className="text-[13px] text-muted">{used ? <>Reads <A to={{ page: "machines", id: c.machineId }} className="font-medium text-accent hover:underline">{m.name}</A></> : "Not used by a machine yet"}</div>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="primary" disabled title="Not available in this demo">Set up</Button>
          <Button size="sm" disabled title="Not available in this demo">Edit</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-fault" disabled title="Not available in this demo">Delete</Button>
        </div>
      </div>
    </Card>
  );
}

/* ---------------------------------- "Connect a PanelPal camera" ---------------------------------- */

const STEPS: { at: ConnectPhase[]; label: string }[] = [
  { at: ["start", "usb"], label: "Connect" }, { at: ["install"], label: "Install" }, { at: ["wifi"], label: "Wi-Fi" }, { at: ["live"], label: "Go live" }, { at: ["reading"], label: "Reading" },
];
function Steps({ phase }: { phase: ConnectPhase }) {
  const at = STEPS.findIndex((s) => s.at.includes(phase));
  return (
    <ol className="mb-4 flex gap-1.5 text-[12px] font-medium">
      {STEPS.map((s, i) => <li key={s.label} className={`flex-1 border-t-[3px] pt-1.5 ${i < at ? "border-running text-running" : i === at ? "border-accent text-ink" : "border-border-strong text-faint"}`}>{s.label}</li>)}
    </ol>
  );
}
const Bars = ({ n }: { n: number }) => <span className="inline-flex items-end gap-[2px]" aria-label={`signal ${n} of 4`}>{[1, 2, 3, 4].map((i) => <span key={i} className={`w-[3px] rounded-[1px] ${i <= n ? "bg-ink" : "bg-border-strong"}`} style={{ height: 3 + i * 3 }} />)}</span>;
const Tick = ({ done, active, label }: { done: boolean; active?: boolean; label: string }) => (
  <li className={`flex items-center gap-2 ${done || active ? "text-ink" : "text-faint"}`}>
    {done ? <span className="grid h-4 w-4 place-items-center rounded-full bg-running text-[10px] text-white">✓</span> : active ? <Spinner className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-border-strong" />}{label}
  </li>
);

function ConnectDialog({ phase, onClose }: { phase: ConnectPhase; onClose: () => void }) {
  const { cta, guided, next, go, tick } = useApp();
  const [pics, setPics] = useState<PicMode>("off");
  // Done closes the camera set-up. Set up machine goes straight on to adding the camera to CNC mill 3 (step 6, first stage: edit machine).
  const footer = phase === "reading" ? <><Button variant="secondary" onClick={() => { onClose(); next(); }}>Done</Button><Cta pulse={cta === "setup-machine"} onClick={() => { if (cta === "setup-machine") go(6, 0); onClose(); }}>Set up machine</Cta></> : undefined;
  return (
    <>
      <Dialog open onClose={onClose} wide={phase === "reading"} title="Connect a PanelPal camera" footer={footer}>
        <div className="space-y-4">
          <Steps phase={phase} />
          {(phase === "start" || phase === "usb") && (
            <>
              <Field label="Camera name" hint="For example: CNC mill 3 camera."><Input defaultValue="CNC mill 3 camera" /></Field>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
                <li>Plug the camera board into this computer with a USB data cable.</li>
                <li>Select <b className="text-ink">Connect board</b>, then choose the board in the list your browser shows. PanelPal checks which camera it is.</li>
              </ol>
              <Cta pulse={cta === "connect-board"} variant="primary" onClick={() => guided("connect-board")}>Connect board</Cta>
              <Note>Nothing shows in the list? Try another cable (some only charge) or USB port.</Note>
            </>
          )}
          {phase === "install" && <Install key="install" />}
          {phase === "wifi" && (
            <>
              <fieldset>
                <legend className="mb-1.5 w-full text-[13px] font-medium text-muted">Wi-Fi network the camera will use (2.4 GHz)</legend>
                <div className="space-y-1">
                  {[["Example-Factory-2.4G", 4, true], ["Workshop-IoT", 3, false], ["Example-Guest", 2, false]].map(([n, b, on]) => (
                    <label key={n as string} className={`flex items-center gap-3 rounded-[8px] border px-3 py-2 text-sm ${on ? "border-[1.5px] border-accent bg-accent-soft" : "border-border-strong"}`}>
                      <input type="radio" name="ssid" className="sr-only" defaultChecked={!!on} /><span className="min-w-0 flex-1 truncate font-medium">{n}</span><Bars n={b as number} />
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Wi-Fi password" hint="Sent only to the board, over the USB cable. PanelPal's server never sees it."><PasswordInput defaultValue="example-password" /></Field>
              <Cta pulse={cta === "wifi-connect"} onClick={() => guided("wifi-connect")}>Connect camera to Wi-Fi</Cta>
            </>
          )}
          {phase === "live" && <GoLive key="live" tick={tick} />}
          {phase === "reading" && (
            <>
              <Note tone="good">CNC mill 3 camera is connected. Unplug it and power it from any USB charger near the machine; it keeps its setup.</Note>
              <div>
                <h3 className="text-[15px] font-semibold">How should it work?</h3>
                <p className="mb-2 text-[13px] text-muted">The camera does the reading. Sending pictures is your choice, and you can change it later on the camera's card.</p>
                <SendingOptions value={pics} onChange={setPics} highlight />
              </div>
              <p className="text-[13px] text-muted">PanelPal needs one picture to map the machine screen. The next steps use one setup picture. After that, only the readings need to leave the camera.</p>
            </>
          )}
        </div>
      </Dialog>
      {phase === "usb" && <UsbPicker />}
    </>
  );
}

function Install() {
  const [p, setP] = useState(0);
  useEffect(() => { const t = window.setInterval(() => setP((x) => Math.min(100, x + 5)), 200); return () => window.clearInterval(t); }, []);
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Installing PanelPal camera software 0.9.4</div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-accent transition-[width]" style={{ width: `${p}%` }} /></div>
      <div className="text-[13px] text-muted">{p} % · Keep the cable plugged in.</div>
    </div>
  );
}
function GoLive({ tick }: { tick: number }) {
  const [n, setN] = useState(0);
  useEffect(() => { const t = window.setInterval(() => setN((x) => Math.min(4, x + 1)), 900); return () => window.clearInterval(t); }, []);
  return (
    <div className="space-y-3">
      <ul className="space-y-1.5 text-sm">
        <Tick done={n >= 1} active={n < 1} label="Setup saved on the board" />
        <Tick done={n >= 2} active={n === 1} label={n >= 2 ? "Joined Example-Factory-2.4G" : "Joining Example-Factory-2.4G…"} />
        <Tick done={n >= 3} active={n === 2} label={n >= 3 ? "PanelPal accepted the camera" : "Reaching PanelPal…"} />
        <Tick done={n >= 4} active={n === 3} label={n >= 4 ? "The camera is ready to read" : "Starting the reader on the camera…"} />
      </ul>
      {n >= 4 && <Feed id="cnc3" tick={tick} still className="!aspect-video rounded-[8px]"><span className="absolute left-2 top-2 rounded-full bg-cam-scrim/85 px-2 py-0.5 text-[11px] font-semibold text-white">Setup picture</span></Feed>}
    </div>
  );
}

/** What Chrome shows when a site asks for a USB serial device. Drawn here: the demo never asks the browser for anything. */
function UsbPicker() {
  const { cta, guided } = useApp();
  return (
    <div className="absolute left-1/2 top-24 z-[70] w-[min(92%,380px)] -translate-x-1/2 rounded-[12px] border border-border-strong bg-surface p-4 shadow-raised" role="dialog" aria-label="Choose a USB device">
      <div className="flex items-start gap-2"><div className="flex-1 text-sm font-semibold">panelpal.example wants to connect to a serial port</div><CloseIc className="h-4 w-4 text-muted" /></div>
      <div className="mt-3 rounded-[8px] border border-border-strong">
        <div className="bg-accent-soft px-3 py-2 text-sm font-medium text-accent-strong">USB JTAG/serial debug unit (ttyACM0)</div>
      </div>
      <div className="mt-3 flex justify-end gap-2"><Button size="sm" variant="ghost">Cancel</Button><Cta size="sm" pulse={cta === "usb-pick"} onClick={() => guided("usb-pick")}>Connect</Cta></div>
      <p className="mt-2 text-[11px] text-faint">This picture of the browser's list is part of the demo.</p>
    </div>
  );
}
