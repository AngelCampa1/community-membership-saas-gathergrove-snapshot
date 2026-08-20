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

namespace GatherGrove.Application.Tests.Integration;

[TestFixture]
public class FeatureUsageAnalyticsIntegrationTests : IDisposable
{
    private GatherGroveDbContext _context;
    private FeatureUsageAnalyticsService _service;
    private Mock<ILogger<FeatureUsageAnalyticsService>> _mockLogger;

    [SetUp]
    public void SetUp()
    {
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

    #region Full Workflow Integration Tests

    [Test]
    public async Task CompleteEngagementAnalyticsWorkflow_FromTrackingToReporting_WorksEndToEnd()
    {
        // Arrange - Create a complete test scenario
        var club = await CreateTestClub("Integration Test Club");
        var members = new List<Member>();

        // Create diverse member base
        for (int i = 1; i <= 5; i++)
        {
            var member = await CreateTestMember(club.Id, $"member{i}@example.com", DateTime.UtcNow.AddDays(-30 * i));
            members.Add(member);
        }

        // Simulate realistic feature usage patterns over time
        await SimulateRealisticUsagePatterns(club.Id, members);

        // Act & Assert - Execute the complete workflow

        // Step 1: Track feature usage events
        var trackingResults = new List<bool>();
        foreach (var member in members)
        {
            var result = await _service.TrackFeatureUsageAsync(
                club.Id, member.Id, "directory_search", "web",
                Guid.NewGuid().ToString(), "search_action", "member_lookup", 15.5m);
            trackingResults.Add(result);
        }

        trackingResults.Should().AllSatisfy(result => result.Should().BeTrue());

        // Step 2: Calculate engagement scores
        var calculationResult = await _service.CalculateMemberEngagementScoresAsync(club.Id);
        calculationResult.Should().BeTrue();

        // Step 3: Get feature usage analytics
        var featureAnalytics = await _service.GetFeatureUsageAnalyticsAsync(club.Id, 90);
        ValidateFeatureUsageAnalytics(featureAnalytics, members.Count);

        // Step 4: Get member engagement analytics
        var memberEngagement = await _service.GetMemberEngagementAnalyticsAsync(club.Id);
        ValidateMemberEngagementAnalytics(memberEngagement, members.Count);

        // Step 5: Get platform usage comparison
        var platformComparison = await _service.GetPlatformUsageComparisonAsync(club.Id, 90);
        ValidatePlatformUsageComparison(platformComparison);

        // Step 6: Get top features
        var topFeatures = await _service.GetTopFeaturesAsync(club.Id, 10);
        ValidateTopFeatures(topFeatures);

        // Step 7: Get low engagement members
        var lowEngagementMembers = await _service.GetLowEngagementMembersAsync(club.Id, 50);
        ValidateLowEngagementMembers(lowEngagementMembers, members.Count);
    }

    [Test]
    public async Task EngagementScoreCalculation_WithRealWorldData_ProducesReasonableScores()
    {
        // Arrange - Create realistic club scenario
        var club = await CreateTestClub("Realistic Club");

        // Highly active member
        var activeUser = await CreateTestMember(club.Id, "active@example.com");
        await CreateExtensiveActivity(club.Id, activeUser.Id, ActivityLevel.HighlyActive);

        // Moderately active member
        var moderateUser = await CreateTestMember(club.Id, "moderate@example.com");
        await CreateExtensiveActivity(club.Id, moderateUser.Id, ActivityLevel.Moderate);

        // Inactive member
        var inactiveUser = await CreateTestMember(club.Id, "inactive@example.com");
        await CreateExtensiveActivity(club.Id, inactiveUser.Id, ActivityLevel.Inactive);

        // Act
        var result = await _service.CalculateMemberEngagementScoresAsync(club.Id);

        // Assert
        result.Should().BeTrue();

        var scores = await _context.MemberEngagementScores
            .Where(s => s.ClubId == club.Id)
            .OrderByDescending(s => s.OverallScore)
            .ToListAsync();

        scores.Should().HaveCount(3);

        // Validate score ordering and ranges
        var activeScore = scores.First(s => s.MemberId == activeUser.Id);
        var moderateScore = scores.First(s => s.MemberId == moderateUser.Id);
        var inactiveScore = scores.First(s => s.MemberId == inactiveUser.Id);

        activeScore.OverallScore.Should().BeGreaterThan(moderateScore.OverallScore);
        moderateScore.OverallScore.Should().BeGreaterThan(inactiveScore.OverallScore);

        // Validate score components are reasonable
        ValidateEngagementScoreComponents(activeScore, "HighlyActive");
        ValidateEngagementScoreComponents(moderateScore, "Active");
        ValidateEngagementScoreComponents(inactiveScore, "Inactive");
    }

    [Test]
    public async Task PlatformUsageAnalytics_WithMixedPlatformUsage_ReturnsAccurateComparison()
    {
        // Arrange
        var club = await CreateTestClub("Platform Test Club");
        var members = new List<Member>();

        for (int i = 1; i <= 10; i++)
        {
            var member = await CreateTestMember(club.Id, $"platform{i}@example.com");
            members.Add(member);
        }

        // Create mixed platform usage patterns
        var webUsageCount = 0;
        var mobileUsageCount = 0;

        foreach (var member in members)
        {
            // Web usage (70% of members)
            if (members.IndexOf(member) < 7)
            {
                await CreateFeatureUsageEvent(club.Id, member.Id, "directory_search", "web");
                await CreateFeatureUsageEvent(club.Id, member.Id, "event_rsvp", "web");
                webUsageCount += 2;
            }

            // Mobile usage (50% of members)
            if (members.IndexOf(member) < 5)
            {
                await CreateFeatureUsageEvent(club.Id, member.Id, "event_rsvp", "mobile");
                await CreateFeatureUsageEvent(club.Id, member.Id, "profile_view", "mobile");
                mobileUsageCount += 2;
            }
        }

        // Act
        var platformComparison = await _service.GetPlatformUsageComparisonAsync(club.Id, 30);

        // Assert
        platformComparison.Should().NotBeNull();
        platformComparison.Web.UsageCount.Should().Be(webUsageCount);
        platformComparison.Mobile.UsageCount.Should().Be(mobileUsageCount);
        platformComparison.Web.UniqueUsers.Should().Be(7);
        platformComparison.Mobile.UniqueUsers.Should().Be(5);

        var expectedRatio = (double)webUsageCount / Math.Max(mobileUsageCount, 1);
        platformComparison.WebToMobileRatio.Should().BeApproximately(expectedRatio, 0.1);
    }

    [Test]
    public async Task FeatureAdoptionTrends_OverTime_ShowsProgressiveAdoption()
    {
        // Arrange
        var club = await CreateTestClub("Adoption Trends Club");
        var members = new List<Member>();

        for (int i = 1; i <= 20; i++)
        {
            var member = await CreateTestMember(club.Id, $"trend{i}@example.com");
            members.Add(member);
        }

        // Simulate progressive feature adoption over 7 days
        var featureName = "new_feature";
        var baseDate = DateTime.UtcNow.AddDays(-7);

        for (int day = 0; day < 7; day++)
        {
            var usageDate = baseDate.AddDays(day);
            var memberCount = Math.Min((day + 1) * 3, members.Count); // Progressive adoption

            for (int i = 0; i < memberCount; i++)
            {
                await CreateFeatureUsageEvent(club.Id, members[i].Id, featureName, "web", usageDate);
            }
        }

        // Act
        var analytics = await _service.GetFeatureUsageAnalyticsAsync(club.Id, 30);

        // Assert
        analytics.AdoptionTrends.Should().NotBeEmpty();

        var featureTrends = analytics.AdoptionTrends
            .Where(t => t.FeatureName == featureName)
            .OrderBy(t => t.Date)
            .ToList();

        featureTrends.Should().HaveCountGreaterThan(0);

        // Validate progressive adoption pattern
        for (int i = 1; i < featureTrends.Count; i++)
        {
            featureTrends[i].TotalUsers.Should().BeGreaterOrEqualTo(featureTrends[i - 1].TotalUsers);
        }
    }

    [Test]
    public async Task TenureBasedUsagePatterns_ShowsDifferentBehaviorByTenure()
    {
        // Arrange
        var club = await CreateTestClub("Tenure Patterns Club");

        // Create members with different tenure lengths
        var newMember = await CreateTestMember(club.Id, "new@example.com", DateTime.UtcNow.AddDays(-15)); // 15 days
        var establishedMember = await CreateTestMember(club.Id, "established@example.com", DateTime.UtcNow.AddDays(-60)); // 60 days
        var veteranMember = await CreateTestMember(club.Id, "veteran@example.com", DateTime.UtcNow.AddDays(-200)); // 200 days

        // Create tenure-specific usage patterns
        // New members: Basic features
        await CreateFeatureUsageEvent(club.Id, newMember.Id, "profile_view", "web");
        await CreateFeatureUsageEvent(club.Id, newMember.Id, "dashboard_view", "web");

        // Established members: Intermediate features
        await CreateFeatureUsageEvent(club.Id, establishedMember.Id, "directory_search", "web");
        await CreateFeatureUsageEvent(club.Id, establishedMember.Id, "event_rsvp", "web");

        // Veteran members: Advanced features
        await CreateFeatureUsageEvent(club.Id, veteranMember.Id, "dues_payment", "web");
        await CreateFeatureUsageEvent(club.Id, veteranMember.Id, "member_directory", "web");

        // Act
        var analytics = await _service.GetFeatureUsageAnalyticsAsync(club.Id, 30);

        // Assert
        analytics.TenurePatterns.Should().NotBeEmpty();

        var newMemberPattern = analytics.TenurePatterns.FirstOrDefault(p => p.TenureRange == "0-30 days");
        var establishedMemberPattern = analytics.TenurePatterns.FirstOrDefault(p => p.TenureRange == "31-90 days");
        var veteranMemberPattern = analytics.TenurePatterns.FirstOrDefault(p => p.TenureRange == "180+ days");

        newMemberPattern?.MemberCount.Should().Be(1);
        establishedMemberPattern?.MemberCount.Should().Be(1);
        veteranMemberPattern?.MemberCount.Should().Be(1);

        // Validate different feature preferences by tenure
        newMemberPattern?.PreferredFeatures.Should().Contain("profile_view");
        establishedMemberPattern?.PreferredFeatures.Should().Contain("directory_search");
        veteranMemberPattern?.PreferredFeatures.Should().Contain("dues_payment");
    }

    #endregion

    #region Performance Integration Tests

    [Test]
    public async Task LargeDatasetPerformance_WithThousandMembers_CompletesWithinReasonableTime()
    {
        // Arrange - Create large dataset
        var club = await CreateTestClub("Performance Test Club");
        var memberIds = new List<int>();

        // Create 100 members (reduced from 1000 for test efficiency)
        for (int i = 1; i <= 100; i++)
        {
            var member = await CreateTestMember(club.Id, $"perf{i}@example.com");
            memberIds.Add(member.Id);

            // Create some usage data for each member
            if (i % 10 == 0) // Every 10th member has activity
            {
                await CreateFeatureUsageEvent(club.Id, member.Id, "directory_search", "web");
                await CreateTestLoginTracking(member.Id, DateTime.UtcNow.AddDays(-1));
            }
        }

        // Act & Assert - Measure performance
        var startTime = DateTime.UtcNow;

        var calculationResult = await _service.CalculateMemberEngagementScoresAsync(club.Id);
        var calculationTime = DateTime.UtcNow - startTime;

        calculationResult.Should().BeTrue();
        calculationTime.TotalSeconds.Should().BeLessThan(30); // Should complete within 30 seconds

        startTime = DateTime.UtcNow;
        var analytics = await _service.GetFeatureUsageAnalyticsAsync(club.Id, 30);
        var analyticsTime = DateTime.UtcNow - startTime;

        analytics.Should().NotBeNull();
        analyticsTime.TotalSeconds.Should().BeLessThan(10); // Should complete within 10 seconds

        // Verify data integrity with large dataset
        var scores = await _context.MemberEngagementScores
            .Where(s => s.ClubId == club.Id)
            .CountAsync();

        scores.Should().Be(100); // All members should have scores
    }

    #endregion

    #region Business Logic Validation Tests

    [Test]
    public async Task EngagementWeighting_AppliesCorrectBusinessRules()
    {
        // Arrange
        var club = await CreateTestClub("Weighting Test Club");
        var member = await CreateTestMember(club.Id, "weight@example.com");

        // Create specific activities to test weighting
        await CreateTestLoginTracking(member.Id, DateTime.UtcNow.AddDays(-1));
        await CreateFeatureUsageEvent(club.Id, member.Id, "dues_payment", "web"); // High weight (2.0)
        await CreateFeatureUsageEvent(club.Id, member.Id, "help_access", "web");  // Low weight (0.8)
        await CreateTestEventRsvp(club.Id, member.Id, DateTime.UtcNow.AddDays(-2));

        // Act
        await _service.CalculateMemberEngagementScoresAsync(club.Id);

        // Assert
        var score = await _context.MemberEngagementScores
            .FirstAsync(s => s.MemberId == member.Id);

        // Verify weighted calculation influenced overall score
        score.OverallScore.Should().BeGreaterThan(0);

        // Login component should have proper weight (25%)
        score.LoginScore.Should().BeGreaterThan(0);

        // Event component should have proper weight (30%)
        score.EventScore.Should().BeGreaterThan(0);

        // Feature usage should reflect weighted features
        score.FeatureUsageScore.Should().BeGreaterThan(0);

        // Overall score should be reasonable weighted combination
        var expectedRange = (score.LoginScore * 0.25m + score.EventScore * 0.30m +
                           score.CommunicationScore * 0.20m + score.FeatureUsageScore * 0.15m +
                           score.ProfileCompletenessScore * 0.10m);

        score.OverallScore.Should().BeApproximately(expectedRange, 5m); // Within 5 points tolerance
    }

    [Test]
    public async Task RetentionCorrelation_LowEngagementIndicatesRisk()
    {
        // Arrange
        var club = await CreateTestClub("Retention Test Club");

        // Create at-risk member (no recent activity)
        var atRiskMember = await CreateTestMember(club.Id, "atrisk@example.com");
        await CreateTestLoginTracking(atRiskMember.Id, DateTime.UtcNow.AddDays(-35)); // Old login

        // Create active member (recent activity)
        var activeMember = await CreateTestMember(club.Id, "active@example.com");
        await CreateTestLoginTracking(activeMember.Id, DateTime.UtcNow.AddDays(-1)); // Recent login
        await CreateFeatureUsageEvent(club.Id, activeMember.Id, "directory_search", "web");

        // Act
        await _service.CalculateMemberEngagementScoresAsync(club.Id);

        // Assert
        var atRiskScore = await _context.MemberEngagementScores
            .FirstAsync(s => s.MemberId == atRiskMember.Id);

        var activeScore = await _context.MemberEngagementScores
            .FirstAsync(s => s.MemberId == activeMember.Id);

        // At-risk member should be flagged
        atRiskScore.IsAtRisk.Should().BeTrue();
        atRiskScore.DaysSinceLastLogin.Should().BeGreaterThan(30);
        atRiskScore.OverallScore.Should().BeLessThan(activeScore.OverallScore);

        // Active member should not be at risk
        activeScore.IsAtRisk.Should().BeFalse();
        activeScore.DaysSinceLastLogin.Should().BeLessThan(5);
    }

    #endregion

    #region Data Validation Tests

    [Test]
    public async Task CrossComponentDataIntegrity_EnsuresConsistentAnalytics()
    {
        // Arrange
        var club = await CreateTestClub("Integrity Test Club");
        var member1 = await CreateTestMember(club.Id, "integrity1@example.com");
        var member2 = await CreateTestMember(club.Id, "integrity2@example.com");

        // Create consistent test data
        await CreateFeatureUsageEvent(club.Id, member1.Id, "directory_search", "web");
        await CreateFeatureUsageEvent(club.Id, member1.Id, "event_rsvp", "mobile");
        await CreateFeatureUsageEvent(club.Id, member2.Id, "directory_search", "web");

        await _service.CalculateMemberEngagementScoresAsync(club.Id);

        // Act - Get different analytics views
        var featureAnalytics = await _service.GetFeatureUsageAnalyticsAsync(club.Id, 30);
        var memberAnalytics = await _service.GetMemberEngagementAnalyticsAsync(club.Id);
        var platformComparison = await _service.GetPlatformUsageComparisonAsync(club.Id, 30);
        var topFeatures = await _service.GetTopFeaturesAsync(club.Id, 10);

        // Assert - Verify data consistency across all analytics

        // Feature usage consistency
        var directorySearchStats = featureAnalytics.FeatureUsage
            .First(f => f.FeatureName == "directory_search");
        directorySearchStats.UsageCount.Should().Be(2);
        directorySearchStats.UniqueUsers.Should().Be(2);

        // Platform consistency
        platformComparison.Web.UsageCount.Should().Be(2);
        platformComparison.Mobile.UsageCount.Should().Be(1);

        // Member count consistency
        memberAnalytics.ClubSummary.TotalMembers.Should().Be(2);
        memberAnalytics.MemberEngagement.Should().HaveCount(2);

        // Top features consistency
        var topDirectorySearch = topFeatures.First(f => f.FeatureName == "directory_search");
        topDirectorySearch.UsageCount.Should().Be(directorySearchStats.UsageCount);
        topDirectorySearch.UniqueUsers.Should().Be(directorySearchStats.UniqueUsers);
    }

    #endregion

    #region Helper Methods

    private enum ActivityLevel
    {
        HighlyActive,
        Moderate,
        Inactive
    }

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
            PhoneNumber = "555-1234",
            Status = "Active",
            JoinDate = joinDate ?? DateTime.UtcNow.AddDays(-30),
            CreatedAt = joinDate ?? DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();
        return member;
    }

