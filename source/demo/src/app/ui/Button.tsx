import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "solid" | "ghost" | "danger";
const V: Record<Variant, string> = {
  primary: "border-[1.5px] border-accent bg-accent-soft text-accent-strong hover:bg-[#d6e6f8]",
  solid: "border-[1.5px] border-accent bg-accent text-accent-ink hover:bg-accent-strong",
  secondary: "border border-border-strong bg-surface text-text hover:bg-surface-2",
  ghost: "border border-transparent bg-transparent text-muted hover:bg-surface-2 hover:text-text",
  danger: "border border-fault-dot bg-surface text-fault hover:bg-fault-soft",
};

export function Button({
  variant = "secondary", size = "md", busy, children, className = "", ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "block"; busy?: boolean; children: ReactNode }) {
  const sz = size === "sm" ? "h-8 px-2.5 text-[13px]" : size === "block" ? "h-11 w-full px-4 text-[15px]" : "h-10 px-3.5 text-sm";
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] font-semibold transition-colors disabled:opacity-55 ${sz} ${V[variant]} ${className}`}
    >
      {busy && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
