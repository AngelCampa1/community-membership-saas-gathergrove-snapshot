import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your club settings, manage admins, customize fields, and integrate with external services.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}