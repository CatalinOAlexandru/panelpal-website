import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button, SparkIc } from "./ui";
import { ANSWERS, FREE_TEXT_REPLY, PROMPTS, type Answer } from "./panelai";
import { useApp } from "./ctx";
import { usePulse } from "../components/Btn";

export interface Msg { id: number; role: "user" | "assistant"; text: string; answer?: Answer }
interface ChatApi { messages: Msg[]; busy: boolean; open: boolean; setOpen: (o: boolean) => void; ask: (id: string) => void; say: (q: string) => void; clear: () => void }
export const ChatCtx = createContext<ChatApi>(null as unknown as ChatApi);
export const useChat = () => useContext(ChatCtx);

/** The chat state for the whole mock app. Answers are pre-written (panelai.ts); the short wait is only for show. */
export function useChatState(): ChatApi {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const seq = useRef(0);
  const timer = useRef(0);
  const busyRef = useRef(false); // set at once, so a repeated call (React strict mode runs effects twice) cannot ask the same question twice
  const reply = useCallback((q: string, a: Answer | null, ms: number) => {
    busyRef.current = true;
    setMessages((m) => [...m, { id: ++seq.current, role: "user", text: q }]);
    setBusy(true);
    timer.current = window.setTimeout(() => {
      busyRef.current = false;
      setBusy(false);
      setMessages((m) => [...m, { id: ++seq.current, role: "assistant", text: a ? a.text : FREE_TEXT_REPLY, answer: a ?? undefined }]);
    }, ms);
  }, []);
  const ask = useCallback((id: string) => { if (busyRef.current) return; const a = ANSWERS[id]; reply(PROMPTS.find((p) => p.id === id)!.text, a, 1500); }, [reply]);
  const say = useCallback((q: string) => { if (busyRef.current) return; const hit = PROMPTS.find((p) => p.text.toLowerCase() === q.trim().toLowerCase()); hit ? ask(hit.id) : reply(q, null, 700); }, [ask, reply]);
  const clear = useCallback(() => { busyRef.current = false; window.clearTimeout(timer.current); setBusy(false); setMessages([]); }, []);
  return useMemo(() => ({ messages, busy, open, setOpen, ask, say, clear }), [messages, busy, open, ask, say, clear]);
}

function Text({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").filter((l) => l.trim()).map((l, i) => (/^\s*-\s+/.test(l)
        ? <div key={i} className="flex gap-2"><span aria-hidden>•</span><span>{l.replace(/^\s*-\s+/, "")}</span></div>
        : <p key={i}>{l}</p>))}
    </div>
  );
}

