using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Application.Services.Security;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for event pricing functionality in EventService
/// </summary>
[TestFixture]
public class EventServicePricingTests
{
    private GatherGroveDbContext _context = null!;
    private EventService _eventService = null!;
    private Mock<ILogger<EventService>> _mockLogger = null!;
    private Mock<ICommunicationsService> _mockCommunicationsService = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_EventPricing_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<EventService>>();
        _mockCommunicationsService = new Mock<ICommunicationsService>();
        var mockSanitizationService = new Mock<IContentSanitizationService>();
        // Setup mock to return input HTML unchanged (for testing purposes)
        mockSanitizationService
            .Setup(x => x.SanitizeHtml(It.IsAny<string>(), It.IsAny<SanitizationLevel>()))
            .Returns((string html, SanitizationLevel level) => html);
        _eventService = new EventService(_context, _mockLogger.Object, _mockCommunicationsService.Object, mockSanitizationService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private async Task<Club> CreateTestClubAsync()
    {
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow"
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    #region Create Event Pricing Tests

    [Test]
    public async Task CreateEventAsync_FreeEvent_BothPricesNull_ReturnsIsFreeTrue()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Free Community Meetup",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Community Center",
            Description = "Free event for all members",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Assert
        Assert.That(result.IsFree, Is.True);
        Assert.That(result.IsPaid, Is.False);
        Assert.That(result.MemberPrice, Is.EqualTo(0.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(0.00m));
    }

    [Test]
    public async Task CreateEventAsync_FreeEvent_BothPricesZero_ReturnsIsFreeTrue()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Free Workshop",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Main Hall",
            Description = "Free workshop for everyone",
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsFree = true
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Assert
        Assert.That(result.IsFree, Is.True);
        Assert.That(result.IsPaid, Is.False);
        Assert.That(result.MemberPrice, Is.EqualTo(0.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(0.00m));
    }

    [Test]
    public async Task CreateEventAsync_PaidEvent_WithMemberAndNonMemberPrices_ReturnsIsPaidTrue()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Annual Gala",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Grand Ballroom",
            Description = "Premium event with tiered pricing",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            IsFree = false
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Assert
        Assert.That(result.IsPaid, Is.True);
        Assert.That(result.IsFree, Is.False);
        Assert.That(result.MemberPrice, Is.EqualTo(25.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(50.00m));
    }

    [Test]
    public async Task CreateEventAsync_EventWithOnlyMemberPrice_ReturnsCorrectPricing()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Members Only Event",
            EventDateTime = DateTime.Now.AddDays(14),
            Location = "Members Lounge",
            Description = "Exclusive event for members",
            MemberPrice = 15.00m,
            NonMemberPrice = null,
            IsFree = false
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Assert
        Assert.That(result.MemberPrice, Is.EqualTo(15.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(0.00m)); // Defaults to 0.00
        Assert.That(result.IsPaid, Is.True);
    }

    [Test]
    public async Task CreateEventAsync_EventWithOnlyNonMemberPrice_ReturnsCorrectPricing()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Public Open House",
            EventDateTime = DateTime.Now.AddDays(14),
            Location = "Main Building",
            Description = "Free for members, paid for non-members",
            MemberPrice = null,
            NonMemberPrice = 10.00m,
            IsFree = false
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Assert
        Assert.That(result.MemberPrice, Is.EqualTo(0.00m)); // Defaults to 0.00
        Assert.That(result.NonMemberPrice, Is.EqualTo(10.00m));
        Assert.That(result.IsPaid, Is.True);
    }

    [Test]
    public async Task CreateEventAsync_MemberPriceGreaterThanNonMemberPrice_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Invalid Pricing Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "This should fail validation",
            MemberPrice = 100.00m,
            NonMemberPrice = 50.00m, // Less than member price - invalid
            IsFree = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.CreateEventAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("Member price cannot be greater than non-member price"));
    }

    [Test]
    public async Task CreateEventAsync_NegativeMemberPrice_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Invalid Pricing Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "This should fail validation",
            MemberPrice = -10.00m, // Negative price - invalid
            NonMemberPrice = 20.00m,
            IsFree = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.CreateEventAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("Member price cannot be negative"));
    }

    [Test]
    public async Task CreateEventAsync_NegativeNonMemberPrice_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Invalid Pricing Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "This should fail validation",
            MemberPrice = 10.00m,
            NonMemberPrice = -20.00m, // Negative price - invalid
            IsFree = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.CreateEventAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("Non-member price cannot be negative"));
    }

    [Test]
    public async Task CreateEventAsync_MemberPriceExceedsMaximum_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Expensive Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "This should fail validation",
            MemberPrice = 15000.00m, // Exceeds $10,000 limit
            NonMemberPrice = 20000.00m,
            IsFree = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.CreateEventAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("Price cannot exceed"));
    }

    [Test]
    public async Task CreateEventAsync_NonMemberPriceExceedsMaximum_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Expensive Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "This should fail validation",
            MemberPrice = 5000.00m,
            NonMemberPrice = 15000.00m, // Exceeds $10,000 limit
            IsFree = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.CreateEventAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("Price cannot exceed"));
    }

    [Test]
    public async Task CreateEventAsync_ValidMaximumPrices_CreatesEventSuccessfully()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Premium Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Luxury Venue",
            Description = "High-end event at maximum pricing",
            MemberPrice = 9999.99m,
            NonMemberPrice = 10000.00m, // Exactly at limit
            IsFree = false
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Assert
        Assert.That(result.MemberPrice, Is.EqualTo(9999.99m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(10000.00m));
        Assert.That(result.IsPaid, Is.True);
    }

    [Test]
    public async Task CreateEventAsync_PriceWithValidDecimalPlaces_CreatesEventSuccessfully()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Precise Pricing Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Conference Center",
            Description = "Event with precise decimal pricing",
            MemberPrice = 24.99m,
            NonMemberPrice = 49.95m,
            IsFree = false
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Assert
        Assert.That(result.MemberPrice, Is.EqualTo(24.99m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(49.95m));
    }

    #endregion

    #region Update Event Pricing Tests

    [Test]
    public async Task UpdateEventAsync_UpdatePricingBeforeEventDate_UpdatesSuccessfully()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var createRequest = new CreateEventRequest
        {
            Name = "Future Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Convention Center",
            Description = "Event with pricing to be updated",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            IsFree = false
        };

        var createdEvent = await _eventService.CreateEventAsync(club.Id, createRequest);

        var updateRequest = new UpdateEventRequest
        {
            Name = "Future Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Convention Center",
            Description = "Event with pricing to be updated",
            MemberPrice = 30.00m, // Updated price
            NonMemberPrice = 60.00m, // Updated price
            IsFree = false
        };

        // Act
        var result = await _eventService.UpdateEventAsync(club.Id, createdEvent.Id, updateRequest);

        // Assert
        Assert.That(result.MemberPrice, Is.EqualTo(30.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(60.00m));
    }

    [Test]
    public async Task UpdateEventAsync_ChangeFromPaidToFree_UpdatesSuccessfully()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var createRequest = new CreateEventRequest
        {
            Name = "Originally Paid Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Event Hall",
            Description = "This will become free",
            MemberPrice = 20.00m,
            NonMemberPrice = 40.00m,
            IsFree = false
        };

        var createdEvent = await _eventService.CreateEventAsync(club.Id, createRequest);

        var updateRequest = new UpdateEventRequest
        {
            Name = "Originally Paid Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Event Hall",
            Description = "This will become free",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true
        };

        // Act
        var result = await _eventService.UpdateEventAsync(club.Id, createdEvent.Id, updateRequest);

        // Assert
        Assert.That(result.IsFree, Is.True);
        Assert.That(result.IsPaid, Is.False);
        Assert.That(result.MemberPrice, Is.EqualTo(0.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(0.00m));
    }

    [Test]
    public async Task UpdateEventAsync_ChangeFromFreeToPaid_UpdatesSuccessfully()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var createRequest = new CreateEventRequest
        {
            Name = "Originally Free Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Community Hall",
            Description = "This will become paid",
            MemberPrice = null,
            NonMemberPrice = null,
            IsFree = true
        };

        var createdEvent = await _eventService.CreateEventAsync(club.Id, createRequest);

        var updateRequest = new UpdateEventRequest
        {
            Name = "Originally Free Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Community Hall",
            Description = "This will become paid",
            MemberPrice = 15.00m,
            NonMemberPrice = 30.00m,
            IsFree = false
        };

        // Act
        var result = await _eventService.UpdateEventAsync(club.Id, createdEvent.Id, updateRequest);

        // Assert
        Assert.That(result.IsPaid, Is.True);
        Assert.That(result.IsFree, Is.False);
        Assert.That(result.MemberPrice, Is.EqualTo(15.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(30.00m));
    }

    [Test]
    public async Task UpdateEventAsync_InvalidPricing_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var createRequest = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            Description = "Test event",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            IsFree = false
        };

        var createdEvent = await _eventService.CreateEventAsync(club.Id, createRequest);

        var updateRequest = new UpdateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(30),
            Location = "Test Location",
            Description = "Test event",
            MemberPrice = 100.00m, // Greater than non-member price
            NonMemberPrice = 50.00m,
            IsFree = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.UpdateEventAsync(club.Id, createdEvent.Id, updateRequest));

        Assert.That(ex.Message, Does.Contain("Member price cannot be greater than non-member price"));
    }

    #endregion

    #region Computed Properties Tests

    [Test]
    public async Task CreateEventAsync_VerifyIsFreeComputedProperty_WhenBothPricesAreZero()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Free Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Public Park",
            Description = "Completely free event",
            MemberPrice = 0.00m,
            NonMemberPrice = 0.00m,
            IsFree = true
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Get the event from database to verify entity computed property
        var eventEntity = await _context.Events.FindAsync(result.Id);

        // Assert
        Assert.That(result.IsFree, Is.True);
        Assert.That(eventEntity!.IsFree, Is.True);
    }

    [Test]
    public async Task CreateEventAsync_VerifyIsPaidComputedProperty_WhenEitherPriceIsNonZero()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Paid Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Conference Room",
            Description = "Event with pricing",
            MemberPrice = 10.00m,
            NonMemberPrice = 20.00m,
            IsFree = false
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Get the event from database to verify entity computed property
        var eventEntity = await _context.Events.FindAsync(result.Id);

        // Assert
        Assert.That(result.IsPaid, Is.True);
        Assert.That(eventEntity!.IsPaid, Is.True);
    }

    #endregion

    #region Edge Cases

    [Test]
    public async Task CreateEventAsync_EqualMemberAndNonMemberPrices_CreatesEventSuccessfully()
    {
        // Arrange
        var club = await CreateTestClubAsync();
        var request = new CreateEventRequest
        {
            Name = "Equal Pricing Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Fairness Hall",
            Description = "Same price for everyone",
            MemberPrice = 25.00m,
            NonMemberPrice = 25.00m,
            IsFree = false
        };

        // Act
        var result = await _eventService.CreateEventAsync(club.Id, request);

        // Assert
        Assert.That(result.MemberPrice, Is.EqualTo(25.00m));
        Assert.That(result.NonMemberPrice, Is.EqualTo(25.00m));
        Assert.That(result.IsPaid, Is.True);
    }

    [Test]
    public async Task CreateEventAsync_NonExistentClub_ThrowsArgumentException()
    {
        // Arrange
        var nonExistentClubId = 999999;
        var request = new CreateEventRequest
        {
            Name = "Test Event",
            EventDateTime = DateTime.Now.AddDays(7),
            Location = "Test Location",
            Description = "Test event",
            MemberPrice = 10.00m,
            NonMemberPrice = 20.00m,
            IsFree = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _eventService.CreateEventAsync(nonExistentClubId, request));

        Assert.That(ex.Message, Does.Contain("Club with ID"));
        Assert.That(ex.Message, Does.Contain("not found"));
    }

    #endregion
}

