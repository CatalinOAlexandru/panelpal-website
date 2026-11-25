import { useEffect, useMemo, useRef, useState } from "react";
import { NavCtx, type Route } from "./nav";
import { AppCtx, type AppApi } from "./ctx";
import { ChatCtx, useChat } from "./Chat";
import { Shell } from "./Shell";
import type { View } from "./view";
import { FINISHED, type World } from "./world";
import { Overview } from "./pages/Overview";
import { MachinesPage } from "./pages/Machines";
import { Calibrate } from "./pages/Calibrate";
import { CamerasPage } from "./pages/Cameras";
import { DashboardsPage } from "./pages/Dashboards";
import { AlertsPage } from "./pages/Alerts";
import { PanelAIPage } from "./pages/PanelAIPage";
import { Unavailable } from "./pages/Unavailable";

export { ChatCtx };

/** The PanelPal web app with example data. It shows what the current stage of the script says, and you can still click around in it. */
export function MockApp({ view, tick, next }: { view: View; tick: number; next: () => void }) {
  const [route, setRoute] = useState<Route>(view.route);
  const chat = useChat();
  const world: World = useMemo(() => ({ ...FINISHED, ...view.world }), [view.world]);
  const cta = view.cta ?? null;
  const api: AppApi = useMemo(() => ({ world, tick, cta, next, guided: (name) => { if (name === cta) next(); } }), [world, tick, cta, next]);
  const nav = useMemo(() => ({ route, go: setRoute }), [route]);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chat.setOpen(false);
    if (view.chat === "fresh") chat.clear();
    if (view.chat === "downtime" && chat.messages.length === 0) chat.ask("downtime");
    // once per stage (the app is remounted for each stage)
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { top.current?.closest("[data-app-scroll]")?.scrollTo(0, 0); }, [route.page, route.id, route.sub]);

  let page;
  switch (route.page) {
    case "overview": page = <Overview plan={view.plan} select={view.select} />; break;
    case "machines": page = route.sub === "calibrate" ? <Calibrate id={route.id!} phase={view.cal ?? "corners"} /> : <MachinesPage detail={route.id} editing={view.editMachine} />; break;
    case "cameras": page = <CamerasPage dialog={view.connect} />; break;
    case "dashboards": page = <DashboardsPage id={route.id} view={view.dash} />; break;
    case "alerts": page = <AlertsPage />; break;
    case "panelai": page = <PanelAIPage />; break;
    case "assets": page = <Unavailable title="Machine assets" />; break;
    default: page = <Unavailable title="Settings" />;
  }
  return (
    <AppCtx.Provider value={api}><NavCtx.Provider value={nav}>
      <Shell><div ref={top} />{page}</Shell>
    </NavCtx.Provider></AppCtx.Provider>
  );
}
