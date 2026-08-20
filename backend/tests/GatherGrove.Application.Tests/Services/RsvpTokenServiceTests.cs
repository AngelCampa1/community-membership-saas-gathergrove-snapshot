using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NUnit.Framework;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class RsvpTokenServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<IEventService> _mockEventService;
    private Mock<ILogger<RsvpTokenService>> _mockLogger;
    private RsvpTokenService _rsvpTokenService;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockEventService = new Mock<IEventService>();
        _mockLogger = new Mock<ILogger<RsvpTokenService>>();
        _rsvpTokenService = new RsvpTokenService(_context, _mockEventService.Object, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User user, Club club, Event testEvent, Member member)> CreateTestDataAsync()
    {
        var user = new User
        {
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Sprout",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var testEvent = new Event
        {
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Test Description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Name = "Regular",
            Description = "Regular membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member = new Member
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Set up relationships
        testEvent.Club = club;
        testEvent.ClubId = club.Id;
        membershipType.Club = club;
        membershipType.ClubId = club.Id;
        member.Club = club;
        member.ClubId = club.Id;
        member.MembershipType = membershipType;
        member.MembershipTypeId = membershipType.Id;

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        _context.Events.Add(testEvent);
        _context.MembershipTypes.Add(membershipType);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        return (user, club, testEvent, member);
    }

    [Test]
    public async Task GenerateRsvpTokensForEventAsync_ValidEvent_GeneratesTokensForAllActiveMembers()
    {
        // Arrange
        var (user, club, testEvent, member) = await CreateTestDataAsync();

        // Act
        var result = await _rsvpTokenService.GenerateRsvpTokensForEventAsync(club.Id, testEvent.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result, Contains.Key(member.Id));
        Assert.That(result[member.Id], Contains.Key("Attending"));
        Assert.That(result[member.Id], Contains.Key("NotAttending"));

        // Verify tokens are different
        Assert.That(result[member.Id]["Attending"], Is.Not.EqualTo(result[member.Id]["NotAttending"]));

        // Verify tokens were saved to database
        var tokensInDb = await _context.RsvpTokens.Where(rt => rt.EventId == testEvent.Id && rt.MemberId == member.Id).ToListAsync();
        Assert.That(tokensInDb, Has.Count.EqualTo(2));

        var attendingToken = tokensInDb.FirstOrDefault(rt => rt.IntendedRsvpStatus == "Attending");
        var notAttendingToken = tokensInDb.FirstOrDefault(rt => rt.IntendedRsvpStatus == "NotAttending");

        Assert.That(attendingToken, Is.Not.Null);
        Assert.That(notAttendingToken, Is.Not.Null);
        Assert.That(attendingToken.ExpiresAt, Is.EqualTo(testEvent.EventDateTime));
        Assert.That(notAttendingToken.ExpiresAt, Is.EqualTo(testEvent.EventDateTime));
        Assert.That(attendingToken.IsUsed, Is.False);
        Assert.That(notAttendingToken.IsUsed, Is.False);
    }

    [Test]
    public async Task GenerateRsvpTokensForEventAsync_EventNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (user, club, testEvent, member) = await CreateTestDataAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _rsvpTokenService.GenerateRsvpTokensForEventAsync(club.Id, 999));
        Assert.That(ex.Message, Does.Contain("Event 999 not found in club"));
    }

    [Test]
    public async Task GenerateRsvpTokensForEventAsync_OnlyActiveMembers_GeneratesTokensForActiveMembersOnly()
    {
        // Arrange
        var (user, club, testEvent, activeMember) = await CreateTestDataAsync();

        // Add an inactive member
        var membershipType = await _context.MembershipTypes.FirstAsync();
        var inactiveMember = new Member
        {
            FullName = "Inactive Member",
            Email = "inactive@example.com",
            Status = "Inactive",
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(inactiveMember);
        await _context.SaveChangesAsync();

        // Act
        var result = await _rsvpTokenService.GenerateRsvpTokensForEventAsync(club.Id, testEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result, Contains.Key(activeMember.Id));
        Assert.That(result, Does.Not.ContainKey(inactiveMember.Id));
    }

    [Test]
    public async Task ProcessRsvpViaTokenAsync_ValidToken_ProcessesRsvpSuccessfully()
    {
        // Arrange
        var (user, club, testEvent, member) = await CreateTestDataAsync();

        var rsvpToken = new RsvpToken
        {
            TokenValue = "valid-token-123",
            MemberId = member.Id,
            EventId = testEvent.Id,
            IntendedRsvpStatus = "Attending",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow,
            Member = member,
            Event = testEvent
        };
        _context.RsvpTokens.Add(rsvpToken);
        await _context.SaveChangesAsync();

        // Mock the event service call
        _mockEventService.Setup(es => es.UpsertRsvpAsync(club.Id, testEvent.Id, member.Id, It.IsAny<UpdateRsvpRequest>()))
            .ReturnsAsync(new EventRsvpResponse
            {
                Id = 1,
                EventId = testEvent.Id,
                MemberId = member.Id,
                RsvpStatus = "Attending",
                MemberName = member.FullName,
                MemberEmail = member.Email
            });

        // Act
        var result = await _rsvpTokenService.ProcessRsvpViaTokenAsync("valid-token-123");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.True);
        Assert.That(result.MemberName, Is.EqualTo(member.FullName));
        Assert.That(result.EventName, Is.EqualTo(testEvent.Name));
        Assert.That(result.RsvpStatus, Is.EqualTo("Attending"));
        Assert.That(result.Message, Does.Contain("Thank you, John Doe!"));

        // Verify token was marked as used
        var tokenInDb = await _context.RsvpTokens.FirstAsync(rt => rt.TokenValue == "valid-token-123");
        Assert.That(tokenInDb.IsUsed, Is.True);

        // Verify event service was called
        _mockEventService.Verify(es => es.UpsertRsvpAsync(club.Id, testEvent.Id, member.Id,
            It.Is<UpdateRsvpRequest>(req => req.RsvpStatus == "Attending")), Times.Once);
    }

    [Test]
    public async Task ProcessRsvpViaTokenAsync_TokenNotFound_ReturnsFailureResponse()
    {
        // Act
        var result = await _rsvpTokenService.ProcessRsvpViaTokenAsync("non-existent-token");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("This RSVP link is no longer valid or has already been used."));
    }

    [Test]
    public async Task ProcessRsvpViaTokenAsync_ExpiredToken_ReturnsFailureResponse()
    {
        // Arrange
        var (user, club, testEvent, member) = await CreateTestDataAsync();

        var expiredToken = new RsvpToken
        {
            TokenValue = "expired-token-123",
            MemberId = member.Id,
            EventId = testEvent.Id,
            IntendedRsvpStatus = "Attending",
            ExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired
            IsUsed = false,
            CreatedAt = DateTime.UtcNow,
            Member = member,
            Event = testEvent
        };
        _context.RsvpTokens.Add(expiredToken);
        await _context.SaveChangesAsync();

        // Act
        var result = await _rsvpTokenService.ProcessRsvpViaTokenAsync("expired-token-123");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("This RSVP link has expired."));
    }

    [Test]
    public async Task ProcessRsvpViaTokenAsync_UsedToken_ReturnsFailureResponse()
    {
        // Arrange
        var (user, club, testEvent, member) = await CreateTestDataAsync();

        var usedToken = new RsvpToken
        {
            TokenValue = "used-token-123",
            MemberId = member.Id,
            EventId = testEvent.Id,
            IntendedRsvpStatus = "Attending",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            IsUsed = true, // Already used
            CreatedAt = DateTime.UtcNow,
            Member = member,
            Event = testEvent
        };
        _context.RsvpTokens.Add(usedToken);
        await _context.SaveChangesAsync();

        // Act
        var result = await _rsvpTokenService.ProcessRsvpViaTokenAsync("used-token-123");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("This RSVP link has already been used."));
    }

    [Test]
    public async Task ProcessRsvpViaTokenAsync_EventServiceThrows_ReturnsFailureResponse()
    {
        // Arrange
        var (user, club, testEvent, member) = await CreateTestDataAsync();

        var rsvpToken = new RsvpToken
        {
            TokenValue = "error-token-123",
            MemberId = member.Id,
            EventId = testEvent.Id,
            IntendedRsvpStatus = "Attending",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow,
            Member = member,
            Event = testEvent
        };
        _context.RsvpTokens.Add(rsvpToken);
        await _context.SaveChangesAsync();

        // Mock the event service to throw an exception
        _mockEventService.Setup(es => es.UpsertRsvpAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<UpdateRsvpRequest>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _rsvpTokenService.ProcessRsvpViaTokenAsync("error-token-123");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("There was an error processing your RSVP. Please try again later."));
    }

    [Test]
    public async Task CleanupExpiredTokensAsync_ExpiredTokensExist_RemovesExpiredTokens()
    {
        // Arrange
        var (user, club, testEvent, member) = await CreateTestDataAsync();

        var expiredToken1 = new RsvpToken
        {
            TokenValue = "expired-token-1",
            MemberId = member.Id,
            EventId = testEvent.Id,
            IntendedRsvpStatus = "Attending",
            ExpiresAt = DateTime.UtcNow.AddHours(-1),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        var expiredToken2 = new RsvpToken
        {
            TokenValue = "expired-token-2",
            MemberId = member.Id,
            EventId = testEvent.Id,
            IntendedRsvpStatus = "NotAttending",
            ExpiresAt = DateTime.UtcNow.AddHours(-2),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        var validToken = new RsvpToken
        {
            TokenValue = "valid-token",
            MemberId = member.Id,
            EventId = testEvent.Id,
            IntendedRsvpStatus = "Attending",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.RsvpTokens.AddRange(expiredToken1, expiredToken2, validToken);
        await _context.SaveChangesAsync();

        // Act
        var cleanedCount = await _rsvpTokenService.CleanupExpiredTokensAsync();

        // Assert
        Assert.That(cleanedCount, Is.EqualTo(2));

        var remainingTokens = await _context.RsvpTokens.ToListAsync();
        Assert.That(remainingTokens, Has.Count.EqualTo(1));
        Assert.That(remainingTokens[0].TokenValue, Is.EqualTo("valid-token"));
    }

    [Test]
    public async Task CleanupExpiredTokensAsync_NoExpiredTokens_ReturnsZero()
    {
        // Arrange
        var (user, club, testEvent, member) = await CreateTestDataAsync();

        var validToken = new RsvpToken
        {
            TokenValue = "valid-token",
            MemberId = member.Id,
            EventId = testEvent.Id,
            IntendedRsvpStatus = "Attending",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.RsvpTokens.Add(validToken);
        await _context.SaveChangesAsync();

        // Act
        var cleanedCount = await _rsvpTokenService.CleanupExpiredTokensAsync();

        // Assert
        Assert.That(cleanedCount, Is.EqualTo(0));

        var remainingTokens = await _context.RsvpTokens.ToListAsync();
        Assert.That(remainingTokens, Has.Count.EqualTo(1));
    }
}