"use client";

import { RouteProtection } from "@/components/auth/RouteProtection";
import { Sidebar } from "@/components/shared/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtection>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="lg:pl-64">
          <div className="min-h-screen">
            {children}
          </div>
        </div>
      </div>
    </RouteProtection>
  );
} 