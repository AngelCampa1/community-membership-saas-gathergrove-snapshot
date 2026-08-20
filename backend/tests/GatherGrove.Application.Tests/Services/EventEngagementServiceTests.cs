using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Unit tests for EventEngagementService
/// </summary>
[TestFixture]
public class EventEngagementServiceTests : IDisposable
{
    private GatherGroveDbContext _context;
    private Mock<IMemberEngagementService> _mockMemberEngagementService;
    private Mock<IEngagementScoringService> _mockEngagementScoringService;
    private Mock<ILogger<EventEngagementService>> _mockLogger;
    private EventEngagementService _service;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockMemberEngagementService = new Mock<IMemberEngagementService>();
        _mockEngagementScoringService = new Mock<IEngagementScoringService>();
        _mockLogger = new Mock<ILogger<EventEngagementService>>();

        _service = new EventEngagementService(
            _context,
            _mockMemberEngagementService.Object,
            _mockEngagementScoringService.Object,
            _mockLogger.Object
        );

        SeedTestData();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private void SeedTestData()
    {
        var club = new Club
        {
            Id = 1,
            Name = "Test Club",
            Tier = "Growth",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Regular",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member = new Member
        {
            Id = 1,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "John Doe",
            Email = "john@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddMonths(-6),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var eventEntity = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Monthly Meeting",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Community Center",
            Description = "Monthly club meeting",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);
        _context.Members.Add(member);
        _context.Events.Add(eventEntity);
        _context.SaveChanges();
    }

    [Test]
    public async Task RecordEventAttendanceAsync_ValidInput_CreatesAttendanceRecord()
    {
        // Arrange
        var eventId = 1;
        var memberId = 1;
        var notes = "Great event!";

        _mockMemberEngagementService
            .Setup(x => x.UpdateEngagementOnActivity(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<object>()))
            .ReturnsAsync(new MemberEngagementScore { Id = 1, MemberId = memberId, OverallScore = 85.5m });

        // Act
        var result = await _service.RecordEventAttendanceAsync(eventId, memberId, null, notes);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(eventId));
        Assert.That(result.MemberId, Is.EqualTo(memberId));
        Assert.That(result.Notes, Is.EqualTo(notes));

        var attendanceInDb = await _context.EventAttendances
            .FirstOrDefaultAsync(a => a.EventId == eventId && a.MemberId == memberId);
        Assert.That(attendanceInDb, Is.Not.Null);
    }

    [Test]
    public async Task RecordEventAttendanceAsync_DuplicateAttendance_ReturnsExistingRecord()
    {
        // Arrange
        var eventId = 1;
        var memberId = 1;

        // Create existing attendance record
        var existingAttendance = new EventAttendance
        {
            EventId = eventId,
            MemberId = memberId,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventAttendances.Add(existingAttendance);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.RecordEventAttendanceAsync(eventId, memberId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(existingAttendance.Id));
    }

    [Test]
    public async Task UpdateEventRsvpAsync_NewRsvp_CreatesRsvpRecord()
    {
        // Arrange
        var eventId = 1;
        var memberId = 1;
        var rsvpStatus = "Attending";

        _mockMemberEngagementService
            .Setup(x => x.UpdateEngagementOnActivity(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<object>()))
            .ReturnsAsync(new MemberEngagementScore { Id = 1, MemberId = memberId, OverallScore = 85.5m });

        // Act
        var result = await _service.UpdateEventRsvpAsync(eventId, memberId, rsvpStatus);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(eventId));
        Assert.That(result.MemberId, Is.EqualTo(memberId));
        Assert.That(result.RsvpStatus, Is.EqualTo(rsvpStatus));

        var rsvpInDb = await _context.EventRsvps
            .FirstOrDefaultAsync(r => r.EventId == eventId && r.MemberId == memberId);
        Assert.That(rsvpInDb, Is.Not.Null);
        Assert.That(rsvpInDb.RsvpStatus, Is.EqualTo(rsvpStatus));
    }

