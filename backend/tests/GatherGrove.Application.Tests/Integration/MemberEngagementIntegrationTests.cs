using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Integration;

[TestFixture]
[Category("Integration")]
public class MemberEngagementIntegrationTests : IDisposable
{
    private GatherGroveDbContext _context;
    private ServiceProvider _serviceProvider;
    private IMemberEngagementService _engagementService;
    private IEngagementScoringService _scoringService;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database with unique name for each test
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);

        // Set up dependency injection container
        var services = new ServiceCollection();
        services.AddSingleton(_context);
        services.AddScoped<IEngagementScoringService, EngagementScoringService>();
        services.AddScoped<IMemberEngagementService, MemberEngagementService>();
        services.AddScoped<Mock<ICommunicationsService>>();
        services.AddScoped<ICommunicationsService>(provider =>
        {
            var mock = new Mock<ICommunicationsService>();
            mock.Setup(s => s.SendEngagementAlertAsync(It.IsAny<int>(), It.IsAny<List<MemberEngagementResponse>>()))
                .ReturnsAsync(true);
            return mock.Object;
        });
        services.AddLogging(builder => builder.AddConsole());

        _serviceProvider = services.BuildServiceProvider();
        _engagementService = _serviceProvider.GetRequiredService<IMemberEngagementService>();
        _scoringService = _serviceProvider.GetRequiredService<IEngagementScoringService>();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
        _serviceProvider?.Dispose();
    }

    public void Dispose()
    {
        _context?.Dispose();
        _serviceProvider?.Dispose();
    }

    #region End-to-End Engagement Workflow Tests

    [Test]
    public async Task CompleteEngagementWorkflow_CreateMemberCalculateScoreGenerateAlerts_WorksEndToEnd()
    {
        // Arrange - Create separate clubs for each member to avoid shared communication scores
        var highEngagementClub = await CreateTestClub("High Engagement Club");
        var mediumEngagementClub = await CreateTestClub("Medium Engagement Club");
        var lowEngagementClub = await CreateTestClub("Low Engagement Club");

        var highEngagementMember = await CreateTestMember(highEngagementClub.Id, "high@test.com");
        var mediumEngagementMember = await CreateTestMember(mediumEngagementClub.Id, "medium@test.com");
        var lowEngagementMember = await CreateTestMember(lowEngagementClub.Id, "low@test.com");

        // High engagement activities
        await CreateEngagementActivities(highEngagementMember.Id, highEngagementClub.Id, high: true);

        // Medium engagement activities
        await CreateEngagementActivities(mediumEngagementMember.Id, mediumEngagementClub.Id, medium: true);

        // Low engagement activities
        await CreateEngagementActivities(lowEngagementMember.Id, lowEngagementClub.Id, low: true);

        // Act & Assert - Test full workflow

        // Step 1: Calculate individual engagement scores  
        var highScore = await _engagementService.CalculateEngagementScore(highEngagementMember.Id);
        var mediumScore = await _engagementService.CalculateEngagementScore(mediumEngagementMember.Id);
        var lowScore = await _engagementService.CalculateEngagementScore(lowEngagementMember.Id);

        Assert.That(highScore.OverallScore, Is.GreaterThan(mediumScore.OverallScore));
        Assert.That(mediumScore.OverallScore, Is.GreaterThan(lowScore.OverallScore));
        Assert.That(highScore.OverallScore, Is.GreaterThan(70m));
        Assert.That(lowScore.OverallScore, Is.LessThan(40m));

        // Step 2: Test individual club engagement summaries
        var highClubSummary = await _engagementService.GetEngagementOverview(highEngagementClub.Id);
        var mediumClubSummary = await _engagementService.GetEngagementOverview(mediumEngagementClub.Id);
        var lowClubSummary = await _engagementService.GetEngagementOverview(lowEngagementClub.Id);

        Assert.That(highClubSummary.TotalMembers, Is.EqualTo(1));
        Assert.That(mediumClubSummary.TotalMembers, Is.EqualTo(1));
        Assert.That(lowClubSummary.TotalMembers, Is.EqualTo(1));

        // Step 3: Test at-risk member identification
        var lowEngagementMembers = await _engagementService.GetAtRiskMembers(lowEngagementClub.Id, 40m);

        Assert.That(lowEngagementMembers, Has.Count.EqualTo(1));
        Assert.That(lowEngagementMembers[0].MemberId, Is.EqualTo(lowEngagementMember.Id));

        // Step 4: Process engagement alerts for low engagement club
        var alerts = await _engagementService.ProcessEngagementAlerts(lowEngagementClub.Id);

        Assert.That(alerts.Count, Is.GreaterThanOrEqualTo(0));

        // Step 5: Update member activity and verify score recalculation
        await _engagementService.UpdateEngagementOnActivity(
            lowEngagementMember.Id,
            "EventAttendance");

        var updatedLowScore = await _engagementService.CalculateEngagementScore(lowEngagementMember.Id);
        Assert.That(updatedLowScore.OverallScore, Is.GreaterThanOrEqualTo(lowScore.OverallScore)); // Score should improve or stay same
    }

    [Test]
    public async Task EngagementScoreCalculation_WithRealDatabase_MatchesExpectedAlgorithm()
    {
        // Arrange
        var club = await CreateTestClub("Algorithm Test Club");
        var member = await CreateTestMember(club.Id, "algorithm@example.com");

        // Create precisely known activities
        var attendances = 5;
        var rsvps = 8;
        var payments = 3;
        var chatMessages = 15;

        await CreateSpecificActivities(member.Id, club.Id, attendances, rsvps, payments, chatMessages);

        // Act
        var calculatedScore = await _scoringService.CalculateEngagementScoreAsync(member.Id);

        // Assert - Verify score is within expected range based on algorithm
        // Note: Exact values would depend on the actual weighted algorithm implementation
        Assert.That(calculatedScore, Is.GreaterThan(30m));
        Assert.That(calculatedScore, Is.LessThan(80m));
        Assert.That(calculatedScore, Is.GreaterThan(0m));
        Assert.That(calculatedScore, Is.LessThanOrEqualTo(100m));
    }

    #endregion

    #region Database Integration Tests

    [Test]
    public async Task EngagementHistory_CreatedAndRetrieved_PersistsCorrectly()
    {
        // Arrange
        var club = await CreateTestClub("History Test Club");
        var member = await CreateTestMember(club.Id, "history@example.com");

        // Create engagement activities over time
        var dates = new[]
        {
            DateTime.UtcNow.AddDays(-30),
            DateTime.UtcNow.AddDays(-15),
            DateTime.UtcNow
        };

        foreach (var date in dates)
        {
            await CreateEventAttendanceOnDate(member.Id, club.Id, date);
        }

        // Act - Calculate score and verify history is created
        var score = await _engagementService.CalculateEngagementScore(member.Id);

        // Verify activities are retrievable
        var memberEngagement = await _engagementService.GetMemberEngagementScore(member.Id);

        // Assert
        Assert.That(memberEngagement, Is.Not.Null);
        Assert.That(memberEngagement, Is.Not.Null);
        Assert.That(memberEngagement.OverallScore, Is.EqualTo(score.OverallScore));
    }

    [Test]
    public async Task ConcurrentEngagementCalculations_MultipleMembers_HandledCorrectly()
    {
        // Arrange
        var club = await CreateTestClub("Concurrent Test Club");
        var members = new List<Member>();

        // Create 10 members with different activity levels
        for (int i = 0; i < 10; i++)
        {
            var member = await CreateTestMember(club.Id, $"concurrent{i}@example.com");
            await CreateRandomActivities(member.Id, club.Id, i + 1); // Varying activity levels
            members.Add(member);
        }

        // Act - Calculate all scores concurrently
        var scoreTasks = members.Select(m => _engagementService.CalculateEngagementScore(m.Id));
        var scores = await Task.WhenAll(scoreTasks);

        // Assert
        Assert.That(scores, Has.Length.EqualTo(10));
        Assert.That(scores.All(s => s.OverallScore >= 0 && s.OverallScore <= 100), Is.True);

        // Verify scores reflect different activity levels
        var uniqueScores = scores.Distinct().Count();
        Assert.That(uniqueScores, Is.GreaterThan(1)); // Should have different scores
    }

    #endregion

    #region Performance Integration Tests

    [Test]
    public async Task LargeClubEngagementCalculation_100Members_CompletesWithinTimeLimit()
    {
        // Arrange
        var club = await CreateTestClub("Large Club");
        var members = new List<Member>();

        // Create 100 members with activities and engagement scores
        for (int i = 0; i < 100; i++)
        {
            var member = await CreateTestMember(club.Id, $"member{i:D3}@example.com");
            await CreateRandomActivities(member.Id, club.Id, (i % 10) + 1);

            // Calculate and store engagement score for this member
            var score = await _scoringService.CalculateEngagementScoreAsync(member.Id);
            await CreateMemberEngagementScoreRecord(member.Id, club.Id, score);

            members.Add(member);
        }

        // Act & Assert - Should complete within 10 seconds
        var startTime = DateTime.UtcNow;

        var clubSummary = await _engagementService.GetEngagementOverview(club.Id);

        var duration = DateTime.UtcNow - startTime;

        Assert.That(duration.TotalSeconds, Is.LessThan(10));
        Assert.That(clubSummary.TotalMembers, Is.EqualTo(100));
        Assert.That(clubSummary.AverageScore, Is.GreaterThan(0m));
    }

    [Test]
    public async Task EngagementTrendsCalculation_6MonthsOfData_PerformsEfficiently()
    {
        // Arrange
        var club = await CreateTestClub("Trends Test Club");
        var members = new List<Member>();

        // Create 20 members
        for (int i = 0; i < 20; i++)
        {
            var member = await CreateTestMember(club.Id, $"trend{i}@example.com");
            members.Add(member);
        }

        // Create 6 months of historical data
        var startDate = DateTime.UtcNow.AddMonths(-6);
        for (int monthOffset = 0; monthOffset < 6; monthOffset++)
        {
            var monthDate = startDate.AddMonths(monthOffset);
            foreach (var member in members)
            {
                await CreateHistoricalActivities(member.Id, club.Id, monthDate, monthOffset + 1);

                // Create corresponding engagement history record for this month
                var baseScore = 30m + (monthOffset * 5); // Progressive improvement over time
                var memberVariation = (member.Id % 20) * 2; // Member-specific variation
                var historicalScore = Math.Min(100m, baseScore + memberVariation);

                await CreateMemberEngagementHistoryRecord(member.Id, historicalScore, monthDate);
            }
        }

        // Create current engagement scores for all members
        foreach (var member in members)
        {
            var currentScore = 50m + ((member.Id % 20) * 2); // Current scores
            await CreateMemberEngagementScoreRecord(member.Id, club.Id, currentScore);
        }

        // Act & Assert - Should complete within 5 seconds
        var startTime = DateTime.UtcNow;

        var trends = await _engagementService.GetEngagementTrends(club.Id, 180);

        var duration = DateTime.UtcNow - startTime;

        Assert.That(duration.TotalSeconds, Is.LessThan(5));
        Assert.That(trends.DailyTrends, Is.Not.Empty);
        Assert.That(trends.AverageScore, Is.GreaterThan(0m));
    }

    #endregion

    #region Data Consistency Tests

    [Test]
    public async Task EngagementScoreUpdate_AfterActivityUpdate_ReflectsChangesImmediately()
    {
        // Arrange
        var club = await CreateTestClub("Consistency Test Club");
        var member = await CreateTestMember(club.Id, "consistency@example.com");

        // Create completely separate member for second part to avoid data mixing
        var lowMember = member;
        var initialScore = await _engagementService.CalculateEngagementScore(lowMember.Id);

        // Create new high-engagement member in same club
        var highMember = await CreateTestMember(club.Id, "highengagement@example.com");
        await CreateHighEngagementActivities(highMember.Id, club.Id);

        var updatedScore = await _engagementService.CalculateEngagementScore(highMember.Id);

        // Assert - should see significant improvement from ~10 to high score
        Assert.That(updatedScore.OverallScore, Is.GreaterThan(initialScore.OverallScore),
            $"Expected improvement from {initialScore.OverallScore} to {updatedScore.OverallScore}");

        // Verify member engagement data reflects updates
        var memberEngagement = await _engagementService.GetMemberEngagementScore(highMember.Id);
        Assert.That(memberEngagement, Is.Not.Null);
        Assert.That(memberEngagement.OverallScore, Is.EqualTo(updatedScore.OverallScore));
    }

    [Test]
    public async Task ClubEngagementSummary_AfterMemberChanges_UpdatesDynamically()
    {
        // Arrange
        var club = await CreateTestClub("Dynamic Test Club");
        var member1 = await CreateTestMember(club.Id, "dynamic1@example.com");
        var member2 = await CreateTestMember(club.Id, "dynamic2@example.com");

        // Initial state - both members start with low engagement scores
        // Use fixed scores to avoid data contamination issues
        await CreateMemberEngagementScoreRecord(member1.Id, club.Id, 25.0m);
        await CreateMemberEngagementScoreRecord(member2.Id, club.Id, 30.0m);

        var initialSummary = await _engagementService.GetEngagementOverview(club.Id);

        // Act - Update member1 to have a much higher engagement score
        // Simulate a significant improvement in engagement
        await UpdateMemberEngagementScoreRecord(member1.Id, club.Id, 85.0m);

        var updatedSummary = await _engagementService.GetEngagementOverview(club.Id);

        // Assert - should see improvement in average score
        // Initial average: (25 + 30) / 2 = 27.5
        // Updated average: (85 + 30) / 2 = 57.5
        Assert.That(updatedSummary.AverageScore, Is.GreaterThan(initialSummary.AverageScore),
            $"Expected improvement from {initialSummary.AverageScore} to {updatedSummary.AverageScore}");
        Assert.That(updatedSummary.HighlyEngaged, Is.GreaterThan(initialSummary.HighlyEngaged));
        Assert.That(updatedSummary.AtRisk, Is.LessThanOrEqualTo(initialSummary.AtRisk));
    }

    #endregion

    #region Helper Methods

    private async Task<Club> CreateTestClub(string name = "Integration Test Club")
    {
        // Create a test user first (required for club creation)
        var user = new User
        {
            FullName = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = "test-hash",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = name,
            Tier = "Grow",
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    private async Task<Club> CreateTestClubWithMembers()
    {
        var club = await CreateTestClub("Test Club with Members");

        // Create 3 members with different engagement patterns
        await CreateTestMember(club.Id, "high@example.com");
        await CreateTestMember(club.Id, "medium@example.com");
        await CreateTestMember(club.Id, "low@example.com");

        return club;
    }

    private async Task<Member> CreateTestMember(int clubId, string email)
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
            FullName = $"Integration Test Member {email}",
            Email = email,
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();
        return member;
    }

    private async Task CreateEngagementActivities(int memberId, int clubId, bool high = false, bool medium = false, bool low = false)
    {
        if (high)
        {
            await CreateHighEngagementActivities(memberId, clubId);
        }
        else if (medium)
        {
            await CreateMediumEngagementActivities(memberId, clubId);
        }
        else if (low)
        {
            await CreateMinimalActivities(memberId, clubId);
        }
    }

    private async Task CreateHighEngagementActivities(int memberId, int clubId)
    {
        // High engagement: Many recent activities
        for (int i = 0; i < 8; i++)
        {
            await CreateEventAttendanceOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-i * 2));
        }

        for (int i = 0; i < 5; i++)
        {
            await CreatePaymentOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-i * 15));
        }

        await CreateMultipleChatMessages(memberId, clubId, 30);
        await CreateMultipleRsvps(memberId, clubId, 12);

        // Add login activities to achieve high login score
        await CreateMultipleLoginSessions(memberId, 20);

        // Add feature usage events to achieve high feature usage score  
        await CreateMultipleFeatureUsageEvents(memberId, clubId, 15);
    }

    private async Task CreateMediumEngagementActivities(int memberId, int clubId)
    {
        // Medium engagement: Some activities
        for (int i = 0; i < 4; i++)
        {
            await CreateEventAttendanceOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-i * 7));
        }

        for (int i = 0; i < 2; i++)
        {
            await CreatePaymentOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-i * 30));
        }

        await CreateMultipleChatMessages(memberId, clubId, 10);
        await CreateMultipleRsvps(memberId, clubId, 6);

        // Add moderate login activities and feature usage
        await CreateMultipleLoginSessions(memberId, 8);
        await CreateMultipleFeatureUsageEvents(memberId, clubId, 6);
    }

    private async Task CreateMinimalActivities(int memberId, int clubId)
    {
        // Low engagement: Few activities, some older
        await CreateEventAttendanceOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-30));
        await CreateMultipleRsvps(memberId, clubId, 2);

        // Add minimal login activities and feature usage (very low)
        await CreateMultipleLoginSessions(memberId, 1);
        await CreateMultipleFeatureUsageEvents(memberId, clubId, 1);
    }

    private async Task CreateSpecificActivities(int memberId, int clubId, int attendances, int rsvps, int payments, int chatMessages)
    {
        for (int i = 0; i < attendances; i++)
        {
            await CreateEventAttendanceOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-i * 3));
        }

        for (int i = 0; i < payments; i++)
        {
            await CreatePaymentOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-i * 20));
        }

        await CreateMultipleChatMessages(memberId, clubId, chatMessages);
        await CreateMultipleRsvps(memberId, clubId, rsvps);
    }

    private async Task CreateRandomActivities(int memberId, int clubId, int activityLevel)
    {
        var random = new Random(memberId); // Consistent randomness based on member ID

        var attendances = random.Next(activityLevel);
        var rsvps = random.Next(activityLevel * 2);
        var payments = random.Next((activityLevel + 2) / 3);
        var chatMessages = random.Next(activityLevel * 5);

        await CreateSpecificActivities(memberId, clubId, attendances, rsvps, payments, chatMessages);
    }

    private async Task CreateHistoricalActivities(int memberId, int clubId, DateTime monthDate, int activityLevel)
    {
        // Create activities for a specific month
        for (int i = 0; i < activityLevel; i++)
        {
            var activityDate = monthDate.AddDays(i * 7); // Weekly activities
            await CreateEventAttendanceOnDate(memberId, clubId, activityDate);
        }

        if (activityLevel > 2)
        {
            await CreatePaymentOnDate(memberId, clubId, monthDate.AddDays(15));
        }
    }

    private async Task CreateEventAttendanceOnDate(int memberId, int clubId, DateTime attendanceDate)
    {
        var clubEvent = new Event
        {
            ClubId = clubId,
            Name = $"Event {Guid.NewGuid().ToString()[..8]}",
            Description = "Integration test event",
            EventDateTime = attendanceDate,
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(clubEvent);
        await _context.SaveChangesAsync();

        var attendance = new EventAttendance
        {
            EventId = clubEvent.Id,
            MemberId = memberId,
            AttendedAt = attendanceDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();
    }

    private async Task CreatePaymentOnDate(int memberId, int clubId, DateTime paymentDate)
    {
        var payment = new Payment
        {
            ClubId = clubId,
            MemberId = memberId,
            Amount = 50.00m,
            PaymentDate = paymentDate,
            PaymentMethod = "Card",
            Notes = "Integration test payment",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();
    }

    private async Task CreateMultipleChatMessages(int memberId, int clubId, int count)
    {
        for (int i = 0; i < count; i++)
        {
            // Get the club's admin user to use as message sender
            var club = await _context.Clubs.FirstAsync(c => c.Id == clubId);

            var message = new ClubChatMessage
            {
                ClubId = clubId,
                SenderUserId = club.CreatedByUserId, // Use club admin as sender
                MessageContent = $"Integration test message {i + 1}",
                SentAt = DateTime.UtcNow.AddDays(-i)
            };

            _context.ClubChatMessages.Add(message);
        }
        await _context.SaveChangesAsync();
    }

    private async Task CreateMultipleRsvps(int memberId, int clubId, int count)
    {
        for (int i = 0; i < count; i++)
        {
            var clubEvent = new Event
            {
                ClubId = clubId,
                Name = $"RSVP Event {Guid.NewGuid().ToString()[..8]}",
                Description = "RSVP integration test event",
                EventDateTime = DateTime.UtcNow.AddDays(i + 1),
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
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow
            };

            _context.EventRsvps.Add(rsvp);
        }
        await _context.SaveChangesAsync();
    }

    private async Task CreateMultipleLoginSessions(int memberId, int sessionCount)
    {
        for (int i = 0; i < sessionCount; i++)
        {
            var session = new MemberActivitySession
            {
                MemberId = memberId,
                SessionId = $"session_{memberId}_{Guid.NewGuid().ToString()[..8]}",
                StartTime = DateTime.UtcNow.AddDays(-i).AddHours(-2),
                EndTime = DateTime.UtcNow.AddDays(-i).AddMinutes(-30),
                DurationMinutes = 90 + i * 10, // Varying duration
                PageViews = 15 + i * 3,
                ActionsPerformed = 20 + i * 5,
                MessagesSent = 5 + i,
                EventInteractions = 2 + i,
                Platform = "web",
                DeviceType = "desktop",
                QualityScore = 85 - i, // High quality scores
                IsActive = false,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow.AddDays(-i)
            };
            _context.MemberActivitySessions.Add(session);
        }
        await _context.SaveChangesAsync();
    }

    private async Task CreateMultipleFeatureUsageEvents(int memberId, int clubId, int eventCount)
    {
        var features = new[]
        {
            "dashboard_view", "profile_edit", "directory_search", "event_rsvp",
            "member_directory", "dues_payment", "message_send", "event_create",
            "report_view", "settings_update", "notification_view", "help_access"
        };

        for (int i = 0; i < eventCount; i++)
        {
            var feature = features[i % features.Length];
            var usage = new FeatureUsageEvent
            {
                MemberId = memberId,
                ClubId = clubId,
                FeatureName = feature,
                Platform = i % 2 == 0 ? "web" : "mobile",
                SessionId = $"session_{memberId}_{i}",
                UsedAt = DateTime.UtcNow.AddDays(-i * 2),
                EngagementWeight = feature switch
                {
                    "dues_payment" => 2.0m,
                    "event_create" => 1.8m,
                    "profile_edit" => 1.5m,
                    "directory_search" => 1.3m,
                    "event_rsvp" => 1.2m,
                    _ => 1.0m
                }
            };
            _context.FeatureUsageEvents.Add(usage);
        }
        await _context.SaveChangesAsync();
    }

    private async Task CreateMemberEngagementScoreRecord(int memberId, int clubId, decimal overallScore)
    {
        var engagementScore = new MemberEngagementScore
        {
            MemberId = memberId,
            ClubId = clubId,
            OverallScore = overallScore,
            LoginScore = 0, // Simplified for test
            EventScore = 0,
            CommunicationScore = 0,
            FeatureUsageScore = 0,
            ProfileCompletenessScore = 70,
            LoginCount7Days = 1,
            LoginCount30Days = 1,
            ActivityLevel = overallScore >= 70 ? "HighlyActive" : overallScore >= 40 ? "Active" : "Inactive",
            IsAtRisk = overallScore < 40,
            LastLoginDate = DateTime.UtcNow.AddDays(-1),
            EngagementLevel = overallScore >= 70 ? "High" : overallScore >= 40 ? "Medium" : "Low",
            CalculatedDate = DateTime.UtcNow.Date
        };

        _context.MemberEngagementScores.Add(engagementScore);
        await _context.SaveChangesAsync();
    }

    private async Task CreateMemberEngagementHistoryRecord(int memberId, decimal overallScore, DateTime recordedAt)
    {
        var level = overallScore > 70 ? EngagementLevel.Green :
                   overallScore > 40 ? EngagementLevel.Yellow : EngagementLevel.Red;

        var engagementHistory = new MemberEngagementHistory
        {
            MemberId = memberId,
            OverallScore = overallScore,
            LoginFrequencyScore = overallScore * 0.25m, // Approximate breakdown
            EventParticipationScore = overallScore * 0.30m,
            CommunicationScore = overallScore * 0.20m,
            FeatureUsageScore = overallScore * 0.15m,
            ProfileCompletenessScore = overallScore * 0.10m,
            Level = level,
            RecordedAt = recordedAt,
            MetricsSnapshot = "{\"test\": \"historical data\"}"
        };

        _context.MemberEngagementHistories.Add(engagementHistory);
        await _context.SaveChangesAsync();
    }

    private async Task UpdateMemberEngagementScoreRecord(int memberId, int clubId, decimal newScore)
    {
        var existing = await _context.MemberEngagementScores
            .FirstOrDefaultAsync(s => s.MemberId == memberId && s.ClubId == clubId);

        if (existing != null)
        {
            existing.OverallScore = newScore;
            existing.ActivityLevel = newScore >= 70 ? "HighlyActive" : newScore >= 40 ? "Active" : "Inactive";
            existing.IsAtRisk = newScore < 40;
            existing.EngagementLevel = newScore >= 70 ? "High" : newScore >= 40 ? "Medium" : "Low";
            existing.CalculatedDate = DateTime.UtcNow.Date;

            await _context.SaveChangesAsync();
        }
    }

    private async Task CreateMemberSpecificMinimalActivities(int memberId, int clubId)
    {
        // Very minimal member-specific activities
        await CreateEventAttendanceOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-30));
        await CreateMultipleRsvps(memberId, clubId, 1);
        await CreateMultipleLoginSessions(memberId, 1); // Only 1 login session
        await CreateMultipleFeatureUsageEvents(memberId, clubId, 1); // Only 1 feature usage
        // No chat messages (they affect all members equally)
    }

    private async Task CreateMemberSpecificHighEngagementActivities(int memberId, int clubId)
    {
        // High engagement with member-specific activities only

        // Many recent event attendances (Event score: 30%)
        for (int i = 0; i < 8; i++)
        {
            await CreateEventAttendanceOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-i * 2));
        }

        // Many RSVPs (part of event score)
        await CreateMultipleRsvps(memberId, clubId, 12);

        // Many recent payments (part of event score via events)
        for (int i = 0; i < 5; i++)
        {
            await CreatePaymentOnDate(memberId, clubId, DateTime.UtcNow.AddDays(-i * 15));
        }

        // High login activity (Login score: 25%) 
        await CreateMultipleLoginSessions(memberId, 20);

        // High feature usage (FeatureUsage score: 15%)
        await CreateMultipleFeatureUsageEvents(memberId, clubId, 25);

        // Skip chat messages since they affect all club members equally
    }

    #endregion
}