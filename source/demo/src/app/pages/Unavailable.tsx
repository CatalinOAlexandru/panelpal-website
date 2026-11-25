import { Empty, PageHeader } from "../ui";

const ABOUT: Record<string, string> = {
  Settings: "In the real app this page holds the team, notifications, AI models and password.",
  "Machine assets": "In the real app this page holds the library of machine shapes used by the 2D plan and the 3D view. The AI can make a new machine type from a name and a description.",
};

export function Unavailable({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Empty title={`${title} are unavailable in this demo`}>{ABOUT[title] ?? ""} Book a demo to see it on your own site.</Empty>
    </>
  );
}
