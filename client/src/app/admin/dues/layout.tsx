import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dues & Payments",
  description: "Manage member dues, track payments, and collect fees for your hobby club with GatherGrove's payment tools.",
};

export default function DuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}