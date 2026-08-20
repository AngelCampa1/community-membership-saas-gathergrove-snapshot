using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Application.Services.Security;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class EventServiceRsvpTests
{
    private GatherGroveDbContext _context;
    private EventService _eventService;
    private Mock<ILogger<EventService>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<EventService>>();
        var mockCommunicationsService = new Mock<ICommunicationsService>();
        var mockSanitizationService = new Mock<IContentSanitizationService>();
        _eventService = new EventService(_context, _mockLogger.Object, mockCommunicationsService.Object, mockSanitizationService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(Club club, Event testEvent, Member member)> SetupTestData()
    {
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Sprout"
        };

        var testEvent = new Event
        {
            Club = club,
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member = new Member
        {
            Club = club,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "123-456-7890",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        _context.Events.Add(testEvent);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        return (club, testEvent, member);
    }

    [Test]
    public async Task UpsertRsvpAsync_CreateNewRsvp_ReturnsEventRsvpResponse()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();
        var request = new UpdateRsvpRequest { RsvpStatus = "Attending" };

        // Act
        var result = await _eventService.UpsertRsvpAsync(club.Id, testEvent.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(testEvent.Id));
        Assert.That(result.MemberId, Is.EqualTo(member.Id));
        Assert.That(result.MemberName, Is.EqualTo(member.FullName));
        Assert.That(result.MemberEmail, Is.EqualTo(member.Email));
        Assert.That(result.RsvpStatus, Is.EqualTo("Attending"));
        Assert.That(result.CreatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(result.UpdatedAt, Is.Not.EqualTo(default(DateTime)));

        // Verify RSVP was created in database
        var rsvpInDb = await _context.EventRsvps.FirstOrDefaultAsync(r => r.EventId == testEvent.Id && r.MemberId == member.Id);
        Assert.That(rsvpInDb, Is.Not.Null);
        Assert.That(rsvpInDb.RsvpStatus, Is.EqualTo("Attending"));
    }

    [Test]
    public async Task UpsertRsvpAsync_UpdateExistingRsvp_ReturnsUpdatedEventRsvpResponse()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();

        // Create existing RSVP
        var existingRsvp = new EventRsvp
        {
            Event = testEvent,
            Member = member,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        _context.EventRsvps.Add(existingRsvp);
        await _context.SaveChangesAsync();

        var request = new UpdateRsvpRequest { RsvpStatus = "NotAttending" };

        // Act
        var result = await _eventService.UpsertRsvpAsync(club.Id, testEvent.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(existingRsvp.Id));
        Assert.That(result.RsvpStatus, Is.EqualTo("NotAttending"));
        Assert.That(result.UpdatedAt, Is.GreaterThan(result.CreatedAt));

        // Verify RSVP was updated in database
        var rsvpInDb = await _context.EventRsvps.FirstOrDefaultAsync(r => r.Id == existingRsvp.Id);
        Assert.That(rsvpInDb, Is.Not.Null);
        Assert.That(rsvpInDb.RsvpStatus, Is.EqualTo("NotAttending"));
    }

    [Test]
    public async Task UpsertRsvpAsync_EventNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (club, _, member) = await SetupTestData();
        var request = new UpdateRsvpRequest { RsvpStatus = "Attending" };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.UpsertRsvpAsync(club.Id, 9999, member.Id, request));

        Assert.That(ex.Message, Does.Contain("not found in club"));
    }

    [Test]
    public async Task UpsertRsvpAsync_MemberNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (club, testEvent, _) = await SetupTestData();
        var request = new UpdateRsvpRequest { RsvpStatus = "Attending" };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.UpsertRsvpAsync(club.Id, testEvent.Id, 9999, request));

        Assert.That(ex.Message, Does.Contain("not found in club"));
    }

    [Test]
    public async Task UpsertRsvpAsync_ClubMismatch_ThrowsArgumentException()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();
        var request = new UpdateRsvpRequest { RsvpStatus = "Attending" };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.UpsertRsvpAsync(9999, testEvent.Id, member.Id, request));

        Assert.That(ex.Message, Does.Contain("not found in club"));
    }

    [Test]
    public async Task GetEventRsvpsAsync_ValidEventWithRsvps_ReturnsAllRsvps()
    {
        // Arrange
        var (club, testEvent, member1) = await SetupTestData();

        var member2 = new Member
        {
            Club = club,
            FullName = "Jane Smith",
            Email = "jane.smith@example.com",
            PhoneNumber = "098-765-4321",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member2);

        var rsvp1 = new EventRsvp
        {
            Event = testEvent,
            Member = member1,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var rsvp2 = new EventRsvp
        {
            Event = testEvent,
            Member = member2,
            RsvpStatus = "NotAttending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.AddRange(rsvp1, rsvp2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventService.GetEventRsvpsAsync(club.Id, testEvent.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count, Is.EqualTo(2));

        var attendingRsvp = result.FirstOrDefault(r => r.RsvpStatus == "Attending");
        Assert.That(attendingRsvp, Is.Not.Null);
        Assert.That(attendingRsvp.MemberName, Is.EqualTo("John Doe"));
        Assert.That(attendingRsvp.MemberEmail, Is.EqualTo("john.doe@example.com"));

        var notAttendingRsvp = result.FirstOrDefault(r => r.RsvpStatus == "NotAttending");
        Assert.That(notAttendingRsvp, Is.Not.Null);
        Assert.That(notAttendingRsvp.MemberName, Is.EqualTo("Jane Smith"));
        Assert.That(notAttendingRsvp.MemberEmail, Is.EqualTo("jane.smith@example.com"));
    }

    [Test]
    public async Task GetEventRsvpsAsync_EventNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (club, _, _) = await SetupTestData();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.GetEventRsvpsAsync(club.Id, 9999));

        Assert.That(ex.Message, Does.Contain("not found in club"));
    }

    [Test]
    public async Task GetEventRsvpsAsync_EventInDifferentClub_ThrowsArgumentException()
    {
        // Arrange
        var (club, testEvent, _) = await SetupTestData();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.GetEventRsvpsAsync(9999, testEvent.Id));

        Assert.That(ex.Message, Does.Contain("not found in club"));
    }

    [Test]
    public async Task GetMemberRsvpAsync_ExistingRsvp_ReturnsEventRsvpResponse()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();

        var rsvp = new EventRsvp
        {
            Event = testEvent,
            Member = member,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventService.GetMemberRsvpAsync(club.Id, testEvent.Id, member.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.EventId, Is.EqualTo(testEvent.Id));
        Assert.That(result.MemberId, Is.EqualTo(member.Id));
        Assert.That(result.MemberName, Is.EqualTo(member.FullName));
        Assert.That(result.MemberEmail, Is.EqualTo(member.Email));
        Assert.That(result.RsvpStatus, Is.EqualTo("Attending"));
    }

    [Test]
    public async Task GetMemberRsvpAsync_NoRsvp_ReturnsNull()
    {
        // Arrange
        var (club, testEvent, member) = await SetupTestData();

        // Act
        var result = await _eventService.GetMemberRsvpAsync(club.Id, testEvent.Id, member.Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMemberRsvpAsync_EventNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (club, _, member) = await SetupTestData();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.GetMemberRsvpAsync(club.Id, 9999, member.Id));

        Assert.That(ex.Message, Does.Contain("not found in club"));
    }

    [Test]
    public async Task GetMemberRsvpAsync_MemberNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (club, testEvent, _) = await SetupTestData();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.GetMemberRsvpAsync(club.Id, testEvent.Id, 9999));

        Assert.That(ex.Message, Does.Contain("not found in club"));
    }

    [Test]
    public async Task GetEventByIdAsync_WithRsvps_IncludesRsvpCounts()
    {
        // Arrange
        var (club, testEvent, member1) = await SetupTestData();

        var member2 = new Member
        {
            Club = club,
            FullName = "Jane Smith",
            Email = "jane.smith@example.com",
            PhoneNumber = "098-765-4321",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member3 = new Member
        {
            Club = club,
            FullName = "Bob Johnson",
            Email = "bob.johnson@example.com",
            PhoneNumber = "555-123-4567",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(member2, member3);

        var rsvp1 = new EventRsvp
        {
            Event = testEvent,
            Member = member1,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var rsvp2 = new EventRsvp
        {
            Event = testEvent,
            Member = member2,
            RsvpStatus = "Attending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var rsvp3 = new EventRsvp
        {
            Event = testEvent,
            Member = member3,
            RsvpStatus = "NotAttending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.EventRsvps.AddRange(rsvp1, rsvp2, rsvp3);
        await _context.SaveChangesAsync();

        // Act
        var result = await _eventService.GetEventByIdAsync(club.Id, testEvent.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Rsvps, Is.Not.Null);
        Assert.That(result.Rsvps.Count, Is.EqualTo(3));
        Assert.That(result.AttendeeCount, Is.EqualTo(2)); // 2 attending
        Assert.That(result.TotalRsvpCount, Is.EqualTo(3)); // 3 total RSVPs
    }
}