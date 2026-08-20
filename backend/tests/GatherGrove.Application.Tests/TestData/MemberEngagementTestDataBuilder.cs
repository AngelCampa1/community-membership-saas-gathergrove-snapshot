using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.TestData;

/// <summary>
/// Test data builder for creating realistic member engagement test scenarios
/// </summary>
public class MemberEngagementTestDataBuilder
{
    private readonly GatherGroveDbContext _context;
    private readonly List<Member> _members = new();
    private readonly List<Club> _clubs = new();
    private readonly Random _random = new();

    public MemberEngagementTestDataBuilder(GatherGroveDbContext context)
    {
        _context = context;
    }

    #region Club Creation

    public async Task<MemberEngagementTestDataBuilder> WithClub(string name = "Test Club", string tier = "Grow")
    {
        // Create a test user first (required for club creation)
        var user = new User
        {
            FullName = "Test Admin",
            Email = $"admin_{Guid.NewGuid():N}@test.com",
            PasswordHash = "test-hash",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var club = new Club
        {
            Name = name,
            Tier = tier,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        _clubs.Add(club);

        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithMultipleClubs(int count, string namePrefix = "Test Club")
    {
        for (int i = 1; i <= count; i++)
        {
            await WithClub($"{namePrefix} {i}");
        }
        return this;
    }

    #endregion

    #region Member Creation with Engagement Patterns

    public async Task<MemberEngagementTestDataBuilder> WithHighEngagementMember(
        int clubId,
        string email = "high@example.com",
        string name = "High Engagement Member")
    {
        var member = await CreateBasicMember(clubId, email, name);
        await CreateHighEngagementPattern(member.Id, clubId);
        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithMediumEngagementMember(
        int clubId,
        string email = "medium@example.com",
        string name = "Medium Engagement Member")
    {
        var member = await CreateBasicMember(clubId, email, name);
        await CreateMediumEngagementPattern(member.Id, clubId);
        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithLowEngagementMember(
        int clubId,
        string email = "low@example.com",
        string name = "Low Engagement Member")
    {
        var member = await CreateBasicMember(clubId, email, name);
        await CreateLowEngagementPattern(member.Id, clubId);
        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithNewMember(
        int clubId,
        string email = "new@example.com",
        string name = "New Member")
    {
        var member = await CreateBasicMember(clubId, email, name, DateTime.UtcNow.AddDays(-7));
        // New members have minimal to no activity
        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithInactiveMember(
        int clubId,
        string email = "inactive@example.com",
        string name = "Inactive Member")
    {
        var member = await CreateBasicMember(clubId, email, name, DateTime.UtcNow.AddDays(-180));
        await CreateInactiveEngagementPattern(member.Id, clubId);
        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithReturningMember(
        int clubId,
        string email = "returning@example.com",
        string name = "Returning Member")
    {
        var member = await CreateBasicMember(clubId, email, name, DateTime.UtcNow.AddDays(-365));
        await CreateReturningMemberPattern(member.Id, clubId);
        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithSeasonalMember(
        int clubId,
        string email = "seasonal@example.com",
        string name = "Seasonal Member")
    {
        var member = await CreateBasicMember(clubId, email, name, DateTime.UtcNow.AddDays(-200));
        await CreateSeasonalEngagementPattern(member.Id, clubId);
        return this;
    }

    #endregion

    #region Bulk Member Creation

    public async Task<MemberEngagementTestDataBuilder> WithMembersOfVariedEngagement(
        int clubId,
        int totalMembers = 50,
        double highEngagementPercent = 0.20,
        double mediumEngagementPercent = 0.50,
        double lowEngagementPercent = 0.30)
    {
        var highCount = (int)(totalMembers * highEngagementPercent);
        var mediumCount = (int)(totalMembers * mediumEngagementPercent);
        var lowCount = totalMembers - highCount - mediumCount;

        // Create high engagement members
        for (int i = 0; i < highCount; i++)
        {
            await WithHighEngagementMember(clubId, $"high{i}@example.com", $"High Member {i}");
        }

        // Create medium engagement members
        for (int i = 0; i < mediumCount; i++)
        {
            await WithMediumEngagementMember(clubId, $"medium{i}@example.com", $"Medium Member {i}");
        }

        // Create low engagement members
        for (int i = 0; i < lowCount; i++)
        {
            await WithLowEngagementMember(clubId, $"low{i}@example.com", $"Low Member {i}");
        }

        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithLargeClubDataset(
        int clubId,
        int memberCount = 200)
    {
        for (int i = 0; i < memberCount; i++)
        {
            var engagementType = _random.Next(1, 101);

            if (engagementType <= 15) // 15% high engagement
            {
                await WithHighEngagementMember(clubId, $"bulk_high_{i}@example.com", $"Bulk High {i}");
            }
            else if (engagementType <= 60) // 45% medium engagement
            {
                await WithMediumEngagementMember(clubId, $"bulk_medium_{i}@example.com", $"Bulk Medium {i}");
            }
            else if (engagementType <= 90) // 30% low engagement
            {
                await WithLowEngagementMember(clubId, $"bulk_low_{i}@example.com", $"Bulk Low {i}");
            }
            else // 10% inactive
            {
                await WithInactiveMember(clubId, $"bulk_inactive_{i}@example.com", $"Bulk Inactive {i}");
            }
        }

        return this;
    }

    #endregion

    #region Time-based Patterns

    public async Task<MemberEngagementTestDataBuilder> WithHistoricalEngagementData(
        int clubId,
        int monthsBack = 6)
    {
        var startDate = DateTime.UtcNow.AddMonths(-monthsBack);

        // Create members with historical data
        for (int memberIndex = 0; memberIndex < 10; memberIndex++)
        {
            var member = await CreateBasicMember(
                clubId,
                $"historical_{memberIndex}@example.com",
                $"Historical Member {memberIndex}",
                startDate.AddDays(-30));

            // Create monthly engagement patterns
            for (int monthOffset = 0; monthOffset < monthsBack; monthOffset++)
            {
                var monthDate = startDate.AddMonths(monthOffset);
                var activityLevel = _random.Next(1, 6); // 1-5 activity level

                await CreateMonthlyActivities(member.Id, clubId, monthDate, activityLevel);
            }
        }

        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithTrendingEngagementData(
        int clubId,
        EngagementTrend trend = EngagementTrend.Improving)
    {
        var member = await CreateBasicMember(clubId, "trending@example.com", "Trending Member");

        for (int weekOffset = 12; weekOffset >= 0; weekOffset--)
        {
            var weekDate = DateTime.UtcNow.AddDays(-weekOffset * 7);
            int activityLevel;

            switch (trend)
            {
                case EngagementTrend.Improving:
                    activityLevel = Math.Max(1, 6 - (weekOffset / 2)); // Increasing activity
                    break;
                case EngagementTrend.Declining:
                    activityLevel = Math.Max(1, 1 + (weekOffset / 2)); // Decreasing activity
                    break;
                case EngagementTrend.Stable:
                    activityLevel = 3; // Consistent activity
                    break;
                default:
                    activityLevel = _random.Next(1, 6);
                    break;
            }

            await CreateWeeklyActivities(member.Id, clubId, weekDate, activityLevel);
        }

        return this;
    }

    #endregion

    #region Specialized Scenarios

    public async Task<MemberEngagementTestDataBuilder> WithEventOnlyMember(int clubId)
    {
        var member = await CreateBasicMember(clubId, "eventonly@example.com", "Event Only Member");

        // Only attends events, no other activities
        for (int i = 0; i < 8; i++)
        {
            await CreateEventAttendance(member.Id, clubId, DateTime.UtcNow.AddDays(-i * 7));
        }

        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithPaymentOnlyMember(int clubId)
    {
        var member = await CreateBasicMember(clubId, "paymentonly@example.com", "Payment Only Member");

        // Only makes payments, no other activities
        for (int i = 0; i < 6; i++)
        {
            await CreatePayment(member.Id, clubId, DateTime.UtcNow.AddDays(-i * 30));
        }

        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithChatOnlyMember(int clubId)
    {
        var member = await CreateBasicMember(clubId, "chatonly@example.com", "Chat Only Member");

        // Only participates in chat, no other activities
        await CreateChatMessages(member.Id, clubId, 50);

        return this;
    }

    public async Task<MemberEngagementTestDataBuilder> WithInconsistentMember(int clubId)
    {
        var member = await CreateBasicMember(clubId, "inconsistent@example.com", "Inconsistent Member");

        // Very sporadic activity pattern
        await CreateEventAttendance(member.Id, clubId, DateTime.UtcNow.AddDays(-2));
        await CreateEventAttendance(member.Id, clubId, DateTime.UtcNow.AddDays(-45));
        await CreateEventAttendance(member.Id, clubId, DateTime.UtcNow.AddDays(-90));
        await CreatePayment(member.Id, clubId, DateTime.UtcNow.AddDays(-60));
        await CreateChatMessages(member.Id, clubId, 3);

        return this;
    }

    #endregion

    #region Builder Completion

    public TestDataResult Build()
    {
        return new TestDataResult
        {
            Clubs = _clubs,
            Members = _members,
            TotalClubs = _clubs.Count,
            TotalMembers = _members.Count
        };
    }

    #endregion

    #region Private Helper Methods

    private async Task<Member> CreateBasicMember(int clubId, string email, string name, DateTime? joinDate = null)
    {
        // Ensure membership type exists
        var membershipType = await EnsureMembershipType(clubId);

        var member = new Member
        {
            ClubId = clubId,
            MembershipTypeId = membershipType.Id,
            FullName = name,
            Email = email,
            Status = "Active",
            JoinDate = joinDate ?? DateTime.UtcNow.AddDays(-60),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();
        _members.Add(member);

        return member;
    }

    private async Task<MembershipType> EnsureMembershipType(int clubId)
    {
        var existingType = await _context.MembershipTypes
            .FirstOrDefaultAsync(mt => mt.ClubId == clubId);

        if (existingType != null)
            return existingType;

        var membershipType = new MembershipType
        {
            ClubId = clubId,
            Name = "Individual",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        return membershipType;
    }

    private async Task CreateHighEngagementPattern(int memberId, int clubId)
    {
        // High engagement: Many recent activities across all types
        for (int i = 0; i < 10; i++)
        {
            await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-i * 3));
        }

        for (int i = 0; i < 4; i++)
        {
            await CreatePayment(memberId, clubId, DateTime.UtcNow.AddDays(-i * 20));
        }

        await CreateChatMessages(memberId, clubId, 40);
        await CreateEventRsvps(memberId, clubId, 15);
    }

    private async Task CreateMediumEngagementPattern(int memberId, int clubId)
    {
        // Medium engagement: Regular but moderate activity
        for (int i = 0; i < 5; i++)
        {
            await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-i * 7));
        }

        for (int i = 0; i < 2; i++)
        {
            await CreatePayment(memberId, clubId, DateTime.UtcNow.AddDays(-i * 30));
        }

        await CreateChatMessages(memberId, clubId, 15);
        await CreateEventRsvps(memberId, clubId, 8);
    }

    private async Task CreateLowEngagementPattern(int memberId, int clubId)
    {
        // Low engagement: Minimal activity, some older
        await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-30));
        await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-60));
        await CreateEventRsvps(memberId, clubId, 3);
        await CreateChatMessages(memberId, clubId, 5);
    }

    private async Task CreateInactiveEngagementPattern(int memberId, int clubId)
    {
        // Inactive: Only very old activities
        await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-90));
        await CreatePayment(memberId, clubId, DateTime.UtcNow.AddDays(-120));
    }

    private async Task CreateReturningMemberPattern(int memberId, int clubId)
    {
        // Pattern: Was inactive, now returning with recent activities
        // Old activities
        await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-200));
        await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-180));

        // Recent return to activity
        await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-5));
        await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-2));
        await CreatePayment(memberId, clubId, DateTime.UtcNow.AddDays(-1));
    }

    private async Task CreateSeasonalEngagementPattern(int memberId, int clubId)
    {
        // Pattern: High activity in certain periods, low in others
        // "Season 1" - High activity
        for (int i = 0; i < 6; i++)
        {
            await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-i * 3 - 120));
        }

        // Gap period - No activity for ~60 days

        // "Season 2" - Recent activity return
        for (int i = 0; i < 4; i++)
        {
            await CreateEventAttendance(memberId, clubId, DateTime.UtcNow.AddDays(-i * 5));
        }
    }

    private async Task CreateMonthlyActivities(int memberId, int clubId, DateTime monthDate, int activityLevel)
    {
        // Create activities spread throughout the month
        for (int i = 0; i < activityLevel; i++)
        {
            var activityDate = monthDate.AddDays(i * 7); // Weekly activities
            await CreateEventAttendance(memberId, clubId, activityDate);
        }

        if (activityLevel >= 3)
        {
            await CreatePayment(memberId, clubId, monthDate.AddDays(15));
        }

        if (activityLevel >= 2)
        {
            await CreateChatMessages(memberId, clubId, activityLevel * 3);
        }
    }

    private async Task CreateWeeklyActivities(int memberId, int clubId, DateTime weekDate, int activityLevel)
    {
        for (int i = 0; i < activityLevel; i++)
        {
            await CreateEventAttendance(memberId, clubId, weekDate.AddDays(i));
        }

        if (activityLevel >= 3)
        {
            await CreateChatMessages(memberId, clubId, activityLevel * 2);
        }
    }

    private async Task CreateEventAttendance(int memberId, int clubId, DateTime attendanceDate)
    {
        var clubEvent = new Event
        {
            ClubId = clubId,
            Name = $"Test Event {Guid.NewGuid().ToString()[..8]}",
            Description = "Test data builder event",
            EventDateTime = attendanceDate,
            Location = "Test Location",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(clubEvent);
        await _context.SaveChangesAsync();

        var attendance = new EventAttendance
        {
            EventId = clubEvent.Id,
            MemberId = memberId,
            AttendedAt = attendanceDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();
    }

    private async Task CreatePayment(int memberId, int clubId, DateTime paymentDate)
    {
        var payment = new Payment
        {
            ClubId = clubId,
            MemberId = memberId,
            Amount = 50.00m,
            PaymentDate = paymentDate,
            PaymentMethod = "Card",
            Notes = "Test data payment",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();
    }

    private async Task CreateChatMessages(int memberId, int clubId, int count)
    {
        for (int i = 0; i < count; i++)
        {
            // Get the club's admin user to use as message sender
            var club = await _context.Clubs.FirstAsync(c => c.Id == clubId);

            var message = new ClubChatMessage
            {
                ClubId = clubId,
                SenderUserId = club.CreatedByUserId, // Use club admin as sender
                MessageContent = $"Test chat message {i + 1}",
                SentAt = DateTime.UtcNow.AddDays(-i)
            };

            _context.ClubChatMessages.Add(message);
        }
        await _context.SaveChangesAsync();
    }

    private async Task CreateEventRsvps(int memberId, int clubId, int count)
    {
        for (int i = 0; i < count; i++)
        {
            var clubEvent = new Event
            {
                ClubId = clubId,
                Name = $"RSVP Event {Guid.NewGuid().ToString()[..8]}",
                Description = "Test data RSVP event",
                EventDateTime = DateTime.UtcNow.AddDays(i + 1),
                Location = "Test Location",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Events.Add(clubEvent);
            await _context.SaveChangesAsync();

            var rsvp = new EventRsvp
            {
                EventId = clubEvent.Id,
                MemberId = memberId,
                RsvpStatus = "Attending",
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow
            };

            _context.EventRsvps.Add(rsvp);
        }
        await _context.SaveChangesAsync();
    }

    #endregion
}

#region Supporting Classes

public class TestDataResult
{
    public List<Club> Clubs { get; set; } = new();
    public List<Member> Members { get; set; } = new();
    public int TotalClubs { get; set; }
    public int TotalMembers { get; set; }

    public Club? GetClub(int index = 0) => Clubs.Count > index ? Clubs[index] : null;
    public Member? GetMember(int index = 0) => Members.Count > index ? Members[index] : null;
    public Member? GetMemberByEmail(string email) => Members.FirstOrDefault(m => m.Email == email);
}

public enum EngagementTrend
{
    Improving,
    Declining,
    Stable,
    Volatile
}

#endregion