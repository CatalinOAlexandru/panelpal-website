import { createContext, useContext } from "react";
import type { World } from "./world";

/** What the mock app needs from the demo script: the world, the clock and the guided button. */
export interface AppApi {
  world: World;
  tick: number;
  /** The name of the button the script expects next (it gets the blue pulse), or null. */
  cta: string | null;
  /** Press the guided button: moves the demo on if `name` is the expected one. */
  guided: (name: string) => void;
  next: () => void;
}
export const AppCtx = createContext<AppApi>(null as unknown as AppApi);
export const useApp = () => useContext(AppCtx);
