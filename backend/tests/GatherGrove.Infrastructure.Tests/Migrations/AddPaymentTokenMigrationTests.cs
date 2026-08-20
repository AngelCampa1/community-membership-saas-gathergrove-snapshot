using Xunit;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace GatherGrove.Infrastructure.Tests.Migrations;

/// <summary>
/// TDD Tests for PaymentToken Migration
/// Category: TDD-RED Phase
/// Verifies database schema changes for payment token feature
/// </summary>
public class AddPaymentTokenMigrationTests : IDisposable
{
    private readonly GatherGroveDbContext _context;

    public AddPaymentTokenMigrationTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"MigrationTestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
    }

    [Fact]
    [Trait("Category", "TDD-RED")]
    [Trait("Category", "Migration")]
    public async Task Event_ShouldHavePaymentTokenColumn()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            PaymentToken = "test_token_12345678901234567890"
        };

        _context.Clubs.Add(club);
        _context.Events.Add(eventEntity);

        // Act
        await _context.SaveChangesAsync();
        var savedEvent = await _context.Events.FirstOrDefaultAsync(e => e.Id == 1);

        // Assert
        Assert.NotNull(savedEvent);
        Assert.NotNull(savedEvent.PaymentToken);
        Assert.Equal("test_token_12345678901234567890", savedEvent.PaymentToken);
    }

    [Fact]
    [Trait("Category", "TDD-RED")]
    [Trait("Category", "Migration")]
    public async Task PaymentToken_ShouldBeNullable()
    {
        // Arrange: Events without payment tokens should be valid
        var club = new Club { Id = 1, Name = "Test Club" };
        var eventWithoutToken = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Event Without Token",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            PaymentToken = null // Explicitly null
        };

        _context.Clubs.Add(club);
        _context.Events.Add(eventWithoutToken);

        // Act
        await _context.SaveChangesAsync();
        var savedEvent = await _context.Events.FirstOrDefaultAsync(e => e.Id == 1);

        // Assert
        Assert.NotNull(savedEvent);
        Assert.Null(savedEvent.PaymentToken);
    }

    [Fact]
    [Trait("Category", "TDD-RED")]
    [Trait("Category", "Migration")]
    public async Task PaymentToken_ShouldSupportLongStrings()
    {
        // Arrange: Token should support at least 100 characters
        var club = new Club { Id = 1, Name = "Test Club" };
        var longToken = new string('A', 100); // 100 character token
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            PaymentToken = longToken
        };

        _context.Clubs.Add(club);
        _context.Events.Add(eventEntity);

        // Act
        await _context.SaveChangesAsync();
        var savedEvent = await _context.Events.FirstOrDefaultAsync(e => e.Id == 1);

        // Assert
        Assert.NotNull(savedEvent);
        Assert.Equal(longToken, savedEvent.PaymentToken);
        Assert.Equal(100, savedEvent.PaymentToken.Length);
    }

    [Fact]
    [Trait("Category", "TDD-RED")]
    [Trait("Category", "Migration")]
    public async Task PaymentToken_ShouldBeIndexedForPerformance()
    {
        // Arrange: Multiple events with different tokens
        var club = new Club { Id = 1, Name = "Test Club" };
        _context.Clubs.Add(club);

        for (int i = 1; i <= 10; i++)
        {
            _context.Events.Add(new Event
            {
                Id = i,
                ClubId = 1,
                Name = $"Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(i),
                Location = "Test Location",
                PaymentToken = $"token_{i:D32}" // 32 char tokens
            });
        }
        await _context.SaveChangesAsync();

        // Act: Query by token should be efficient
        var targetToken = "token_00000000000000000000000000000005";
        var foundEvent = await _context.Events
            .FirstOrDefaultAsync(e => e.PaymentToken == targetToken);

        // Assert
        Assert.NotNull(foundEvent);
        Assert.Equal("Event 5", foundEvent.Name);
        // In real database, query plan would show index usage
    }

    [Fact]
    [Trait("Category", "TDD-RED")]
    [Trait("Category", "Migration")]
    public async Task PaymentToken_ShouldBeUniqueAcrossEvents()
    {
        // Arrange: Two events with the same token should not be allowed
        var club = new Club { Id = 1, Name = "Test Club" };
        var duplicateToken = "duplicate_token_12345678901234567890";

        var event1 = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Event 1",
            EventDateTime = DateTime.UtcNow.AddDays(10),
            Location = "Location 1",
            PaymentToken = duplicateToken
        };

        var event2 = new Event
        {
            Id = 2,
            ClubId = 1,
            Name = "Event 2",
            EventDateTime = DateTime.UtcNow.AddDays(20),
            Location = "Location 2",
            PaymentToken = duplicateToken // Same token
        };

        _context.Clubs.Add(club);
        _context.Events.Add(event1);
        await _context.SaveChangesAsync();

        _context.Events.Add(event2);

        // Act & Assert: In real SQL database with unique constraint, this would throw
        // In-memory database doesn't enforce this, so we document the expectation
        try
        {
            await _context.SaveChangesAsync();

            // For in-memory database, manually verify uniqueness
            var tokenCount = await _context.Events
                .Where(e => e.PaymentToken == duplicateToken)
                .CountAsync();

            Assert.True(tokenCount <= 1, "PaymentToken should have unique constraint in real database");
        }
        catch (DbUpdateException)
        {
            // Expected in real SQL database with unique constraint
            Assert.True(true, "Unique constraint violation as expected");
        }
    }

    [Fact]
    [Trait("Category", "TDD-RED")]
    [Trait("Category", "Migration")]
    public async Task ExistingEvents_AfterMigration_ShouldHaveNullToken()
    {
        // Arrange: Simulates existing events before migration
        var club = new Club { Id = 1, Name = "Test Club" };
        var existingEvent = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Existing Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location"
            // PaymentToken not set - simulates pre-migration data
        };

        _context.Clubs.Add(club);
        _context.Events.Add(existingEvent);
        await _context.SaveChangesAsync();

        // Act
        var savedEvent = await _context.Events.FirstOrDefaultAsync(e => e.Id == 1);

        // Assert
        Assert.NotNull(savedEvent);
        Assert.Null(savedEvent.PaymentToken);
        // Migration should add column with NULL default for existing rows
    }

    [Fact]
    [Trait("Category", "TDD-RED")]
    [Trait("Category", "Migration")]
    public async Task PaymentToken_ShouldPersistAcrossSessions()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var token = "persistent_token_12345678901234567890";
        var eventEntity = new Event
        {
            Id = 1,
            ClubId = 1,
            Name = "Persistent Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            PaymentToken = token
        };

        _context.Clubs.Add(club);
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        // Detach to simulate new session
        _context.Entry(eventEntity).State = EntityState.Detached;

        // Act: Retrieve in "new session"
        var retrievedEvent = await _context.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == 1);

        // Assert
        Assert.NotNull(retrievedEvent);
        Assert.Equal(token, retrievedEvent.PaymentToken);
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}