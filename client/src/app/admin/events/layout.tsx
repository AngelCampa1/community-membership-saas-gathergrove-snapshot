import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "Manage club events, coordinate RSVPs, and send invitations with GatherGrove's event management tools.",
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}