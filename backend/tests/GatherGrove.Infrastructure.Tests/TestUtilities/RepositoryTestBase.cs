using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Infrastructure.Tests.TestUtilities;

/// <summary>
/// Base class for repository integration tests
/// Provides in-memory database setup and common test utilities
/// </summary>
public abstract class RepositoryTestBase : IDisposable
{
    protected GatherGroveDbContext Context = null!;

    /// <summary>
    /// Creates a new DbContext with a fresh in-memory database
    /// Call this in [SetUp] to ensure test isolation
    /// </summary>
    protected void CreateContext()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging() // Helpful for debugging test failures
            .Options;

        Context = new GatherGroveDbContext(options);
    }

    /// <summary>
    /// Seeds a basic club with specified tier
    /// </summary>
    protected async Task<Club> SeedClubAsync(string tier = "Unlimited", int id = 1)
    {
        var club = new Club
        {
            Id = id,
            Name = $"Test Club {id}",
            Tier = tier,
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            MembershipExpiresAt = DateTime.UtcNow.AddMonths(6)
        };
        Context.Clubs.Add(club);
        await Context.SaveChangesAsync();
        return club;
    }

    /// <summary>
    /// Seeds test members for a club
    /// </summary>
    protected async Task<List<Member>> SeedMembersAsync(int clubId, int count = 10)
    {
        // Create a default membership type if it doesn't exist
        var membershipType = new MembershipType
        {
            Id = clubId,
            ClubId = clubId,
            Name = "Standard",
            DuesAmount = 100.00m,
            IsActive = true
        };
        Context.MembershipTypes.Add(membershipType);
        await Context.SaveChangesAsync();

        var members = Enumerable.Range(1, count).Select(i => new Member
        {
            Id = (clubId * 1000) + i, // Unique ID generation
            ClubId = clubId,
            FullName = $"Test Member {i}",
            Email = $"member{i}@test.com",
            Status = "Active",
            JoinedAt = DateTime.UtcNow.AddDays(-30 * i),
            PhoneNumber = $"+1-555-{i:D4}",
            MembershipTypeId = membershipType.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        Context.Members.AddRange(members);
        await Context.SaveChangesAsync();
        return members;
    }

    /// <summary>
    /// Seeds test events for a club
    /// </summary>
    protected async Task<List<Event>> SeedEventsAsync(int clubId, int count = 5)
    {
        var events = Enumerable.Range(1, count).Select(i => new Event
        {
            Id = (clubId * 1000) + i, // Unique ID generation
            ClubId = clubId,
            Name = $"Test Event {i}",
            EventDateTime = DateTime.UtcNow.AddDays(i * 7), // Weekly events
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Location = $"Venue {i}"
        }).ToList();

        Context.Events.AddRange(events);
        await Context.SaveChangesAsync();
        return events;
    }

    /// <summary>
    /// Seeds event attendance records
    /// </summary>
    protected async Task<List<EventAttendance>> SeedAttendanceAsync(
        int eventId,
        List<int> memberIds,
        AttendanceStatus status = AttendanceStatus.Present)
    {
        var attendances = memberIds.Select((memberId, index) => new EventAttendance
        {
            Id = (eventId * 10000) + index, // Unique ID generation
            EventId = eventId,
            MemberId = memberId,
            AttendanceStatus = status,
            AttendedAt = DateTime.UtcNow.AddHours(-index),
            CreatedAt = DateTime.UtcNow.AddHours(-index)
        }).ToList();

        Context.EventAttendances.AddRange(attendances);
        await Context.SaveChangesAsync();
        return attendances;
    }

    /// <summary>
    /// Seeds event RSVPs
    /// </summary>
    protected async Task<List<EventRsvp>> SeedRsvpsAsync(
        int eventId,
        List<int> memberIds,
        Domain.Enums.RsvpStatus status = Domain.Enums.RsvpStatus.Confirmed)
    {
        var rsvps = memberIds.Select((memberId, index) => new EventRsvp
        {
            Id = (eventId * 10000) + index,
            EventId = eventId,
            MemberId = memberId,
            Status = status,
            CreatedAt = DateTime.UtcNow.AddDays(-index),
            UpdatedAt = DateTime.UtcNow.AddDays(-index)
        }).ToList();

        Context.EventRsvps.AddRange(rsvps);
        await Context.SaveChangesAsync();
        return rsvps;
    }

    public void Dispose()
    {
        Context?.Dispose();
        GC.SuppressFinalize(this);
    }
}
