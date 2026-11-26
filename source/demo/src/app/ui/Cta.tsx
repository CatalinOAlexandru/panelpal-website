import type { ButtonHTMLAttributes, ReactNode } from "react";
import { usePulse } from "../../components/Btn";
import { Button } from "./Button";

/**
 * A button the demo script expects the presenter to press next. It gets the shared blue guide pulse
 * (one per stage), and pressing it runs `onClick` (normally the demo's Next).
 * Outside a guided stage (`pulse` false) it is an ordinary Button.
 */
export function Cta({ pulse = true, variant = "solid", size, className = "", children, ...rest }:
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { pulse?: boolean; variant?: "primary" | "secondary" | "solid" | "ghost" | "danger"; size?: "sm" | "md" | "block"; className?: string; children: ReactNode }) {
  const hl = usePulse(pulse && !rest.disabled);
  return <Button variant={variant} size={size} className={`${hl} ${className}`} {...rest}>{children}</Button>;
}
