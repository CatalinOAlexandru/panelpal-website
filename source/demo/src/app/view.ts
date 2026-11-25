import type { Route } from "./nav";
import type { World } from "./world";
import type { ConnectPhase } from "./pages/Cameras";
import type { CalPhase } from "./pages/Calibrate";

/** What the mock app shows in one stage of the script. */
export interface View {
  route: Route;
  /** Changes to the world (setting up the camera moves CNC mill 3 from "none" to "live"). */
  world?: Partial<World>;
  /** The guided button the script expects next. It gets the blue pulse. */
  cta?: string;
  plan?: "2d" | "3d";
  select?: string;
  dash?: "tiles" | "2d" | "3d";
  connect?: ConnectPhase;
  cal?: CalPhase;
  editMachine?: boolean;
  /** PanelAI: "fresh" starts with the prompts; an id shows that answer. */
  chat?: "fresh" | "downtime";
}
