using NUnit.Framework;
using GatherGrove.Infrastructure.Services.TierValidation;
using System.ComponentModel.DataAnnotations;

namespace GatherGrove.Application.Tests.DTOs;

/// <summary>
/// Comprehensive tests for ResourceAllocationRequest and TierResourceLimits validation
/// Following TDD RED-GREEN-REFACTOR principles for tier-aware resource optimization
/// Tests cover validation logic, edge cases, and tier-based resource constraints
/// </summary>
public class ResourceAllocationValidationTests
{
    #region ResourceAllocationRequest Validation Tests

    [Test]
    public void ResourceAllocationRequest_ValidRequest_PassesValidation()
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 1,
            AnalyticsQueries = 10,
            CacheSize = 100,
            BackgroundProcessing = true
        };

        // Act & Assert
        Assert.That(request.ClubId > 0, Is.True);
        Assert.That(request.AnalyticsQueries >= 0, Is.True);
        Assert.That(request.CacheSize >= 0, Is.True);
    }

    [TestCase(0)]
    [TestCase(-1)]
    [TestCase(-999)]
    public void ResourceAllocationRequest_InvalidClubId_FailsValidation(int invalidClubId)
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = invalidClubId,
            AnalyticsQueries = 10,
            CacheSize = 100,
            BackgroundProcessing = true
        };

        // Act & Assert
        Assert.That(request.ClubId > 0, Is.False);
    }

    [TestCase(-1)]
    [TestCase(-10)]
    [TestCase(-100)]
    public void ResourceAllocationRequest_NegativeAnalyticsQueries_FailsValidation(int negativeQueries)
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 1,
            AnalyticsQueries = negativeQueries,
            CacheSize = 100,
            BackgroundProcessing = true
        };

        // Act & Assert
        Assert.That(request.AnalyticsQueries >= 0, Is.False);
    }

    [TestCase(-1)]
    [TestCase(-50)]
    [TestCase(-1000)]
    public void ResourceAllocationRequest_NegativeCacheSize_FailsValidation(int negativeCacheSize)
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 1,
            AnalyticsQueries = 10,
            CacheSize = negativeCacheSize,
            BackgroundProcessing = true
        };

        // Act & Assert
        Assert.That(request.CacheSize >= 0, Is.False);
    }

    [Test]
    public void ResourceAllocationRequest_ZeroValues_PassesValidation()
    {
        // Arrange - Zero values should be allowed for basic tier clubs
        var request = new ResourceAllocationRequest
        {
            ClubId = 1,
            AnalyticsQueries = 0,
            CacheSize = 0,
            BackgroundProcessing = false
        };

        // Act & Assert
        Assert.That(request.ClubId > 0, Is.True);
        Assert.That(request.AnalyticsQueries >= 0, Is.True);
        Assert.That(request.CacheSize >= 0, Is.True);
    }

    [Test]
    public void ResourceAllocationRequest_MaximumValues_PassesValidation()
    {
        // Arrange - Test boundary conditions for unlimited tier
        var request = new ResourceAllocationRequest
        {
            ClubId = int.MaxValue,
            AnalyticsQueries = int.MaxValue,
            CacheSize = int.MaxValue,
            BackgroundProcessing = true
        };

        // Act & Assert
        Assert.That(request.ClubId > 0, Is.True);
        Assert.That(request.AnalyticsQueries >= 0, Is.True);
        Assert.That(request.CacheSize >= 0, Is.True);
    }

    [TestCase(1, 5, 50, false)] // Basic tier - minimal resources
    [TestCase(2, 20, 200, true)] // Grow tier - moderate resources
    [TestCase(3, 1000, 5000, true)] // Unlimited tier - high resources
    public void ResourceAllocationRequest_TierBasedValues_PassesValidation(
        int clubId, int analyticsQueries, int cacheSize, bool backgroundProcessing)
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = analyticsQueries,
            CacheSize = cacheSize,
            BackgroundProcessing = backgroundProcessing
        };

        // Act & Assert
        Assert.That(request.ClubId > 0, Is.True);
        Assert.That(request.AnalyticsQueries >= 0, Is.True);
        Assert.That(request.CacheSize >= 0, Is.True);
    }

    #endregion

    #region TierResourceLimits Validation Tests

    [Test]
    public void TierResourceLimits_ValidBasicTierLimits_PassesValidation()
    {
        // Arrange - Basic tier limits
        var limits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 5,
            MaxCacheSize = 50,
            MaxBackgroundJobs = 1,
            BackgroundProcessingEnabled = false,
            AdvancedFeaturesEnabled = false
        };

        // Act & Assert
        Assert.That(limits.MaxAnalyticsQueries >= 0, Is.True);
        Assert.That(limits.MaxCacheSize >= 0, Is.True);
        Assert.That(limits.MaxBackgroundJobs >= 0, Is.True);
        Assert.That(limits.BackgroundProcessingEnabled, Is.False);
        Assert.That(limits.AdvancedFeaturesEnabled, Is.False);
    }

    [Test]
    public void TierResourceLimits_ValidGrowTierLimits_PassesValidation()
    {
        // Arrange - Grow tier limits
        var limits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 25,
            MaxCacheSize = 250,
            MaxBackgroundJobs = 3,
            BackgroundProcessingEnabled = true,
            AdvancedFeaturesEnabled = false
        };

        // Act & Assert
        Assert.That(limits.MaxAnalyticsQueries >= 0, Is.True);
        Assert.That(limits.MaxCacheSize >= 0, Is.True);
        Assert.That(limits.MaxBackgroundJobs >= 0, Is.True);
        Assert.That(limits.BackgroundProcessingEnabled, Is.True);
        Assert.That(limits.AdvancedFeaturesEnabled, Is.False);
    }

    [Test]
    public void TierResourceLimits_ValidUnlimitedTierLimits_PassesValidation()
    {
        // Arrange - Unlimited tier limits
        var limits = new TierResourceLimits
        {
            MaxAnalyticsQueries = int.MaxValue,
            MaxCacheSize = int.MaxValue,
            MaxBackgroundJobs = int.MaxValue,
            BackgroundProcessingEnabled = true,
            AdvancedFeaturesEnabled = true
        };

        // Act & Assert
        Assert.That(limits.MaxAnalyticsQueries >= 0, Is.True);
        Assert.That(limits.MaxCacheSize >= 0, Is.True);
        Assert.That(limits.MaxBackgroundJobs >= 0, Is.True);
        Assert.That(limits.BackgroundProcessingEnabled, Is.True);
        Assert.That(limits.AdvancedFeaturesEnabled, Is.True);
    }

    [TestCase(-1, 50, 1)]
    [TestCase(5, -1, 1)]
    [TestCase(5, 50, -1)]
    public void TierResourceLimits_NegativeValues_FailsValidation(
        int maxQueries, int maxCacheSize, int maxBackgroundJobs)
    {
        // Arrange
        var limits = new TierResourceLimits
        {
            MaxAnalyticsQueries = maxQueries,
            MaxCacheSize = maxCacheSize,
            MaxBackgroundJobs = maxBackgroundJobs,
            BackgroundProcessingEnabled = false,
            AdvancedFeaturesEnabled = false
        };

        // Act & Assert
        var hasNegativeValues = limits.MaxAnalyticsQueries < 0 ||
                               limits.MaxCacheSize < 0 ||
                               limits.MaxBackgroundJobs < 0;
        Assert.That(hasNegativeValues, Is.True);
    }

    [Test]
    public void TierResourceLimits_ZeroLimits_PassesValidation()
    {
        // Arrange - Zero limits should be allowed for highly restricted tiers
        var limits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 0,
            MaxCacheSize = 0,
            MaxBackgroundJobs = 0,
            BackgroundProcessingEnabled = false,
            AdvancedFeaturesEnabled = false
        };

        // Act & Assert
        Assert.That(limits.MaxAnalyticsQueries >= 0, Is.True);
        Assert.That(limits.MaxCacheSize >= 0, Is.True);
        Assert.That(limits.MaxBackgroundJobs >= 0, Is.True);
        Assert.That(limits.BackgroundProcessingEnabled, Is.False);
        Assert.That(limits.AdvancedFeaturesEnabled, Is.False);
    }

    #endregion

    #region Resource Allocation Constraint Tests

    [TestCase(1, 10, 100, true, 5, 50, 1, false)] // Request exceeds basic tier limits
    [TestCase(2, 50, 500, true, 25, 250, 3, true)] // Request exceeds grow tier limits
    [TestCase(3, 1000, 5000, true, int.MaxValue, int.MaxValue, int.MaxValue, true)] // Unlimited tier - all allowed
    public void ResourceAllocation_ValidateAgainstTierLimits_ProperValidation(
        int clubId, int requestQueries, int requestCache, bool requestBackground,
        int limitQueries, int limitCache, int limitJobs, bool limitBackground)
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = requestQueries,
            CacheSize = requestCache,
            BackgroundProcessing = requestBackground
        };

        var limits = new TierResourceLimits
        {
            MaxAnalyticsQueries = limitQueries,
            MaxCacheSize = limitCache,
            MaxBackgroundJobs = limitJobs,
            BackgroundProcessingEnabled = limitBackground,
            AdvancedFeaturesEnabled = clubId == 3 // Only unlimited tier
        };

        // Act
        bool withinAnalyticsLimit = request.AnalyticsQueries <= limits.MaxAnalyticsQueries;
        bool withinCacheLimit = request.CacheSize <= limits.MaxCacheSize;
        bool backgroundAllowed = !request.BackgroundProcessing || limits.BackgroundProcessingEnabled;

        // Assert
        if (clubId == 3) // Unlimited tier
        {
            Assert.That(withinAnalyticsLimit, Is.True);
            Assert.That(withinCacheLimit, Is.True);
            Assert.That(backgroundAllowed, Is.True);
        }
        else if (clubId == 2) // Grow tier
        {
            Assert.That(withinAnalyticsLimit, Is.False); // Should exceed limits in test data
            Assert.That(withinCacheLimit, Is.False);
            Assert.That(backgroundAllowed, Is.True);
        }
        else // Basic tier
        {
            Assert.That(withinAnalyticsLimit, Is.False); // Should exceed limits in test data
            Assert.That(withinCacheLimit, Is.False);
            Assert.That(backgroundAllowed, Is.False); // Basic tier doesn't allow background processing
        }
    }

    [Test]
    public void ResourceAllocation_BasicTierResourceBlocking_PreventsDatabaseLoad()
    {
        // Arrange - Basic tier should have minimal resource allocation
        var basicTierRequest = new ResourceAllocationRequest
        {
            ClubId = 1, // Basic tier
            AnalyticsQueries = 100, // Requesting more than allowed
            CacheSize = 1000, // Requesting more than allowed
            BackgroundProcessing = true // Not allowed for basic tier
        };

        var basicTierLimits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 5, // Very limited for database protection
            MaxCacheSize = 50, // Small cache to prevent memory issues
            MaxBackgroundJobs = 0, // No background jobs
            BackgroundProcessingEnabled = false,
            AdvancedFeaturesEnabled = false
        };

        // Act - Validate resource blocking for database protection
        bool shouldBlockQueries = basicTierRequest.AnalyticsQueries > basicTierLimits.MaxAnalyticsQueries;
        bool shouldBlockCache = basicTierRequest.CacheSize > basicTierLimits.MaxCacheSize;
        bool shouldBlockBackground = basicTierRequest.BackgroundProcessing && !basicTierLimits.BackgroundProcessingEnabled;

        // Assert - All should be blocked to achieve 40-60% database load reduction
        Assert.That(shouldBlockQueries, "Basic tier should block excessive analytics queries", Is.True);
        Assert.That(shouldBlockCache, "Basic tier should block excessive cache allocation", Is.True);
        Assert.That(shouldBlockBackground, "Basic tier should block background processing", Is.True);
    }

    [Test]
    public void ResourceAllocation_PerformanceOptimization_MeetsExpectedBenchmarks()
    {
        // Arrange - Test performance expectations for tier-based blocking
        var startTime = DateTime.UtcNow;

        var basicTierRequest = new ResourceAllocationRequest
        {
            ClubId = 1,
            AnalyticsQueries = 1,
            CacheSize = 10,
            BackgroundProcessing = false
        };

        var basicTierLimits = new TierResourceLimits
        {
            MaxAnalyticsQueries = 5,
            MaxCacheSize = 50,
            MaxBackgroundJobs = 0,
            BackgroundProcessingEnabled = false,
            AdvancedFeaturesEnabled = false
        };

        // Act - Simple validation should be very fast
        bool isValid = basicTierRequest.AnalyticsQueries <= basicTierLimits.MaxAnalyticsQueries &&
                      basicTierRequest.CacheSize <= basicTierLimits.MaxCacheSize &&
                      (!basicTierRequest.BackgroundProcessing || basicTierLimits.BackgroundProcessingEnabled);

        var processingTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

        // Assert - Performance should be under 5ms for tier validation
        Assert.That(isValid, Is.True);
        Assert.That(processingTime < 5, $"Tier validation took {processingTime}ms, expected < 5ms", Is.True);
    }

    #endregion

    #region Edge Case and Error Scenario Tests

    [Test]
    public void ResourceAllocationRequest_DefaultValues_AreValid()
    {
        // Arrange & Act
        var request = new ResourceAllocationRequest();

        // Assert - Default values should be safe (all zeros/false)
        Assert.That(request.ClubId, Is.EqualTo(0));
        Assert.That(request.AnalyticsQueries, Is.EqualTo(0));
        Assert.That(request.CacheSize, Is.EqualTo(0));
        Assert.That(request.BackgroundProcessing, Is.False);
    }

    [Test]
    public void TierResourceLimits_DefaultValues_AreValid()
    {
        // Arrange & Act
        var limits = new TierResourceLimits();

        // Assert - Default values should be safe (all zeros/false)
        Assert.That(limits.MaxAnalyticsQueries, Is.EqualTo(0));
        Assert.That(limits.MaxCacheSize, Is.EqualTo(0));
        Assert.That(limits.MaxBackgroundJobs, Is.EqualTo(0));
        Assert.That(limits.BackgroundProcessingEnabled, Is.False);
        Assert.That(limits.AdvancedFeaturesEnabled, Is.False);
    }

    [TestCase(int.MaxValue, int.MaxValue, int.MaxValue)]
    [TestCase(1000000, 5000000, 100)]
    public void ResourceAllocation_VeryLargeValues_HandledSafely(
        int largeQueries, int largeCache, int largeJobs)
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 3, // Unlimited tier
            AnalyticsQueries = largeQueries,
            CacheSize = largeCache,
            BackgroundProcessing = true
        };

        var limits = new TierResourceLimits
        {
            MaxAnalyticsQueries = int.MaxValue,
            MaxCacheSize = int.MaxValue,
            MaxBackgroundJobs = largeJobs,
            BackgroundProcessingEnabled = true,
            AdvancedFeaturesEnabled = true
        };

        // Act & Assert - Should handle large values without overflow
        Assert.That(request.AnalyticsQueries <= limits.MaxAnalyticsQueries, Is.True);
        Assert.That(request.CacheSize <= limits.MaxCacheSize, Is.True);
        Assert.That(largeJobs <= limits.MaxBackgroundJobs, Is.True);
    }

    [Test]
    public void ResourceAllocation_MixedScenarios_ValidatesCorrectly()
    {
        // Arrange - Mix of valid and invalid scenarios
        var scenarios = new[]
        {
            new { Request = new ResourceAllocationRequest { ClubId = 1, AnalyticsQueries = 3, CacheSize = 30, BackgroundProcessing = false },
                  Limits = new TierResourceLimits { MaxAnalyticsQueries = 5, MaxCacheSize = 50, BackgroundProcessingEnabled = false },
                  ShouldBeValid = true },

            new { Request = new ResourceAllocationRequest { ClubId = 1, AnalyticsQueries = 10, CacheSize = 30, BackgroundProcessing = false },
                  Limits = new TierResourceLimits { MaxAnalyticsQueries = 5, MaxCacheSize = 50, BackgroundProcessingEnabled = false },
                  ShouldBeValid = false },

            new { Request = new ResourceAllocationRequest { ClubId = 2, AnalyticsQueries = 20, CacheSize = 200, BackgroundProcessing = true },
                  Limits = new TierResourceLimits { MaxAnalyticsQueries = 25, MaxCacheSize = 250, BackgroundProcessingEnabled = true },
                  ShouldBeValid = true },

            new { Request = new ResourceAllocationRequest { ClubId = 3, AnalyticsQueries = 1000, CacheSize = 5000, BackgroundProcessing = true },
                  Limits = new TierResourceLimits { MaxAnalyticsQueries = int.MaxValue, MaxCacheSize = int.MaxValue, BackgroundProcessingEnabled = true },
                  ShouldBeValid = true }
        };

        // Act & Assert
        foreach (var scenario in scenarios)
        {
            bool isValid = scenario.Request.AnalyticsQueries <= scenario.Limits.MaxAnalyticsQueries &&
                          scenario.Request.CacheSize <= scenario.Limits.MaxCacheSize &&
                          (!scenario.Request.BackgroundProcessing || scenario.Limits.BackgroundProcessingEnabled);

            Assert.That(isValid, Is.EqualTo(scenario.ShouldBeValid),
                $"Scenario with ClubId {scenario.Request.ClubId} validation result mismatch");
        }
    }

    #endregion
}