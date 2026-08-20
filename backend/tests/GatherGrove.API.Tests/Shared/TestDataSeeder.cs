using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GatherGrove.API.Tests.Shared;

/// <summary>
/// Utility class for seeding test data in the in-memory database
/// </summary>
public static class TestDataSeeder
{
    /// <summary>
    /// Creates a test club with basic properties
    /// </summary>
    public static async Task<Club> CreateTestClubAsync(GatherGroveDbContext context, string name = "Test Club")
    {
        var club = new Club
        {
            Name = name,
            Tier = "Grow",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Clubs.Add(club);
        await context.SaveChangesAsync();
        return club;
    }

    /// <summary>
    /// Creates a test user with basic properties
    /// </summary>
    public static async Task<User> CreateTestUserAsync(GatherGroveDbContext context, string email = "test@example.com", string fullName = "Test User")
    {
        var user = new User
        {
            FullName = fullName,
            Email = email,
            PasswordHash = "hashedpassword",
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user;
    }

    /// <summary>
    /// Creates a test member linked to a club
    /// </summary>
    public static async Task<Member> CreateTestMemberAsync(GatherGroveDbContext context, int clubId, string status = "Active")
    {
        var member = new Member
        {
            ClubId = clubId,
            MembershipTypeId = 1, // Will be set after creating membership type
            FullName = "Test Member",
            Email = "testmember@example.com",
            Status = status,
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Members.Add(member);
        await context.SaveChangesAsync();
        return member;
    }

    /// <summary>
    /// Creates a test event with basic properties
    /// </summary>
    public static async Task<Event> CreateTestEventAsync(GatherGroveDbContext context, int clubId, string name = "Test Event")
    {
        var eventData = new Event
        {
            ClubId = clubId,
            Name = name,
            Description = "Test event description",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            MaxCapacity = 100,
            MemberPrice = 50m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Events.Add(eventData);
        await context.SaveChangesAsync();
        return eventData;
    }

    /// <summary>
    /// Creates a test membership type
    /// </summary>
    public static async Task<MembershipType> CreateTestMembershipTypeAsync(GatherGroveDbContext context, int clubId, string name = "Individual")
    {
        var membershipType = new MembershipType
        {
            ClubId = clubId,
            Name = name,
            Description = "Test membership type",
            DuesAmount = 100m,
            DuesFrequency = "Annual",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.MembershipTypes.Add(membershipType);
        await context.SaveChangesAsync();
        return membershipType;
    }

    /// <summary>
    /// Creates a complete test data set with club, user, member, and event
    /// </summary>
    public static async Task<(Club club, User user, Member member, Event eventData)> CreateCompleteTestDataAsync(GatherGroveDbContext context)
    {
        var club = await CreateTestClubAsync(context);
        var user = await CreateTestUserAsync(context);
        var membershipType = await CreateTestMembershipTypeAsync(context, club.Id);
        var member = await CreateTestMemberAsync(context, club.Id);
        var eventData = await CreateTestEventAsync(context, club.Id);

        return (club, user, member, eventData);
    }

    /// <summary>
    /// Cleans up all test data from the database
    /// </summary>
    public static async Task CleanupTestDataAsync(GatherGroveDbContext context)
    {
        // Delete in order of dependencies to avoid foreign key constraints
        // Using allowlist validation to prevent SQL injection
        var allowedTables = new HashSet<string>
        {
            "Events", "Members", "MembershipTypes", "Clubs", "Users",
            "EventFeedbacks", "EventAttendances", "EventRsvps",
            "Payments", "ClubChatMessages", "ClubAdmins"
        };

        var tables = new[]
        {
            "Events", "Members", "MembershipTypes", "Clubs", "Users"
        };

        foreach (var table in tables)
        {
            // Validate table name against allowlist
            if (!allowedTables.Contains(table))
            {
                throw new ArgumentException($"Table '{table}' is not in the allowed list for cleanup");
            }

            try
            {
                // Use ExecuteSqlAsync with interpolated string for parameterization
                await context.Database.ExecuteSqlAsync($"DELETE FROM [{table}]");
            }
            catch
            {
                // Table might not exist or be empty, which is fine
            }
        }

        await context.SaveChangesAsync();
    }
}
