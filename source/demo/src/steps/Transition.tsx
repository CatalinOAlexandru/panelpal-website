import { useDemo } from "../demo";
import { usePulse } from "../components/Btn";
import { useNavigate } from "react-router-dom";
import { Check, Chevron } from "../components/ui";

/** Links are relative to the demo folder, so they work at a domain root (/demo/ -> /). "#join" is the site's "Book a demo" section. */
export const SITE_HOME = "../";
export const SITE_BOOK = "../#join";

export function Closing() {
  const { go } = useDemo();
  const nav = useNavigate();
  const hl = usePulse(true);
  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-bg">
      <div className="pp-fadein mx-auto flex min-h-full max-w-[640px] flex-col items-center justify-center px-5 py-8 text-center lg:px-8">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-running-soft text-running"><Check className="h-6 w-6" /></span>
        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-faint">Demo finished</div>
        <h1 className="font-display mt-2 text-[30px] leading-tight lg:text-[40px]">You’ve completed the PanelPal demo</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">A whole site, then one machine set up from start to finish. The camera reads the screen that is already there, and sending pictures is your choice.</p>
        <div className="mt-6 flex w-full flex-col items-center gap-3 sm:w-auto">
          <button type="button" onClick={() => nav("/free")} className={`btn-primary w-full sm:w-auto ${hl}`}>Free roam the demo <Chevron dir="right" /></button>
          <a href={SITE_BOOK} className="btn-secondary w-full sm:w-auto">Contact us <Chevron dir="right" /></a>
          <a href={SITE_HOME} className="text-sm font-semibold text-accent-strong underline underline-offset-4 hover:text-accent">Back to the PanelPal website</a>
          <button type="button" onClick={() => go(1)} className="mt-1 text-xs text-muted underline underline-offset-4 hover:text-text">Restart demo</button>
        </div>
        <p className="mt-6 text-xs text-faint">All data in this demo is example data.</p>
      </div>
    </div>
  );
}
