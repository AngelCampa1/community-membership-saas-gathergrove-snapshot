import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Communications",
  description: "Send newsletters, announcements, and manage club communications with GatherGrove's messaging tools.",
};

export default function CommunicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}