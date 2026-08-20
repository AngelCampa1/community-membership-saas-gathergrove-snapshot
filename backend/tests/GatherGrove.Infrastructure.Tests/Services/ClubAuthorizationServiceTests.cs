using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Services;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Tests.Services;

/// <summary>
/// TDD Tests for ClubAuthorizationService - Infrastructure authorization checks
/// Tests the club-specific authorization logic for tier-based feature access
/// Follows RED→GREEN→REFACTOR TDD cycle
/// </summary>
public class ClubAuthorizationServiceTests
{
    private GatherGroveDbContext _context = null!;
    private ClubAuthorizationService _authService = null!;
    private Mock<ILogger<GatherGrove.Infrastructure.Services.ClubAuthorizationService>> _mockLogger = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<GatherGrove.Infrastructure.Services.ClubAuthorizationService>>();
        _authService = new GatherGrove.Infrastructure.Services.ClubAuthorizationService(_context, _mockLogger.Object);

        SeedTestData();
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    private void SeedTestData()
    {
        var clubs = new[]
        {
            new Club { Id = 1, Name = "Basic Tier Club", Tier = "Basic", CreatedAt = DateTime.UtcNow },
            new Club { Id = 2, Name = "Grow Tier Club", Tier = "Grow", CreatedAt = DateTime.UtcNow },
            new Club { Id = 3, Name = "Unlimited Tier Club", Tier = "Unlimited", CreatedAt = DateTime.UtcNow },
            new Club { Id = 4, Name = "Mixed Case Tier Club", Tier = "unlimited", CreatedAt = DateTime.UtcNow },
            new Club { Id = 5, Name = "Null Tier Club", Tier = "Sprout", CreatedAt = DateTime.UtcNow },
            new Club { Id = 6, Name = "Empty Tier Club", Tier = "Sprout", CreatedAt = DateTime.UtcNow },
            new Club { Id = 7, Name = "Unknown Tier Club", Tier = "Enterprise", CreatedAt = DateTime.UtcNow }
        };

        _context.Clubs.AddRange(clubs);
        _context.SaveChanges();
    }

    #region CanAccessUnlimitedFeaturesAsync Tests (RED Phase)

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_UnlimitedTier_ReturnsTrue()
    {
        // Arrange
        var clubId = 3; // Unlimited tier

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_UnlimitedTierCaseInsensitive_ReturnsTrue()
    {
        // Arrange
        var clubId = 4; // "unlimited" (lowercase)

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_BasicTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 1; // Basic tier

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_GrowTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 2; // Grow tier

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_NullTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 5; // Null tier

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_EmptyTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 6; // Empty tier

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_UnknownTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 7; // Enterprise tier (unknown)

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_NonExistentClub_ReturnsFalseAndLogsWarning()
    {
        // Arrange
        var clubId = 999;

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.False);

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} not found")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region HasFeatureAccess Tests (RED Phase)

    [TestCase("MemberDirectory", 1, true)] // Basic features - Basic tier
    [TestCase("BasicEvents", 1, true)]
    [TestCase("BasicReporting", 1, true)]
    [TestCase("EventRSVP", 1, true)]
    [TestCase("MemberDirectory", 2, true)] // Basic features - Grow tier
    [TestCase("BasicEvents", 2, true)]
    [TestCase("BasicReporting", 2, true)]
    [TestCase("EventRSVP", 2, true)]
    [TestCase("MemberDirectory", 3, true)] // Basic features - Unlimited tier
    [TestCase("BasicEvents", 3, true)]
    [TestCase("BasicReporting", 3, true)]
    [TestCase("EventRSVP", 3, true)]
    public async Task HasFeatureAccess_BasicFeatures_AllTiersHaveAccess(string featureName, int clubId, bool expected)
    {
        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.EqualTo(expected));
    }

