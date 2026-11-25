import { type ReactNode } from "react";
import { A, useNav, type Page } from "./nav";
import { useApp } from "./ctx";
import { useChat, PanelAIWindow } from "./Chat";
import { ALERTS } from "./world";
import { BellIc, CameraIc, CubeIc, DashIc, GearIc, LiveDot, MachineIc, OverviewIc, SparkIc } from "./ui";
import { Logo } from "../components/ui";

const NAV: { page: Page; label: string; icon: ReactNode; mobile: boolean }[] = [
  { page: "overview", label: "Overview", icon: <OverviewIc />, mobile: true },
  { page: "machines", label: "Machines", icon: <MachineIc />, mobile: true },
  { page: "cameras", label: "Cameras", icon: <CameraIc />, mobile: true },
  { page: "dashboards", label: "Dashboards", icon: <DashIc />, mobile: true },
  { page: "alerts", label: "Alerts", icon: <BellIc />, mobile: true },
  { page: "panelai", label: "PanelAI", icon: <SparkIc />, mobile: false },
  { page: "assets", label: "Machine assets", icon: <CubeIc />, mobile: false },
  { page: "settings", label: "Settings", icon: <GearIc />, mobile: false },
];
const OPEN = ALERTS.filter((a) => a.state === "open").length;

/** The app frame, as in the PanelPal web app: top bar, side nav (tab bar on a phone), page. */
export function Shell({ children }: { children: ReactNode }) {
  const { route, go } = useNav();
  const chat = useChat();
  useApp();
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg px-4 sm:px-5">
        <A to={{ page: "overview" }} className="shrink-0"><Logo className="h-6" /></A>
        <span className="flex min-w-0 max-w-[50%] items-center gap-1 truncate rounded-[8px] border border-border bg-bg px-2 py-1.5 text-sm">Example Factory · Unit 1 <small className="text-muted">▾</small></span>
        <div className="flex-1" />
        <button type="button" onClick={() => chat.setOpen(!chat.open)} aria-pressed={chat.open} title="Ask PanelAI about your data"
          className="flex items-center gap-1.5 rounded-[8px] border border-border px-2 py-1.5 text-sm font-medium text-accent-strong hover:bg-accent-soft">
          <SparkIc className="h-4 w-4" /><span className="hidden sm:inline">PanelAI</span>
        </button>
        <A to={{ page: "alerts" }} className="relative rounded-[8px] p-1.5 text-muted hover:bg-surface-2" title="Open alerts"><BellIc /><span className="absolute -right-0.5 -top-0.5 rounded-full bg-fault-dot px-1 text-[10px] font-semibold leading-4 text-white">{OPEN}</span></A>
        <LiveDot conn="live" />
        <span className="hidden whitespace-nowrap rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning sm:inline">Example data</span>
        <div title="Site manager (example user)" className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">SM</div>
      </header>
      <PanelAIWindow onPage={route.page === "panelai"} onFull={() => go({ page: "panelai" })} />
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-[216px] shrink-0 flex-col gap-1 border-r border-border bg-bg px-3 py-4 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <A key={n.page} to={{ page: n.page }} className={`flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm ${route.page === n.page ? "bg-accent-soft font-semibold text-accent-strong" : "font-medium text-muted hover:bg-surface-2 hover:text-text"}`}>
              {n.icon}{n.label}
              {n.page === "alerts" && <span className="ml-auto rounded-full bg-fault-dot px-1.5 text-xs font-semibold text-white">{OPEN}</span>}
            </A>
          ))}
          <div className="flex-1" />
          <div className="rounded-[10px] bg-surface-2 p-3 text-xs text-muted">One camera per machine. Each camera reads the screen that is already on the machine.</div>
        </nav>
        <main className="min-w-0 flex-1 overflow-y-auto bg-bg" data-app-scroll>
          <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-5 sm:px-6 md:pb-10">{children}</div>
        </main>
      </div>
      <nav className="absolute inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-bg md:hidden" aria-label="Main">
        {NAV.filter((n) => n.mobile).map((n) => (
          <A key={n.page} to={{ page: n.page }} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${route.page === n.page ? "font-semibold text-text" : "text-muted"}`}>
            {route.page === n.page && <span className="absolute left-1/2 top-0 h-[3px] w-10 -translate-x-1/2 rounded-b bg-accent" />}
            <span className="relative">{n.icon}{n.page === "alerts" && <span className="absolute -right-2 -top-1 rounded-full bg-fault-dot px-1 text-[10px] font-semibold leading-4 text-white">{OPEN}</span>}</span>
            {n.label}
          </A>
        ))}
      </nav>
    </div>
  );
}
