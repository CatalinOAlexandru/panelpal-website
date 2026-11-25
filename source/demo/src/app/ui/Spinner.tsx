export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`pp-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted justify-center" role="status">
      <Spinner className="h-4 w-4" /> {text}
    </div>
  );
}
