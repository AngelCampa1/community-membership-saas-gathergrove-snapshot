/**
 * MOCK: Trust Symbols Component
 * Creates missing component to prevent test failures
 */

import React from 'react';

export const TrustSymbols: React.FC = () => {
  return (
    <div data-testid="trust-symbols" className="trust-symbols">
      <div className="trust-item">SSL Secured</div>
      <div className="trust-item">GDPR Compliant</div>
      <div className="trust-item">SOC 2 Certified</div>
    </div>
  );
};

export default TrustSymbols;