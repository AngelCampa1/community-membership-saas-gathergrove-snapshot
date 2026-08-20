using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class MemberEngagementServiceTests : IDisposable
{
    private GatherGroveDbContext _context;
    private MemberEngagementService _engagementService;
    private Mock<IEngagementScoringService> _mockScoringService;
    private Mock<ILogger<MemberEngagementService>> _mockLogger;
    private Mock<ICommunicationsService> _mockCommunicationsService;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database with unique name for each test
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockScoringService = new Mock<IEngagementScoringService>();
        _mockLogger = new Mock<ILogger<MemberEngagementService>>();
        _mockCommunicationsService = new Mock<ICommunicationsService>();

        // Setup default score weights to prevent null reference exceptions
        _mockScoringService.Setup(s => s.GetScoreWeights())
            .Returns(new Dictionary<string, decimal>
            {
                ["Login"] = 0.25m,
                ["Event"] = 0.30m,
                ["Communication"] = 0.20m,
                ["FeatureUsage"] = 0.15m,
                ["ProfileCompleteness"] = 0.10m
            });

        _engagementService = new MemberEngagementService(
            _context,
            _mockScoringService.Object,
            _mockLogger.Object,
            _mockCommunicationsService.Object);
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

    #region CalculateEngagementScore Tests

    [Test]
    public async Task CalculateEngagementScore_ValidMemberId_ReturnsCalculatedScore()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "test@example.com");
        var expectedScore = 85.5m;

        _mockScoringService
            .Setup(s => s.CalculateEngagementScoreAsync(member.Id))
            .ReturnsAsync(expectedScore);

        // Act
        var result = await _engagementService.CalculateEngagementScore(member.Id);

        // Assert
        Assert.That(result.OverallScore, Is.EqualTo(expectedScore));
        _mockScoringService.Verify(s => s.CalculateEngagementScoreAsync(member.Id), Times.Once);
    }

    [Test]
    public async Task CalculateEngagementScore_NonExistentMember_ThrowsArgumentException()
    {
        // Arrange
        var nonExistentMemberId = 999;

        _mockScoringService
            .Setup(s => s.CalculateEngagementScoreAsync(nonExistentMemberId))
            .ThrowsAsync(new ArgumentException($"Member with ID {nonExistentMemberId} not found"));

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _engagementService.CalculateEngagementScore(nonExistentMemberId));

        Assert.That(ex.Message, Does.Contain("not found"));
    }

    #endregion

    #region GetMemberEngagementScore Tests

    [Test]
    public async Task GetMemberEngagementScore_ExistingMember_ReturnsEngagementData()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "engaged@example.com");
        var engagementScore = 78.5m;

        // Create test activities
        await CreateTestEventAttendance(member.Id, club.Id, DateTime.UtcNow.AddDays(-5));
        await CreateTestEventAttendance(member.Id, club.Id, DateTime.UtcNow.AddDays(-10));

        // Create MemberEngagementScore record
        await CreateMemberEngagementScore(member.Id, club.Id, engagementScore);

        // Act
        var result = await _engagementService.GetMemberEngagementScore(member.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MemberId, Is.EqualTo(member.Id));
        Assert.That(result.OverallScore, Is.EqualTo(engagementScore));
        Assert.That(result.EngagementLevel, Is.Not.Null);
        Assert.That(result.CalculatedDate, Is.Not.EqualTo(DateTime.MinValue));
    }

    [Test]
    public async Task GetMemberEngagementScore_NonExistentMember_ReturnsNull()
    {
        // Arrange
        var nonExistentMemberId = 999;

        // Act
        var result = await _engagementService.GetMemberEngagementScore(nonExistentMemberId);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMemberEngagementScore_MemberWithNoActivities_ReturnsZeroScoreAndNullLastActivity()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "inactive@example.com");

        // Create MemberEngagementScore record with zero score
        await CreateMemberEngagementScore(member.Id, club.Id, 0m);

        // Act
        var result = await _engagementService.GetMemberEngagementScore(member.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.OverallScore, Is.EqualTo(0m));
        Assert.That(result.EngagementLevel, Is.EqualTo("Red"));
    }

    #endregion

    #region GetEngagementOverview Tests

    [Test]
    public async Task GetEngagementOverview_ValidClub_ReturnsEngagementSummary()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "member1@example.com");
        var member2 = await CreateTestMember(club.Id, "member2@example.com");
        var member3 = await CreateTestMember(club.Id, "member3@example.com");

        // Create MemberEngagementScore records with different scores
        await CreateMemberEngagementScore(member1.Id, club.Id, 95m); // High
        await CreateMemberEngagementScore(member2.Id, club.Id, 65m); // Medium
        await CreateMemberEngagementScore(member3.Id, club.Id, 25m); // Low

        // Act
        var result = await _engagementService.GetEngagementOverview(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalMembers, Is.EqualTo(3));
        Assert.That(result.AverageScore, Is.EqualTo(61.67m).Within(0.01m));
        Assert.That(result.HighlyEngaged, Is.EqualTo(1));
        Assert.That(result.ModeratelyEngaged, Is.EqualTo(1));
        Assert.That(result.AtRisk, Is.EqualTo(1));
    }

    [Test]
    public async Task GetEngagementOverview_EmptyClub_ReturnsZeroSummary()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _engagementService.GetEngagementOverview(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalMembers, Is.EqualTo(0));
        Assert.That(result.AverageScore, Is.EqualTo(0m));
        Assert.That(result.HighlyEngaged, Is.EqualTo(0));
        Assert.That(result.ModeratelyEngaged, Is.EqualTo(0));
        Assert.That(result.AtRisk, Is.EqualTo(0));
    }

    [Test]
    public async Task GetEngagementOverview_NonExistentClub_ReturnsZeroSummary()
    {
        // Arrange
        var nonExistentClubId = 999;

        // Act
        var result = await _engagementService.GetEngagementOverview(nonExistentClubId);

        // Assert - GetEngagementOverview doesn't throw for non-existent club, just returns empty data
        Assert.That(result.TotalMembers, Is.EqualTo(0));
    }

    #endregion

    #region GetAtRiskMembers Tests

    [Test]
    public async Task GetAtRiskMembers_HasLowEngagementMembers_ReturnsFilteredList()
    {
        // Arrange
        var club = await CreateTestClub();
        var lowEngagementMember = await CreateTestMember(club.Id, "low@example.com");
        var highEngagementMember = await CreateTestMember(club.Id, "high@example.com");

        // Create engagement score records in database
        await CreateMemberEngagementScore(lowEngagementMember.Id, club.Id, 15m);
        await CreateMemberEngagementScore(highEngagementMember.Id, club.Id, 85m);

        var lowEngagementThreshold = 30m;

        // Act
        var result = await _engagementService.GetAtRiskMembers(club.Id, lowEngagementThreshold);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].MemberId, Is.EqualTo(lowEngagementMember.Id));
        Assert.That(result[0].OverallScore, Is.EqualTo(15m));
        Assert.That(result[0].EngagementLevel, Is.EqualTo("Red"));
    }

    [Test]
    public async Task GetAtRiskMembers_NoLowEngagementMembers_ReturnsEmptyList()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "member1@example.com");
        var member2 = await CreateTestMember(club.Id, "member2@example.com");

        // Create engagement score records in database with high scores
        await CreateMemberEngagementScore(member1.Id, club.Id, 75m);
        await CreateMemberEngagementScore(member2.Id, club.Id, 85m);

        var lowEngagementThreshold = 30m;

        // Act
        var result = await _engagementService.GetAtRiskMembers(club.Id, lowEngagementThreshold);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region UpdateEngagementOnActivity Tests

    [Test]
    public async Task UpdateEngagementOnActivity_ValidActivity_UpdatesLastActivityAndRecalculatesScore()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "active@example.com");
        var activityType = "EventAttendance";
        var activityDate = DateTime.UtcNow;
        var newScore = 72.5m;

        _mockScoringService
            .Setup(s => s.CalculateEngagementScoreAsync(member.Id))
            .ReturnsAsync(newScore);

        // Act
        await _engagementService.UpdateEngagementOnActivity(member.Id, activityType, activityDate);

        // Assert
        var updatedMember = await _context.Members.FindAsync(member.Id);
        Assert.That(updatedMember.UpdatedAt, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));

        _mockScoringService.Verify(s => s.CalculateEngagementScoreAsync(member.Id), Times.Once);
    }

    [Test]
    public async Task UpdateEngagementOnActivity_NonExistentMember_ThrowsArgumentException()
    {
        // Arrange
        var nonExistentMemberId = 999;
        var activityType = "EventAttendance";
        var activityDate = DateTime.UtcNow;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _engagementService.UpdateEngagementOnActivity(
                nonExistentMemberId, activityType));

        Assert.That(ex.Message, Does.Contain("Member with ID 999 not found"));
    }

    #endregion

    #region ProcessEngagementAlerts Tests

    [Test]
    public async Task ProcessEngagementAlerts_HasLowEngagementMembers_CreatesAlerts()
    {
        // Arrange
        var club = await CreateTestClub();
        var lowEngagementMember = await CreateTestMember(club.Id, "low@example.com");

        // Create engagement score record in database (this is what ProcessEngagementAlerts actually queries)
        await CreateMemberEngagementScore(lowEngagementMember.Id, club.Id, 15m);

        _mockCommunicationsService
            .Setup(s => s.SendEngagementAlertAsync(It.IsAny<int>(), It.IsAny<List<MemberEngagementResponse>>()))
            .ReturnsAsync(true);

        // Act
        var result = await _engagementService.ProcessEngagementAlerts(club.Id);

        // Assert
        Assert.That(result.Count, Is.EqualTo(1));
        Assert.That(result[0].MemberId, Is.EqualTo(lowEngagementMember.Id));
        Assert.That(result[0].TriggerScore, Is.EqualTo(15m));
        Assert.That(result[0].IsResolved, Is.False);
    }

    [Test]
    public async Task ProcessEngagementAlerts_NoLowEngagementMembers_CreatesNoAlerts()
    {
        // Arrange
        var club = await CreateTestClub();
        var highEngagementMember = await CreateTestMember(club.Id, "high@example.com");

        _mockScoringService
            .Setup(s => s.CalculateEngagementScoreAsync(highEngagementMember.Id))
            .ReturnsAsync(85m);

        // Act
        var result = await _engagementService.ProcessEngagementAlerts(club.Id);

        // Assert
        Assert.That(result.Count, Is.EqualTo(0));
    }

    #endregion

    #region GetEngagementTrends Tests

    [Test]
    public async Task GetEngagementTrends_ValidClubAndDateRange_ReturnsTrendData()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "trend@example.com");
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        // Create historical engagement data
        await CreateEngagementHistory(member.Id, startDate, 60m);
        await CreateEngagementHistory(member.Id, startDate.AddDays(15), 70m);
        await CreateEngagementHistory(member.Id, endDate, 80m);

        // Act
        var result = await _engagementService.GetEngagementTrends(club.Id, 30);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalMembers, Is.GreaterThanOrEqualTo(0));
        Assert.That(result.DailyTrends, Is.Not.Null);
    }

    [Test]
    public async Task GetEngagementTrends_NoHistoricalData_ReturnsEmptyTrends()
    {
        // Arrange
        var club = await CreateTestClub();
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;

        // Act
        var result = await _engagementService.GetEngagementTrends(club.Id, 30);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.DailyTrends, Is.Empty);
        Assert.That(result.TotalMembers, Is.EqualTo(0));
    }

    #endregion

    #region Performance Tests

    [Test]
    public async Task CalculateEngagementScore_LargeDataset_PerformsWithinTimeLimit()
    {
        // Arrange
        var club = await CreateTestClub();
        var memberIds = new List<int>();

        // Create 100 test members
        for (int i = 0; i < 100; i++)
        {
            var member = await CreateTestMember(club.Id, $"member{i}@example.com");
            memberIds.Add(member.Id);
        }

        _mockScoringService
            .Setup(s => s.CalculateEngagementScoreAsync(It.IsAny<int>()))
            .ReturnsAsync(75m);

        // Act & Assert - Should complete within 5 seconds
        var startTime = DateTime.UtcNow;

        var tasks = memberIds.Select(id => _engagementService.CalculateEngagementScore(id));
        await Task.WhenAll(tasks);

        var duration = DateTime.UtcNow - startTime;
        Assert.That(duration.TotalSeconds, Is.LessThan(5));
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task GetMemberEngagementScore_NewMemberWithNoHistory_ReturnsDefaultEngagementLevel()
    {
        // Arrange
        var club = await CreateTestClub();
        var newMember = await CreateTestMember(club.Id, "new@example.com", DateTime.UtcNow); // Joined today

        // Create MemberEngagementScore record with default score
        await CreateMemberEngagementScore(newMember.Id, club.Id, 50m);

        // Act
        var result = await _engagementService.GetMemberEngagementScore(newMember.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EngagementLevel, Is.EqualTo("Yellow")); // New members start with medium (Yellow)
        Assert.That(result.OverallScore, Is.EqualTo(50m));
    }

    [Test]
    public async Task GetMemberEngagementScore_MemberWithArchivedStatus_HandlesGracefully()
    {
        // Arrange
        var club = await CreateTestClub();
        var archivedMember = await CreateTestMember(club.Id, "archived@example.com");
        archivedMember.Status = "Archived";
        await _context.SaveChangesAsync();

        // Create MemberEngagementScore record for archived member
        await CreateMemberEngagementScore(archivedMember.Id, club.Id, 0m);

        // Act
        var result = await _engagementService.GetMemberEngagementScore(archivedMember.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EngagementLevel, Is.EqualTo("Red"));
    }

    #endregion

    #region GetEngagementScores Tests

    [Test]
    public async Task GetEngagementScores_WithLevelFilter_ReturnsFilteredScores()
    {
        // Arrange
        var club = await CreateTestClub();
        var greenMember = await CreateTestMember(club.Id, "green@example.com");
        var yellowMember = await CreateTestMember(club.Id, "yellow@example.com");
        var redMember = await CreateTestMember(club.Id, "red@example.com");

        await CreateMemberEngagementScore(greenMember.Id, club.Id, 85m);
        await CreateMemberEngagementScore(yellowMember.Id, club.Id, 55m);
        await CreateMemberEngagementScore(redMember.Id, club.Id, 25m);

        // Act
        var result = await _engagementService.GetEngagementScores(club.Id, EngagementLevel.Green);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].MemberId, Is.EqualTo(greenMember.Id));
        Assert.That(result[0].EngagementLevel, Is.EqualTo("Green"));
    }

    [Test]
    public async Task GetEngagementScores_WithoutLevelFilter_ReturnsAllScores()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "member1@example.com");
        var member2 = await CreateTestMember(club.Id, "member2@example.com");
        var member3 = await CreateTestMember(club.Id, "member3@example.com");

        await CreateMemberEngagementScore(member1.Id, club.Id, 85m);
        await CreateMemberEngagementScore(member2.Id, club.Id, 55m);
        await CreateMemberEngagementScore(member3.Id, club.Id, 25m);

        // Act
        var result = await _engagementService.GetEngagementScores(club.Id, null);

        // Assert
        Assert.That(result, Has.Count.EqualTo(3));
        Assert.That(result[0].OverallScore, Is.GreaterThanOrEqualTo(result[1].OverallScore)); // Ordered by score descending
    }

    [Test]
    public async Task GetEngagementScores_EmptyClub_ReturnsEmptyList()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _engagementService.GetEngagementScores(club.Id, null);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetEngagementHistory Tests

    [Test]
    public async Task GetEngagementHistory_WithinDateRange_ReturnsFilteredHistory()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "history@example.com");

        // Create history records at different dates
        await CreateEngagementHistory(member.Id, DateTime.UtcNow.AddDays(-5), 80m);
        await CreateEngagementHistory(member.Id, DateTime.UtcNow.AddDays(-15), 70m);
        await CreateEngagementHistory(member.Id, DateTime.UtcNow.AddDays(-45), 60m);
        await CreateEngagementHistory(member.Id, DateTime.UtcNow.AddDays(-100), 50m); // Outside range

        // Act
        var result = await _engagementService.GetEngagementHistory(member.Id, 90);

        // Assert
        Assert.That(result, Has.Count.EqualTo(3)); // Should not include 100-day-old record
        Assert.That(result[0].RecordedAt, Is.GreaterThan(result[1].RecordedAt)); // Ordered descending
    }

    [Test]
    public async Task GetEngagementHistory_NoHistory_ReturnsEmptyList()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "nohistory@example.com");

        // Act
        var result = await _engagementService.GetEngagementHistory(member.Id, 30);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetEngagementAlerts Tests

    [Test]
    public async Task GetEngagementAlerts_WithSeverityFilter_ReturnsFilteredAlerts()
    {
        // Arrange
        var club = await CreateTestClub();
        var criticalMember = await CreateTestMember(club.Id, "critical@example.com");
        var mediumMember = await CreateTestMember(club.Id, "medium@example.com");

        await CreateMemberEngagementScore(criticalMember.Id, club.Id, 5m);
        await CreateMemberEngagementScore(mediumMember.Id, club.Id, 25m);

        // Create alerts
        await _engagementService.ProcessEngagementAlerts(club.Id);

        // Act
        var result = await _engagementService.GetEngagementAlerts(club.Id, Domain.Enums.AlertSeverity.Critical);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Severity, Is.EqualTo(Domain.Enums.AlertSeverity.Critical));
    }

    [Test]
    public async Task GetEngagementAlerts_WithoutFilter_ReturnsAllUnresolvedAlerts()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "alert1@example.com");
        var member2 = await CreateTestMember(club.Id, "alert2@example.com");

        await CreateMemberEngagementScore(member1.Id, club.Id, 15m);
        await CreateMemberEngagementScore(member2.Id, club.Id, 25m);

        await _engagementService.ProcessEngagementAlerts(club.Id);

        // Act
        var result = await _engagementService.GetEngagementAlerts(club.Id, null);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result.All(a => !a.IsResolved), Is.True);
    }

    #endregion

    #region ResolveAlert Tests

    [Test]
    public async Task ResolveAlert_ValidAlert_ResolvesSuccessfully()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "resolve@example.com");
        await CreateMemberEngagementScore(member.Id, club.Id, 15m);

        var alerts = await _engagementService.ProcessEngagementAlerts(club.Id);
        var alertId = alerts[0].Id;
        var resolvingUserId = 1;
        var notes = "Followed up with member via phone call";

        // Act
        var result = await _engagementService.ResolveAlert(alertId, resolvingUserId, notes);

        // Assert
        Assert.That(result.IsResolved, Is.True);
        Assert.That(result.ResolvedByUserId, Is.EqualTo(resolvingUserId));
        Assert.That(result.ResolutionNotes, Is.EqualTo(notes));
        Assert.That(result.ResolvedAt, Is.Not.Null);
    }

    [Test]
    public void ResolveAlert_NonExistentAlert_ThrowsArgumentException()
    {
        // Arrange
        var nonExistentAlertId = 999;
        var resolvingUserId = 1;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _engagementService.ResolveAlert(nonExistentAlertId, resolvingUserId));

        Assert.That(ex.Message, Does.Contain("not found"));
    }

    #endregion

    #region ExecuteBulkAction Tests

    [Test]
    public async Task ExecuteBulkAction_SendReEngagementEmail_ExecutesSuccessfully()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "bulk1@example.com");
        var member2 = await CreateTestMember(club.Id, "bulk2@example.com");

        await CreateMemberEngagementScore(member1.Id, club.Id, 25m);
        await CreateMemberEngagementScore(member2.Id, club.Id, 15m);

        // Act
        var result = await _engagementService.ExecuteBulkAction(
            club.Id,
            BulkActionType.SendReEngagementEmail,
            EngagementLevel.Red,
            null);

        // Assert
        Assert.That(result.TotalTargeted, Is.EqualTo(2));
        Assert.That(result.SuccessfulActions, Is.EqualTo(2));
        Assert.That(result.FailedActions, Is.EqualTo(0));
        Assert.That(result.ActionType, Is.EqualTo("SendReEngagementEmail"));
    }

    [Test]
    public async Task ExecuteBulkAction_CreateFollowUpTask_CreatesAlertsSuccessfully()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "followup@example.com");
        await CreateMemberEngagementScore(member.Id, club.Id, 20m);

        // Act
        var result = await _engagementService.ExecuteBulkAction(
            club.Id,
            BulkActionType.CreateFollowUpTask,
            EngagementLevel.Red,
            null);

        // Assert
        Assert.That(result.SuccessfulActions, Is.EqualTo(1));

        var alerts = await _context.MemberEngagementAlerts
            .Where(a => a.MemberId == member.Id && a.Type == AlertType.FollowUp)
            .ToListAsync();
        Assert.That(alerts, Has.Count.EqualTo(1));
    }

    [Test]
    public async Task ExecuteBulkAction_AssignPersonalOutreach_CreatesHighPriorityAlerts()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "outreach@example.com");
        await CreateMemberEngagementScore(member.Id, club.Id, 10m);

        var options = new BulkActionOptions { AssignedUserId = 5 };

        // Act
        var result = await _engagementService.ExecuteBulkAction(
            club.Id,
            BulkActionType.AssignPersonalOutreach,
            EngagementLevel.Red,
            options);

        // Assert
        Assert.That(result.SuccessfulActions, Is.EqualTo(1));

        var alert = await _context.MemberEngagementAlerts
            .FirstOrDefaultAsync(a => a.MemberId == member.Id && a.Type == AlertType.PersonalOutreach);
        Assert.That(alert, Is.Not.Null);
        Assert.That(alert.Severity, Is.EqualTo(Domain.Enums.AlertSeverity.High));
    }

    [Test]
    public async Task ExecuteBulkAction_AddToSpecialCampaign_LogsCampaignAssignment()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "campaign@example.com");
        await CreateMemberEngagementScore(member.Id, club.Id, 30m);

        var options = new BulkActionOptions
        {
            CustomProperties = new Dictionary<string, object> { ["CampaignName"] = "Spring Revival" }
        };

        // Act
        var result = await _engagementService.ExecuteBulkAction(
            club.Id,
            BulkActionType.AddToSpecialCampaign,
            EngagementLevel.Red,
            options);

        // Assert
        Assert.That(result.SuccessfulActions, Is.EqualTo(1));

        var commLog = await _context.CommunicationsLogs
            .FirstOrDefaultAsync(c => c.ClubId == club.Id && c.CommunicationType == "Campaign");
        Assert.That(commLog, Is.Not.Null);
        Assert.That(commLog.Subject, Does.Contain("Spring Revival"));
    }

    [Test]
    public async Task ExecuteBulkAction_UpdateMembershipStatus_ChangesStatusSuccessfully()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "status@example.com");
        await CreateMemberEngagementScore(member.Id, club.Id, 15m);

        var options = new BulkActionOptions
        {
            CustomProperties = new Dictionary<string, object> { ["NewStatus"] = "At Risk" }
        };

        // Act
        var result = await _engagementService.ExecuteBulkAction(
            club.Id,
            BulkActionType.UpdateMembershipStatus,
            EngagementLevel.Red,
            options);

        // Assert
        Assert.That(result.SuccessfulActions, Is.EqualTo(1));

        var updatedMember = await _context.Members.FindAsync(member.Id);
        Assert.That(updatedMember.Status, Is.EqualTo("At Risk"));
    }

    [Test]
    public async Task ExecuteBulkAction_SchedulePhoneCall_CreatesPhoneCallAlert()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "call@example.com");
        await CreateMemberEngagementScore(member.Id, club.Id, 12m);

        var options = new BulkActionOptions
        {
            MessageContent = "Schedule call to discuss membership benefits",
            AssignedUserId = 3
        };

        // Act
        var result = await _engagementService.ExecuteBulkAction(
            club.Id,
            BulkActionType.SchedulePhoneCall,
            EngagementLevel.Red,
            options);

        // Assert
        Assert.That(result.SuccessfulActions, Is.EqualTo(1));

        var alert = await _context.MemberEngagementAlerts
            .FirstOrDefaultAsync(a => a.MemberId == member.Id && a.Type == AlertType.PhoneCallScheduled);
        Assert.That(alert, Is.Not.Null);
        Assert.That(alert.RecommendedActions, Does.Contain("discuss membership benefits"));
    }

    [Test]
    public async Task ExecuteBulkAction_InviteToSpecialEvent_SendsInvitations()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "event@example.com");
        await CreateMemberEngagementScore(member.Id, club.Id, 28m);

        var options = new BulkActionOptions
        {
            CustomProperties = new Dictionary<string, object> { ["EventName"] = "Member Appreciation Night" }
        };

        // Act
        var result = await _engagementService.ExecuteBulkAction(
            club.Id,
            BulkActionType.InviteToSpecialEvent,
            EngagementLevel.Red,
            options);

        // Assert
        Assert.That(result.SuccessfulActions, Is.EqualTo(1));

        var commLog = await _context.CommunicationsLogs
            .FirstOrDefaultAsync(c => c.ClubId == club.Id && c.CommunicationType == "Event Invitation");
        Assert.That(commLog, Is.Not.Null);
        Assert.That(commLog.Subject, Does.Contain("Member Appreciation Night"));
    }

    #endregion

    #region RecalculateClubEngagementScores Tests

    [Test]
    public async Task RecalculateClubEngagementScores_ActiveMembers_RecalculatesAllScores()
    {
        // Arrange
        var club = await CreateTestClub();
        var member1 = await CreateTestMember(club.Id, "recalc1@example.com");
        var member2 = await CreateTestMember(club.Id, "recalc2@example.com");
        var inactiveMember = await CreateTestMember(club.Id, "inactive@example.com");
        inactiveMember.Status = "Inactive";
        await _context.SaveChangesAsync();

        _mockScoringService
            .Setup(s => s.CalculateEngagementScoreAsync(It.IsAny<int>()))
            .ReturnsAsync(75m);

        // Act
        var result = await _engagementService.RecalculateClubEngagementScores(club.Id);

        // Assert
        Assert.That(result, Is.EqualTo(2)); // Should only recalculate active members
        _mockScoringService.Verify(s => s.CalculateEngagementScoreAsync(It.IsAny<int>()), Times.AtLeast(2));
    }

    [Test]
    public async Task RecalculateClubEngagementScores_EmptyClub_ReturnsZero()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _engagementService.RecalculateClubEngagementScores(club.Id);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    #endregion

    #region TrackMemberLogin Tests

    [Test]
    public async Task TrackMemberLogin_ValidLogin_TracksSuccessfully()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "login@example.com");
        var sessionId = Guid.NewGuid().ToString();
        var platform = "Web";

        _mockScoringService
            .Setup(s => s.CalculateEngagementScoreAsync(member.Id))
            .ReturnsAsync(70m);

        // Act
        var result = await _engagementService.TrackMemberLogin(member.Id, sessionId, platform);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MemberId, Is.EqualTo(member.Id));
        Assert.That(result.SessionId, Is.EqualTo(sessionId));
        Assert.That(result.Platform, Is.EqualTo(platform));
        Assert.That(result.IsSuccessful, Is.True);
        Assert.That(result.LoginTimestamp, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));
    }

    [Test]
    public async Task TrackMemberLogin_MultipleLogins_TracksAllLogins()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "multilogin@example.com");

        _mockScoringService
            .Setup(s => s.CalculateEngagementScoreAsync(member.Id))
            .ReturnsAsync(70m);

        // Act
        await _engagementService.TrackMemberLogin(member.Id, "session1", "Web");
        await _engagementService.TrackMemberLogin(member.Id, "session2", "Mobile");
        await _engagementService.TrackMemberLogin(member.Id, "session3", "Web");

        // Wait for background tasks to complete
        await Task.Delay(100);

        // Assert
        var loginRecords = await _context.Set<MemberLoginTracking>()
            .Where(l => l.MemberId == member.Id)
            .ToListAsync();
        Assert.That(loginRecords, Has.Count.EqualTo(3));
    }

    #endregion

    #region UpdateProfileCompleteness Tests

    [Test]
    public async Task UpdateProfileCompleteness_FullProfile_ReturnsHighCompletion()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "complete@example.com");
        member.PhoneNumber = "555-1234";
        member.Address = "123 Main St";
        await _context.SaveChangesAsync();

        // Act
        var result = await _engagementService.UpdateProfileCompleteness(member.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MemberId, Is.EqualTo(member.Id));
        Assert.That(result.RequiredFieldsCompleted, Is.EqualTo(2)); // FullName, Email
        Assert.That(result.OptionalFieldsCompleted, Is.GreaterThanOrEqualTo(2)); // PhoneNumber, Address
        Assert.That(result.CompletionPercentage, Is.GreaterThan(50));
    }

    [Test]
    public async Task UpdateProfileCompleteness_MinimalProfile_ReturnsLowerCompletion()
    {
        // Arrange
        var club = await CreateTestClub();
        var member = await CreateTestMember(club.Id, "minimal@example.com");
        // Member has only FullName and Email (required fields)

        // Act
        var result = await _engagementService.UpdateProfileCompleteness(member.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.RequiredFieldsCompleted, Is.EqualTo(2)); // FullName, Email
        Assert.That(result.OptionalFieldsCompleted, Is.EqualTo(0)); // No optional fields filled
        Assert.That(result.CompletionPercentage, Is.LessThan(100));
    }

    [Test]
    public void UpdateProfileCompleteness_NonExistentMember_ThrowsArgumentException()
    {
        // Arrange
        var nonExistentMemberId = 999;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _engagementService.UpdateProfileCompleteness(nonExistentMemberId));

        Assert.That(ex.Message, Does.Contain("not found"));
    }

    #endregion

    #region Helper Methods

    private async Task<Club> CreateTestClub(string name = "Test Club")
    {
        var club = new Club
        {
            Name = name,
            Tier = "Grow",
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
            FullName = $"Test Member {email}",
            Email = email,
            Status = "Active",
            JoinDate = joinDate ?? DateTime.UtcNow.AddDays(-30),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();
        return member;
    }

    private async Task<EventAttendance> CreateTestEventAttendance(int memberId, int clubId, DateTime attendedAt)
    {
        var clubEvent = new Event
        {
            ClubId = clubId,
            Name = "Test Event",
            Description = "Test event description",
            EventDateTime = attendedAt,
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
            AttendedAt = attendedAt,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();
        return attendance;
    }

    private async Task CreateEngagementHistory(int memberId, DateTime date, decimal score)
    {
        var history = new MemberEngagementHistory
        {
            MemberId = memberId,
            OverallScore = score,
            LoginFrequencyScore = score * 0.2m,
            EventParticipationScore = score * 0.3m,
            CommunicationScore = score * 0.2m,
            FeatureUsageScore = score * 0.2m,
            ProfileCompletenessScore = score * 0.1m,
            Level = score >= 70 ? EngagementLevel.Green : score >= 40 ? EngagementLevel.Yellow : EngagementLevel.Red,
            RecordedAt = date,
            MetricsSnapshot = "{\"EventAttendances\": 5, \"EventRsvps\": 3, \"PaymentsMade\": 1}"
        };

        _context.MemberEngagementHistories.Add(history);
        await _context.SaveChangesAsync();
    }

    private async Task<MemberEngagementScore> CreateMemberEngagementScore(int memberId, int clubId, decimal score)
    {
        // Ensure the member exists and reload it to get the proper reference
        var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == memberId);
        if (member == null)
        {
            throw new InvalidOperationException($"Member with ID {memberId} not found. Call CreateTestMember first.");
        }

        var engagementScore = new MemberEngagementScore
        {
            MemberId = memberId,
            Member = member, // Set the navigation property
            ClubId = clubId,
            OverallScore = score,
            LoginScore = score * 0.2m,
            EventScore = score * 0.3m,
            CommunicationScore = score * 0.2m,
            FeatureUsageScore = score * 0.2m,
            ProfileCompletenessScore = score * 0.1m,
            EngagementLevel = score >= 70 ? "Green" : score >= 40 ? "Yellow" : "Red",
            CalculatedDate = DateTime.UtcNow,
            LastLoginDate = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MemberEngagementScores.Add(engagementScore);
        await _context.SaveChangesAsync();
        return engagementScore;
    }

    #endregion
}