    [Test]
    public async Task UpdateEventRsvpAsync_ExistingRsvp_UpdatesRecord()
    {
        // Arrange
        var eventId = 1;
        var memberId = 1;
        var initialStatus = "NotAttending";
        var updatedStatus = "Attending";

        // Create existing RSVP
        var existingRsvp = new EventRsvp
        {
            EventId = eventId,
            MemberId = memberId,
            RsvpStatus = initialStatus,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(existingRsvp);
        await _context.SaveChangesAsync();

        _mockMemberEngagementService
            .Setup(x => x.UpdateEngagementOnActivity(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<object>()))
            .ReturnsAsync(new MemberEngagementScore { Id = 1, MemberId = memberId, OverallScore = 85.5m });

        // Act
        var result = await _service.UpdateEventRsvpAsync(eventId, memberId, updatedStatus);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.RsvpStatus, Is.EqualTo(updatedStatus));
    }

    [Test]
    public async Task CalculateEventEngagementScoreAsync_ValidEvent_ReturnsMetrics()
    {
        // Arrange
        var eventId = 1;
        var memberId = 1;

        // Add some test data
        _context.EventRsvps.Add(new EventRsvp
        {
            EventId = eventId,
            MemberId = memberId,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        _context.EventAttendances.Add(new EventAttendance
        {
            EventId = eventId,
            MemberId = memberId,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateEventEngagementScoreAsync(eventId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(eventId));
        Assert.That(result.EventName, Is.EqualTo("Monthly Meeting"));
        Assert.That(result.TotalRsvps, Is.EqualTo(1));
        Assert.That(result.TotalAttended, Is.EqualTo(1));
        Assert.That(result.RsvpRate > 0, Is.True);
        Assert.That(result.AttendanceRate > 0, Is.True);
        Assert.That(result.EngagementScore > 0, Is.True);
    }

    [Test]
    public async Task CalculateMemberEventScoreAsync_ValidMember_ReturnsScore()
    {
        // Arrange
        var memberId = 1;
        var eventId = 1;
        var cutoffDate = DateTime.UtcNow.AddDays(-30);

        // Add event in the past to be counted
        var pastEvent = new Event
        {
            Id = 2,
            ClubId = 1,
            Name = "Past Event",
            EventDateTime = cutoffDate.AddDays(15),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(pastEvent);

        _context.EventRsvps.Add(new EventRsvp
        {
            EventId = 2,
            MemberId = memberId,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        _context.EventAttendances.Add(new EventAttendance
        {
            EventId = 2,
            MemberId = memberId,
            AttendedAt = cutoffDate.AddDays(15),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // Act
        var result = await _service.CalculateMemberEventScoreAsync(memberId, 90);

        // Assert
        Assert.That(result > 0, Is.True);
        Assert.That(result <= 100, Is.True);
    }

    [Test]
    public async Task GetEventAttendanceAsync_ValidEventId_ReturnsAttendanceList()
    {
        // Arrange
        var eventId = 1;
        var memberId = 1;

        var attendance = new EventAttendance
        {
            EventId = eventId,
            MemberId = memberId,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventAttendanceAsync(eventId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].EventId, Is.EqualTo(eventId));
        Assert.That(result[0].MemberId, Is.EqualTo(memberId));
    }

    [Test]
    public async Task GetMemberAttendanceHistoryAsync_ValidMember_ReturnsHistory()
    {
        // Arrange
        var memberId = 1;
        var eventId = 1;

        var attendance = new EventAttendance
        {
            EventId = eventId,
            MemberId = memberId,
            AttendedAt = DateTime.UtcNow.AddDays(-10),
            CreatedAt = DateTime.UtcNow
        };
        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetMemberAttendanceHistoryAsync(memberId, 30);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].MemberId, Is.EqualTo(memberId));
    }

    [Test]
    public async Task PredictEventAttendanceAsync_ValidInputs_ReturnsPrediction()
    {
        // Arrange
        var eventId = 1;
        var memberId = 1;

        _mockMemberEngagementService
            .Setup(x => x.GetMemberEngagementScore(memberId))
            .ReturnsAsync(new MemberEngagementScore
            {
                Id = 1,
                MemberId = memberId,
                OverallScore = 75m,
                EventScore = 80m,
                EngagementLevel = "Green"
            });

        // Act
        var result = await _service.PredictEventAttendanceAsync(eventId, memberId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(eventId));
        Assert.That(result.MemberId, Is.EqualTo(memberId));
        Assert.That(result.AttendanceProbability >= 0 && result.AttendanceProbability <= 100, Is.True);
        Assert.That(result.PredictionConfidence, Is.Not.Null);
        Assert.That(result.InfluencingFactors, Is.Not.Null);
        Assert.That(result.FactorWeights, Is.Not.Null);
    }

    [Test]
    public async Task GetEventRecommendationsAsync_ValidMember_ReturnsRecommendations()
    {
        // Arrange
        var memberId = 1;
        var limit = 3;

        // Add future events
        var futureEvent = new Event
        {
            Id = 3,
            ClubId = 1,
            Name = "Future Event",
            EventDateTime = DateTime.UtcNow.AddDays(14),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(futureEvent);
        await _context.SaveChangesAsync();

        _mockMemberEngagementService
            .Setup(x => x.GetMemberEngagementScore(memberId))
            .ReturnsAsync(new MemberEngagementScore
            {
                Id = 1,
                MemberId = memberId,
                OverallScore = 75m,
                EventScore = 80m,
                EngagementLevel = "Green"
            });

        // Act
        var result = await _service.GetEventRecommendationsAsync(memberId, limit);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count <= limit, Is.True);

        if (result.Count > 0)
        {
            foreach (var r in result)
            {
                Assert.That(r.EventId > 0, Is.True);
                Assert.False(string.IsNullOrEmpty(r.EventName));
                Assert.That(r.RecommendationScore >= 0 && r.RecommendationScore <= 100, Is.True);
                Assert.That(r.AttendanceProbability >= 0 && r.AttendanceProbability <= 100, Is.True);
            }
        }
    }

    [Test]
    public async Task UpdateEngagementAfterEventActivityAsync_ValidActivity_CallsMemberEngagementService()
    {
        // Arrange
        var memberId = 1;
        var eventActivityType = "eventattendance";
        var eventId = 1;
        var metadata = new { test = "data" };

        _mockEngagementScoringService
            .Setup(x => x.CalculateActivityScore(eventActivityType, metadata))
            .Returns(10m);

        _mockMemberEngagementService
            .Setup(x => x.UpdateEngagementOnActivity(memberId, eventActivityType, It.IsAny<object>()))
            .ReturnsAsync(new MemberEngagementScore
            {
                Id = 1,
                MemberId = memberId,
                OverallScore = 85m
            });

        // Act
        var result = await _service.UpdateEngagementAfterEventActivityAsync(memberId, eventActivityType, eventId, metadata);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MemberId, Is.EqualTo(memberId));

        _mockEngagementScoringService.Verify(
            x => x.CalculateActivityScore(eventActivityType, metadata),
            Times.Once);

        _mockMemberEngagementService.Verify(
            x => x.UpdateEngagementOnActivity(memberId, eventActivityType, It.IsAny<object>()),
            Times.Once);
    }

    [Test]
    public async Task GetEventEngagementTrendsAsync_ValidClub_ReturnsTrends()
    {
        // Arrange
        var clubId = 1;
        var daysBack = 30;

        // Add past events with attendance
        var pastEvent = new Event
        {
            Id = 4,
            ClubId = clubId,
            Name = "Past Trend Event",
            EventDateTime = DateTime.UtcNow.AddDays(-10),
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(pastEvent);

        _context.EventRsvps.Add(new EventRsvp
        {
            EventId = 4,
            MemberId = 1,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetEventEngagementTrendsAsync(clubId, daysBack);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(clubId));
        Assert.That(result.DailyTrends, Is.Not.Null);
        Assert.That(result.AverageEngagementScore >= 0, Is.True);
    }

    [Test]
    [TestCase(-1, 1)]
    [TestCase(1, -1)]
    [TestCase(999, 1)]
    [TestCase(1, 999)]
    public async Task RecordEventAttendanceAsync_InvalidIds_ThrowsArgumentException(int eventId, int memberId)
    {
        // Act & Assert
        try
        {
            var result = await _service.RecordEventAttendanceAsync(eventId, memberId);
            Assert.Fail($"Expected ArgumentException but method completed successfully with result: {result}");
        }
        catch (ArgumentException ex)
        {
            Assert.That(ex.Message, Contains.Substring("ID"));
        }
    }

    [Test]
    [TestCase(-1, 1, "Attending")]
    [TestCase(1, -1, "Attending")]
    [TestCase(999, 1, "Attending")]
    [TestCase(1, 999, "Attending")]
    public async Task UpdateEventRsvpAsync_InvalidIds_ThrowsArgumentException(int eventId, int memberId, string rsvpStatus)
    {
        // Act & Assert
        try
        {
            var result = await _service.UpdateEventRsvpAsync(eventId, memberId, rsvpStatus);
            Assert.Fail($"Expected ArgumentException but method completed successfully with result: {result}");
        }
        catch (ArgumentException ex)
        {
            Assert.That(ex.Message, Contains.Substring("ID"));
        }
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}

/// <summary>
/// Integration tests for EventEngagementService demonstrating real-world usage scenarios
/// </summary>
public class EventEngagementServiceIntegrationTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly EventEngagementService _service;
    private readonly Mock<IMemberEngagementService> _mockMemberEngagementService;
    private readonly Mock<IEngagementScoringService> _mockEngagementScoringService;

    public EventEngagementServiceIntegrationTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockMemberEngagementService = new Mock<IMemberEngagementService>();
        _mockEngagementScoringService = new Mock<IEngagementScoringService>();
        var mockLogger = new Mock<ILogger<EventEngagementService>>();

        _service = new EventEngagementService(
            _context,
            _mockMemberEngagementService.Object,
            _mockEngagementScoringService.Object,
            mockLogger.Object
        );

        SeedCompleteTestData();
    }

    private void SeedCompleteTestData()
    {
        // Create club
        var club = new Club
        {
            Id = 1,
            Name = "Photography Club",
            Tier = "Growth",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);

        // Create membership type
        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            Name = "Regular",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);

        // Create multiple members
        var members = new[]
        {
            new Member
            {
                Id = 1,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "Alice Johnson",
                Email = "alice@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddMonths(-12),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Member
            {
                Id = 2,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "Bob Smith",
                Email = "bob@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddMonths(-6),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Member
            {
                Id = 3,
                ClubId = 1,
                MembershipTypeId = 1,
                FullName = "Carol Davis",
                Email = "carol@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddMonths(-3),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };
        _context.Members.AddRange(members);

        // Create multiple events
        var events = new[]
        {
            new Event
            {
                Id = 1,
                ClubId = 1,
                Name = "Nature Photography Workshop",
                EventDateTime = DateTime.UtcNow.AddDays(-30),
                Location = "Central Park",
                Description = "Learn nature photography techniques",
                CreatedAt = DateTime.UtcNow.AddDays(-35),
                UpdatedAt = DateTime.UtcNow.AddDays(-35)
            },
            new Event
            {
                Id = 2,
                ClubId = 1,
                Name = "Monthly Photo Review",
                EventDateTime = DateTime.UtcNow.AddDays(-15),
                Location = "Community Center",
                Description = "Review and discuss member photos",
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                UpdatedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Event
            {
                Id = 3,
                ClubId = 1,
                Name = "Portrait Photography Session",
                EventDateTime = DateTime.UtcNow.AddDays(7),
                Location = "Studio A",
                Description = "Hands-on portrait photography",
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                UpdatedAt = DateTime.UtcNow.AddDays(-7)
            }
        };
        _context.Events.AddRange(events);

        // Create RSVPs
        var rsvps = new[]
        {
            new EventRsvp { EventId = 1, MemberId = 1, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-32), UpdatedAt = DateTime.UtcNow.AddDays(-32) },
            new EventRsvp { EventId = 1, MemberId = 2, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-31), UpdatedAt = DateTime.UtcNow.AddDays(-31) },
            new EventRsvp { EventId = 1, MemberId = 3, RsvpStatus = "NotAttending", CreatedAt = DateTime.UtcNow.AddDays(-30), UpdatedAt = DateTime.UtcNow.AddDays(-30) },
            new EventRsvp { EventId = 2, MemberId = 1, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-17), UpdatedAt = DateTime.UtcNow.AddDays(-17) },
            new EventRsvp { EventId = 2, MemberId = 2, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-16), UpdatedAt = DateTime.UtcNow.AddDays(-16) },
            new EventRsvp { EventId = 3, MemberId = 1, RsvpStatus = "Attending", CreatedAt = DateTime.UtcNow.AddDays(-5), UpdatedAt = DateTime.UtcNow.AddDays(-5) }
        };
        _context.EventRsvps.AddRange(rsvps);

        // Create attendances
        var attendances = new[]
        {
            new EventAttendance { EventId = 1, MemberId = 1, AttendedAt = DateTime.UtcNow.AddDays(-30), CreatedAt = DateTime.UtcNow.AddDays(-30) },
            new EventAttendance { EventId = 1, MemberId = 2, AttendedAt = DateTime.UtcNow.AddDays(-30), CreatedAt = DateTime.UtcNow.AddDays(-30) },
            new EventAttendance { EventId = 2, MemberId = 1, AttendedAt = DateTime.UtcNow.AddDays(-15), CreatedAt = DateTime.UtcNow.AddDays(-15) }
        };
        _context.EventAttendances.AddRange(attendances);

        // Setup mock returns
        _mockMemberEngagementService
            .Setup(x => x.GetMemberEngagementScore(It.IsAny<int>()))
            .ReturnsAsync(new MemberEngagementScore
            {
                Id = 1,
                MemberId = 1,
                OverallScore = 85m,
                EventScore = 90m,
                EngagementLevel = "Green"
            });

        _mockEngagementScoringService
            .Setup(x => x.CalculateActivityScore(It.IsAny<string>(), It.IsAny<object>()))
            .Returns(10m);

        _context.SaveChanges();
    }

    [Test]
    public async Task CompleteEventEngagementWorkflow_RealisticScenario_WorksEndToEnd()
    {
        // Scenario: Alice attends a new event and we track the complete engagement workflow

        // Step 1: Alice RSVPs to the upcoming portrait session
        var rsvpResult = await _service.UpdateEventRsvpAsync(3, 1, "Attending");
        Assert.That(rsvpResult, Is.Not.Null);
        Assert.That(rsvpResult.RsvpStatus, Is.EqualTo("Attending"));

        // Step 2: Record Alice's attendance at the event
        var attendanceResult = await _service.RecordEventAttendanceAsync(3, 1, null, "Great session!");
        Assert.That(attendanceResult, Is.Not.Null);
        Assert.That(attendanceResult.Notes, Is.EqualTo("Great session!"));

        // Step 3: Calculate engagement metrics for the event
        var eventMetrics = await _service.CalculateEventEngagementScoreAsync(3);
        Assert.That(eventMetrics, Is.Not.Null);
        Assert.That(eventMetrics.EventName, Is.EqualTo("Portrait Photography Session"));
        Assert.That(eventMetrics.TotalAttended, Is.EqualTo(1));
        Assert.That(eventMetrics.EngagementScore > 0, Is.True);

        // Step 4: Get Alice's event engagement score
        var aliceEventScore = await _service.CalculateMemberEventScoreAsync(1, 90);
        Assert.That(aliceEventScore > 0, Is.True);

        // Step 5: Generate recommendations for Alice
        var recommendations = await _service.GetEventRecommendationsAsync(1, 3);
        Assert.That(recommendations, Is.Not.Null);

        // Step 6: Get club-wide engagement overview
        var clubOverview = await _service.GetClubEventOverviewAsync(1);
        Assert.That(clubOverview, Is.Not.Null);
        Assert.That(clubOverview.ClubName, Is.EqualTo("Photography Club"));
        Assert.That(clubOverview.TotalMembers, Is.EqualTo(3));
    }

    [Test]
    public async Task AnalyzeEventImpact_MultipleMembers_ProvidesDetailedAnalysis()
    {
        // Arrange: Create engagement history for analysis
        var engagementHistory = new[]
        {
            new MemberEngagementHistory
            {
                MemberId = 1,
                OverallScore = 70m,
                RecordedAt = DateTime.UtcNow.AddDays(-31),
                Level = EngagementLevel.Yellow
            },
            new MemberEngagementHistory
            {
                MemberId = 1,
                OverallScore = 85m,
                RecordedAt = DateTime.UtcNow.AddDays(-29),
                Level = EngagementLevel.Green
            }
        };
        _context.MemberEngagementHistories.AddRange(engagementHistory);
        await _context.SaveChangesAsync();

        // Act: Analyze impact of the first event
        var impactAnalysis = await _service.AnalyzeEventImpactAsync(1);

        // Assert
        Assert.That(impactAnalysis, Is.Not.Null);
        Assert.That(impactAnalysis.EventName, Is.EqualTo("Nature Photography Workshop"));
        Assert.That(impactAnalysis.MemberChanges.Count > 0, Is.True);
    }

    [Test]
    public async Task GetEventEngagementTrends_MultipleEvents_ShowsTrendOverTime()
    {
        // Act
        var trends = await _service.GetEventEngagementTrendsAsync(1, 45);

        // Assert
        Assert.That(trends, Is.Not.Null);
        Assert.That(trends.ClubId, Is.EqualTo(1));
        Assert.That(trends.DailyTrends.Count >= 0, Is.True);
        Assert.That(trends.TotalEvents >= 2, Is.True); // We have past events in seed data
        Assert.That(trends.AverageEngagementScore >= 0, Is.True);
    }

    [Test]
    public async Task PredictEventAttendance_BasedOnHistory_ProvidesReasonablePrediction()
    {
        // Act: Predict attendance for Alice at the upcoming event
        var prediction = await _service.PredictEventAttendanceAsync(3, 1);

        // Assert
        Assert.That(prediction, Is.Not.Null);
        Assert.That(prediction.EventId, Is.EqualTo(3));
        Assert.That(prediction.MemberId, Is.EqualTo(1));
        Assert.That(prediction.AttendanceProbability >= 0 && prediction.AttendanceProbability <= 100, Is.True);
        Assert.That(new[] { "High", "Medium", "Low" }, Contains.Item(prediction.PredictionConfidence));
        Assert.That(prediction.InfluencingFactors, Is.Not.Empty);
    }

    [Test]
    public async Task ProcessBatchEventEngagementUpdates_MultipleUpdates_ProcessesCorrectly()
    {
        // Arrange
        var updates = new List<EventEngagementUpdate>
        {
            new()
            {
                MemberId = 1,
                EventId = 1,
                ActivityType = "eventrsvp",
                ActivityTime = DateTime.UtcNow,
                Metadata = new Dictionary<string, object> { ["rsvpStatus"] = "Attending" }
            },
            new()
            {
                MemberId = 2,
                EventId = 1,
                ActivityType = "eventattendance",
                ActivityTime = DateTime.UtcNow,
                Metadata = new Dictionary<string, object> { ["attended"] = true }
            }
        };

        _mockMemberEngagementService
            .Setup(x => x.UpdateEngagementOnActivity(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<object>()))
            .ReturnsAsync(new MemberEngagementScore { OverallScore = 80m });

        // Act
        var result = await _service.ProcessBatchEventEngagementUpdatesAsync(updates);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalProcessed, Is.EqualTo(2));
        Assert.That(result.SuccessfulUpdates, Is.EqualTo(2));
        Assert.That(result.FailedUpdates, Is.EqualTo(0));
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}