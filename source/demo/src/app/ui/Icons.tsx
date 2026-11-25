import type { ReactNode } from "react";

export function Ic({ children, className = "h-[18px] w-[18px]" }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

type P = { className?: string };
export const OverviewIc = (p: P) => <Ic {...p}><path d="M3 21V9l6 4V9l6 4V5l6 4v12z" /></Ic>;
export const MachineIc = (p: P) => <Ic {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></Ic>;
export const CameraIc = (p: P) => <Ic {...p}><rect x="3" y="7" width="18" height="12" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 7l1.5-3h5L16 7" /></Ic>;
export const DashIc = (p: P) => <Ic {...p}><rect x="3" y="3" width="8" height="10" rx="1.5" /><rect x="13" y="3" width="8" height="6" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="15" width="8" height="6" rx="1.5" /></Ic>;
export const BellIc = (p: P) => <Ic {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></Ic>;
export const BellOffIc = (p: P) => <Ic {...p}><path d="M6 16V11a6 6 0 0 1 .8-3M9.2 5.2A6 6 0 0 1 18 11v5l2 2H8M10 21h4M3 3l18 18" /></Ic>;
export const CubeIc = (p: P) => <Ic {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" /></Ic>;
export const GearIc = (p: P) => <Ic {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></Ic>;
export const PlusIc = (p: P) => <Ic className={p.className ?? "h-4 w-4"}><path d="M12 5v14M5 12h14" /></Ic>;
export const CloseIc = (p: P) => <Ic className={p.className ?? "h-5 w-5"}><path d="M6 6l12 12M18 6L6 18" /></Ic>;
export const SparkIc = (p: P) => <Ic className={p.className ?? "h-4 w-4"}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></Ic>;
export const TrashIc = (p: P) => <Ic className={p.className ?? "h-4 w-4"}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Ic>;
export const EditIc = (p: P) => <Ic className={p.className ?? "h-4 w-4"}><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" /></Ic>;
export const BackIc = (p: P) => <Ic className={p.className ?? "h-4 w-4"}><path d="M15 5l-7 7 7 7" /></Ic>;
export const LogoutIc = (p: P) => <Ic {...p}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></Ic>;
export const CheckIc = (p: P) => <Ic className={p.className ?? "h-4 w-4"}><path d="M4 12.5l5 5L20 6.5" /></Ic>;
export const CopyIc = (p: P) => <Ic className={p.className ?? "h-4 w-4"}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></Ic>;
export const PhoneIc = (p: P) => <Ic {...p}><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></Ic>;
export const EyeIc = (p: P) => <Ic className={p.className ?? "h-[18px] w-[18px]"}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Ic>;
export const EyeOffIc = (p: P) => <Ic className={p.className ?? "h-[18px] w-[18px]"}><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.6 3.4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></Ic>;
