import { SparkIc } from "../ui";
import { PanelAIChat, useChat } from "../Chat";
import { Button } from "../ui";

export function PanelAIPage() {
  const { messages, busy, clear } = useChat();
  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[420px] flex-col">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div><h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><SparkIc className="h-5 w-5 text-accent" />PanelAI</h1><div className="mt-1 text-sm text-muted">Ask about your machines, cameras and alerts. It sees only your organisation's data.</div></div>
        {messages.length > 0 && <Button size="sm" variant="ghost" onClick={clear} disabled={busy}>Clear</Button>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-[10px] border border-border"><PanelAIChat full /></div>
    </div>
  );
}
