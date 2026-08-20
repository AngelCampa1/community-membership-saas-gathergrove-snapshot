using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace GatherGrove.Infrastructure.Tests.TestUtilities;

/// <summary>
/// Factory for creating test data with realistic values
/// Provides consistent test data generation across all test files
/// </summary>
public static class TestDataFactory
{
    private static readonly Random Random = new Random(42); // Fixed seed for reproducibility

    public static Club CreateClub(
        int id = 1,
        string tier = "Unlimited",
        DateTime? membershipExpiresAt = null)
    {
        return new Club
        {
            Id = id,
            Name = $"Test Club {id}",
            Tier = tier,
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            MembershipExpiresAt = membershipExpiresAt ?? DateTime.UtcNow.AddMonths(6)
        };
    }

    public static Member CreateMember(
        int id,
        int clubId,
        string status = "Active",
        DateTime? joinedAt = null)
    {
        return new Member
        {
            Id = id,
            ClubId = clubId,
            FullName = $"Test Member {id}",
            Email = $"member{id}@test.com",
            Status = status,
            JoinedAt = joinedAt ?? DateTime.UtcNow.AddDays(-30),
            PhoneNumber = $"+1-555-{id:D4}",
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static Event CreateEvent(
        int id,
        int clubId,
        DateTime? eventDateTime = null,
        int? maxCapacity = null,
        decimal? memberPrice = null,
        decimal? nonMemberPrice = null)
    {
        return new Event
        {
            Id = id,
            ClubId = clubId,
            Name = $"Test Event {id}",
            EventDateTime = eventDateTime ?? DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            MaxCapacity = maxCapacity,
            Location = $"Venue {id}",
            Description = $"Test event {id} description",
            MemberPrice = memberPrice,
            NonMemberPrice = nonMemberPrice,
            Currency = "USD"
        };
    }

    public static EventWaitlist CreateWaitlistEntry(
        int id,
        int eventId,
        int memberId,
        int position,
        WaitlistPriority priority = WaitlistPriority.Normal)
    {
        return new EventWaitlist
        {
            Id = id,
            EventId = eventId,
            MemberId = memberId,
            Position = position,
            Priority = priority,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static EventAttendance CreateAttendance(
        int id,
        int eventId,
        int memberId,
        AttendanceStatus status = AttendanceStatus.Present)
    {
        return new EventAttendance
        {
            Id = id,
            EventId = eventId,
            MemberId = memberId,
            AttendanceStatus = status,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static EventRsvp CreateRsvp(
        int id,
        int eventId,
        int memberId,
        RsvpStatus status = RsvpStatus.Confirmed)
    {
        return new EventRsvp
        {
            Id = id,
            EventId = eventId,
            MemberId = memberId,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static EventSession CreateEventSession(
        int id,
        int multiSessionEventId,
        DateTime? startDateTime = null,
        int? maxCapacity = null)
    {
        var start = startDateTime ?? DateTime.UtcNow.AddDays(7);
        return new EventSession
        {
            Id = id,
            MultiSessionEventId = multiSessionEventId,
            SessionNumber = id,
            Name = $"Session {id}",
            StartDateTime = start,
            EndDateTime = start.AddHours(2),
            MaxCapacity = maxCapacity,
            Location = $"Session Venue {id}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static ClubLocation CreateClubLocation(
        int id,
        int clubId,
        string name = null!)
    {
        return new ClubLocation
        {
            Id = id,
            ParentClubId = clubId,
            LocationName = name ?? $"Location {id}",
            LocationCode = $"LOC{id}",
            Address = $"{id} Test Street",
            City = "Test City",
            State = "CA",
            Country = "USA"
        };
    }

    public static Payment CreatePayment(
        int id,
        int memberId,
        int clubId,
        decimal amount = 50.00m,
        string paymentMethod = "Cash")
    {
        return new Payment
        {
            PaymentId = id,
            MemberId = memberId,
            ClubId = clubId,
            Amount = amount,
            PaymentMethod = paymentMethod,
            PaymentDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }
}
