using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Diagnostics;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Tests.Validation;

/// <summary>
/// TDD Validation Tests for TierGateService Resource Allocation
/// Tests that resource allocation validation enforces tier limits correctly
/// Validates the resource optimization that achieves:
/// - CPU reduction through background processing limits
/// - Memory reduction through cache size limits
/// - Database load reduction through analytics query limits
/// RED → GREEN → REFACTOR TDD approach with comprehensive validation
/// </summary>
[TestFixture]
[Category("Validation")]
[Category("TierGate")]
[Category("ResourceAllocation")]
public class TierGateResourceValidationTests : IDisposable
{
    private GatherGroveDbContext _context;
    private TierGateService _tierGateService;
    private Mock<IClubAuthorizationService> _mockAuthService;
    private Mock<ILogger<TierGateService>> _mockLogger;

    // Test club IDs for different tiers
    private const int BASIC_CLUB_ID = 1;
    private const int GROW_CLUB_ID = 51;
    private const int UNLIMITED_CLUB_ID = 101;
    private const int INVALID_CLUB_ID = 99999;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockAuthService = new Mock<IClubAuthorizationService>();
        _mockLogger = new Mock<ILogger<TierGateService>>();
        
        _tierGateService = new TierGateService(_context, _mockAuthService.Object, _mockLogger.Object);

