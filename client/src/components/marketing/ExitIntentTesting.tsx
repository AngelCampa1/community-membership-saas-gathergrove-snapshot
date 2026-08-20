"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExitIntentDebug } from './ExitIntentProvider';

export function ExitIntentTesting() {
  const { debugInfo, resetSession } = useExitIntentDebug();

  const triggerExitIntent = () => {
    // Manually trigger exit intent by dispatching a mouseleave event
    const event = new MouseEvent('mouseleave', {
      clientY: -10, // Negative Y means leaving upward
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);
  };

  const resetEverything = () => {
    resetSession();
    window.location.reload(); // Reload to reset all state
  };

  return (
    <Card className="fixed bottom-4 right-4 z-40 w-80 shadow-lg border-2 border-dashed border-warning">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-warning">🧪 Exit Intent Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs space-y-1">
          <div>Session Shown: <span className={debugInfo.sessionShown ? 'text-destructive' : 'text-success'}>
            {debugInfo.sessionShown ? 'Yes' : 'No'}
          </span></div>
          <div>Time on Page: {Math.round(debugInfo.timeOnPage / 1000)}s</div>
          <div>Has Triggered: <span className={debugInfo.hasTriggered ? 'text-destructive' : 'text-success'}>
            {debugInfo.hasTriggered ? 'Yes' : 'No'}
          </span></div>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={triggerExitIntent} 
            size="sm" 
            className="w-full text-xs"
            disabled={debugInfo.sessionShown}
          >
            🎯 Trigger Exit Intent
          </Button>
          
          <Button 
            onClick={resetEverything} 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
          >
            🔄 Reset & Reload
          </Button>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-2">
          <strong>Normal triggers:</strong><br/>
          • Mouse to top of browser (desktop)<br/>
          • Wait 30 seconds (mobile)<br/>
          • Rapid scroll to top
        </div>
      </CardContent>
    </Card>
  );
}

// Only show in development
export function ExitIntentTestingWrapper() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <ExitIntentTesting />;
}