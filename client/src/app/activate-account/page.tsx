import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivateAccountForm } from "./components/ActivateAccountForm";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Activate Your Account",
  description: "Activate your GatherGrove member account and set your password to access the member portal.",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading activation page...</p>
      </div>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <RouteProtection>
      <Suspense fallback={<LoadingFallback />}>
        <ActivateAccountForm />
      </Suspense>
    </RouteProtection>
  );
}
