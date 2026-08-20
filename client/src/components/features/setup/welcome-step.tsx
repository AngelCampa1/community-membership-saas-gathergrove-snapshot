"use client";

import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface WelcomeStepProps {
  clubName: string;
  onNext: () => void;
  onDismiss: () => void;
}

export function WelcomeStep({ clubName, onNext, onDismiss }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-success-foreground" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Congratulations!</h2>
        <p className="text-muted-foreground">
          Your club <span className="font-medium text-foreground">&ldquo;{clubName}&rdquo;</span> has been created successfully.
        </p>
      </div>

      <div className="bg-muted rounded-lg p-4 text-left">
        <h3 className="font-medium mb-2">Let&apos;s get you set up in just 3 simple steps:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Welcome & confirm your club details</li>
          <li>• Create your first membership type</li>
          <li>• Add your first member</li>
        </ul>
      </div>

      <p className="text-sm text-muted-foreground">
        This will only take a few minutes and will help you get the most out of GatherGrove.
      </p>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onDismiss}>
          Skip for now
        </Button>
        <Button onClick={onNext}>
          Let&apos;s get started
        </Button>
      </div>
    </div>
  );
} 