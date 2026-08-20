using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Services.TierValidation;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Tests.Services.TierValidation;

/// <summary>
/// TDD Tests for TierGateService - Core tier-based resource validation
/// Tests the critical tier validation logic that prevents resource waste for basic tier clubs
/// Follows RED→GREEN→REFACTOR TDD cycle
/// </summary>
public class TierGateServiceTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly TierGateService _tierGateService;
    private readonly Mock<ILogger<TierGateService>> _mockLogger;

    public TierGateServiceTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<TierGateService>>();
        _tierGateService = new TierGateService(_context, _mockLogger.Object);

        SeedTestData();
    }

    private void SeedTestData()
    {
        var clubs = new[]
        {
            new Club { Id = 1, Name = "Grow Club (legacy Basic)", Tier = "Grow", CreatedAt = DateTime.UtcNow },
            new Club { Id = 2, Name = "Grow Club", Tier = "Grow", CreatedAt = DateTime.UtcNow },
            new Club { Id = 3, Name = "Unlimited Club", Tier = "Unlimited", CreatedAt = DateTime.UtcNow },
            new Club { Id = 4, Name = "Unknown Tier Club", Tier = "Premium", CreatedAt = DateTime.UtcNow },
            new Club { Id = 5, Name = "Null Tier Club", Tier = null, CreatedAt = DateTime.UtcNow }
        };

        _context.Clubs.AddRange(clubs);
        _context.SaveChanges();
    }

    #region ValidateUnlimitedAccessAsync Tests (RED Phase)

    [Test]
    public async Task ValidateUnlimitedAccessAsync_UnlimitedTierClub_ReturnsTrue()
    {
        // Arrange
        var clubId = 3; // Unlimited tier

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_GrowTierClub_ReturnsFalse_ById1()
    {
        // Arrange
        var clubId = 1; // Grow tier (formerly Basic – "Basic" tier no longer exists)

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_GrowTierClub_ReturnsFalse()
    {
        // Arrange
        var clubId = 2; // Grow tier

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_NonExistentClub_ReturnsFalse()
    {
        // Arrange
        var clubId = 999;

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_UnknownTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 4; // Premium tier (not defined in system)

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_NullTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 5; // Null tier

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_CaseInsensitive_ReturnsTrue()
    {
        // Arrange - Add club with mixed case tier
        var club = new Club { Id = 10, Name = "Mixed Case Club", Tier = "unlimited", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(10);

        // Assert
        Assert.That(result, Is.True);
    }

    #endregion

    #region ValidateFeatureAccessAsync Tests (RED Phase)

    [TestCase]
    [TestCase("MemberDirectory", 1, true)] // Basic features - all tiers
    [TestCase("BasicEvents", 1, true)]
    [TestCase("BasicReporting", 1, true)]
    [TestCase("EventRSVP", 1, true)]
    [TestCase("MemberDirectory", 2, true)] // Basic features - grow tier
    [TestCase("MemberDirectory", 3, true)] // Basic features - unlimited tier
    public async Task ValidateFeatureAccessAsync_BasicFeatures_AllTiersHaveAccess(string featureName, int clubId, bool expected)
    {
        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(clubId, featureName);

        // Assert
        Assert.That(result, Is.EqualTo(expected));
    }

    [TestCase]
    [TestCase("AdvancedAnalytics", 1, false)] // Advanced features - basic tier denied
    [TestCase("DataExport", 1, false)]
    [TestCase("WhiteLabeling", 1, false)]
    [TestCase("AdvancedEventManagement", 1, false)]
    [TestCase("MemberSegmentation", 1, false)]
    [TestCase("APIAccess", 1, false)]
    [TestCase("AdvancedAnalytics", 2, false)] // Advanced features - grow tier denied
    [TestCase("DataExport", 2, false)]
    [TestCase("AdvancedAnalytics", 3, true)] // Advanced features - unlimited tier allowed
    [TestCase("DataExport", 3, true)]
    [TestCase("WhiteLabeling", 3, true)]
    [TestCase("AdvancedEventManagement", 3, true)]
    [TestCase("MemberSegmentation", 3, true)]
    [TestCase("APIAccess", 3, true)]
    public async Task ValidateFeatureAccessAsync_AdvancedFeatures_OnlyUnlimitedTierHasAccess(string featureName, int clubId, bool expected)
    {
        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(clubId, featureName);

        // Assert
        Assert.That(result, Is.EqualTo(expected));
    }

    [TestCase]
    [TestCase("EnhancedReporting", 4, false)] // Grow+ features - unknown/legacy tier denied
    [TestCase("CustomFields", 4, false)]
    [TestCase("EnhancedReporting", 2, true)] // Grow+ features - grow tier allowed
    [TestCase("CustomFields", 2, true)]
    [TestCase("EnhancedReporting", 3, true)] // Grow+ features - unlimited tier allowed
    [TestCase("CustomFields", 3, true)]
    public async Task ValidateFeatureAccessAsync_GrowPlusFeatures_GrowAndUnlimitedTiersHaveAccess(string featureName, int clubId, bool expected)
    {
        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(clubId, featureName);

        // Assert
        Assert.That(result, Is.EqualTo(expected));
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_UnknownFeature_ReturnsFalse()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        var featureName = "NonExistentFeature";

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_NonExistentClub_ReturnsFalse()
    {
        // Arrange
        var clubId = 999;
        var featureName = "AdvancedAnalytics";

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region GetTierResourceLimitsAsync Tests (RED Phase)

    [Test]
    public async Task GetTierResourceLimitsAsync_GrowTier_ReturnsGrowLimits_ById1()
    {
        // Arrange
        var clubId = 1; // Grow tier (formerly Basic – "Basic" tier no longer exists)

        // Act
        var result = await _tierGateService.GetTierResourceLimitsAsync(clubId);

        // Assert – club 1 is now Grow tier
        Assert.That(result.MaxAnalyticsQueries, Is.EqualTo(500));
        Assert.That(result.MaxCacheSize, Is.EqualTo(200));
        Assert.That(result.MaxBackgroundJobs, Is.EqualTo(2));
        Assert.That(result.BackgroundProcessingEnabled, Is.True);
        Assert.That(result.AdvancedFeaturesEnabled, Is.False);
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_GrowTier_ReturnsGrowLimits()
    {
        // Arrange
        var clubId = 2; // Grow tier

        // Act
        var result = await _tierGateService.GetTierResourceLimitsAsync(clubId);

        // Assert
        Assert.That(result.MaxAnalyticsQueries, Is.EqualTo(500));
        Assert.That(result.MaxCacheSize, Is.EqualTo(200));
        Assert.That(result.MaxBackgroundJobs, Is.EqualTo(2));
        Assert.That(result.BackgroundProcessingEnabled, Is.True);
        Assert.That(result.AdvancedFeaturesEnabled, Is.False);
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_UnlimitedTier_ReturnsUnlimitedLimits()
    {
        // Arrange
        var clubId = 3; // Unlimited tier

        // Act
        var result = await _tierGateService.GetTierResourceLimitsAsync(clubId);

        // Assert
        Assert.That(result.MaxAnalyticsQueries, Is.EqualTo(-1));
        Assert.That(result.MaxCacheSize, Is.EqualTo(-1));
        Assert.That(result.MaxBackgroundJobs, Is.EqualTo(-1));
        Assert.That(result.BackgroundProcessingEnabled, Is.True);
        Assert.That(result.AdvancedFeaturesEnabled, Is.True);
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_UnknownTier_ReturnsGrowLimits()
    {
        // Arrange
        var clubId = 4; // Premium tier (unknown – falls back to Grow)

        // Act
        var result = await _tierGateService.GetTierResourceLimitsAsync(clubId);

        // Assert – unknown tiers fall back to Grow limits
        Assert.That(result.MaxAnalyticsQueries, Is.EqualTo(500));
        Assert.That(result.MaxCacheSize, Is.EqualTo(200));
        Assert.That(result.MaxBackgroundJobs, Is.EqualTo(2));
        Assert.That(result.BackgroundProcessingEnabled, Is.True);
        Assert.That(result.AdvancedFeaturesEnabled, Is.False);
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_NonExistentClub_ReturnsGrowLimits()
    {
        // Arrange
        var clubId = 999;

        // Act
        var result = await _tierGateService.GetTierResourceLimitsAsync(clubId);

        // Assert – non-existent clubs fall back to Grow limits
        Assert.That(result.MaxAnalyticsQueries, Is.EqualTo(500));
        Assert.That(result.MaxCacheSize, Is.EqualTo(200));
        Assert.That(result.MaxBackgroundJobs, Is.EqualTo(2));
        Assert.That(result.BackgroundProcessingEnabled, Is.True);
        Assert.That(result.AdvancedFeaturesEnabled, Is.False);
    }

    #endregion

    #region ValidateResourceAllocationAsync Tests (RED Phase)

    [Test]
    public async Task ValidateResourceAllocationAsync_GrowTierWithinLimits_ReturnsTrue()
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 1, // Grow tier
            AnalyticsQueries = 50,
            CacheSize = 25,
            BackgroundProcessing = false
        };

        // Act
        var result = await _tierGateService.ValidateResourceAllocationAsync(request);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_GrowTierExceedsAnalyticsLimit_ThrowsException()
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 2, // Grow tier (limit: 500)
            AnalyticsQueries = 600,
            CacheSize = 25,
            BackgroundProcessing = false
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tierGateService.ValidateResourceAllocationAsync(request));

        Assert.Contains("Analytics queries limit exceeded", exception.Message);
        Assert.Contains("Limit: 500, Requested: 600", exception.Message);
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_GrowTierExceedsCacheLimit_ThrowsException()
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 2, // Grow tier (limit: 200)
            AnalyticsQueries = 50,
            CacheSize = 250,
            BackgroundProcessing = false
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tierGateService.ValidateResourceAllocationAsync(request));

        Assert.Contains("Cache size limit exceeded", exception.Message);
        Assert.Contains("Limit: 200, Requested: 250", exception.Message);
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_UnknownTierExceedsGrowAnalyticsLimit_ThrowsException()
    {
        // Arrange – unknown tier falls back to Grow limits (500 queries)
        var request = new ResourceAllocationRequest
        {
            ClubId = 4, // Premium (unknown) tier – falls back to Grow limits
            AnalyticsQueries = 600,
            CacheSize = 25,
            BackgroundProcessing = false
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tierGateService.ValidateResourceAllocationAsync(request));

        Assert.Contains("Analytics queries limit exceeded", exception.Message);
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_UnlimitedTierLargeRequest_ReturnsTrue()
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 3, // Unlimited tier
            AnalyticsQueries = 10000,
            CacheSize = 5000,
            BackgroundProcessing = true
        };

        // Act
        var result = await _tierGateService.ValidateResourceAllocationAsync(request);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_GrowTierWithBackgroundProcessing_ReturnsTrue()
    {
        // Arrange
        var request = new ResourceAllocationRequest
        {
            ClubId = 2, // Grow tier (background processing enabled)
            AnalyticsQueries = 300,
            CacheSize = 150,
            BackgroundProcessing = true
        };

        // Act
        var result = await _tierGateService.ValidateResourceAllocationAsync(request);

        // Assert
        Assert.That(result, Is.True);
    }

    #endregion

    #region GetTierAwareCacheKey Tests (RED Phase)

    [Test]
    public void GetTierAwareCacheKey_GrowTier_ReturnsTierPrefixedKey()
    {
        // Arrange
        var clubId = 1; // Grow tier (formerly Basic – "Basic" no longer exists)
        var baseKey = "analytics_data";

        // Act
        var result = _tierGateService.GetTierAwareCacheKey(clubId, baseKey);

        // Assert
        Assert.That(result, Is.EqualTo("Grow:1:analytics_data"));
    }

    [Test]
    public void GetTierAwareCacheKey_UnlimitedTier_ReturnsTierPrefixedKey()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        var baseKey = "export_data";

        // Act
        var result = _tierGateService.GetTierAwareCacheKey(clubId, baseKey);

        // Assert
        Assert.That(result, Is.EqualTo("Unlimited:3:export_data"));
    }

    [Test]
    public void GetTierAwareCacheKey_NonExistentClub_ReturnsGrowTierKey()
    {
        // Arrange
        var clubId = 999;
        var baseKey = "test_data";

        // Act
        var result = _tierGateService.GetTierAwareCacheKey(clubId, baseKey);

        // Assert – non-existent clubs fall back to Grow
        Assert.That(result, Is.EqualTo("Grow:999:test_data"));
    }

    [Test]
    public void GetTierAwareCacheKey_NullTier_ReturnsGrowTierKey()
    {
        // Arrange
        var clubId = 5; // Null tier
        var baseKey = "member_data";

        // Act
        var result = _tierGateService.GetTierAwareCacheKey(clubId, baseKey);

        // Assert – null tier falls back to Grow
        Assert.That(result, Is.EqualTo("Grow:5:member_data"));
    }

    #endregion

    #region ShouldEnableBackgroundProcessingAsync Tests (RED Phase)

    [Test]
    public async Task ShouldEnableBackgroundProcessingAsync_GrowTier_ReturnsTrue_ById1()
    {
        // Arrange
        var clubId = 1; // Grow tier (formerly Basic – "Basic" tier no longer exists)

        // Act
        var result = await _tierGateService.ShouldEnableBackgroundProcessingAsync(clubId);

        // Assert – Grow tier has background processing enabled
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ShouldEnableBackgroundProcessingAsync_GrowTier_ReturnsTrue()
    {
        // Arrange
        var clubId = 2; // Grow tier

        // Act
        var result = await _tierGateService.ShouldEnableBackgroundProcessingAsync(clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ShouldEnableBackgroundProcessingAsync_UnlimitedTier_ReturnsTrue()
    {
        // Arrange
        var clubId = 3; // Unlimited tier

        // Act
        var result = await _tierGateService.ShouldEnableBackgroundProcessingAsync(clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ShouldEnableBackgroundProcessingAsync_NonExistentClub_ReturnsFalse()
    {
        // Arrange
        var clubId = 999;

        // Act
        var result = await _tierGateService.ShouldEnableBackgroundProcessingAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region Error Handling and Edge Cases (RED Phase)

    [Test]
    public async Task ValidateUnlimitedAccessAsync_DatabaseError_ReturnsFalseAndLogsError()
    {
        // Arrange - Dispose context to simulate database error
        _context.Dispose();

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(1);

        // Assert
        Assert.That(result, Is.False); // Should fail closed on error
        
        // Verify error was logged (using Mock verification)
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Error validating unlimited access")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_DatabaseError_ReturnsFalseAndLogsError()
    {
        // Arrange - Dispose context to simulate database error
        _context.Dispose();

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(1, "AdvancedAnalytics");

        // Assert
        Assert.That(result, Is.False); // Should fail closed on error
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_DatabaseError_ReturnsGrowLimits()
    {
        // Arrange - Dispose context to simulate database error
        _context.Dispose();

        // Act
        var result = await _tierGateService.GetTierResourceLimitsAsync(1);

        // Assert - Should return Grow limits on error (Basic tier removed)
        Assert.That(result.MaxAnalyticsQueries, Is.EqualTo(500));
        Assert.That(result.MaxCacheSize, Is.EqualTo(200));
        Assert.That(result.BackgroundProcessingEnabled, Is.True);
    }

    #endregion

    #region Performance Tests (RED Phase)

    [Test]
    public async Task ValidateUnlimitedAccessAsync_PerformanceTest_CompletesWithin100ms()
    {
        // Arrange
        var clubId = 3;
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        await _tierGateService.ValidateUnlimitedAccessAsync(clubId);
        stopwatch.Stop();

        // Assert
        Assert.True(stopwatch.ElapsedMilliseconds < 100, 
            $"Validation took {stopwatch.ElapsedMilliseconds}ms, should be under 100ms");
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_MultipleRequests_HandlesLoadEfficiently()
    {
        // Arrange
        var requests = Enumerable.Range(1, 100).Select(i => new ResourceAllocationRequest
        {
            ClubId = 3, // Unlimited tier
            AnalyticsQueries = 10,
            CacheSize = 50,
            BackgroundProcessing = false
        }).ToList();

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var tasks = requests.Select(r => _tierGateService.ValidateResourceAllocationAsync(r));
        var results = await Task.WhenAll(tasks);

        stopwatch.Stop();

        // Assert
        Assert.All(results, r => Assert.True(r));
        Assert.True(stopwatch.ElapsedMilliseconds < 1000, 
            $"100 validations took {stopwatch.ElapsedMilliseconds}ms, should be under 1000ms");
    }

    #endregion

    #region Seed Tier Tests

    [Test]
    public async Task GetTierResourceLimitsAsync_SeedTierClub_ReturnsSeedLimits()
    {
        // Arrange - add a Seed tier club
        var seedClub = new Club { Id = 10, Name = "Seed Club", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var limits = await _tierGateService.GetTierResourceLimitsAsync(10);

        // Assert
        Assert.That(limits.MaxAnalyticsQueries, Is.EqualTo(100));
        Assert.That(limits.MaxCacheSize, Is.EqualTo(50));
        Assert.That(limits.MaxBackgroundJobs, Is.EqualTo(1));
        Assert.That(limits.BackgroundProcessingEnabled, Is.True);
        Assert.That(limits.AdvancedFeaturesEnabled, Is.False);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_SeedTier_MemberDirectoryGranted()
    {
        // Arrange
        var seedClub = new Club { Id = 11, Name = "Seed Club 2", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(11, "MemberDirectory");

        // Assert
        Assert.That(result.HasAccess, Is.True);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_SeedTier_BasicEventsGranted()
    {
        // Arrange
        var seedClub = new Club { Id = 12, Name = "Seed Club 3", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(12, "BasicEvents");

        // Assert
        Assert.That(result.HasAccess, Is.True);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_SeedTier_WaitlistManagementGranted()
    {
        // Arrange
        var seedClub = new Club { Id = 13, Name = "Seed Club 4", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(13, "WaitlistManagement");

        // Assert
        Assert.That(result.HasAccess, Is.True);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_SeedTier_EventRSVPGranted()
    {
        // Arrange
        var seedClub = new Club { Id = 17, Name = "Seed Club 8", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(17, "EventRSVP");

        // Assert
        Assert.That(result.HasAccess, Is.True);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_SeedTier_BasicReportingGranted()
    {
        // Arrange
        var seedClub = new Club { Id = 18, Name = "Seed Club 9", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(18, "BasicReporting");

        // Assert
        Assert.That(result.HasAccess, Is.True);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_SeedTier_EnhancedReportingDenied()
    {
        // Arrange
        var seedClub = new Club { Id = 14, Name = "Seed Club 5", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(14, "EnhancedReporting");

        // Assert
        Assert.That(result.HasAccess, Is.False);
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_SeedTier_CustomFieldsDenied()
    {
        // Arrange
        var seedClub = new Club { Id = 15, Name = "Seed Club 6", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateFeatureAccessAsync(15, "CustomFields");

        // Assert
        Assert.That(result.HasAccess, Is.False);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_SeedTierClub_ReturnsFalse()
    {
        // Arrange
        var seedClub = new Club { Id = 16, Name = "Seed Club 7", Tier = "Seed", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(seedClub);
        await _context.SaveChangesAsync();

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(16);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    public void Dispose()
    {
        _context?.Dispose();
    }
}