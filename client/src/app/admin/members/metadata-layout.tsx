import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members",
  description: "Manage club members, membership types, invitations, and directory settings with GatherGrove's member management tools.",
};

export default function MembersMetadataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}