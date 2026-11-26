import { useNavigate } from "react-router-dom";
import { Chevron, Logo } from "../components/ui";
import { ExitDemo } from "../components/Exit";
import { useTick } from "../demo";
import { MockApp, ChatCtx } from "../app/MockApp";
import { useChatState } from "../app/Chat";
import { SITE_BOOK } from "./Transition";

/** After the guided demo: the whole app to click around in. The left side says the data is synthetic and ends the demo. */
export function FreeRoam() {
  const nav = useNavigate();
  const tick = useTick(1000);
  const chat = useChatState();
  const goStep = (n: number, s = 0) => nav(`/step/${n}${s > 0 ? `/${s + 1}` : ""}`);
  const contact = <a href={SITE_BOOK} className="btn-primary btn-block">Contact us <Chevron dir="right" /></a>;
  return (
    <ChatCtx.Provider value={chat}>
      <div className="flex h-dvh flex-col bg-surface-2">
        {/* 26 Nov (Catalin): no banner and no top bar on a desktop, as in the guided demo. Mobile and tablet keep one thin bar. */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg px-3 lg:hidden">
          <ExitDemo label="PanelPal: exit the demo" title="Exit the demo"><Logo className="h-5" /></ExitDemo>
          <span className="min-w-0 flex-1 truncate text-xs text-muted">Example data</span>
          <a href={SITE_BOOK} className="btn-primary btn-sm">Contact us</a>
          <ExitDemo className="btn-secondary btn-sm">Exit</ExitDemo>
        </header>
        <main className="flex min-h-0 flex-1 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-5 lg:px-5 lg:py-4">
          <aside className="hidden min-h-0 flex-col lg:flex">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[16px] border border-border bg-bg p-5 pt-4">
              <div className="mb-5 flex items-center justify-between gap-2">
                <ExitDemo label="PanelPal: exit the demo" title="Exit the demo"><Logo className="h-6" /></ExitDemo>
                <ExitDemo className="btn-secondary btn-sm">Exit demo</ExitDemo>
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-faint">Free roam</div>
              <h1 className="font-display mt-1 text-[26px] leading-tight">Explore the demo</h1>
              <div className="mt-4 rounded-[10px] bg-surface-2 p-3 text-sm leading-relaxed text-text">
                <div className="mb-1 text-xs font-semibold text-muted">About this demo</div>
                <p>This is synthetic data. Every machine, name, number, picture and alert is made up.</p>
                <p className="mt-2">Click anywhere. PanelAI answers three example questions, and Settings are unavailable.</p>
              </div>
              <div className="mt-auto space-y-2 pt-4">
                {contact}
                <button type="button" onClick={() => goStep(1)} className="btn-secondary btn-block">Restart the guided demo</button>
              </div>
            </div>
          </aside>
          <section className="relative min-h-0 flex-1 overflow-hidden bg-bg lg:rounded-[16px] lg:border lg:border-border" aria-label="App screen">
            <MockApp view={{ route: { page: "overview" }, plan: "2d" }} tick={tick} next={() => {}} go={goStep} />
          </section>
        </main>
      </div>
    </ChatCtx.Provider>
  );
}
