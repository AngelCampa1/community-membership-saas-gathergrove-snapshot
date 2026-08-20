import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your GatherGrove subscription, view usage, and update billing information for your club management platform.",
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}