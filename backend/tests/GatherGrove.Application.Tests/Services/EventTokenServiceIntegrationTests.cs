using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class EventTokenServiceIntegrationTests
{
    private GatherGroveDbContext _context = null!;
    private EventTokenService _service = null!;
    private Mock<ILogger<EventTokenService>> _mockLogger = null!;

    [SetUp]
    public void Setup()
    {
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
        _context.Dispose();
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task TokenGenerationWorkflow_EndToEnd_SuccessfullyGeneratesAndValidates()
    {
        // Arrange - Create club and event
        var club = new Club
        {
            Name = "Integration Test Club",
            Tier = "Grow"
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var eventEntity = new Event
        {
            ClubId = club.Id,
            Name = "Integration Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Testing end-to-end workflow",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act - Generate token
        var token = await _service.GeneratePaymentTokenAsync(eventEntity.Id);

        // Assert - Token is generated
        Assert.That(token, Is.Not.Null.And.Not.Empty);
        Assert.That(token.Length, Is.GreaterThanOrEqualTo(32));

        // Act - Validate token
        var retrievedEvent = await _service.ValidatePaymentTokenAsync(token);

        // Assert - Event is retrieved with all details
        Assert.That(retrievedEvent, Is.Not.Null);
        Assert.That(retrievedEvent!.Id, Is.EqualTo(eventEntity.Id));
        Assert.That(retrievedEvent.Name, Is.EqualTo("Integration Test Event"));
        Assert.That(retrievedEvent.MemberPrice, Is.EqualTo(25.00m));
        Assert.That(retrievedEvent.NonMemberPrice, Is.EqualTo(50.00m));
        Assert.That(retrievedEvent.Club, Is.Not.Null);
        Assert.That(retrievedEvent.Club!.Name, Is.EqualTo("Integration Test Club"));
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task TokenValidation_RetrievesEventWithClubDetails_Successfully()
    {
        // Arrange - Create club with specific details
        var club = new Club
        {
            Name = "Premium Club",
            Tier = "Grow"
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var eventEntity = new Event
        {
            ClubId = club.Id,
            Name = "Premium Event",
            EventDateTime = DateTime.UtcNow.AddMonths(2),
            Location = "Premium Venue",
            Description = "Exclusive event",
            MemberPrice = 100.00m,
            NonMemberPrice = 150.00m,
            Currency = "USD"
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Generate token
        var token = await _service.GeneratePaymentTokenAsync(eventEntity.Id);

        // Act - Validate token and retrieve details
        var result = await _service.ValidatePaymentTokenAsync(token);

        // Assert - Club details are included
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Club, Is.Not.Null);
        Assert.That(result.Club!.Id, Is.EqualTo(club.Id));
        Assert.That(result.Club.Name, Is.EqualTo("Premium Club"));
        Assert.That(result.Club.Tier, Is.EqualTo("Grow"));
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task TokenRemainsValid_UntilEventDate_AndNotExpired()
    {
        // Arrange - Create event in the future
        var futureEventDate = DateTime.UtcNow.AddMonths(6);
        var club = new Club { Name = "Future Club", Tier = "Sprout" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var eventEntity = new Event
        {
            ClubId = club.Id,
            Name = "Future Event",
            EventDateTime = futureEventDate,
            Location = "Future Location",
            MemberPrice = 30.00m,
            NonMemberPrice = 45.00m
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act - Generate token
        var token = await _service.GeneratePaymentTokenAsync(eventEntity.Id);

        // Simulate passage of time (but still before event date)
        await Task.Delay(100); // Small delay to simulate time passing

        // Act - Validate token
        var result = await _service.ValidatePaymentTokenAsync(token);

        // Assert - Token is still valid
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(eventEntity.Id));
        Assert.That(result.EventDateTime, Is.EqualTo(futureEventDate).Within(TimeSpan.FromSeconds(1)));

        // Verify event date is in the future
        Assert.That(result.EventDateTime, Is.GreaterThan(DateTime.UtcNow));
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task RegenerateToken_InvalidatesOldToken_AndCreatesNewOne()
    {
        // Arrange - Create event
        var club = new Club { Name = "Regeneration Club", Tier = "Grow" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var eventEntity = new Event
        {
            ClubId = club.Id,
            Name = "Token Regeneration Test",
            EventDateTime = DateTime.UtcNow.AddDays(45),
            Location = "Test Location",
            MemberPrice = 20.00m,
            NonMemberPrice = 35.00m
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Act - Generate first token
        var oldToken = await _service.GeneratePaymentTokenAsync(eventEntity.Id);

        // Act - Regenerate token
        var newToken = await _service.RegeneratePaymentTokenAsync(eventEntity.Id);

        // Assert - Tokens are different
        Assert.That(oldToken, Is.Not.EqualTo(newToken));
        Assert.That(newToken, Is.Not.Null.And.Not.Empty);

        // Assert - Old token is no longer valid (returns null)
        var oldTokenResult = await _service.ValidatePaymentTokenAsync(oldToken);
        Assert.That(oldTokenResult, Is.Null, "Old token should be invalidated");

        // Assert - New token is valid
        var newTokenResult = await _service.ValidatePaymentTokenAsync(newToken);
        Assert.That(newTokenResult, Is.Not.Null);
        Assert.That(newTokenResult!.Id, Is.EqualTo(eventEntity.Id));
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task MultipleEvents_HaveUniqueTokens_NoCollisions()
    {
        // Arrange - Create club and multiple events
        var club = new Club { Name = "Multi-Event Club", Tier = "Grow" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var event1 = new Event
        {
            ClubId = club.Id,
            Name = "Event 1",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Location 1",
            MemberPrice = 10.00m,
            NonMemberPrice = 15.00m
        };

        var event2 = new Event
        {
            ClubId = club.Id,
            Name = "Event 2",
            EventDateTime = DateTime.UtcNow.AddDays(60),
            Location = "Location 2",
            MemberPrice = 20.00m,
            NonMemberPrice = 30.00m
        };

        var event3 = new Event
        {
            ClubId = club.Id,
            Name = "Event 3",
            EventDateTime = DateTime.UtcNow.AddDays(90),
            Location = "Location 3",
            MemberPrice = 30.00m,
            NonMemberPrice = 45.00m
        };

        _context.Events.AddRange(event1, event2, event3);
        await _context.SaveChangesAsync();

        // Act - Generate tokens for all events
        var token1 = await _service.GeneratePaymentTokenAsync(event1.Id);
        var token2 = await _service.GeneratePaymentTokenAsync(event2.Id);
        var token3 = await _service.GeneratePaymentTokenAsync(event3.Id);

        // Assert - All tokens are unique
        Assert.That(token1, Is.Not.EqualTo(token2));
        Assert.That(token1, Is.Not.EqualTo(token3));
        Assert.That(token2, Is.Not.EqualTo(token3));

        // Assert - Each token retrieves the correct event
        var result1 = await _service.ValidatePaymentTokenAsync(token1);
        var result2 = await _service.ValidatePaymentTokenAsync(token2);
        var result3 = await _service.ValidatePaymentTokenAsync(token3);

        Assert.That(result1!.Name, Is.EqualTo("Event 1"));
        Assert.That(result2!.Name, Is.EqualTo("Event 2"));
        Assert.That(result3!.Name, Is.EqualTo("Event 3"));
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task InvalidToken_ReturnsNull_DoesNotThrowException()
    {
        // Arrange - Invalid token that doesn't exist in database
        var invalidToken = "invalid_token_that_does_not_exist_in_database";

        // Act
        var result = await _service.ValidatePaymentTokenAsync(invalidToken);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task EmptyOrNullToken_ReturnsNull_Gracefully()
    {
        // Act & Assert - Empty token
        var emptyResult = await _service.ValidatePaymentTokenAsync("");
        Assert.That(emptyResult, Is.Null);

        // Act & Assert - Null token
        var nullResult = await _service.ValidatePaymentTokenAsync(null);
        Assert.That(nullResult, Is.Null);

        // Act & Assert - Whitespace token
        var whitespaceResult = await _service.ValidatePaymentTokenAsync("   ");
        Assert.That(whitespaceResult, Is.Null);
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task GenerateToken_ForNonExistentEvent_ThrowsArgumentException()
    {
        // Arrange
        var nonExistentEventId = 99999;

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.GeneratePaymentTokenAsync(nonExistentEventId));

        Assert.That(ex.Message, Does.Contain("not found"));
        Assert.That(ex.ParamName, Is.EqualTo("eventId"));
    }

    [Test]
    [Category("Integration")]
    [Category("PaymentLink")]
    public async Task TokenPersistence_SurvivestDatabaseRefresh_AndRemainsAccessible()
    {
        // Arrange - Create event and generate token
        var club = new Club { Name = "Persistence Club", Tier = "Sprout" };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var eventEntity = new Event
        {
            ClubId = club.Id,
            Name = "Persistence Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Persistence Location",
            MemberPrice = 15.00m,
            NonMemberPrice = 25.00m
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        var token = await _service.GeneratePaymentTokenAsync(eventEntity.Id);

        // Act - Simulate "refreshing" by detaching entity and re-fetching
        _context.Entry(eventEntity).State = EntityState.Detached;

        var refreshedEvent = await _service.ValidatePaymentTokenAsync(token);

        // Assert - Token still works after refresh
        Assert.That(refreshedEvent, Is.Not.Null);
        Assert.That(refreshedEvent!.Id, Is.EqualTo(eventEntity.Id));
        Assert.That(refreshedEvent.PaymentToken, Is.EqualTo(token));
    }
}

