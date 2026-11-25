import { Empty, PageHeader } from "../ui";

export function Unavailable({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Empty title={`${title} are unavailable in this demo`}>In the real app this page holds the team, notifications, AI models and password. Book a demo to see it on your own site.</Empty>
    </>
  );
}
