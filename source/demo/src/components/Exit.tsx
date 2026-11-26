import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Dialog } from "../app/ui/Dialog";
import { SITE_HOME } from "../steps/Transition";

/** Marks the open exit confirm. While it shows, the demo's arrow keys and clicker do nothing. */
export const EXIT_OPEN = "data-exit-confirm";

/**
 * A button that asks before it leaves the demo for the PanelPal website (the PanelPal logo and "Exit demo").
 * The confirm covers the whole window, so it is put on <body>.
 */
export function ExitDemo({ className = "", label, title, children }: { className?: string; label?: string; title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-label={label} title={title} aria-haspopup="dialog">{children}</button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80]" {...{ [EXIT_OPEN]: "" }}>
          <Dialog open onClose={close} title="Exit the demo?"
            footer={<>
              <button type="button" onClick={close} className="btn-secondary">Stay in the demo</button>
              <a href={SITE_HOME} className="btn-primary">Exit demo</a>
            </>}>
            <p className="text-[15px] leading-relaxed text-muted">You go back to the PanelPal website. The next time you open the demo, it starts from the beginning.</p>
          </Dialog>
        </div>,
        document.body,
      )}
    </>
  );
}
