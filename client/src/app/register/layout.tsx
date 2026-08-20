import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your GatherGrove account and start managing your hobby club. After onboarding, claim a 30-day free Grow trial.",
  robots: { index: false, follow: true },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
