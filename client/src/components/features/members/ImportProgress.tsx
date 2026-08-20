"use client";

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, CheckCircle } from 'lucide-react';

interface ImportProgressProps {
  isImporting: boolean;
  progress?: number;
  currentStep?: string;
  processedCount?: number;
  totalCount?: number;
}

export function ImportProgress({ 
  isImporting, 
  progress = 0, 
  currentStep = 'Processing members...',
  processedCount = 0,
  totalCount = 0
}: ImportProgressProps) {
  return (
    <div className="space-y-6">
      {/* Main Progress Indicator */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {isImporting ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          ) : (
            <CheckCircle className="h-12 w-12 text-success" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {isImporting ? 'Importing Members...' : 'Import Complete'}
        </h3>
        
        <p className="text-muted-foreground">
          {isImporting 
            ? 'Please wait while we process your member data. This may take a few moments.'
            : 'All members have been processed successfully.'
          }
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{currentStep}</span>
          <span className="text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Processing Details */}
      {(processedCount > 0 || totalCount > 0) && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {processedCount} of {totalCount} members processed
          </span>
        </div>
      )}

      {/* Import Stages */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Import Process:
        </div>
        
        <div className="space-y-2">
          <ImportStage 
            title="Validating data" 
            isActive={progress < 25}
            isComplete={progress >= 25}
          />
          <ImportStage 
            title="Creating member records" 
            isActive={progress >= 25 && progress < 75}
            isComplete={progress >= 75}
          />
          <ImportStage 
            title="Setting up memberships" 
            isActive={progress >= 75 && progress < 90}
            isComplete={progress >= 90}
          />
          <ImportStage 
            title="Finalizing import" 
            isActive={progress >= 90 && progress < 100}
            isComplete={progress >= 100}
          />
        </div>
      </div>

      {/* Tips while waiting */}
      {isImporting && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="text-sm text-foreground">
            <p className="font-medium mb-2">💡 While you wait:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Large imports may take several minutes to complete</li>
              <li>• Don&apos;t close this window during the import process</li>
              <li>• You&apos;ll receive a detailed summary when complete</li>
              <li>• Failed imports can be retried with corrections</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

interface ImportStageProps {
  title: string;
  isActive: boolean;
  isComplete: boolean;
}

function ImportStage({ title, isActive, isComplete }: ImportStageProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-4 h-4 rounded-full flex items-center justify-center
        ${isComplete
          ? 'bg-success'
          : isActive
            ? 'bg-primary'
            : 'bg-muted'
        }
      `}>
        {isComplete ? (
          <CheckCircle className="h-3 w-3 text-white" />
        ) : isActive ? (
          <div className="w-2 h-2 bg-white rounded-full" />
        ) : null}
      </div>

      <span className={`
        text-sm
        ${isComplete
          ? 'text-success font-medium'
          : isActive
            ? 'text-primary font-medium'
            : 'text-muted-foreground'
        }
      `}>
        {title}
      </span>

      {isActive && (
        <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />
      )}
    </div>
  );
}