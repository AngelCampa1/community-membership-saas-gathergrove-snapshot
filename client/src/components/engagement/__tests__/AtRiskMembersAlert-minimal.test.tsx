import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AtRiskMembersAlert from '../AtRiskMembersAlert';

// Import universal RadixUI mocking setup

describe('AtRiskMembersAlert Minimal Test', () => {
  it('should import without error', () => {
    expect(AtRiskMembersAlert).toBeDefined();
    expect(typeof AtRiskMembersAlert).toBe('function');
  });

  it('should render without crashing', () => {
    const { container } = render(<AtRiskMembersAlert clubId="123" />);
    expect(container).toBeInTheDocument();
  });
});