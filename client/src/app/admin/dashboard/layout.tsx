import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your club's key metrics, recent activity, and manage your hobby club from the GatherGrove dashboard.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}