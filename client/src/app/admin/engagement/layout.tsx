import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Engagement | Admin Dashboard",
  description: "Monitor and analyze member engagement metrics, track participation, and identify at-risk members to improve club retention and activity.",
  keywords: "member engagement, analytics, participation tracking, club metrics, member retention",
};

export default function EngagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}