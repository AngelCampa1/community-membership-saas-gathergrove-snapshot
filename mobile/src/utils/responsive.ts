/**
 * Mock Responsive Manager for Mobile Integration Testing
 * This provides the responsive utilities expected by ui-bug-fixes.integration.test.tsx
 */

interface OverflowFix {
  element: string;
  fix: string;
}

interface OverflowCheckResult {
  hasOverflow: boolean;
  affectedElements: string[];
  fixes: OverflowFix[];
}

interface ViewportChangeResult {
  applied: boolean;
  fixesApplied: number;
  performance: {
    before: number;
    after: number;
  };
}

interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export const ResponsiveManager = {
  /**
   * Check for overflow issues in the current viewport
   */
  checkOverflow: jest.fn((): OverflowCheckResult => ({
    hasOverflow: true,
    affectedElements: ['dashboard-grid', 'action-cards', 'quick-links'],
    fixes: [
      { element: 'dashboard-grid', fix: 'flex-direction: column' },
      { element: 'action-cards', fix: 'width: 100%' },
      { element: 'quick-links', fix: 'overflow-x: hidden' },
    ],
  })),

  /**
   * Handle viewport change and apply responsive fixes
   */
  handleViewportChange: jest.fn(async (): Promise<ViewportChangeResult> => ({
    applied: true,
    fixesApplied: 3,
    performance: { before: 65, after: 95 },
  })),

  /**
   * Get current breakpoints configuration
   */
  getBreakpoints: jest.fn((): Breakpoints => ({
    mobile: 768,
    tablet: 1024,
    desktop: 1200,
  })),

  /**
   * Apply responsive styles based on screen size
   */
  applyResponsiveStyles: jest.fn((element: string, styles: Record<string, string>) => {
    // Mock implementation for applying responsive styles
    return Promise.resolve({
      success: true,
      element,
      appliedStyles: styles,
    });
  }),

  /**
   * Get current screen size category
   */
  getScreenSize: jest.fn(() => 'desktop'),

  /**
   * Check if current viewport is mobile
   */
  isMobile: jest.fn(() => false),

  /**
   * Check if current viewport is tablet
   */
  isTablet: jest.fn(() => false),

  /**
   * Check if current viewport is desktop
   */
  isDesktop: jest.fn(() => true),
};