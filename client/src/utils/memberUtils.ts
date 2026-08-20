/**
 * US-002: Utility functions for top-plan member management
 */

/**
 * Format member count for display
 * Handles large numbers with appropriate formatting
 */
export const formatMemberCount = (count: number, isUnlimited: boolean = false): string => {
  if (isUnlimited && count > 1000) {
    return count.toLocaleString();
  }
  return count.toString();
};

/**
 * Calculate member usage percentage
 */
export const calculateMemberUsagePercentage = (
  currentCount: number, 
  limit: number
): number => {
  const effectiveLimit = limit === Number.MAX_SAFE_INTEGER ? 2000 : limit;
  return Math.round((currentCount / effectiveLimit) * 100);
};

/**
 * Get member limit display text
 */
export const getMemberLimitDisplayText = (limit: number): string => {
  if (limit === Number.MAX_SAFE_INTEGER) {
    return '2,000';
  }
  return limit.toLocaleString();
};

/**
 * Check if import size is within tier limits
 * US-002: Enhanced validation for different tiers
 */
export const validateImportSize = (
  rowCount: number, 
  tier: string
): { isValid: boolean; message?: string; maxAllowed?: number } => {
  const limits = {
    'Grow': 200,
    'Unlimited': 2000,
    'Expand': 2000
  };

  const maxAllowed = limits[tier as keyof typeof limits] || limits.Grow;

  if (maxAllowed === Number.MAX_SAFE_INTEGER) {
    return { isValid: true, maxAllowed };
  }

  if (rowCount > maxAllowed) {
    return {
      isValid: false,
      maxAllowed,
      message: `Your ${tier === 'Unlimited' ? 'Expand' : tier} plan allows importing up to ${maxAllowed.toLocaleString()} members at once.`
    };
  }

  return { isValid: true, maxAllowed };
};

/**
 * Get batch size for processing based on tier
 * US-002: Optimize processing for different tiers
 */
export const getBatchSizeForTier = (tier: string): number => {
  switch (tier) {
    case 'Unlimited':
    case 'Expand':
      return 500;
    case 'Grow':
      return 200;
    default:
      return 100;
  }
};

/**
 * Get appropriate timeout for operations based on tier and size
 * US-002: Dynamic timeouts for large operations
 */
export const getTimeoutForOperation = (
  tier: string, 
  operationSize: number
): number => {
  const baseTimeout = 30000; // 30 seconds
  
  if (tier === 'Unlimited' || tier === 'Expand') {
    // Top plan gets extended timeouts for larger operations.
    if (operationSize > 5000) return 600000; // 10 minutes
    if (operationSize > 1000) return 300000; // 5 minutes
    return 120000; // 2 minutes
  }
  
  if (operationSize > 1000) return 180000; // 3 minutes
  if (operationSize > 500) return 120000; // 2 minutes
  
  return baseTimeout;
};

/**
 * Check if tier is the top paid plan
 * US-002: Helper function for tier checks
 */
export const isUnlimitedTier = (tier: string): boolean => {
  return tier === 'Unlimited' || tier === 'Expand';
};

/**
 * Get tier capabilities description
 * US-002: Display appropriate feature descriptions
 */
export const getTierCapabilities = (tier: string): string[] => {
  switch (tier) {
    case 'Unlimited':
    case 'Expand':
      return [
        'Up to 2,000 members',
        'Bulk import up to 2,000 members',
        'Advanced analytics',
        'Priority support',
        'White-label options'
      ];
    case 'Grow':
      return [
        'Up to 200 members',
        'Email updates',
        'Advanced reporting',
        'Priority support'
      ];
    default:
      return [
        'Up to 200 members',
        'Advanced features',
        'Priority support'
      ];
  }
};

/**
 * Get next upgrade tier
 * US-002: Helper for upgrade suggestions
 */
export const getNextTier = (currentTier: string): string | null => {
  switch (currentTier) {
    case 'Grow':
      return 'Expand';
    case 'Unlimited':
    case 'Expand':
    default:
      return null; // Already at top tier
  }
};
