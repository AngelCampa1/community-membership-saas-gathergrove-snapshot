/**
 * Animated Platform Preview Component
 * Displays animated preview of the platform interface
 */

import React from 'react';

export interface AnimatedPlatformPreviewProps {
  className?: string;
}

export const AnimatedPlatformPreview: React.FC<AnimatedPlatformPreviewProps> = ({ className }) => {
  return (
    <div className={`animated-platform-preview ${className || ''}`} data-testid="animated-platform-preview">
      <div className="platform-mockup">
        <h3>Platform Preview</h3>
        <p>Animated interface preview coming soon...</p>
      </div>
    </div>
  );
};

export default AnimatedPlatformPreview;