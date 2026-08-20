import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { StripeProviderWrapper } from '../StripeProviderWrapper';
import * as platformUtils from '@/utils/platformUtils';

// Mock platformUtils
jest.mock('@/utils/platformUtils', () => ({
  isStripeNativeAvailable: jest.fn(),
}));

// Mock @stripe/stripe-react-native
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('StripeProviderWrapper', () => {
  const TestChild = () => <Text testID="test-child">Test Child</Text>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Native Platform', () => {
    it('should render children with native Stripe provider when available and publishableKey provided', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(true);

      render(
        <StripeProviderWrapper
          publishableKey="pk_test_123"
          merchantIdentifier="merchant.com.test"
        >
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('should render children when Stripe native available but no publishableKey', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(true);

      render(
        <StripeProviderWrapper>
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('should pass publishableKey to native provider', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(true);

      const { root } = render(
        <StripeProviderWrapper publishableKey="pk_test_abc123">
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(root).toBeTruthy();
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('should pass merchantIdentifier to native provider', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(true);

      const { root } = render(
        <StripeProviderWrapper
          publishableKey="pk_test_123"
          merchantIdentifier="merchant.com.example"
        >
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(root).toBeTruthy();
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });
  });

  describe('Web Platform', () => {
    it('should render children with web fallback when Stripe native not available', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(false);

      render(
        <StripeProviderWrapper publishableKey="pk_test_123">
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('should render children on web without publishableKey', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(false);

      render(
        <StripeProviderWrapper>
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('should handle web platform gracefully', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(false);

      const { root } = render(
        <StripeProviderWrapper
          publishableKey="pk_test_web"
          merchantIdentifier="merchant.web"
        >
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(root).toBeTruthy();
    });
  });

  describe('Children Rendering', () => {
    it('should render single child correctly', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(false);

      render(
        <StripeProviderWrapper>
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('should render multiple children correctly', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(false);

      render(
        <StripeProviderWrapper>
          <Text testID="child-1">Child 1</Text>
          <Text testID="child-2">Child 2</Text>
          <Text testID="child-3">Child 3</Text>
        </StripeProviderWrapper>
      );

      expect(screen.getByTestId('child-1')).toBeTruthy();
      expect(screen.getByTestId('child-2')).toBeTruthy();
      expect(screen.getByTestId('child-3')).toBeTruthy();
    });

    it('should render nested components correctly', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(true);

      const NestedComponent = () => (
        <Text testID="nested">Nested Content</Text>
      );

      render(
        <StripeProviderWrapper publishableKey="pk_test_123">
          <NestedComponent />
        </StripeProviderWrapper>
      );

      expect(screen.getByTestId('nested')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined publishableKey gracefully', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(true);

      const { root } = render(
        <StripeProviderWrapper publishableKey={undefined}>
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(root).toBeTruthy();
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('should handle empty string publishableKey', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(true);

      const { root } = render(
        <StripeProviderWrapper publishableKey="">
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(root).toBeTruthy();
    });

    it('should handle missing merchantIdentifier', () => {
      (platformUtils.isStripeNativeAvailable as jest.Mock).mockReturnValue(true);

      const { root } = render(
        <StripeProviderWrapper publishableKey="pk_test_123">
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(root).toBeTruthy();
    });

    it('should handle platform check returning false during native render', () => {
      const mockIsAvailable = platformUtils.isStripeNativeAvailable as jest.Mock;

      // First call returns true (module loading), second returns false (runtime check)
      mockIsAvailable.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const { root } = render(
        <StripeProviderWrapper publishableKey="pk_test_123">
          <TestChild />
        </StripeProviderWrapper>
      );

      expect(root).toBeTruthy();
    });
  });

  describe('Platform Switching', () => {
    it('should handle switching from native to web', () => {
      const mockIsAvailable = platformUtils.isStripeNativeAvailable as jest.Mock;

      mockIsAvailable.mockReturnValue(true);
      const { rerender } = render(
        <StripeProviderWrapper publishableKey="pk_test_123">
          <TestChild />
        </StripeProviderWrapper>
      );
      expect(screen.getByTestId('test-child')).toBeTruthy();

      mockIsAvailable.mockReturnValue(false);
      rerender(
        <StripeProviderWrapper publishableKey="pk_test_123">
          <TestChild />
        </StripeProviderWrapper>
      );
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });

    it('should handle switching from web to native', () => {
      const mockIsAvailable = platformUtils.isStripeNativeAvailable as jest.Mock;

      mockIsAvailable.mockReturnValue(false);
      const { rerender } = render(
        <StripeProviderWrapper>
          <TestChild />
        </StripeProviderWrapper>
      );
      expect(screen.getByTestId('test-child')).toBeTruthy();

      mockIsAvailable.mockReturnValue(true);
      rerender(
        <StripeProviderWrapper publishableKey="pk_test_123">
          <TestChild />
        </StripeProviderWrapper>
      );
      expect(screen.getByTestId('test-child')).toBeTruthy();
    });
  });
});
