// The demo script. The app opens finished; steps 1 to 4 tour it, steps 5 and 6 set up a new camera and a machine.
import type { View } from "./app/view";

export interface Stage { name: string; say: string; autoMs?: number; interstitial?: boolean; view: View }
export interface StepDef { n: number; key: string; title: string; short: string; stages: Stage[]; optional?: boolean }

const live = { cnc3: "live" as const, cam3: true, pics3: "off" as const };
const none = { cnc3: "none" as const, cam3: false, pics3: "off" as const };
const camera = { cnc3: "none" as const, cam3: true, pics3: "off" as const };

export const STEPS: StepDef[] = [
  { n: 1, key: "overview", title: "The finished site", short: "Overview", stages: [
    { name: "2D plan", view: { route: { page: "overview" }, plan: "2d", world: live },
      say: "This is PanelPal when it is set up: one factory, 13 machines, all live. The plan shows each machine's status in colour. Tap a machine to see its readings. Alerts and every machine are listed on the right." },
    { name: "3D plan", view: { route: { page: "overview" }, plan: "3d", select: "cnc2", world: live },
      say: "The same floor in 3D. Drag to turn it. Status shows on each machine's light and floor ring. CNC mill 2 is in alarm: tap it to open it." },
  ] },
  { n: 2, key: "machines", title: "Machines", short: "Machines", stages: [
    { name: "All machines", view: { route: { page: "machines" }, world: live },
      say: "Every machine has a card with its status and the values its camera reads. The camera does the reading itself and sends the values." },
    { name: "One machine", view: { route: { page: "machines", id: "cnc1" }, world: live },
      say: "One machine in full. The camera finds the screen and boxes each value, with a confidence score. Below: the value over time, alert rules, and how this camera works. The camera does the reading itself." },
  ] },
  { n: 3, key: "data", title: "View your data", short: "Data", stages: [
    { name: "Dashboards", view: { route: { page: "dashboards" }, cta: "open-dashboard", world: live },
      say: "Dashboards show the values that matter. Open the first one." },
    { name: "A dashboard", view: { route: { page: "dashboards", id: "machining" }, world: live },
      say: "Numbers, charts, a machine screen and alerts on one page. The same dashboard also shows as the 2D or 3D plan. The other two dashboards cover downtime and the press and weld cell." },
    { name: "Alerts", view: { route: { page: "alerts" }, world: live },
      say: "Each alert has a likely cause and one action. Acknowledge or resolve it here." },
  ] },
  { n: 4, key: "panelai", title: "Ask PanelAI", short: "PanelAI", stages: [
    { name: "Pick a question", view: { route: { page: "panelai" }, cta: "ask-downtime", chat: "fresh", world: live },
      say: "Three questions are ready. The first is the complex one: downtime, per area and per machine. Tap it." },
    { name: "The answer", view: { route: { page: "panelai" }, chat: "downtime", world: live },
      say: "PanelAI answers in plain words, with a table. Under the answer, “How I got this” lists the read-only queries it used. In this demo the answers were written in advance, so nothing runs on the web server. Next: add a new camera." },
  ] },
  { n: 5, key: "camera", title: "Add a new camera", short: "Camera", stages: [
    { name: "Cameras", view: { route: { page: "cameras" }, cta: "connect-camera", world: none },
      say: "CNC mill 3 has no camera yet. The other 12 machines do. Choose Connect camera." },
    { name: "Name and board", view: { route: { page: "cameras" }, connect: "start", cta: "connect-board", world: none },
      say: "The name is filled in. Plug the camera into the computer by USB, then choose Connect board." },
    { name: "Choose the board", view: { route: { page: "cameras" }, connect: "usb", cta: "usb-pick", world: none },
      say: "The browser lists the USB boards. Pick the camera. (This list is the browser's own; here it is drawn for the demo.)" },
    { name: "Install", autoMs: 4600, view: { route: { page: "cameras" }, connect: "install", world: none },
      say: "PanelPal installs the camera software. It takes about 30 seconds on a real board." },
    { name: "Wi-Fi", view: { route: { page: "cameras" }, connect: "wifi", cta: "wifi-connect", world: none },
      say: "The camera scans for Wi-Fi. Pick the network and type the password. The password goes to the camera over the cable; PanelPal's server never sees it." },
    { name: "Go live", autoMs: 4800, view: { route: { page: "cameras" }, connect: "live", world: camera },
      say: "Four ticks: setup saved, Wi-Fi joined, PanelPal accepted the camera, reader ready.", },
    { name: "It reads on the camera", view: { route: { page: "cameras" }, connect: "reading", cta: "finish-camera", world: camera },
      say: "The camera does the reading itself and sends only the values. Sending pictures to PanelPal is optional: it is off here, and you can turn it on later. Press Done." },
  ] },
  { n: 6, key: "machine", title: "Add the machine", short: "Machine", stages: [
    { name: "Machines", view: { route: { page: "machines" }, cta: "setup-cnc3", world: camera },
      say: "The camera now shows on the Cameras page. CNC mill 3 is still not set up. Choose Set up on its card." },
    { name: "Pick the camera", view: { route: { page: "machines", id: "cnc3" }, cta: "pick-camera", world: camera },
      say: "A machine needs a camera. Choose Pick a camera." },
    { name: "Save the camera", view: { route: { page: "machines", id: "cnc3" }, editMachine: true, cta: "save-machine", world: camera },
      say: "The new camera is already chosen. Save." },
    { name: "Calibrate", view: { route: { page: "machines", id: "cnc3" }, cta: "calibrate", world: { ...camera, cnc3: "camera" } },
      say: "PanelPal shows the camera's setup picture. Next it must learn where the screen is and which values to read. Choose Calibrate now." },
    { name: "Corners", view: { route: { page: "machines", id: "cnc3", sub: "calibrate" }, cal: "corners", cta: "automap", world: { ...camera, cnc3: "camera" } },
      say: "You can drag the four corners and draw the boxes yourself. Or let the AI do it: Auto-map with AI." },
    { name: "Mapping", autoMs: 3800, view: { route: { page: "machines", id: "cnc3", sub: "calibrate" }, cal: "mapping", world: { ...camera, cnc3: "camera" } },
      say: "The AI looks at the picture, finds the screen and each value. This runs once, at setup, on the PanelPal computer." },
    { name: "Check the boxes", view: { route: { page: "machines", id: "cnc3", sub: "calibrate" }, cal: "mapped", cta: "test-read", world: { ...camera, cnc3: "camera" } },
      say: "The corners snapped to the screen. The flat screen shows one box per value. Run a test read." },
    { name: "Test read", view: { route: { page: "machines", id: "cnc3", sub: "calibrate" }, cal: "tested", cta: "save-cal", world: { ...camera, cnc3: "camera" } },
      say: "Each value is read, with a confidence score. Feed rate scores low, so it asks for a check. Save." },
    { name: "Live", view: { route: { page: "machines", id: "cnc3" }, world: { cnc3: "live", cam3: true, pics3: "off" } },
      say: "CNC mill 3 is live. The camera reads on its own and sends numbers. The pictures are optional: this camera sends none, and you can ask for one picture or turn pictures on from this card." },
    { name: "Demo complete", interstitial: true, view: { route: { page: "overview" }, world: live },
      say: "That is the PanelPal demo. Book a demo with us to see it on your own screens." },
  ] },
];
