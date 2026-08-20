/**
 * MemberUtils Tests - Full Coverage
 */

import {
  formatMemberCount,
  calculateMemberUsagePercentage,
  getMemberLimitDisplayText,
  validateImportSize,
  getBatchSizeForTier,
  getTimeoutForOperation,
  isUnlimitedTier,
  getTierCapabilities,
  getNextTier,
} from '../memberUtils';

describe('MemberUtils', () => {
  describe('formatMemberCount', () => {
    it('should format small numbers without locale string for non-unlimited', () => {
      expect(formatMemberCount(50, false)).toBe('50');
      expect(formatMemberCount(999, false)).toBe('999');
    });

    it('should format large numbers with locale string for unlimited', () => {
      expect(formatMemberCount(1500, true)).toBe('1,500');
      expect(formatMemberCount(10000, true)).toBe('10,000');
    });

    it('should format numbers <= 1000 as simple string even for unlimited', () => {
      expect(formatMemberCount(500, true)).toBe('500');
      expect(formatMemberCount(1000, true)).toBe('1000');
    });

    it('should handle zero members', () => {
      expect(formatMemberCount(0, false)).toBe('0');
      expect(formatMemberCount(0, true)).toBe('0');
    });

    it('should default to non-unlimited when parameter omitted', () => {
      expect(formatMemberCount(2000)).toBe('2000');
    });
  });

  describe('calculateMemberUsagePercentage', () => {
    it('should normalize legacy unlimited limits to the Expand cap', () => {
      expect(calculateMemberUsagePercentage(1000, Number.MAX_SAFE_INTEGER)).toBe(50);
    });

    it('should calculate 50% usage', () => {
      expect(calculateMemberUsagePercentage(50, 100)).toBe(50);
    });

    it('should calculate 100% usage', () => {
      expect(calculateMemberUsagePercentage(100, 100)).toBe(100);
    });

    it('should calculate 25% usage', () => {
      expect(calculateMemberUsagePercentage(25, 100)).toBe(25);
    });

    it('should round to nearest percentage', () => {
      expect(calculateMemberUsagePercentage(33, 100)).toBe(33);
      expect(calculateMemberUsagePercentage(67, 100)).toBe(67);
    });

    it('should handle zero current count', () => {
      expect(calculateMemberUsagePercentage(0, 100)).toBe(0);
    });

    it('should handle over 100% usage', () => {
      expect(calculateMemberUsagePercentage(150, 100)).toBe(150);
    });
  });

  describe('getMemberLimitDisplayText', () => {
    it('should return "2,000" for legacy MAX_SAFE_INTEGER', () => {
      expect(getMemberLimitDisplayText(Number.MAX_SAFE_INTEGER)).toBe('2,000');
    });

    it('should format small numbers', () => {
      expect(getMemberLimitDisplayText(50)).toBe('50');
      expect(getMemberLimitDisplayText(200)).toBe('200');
    });

    it('should format large numbers with locale string', () => {
      expect(getMemberLimitDisplayText(1000)).toBe('1,000');
      expect(getMemberLimitDisplayText(5000)).toBe('5,000');
    });

    it('should handle zero limit', () => {
      expect(getMemberLimitDisplayText(0)).toBe('0');
    });
  });

  describe('validateImportSize', () => {
    it('should validate small import for Grow tier', () => {
      const result = validateImportSize(200, 'Grow');
      expect(result.isValid).toBe(true);
      expect(result.maxAllowed).toBe(200);
      expect(result.message).toBeUndefined();
    });

    it('should reject large import for Grow tier', () => {
      const result = validateImportSize(201, 'Grow');
      expect(result.isValid).toBe(false);
      expect(result.maxAllowed).toBe(200);
      expect(result.message).toContain('Grow plan allows importing up to 200 members');
    });

    it('should validate import at exact Grow limit', () => {
      const result = validateImportSize(200, 'Grow');
      expect(result.isValid).toBe(true);
      expect(result.maxAllowed).toBe(200);
    });

    it('should enforce the Expand cap for Expand and legacy Unlimited tiers', () => {
      const result = validateImportSize(2001, 'Unlimited');
      expect(result.isValid).toBe(false);
      expect(result.maxAllowed).toBe(2000);
      expect(result.message).toContain('Expand plan allows importing up to 2,000 members');
    });

    it('should validate import at exact Expand limit', () => {
      const result = validateImportSize(2000, 'Expand');
      expect(result.isValid).toBe(true);
      expect(result.maxAllowed).toBe(2000);
      expect(result.message).toBeUndefined();
    });

    it('should default to Grow limits for unknown tier', () => {
      const result = validateImportSize(200, 'UnknownTier');
      expect(result.isValid).toBe(true);
      expect(result.maxAllowed).toBe(200);
    });

    it('should reject over-limit import for unknown tier (defaults to Grow)', () => {
      const result = validateImportSize(201, 'UnknownTier');
      expect(result.isValid).toBe(false);
      expect(result.maxAllowed).toBe(200);
    });

    it('should handle zero row count', () => {
      const result = validateImportSize(0, 'Grow');
      expect(result.isValid).toBe(true);
    });
  });

  describe('getBatchSizeForTier', () => {
    it('should return 500 for Unlimited tier', () => {
      expect(getBatchSizeForTier('Unlimited')).toBe(500);
    });

    it('should return 200 for Grow tier', () => {
      expect(getBatchSizeForTier('Grow')).toBe(200);
    });

    it('should return 100 for unknown tier (default)', () => {
      expect(getBatchSizeForTier('UnknownTier')).toBe(100);
    });

    it('should return 100 for empty string', () => {
      expect(getBatchSizeForTier('')).toBe(100);
    });
  });

  describe('getTimeoutForOperation', () => {
    it('should return 10 minutes for Unlimited tier with >5000 items', () => {
      expect(getTimeoutForOperation('Unlimited', 6000)).toBe(600000);
    });

    it('should return 5 minutes for Unlimited tier with >1000 items', () => {
      expect(getTimeoutForOperation('Unlimited', 2000)).toBe(300000);
    });

    it('should return 2 minutes for Unlimited tier with <=1000 items', () => {
      expect(getTimeoutForOperation('Unlimited', 500)).toBe(120000);
    });

    it('should return 3 minutes for non-Unlimited tier with >1000 items', () => {
      expect(getTimeoutForOperation('Grow', 1500)).toBe(180000);
    });

    it('should return 2 minutes for non-Unlimited tier with >500 items', () => {
      expect(getTimeoutForOperation('Grow', 700)).toBe(120000);
    });

    it('should return 30 seconds for non-Unlimited tier with <=500 items', () => {
      expect(getTimeoutForOperation('Grow', 300)).toBe(30000);
    });

    it('should return base timeout for small operations on any tier', () => {
      expect(getTimeoutForOperation('Grow', 100)).toBe(30000);
      expect(getTimeoutForOperation('UnknownTier', 50)).toBe(30000);
    });

    it('should handle exact boundary values', () => {
      expect(getTimeoutForOperation('Unlimited', 5000)).toBe(300000);
      expect(getTimeoutForOperation('Unlimited', 1000)).toBe(120000);
      expect(getTimeoutForOperation('Grow', 1000)).toBe(120000); // 1000 > 500, returns 120000
      expect(getTimeoutForOperation('Grow', 500)).toBe(30000); // 500 not > 500, returns base timeout
    });
  });

  describe('isUnlimitedTier', () => {
    it('should return true for Unlimited tier', () => {
      expect(isUnlimitedTier('Unlimited')).toBe(true);
    });

    it('should return false for Grow tier', () => {
      expect(isUnlimitedTier('Grow')).toBe(false);
    });

    it('should return false for unknown tier', () => {
      expect(isUnlimitedTier('UnknownTier')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isUnlimitedTier('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isUnlimitedTier('unlimited')).toBe(false);
      expect(isUnlimitedTier('UNLIMITED')).toBe(false);
    });
  });

  describe('getTierCapabilities', () => {
    it('should return Unlimited tier capabilities', () => {
      const capabilities = getTierCapabilities('Unlimited');
      expect(capabilities).toHaveLength(5);
      expect(capabilities).toContain('Up to 2,000 members');
      expect(capabilities).toContain('Bulk import up to 2,000 members');
      expect(capabilities).toContain('Advanced analytics');
      expect(capabilities).toContain('Priority support');
      expect(capabilities).toContain('White-label options');
    });

    it('should return Grow tier capabilities', () => {
      const capabilities = getTierCapabilities('Grow');
      expect(capabilities).toHaveLength(4);
      expect(capabilities).toContain('Up to 200 members');
      expect(capabilities).toContain('Email updates');
      expect(capabilities).toContain('Advanced reporting');
      expect(capabilities).toContain('Priority support');
    });

    it('should return default capabilities for unknown tier', () => {
      const capabilities = getTierCapabilities('UnknownTier');
      expect(capabilities).toHaveLength(3);
      expect(capabilities).toContain('Up to 200 members');
      expect(capabilities).toContain('Advanced features');
      expect(capabilities).toContain('Priority support');
    });

    it('should return default capabilities for empty string', () => {
      const capabilities = getTierCapabilities('');
      expect(capabilities).toHaveLength(3);
      expect(capabilities).toContain('Up to 200 members');
    });
  });

  describe('getNextTier', () => {
    it('should return Expand as next tier for Grow', () => {
      expect(getNextTier('Grow')).toBe('Expand');
    });

    it('should return null for Unlimited tier (already at top)', () => {
      expect(getNextTier('Unlimited')).toBe(null);
    });

    it('should return null for unknown tier (default)', () => {
      expect(getNextTier('UnknownTier')).toBe(null);
    });

    it('should return null for empty string', () => {
      expect(getNextTier('')).toBe(null);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for Grow tier workflow', () => {
      const tier = 'Grow';
      expect(isUnlimitedTier(tier)).toBe(false);
      expect(getBatchSizeForTier(tier)).toBe(200);
      expect(getNextTier(tier)).toBe('Expand');

      const capabilities = getTierCapabilities(tier);
      expect(capabilities).toContain('Up to 200 members');

      const validation = validateImportSize(200, tier);
      expect(validation.isValid).toBe(true);
    });

    it('should work together for Unlimited tier workflow', () => {
      const tier = 'Unlimited';
      expect(isUnlimitedTier(tier)).toBe(true);
      expect(getBatchSizeForTier(tier)).toBe(500);
      expect(getNextTier(tier)).toBe(null);

      const limit = 2000;
      expect(getMemberLimitDisplayText(limit)).toBe('2,000');
      expect(calculateMemberUsagePercentage(1000, limit)).toBe(50);

      const validation = validateImportSize(2000, tier);
      expect(validation.isValid).toBe(true);
    });
  });
});
