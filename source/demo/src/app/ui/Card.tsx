import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div {...rest} className={`rounded-[10px] border border-border bg-surface ${className}`}>{children}</div>;
}

export function CardHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    // On a phone the buttons or switch on the right drop under the title instead of squeezing it to a few letters
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-border px-4 py-3">
      <div className="min-w-0 flex-1 basis-40">
        <h2 className="truncate text-[15px] font-semibold">{title}</h2>
        {sub && <div className="text-[13px] text-muted">{sub}</div>}
      </div>
      {right && <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Stat({ label, value, dot }: { label: string; value: ReactNode; dot?: string }) {
  return (
    <Card className="px-4 py-3">
      <div className="flex items-center gap-1.5 text-[13px] text-muted">
        {dot && <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />}
        {label}
      </div>
      <div className="tnum mt-0.5 text-2xl font-semibold">{value}</div>
    </Card>
  );
}
