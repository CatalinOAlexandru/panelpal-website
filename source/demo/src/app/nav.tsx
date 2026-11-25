/** Navigation inside the mock app: a route object instead of a URL, so the demo script can set it for each stage. */
import { createContext, useContext, type MouseEvent, type ReactNode } from "react";

export type Page = "overview" | "machines" | "cameras" | "dashboards" | "alerts" | "panelai" | "assets" | "settings";
export interface Route {
  page: Page;
  /** A machine id (machines) or a dashboard id (dashboards). */
  id?: string;
  /** "calibrate" on a machine. */
  sub?: "calibrate";
}
export interface NavApi { route: Route; go: (r: Route) => void }
export const NavCtx = createContext<NavApi>({ route: { page: "overview" }, go: () => {} });
export const useNav = () => useContext(NavCtx);

export const same = (a: Route, b: Route) => a.page === b.page && a.id === b.id && a.sub === b.sub;

/** A link that behaves like the real app's router link. */
export function A({ to, className, children, title, onClick }: { to: Route; className?: string; children: ReactNode; title?: string; onClick?: () => void }) {
  const { go } = useNav();
  const click = (e: MouseEvent) => { e.preventDefault(); onClick?.(); go(to); };
  return <a href="#" onClick={click} className={className} title={title}>{children}</a>;
}
