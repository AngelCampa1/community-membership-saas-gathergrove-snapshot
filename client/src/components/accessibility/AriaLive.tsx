"use client";

import React from 'react';

interface AriaLiveProps {
  message?: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: "text" | "additions" | "additions removals" | "additions text" | "all" | "removals" | "removals additions" | "removals text" | "text additions" | "text removals";
  className?: string;
}

export default function AriaLive({ 
  message, 
  politeness = 'polite',
  atomic = true,
  relevant = 'text additions',
  className = 'sr-only'
}: AriaLiveProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
      role="status"
    >
      {message}
    </div>
  );
}

// Hook for programmatic announcements
export const useAriaLive = () => {
  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.querySelector(`[aria-live="${politeness}"]`);
    if (announcer) {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  return { announce };
};