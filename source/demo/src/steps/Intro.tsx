import { useNavigate } from "react-router-dom";
import { Btn } from "../components/Btn";
import { Banner, Chevron, Logo } from "../components/ui";
import { SITE_HOME } from "./Transition";

/** The first page of the demo. One button leads to step 1. */
export function Intro() {
  const nav = useNavigate();
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <Banner />
      <header className="flex h-14 shrink-0 items-center border-b border-border px-5 lg:px-6">
        <a href={SITE_HOME} aria-label="PanelPal home page" title="Back to the PanelPal website"><Logo className="h-6" /></a>
      </header>
      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="pp-fadein mx-auto flex min-h-full max-w-[640px] flex-col items-center justify-center px-5 py-10 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-faint">PanelPal demo</div>
          <h1 className="font-display mt-2 text-[32px] leading-tight lg:text-[44px]">You will now be walked through a demo of the PanelPal Platform</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">It shows PanelPal as it looks when a factory is set up, then how a new camera and machine are added. Everything in it is example data.</p>
          <Btn pulse onClick={() => nav("/step/1")} className="mt-8 w-full sm:w-auto">Click to continue <Chevron dir="right" /></Btn>
        </div>
      </main>
    </div>
  );
}
