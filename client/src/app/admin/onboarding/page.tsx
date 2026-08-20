"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SetupWizard } from "@/components/features/setup/setup-wizard";
import { Loader2 } from "lucide-react";
import { ErrorHandler } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const [isWizardOpen, setIsWizardOpen] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleWizardComplete = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
      setIsWizardOpen(false);
      
      // Add a small delay to ensure session is refreshed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to dashboard after completing the setup wizard
      if (user?.role === "Admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/app/dashboard");
      }
    } catch (error) {
      logger.error('admins', 'Failed to complete onboarding', { error, userId: user?.userId, clubId: user?.clubId });
      const apiError = ErrorHandler.handleAuthError(error, 'completing setup');
      ErrorHandler.showErrorToast(apiError);
      setIsCompleting(false);
      // Keep wizard open if completion fails
    }
  };

  const handleWizardDismiss = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
      setIsWizardOpen(false);
      
      // Add a small delay to ensure session is refreshed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Still mark onboarding as complete even if they skip the wizard
      if (user?.role === "Admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/app/dashboard");
      }
    } catch (error) {
      logger.error('admins', 'Failed to complete onboarding on dismiss', { error, userId: user?.userId, clubId: user?.clubId });
      const apiError = ErrorHandler.handleAuthError(error, 'completing setup');
      ErrorHandler.showErrorToast(apiError);
      setIsCompleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Completing setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <SetupWizard
        isOpen={isWizardOpen}
        onComplete={handleWizardComplete}
        onDismiss={handleWizardDismiss}
        clubId={user.clubId}
        clubName={user.clubName}
      />
    </div>
  );
} 