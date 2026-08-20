using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class CommunicationAnalyticsServiceTests
{
    private GatherGroveDbContext _context = null!;
    private CommunicationAnalyticsService _service = null!;
    private Mock<ILogger<CommunicationAnalyticsService>> _mockLogger = null!;

    private int _testClubId;
    private int _testCommunicationId;
    private int _testMemberId;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<CommunicationAnalyticsService>>();
        _service = new CommunicationAnalyticsService(_context, _mockLogger.Object);

        SetupTestData();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private void SetupTestData()
    {
        // Create test club
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        _context.SaveChanges();
        _testClubId = club.Id;

        // Create test membership type
        var membershipType = new MembershipType
        {
            ClubId = _testClubId,
            Name = "Standard",
            Description = "Standard membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        _context.SaveChanges();

        // Create test member
        var member = new Member
        {
            ClubId = _testClubId,
            MembershipTypeId = membershipType.Id,
            FullName = "Test Member",
            Email = "test@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddMonths(-6),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        _context.SaveChanges();
        _testMemberId = member.Id;

        // Create test communication log
        var communication = new CommunicationsLog
        {
            ClubId = _testClubId,
            CommunicationType = "Email",
            Subject = "Test Subject",
            Body = "Test Body",
            RecipientCount = 10,
            SentAt = DateTime.UtcNow
        };
        _context.CommunicationsLogs.Add(communication);
        _context.SaveChanges();
        _testCommunicationId = communication.Id;

        // Create test analytics records
        CreateAnalyticsRecords(_testCommunicationId, 10);
    }

    private void CreateAnalyticsRecords(int communicationId, int count, bool includeOpens = true, bool includeClicks = true)
    {
        for (int i = 0; i < count; i++)
        {
            var analytic = new CommunicationAnalytics
            {
                CommunicationId = communicationId,
                MemberId = _testMemberId + i,
                SentAt = DateTime.UtcNow.AddMinutes(-i),
                OpenedAt = includeOpens && i % 2 == 0 ? DateTime.UtcNow.AddMinutes(-i + 1) : null, // 50% open rate
                ClickedAt = includeClicks && i % 4 == 0 ? DateTime.UtcNow.AddMinutes(-i + 2) : null, // 25% click rate
                BouncedAt = i == 9 ? DateTime.UtcNow : null, // 10% bounce rate
                UnsubscribedAt = i == 8 ? DateTime.UtcNow : null // 10% unsubscribe rate
            };
            _context.CommunicationAnalytics.Add(analytic);
        }
        _context.SaveChanges();
    }

    #region GetAnalyticsSummaryAsync Tests

    [Test]
    public async Task GetAnalyticsSummaryAsync_ReturnsCorrectTotals()
    {
        // Arrange
        var request = new AnalyticsFilterRequest();

        // Act
        var result = await _service.GetAnalyticsSummaryAsync(_testClubId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalSent, Is.EqualTo(10));
        Assert.That(result.TotalOpened, Is.EqualTo(5)); // 50% open rate
        Assert.That(result.TotalClicked, Is.EqualTo(3)); // 25% click rate (0, 4, 8)
        Assert.That(result.TotalBounced, Is.EqualTo(1));
        Assert.That(result.TotalUnsubscribed, Is.EqualTo(1));
    }

    [Test]
    public async Task GetAnalyticsSummaryAsync_CalculatesRatesCorrectly()
    {
        // Arrange
        var request = new AnalyticsFilterRequest();

        // Act
        var result = await _service.GetAnalyticsSummaryAsync(_testClubId, request);

        // Assert
        Assert.That(result.OpenRate, Is.EqualTo(50.0m)); // 5/10 * 100
        Assert.That(result.ClickRate, Is.EqualTo(30.0m)); // 3/10 * 100
        Assert.That(result.BounceRate, Is.EqualTo(10.0m)); // 1/10 * 100
        Assert.That(result.UnsubscribeRate, Is.EqualTo(10.0m)); // 1/10 * 100
        Assert.That(result.DeliveryRate, Is.EqualTo(90.0m)); // 9/10 * 100 (10 - 1 bounced)
    }

    [Test]
    public async Task GetAnalyticsSummaryAsync_WithStartDateFilter_FiltersResults()
    {
        // Arrange - Create old communication
        var oldCommunication = new CommunicationsLog
        {
            ClubId = _testClubId,
            CommunicationType = "Email",
            Subject = "Old Email",
            Body = "Old body",
            RecipientCount = 5,
            SentAt = DateTime.UtcNow.AddDays(-10)
        };
        _context.CommunicationsLogs.Add(oldCommunication);
        _context.SaveChanges();

        var request = new AnalyticsFilterRequest
        {
            StartDate = DateTime.UtcNow.AddDays(-1)
        };

        // Act
        var result = await _service.GetAnalyticsSummaryAsync(_testClubId, request);

        // Assert - Should only include recent communication
        Assert.That(result.TotalSent, Is.EqualTo(10));
    }

    [Test]
    public async Task GetAnalyticsSummaryAsync_WithEndDateFilter_FiltersResults()
    {
        // Arrange
        var request = new AnalyticsFilterRequest
        {
            EndDate = DateTime.UtcNow.AddHours(1)
        };

        // Act
        var result = await _service.GetAnalyticsSummaryAsync(_testClubId, request);

        // Assert
        Assert.That(result.TotalSent, Is.EqualTo(10));
    }

    [Test]
    public async Task GetAnalyticsSummaryAsync_WithCommunicationTypeFilter_FiltersResults()
    {
        // Arrange - Create SMS communication
        var smsCommunication = new CommunicationsLog
        {
            ClubId = _testClubId,
            CommunicationType = "SMS",
            Subject = "SMS",
            Body = "SMS body",
            RecipientCount = 5,
            SentAt = DateTime.UtcNow
        };
        _context.CommunicationsLogs.Add(smsCommunication);
        _context.SaveChanges();

        // Add analytics for SMS
        for (int i = 0; i < 5; i++)
        {
            _context.CommunicationAnalytics.Add(new CommunicationAnalytics
            {
                CommunicationId = smsCommunication.Id,
                MemberId = _testMemberId + 100 + i,
                SentAt = DateTime.UtcNow
            });
        }
        _context.SaveChanges();

        var request = new AnalyticsFilterRequest
        {
            CommunicationType = "Email"
        };

        // Act
        var result = await _service.GetAnalyticsSummaryAsync(_testClubId, request);

        // Assert - Should only include Email communications
        Assert.That(result.TotalSent, Is.EqualTo(10));
    }

    [Test]
    public async Task GetAnalyticsSummaryAsync_WithNoRecords_ReturnsZeros()
    {
        // Arrange
        var otherClubId = _testClubId + 100;
        var request = new AnalyticsFilterRequest();

        // Act
        var result = await _service.GetAnalyticsSummaryAsync(otherClubId, request);

        // Assert
        Assert.That(result.TotalSent, Is.EqualTo(0));
        Assert.That(result.TotalOpened, Is.EqualTo(0));
        Assert.That(result.OpenRate, Is.EqualTo(0));
    }

    [Test]
    public async Task GetAnalyticsSummaryAsync_CalculatesTotalDelivered()
    {
        // Arrange
        var request = new AnalyticsFilterRequest();

        // Act
        var result = await _service.GetAnalyticsSummaryAsync(_testClubId, request);

        // Assert
        Assert.That(result.TotalDelivered, Is.EqualTo(9)); // 10 - 1 bounced
    }

    #endregion

    #region GetCommunicationDetailsAsync Tests

    [Test]
    public async Task GetCommunicationDetailsAsync_ValidCommunication_ReturnsDetails()
    {
        // Act
        var result = await _service.GetCommunicationDetailsAsync(_testClubId, _testCommunicationId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.CommunicationId, Is.EqualTo(_testCommunicationId));
        Assert.That(result.CommunicationType, Is.EqualTo("Email"));
        Assert.That(result.Subject, Is.EqualTo("Test Subject"));
    }

    [Test]
    public async Task GetCommunicationDetailsAsync_ReturnsCorrectCounts()
    {
        // Act
        var result = await _service.GetCommunicationDetailsAsync(_testClubId, _testCommunicationId);

        // Assert
        Assert.That(result.RecipientCount, Is.EqualTo(10));
        Assert.That(result.OpenedCount, Is.EqualTo(5));
        Assert.That(result.ClickedCount, Is.EqualTo(3));
        Assert.That(result.BouncedCount, Is.EqualTo(1));
        Assert.That(result.UnsubscribedCount, Is.EqualTo(1));
        Assert.That(result.DeliveredCount, Is.EqualTo(9)); // 10 - 1 bounced
    }

    [Test]
    public async Task GetCommunicationDetailsAsync_ReturnsRecipientEngagements()
    {
        // Act
        var result = await _service.GetCommunicationDetailsAsync(_testClubId, _testCommunicationId);

        // Assert
        Assert.That(result.Recipients, Has.Count.EqualTo(10));
        Assert.That(result.Recipients.Any(r => r.Opened), Is.True);
        Assert.That(result.Recipients.Any(r => r.Clicked), Is.True);
        Assert.That(result.Recipients.Any(r => r.Bounced), Is.True);
    }

    [Test]
    public void GetCommunicationDetailsAsync_CommunicationNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.GetCommunicationDetailsAsync(_testClubId, 999));
        Assert.That(ex!.Message, Does.Contain("Communication not found"));
    }

    [Test]
    public void GetCommunicationDetailsAsync_WrongClub_ThrowsArgumentException()
    {
        // Arrange - Try to access with wrong club
        var otherClubId = _testClubId + 100;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.GetCommunicationDetailsAsync(otherClubId, _testCommunicationId));
        Assert.That(ex!.Message, Does.Contain("Communication not found"));
    }

    [Test]
    public async Task GetCommunicationDetailsAsync_CalculatesRates()
    {
        // Act
        var result = await _service.GetCommunicationDetailsAsync(_testClubId, _testCommunicationId);

        // Assert
        Assert.That(result.DeliveryRate, Is.EqualTo(90.0m)); // 9/10 * 100
        Assert.That(result.OpenRate, Is.EqualTo(50.0m)); // 5/10 * 100
        Assert.That(result.ClickRate, Is.EqualTo(30.0m)); // 3/10 * 100
    }

    #endregion

    #region TrackEmailOpenAsync Tests

    [Test]
    public async Task TrackEmailOpenAsync_ValidTrackingId_UpdatesOpenedAt()
    {
        // Arrange
        var analytic = _context.CommunicationAnalytics.First(a => a.OpenedAt == null);
        var request = new TrackEmailOpenRequest
        {
            TrackingId = analytic.Id.ToString()
        };

        // Act
        await _service.TrackEmailOpenAsync(request);

        // Assert
        var updated = await _context.CommunicationAnalytics.FindAsync(analytic.Id);
        Assert.That(updated!.OpenedAt, Is.Not.Null);
    }

    [Test]
    public async Task TrackEmailOpenAsync_AlreadyOpened_DoesNotUpdate()
    {
        // Arrange
        var analytic = _context.CommunicationAnalytics.First(a => a.OpenedAt != null);
        var originalOpenedAt = analytic.OpenedAt;
        var request = new TrackEmailOpenRequest
        {
            TrackingId = analytic.Id.ToString()
        };

        // Act
        await _service.TrackEmailOpenAsync(request);

        // Assert
        var updated = await _context.CommunicationAnalytics.FindAsync(analytic.Id);
        Assert.That(updated!.OpenedAt, Is.EqualTo(originalOpenedAt));
    }

    [Test]
    public async Task TrackEmailOpenAsync_InvalidTrackingId_LogsWarning()
    {
        // Arrange
        var request = new TrackEmailOpenRequest
        {
            TrackingId = "invalid-id"
        };

        // Act
        await _service.TrackEmailOpenAsync(request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Analytics record not found")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task TrackEmailOpenAsync_LogsInformationOnSuccess()
    {
        // Arrange
        var analytic = _context.CommunicationAnalytics.First(a => a.OpenedAt == null);
        var request = new TrackEmailOpenRequest
        {
            TrackingId = analytic.Id.ToString()
        };

        // Act
        await _service.TrackEmailOpenAsync(request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Tracked open")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region TrackLinkClickAsync Tests

    [Test]
    public async Task TrackLinkClickAsync_ValidTrackingId_UpdatesClickedAt()
    {
        // Arrange
        var analytic = _context.CommunicationAnalytics.First(a => a.ClickedAt == null);
        var request = new TrackLinkClickRequest
        {
            TrackingId = analytic.Id.ToString(),
            LinkUrl = "https://example.com"
        };

        // Act
        await _service.TrackLinkClickAsync(request);

        // Assert
        var updated = await _context.CommunicationAnalytics.FindAsync(analytic.Id);
        Assert.That(updated!.ClickedAt, Is.Not.Null);
    }

    [Test]
    public async Task TrackLinkClickAsync_AlreadyClicked_DoesNotUpdate()
    {
        // Arrange
        var analytic = _context.CommunicationAnalytics.First(a => a.ClickedAt != null);
        var originalClickedAt = analytic.ClickedAt;
        var request = new TrackLinkClickRequest
        {
            TrackingId = analytic.Id.ToString(),
            LinkUrl = "https://example.com"
        };

        // Act
        await _service.TrackLinkClickAsync(request);

        // Assert
        var updated = await _context.CommunicationAnalytics.FindAsync(analytic.Id);
        Assert.That(updated!.ClickedAt, Is.EqualTo(originalClickedAt));
    }

    [Test]
    public async Task TrackLinkClickAsync_InvalidTrackingId_LogsWarning()
    {
        // Arrange
        var request = new TrackLinkClickRequest
        {
            TrackingId = "invalid-id",
            LinkUrl = "https://example.com"
        };

        // Act
        await _service.TrackLinkClickAsync(request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Analytics record not found")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task TrackLinkClickAsync_LogsInformationOnSuccess()
    {
        // Arrange
        var analytic = _context.CommunicationAnalytics.First(a => a.ClickedAt == null);
        var request = new TrackLinkClickRequest
        {
            TrackingId = analytic.Id.ToString(),
            LinkUrl = "https://example.com/test"
        };

        // Act
        await _service.TrackLinkClickAsync(request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Tracked click")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region CreateAnalyticsRecordAsync Tests

    [Test]
    public async Task CreateAnalyticsRecordAsync_CreatesRecord()
    {
        // Arrange
        var newMemberId = 999;
        var trackingId = Guid.NewGuid().ToString();

        // Act
        await _service.CreateAnalyticsRecordAsync(_testCommunicationId, newMemberId, trackingId);

        // Assert
        var created = await _context.CommunicationAnalytics
            .FirstOrDefaultAsync(a => a.CommunicationId == _testCommunicationId && a.MemberId == newMemberId);
        Assert.That(created, Is.Not.Null);
    }

    [Test]
    public async Task CreateAnalyticsRecordAsync_SetsSentAtToUtcNow()
    {
        // Arrange
        var newMemberId = 888;
        var beforeCreate = DateTime.UtcNow;

        // Act
        await _service.CreateAnalyticsRecordAsync(_testCommunicationId, newMemberId, "tracking-id");
        var afterCreate = DateTime.UtcNow;

        // Assert
        var created = await _context.CommunicationAnalytics
            .FirstOrDefaultAsync(a => a.CommunicationId == _testCommunicationId && a.MemberId == newMemberId);
        Assert.That(created!.SentAt, Is.GreaterThanOrEqualTo(beforeCreate));
        Assert.That(created.SentAt, Is.LessThanOrEqualTo(afterCreate));
    }

    [Test]
    public async Task CreateAnalyticsRecordAsync_LogsInformation()
    {
        // Arrange
        var newMemberId = 777;

        // Act
        await _service.CreateAnalyticsRecordAsync(_testCommunicationId, newMemberId, "tracking-id");

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Created analytics record")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task CreateAnalyticsRecordAsync_MultipleCalls_CreatesSeparateRecords()
    {
        // Arrange
        var members = new[] { 111, 222, 333 };

        // Act
        foreach (var memberId in members)
        {
            await _service.CreateAnalyticsRecordAsync(_testCommunicationId, memberId, Guid.NewGuid().ToString());
        }

        // Assert
        var count = await _context.CommunicationAnalytics
            .CountAsync(a => a.CommunicationId == _testCommunicationId && members.Contains(a.MemberId));
        Assert.That(count, Is.EqualTo(3));
    }

    #endregion
}