function Table({ t }: { t: NonNullable<Answer["table"]> }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-[8px] border border-border bg-bg">
      <table className="w-full min-w-[420px] text-left text-[13px]">
        <thead className="bg-surface-2 text-xs text-muted"><tr>{t.head.map((h) => <th key={h} className="px-2.5 py-1.5 font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {t.rows.map((r, i) => {
            const g = t.groups.includes(i);
            return <tr key={i} className={`border-t border-border ${g ? "bg-accent-soft font-semibold" : ""}`}>{r.map((c, j) => <td key={j} className={`px-2.5 py-1 align-top ${j === 2 ? "tnum whitespace-nowrap" : ""} ${!g && j === 3 ? "text-muted" : ""} ${!g && j === 1 ? "pl-5" : ""}`}>{c}</td>)}</tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const mine = m.role === "user";
  const a = m.answer;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[94%] rounded-[12px] px-3 py-2 text-sm ${mine ? "bg-accent text-white" : "bg-surface-2"}`}>
        {mine ? m.text : <Text text={m.text} />}
        {a?.table && <Table t={a.table} />}
        {a && (
          <details className="mt-2 text-[12px] text-muted">
            <summary className="cursor-pointer select-none">How I got this · {(a.ms / 1000).toFixed(1)} s</summary>
            <div className="mt-1 space-y-2">
              {a.sources.map((s, i) => (
                <div key={i} className="rounded-[8px] bg-bg p-2">
                  <div className="font-semibold text-text">{s.lookup} <span className="font-normal text-faint">{Object.entries(s.args).map(([k, v]) => `${k}: ${v}`).join(", ")}</span></div>
                  <div className="mt-1 overflow-x-auto"><table className="w-full text-left"><tbody>{s.rows.map((r, j) => <tr key={j}>{r.map((c, n) => <td key={n} className="pr-3 align-top">{c}</td>)}</tr>)}</tbody></table></div>
                </div>
              ))}
              <div className="text-faint">Example answer, written in advance for this demo.</div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function PromptCard({ p, pulse, onPick }: { p: (typeof PROMPTS)[number]; pulse: boolean; onPick: () => void }) {
  const hl = usePulse(pulse);
  return (
    <button type="button" onClick={onPick}
      className={`block w-full rounded-[10px] border px-3 py-2.5 text-left hover:border-accent hover:bg-accent-soft ${p.complex ? "border-[1.5px] border-accent bg-accent-soft" : "border-border-strong"} ${hl}`}>
      {p.complex && <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white"><SparkIc className="h-3 w-3" /> Complex question</span>}
      <span className={`block ${p.complex ? "font-semibold" : ""}`}>{p.text}</span>
      {p.note && <span className="mt-0.5 block text-[12px] text-muted">{p.note}</span>}
    </button>
  );
}

/** The conversation: prompts, messages and the question box. Shared by the floating window and the full page. */
export function PanelAIChat({ full = false }: { full?: boolean }) {
  const { messages, busy, ask, say } = useChat();
  const { cta, guided } = useApp();
  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  const lastAnswer = useRef<HTMLDivElement>(null);
  // a new answer scrolls to its first line; a new question or the wait scrolls to the end
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && !busy) lastAnswer.current?.scrollIntoView({ block: "start" });
    else end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);
  useEffect(() => {
    if (!busy) return setElapsed(0);
    const t0 = Date.now();
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => window.clearInterval(t);
  }, [busy]);
  const pick = (id: string) => { ask(id); guided(`ask-${id}`); };
  return (
    <>
      <div className={`min-h-0 flex-1 overflow-y-auto ${full ? "px-1 py-4 sm:px-2" : "px-4 py-3"}`}>
        <div className={`space-y-3 ${full ? "mx-auto max-w-3xl" : ""}`}>
          {messages.length === 0 && (
            <div className="space-y-3 text-sm">
              <p className="text-muted">Pick a question to start. In the real app you type your own.</p>
              {PROMPTS.map((p) => <PromptCard key={p.id} p={p} pulse={cta === `ask-${p.id}`} onPick={() => pick(p.id)} />)}
              <p className="pt-1 text-[12px] text-faint">PanelAI looks things up with fixed, read-only queries and shows you which ones under each answer. Check anything important against the machine.</p>
            </div>
          )}
          {messages.map((m, i) => <div key={m.id} ref={i === messages.length - 1 ? lastAnswer : undefined}><Bubble m={m} /></div>)}
          {busy && <div className="text-sm text-muted" role="status">Looking that up… {elapsed} s</div>}
          <div ref={end} />
        </div>
      </div>
      <form className={`border-t border-border ${full ? "py-3" : "p-3"}`} onSubmit={(e) => { e.preventDefault(); if (text.trim().length > 1) { say(text); setText(""); } }}>
        <div className={`flex gap-2 ${full ? "mx-auto max-w-3xl" : ""}`}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder="Ask PanelAI…" aria-label="Question for PanelAI" className="pp-input flex-1" />
          <Button type="submit" variant="primary" disabled={busy || text.trim().length < 2}>Ask</Button>
        </div>
      </form>
    </>
  );
}

/** The floating window, as in the real app. Not shown on the PanelAI page itself. */
export function PanelAIWindow({ onFull, onPage }: { onFull: () => void; onPage: boolean }) {
  const { open, messages, busy, setOpen, clear } = useChat();
  if (!open || onPage) return null;
  return (
    <div role="dialog" aria-label="PanelAI" className="absolute inset-0 z-50 flex flex-col bg-bg sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[560px] sm:max-h-[calc(100%-2rem)] sm:w-[440px] sm:rounded-[14px] sm:border sm:border-border-strong sm:shadow-raised">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <SparkIc className="h-4 w-4 text-accent" />
        <div className="flex-1"><div className="text-sm font-semibold">PanelAI</div><div className="text-[11px] text-muted">Ask about your machines, cameras and alerts. Sees only your organisation's data.</div></div>
        {messages.length > 0 && <Button size="sm" variant="ghost" onClick={clear} disabled={busy}>Clear</Button>}
        <Button size="sm" variant="ghost" className="hidden md:inline-flex" onClick={() => { setOpen(false); onFull(); }} aria-label="Open PanelAI full screen" title="Full screen">⤢</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Close PanelAI">✕</Button>
      </header>
      <PanelAIChat />
    </div>
  );
}
