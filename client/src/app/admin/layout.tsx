import type { Metadata } from "next";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Sidebar } from "@/components/shared/Sidebar";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage your club with GatherGrove's comprehensive admin dashboard. Handle members, events, communications, and payments all in one place.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <RouteProtection>
        <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background-subtle/50">
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="lg:pl-64">
            <div className="min-h-screen bg-gradient-to-b from-background-subtle/20 to-muted/20">
              <div className="p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </RouteProtection>
    </ErrorBoundary>
  );
} 