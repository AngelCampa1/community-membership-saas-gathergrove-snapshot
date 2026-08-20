using Xunit;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services.TierValidation;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Tests.Services;

/// <summary>
/// Test suite for TierGateService - validates tier-based resource access
/// Part of resource optimization strategy to prevent basic tier resource waste
/// </summary>
public class TierValidationTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly Mock<ILogger<TierGateService>> _mockLogger;
    private readonly Mock<IClubAuthorizationService> _mockAuthService;
    private readonly TierGateService _tierGateService;

    public TierValidationTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<TierGateService>>();
        _mockAuthService = new Mock<IClubAuthorizationService>();
        
        _tierGateService = new TierGateService(_context, _mockAuthService.Object, _mockLogger.Object);
        
        SeedTestData();
    }

    [Fact]
    public async Task ValidateUnlimitedAccessAsync_UnlimitedTier_ReturnsTrue()
    {
        // Arrange
        var clubId = 1; // Unlimited tier club from seed data
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                       .ReturnsAsync(true);

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

        // Assert
        Assert.True(result);
        _mockAuthService.Verify(x => x.CanAccessUnlimitedFeaturesAsync(clubId), Times.Once);
    }

    [Fact]
    public async Task ValidateUnlimitedAccessAsync_BasicTier_ReturnsFalse()
    {
        // Arrange
        var clubId = 2; // Basic tier club from seed data
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                       .ReturnsAsync(false);

        // Act
        var result = await _tierGateService.ValidateUnlimitedAccessAsync(clubId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task ValidateFeatureAccessAsync_AdvancedAnalytics_UnlimitedOnly()
    {
        // Arrange
        var unlimitedClubId = 1;
        var basicClubId = 2;
        var feature = "AdvancedAnalytics";

        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(unlimitedClubId))
                       .ReturnsAsync(true);
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(basicClubId))
                       .ReturnsAsync(false);

        // Act & Assert
        var unlimitedResult = await _tierGateService.ValidateFeatureAccessAsync(unlimitedClubId, feature);
        var basicResult = await _tierGateService.ValidateFeatureAccessAsync(basicClubId, feature);

        Assert.True(unlimitedResult);
        Assert.False(basicResult);
    }

    [Theory]
    [InlineData("MemberDirectory")]
    [InlineData("BasicEvents")]
    [InlineData("BasicReporting")]
    public async Task ValidateFeatureAccessAsync_BasicFeatures_AllTiers(string feature)
    {
        // Arrange
        var unlimitedClubId = 1;
        var basicClubId = 2;

        // Act
        var unlimitedResult = await _tierGateService.ValidateFeatureAccessAsync(unlimitedClubId, feature);
        var basicResult = await _tierGateService.ValidateFeatureAccessAsync(basicClubId, feature);

        // Assert - Both tiers should have access to basic features
        Assert.True(unlimitedResult);
        Assert.True(basicResult);
    }

    [Fact]
    public async Task GetTierResourceLimitsAsync_UnlimitedTier_NoLimits()
    {
        // Arrange
        var clubId = 1;
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                       .ReturnsAsync(true);

        // Act
        var limits = await _tierGateService.GetTierResourceLimitsAsync(clubId);

        // Assert
        Assert.Equal(-1, limits.MaxAnalyticsQueries); // -1 indicates unlimited
        Assert.Equal(-1, limits.MaxCacheSize);
        Assert.True(limits.BackgroundProcessingEnabled);
    }

    [Fact]
    public async Task GetTierResourceLimitsAsync_BasicTier_HasLimits()
    {
        // Arrange
        var clubId = 2;
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                       .ReturnsAsync(false);

        // Act
        var limits = await _tierGateService.GetTierResourceLimitsAsync(clubId);

        // Assert
        Assert.Equal(100, limits.MaxAnalyticsQueries); // Limited queries
        Assert.Equal(50, limits.MaxCacheSize); // Limited cache
        Assert.False(limits.BackgroundProcessingEnabled); // No background processing
    }

    [Fact]
    public async Task ValidateResourceAllocationAsync_ExceedsLimits_ThrowsException()
    {
        // Arrange
        var clubId = 2; // Basic tier
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                       .ReturnsAsync(false);

        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 150, // Exceeds basic tier limit of 100
            CacheSize = 75, // Exceeds basic tier limit of 50
            BackgroundProcessing = true // Not allowed for basic tier
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tierGateService.ValidateResourceAllocationAsync(resourceRequest));
    }

    [Fact]
    public async Task ValidateResourceAllocationAsync_WithinLimits_Success()
    {
        // Arrange
        var clubId = 2; // Basic tier
        _mockAuthService.Setup(x => x.CanAccessUnlimitedFeaturesAsync(clubId))
                       .ReturnsAsync(false);

        var resourceRequest = new ResourceAllocationRequest
        {
            ClubId = clubId,
            AnalyticsQueries = 50, // Within basic tier limit
            CacheSize = 25, // Within basic tier limit
            BackgroundProcessing = false // Disabled for basic tier
        };

        // Act
        var result = await _tierGateService.ValidateResourceAllocationAsync(resourceRequest);

        // Assert
        Assert.True(result);
    }

    private void SeedTestData()
    {
        var clubs = new[]
        {
            new Club { Id = 1, Name = "Unlimited Club", Tier = "Unlimited", CreatedAt = DateTime.UtcNow },
            new Club { Id = 2, Name = "Basic Club", Tier = "Basic", CreatedAt = DateTime.UtcNow },
            new Club { Id = 3, Name = "Grow Club", Tier = "Grow", CreatedAt = DateTime.UtcNow }
        };

        _context.Clubs.AddRange(clubs);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

/// <summary>
/// Resource allocation request for tier validation
/// </summary>
public class ResourceAllocationRequest
{
    public int ClubId { get; set; }
    public int AnalyticsQueries { get; set; }
    public int CacheSize { get; set; }
    public bool BackgroundProcessing { get; set; }
}