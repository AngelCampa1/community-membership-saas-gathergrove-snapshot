using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using FluentAssertions;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class FeatureUsageAnalyticsServiceTests : IDisposable
{
    private GatherGroveDbContext _context;
    private FeatureUsageAnalyticsService _service;
    private Mock<ILogger<FeatureUsageAnalyticsService>> _mockLogger;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database with unique name for each test
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<FeatureUsageAnalyticsService>>();
        _service = new FeatureUsageAnalyticsService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }

    #region TrackFeatureUsageAsync Tests

    [Test]
    public async Task TrackFeatureUsageAsync_ValidParameters_ReturnsTrue()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "test@example.com");
        var featureName = "directory_search";
        var platform = "web";
        var sessionId = "session-123";

        // Act
        var result = await _service.TrackFeatureUsageAsync(
            club.Id, member.Id, featureName, platform, sessionId);

        // Assert
        result.Should().BeTrue();

        var trackedEvent = await _context.FeatureUsageEvents
            .FirstOrDefaultAsync(f => f.MemberId == member.Id && f.FeatureName == featureName);

        trackedEvent.Should().NotBeNull();
        trackedEvent!.ClubId.Should().Be(club.Id);
        trackedEvent.Platform.Should().Be(platform);
        trackedEvent.SessionId.Should().Be(sessionId);
        trackedEvent.EngagementWeight.Should().Be(1.2m); // directory_search weight
        trackedEvent.MemberTenureDays.Should().BeGreaterThan(0);
    }

    [Test]
    public async Task TrackFeatureUsageAsync_WithAllOptionalParameters_StoresCorrectData()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "test@example.com");
        var featureName = "dues_payment";
        var platform = "mobile";
        var sessionId = "session-456";
        var action = "payment_completed";
        var context = "monthly_dues";
        var duration = 45.5m;

        // Act
        var result = await _service.TrackFeatureUsageAsync(
            club.Id, member.Id, featureName, platform, sessionId, action, context, duration);

        // Assert
        result.Should().BeTrue();

        var trackedEvent = await _context.FeatureUsageEvents
            .FirstOrDefaultAsync(f => f.MemberId == member.Id && f.FeatureName == featureName);

        trackedEvent.Should().NotBeNull();
        trackedEvent!.Action.Should().Be(action);
        trackedEvent.Context.Should().Be(context);
        trackedEvent.Duration.Should().Be(duration);
        trackedEvent.EngagementWeight.Should().Be(2.0m); // dues_payment weight
        trackedEvent.Metadata.Should().NotBeNullOrEmpty();
    }

    [Test]
    public async Task TrackFeatureUsageAsync_NonExistentMember_ReturnsFalse()
    {
        // Arrange
        var club = await CreateTestClub();
        var nonExistentMemberId = 999;
        var featureName = "directory_search";
        var platform = "web";

        // Act
        var result = await _service.TrackFeatureUsageAsync(
            club.Id, nonExistentMemberId, featureName, platform);

        // Assert
        result.Should().BeFalse();

        var eventCount = await _context.FeatureUsageEvents.CountAsync();
        eventCount.Should().Be(0);
    }

    [Test]
    public async Task TrackFeatureUsageAsync_UnknownFeature_UsesDefaultWeight()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "test@example.com");
        var unknownFeature = "unknown_feature";
        var platform = "web";

        // Act
        var result = await _service.TrackFeatureUsageAsync(
            club.Id, member.Id, unknownFeature, platform);

        // Assert
        result.Should().BeTrue();

        var trackedEvent = await _context.FeatureUsageEvents
            .FirstOrDefaultAsync(f => f.MemberId == member.Id);

        trackedEvent.Should().NotBeNull();
        trackedEvent!.EngagementWeight.Should().Be(1.0m); // Default weight
    }

    [Test]
    public async Task TrackFeatureUsageAsync_DatabaseError_ReturnsFalse()
    {
        // Arrange
        _context.Dispose(); // Simulate database connection issue
        var service = new FeatureUsageAnalyticsService(_context, _mockLogger.Object);

        // Act
        var result = await service.TrackFeatureUsageAsync(1, 1, "test", "web");

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region GetFeatureUsageAnalyticsAsync Tests

    [Test]
    public async Task GetFeatureUsageAnalyticsAsync_WithFeatureUsageData_ReturnsAnalytics()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "member1@example.com");
        var member2 = await CreateTestMember(club.Id, "member2@example.com");

        await CreateFeatureUsageEvent(club.Id, member1.Id, "directory_search", "web", DateTime.UtcNow.AddDays(-5));
        await CreateFeatureUsageEvent(club.Id, member1.Id, "directory_search", "mobile", DateTime.UtcNow.AddDays(-3));
        await CreateFeatureUsageEvent(club.Id, member2.Id, "event_rsvp", "web", DateTime.UtcNow.AddDays(-2));
        await CreateFeatureUsageEvent(club.Id, member2.Id, "dues_payment", "web", DateTime.UtcNow.AddDays(-1));

        // Act
        var result = await _service.GetFeatureUsageAnalyticsAsync(club.Id, 30);

        // Assert
        result.Should().NotBeNull();
        result.FeatureUsage.Should().HaveCount(3); // directory_search, event_rsvp, dues_payment

        var directorySearch = result.FeatureUsage.First(f => f.FeatureName == "directory_search");
        directorySearch.UsageCount.Should().Be(2);
        directorySearch.UniqueUsers.Should().Be(1);
        directorySearch.AdoptionRate.Should().Be(50.0); // 1 out of 2 members

        var eventRsvp = result.FeatureUsage.First(f => f.FeatureName == "event_rsvp");
        eventRsvp.UsageCount.Should().Be(1);
        eventRsvp.UniqueUsers.Should().Be(1);

        result.PlatformUsage.Should().NotBeNull();
        result.PlatformUsage.Web.UsageCount.Should().Be(3);
        result.PlatformUsage.Mobile.UsageCount.Should().Be(1);
    }

    [Test]
    public async Task GetFeatureUsageAnalyticsAsync_EmptyClub_ReturnsEmptyAnalytics()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _service.GetFeatureUsageAnalyticsAsync(club.Id, 30);

        // Assert
        result.Should().NotBeNull();
        result.FeatureUsage.Should().BeEmpty();
        result.PlatformUsage.Web.UsageCount.Should().Be(0);
        result.PlatformUsage.Mobile.UsageCount.Should().Be(0);
        result.AdoptionTrends.Should().BeEmpty();
        result.TenurePatterns.Should().BeEmpty();
    }

    [Test]
    public async Task GetFeatureUsageAnalyticsAsync_FiltersByDateRange_ReturnsOnlyRecentData()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "member@example.com");

        // Create old and recent usage events
        await CreateFeatureUsageEvent(club.Id, member.Id, "old_feature", "web", DateTime.UtcNow.AddDays(-40));
        await CreateFeatureUsageEvent(club.Id, member.Id, "recent_feature", "web", DateTime.UtcNow.AddDays(-5));

        // Act
        var result = await _service.GetFeatureUsageAnalyticsAsync(club.Id, 30);

        // Assert
        result.FeatureUsage.Should().HaveCount(1);
        result.FeatureUsage.First().FeatureName.Should().Be("recent_feature");
    }

    #endregion

    #region GetMemberEngagementAnalyticsAsync Tests

    [Test]
    public async Task GetMemberEngagementAnalyticsAsync_CalculatesAndReturnsEngagement_ReturnsAnalytics()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "member1@example.com");
        var member2 = await CreateTestMember(club.Id, "member2@example.com");

        // Create test data for engagement calculation
        await CreateTestLoginTracking(member1.Id, DateTime.UtcNow.AddDays(-1));
        await CreateTestLoginTracking(member1.Id, DateTime.UtcNow.AddDays(-3));
        await CreateTestLoginTracking(member2.Id, DateTime.UtcNow.AddDays(-10));

        await CreateFeatureUsageEvent(club.Id, member1.Id, "directory_search", "web", DateTime.UtcNow.AddDays(-2));
        await CreateFeatureUsageEvent(club.Id, member1.Id, "event_rsvp", "web", DateTime.UtcNow.AddDays(-1));

        // Act
        var result = await _service.GetMemberEngagementAnalyticsAsync(club.Id);

        // Assert
        result.Should().NotBeNull();
        result.ClubSummary.Should().NotBeNull();
        result.ClubSummary.TotalMembers.Should().Be(2);
        result.ClubSummary.AverageEngagementScore.Should().BeGreaterThan(0);

        result.MemberEngagement.Should().HaveCount(2);
        result.Distribution.Should().NotBeNull();
        result.Trends.Should().NotBeNull();
    }

    [Test]
    public async Task GetMemberEngagementAnalyticsAsync_EmptyClub_ReturnsEmptyAnalytics()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _service.GetMemberEngagementAnalyticsAsync(club.Id);

        // Assert
        result.Should().NotBeNull();
        result.ClubSummary.TotalMembers.Should().Be(0);
        result.ClubSummary.AverageEngagementScore.Should().Be(0);
        result.MemberEngagement.Should().BeEmpty();
        result.Distribution.HighlyActive.Should().Be(0);
        result.Distribution.Active.Should().Be(0);
        result.Distribution.Moderate.Should().Be(0);
        result.Distribution.LowEngagement.Should().Be(0);
        result.Distribution.Inactive.Should().Be(0);
    }

    #endregion

    #region CalculateMemberEngagementScoresAsync Tests

    [Test]
    public async Task CalculateMemberEngagementScoresAsync_ValidClub_CalculatesScores()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "member1@example.com");
        var member2 = await CreateTestMember(club.Id, "member2@example.com");

        // Create test data for scoring
        await CreateTestLoginTracking(member1.Id, DateTime.UtcNow.AddDays(-1));
        await CreateTestLoginTracking(member1.Id, DateTime.UtcNow.AddDays(-3));
        await CreateFeatureUsageEvent(club.Id, member1.Id, "directory_search", "web", DateTime.UtcNow.AddDays(-2));

        // Act
        var result = await _service.CalculateMemberEngagementScoresAsync(club.Id);

        // Assert
        result.Should().BeTrue();

        var scores = await _context.MemberEngagementScores
            .Where(s => s.ClubId == club.Id)
            .ToListAsync();

        scores.Should().HaveCount(2);

        var member1Score = scores.First(s => s.MemberId == member1.Id);
        member1Score.OverallScore.Should().BeGreaterThan(0);
        member1Score.LoginScore.Should().BeGreaterThan(0);
        member1Score.FeatureUsageScore.Should().BeGreaterThan(0);
        member1Score.ActivityLevel.Should().NotBeNullOrEmpty();
    }

    [Test]
    public async Task CalculateMemberEngagementScoresAsync_UpdatesExistingScores_ReturnsTrue()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "member@example.com");

        // Create initial activity to justify a base score
        await CreateTestLoginTracking(member.Id, DateTime.UtcNow.AddDays(-7));
        await CreateTestLoginTracking(member.Id, DateTime.UtcNow.AddDays(-6));
        await CreateTestEventAttendance(club.Id, member.Id, DateTime.UtcNow.AddDays(-5));
        await CreateFeatureUsageEvent(club.Id, member.Id, "directory_search", "web", DateTime.UtcNow.AddDays(-4));
        await CreateTestChatMessage(member.Id, DateTime.UtcNow.AddDays(-3));

        // Calculate initial scores to get a baseline
        await _service.CalculateMemberEngagementScoresAsync(club.Id);
        var initialScore = await _context.MemberEngagementScores
            .FirstAsync(s => s.MemberId == member.Id);
        var initialOverallScore = initialScore.OverallScore;

        // Add delay to ensure timestamp difference
        await Task.Delay(100);

        // Add new login activity - should increase the score
        await CreateTestLoginTracking(member.Id, DateTime.UtcNow);
        await CreateTestLoginTracking(member.Id, DateTime.UtcNow.AddMinutes(-30));

        // Act
        var result = await _service.CalculateMemberEngagementScoresAsync(club.Id);

        // Assert
        result.Should().BeTrue();

        var updatedScore = await _context.MemberEngagementScores
            .FirstAsync(s => s.MemberId == member.Id);

        updatedScore.UpdatedAt.Should().BeOnOrAfter(initialScore.UpdatedAt);
        updatedScore.OverallScore.Should().BeGreaterThan(initialOverallScore); // Should increase with new login activity
    }

    [Test]
    public async Task CalculateMemberEngagementScoresAsync_EmptyClub_ReturnsTrue()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _service.CalculateMemberEngagementScoresAsync(club.Id);

        // Assert
        result.Should().BeTrue();

        var scores = await _context.MemberEngagementScores
            .Where(s => s.ClubId == club.Id)
            .CountAsync();

        scores.Should().Be(0);
    }

    #endregion

    #region GetLowEngagementMembersAsync Tests

    [Test]
    public async Task GetLowEngagementMembersAsync_WithLowEngagementMembers_ReturnsFilteredList()
    {
        // Arrange
        var club = await CreateTestClub();
        var lowMember = await CreateTestMember(club.Id, "low@example.com");
        var highMember = await CreateTestMember(club.Id, "high@example.com");

        // Create engagement scores
        var lowScore = new MemberEngagementScore
        {
            MemberId = lowMember.Id,
            ClubId = club.Id,
            OverallScore = 25m,
            EngagementLevel = "Inactive",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var highScore = new MemberEngagementScore
        {
            MemberId = highMember.Id,
            ClubId = club.Id,
            OverallScore = 85m,
            EngagementLevel = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MemberEngagementScores.AddRange(lowScore, highScore);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetLowEngagementMembersAsync(club.Id, 40);

        // Assert
        result.Should().HaveCount(1);
        result.First().MemberId.Should().Be(lowMember.Id);
        result.First().OverallScore.Should().Be(25m);
    }

    [Test]
    public async Task GetLowEngagementMembersAsync_NoLowEngagementMembers_ReturnsEmptyList()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "member@example.com");

        var score = new MemberEngagementScore
        {
            MemberId = member.Id,
            ClubId = club.Id,
            OverallScore = 75m,
            EngagementLevel = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MemberEngagementScores.Add(score);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetLowEngagementMembersAsync(club.Id, 40);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region GetTopFeaturesAsync Tests

    [Test]
    public async Task GetTopFeaturesAsync_WithFeatureUsage_ReturnsTopFeatures()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "member1@example.com");
        var member2 = await CreateTestMember(club.Id, "member2@example.com");

        // Create usage events with different frequencies
        await CreateFeatureUsageEvent(club.Id, member1.Id, "popular_feature", "web", DateTime.UtcNow.AddDays(-1));
        await CreateFeatureUsageEvent(club.Id, member2.Id, "popular_feature", "web", DateTime.UtcNow.AddDays(-1));
        await CreateFeatureUsageEvent(club.Id, member1.Id, "popular_feature", "mobile", DateTime.UtcNow.AddDays(-2));

        await CreateFeatureUsageEvent(club.Id, member1.Id, "less_popular", "web", DateTime.UtcNow.AddDays(-1));

        // Act
        var result = await _service.GetTopFeaturesAsync(club.Id, 5);

        // Assert
        result.Should().HaveCount(2);
        result.First().FeatureName.Should().Be("popular_feature");
        result.First().UsageCount.Should().Be(3);
        result.First().UniqueUsers.Should().Be(2);

        result.Last().FeatureName.Should().Be("less_popular");
        result.Last().UsageCount.Should().Be(1);
    }

    [Test]
    public async Task GetTopFeaturesAsync_RespectsLimit_ReturnsLimitedResults()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "member@example.com");

        // Create many different features
        for (int i = 1; i <= 15; i++)
        {
            await CreateFeatureUsageEvent(club.Id, member.Id, $"feature_{i}", "web", DateTime.UtcNow.AddDays(-1));
        }

        // Act
        var result = await _service.GetTopFeaturesAsync(club.Id, 10);

        // Assert
        result.Should().HaveCount(10);
    }

    #endregion

    #region GetPlatformUsageComparisonAsync Tests

    [Test]
    public async Task GetPlatformUsageComparisonAsync_WithBothPlatforms_ReturnsComparison()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "member1@example.com");
        var member2 = await CreateTestMember(club.Id, "member2@example.com");

        // Create web usage
        await CreateFeatureUsageEvent(club.Id, member1.Id, "feature1", "web", DateTime.UtcNow.AddDays(-1));
        await CreateFeatureUsageEvent(club.Id, member2.Id, "feature2", "web", DateTime.UtcNow.AddDays(-1));
        await CreateFeatureUsageEvent(club.Id, member1.Id, "feature3", "web", DateTime.UtcNow.AddDays(-2));

        // Create mobile usage
        await CreateFeatureUsageEvent(club.Id, member1.Id, "feature1", "mobile", DateTime.UtcNow.AddDays(-1));

        // Act
        var result = await _service.GetPlatformUsageComparisonAsync(club.Id, 30);

        // Assert
        result.Should().NotBeNull();
        result.Web.UsageCount.Should().Be(3);
        result.Web.UniqueUsers.Should().Be(2);
        result.Mobile.UsageCount.Should().Be(1);
        result.Mobile.UniqueUsers.Should().Be(1);
        result.WebToMobileRatio.Should().Be(3.0);
    }

    [Test]
    public async Task GetPlatformUsageComparisonAsync_OnlyWebUsage_ReturnsCorrectRatio()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "member@example.com");

        await CreateFeatureUsageEvent(club.Id, member.Id, "feature1", "web", DateTime.UtcNow.AddDays(-1));

        // Act
        var result = await _service.GetPlatformUsageComparisonAsync(club.Id, 30);

        // Assert
        result.Web.UsageCount.Should().Be(1);
        result.Mobile.UsageCount.Should().Be(0);
        result.WebToMobileRatio.Should().Be(0); // Special case when mobile is 0
    }

    #endregion

    #region Private Score Calculation Tests

    [Test]
    public async Task EngagementScoreCalculation_WeightsAppliedCorrectly_ReturnsWeightedScore()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "member@example.com");

        // Create data for all components
        await CreateTestLoginTracking(member.Id, DateTime.UtcNow.AddDays(-1));
        await CreateTestEventAttendance(club.Id, member.Id, DateTime.UtcNow.AddDays(-2));
        await CreateFeatureUsageEvent(club.Id, member.Id, "directory_search", "web", DateTime.UtcNow.AddDays(-1));
        await CreateTestChatMessage(member.Id, DateTime.UtcNow.AddDays(-1));

        // Act
        var result = await _service.CalculateMemberEngagementScoresAsync(club.Id);

        // Assert
        result.Should().BeTrue();

        var score = await _context.MemberEngagementScores
            .FirstAsync(s => s.MemberId == member.Id);

        // Verify individual component scores exist and are reasonable
        score.LoginScore.Should().BeGreaterThan(0);
        score.EventScore.Should().BeGreaterThan(0);
        score.CommunicationScore.Should().BeGreaterThan(0);
        score.FeatureUsageScore.Should().BeGreaterThan(0);
        score.ProfileCompletenessScore.Should().BeGreaterThan(0);

        // Overall score should be weighted combination
        score.OverallScore.Should().BeGreaterThan(0);
        score.OverallScore.Should().BeLessThanOrEqualTo(100);
    }

    #endregion

    #region Error Handling Tests

    [Test]
    public async Task GetFeatureUsageAnalyticsAsync_DatabaseError_ThrowsException()
    {
        // Arrange
        _context.Dispose();
        var service = new FeatureUsageAnalyticsService(_context, _mockLogger.Object);

        // Act & Assert
        try
        {
            var result = await service.GetFeatureUsageAnalyticsAsync(1, 30);
            Assert.Fail($"Expected ObjectDisposedException but method completed successfully with result: {result}");
        }
        catch (ObjectDisposedException ex)
        {
            Assert.That(ex.Message, Contains.Substring("disposed"));
        }
    }

    [Test]
    public async Task GetMemberEngagementAnalyticsAsync_DatabaseError_ThrowsException()
    {
        // Arrange
        _context.Dispose();
        var service = new FeatureUsageAnalyticsService(_context, _mockLogger.Object);

        // Act & Assert
        try
        {
            var result = await service.GetMemberEngagementAnalyticsAsync(1);
            Assert.Fail($"Expected ObjectDisposedException but method completed successfully with result: {result}");
        }
        catch (ObjectDisposedException ex)
        {
            Assert.That(ex.Message, Contains.Substring("disposed"));
        }
    }

    [Test]
    public async Task CalculateMemberEngagementScoresAsync_DatabaseError_ReturnsFalse()
    {
        // Arrange
        var club = await CreateTestClub();
        _context.Dispose();
        var service = new FeatureUsageAnalyticsService(_context, _mockLogger.Object);

        // Act
        var result = await service.CalculateMemberEngagementScoresAsync(club.Id);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Helper Methods

    private async Task<Club> CreateTestClub(string name = "Test Club")
    {
        var club = new Club
        {
            Name = name,
            Tier = "Unlimited",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    private async Task<Member> CreateTestMember(int clubId, string email, DateTime? joinDate = null)
    {
        var membershipType = new MembershipType
        {
            ClubId = clubId,
            Name = "Individual",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            ClubId = clubId,
            MembershipTypeId = membershipType.Id,
            FullName = $"Test Member {email.Split('@')[0]}",
            Email = email,
            PhoneNumber = "555-1234", // For profile completeness
            Status = "Active",
            JoinDate = joinDate ?? DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();
        return member;
    }

    private async Task<FeatureUsageEvent> CreateFeatureUsageEvent(int clubId, int memberId, string featureName, string platform, DateTime usedAt, string? sessionId = null)
    {
        var featureEvent = new FeatureUsageEvent
        {
            ClubId = clubId,
            MemberId = memberId,
            FeatureName = featureName,
            Platform = platform,
            SessionId = sessionId ?? Guid.NewGuid().ToString(),
            UsedAt = usedAt,
            MemberTenureDays = (DateTime.UtcNow - DateTime.UtcNow.AddDays(-30)).Days,
            MemberTenure = (DateTime.UtcNow - DateTime.UtcNow.AddDays(-30)).Days,
            EngagementWeight = 1.0m
        };

        _context.FeatureUsageEvents.Add(featureEvent);
        await _context.SaveChangesAsync();
        return featureEvent;
    }

    private async Task<MemberLoginTracking> CreateTestLoginTracking(int memberId, DateTime loginTime)
    {
        var loginTracking = new MemberLoginTracking
        {
            MemberId = memberId,
            LoginTimestamp = loginTime,
            IpAddress = "192.168.1.1",
            UserAgent = "Test Browser",
            CreatedAt = loginTime
        };

        _context.MemberLoginTrackings.Add(loginTracking);
        await _context.SaveChangesAsync();
        return loginTracking;
    }

    private async Task<Event> CreateTestEventAttendance(int clubId, int memberId, DateTime eventDate)
    {
        var clubEvent = new Event
        {
            ClubId = clubId,
            Name = "Test Event",
            Description = "Test event description",
            EventDateTime = eventDate,
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(clubEvent);
        await _context.SaveChangesAsync();

        var rsvp = new EventRsvp
        {
            EventId = clubEvent.Id,
            MemberId = memberId,
            RsvpStatus = "Attending",
            CreatedAt = eventDate.AddDays(-5)
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        return clubEvent;
    }

    private async Task<ClubChatMessage> CreateTestChatMessage(int memberId, DateTime sentAt)
    {
        var chatMessage = new ClubChatMessage
        {
            SenderUserId = memberId,
            MessageContent = "Test message",
            SentAt = sentAt
        };

        _context.ClubChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();
        return chatMessage;
    }

    private async Task<MemberActivitySession> CreateTestActivitySession(int memberId, DateTime startTime, DateTime? endTime = null)
    {
        var session = new MemberActivitySession
        {
            MemberId = memberId,
            StartTime = startTime,
            EndTime = endTime ?? startTime.AddMinutes(30),
            CreatedAt = startTime
        };

        _context.MemberActivitySessions.Add(session);
        await _context.SaveChangesAsync();
        return session;
    }

    #endregion
}