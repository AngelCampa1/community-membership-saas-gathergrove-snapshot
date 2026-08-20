"use client";

import { useState } from 'react';
import posthog from 'posthog-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { WelcomeStep } from './welcome-step';
import { MembershipTypeStep } from './membership-type-step';
import { MemberStep } from './member-step';
import { MembershipTypeResponse } from '@/services/membershipTypeService';

interface SetupWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
  clubId: number;
  clubName: string;
}

export function SetupWizard({ isOpen, onComplete, onDismiss, clubId, clubName }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [createdMembershipType, setCreatedMembershipType] = useState<MembershipTypeResponse | null>(null);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const stepNames: Record<number, string> = {
    1: 'welcome',
    2: 'membership_type',
    3: 'add_member',
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      if (typeof window !== 'undefined') {
        posthog.capture('onboarding_step_completed', { step: currentStep, step_name: stepNames[currentStep] });
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMembershipTypeCreated = (membershipType: MembershipTypeResponse) => {
    setCreatedMembershipType(membershipType);
    handleNext();
  };

  const handleWizardComplete = () => {
    if (typeof window !== 'undefined') {
      posthog.capture('onboarding_step_completed', { step: totalSteps, step_name: stepNames[totalSteps] });
      posthog.capture('onboarding_completed');
    }
    onComplete();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            clubName={clubName}
            onNext={handleNext}
            onDismiss={onDismiss}
          />
        );
      case 2:
        return (
          <MembershipTypeStep
            clubId={clubId}
            onNext={handleMembershipTypeCreated}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <MemberStep
            clubId={clubId}
            membershipType={createdMembershipType!}
            onComplete={handleWizardComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to GatherGrove!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Complete the setup wizard to configure your club management system
          </DialogDescription>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 