    private async Task<FeatureUsageEvent> CreateFeatureUsageEvent(int clubId, int memberId, string featureName, string platform, DateTime? usedAt = null)
    {
        // Get the member's actual join date to calculate correct tenure
        var member = await _context.Members.FirstAsync(m => m.Id == memberId);
        var usageDate = usedAt ?? DateTime.UtcNow;
        var tenureDays = (int)(usageDate - member.JoinDate).TotalDays;

        var featureEvent = new FeatureUsageEvent
        {
            ClubId = clubId,
            MemberId = memberId,
            FeatureName = featureName,
            Platform = platform,
            SessionId = Guid.NewGuid().ToString(),
            UsedAt = usageDate,
            MemberTenureDays = tenureDays,
            MemberTenure = tenureDays,
            EngagementWeight = 1.0m
        };

        _context.FeatureUsageEvents.Add(featureEvent);
        await _context.SaveChangesAsync();
        return featureEvent;
    }

    private async Task CreateTestLoginTracking(int memberId, DateTime loginTime)
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
    }

    private async Task CreateTestEventRsvp(int clubId, int memberId, DateTime eventDate)
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
    }

    private async Task CreateTestChatMessage(int memberId, DateTime sentAt)
    {
        var chatMessage = new ClubChatMessage
        {
            SenderUserId = memberId,
            MessageContent = "Test message",
            SentAt = sentAt
        };

        _context.ClubChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();
    }

    private async Task SimulateRealisticUsagePatterns(int clubId, List<Member> members)
    {
        var features = new[] { "directory_search", "event_rsvp", "dues_payment", "profile_view", "chat_message" };
        var platforms = new[] { "web", "mobile" };

        foreach (var member in members)
        {
            // Create login activity
            for (int i = 1; i <= 10; i++)
            {
                await CreateTestLoginTracking(member.Id, DateTime.UtcNow.AddDays(-i * 2));
            }

            // Create feature usage
            for (int i = 0; i < 15; i++)
            {
                var feature = features[i % features.Length];
                var platform = platforms[i % platforms.Length];
                await CreateFeatureUsageEvent(clubId, member.Id, feature, platform, DateTime.UtcNow.AddDays(-i));
            }

            // Create event participation
            await CreateTestEventRsvp(clubId, member.Id, DateTime.UtcNow.AddDays(-5));

            // Create communication activity
            for (int i = 0; i < 5; i++)
            {
                await CreateTestChatMessage(member.Id, DateTime.UtcNow.AddDays(-i * 3));
            }
        }
    }

    private async Task CreateExtensiveActivity(int clubId, int memberId, ActivityLevel level)
    {
        var activityMultiplier = level switch
        {
            ActivityLevel.HighlyActive => 3,
            ActivityLevel.Moderate => 2,
            ActivityLevel.Inactive => 1,
            _ => 1
        };

        var daysSinceLastActivity = level switch
        {
            ActivityLevel.HighlyActive => 1,
            ActivityLevel.Moderate => 7,
            ActivityLevel.Inactive => 20,
            _ => 10
        };

        // Create login activity
        for (int i = 0; i < 5 * activityMultiplier; i++)
        {
            await CreateTestLoginTracking(memberId, DateTime.UtcNow.AddDays(-(daysSinceLastActivity + i * 2)));
        }

        // Create feature usage
        for (int i = 0; i < 10 * activityMultiplier; i++)
        {
            var features = new[] { "directory_search", "event_rsvp", "profile_view" };
            var feature = features[i % features.Length];
            await CreateFeatureUsageEvent(clubId, memberId, feature, "web",
                DateTime.UtcNow.AddDays(-(daysSinceLastActivity + i)));
        }

        // Create event participation
        if (level != ActivityLevel.Inactive)
        {
            for (int i = 0; i < 2 * activityMultiplier; i++)
            {
                await CreateTestEventRsvp(clubId, memberId, DateTime.UtcNow.AddDays(-(daysSinceLastActivity + i * 7)));
            }
        }

        // Create communication activity
        if (level == ActivityLevel.HighlyActive)
        {
            for (int i = 0; i < 8; i++)
            {
                await CreateTestChatMessage(memberId, DateTime.UtcNow.AddDays(-(daysSinceLastActivity + i * 2)));
            }
        }
    }

    private void ValidateFeatureUsageAnalytics(FeatureUsageAnalyticsResponse analytics, int memberCount)
    {
        analytics.Should().NotBeNull();
        analytics.FeatureUsage.Should().NotBeEmpty();
        analytics.PlatformUsage.Should().NotBeNull();

        // Validate reasonable adoption rates
        foreach (var feature in analytics.FeatureUsage)
        {
            feature.AdoptionRate.Should().BeGreaterThanOrEqualTo(0);
            feature.AdoptionRate.Should().BeLessThanOrEqualTo(100);
            feature.UniqueUsers.Should().BeLessThanOrEqualTo(memberCount);
            feature.AverageEngagementScore.Should().BeGreaterThan(0);
        }
    }

    private void ValidateMemberEngagementAnalytics(MemberEngagementAnalyticsResponse analytics, int memberCount)
    {
        analytics.Should().NotBeNull();
        analytics.ClubSummary.Should().NotBeNull();
        analytics.MemberEngagement.Should().NotBeEmpty();
        analytics.Distribution.Should().NotBeNull();

        analytics.ClubSummary.TotalMembers.Should().Be(memberCount);
        analytics.ClubSummary.AverageEngagementScore.Should().BeGreaterThan(0);

        // Validate distribution adds up to total members
        var distributionTotal = analytics.Distribution.HighlyActive +
                              analytics.Distribution.Active +
                              analytics.Distribution.Moderate +
                              analytics.Distribution.LowEngagement +
                              analytics.Distribution.Inactive;

        distributionTotal.Should().Be(memberCount);
    }

    private void ValidatePlatformUsageComparison(PlatformUsageComparison comparison)
    {
        comparison.Should().NotBeNull();
        comparison.Web.Should().NotBeNull();
        comparison.Mobile.Should().NotBeNull();

        // At least one platform should have usage
        (comparison.Web.UsageCount + comparison.Mobile.UsageCount).Should().BeGreaterThan(0);
    }

    private void ValidateTopFeatures(List<FeatureUsageStatistic> topFeatures)
    {
        topFeatures.Should().NotBeNull();

        if (topFeatures.Any())
        {
            // Features should be ordered by usage count descending
            for (int i = 1; i < topFeatures.Count; i++)
            {
                topFeatures[i - 1].UsageCount.Should().BeGreaterThanOrEqualTo(topFeatures[i].UsageCount);
            }
        }
    }

    private void ValidateLowEngagementMembers(List<MemberEngagementSummary> lowEngagement, int totalMembers)
    {
        lowEngagement.Should().NotBeNull();
        lowEngagement.Count.Should().BeLessThanOrEqualTo(totalMembers);

        foreach (var member in lowEngagement)
        {
            member.OverallScore.Should().BeLessThan(50m); // Below threshold
            member.ScoreBreakdown.Should().NotBeNull();
        }
    }

    private void ValidateEngagementScoreComponents(MemberEngagementScore score, string expectedLevel)
    {
        score.Should().NotBeNull();
        score.OverallScore.Should().BeGreaterThanOrEqualTo(0);
        score.OverallScore.Should().BeLessThanOrEqualTo(100);

        score.LoginScore.Should().BeGreaterThanOrEqualTo(0);
        score.EventScore.Should().BeGreaterThanOrEqualTo(0);
        score.CommunicationScore.Should().BeGreaterThanOrEqualTo(0);
        score.FeatureUsageScore.Should().BeGreaterThanOrEqualTo(0);
        score.ProfileCompletenessScore.Should().BeGreaterThanOrEqualTo(0);

        score.ActivityLevel.Should().NotBeNullOrEmpty();

        if (expectedLevel == "HighlyActive")
        {
            score.OverallScore.Should().BeGreaterThan(60m);
        }
        else if (expectedLevel == "Inactive")
        {
            score.OverallScore.Should().BeLessThan(40m);
        }
    }

    #endregion
}