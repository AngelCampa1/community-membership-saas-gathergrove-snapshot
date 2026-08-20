'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, X } from 'lucide-react';
import { ctaAnalyticsService } from '@/services/ctaAnalyticsService';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ctaId?: string;
}

export function DemoVideoModal({ isOpen, onClose, ctaId }: DemoVideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(true);
    setHasStartedPlaying(true);
    
    // Track demo video play
    ctaAnalyticsService.recordClick(
      ctaId || 'demo-video-play',
      'Watch Demo Video',
      'secondary',
      'modal',
      undefined,
      'demo_started'
    );
  };

  const handleVideoEnd = () => {
    // Track demo completion
    ctaAnalyticsService.recordConversion(
      ctaId || 'demo-video-complete',
      'demo_request',
      1
    );
  };

  const handleSignupAfterDemo = () => {
    // Track conversion from demo to signup
    ctaAnalyticsService.recordConversion(
      ctaId || 'demo-to-signup',
      'signup',
      1
    );
    
    // Redirect to signup
    window.location.href = '/register';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>GatherGrove Demo - 2 Minutes</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Watch a short demo showcasing GatherGrove's key features for club management
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="relative flex-1 bg-muted rounded-lg overflow-hidden">
            {!isPlaying ? (
              /* Video Thumbnail */
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-blue-500/10">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200" onClick={handlePlayClick}>
                      <Play className="h-8 w-8 text-primary-foreground ml-1" />
                    </div>
                    <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-xl font-semibold mt-4 mb-2">See GatherGrove in Action</h3>
                  <p className="text-muted-foreground max-w-md">
                    Watch this 2-minute demo to see how GatherGrove simplifies club management for hobby communities.
                  </p>
                </div>
              </div>
            ) : (
              /* Actual Video Player */
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-muted-foreground">Demo video would load here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Integration with Vimeo/YouTube/Loom player
                  </p>
                  {/* Simulate video completion after 3 seconds for demo */}
                  <Button 
                    className="mt-4"
                    onClick={handleVideoEnd}
                  >
                    Simulate Video End (for testing)
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Call-to-Action Section */}
          {hasStartedPlaying && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <h4 className="font-semibold mb-2">Ready to get started?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your club in under 5 minutes - start your free trial
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleSignupAfterDemo} className="min-h-[44px]">
                    Start Free Trial
                  </Button>
                  <Button variant="outline" onClick={onClose} className="min-h-[44px]">
                    Continue Browsing
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}