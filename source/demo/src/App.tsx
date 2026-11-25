import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { STEPS } from "./script";
import { DemoCtx, useTick, type DemoApi } from "./demo";
import { Banner, Logo, Chevron } from "./components/ui";
import { SITE } from "./data";
import { PulseCtx } from "./components/Btn";
import { MockApp, ChatCtx } from "./app/MockApp";
import { useChatState } from "./app/Chat";
import { Closing } from "./steps/Transition";

function useMedia(q: string) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

export default function App() {
  return (
    <Routes>
      <Route path="/step/:n/:s?" element={<Demo />} />
      <Route path="*" element={<Navigate to="/step/1" replace />} />
    </Routes>
  );
}

function Demo() {
  const params = useParams();
  const nav = useNavigate();
  const step = Math.min(Math.max(parseInt(params.n ?? "1") || 1, 1), STEPS.length);
  const def = STEPS[step - 1];
  const stage = Math.min(Math.max(parseInt(params.s ?? "1") - 1 || 0, 0), def.stages.length - 1);

  const go = useCallback((n: number, s = 0) => {
    const nn = Math.min(Math.max(n, 1), STEPS.length);
    nav(`/step/${nn}${s > 0 ? `/${s + 1}` : ""}`);
  }, [nav]);
  const setStage = useCallback((s: number) => go(step, s), [go, step]);
  const next = useCallback(() => {
    if (stage < def.stages.length - 1) go(step, stage + 1);
    else if (step < STEPS.length) go(step + 1, 0);
  }, [stage, def, step, go]);
  const back = useCallback(() => {
    if (stage > 0) go(step, stage - 1);
    else if (step > 1) go(step - 1, STEPS[step - 2].stages.length - 1);
  }, [stage, step, go]);

  // Keyboard: arrows, PageUp/PageDown (clickers), space.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); back(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back]);

  // Scripted auto-advance (generating, pairing).
  const auto = def.stages[stage].autoMs;
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(next, auto);
    return () => clearTimeout(id);
  }, [auto, step, stage, next]);

  const api: DemoApi = useMemo(() => ({ step, stage, next, back, go, setStage }), [step, stage, next, back, go, setStage]);
  const lg = useMedia("(min-width: 1024px)");
  const tick = useTick(1000);
  const chat = useChatState();
  // Interstitial stage (break page): full width on every screen size.
  const inter = !!def.stages[stage].interstitial;
  const wide = inter;
  const isLast = step === STEPS.length && stage === def.stages.length - 1;
  // Next-step highlight: the stage's own guided button pulses. Next pulses only when the stage has none.
  // One highlight per stage: the first registered in-page button. Loading stages (autoMs) show no highlight.
  const [ctas, setCtas] = useState<string[]>([]);
  const registerCta = useCallback((id: string) => { setCtas((c) => [...c, id]); return () => setCtas((c) => c.filter((x) => x !== id)); }, []);
  const loading = !!def.stages[stage].autoMs;
  const pulseCtx = useMemo(() => ({ register: registerCta, active: loading ? null : ctas[0] ?? null }), [registerCta, ctas, loading]);
  const nextPulse = ctas.length === 0 && !isLast && !loading;
  const isFirst = step === 1 && stage === 0;
  const st = def.stages[stage];

  return (
    <DemoCtx.Provider value={api}><PulseCtx.Provider value={pulseCtx}><ChatCtx.Provider value={chat}>
      <div className="flex h-dvh flex-col bg-surface-2">
        <Banner />
        {/* Mobile and tablet: one thin bar with the PanelPal logo */}
        {!lg && (
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-bg px-3">
            <Logo className="h-5" /><span className="truncate text-xs text-muted">Demo · {SITE.company}</span>
          </div>
        )}
        {/* Desktop header */}
        <header className="hidden h-14 shrink-0 items-center gap-4 border-b border-border bg-bg px-6 lg:flex">
          <Logo className="h-6" />
          <span className="text-sm text-muted">Demo · {SITE.company}</span>
          <ol className="ml-auto flex items-center gap-1" aria-label="Demo steps">
            {STEPS.map((s) => (
              <li key={s.n}>
                <button onClick={() => go(s.n)} aria-current={s.n === step ? "step" : undefined}
                  className={`rounded-full px-3 py-1 text-[13px] ${s.n === step ? "bg-accent-soft font-semibold text-accent-strong ring-1 ring-accent" : s.n < step ? "text-text hover:bg-surface-2" : "text-muted hover:bg-surface-2"}`}>
                  <span className="tnum">{s.n}</span> {s.short}
                </button>
              </li>
            ))}
          </ol>
          {wide && (
            <div className="flex items-center gap-1 border-l border-border pl-3" aria-label="Presenter">
              <button onClick={back} disabled={isFirst} aria-label="Back" aria-disabled={isFirst || undefined} className="btn-secondary btn-icon"><Chevron dir="left" /></button>
              <span className="max-w-[160px] truncate text-xs text-muted" title={st.say}>{st.name}</span>
              <button onClick={next} disabled={isLast} aria-label="Next" aria-disabled={isLast || undefined} className={`btn-primary btn-icon ${nextPulse ? "guide-pulse" : ""}`}><Chevron dir="right" /></button>
            </div>
          )}
        </header>

        <main className={`flex min-h-0 flex-1 ${wide ? "" : "lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-5 lg:px-5 lg:py-4"}`}>
          {/* Presenter notes (desktop) */}
          <aside className={`hidden min-h-0 flex-col ${wide ? "" : "lg:flex"}`}>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[16px] border border-border bg-bg p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-faint">Step {step} of {STEPS.length}</div>
              <h1 className="font-display mt-1 text-[26px] leading-tight">{def.title}</h1>
              <ol className="mt-4 space-y-1.5">
                {def.stages.filter((x) => !x.interstitial).map((x, i) => (
                  <li key={x.name}>
                    <button onClick={() => setStage(i)} className={`flex w-full items-start gap-2 rounded-[8px] px-2 py-1.5 text-left text-sm ${i === stage ? "bg-accent-soft text-text" : "text-muted hover:bg-surface-2"}`}>
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold tnum ${i < stage ? "bg-accent text-accent-ink" : i === stage ? "border-[1.5px] border-accent text-accent-strong" : "border border-border-strong"}`}>{i + 1}</span>
                      <span className={i === stage ? "font-semibold" : ""}>{x.name}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-4 rounded-[10px] bg-surface-2 p-3 text-sm leading-relaxed text-text">
                <div className="mb-1 text-xs font-semibold text-muted">Say</div>
                {st.say}
              </div>
              <div className="mt-auto pt-4">
                <div className="flex gap-2">
                  <button onClick={back} disabled={isFirst} aria-disabled={isFirst || undefined} className="btn-secondary flex-1"><Chevron dir="left" /> Back</button>
                  <button onClick={next} disabled={isLast} aria-disabled={isLast || undefined} className={`btn-primary flex-1 ${nextPulse && lg && !wide ? "guide-pulse" : ""}`}>Next <Chevron dir="right" /></button>
                </div>
                <p className="mt-2 text-center text-xs text-faint">Use the ← and → keys. All data is example data.</p>
              </div>
            </div>
          </aside>

          {inter ? (
            <section className="min-h-0 flex-1" aria-label={st.name}><Closing /></section>
          ) : (
            <section className="relative min-h-0 flex-1 overflow-hidden bg-bg lg:rounded-[16px] lg:border lg:border-border" aria-label="App screen">
              <MockApp key={`${step}.${stage}`} view={st.view} tick={tick} next={next} />
            </section>
          )}
        </main>

        {/* Presenter bar (mobile and tablet) */}
        <nav className="flex shrink-0 items-center gap-2 border-t border-border bg-bg px-3 py-2 pb-[max(8px,env(safe-area-inset-bottom))] lg:hidden" aria-label="Presenter">
          <button onClick={back} disabled={isFirst} aria-label="Back" aria-disabled={isFirst || undefined} className="btn-secondary btn-icon"><Chevron dir="left" /></button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-[13px] font-semibold">{inter ? st.name : `${step}. ${def.title}`}</div>
            <div className="mt-1 flex justify-center gap-1">
              {STEPS.map((s) => (
                <button key={s.n} onClick={() => go(s.n)} aria-label={`Go to step ${s.n}`} className={`h-1.5 rounded-full ${s.n === step ? "w-5 bg-accent" : s.n < step ? "w-1.5 bg-accent/60" : "w-1.5 bg-border-strong"}`} />
              ))}
            </div>
          </div>
          <button onClick={next} disabled={isLast} aria-label="Next" aria-disabled={isLast || undefined} className={`btn-primary btn-icon ${nextPulse && !lg ? "guide-pulse" : ""}`}>Next <Chevron dir="right" /></button>
        </nav>
      </div>
    </ChatCtx.Provider></PulseCtx.Provider></DemoCtx.Provider>
  );
}