        SeedTestData();
        SetupAuthorizationMocks();
    }

    private void SeedTestData()
    {
        var clubs = new[]
        {
            new Club { Id = BASIC_CLUB_ID, Name = "Basic Test Club", Tier = "Basic", CreatedAt = DateTime.UtcNow },
            new Club { Id = GROW_CLUB_ID, Name = "Grow Test Club", Tier = "Grow", CreatedAt = DateTime.UtcNow },
            new Club { Id = UNLIMITED_CLUB_ID, Name = "Unlimited Test Club", Tier = "Unlimited", CreatedAt = DateTime.UtcNow }
        };

        _context.Clubs.AddRange(clubs);
        _context.SaveChanges();
    }

    private void SetupAuthorizationMocks()
    {
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(BASIC_CLUB_ID))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(GROW_CLUB_ID))
            .ReturnsAsync(false);
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(UNLIMITED_CLUB_ID))
            .ReturnsAsync(true);
    }

    #region Tier Resource Limits Validation Tests

    [Test]
    public async Task GetTierResourceLimitsAsync_BasicTier_ReturnsCorrectLimits()
    {
        // Act
        var limits = await _tierGateService.GetTierResourceLimitsAsync(BASIC_CLUB_ID);

        // Assert - Validate Basic tier resource limits
        Assert.That(limits, Is.Not.Null);
        Assert.That(limits.MaxAnalyticsQueries, Is.EqualTo(100), "Basic tier should have 100 analytics queries limit");
        Assert.That(limits.MaxCacheSize, Is.EqualTo(50), "Basic tier should have 50MB cache size limit");
        Assert.That(limits.MaxBackgroundJobs, Is.EqualTo(0), "Basic tier should have 0 background jobs");
        Assert.That(limits.BackgroundProcessingEnabled, Is.False, "Basic tier should not have background processing");
        Assert.That(limits.AdvancedFeaturesEnabled, Is.False, "Basic tier should not have advanced features");

        Console.WriteLine($"Basic Tier Limits: Analytics={limits.MaxAnalyticsQueries}, Cache={limits.MaxCacheSize}, Background={limits.BackgroundProcessingEnabled}");
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_GrowTier_ReturnsCorrectLimits()
    {
        // Act
        var limits = await _tierGateService.GetTierResourceLimitsAsync(GROW_CLUB_ID);

        // Assert - Validate Grow tier resource limits
        Assert.That(limits, Is.Not.Null);
        Assert.That(limits.MaxAnalyticsQueries, Is.EqualTo(500), "Grow tier should have 500 analytics queries limit");
        Assert.That(limits.MaxCacheSize, Is.EqualTo(200), "Grow tier should have 200MB cache size limit");
        Assert.That(limits.MaxBackgroundJobs, Is.EqualTo(2), "Grow tier should have 2 background jobs");
        Assert.That(limits.BackgroundProcessingEnabled, Is.True, "Grow tier should have background processing");
        Assert.That(limits.AdvancedFeaturesEnabled, Is.False, "Grow tier should not have advanced features");

        Console.WriteLine($"Grow Tier Limits: Analytics={limits.MaxAnalyticsQueries}, Cache={limits.MaxCacheSize}, Background={limits.BackgroundProcessingEnabled}");
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_UnlimitedTier_ReturnsCorrectLimits()
    {
        // Act
        var limits = await _tierGateService.GetTierResourceLimitsAsync(UNLIMITED_CLUB_ID);

        // Assert - Validate Unlimited tier resource limits
        Assert.That(limits, Is.Not.Null);
        Assert.That(limits.MaxAnalyticsQueries, Is.EqualTo(-1), "Unlimited tier should have unlimited analytics queries");
        Assert.That(limits.MaxCacheSize, Is.EqualTo(-1), "Unlimited tier should have unlimited cache size");
        Assert.That(limits.MaxBackgroundJobs, Is.EqualTo(-1), "Unlimited tier should have unlimited background jobs");
        Assert.That(limits.BackgroundProcessingEnabled, Is.True, "Unlimited tier should have background processing");
        Assert.That(limits.AdvancedFeaturesEnabled, Is.True, "Unlimited tier should have advanced features");

        Console.WriteLine($"Unlimited Tier Limits: Analytics={limits.MaxAnalyticsQueries}, Cache={limits.MaxCacheSize}, Background={limits.BackgroundProcessingEnabled}");
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_InvalidClub_ReturnsBasicLimits()
    {
        // Act
        var limits = await _tierGateService.GetTierResourceLimitsAsync(INVALID_CLUB_ID);

        // Assert - Invalid club should default to basic tier limits for security
        Assert.That(limits, Is.Not.Null);
        Assert.That(limits.MaxAnalyticsQueries, Is.EqualTo(100), "Invalid club should default to basic tier limits");
        Assert.That(limits.MaxCacheSize, Is.EqualTo(50));
        Assert.That(limits.BackgroundProcessingEnabled, Is.False);
        Assert.That(limits.AdvancedFeaturesEnabled, Is.False);

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Club {INVALID_CLUB_ID} not found")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GetTierResourceLimitsAsync_UnknownTier_ReturnsBasicLimits()
    {
        // Arrange - Add club with unknown tier
        var unknownTierClub = new Club { Id = 999, Name = "Unknown Tier Club", Tier = "Premium", CreatedAt = DateTime.UtcNow };
        _context.Clubs.Add(unknownTierClub);
        _context.SaveChanges();

        // Act
        var limits = await _tierGateService.GetTierResourceLimitsAsync(999);

        // Assert - Unknown tier should default to basic tier limits
        Assert.That(limits, Is.Not.Null);
        Assert.That(limits.MaxAnalyticsQueries, Is.EqualTo(100));
        Assert.That(limits.BackgroundProcessingEnabled, Is.False);

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unknown tier Premium")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Resource Allocation Validation Tests

    [Test]
    public async Task ValidateResourceAllocationAsync_BasicTierWithinLimits_ReturnsTrue()
    {
        // Arrange - Valid basic tier resource request
        var request = new ResourceAllocationRequest
        {
            ClubId = BASIC_CLUB_ID,
            AnalyticsQueries = 50, // Within basic tier limit of 100
            CacheSize = 25, // Within basic tier limit of 50
            BackgroundProcessing = false
        };

        // Act
        var result = await _tierGateService.ValidateResourceAllocationAsync(request);

        // Assert
        Assert.That(result, Is.True, "Valid basic tier resource allocation should be approved");
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_BasicTierExceedsAnalyticsLimit_ThrowsException()
    {
        // Arrange - Basic tier request exceeding analytics queries limit
        var request = new ResourceAllocationRequest
        {
            ClubId = BASIC_CLUB_ID,
            AnalyticsQueries = 150, // Exceeds basic tier limit of 100
            CacheSize = 25,
            BackgroundProcessing = false
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tierGateService.ValidateResourceAllocationAsync(request));

        Assert.That(exception.Message, Does.Contain("Analytics queries limit exceeded"));
        Assert.That(exception.Message, Does.Contain("Limit: 100"));
        Assert.That(exception.Message, Does.Contain("Requested: 150"));

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("exceeded analytics queries limit")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_BasicTierExceedsCacheLimit_ThrowsException()
    {
        // Arrange - Basic tier request exceeding cache size limit
        var request = new ResourceAllocationRequest
        {
            ClubId = BASIC_CLUB_ID,
            AnalyticsQueries = 50,
            CacheSize = 75, // Exceeds basic tier limit of 50
            BackgroundProcessing = false
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tierGateService.ValidateResourceAllocationAsync(request));

        Assert.That(exception.Message, Does.Contain("Cache size limit exceeded"));
        Assert.That(exception.Message, Does.Contain("Limit: 50"));
        Assert.That(exception.Message, Does.Contain("Requested: 75"));
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_BasicTierRequestsBackgroundProcessing_ThrowsException()
    {
        // Arrange - Basic tier requesting background processing (not allowed)
        var request = new ResourceAllocationRequest
        {
            ClubId = BASIC_CLUB_ID,
            AnalyticsQueries = 50,
            CacheSize = 25,
            BackgroundProcessing = true // Not allowed for basic tier
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tierGateService.ValidateResourceAllocationAsync(request));

        Assert.That(exception.Message, Does.Contain("Background processing not available for this tier"));

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("requested background processing but tier doesn't allow")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_GrowTierWithinLimits_ReturnsTrue()
    {
        // Arrange - Valid grow tier resource request
        var request = new ResourceAllocationRequest
        {
            ClubId = GROW_CLUB_ID,
            AnalyticsQueries = 300, // Within grow tier limit of 500
            CacheSize = 150, // Within grow tier limit of 200
            BackgroundProcessing = true // Allowed for grow tier
        };

        // Act
        var result = await _tierGateService.ValidateResourceAllocationAsync(request);

        // Assert
        Assert.That(result, Is.True, "Valid grow tier resource allocation should be approved");
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_GrowTierExceedsLimits_ThrowsException()
    {
        // Arrange - Grow tier request exceeding limits
        var request = new ResourceAllocationRequest
        {
            ClubId = GROW_CLUB_ID,
            AnalyticsQueries = 600, // Exceeds grow tier limit of 500
            CacheSize = 150,
            BackgroundProcessing = true
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tierGateService.ValidateResourceAllocationAsync(request));

        Assert.That(exception.Message, Does.Contain("Analytics queries limit exceeded"));
        Assert.That(exception.Message, Does.Contain("Limit: 500"));
        Assert.That(exception.Message, Does.Contain("Requested: 600"));
    }

    [Test]
    public async Task ValidateResourceAllocationAsync_UnlimitedTierLargeRequest_ReturnsTrue()
    {
        // Arrange - Large unlimited tier resource request
        var request = new ResourceAllocationRequest
        {
            ClubId = UNLIMITED_CLUB_ID,
            AnalyticsQueries = 10000, // Large request - should be allowed for unlimited tier
            CacheSize = 5000, // Large cache request - should be allowed
            BackgroundProcessing = true
        };

        // Act
        var result = await _tierGateService.ValidateResourceAllocationAsync(request);

        // Assert
        Assert.That(result, Is.True, "Large unlimited tier resource allocation should be approved");

        // Verify debug log was written
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Resource allocation validated successfully")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Feature Access Validation Tests

    [Test]
    public async Task ValidateFeatureAccessAsync_BasicTierBasicFeatures_ReturnsTrue()
    {
        // Arrange - Basic tier features that should be accessible
        var basicFeatures = new[]
        {
            "MemberDirectory",
            "BasicEvents",
            "BasicReporting",
            "EventRSVP"
        };

        // Act & Assert
        foreach (var feature in basicFeatures)
        {
            var hasAccess = await _tierGateService.ValidateFeatureAccessAsync(BASIC_CLUB_ID, feature);
            Assert.That(hasAccess, Is.True, $"Basic tier should have access to {feature}");
        }
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_BasicTierAdvancedFeatures_ReturnsFalse()
    {
        // Arrange - Advanced features that should NOT be accessible to basic tier
        var advancedFeatures = new[]
        {
            "AdvancedAnalytics",
            "DataExport",
            "WhiteLabeling",
            "APIAccess",
            "MemberSegmentation",
            "AdvancedEventManagement"
        };

        // Act & Assert
        foreach (var feature in advancedFeatures)
        {
            var hasAccess = await _tierGateService.ValidateFeatureAccessAsync(BASIC_CLUB_ID, feature);
            Assert.That(hasAccess, Is.False, $"Basic tier should NOT have access to {feature}");

            // Verify access denial was logged
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"denied access to feature {feature}")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce);
        }
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_GrowTierFeatures_ReturnsCorrectAccess()
    {
        // Arrange
        var allowedFeatures = new[] { "EnhancedReporting", "CustomFields", "MemberDirectory", "BasicEvents" };
        var deniedFeatures = new[] { "AdvancedAnalytics", "DataExport", "WhiteLabeling", "APIAccess" };

        // Act & Assert - Allowed features
        foreach (var feature in allowedFeatures)
        {
            var hasAccess = await _tierGateService.ValidateFeatureAccessAsync(GROW_CLUB_ID, feature);
            Assert.That(hasAccess, Is.True, $"Grow tier should have access to {feature}");
        }

        // Act & Assert - Denied features
        foreach (var feature in deniedFeatures)
        {
            var hasAccess = await _tierGateService.ValidateFeatureAccessAsync(GROW_CLUB_ID, feature);
            Assert.That(hasAccess, Is.False, $"Grow tier should NOT have access to {feature}");
        }
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_UnlimitedTierAllFeatures_ReturnsTrue()
    {
        // Arrange - All available features
        var allFeatures = new[]
        {
            "MemberDirectory", "BasicEvents", "BasicReporting", "EventRSVP",
            "EnhancedReporting", "CustomFields",
            "AdvancedAnalytics", "DataExport", "WhiteLabeling", "APIAccess", "MemberSegmentation", "AdvancedEventManagement"
        };

        // Act & Assert
        foreach (var feature in allFeatures)
        {
            var hasAccess = await _tierGateService.ValidateFeatureAccessAsync(UNLIMITED_CLUB_ID, feature);
            Assert.That(hasAccess, Is.True, $"Unlimited tier should have access to {feature}");
        }
    }

    [Test]
    public async Task ValidateFeatureAccessAsync_UnknownFeature_ReturnsFalse()
    {
        // Arrange
        var unknownFeature = "NonExistentFeature";

        // Act
        var hasAccess = await _tierGateService.ValidateFeatureAccessAsync(UNLIMITED_CLUB_ID, unknownFeature);

        // Assert - Unknown features should be denied by default (security)
        Assert.That(hasAccess, Is.False, "Unknown features should be denied by default");
    }

    #endregion

    #region Unlimited Access Validation Tests

    [Test]
    public async Task ValidateUnlimitedAccessAsync_UnlimitedClub_ReturnsTrue()
    {
        // Act
        var hasAccess = await _tierGateService.ValidateUnlimitedAccessAsync(UNLIMITED_CLUB_ID);

        // Assert
        Assert.That(hasAccess, Is.True, "Unlimited club should have unlimited access");
        
        // Verify authorization service was called
        _mockAuthService.Verify(x => x.CanAccessUnlimitedFeaturesAsync(UNLIMITED_CLUB_ID), Times.Once);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_BasicClub_ReturnsFalse()
    {
        // Act
        var hasAccess = await _tierGateService.ValidateUnlimitedAccessAsync(BASIC_CLUB_ID);

        // Assert
        Assert.That(hasAccess, Is.False, "Basic club should not have unlimited access");
        
        // Verify denial was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Club {BASIC_CLUB_ID} denied access to unlimited features")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task ValidateUnlimitedAccessAsync_AuthorizationServiceThrows_ReturnsFalse()
    {
        // Arrange - Setup authorization service to throw
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(It.IsAny<int>()))
            .ThrowsAsync(new Exception("Authorization service error"));

        // Act
        var hasAccess = await _tierGateService.ValidateUnlimitedAccessAsync(BASIC_CLUB_ID);

        // Assert - Should fail closed (deny access on error)
        Assert.That(hasAccess, Is.False, "Should deny access when authorization service fails");

        // Verify error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Error validating unlimited access for club {BASIC_CLUB_ID}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Background Processing Validation Tests

    [Test]
    public async Task ShouldEnableBackgroundProcessingAsync_BasicTier_ReturnsFalse()
    {
        // Act
        var shouldEnable = await _tierGateService.ShouldEnableBackgroundProcessingAsync(BASIC_CLUB_ID);

        // Assert
        Assert.That(shouldEnable, Is.False, "Basic tier should not have background processing enabled");
    }

    [Test]
    public async Task ShouldEnableBackgroundProcessingAsync_GrowTier_ReturnsTrue()
    {
        // Act
        var shouldEnable = await _tierGateService.ShouldEnableBackgroundProcessingAsync(GROW_CLUB_ID);

        // Assert
        Assert.That(shouldEnable, Is.True, "Grow tier should have background processing enabled");
    }

    [Test]
    public async Task ShouldEnableBackgroundProcessingAsync_UnlimitedTier_ReturnsTrue()
    {
        // Act
        var shouldEnable = await _tierGateService.ShouldEnableBackgroundProcessingAsync(UNLIMITED_CLUB_ID);

        // Assert
        Assert.That(shouldEnable, Is.True, "Unlimited tier should have background processing enabled");
    }

    [Test]
    public async Task ShouldEnableBackgroundProcessingAsync_ErrorOccurs_ReturnsFalse()
    {
        // Arrange - Dispose context to cause error
        _context.Dispose();

        // Act
        var shouldEnable = await _tierGateService.ShouldEnableBackgroundProcessingAsync(BASIC_CLUB_ID);

        // Assert - Should disable background processing on error to save resources
        Assert.That(shouldEnable, Is.False, "Should disable background processing on error");

        // Verify error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Error checking background processing eligibility for club {BASIC_CLUB_ID}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Cache Key Generation Tests

    [Test]
    public void GetTierAwareCacheKey_BasicTier_GeneratesCorrectKey()
    {
        // Arrange
        var baseKey = "analytics-data";

        // Act
        var cacheKey = _tierGateService.GetTierAwareCacheKey(BASIC_CLUB_ID, baseKey);

        // Assert
        Assert.That(cacheKey, Is.EqualTo($"Basic:{BASIC_CLUB_ID}:{baseKey}"));
    }

    [Test]
    public void GetTierAwareCacheKey_UnlimitedTier_GeneratesCorrectKey()
    {
        // Arrange
        var baseKey = "member-patterns";

        // Act
        var cacheKey = _tierGateService.GetTierAwareCacheKey(UNLIMITED_CLUB_ID, baseKey);

        // Assert
        Assert.That(cacheKey, Is.EqualTo($"Unlimited:{UNLIMITED_CLUB_ID}:{baseKey}"));
    }

    [Test]
    public void GetTierAwareCacheKey_InvalidClub_GeneratesBasicKey()
    {
        // Arrange
        var baseKey = "test-key";

        // Act
        var cacheKey = _tierGateService.GetTierAwareCacheKey(INVALID_CLUB_ID, baseKey);

        // Assert
        Assert.That(cacheKey, Is.EqualTo($"Basic:{INVALID_CLUB_ID}:{baseKey}"));
    }

    #endregion

    #region Performance and Resource Optimization Tests

    [Test]
    public async Task ResourceValidation_PerformanceTest_CompletesWithinTimeLimit()
    {
        // Arrange
        var requests = Enumerable.Range(1, 1000).Select(i => new ResourceAllocationRequest
        {
            ClubId = i % 2 == 0 ? UNLIMITED_CLUB_ID : BASIC_CLUB_ID,
            AnalyticsQueries = 50,
            CacheSize = 25,
            BackgroundProcessing = false
        }).ToArray();

        var stopwatch = Stopwatch.StartNew();

        // Act
        var results = new List<bool>();
        foreach (var request in requests)
        {
            try
            {
                var result = await _tierGateService.ValidateResourceAllocationAsync(request);
                results.Add(result);
            }
            catch (InvalidOperationException)
            {
                results.Add(false);
            }
        }

        stopwatch.Stop();

        // Assert
        var avgTimePerValidation = stopwatch.ElapsedMilliseconds / (double)requests.Length;
        
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(5000), 
            $"1000 resource validations should complete in <5s, actual: {stopwatch.ElapsedMilliseconds}ms");
        Assert.That(avgTimePerValidation, Is.LessThan(5), 
            $"Average validation time should be <5ms, actual: {avgTimePerValidation:F2}ms");
        Assert.That(results.All(r => r), "All valid requests should be approved");

        Console.WriteLine($"Resource Validation Performance: {requests.Length} validations in {stopwatch.ElapsedMilliseconds}ms, {avgTimePerValidation:F2}ms avg");
    }

    [Test]
    public async Task TierLimitsRetrieval_BulkOperations_MaintainsPerformance()
    {
        // Arrange
        var clubIds = new[] { BASIC_CLUB_ID, GROW_CLUB_ID, UNLIMITED_CLUB_ID };
        var iterations = 500;

        var stopwatch = Stopwatch.StartNew();

        // Act
        var tasks = new List<Task<TierResourceLimits>>();
        for (int i = 0; i < iterations; i++)
        {
            var clubId = clubIds[i % clubIds.Length];
            tasks.Add(_tierGateService.GetTierResourceLimitsAsync(clubId));
        }

        var results = await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert
        var avgTimePerRetrieval = stopwatch.ElapsedMilliseconds / (double)iterations;
        
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(2000), 
            $"{iterations} tier limit retrievals should complete in <2s");
        Assert.That(avgTimePerRetrieval, Is.LessThan(4), 
            $"Average retrieval time should be <4ms, actual: {avgTimePerRetrieval:F2}ms");
        Assert.That(results.All(r => r != null), "All results should be non-null");

        // Verify correct distribution of tier limits
        var basicCount = results.Count(r => r.MaxAnalyticsQueries == 100);
        var growCount = results.Count(r => r.MaxAnalyticsQueries == 500);
        var unlimitedCount = results.Count(r => r.MaxAnalyticsQueries == -1);

        var expectedEach = iterations / clubIds.Length;
        Assert.That(basicCount, Is.EqualTo(expectedEach).Within(1), "Should have correct number of basic tier results");
        Assert.That(growCount, Is.EqualTo(expectedEach).Within(1), "Should have correct number of grow tier results");
        Assert.That(unlimitedCount, Is.EqualTo(expectedEach).Within(1), "Should have correct number of unlimited tier results");

        Console.WriteLine($"Tier Limits Retrieval Performance: {iterations} retrievals in {stopwatch.ElapsedMilliseconds}ms, {avgTimePerRetrieval:F2}ms avg");
    }

    #endregion

    public void Dispose()
    {
        _context?.Dispose();
    }
}