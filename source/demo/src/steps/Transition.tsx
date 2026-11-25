import { useDemo } from "../demo";
import { Btn, usePulse } from "../components/Btn";
import { Check, Chevron } from "../components/ui";

/** Break page between the tour of the finished product and the dress rehearsal. Last stage of step 4. */
const TOURED = ["2D and 3D plan", "Machines and feeds", "Dashboards and alerts", "PanelAI"];
const NEXT = ["Connect a camera", "Add it to a machine", "See it go live"];

export function RehearsalIntro() {
  const { next } = useDemo();
  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-bg">
      <div className="pp-fadein mx-auto flex min-h-full max-w-[720px] flex-col justify-center px-5 py-8 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-wide text-faint">The finished product · seen</div>
        <h1 className="font-display mt-2 text-[30px] leading-tight lg:text-[40px]">That is PanelPal, set up</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">Every machine live on one screen, with feeds, dashboards, alerts and PanelAI.</p>
        <ul className="mt-5 grid grid-cols-2 gap-2" aria-label="Seen so far">
          {TOURED.map((d) => (
            <li key={d} className="flex items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] sm:text-sm">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-running-soft text-running"><Check className="h-3.5 w-3.5" /></span>{d}
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-[16px] border-[1.5px] border-accent bg-accent-soft p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Dress rehearsal</div>
          <h2 className="font-display mt-1 text-[22px] leading-tight lg:text-[26px]">Now set up one machine yourself.</h2>
          <p className="mt-1.5 text-sm text-text">CNC mill 3 has no camera. You connect one, point it at the machine and watch it go live. It takes about five minutes on a real site.</p>
          <ol className="mt-3 flex flex-wrap gap-2 text-sm">
            {NEXT.map((n, i) => (
              <li key={n} className="flex items-center gap-1.5 rounded-full border border-border bg-bg px-3 py-1">
                <span className="tnum grid h-5 w-5 place-items-center rounded-full border-[1.5px] border-accent text-[11px] font-semibold text-accent-strong">{i + 1}</span>{n}
              </li>
            ))}
          </ol>
        </div>
        <div className="sticky bottom-0 mt-6 flex justify-end bg-bg py-3 sm:static sm:py-0">
          <Btn pulse onClick={next} className="w-full sm:w-auto">Start the dress rehearsal <Chevron dir="right" /></Btn>
        </div>
      </div>
    </div>
  );
}

/** Links are relative to the demo folder, so they work at a domain root (/demo/ -> /). "#join" is the site's "Book a demo" section. */
export const SITE_HOME = "../";
export const SITE_BOOK = "../#join";

export function Closing() {
  const { go } = useDemo();
  const hl = usePulse(true);
  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-bg">
      <div className="pp-fadein mx-auto flex min-h-full max-w-[640px] flex-col items-center justify-center px-5 py-8 text-center lg:px-8">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-running-soft text-running"><Check className="h-6 w-6" /></span>
        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-faint">Demo finished</div>
        <h1 className="font-display mt-2 text-[30px] leading-tight lg:text-[40px]">You’ve completed the PanelPal demo</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">A whole site, then one machine set up from start to finish. The camera reads the screen that is already there, and sending pictures is your choice.</p>
        <div className="mt-6 flex w-full flex-col items-center gap-3 sm:w-auto">
          <a href={SITE_BOOK} className={`btn-primary w-full sm:w-auto ${hl}`}>Book a demo with us <Chevron dir="right" /></a>
          <a href={SITE_HOME} className="text-sm font-semibold text-accent-strong underline underline-offset-4 hover:text-accent">Back to the PanelPal website</a>
          <button type="button" onClick={() => go(1)} className="mt-1 text-xs text-muted underline underline-offset-4 hover:text-text">Restart demo</button>
        </div>
        <p className="mt-6 text-xs text-faint">All data in this demo is example data.</p>
      </div>
    </div>
  );
}
