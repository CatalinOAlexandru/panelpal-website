import type { ReactNode } from "react";
import { A, type Route } from "../nav";
import { BackIc } from "./Icons";

export function PageHeader({ title, sub, actions, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: { to: Route; label: string } }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <A to={back.to} className="mb-1 inline-flex items-center gap-1 text-[13px] text-muted hover:text-text">
            <BackIc className="h-3.5 w-3.5" />{back.label}
          </A>
        )}
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">{title}</h1>
        {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-dashed border-border-strong bg-surface-2 px-5 py-10 text-center">
      <div className="text-[15px] font-semibold">{title}</div>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Seg<T extends string>({ items, value, onChange }: { items: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-full border border-border-strong bg-bg p-[3px] text-sm no-scrollbar" role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          aria-selected={it.value === value}
          onClick={() => onChange(it.value)}
          className={`whitespace-nowrap rounded-full ${it.value === value ? "border-[1.5px] border-accent bg-accent-soft px-3 py-[3.5px] font-semibold text-accent-strong" : "px-3.5 py-[5px] text-muted hover:bg-surface-2"}`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