    [TestCase("AdvancedAnalytics", 1, false)] // Advanced features - Basic tier denied
    [TestCase("DataExport", 1, false)]
    [TestCase("WhiteLabeling", 1, false)]
    [TestCase("AdvancedEventManagement", 1, false)]
    [TestCase("MemberSegmentation", 1, false)]
    [TestCase("APIAccess", 1, false)]
    [TestCase("AdvancedAnalytics", 2, false)] // Advanced features - Grow tier denied
    [TestCase("DataExport", 2, false)]
    [TestCase("WhiteLabeling", 2, false)]
    [TestCase("AdvancedEventManagement", 2, false)]
    [TestCase("MemberSegmentation", 2, false)]
    [TestCase("APIAccess", 2, false)]
    [TestCase("AdvancedAnalytics", 3, true)] // Advanced features - Unlimited tier allowed
    [TestCase("DataExport", 3, true)]
    [TestCase("WhiteLabeling", 3, true)]
    [TestCase("AdvancedEventManagement", 3, true)]
    [TestCase("MemberSegmentation", 3, true)]
    [TestCase("APIAccess", 3, true)]
    public async Task HasFeatureAccess_AdvancedFeatures_OnlyUnlimitedTierHasAccess(string featureName, int clubId, bool expected)
    {
        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.EqualTo(expected));
    }

    [TestCase("EnhancedReporting", 1, false)] // Grow+ features - Basic tier denied
    [TestCase("CustomFields", 1, false)]
    [TestCase("EnhancedReporting", 2, true)] // Grow+ features - Grow tier allowed
    [TestCase("CustomFields", 2, true)]
    [TestCase("EnhancedReporting", 3, true)] // Grow+ features - Unlimited tier allowed
    [TestCase("CustomFields", 3, true)]
    public async Task HasFeatureAccess_GrowPlusFeatures_GrowAndUnlimitedTiersHaveAccess(string featureName, int clubId, bool expected)
    {
        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.EqualTo(expected));
    }

    [Test]
    public async Task HasFeatureAccess_UnknownFeature_ReturnsFalse()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        var featureName = "NonExistentFeature";

        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasFeatureAccess_EmptyFeatureName_ReturnsFalse()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        var featureName = "";

        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasFeatureAccess_NullFeatureName_ReturnsFalse()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        string featureName = null;

        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasFeatureAccess_NonExistentClub_ReturnsFalseAndLogsWarning()
    {
        // Arrange
        var clubId = 999;
        var featureName = "AdvancedAnalytics";

        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);

        // Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Club {clubId} not found")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region Feature Access Edge Cases (RED Phase)

    [Test]
    public async Task HasFeatureAccess_CaseInsensitiveFeatureName_HandlesProperly()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        var featureName = "advancedanalytics"; // lowercase

        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.False); // Should be case-sensitive and return false
    }

    [Test]
    public async Task HasFeatureAccess_WhitespaceFeatureName_ReturnsFalse()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        var featureName = "   ";

        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task HasFeatureAccess_SpecialCharactersInFeatureName_ReturnsFalse()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        var featureName = "Advanced@Analytics!";

        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion

    #region Error Handling Tests (RED Phase)

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_DatabaseError_ReturnsFalseAndLogsError()
    {
        // Arrange - Dispose context to simulate database error
        _context.Dispose();

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(1);

        // Assert
        Assert.That(result, Is.False); // Should fail closed on error

        // Verify error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Error checking Expand tier access")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task HasFeatureAccess_DatabaseError_ReturnsFalseAndLogsError()
    {
        // Arrange - Dispose context to simulate database error
        _context.Dispose();

        // Act
        var result = await _authService.HasFeatureAccess(1, "AdvancedAnalytics");

        // Assert
        Assert.That(result, Is.False); // Should fail closed on error

        // Verify error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Error checking feature access")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region Performance Tests (RED Phase)

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_PerformanceTest_CompletesWithin50ms()
    {
        // Arrange
        var clubId = 3;
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        await _authService.CanAccessUnlimitedFeaturesAsync(clubId);
        stopwatch.Stop();

        // Assert
        Assert.True(stopwatch.ElapsedMilliseconds < 50,
            $"Authorization check took {stopwatch.ElapsedMilliseconds}ms, should be under 50ms");
    }

    [Test]
    public async Task HasFeatureAccess_BulkFeatureChecks_CompletesWithin200ms()
    {
        // Arrange
        var clubId = 3;
        var features = new[]
        {
            "MemberDirectory", "BasicEvents", "BasicReporting", "EventRSVP",
            "AdvancedAnalytics", "DataExport", "WhiteLabeling", "AdvancedEventManagement",
            "MemberSegmentation", "APIAccess", "EnhancedReporting", "CustomFields"
        };

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var tasks = features.Select(f => _authService.HasFeatureAccess(clubId, f));
        var results = await Task.WhenAll(tasks);

        stopwatch.Stop();

        // Assert
        Assert.That(results, Is.Not.Null); // Just verify they completed
        Assert.That(results.Length, Is.EqualTo(features.Length));
        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(200),
            $"12 feature checks took {stopwatch.ElapsedMilliseconds}ms, should be under 200ms");
    }

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_ConcurrentRequests_HandlesLoadEfficiently()
    {
        // Arrange
        var clubIds = Enumerable.Range(1, 7).ToList(); // All test clubs
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act - Simulate concurrent requests from different clubs
        var tasks = clubIds.Select(id => _authService.CanAccessUnlimitedFeaturesAsync(id));
        var results = await Task.WhenAll(tasks);

        stopwatch.Stop();

        // Assert
        Assert.That(results.Length, Is.EqualTo(7));
        Assert.That(results[2], Is.True); // Club 3 (Unlimited) should return true
        Assert.That(results[3], Is.True); // Club 4 (unlimited lowercase) should return true
        Assert.That(results.Take(2).Concat(results.Skip(4)).All(r => r == false), Is.True); // Others should be false

        Assert.That(stopwatch.ElapsedMilliseconds, Is.LessThan(100),
            $"7 concurrent checks took {stopwatch.ElapsedMilliseconds}ms, should be under 100ms");
    }

    #endregion

    #region Logging Verification Tests (RED Phase)

    [Test]
    public async Task CanAccessUnlimitedFeaturesAsync_UnlimitedClub_LogsInformationWithAccess()
    {
        // Arrange
        var clubId = 3; // Unlimited tier

        // Act
        var result = await _authService.CanAccessUnlimitedFeaturesAsync(clubId);

        // Assert
        Assert.That(result, Is.True);

        // Verify information was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Expand access check for club {clubId} tier Unlimited: True")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    [Test]
    public async Task HasFeatureAccess_FeatureDenied_LogsInformationWithDenial()
    {
        // Arrange
        var clubId = 1; // Basic tier
        var featureName = "AdvancedAnalytics";

        // Act
        var result = await _authService.HasFeatureAccess(clubId, featureName);

        // Assert
        Assert.That(result, Is.False);

        // Verify information log was made (feature access is logged at information level)
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Feature access check for club {clubId} tier Basic, feature {featureName}: access=False")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()),
            Times.Once);
    }

    #endregion

    #region Integration with Real-World Scenarios (RED Phase)

    [Test]
    public async Task HasFeatureAccess_AllFeaturesForUnlimitedTier_ReturnsCorrectResults()
    {
        // Arrange
        var clubId = 3; // Unlimited tier
        var expectedResults = new Dictionary<string, bool>
        {
            ["MemberDirectory"] = true,
            ["BasicEvents"] = true,
            ["BasicReporting"] = true,
            ["EventRSVP"] = true,
            ["AdvancedAnalytics"] = true,
            ["DataExport"] = true,
            ["WhiteLabeling"] = true,
            ["AdvancedEventManagement"] = true,
            ["MemberSegmentation"] = true,
            ["APIAccess"] = true,
            ["EnhancedReporting"] = true,
            ["CustomFields"] = true
        };

        // Act & Assert
        foreach (var kvp in expectedResults)
        {
            var result = await _authService.HasFeatureAccess(clubId, kvp.Key);
            Assert.That(result, Is.EqualTo(kvp.Value));
        }
    }

    [Test]
    public async Task HasFeatureAccess_AllFeaturesForBasicTier_ReturnsCorrectResults()
    {
        // Arrange
        var clubId = 1; // Basic tier
        var expectedResults = new Dictionary<string, bool>
        {
            ["MemberDirectory"] = true,
            ["BasicEvents"] = true,
            ["BasicReporting"] = true,
            ["EventRSVP"] = true,
            ["AdvancedAnalytics"] = false,
            ["DataExport"] = false,
            ["WhiteLabeling"] = false,
            ["AdvancedEventManagement"] = false,
            ["MemberSegmentation"] = false,
            ["APIAccess"] = false,
            ["EnhancedReporting"] = false,
            ["CustomFields"] = false
        };

        // Act & Assert
        foreach (var kvp in expectedResults)
        {
            var result = await _authService.HasFeatureAccess(clubId, kvp.Key);
            Assert.That(result, Is.EqualTo(kvp.Value));
        }
    }

    [Test]
    public async Task HasFeatureAccess_AllFeaturesForGrowTier_ReturnsCorrectResults()
    {
        // Arrange
        var clubId = 2; // Grow tier
        var expectedResults = new Dictionary<string, bool>
        {
            ["MemberDirectory"] = true,
            ["BasicEvents"] = true,
            ["BasicReporting"] = true,
            ["EventRSVP"] = true,
            ["AdvancedAnalytics"] = false,
            ["DataExport"] = false,
            ["WhiteLabeling"] = false,
            ["AdvancedEventManagement"] = false,
            ["MemberSegmentation"] = false,
            ["APIAccess"] = false,
            ["EnhancedReporting"] = true,
            ["CustomFields"] = true
        };

        // Act & Assert
        foreach (var kvp in expectedResults)
        {
            var result = await _authService.HasFeatureAccess(clubId, kvp.Key);
            Assert.That(result, Is.EqualTo(kvp.Value));
        }
    }

    #endregion

    public void Dispose()
    {
        _context?.Dispose();
    }
}
