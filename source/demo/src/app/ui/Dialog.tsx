import { useEffect, useRef, type ReactNode } from "react";
import { CloseIc } from "./Icons";

/** Modal: centred on desktop, bottom sheet on phones. */
export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Callers pass inline onClose functions: keep the latest in a ref so focus is set only when the dialog opens.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/35 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92%] w-full flex-col rounded-t-[16px] bg-surface shadow-raised sm:rounded-[16px] ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button type="button" data-close onClick={onClose} className="-mr-2 rounded-[8px] p-2 text-muted hover:bg-surface-2" aria-label="Close">
            <CloseIc />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
