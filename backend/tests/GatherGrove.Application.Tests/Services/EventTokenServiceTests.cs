using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// TDD Tests for EventTokenService - Payment Link Token Management
/// Category: TDD-RED Phase
/// Converted from xUnit to NUnit
/// </summary>
[TestFixture]
public class EventTokenServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<ILogger<EventTokenService>> _mockLogger;
    private EventTokenService _service;

    [SetUp]
    public void SetUp()
    {
        // Arrange: Set up in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<EventTokenService>>();
        _service = new EventTokenService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenGeneration")]
    public async Task GeneratePaymentToken_ForNewEvent_ShouldCreateUniqueToken()
    {
        // Arrange
        var clubId = 1;
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = clubId,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            MemberPrice = 10.00m,
            NonMemberPrice = 15.00m
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var token = await _service.GeneratePaymentTokenAsync(eventEntity.Id);

        // Assert
        Assert.That(token, Is.Not.Null);
        Assert.That(token, Is.Not.Empty);
        Assert.That(token.Length, Is.GreaterThanOrEqualTo(32), "Token should be at least 32 characters for security");
        Assert.That(token, Does.Match(@"^[A-Za-z0-9_-]+$")); // URL-safe characters only
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenGeneration")]
    public async Task GeneratePaymentToken_CalledTwice_ShouldGenerateDifferentTokens()
    {
        // Arrange
        var clubId = 1;
        var event1 = new Event { Id = 1, ClubId = clubId, Name = "Event 1", EventDateTime = DateTime.UtcNow, Location = "Loc 1" };
        var event2 = new Event { Id = 2, ClubId = clubId, Name = "Event 2", EventDateTime = DateTime.UtcNow, Location = "Loc 2" };
        _context.Events.AddRange(event1, event2);
        await _context.SaveChangesAsync();

        // Act
        var token1 = await _service.GeneratePaymentTokenAsync(event1.Id);
        var token2 = await _service.GeneratePaymentTokenAsync(event2.Id);

        // Assert
        Assert.That(token1, Is.Not.EqualTo(token2));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenValidation")]
    public async Task ValidatePaymentToken_WithValidToken_ShouldReturnEvent()
    {
        // Arrange
        var clubId = 1;
        var club = new Club { Id = clubId, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event
        {
            Id = 1,
            ClubId = clubId,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            MemberPrice = 10.00m,
            NonMemberPrice = 15.00m,
            PaymentToken = "valid_token_12345678901234567890"
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ValidatePaymentTokenAsync("valid_token_12345678901234567890");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(eventEntity.Id));
        Assert.That(result.Name, Is.EqualTo("Test Event"));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenValidation")]
    public async Task ValidatePaymentToken_WithInvalidToken_ShouldReturnNull()
    {
        // Arrange
        var clubId = 1;
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = clubId,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            PaymentToken = "valid_token_12345678901234567890"
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ValidatePaymentTokenAsync("invalid_token");

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenValidation")]
    public async Task ValidatePaymentToken_ForPastEvent_ShouldStillReturnEvent()
    {
        // Arrange: Past events should still be accessible via token (for historical records)
        var clubId = 1;
        var club = new Club { Id = clubId, Name = "Test Club" };
        _context.Clubs.Add(club);

        var eventEntity = new Event
        {
            Id = 1,
            ClubId = clubId,
            Name = "Past Event",
            EventDateTime = DateTime.UtcNow.AddDays(-30),
            Location = "Test Location",
            PaymentToken = "past_event_token_12345678901234567890"
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ValidatePaymentTokenAsync("past_event_token_12345678901234567890");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Name, Is.EqualTo("Past Event"));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenGeneration")]
    public async Task GeneratePaymentToken_ForNonExistentEvent_ShouldThrowException()
    {
        // Arrange
        var nonExistentEventId = 999;

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(async () =>
        {
            await _service.GeneratePaymentTokenAsync(nonExistentEventId);
        });
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenUpdate")]
    public async Task UpdatePaymentToken_ForExistingEvent_ShouldUpdateToken()
    {
        // Arrange
        var clubId = 1;
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = clubId,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            PaymentToken = "old_token_12345678901234567890"
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var newToken = await _service.RegeneratePaymentTokenAsync(eventEntity.Id);

        // Assert
        Assert.That(newToken, Is.Not.Null);
        Assert.That(newToken, Is.Not.EqualTo("old_token_12345678901234567890"));

        var updatedEvent = await _context.Events.FindAsync(eventEntity.Id);
        Assert.That(updatedEvent.PaymentToken, Is.EqualTo(newToken));
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenSecurity")]
    public async Task GeneratePaymentToken_ShouldGenerateCryptographicallySecureToken()
    {
        // Arrange
        var clubId = 1;
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = clubId,
            Name = "Security Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location"
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var token = await _service.GeneratePaymentTokenAsync(eventEntity.Id);

        // Assert - Check token characteristics
        Assert.That(token, Is.Not.Null);
        Assert.That(token.Length, Is.GreaterThanOrEqualTo(32), "Token should be at least 32 characters");
        Assert.That(token, Does.Not.Contain(" ")); // No spaces
        Assert.That(token, Does.Not.Contain("+")); // URL-safe
        Assert.That(token, Does.Not.Contain("/")); // URL-safe
        Assert.That(token, Does.Not.Contain("=")); // No padding
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenRetrieval")]
    public async Task GetEventByToken_WithValidToken_ShouldIncludePricingInfo()
    {
        // Arrange
        var clubId = 1;
        var club = new Club { Id = clubId, Name = "Test Club" };
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = clubId,
            Name = "Priced Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            Description = "Event Description",
            MemberPrice = 20.00m,
            NonMemberPrice = 30.00m,
            PaymentToken = "pricing_token_12345678901234567890",
            Club = club
        };
        _context.Clubs.Add(club);
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ValidatePaymentTokenAsync("pricing_token_12345678901234567890");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.MemberPrice, Is.EqualTo(20.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(30.00m));
        Assert.That(result.IsFree, Is.False);
    }

    [Test]
    [Category("TDD-RED")]
    [Category("TokenValidation")]
    public async Task ValidatePaymentToken_WithNullOrEmptyToken_ShouldReturnNull()
    {
        // Act & Assert
        Assert.That(await _service.ValidatePaymentTokenAsync(null), Is.Null);
        Assert.That(await _service.ValidatePaymentTokenAsync(string.Empty), Is.Null);
        Assert.That(await _service.ValidatePaymentTokenAsync("   "), Is.Null);
    }
}