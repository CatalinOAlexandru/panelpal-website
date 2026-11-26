import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { EyeIc, EyeOffIc } from "./Icons";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`pp-input ${p.className ?? ""}`} />;
/** Password field with an eye button that shows or hides what is typed. */
export function PasswordInput({ className = "", ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <span className="relative block">
      <input {...p} type={shown ? "text" : "password"} className={`pp-input pr-10 ${className}`} autoCapitalize="none" spellCheck={false} />
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-[var(--radius-control)] text-muted hover:text-text"
        onClick={(e) => { e.preventDefault(); setShown((v) => !v); }}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        title={shown ? "Hide password" : "Show password"}
      >
        {shown ? <EyeOffIc /> : <EyeIc />}
      </button>
    </span>
  );
}
export const Select = ({ children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) => (
  <select {...p} className={`pp-input ${p.className ?? ""}`}>{children}</select>
);
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`pp-input ${p.className ?? ""}`} />;

/** Number input that keeps null for empty. */
export function NumberInput({ value, onChange, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      {...p}
      type="number"
      inputMode="decimal"
      className={`pp-input ${p.className ?? ""}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex gap-2 rounded-[8px] border border-fault-dot/50 bg-fault-soft px-3 py-2 text-sm text-fault">
      <span aria-hidden>✕</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" | "good" }) {
  const c = tone === "warning" ? "border-warning-dot bg-warning-soft text-warning" : tone === "good" ? "border-running-dot/50 bg-running-soft text-running" : "border-border bg-surface-2 text-muted";
  return <div className={`rounded-[8px] border px-3 py-2 text-sm ${c}`}>{children}</div>;
}
