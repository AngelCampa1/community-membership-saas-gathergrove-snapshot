using FluentAssertions;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace GatherGrove.Integration.Tests;

/// <summary>
/// Integration tests for real-time engagement workflows including event check-ins,
/// live analytics updates, and engagement score tracking.
/// Tests end-to-end scenarios with real database persistence.
/// </summary>
[TestFixture]
public class RealTimeEngagementTests
{
    private GatherGroveDbContext _context = null!;
    private Club _testClub = null!;
    private Event _testEvent = null!;
    private Member _testMember1 = null!;
    private Member _testMember2 = null!;
    private MembershipType _membershipType = null!;

    [SetUp]
    public async Task SetUp()
    {
        // Create in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);

        // Seed test data
        _testClub = new Club
        {
            Name = "Test Club for Real-Time Engagement",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(_testClub);
        await _context.SaveChangesAsync();

        _membershipType = new MembershipType
        {
            ClubId = _testClub.Id,
            Name = "Standard",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(_membershipType);
        await _context.SaveChangesAsync();

        _testMember1 = new Member
        {
            ClubId = _testClub.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Test Member 1",
            Email = "member1@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _testMember2 = new Member
        {
            ClubId = _testClub.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Test Member 2",
            Email = "member2@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(_testMember1, _testMember2);
        await _context.SaveChangesAsync();

        _testEvent = new Event
        {
            ClubId = _testClub.Id,
            Name = "Test Event for Real-Time Engagement",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Test Location",
            Description = "Event for testing real-time engagement",
            MaxCapacity = 100,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(_testEvent);
        await _context.SaveChangesAsync();
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    #region Event Check-In Workflow Tests

    [Test]
    public async Task EventCheckin_MemberWithRsvp_RecordsAttendance()
    {
        // Arrange - Member has RSVP
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember1.Id,
            RsvpStatus = "Attending",
            Status = RsvpStatus.Confirmed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Check in member
        var attendance = new EventAttendance
        {
            EventId = _testEvent.Id,
            MemberId = _testMember1.Id,
            CheckInTime = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();

        // Assert - Verify check-in recorded
        var savedAttendance = await _context.EventAttendances
            .FirstAsync(a => a.EventId == _testEvent.Id && a.MemberId == _testMember1.Id);

        savedAttendance.CheckInTime.Should().NotBeNull();
        savedAttendance.AttendanceStatus.Should().Be(AttendanceStatus.Present);
        savedAttendance.EventId.Should().Be(_testEvent.Id);
        savedAttendance.MemberId.Should().Be(_testMember1.Id);
    }

    [Test]
    public async Task EventCheckin_MultipleMembersSimultaneously_AllRecorded()
    {
        // Arrange - Two members with RSVPs
        var rsvps = new List<EventRsvp>
        {
            new EventRsvp { EventId = _testEvent.Id, MemberId = _testMember1.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EventRsvp { EventId = _testEvent.Id, MemberId = _testMember2.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Act - Both check in simultaneously
        var checkinTime = DateTime.UtcNow;
        var attendances = new List<EventAttendance>
        {
            new EventAttendance { EventId = _testEvent.Id, MemberId = _testMember1.Id, CheckInTime = checkinTime, AttendanceStatus = AttendanceStatus.Present, AttendedAt = checkinTime, CreatedAt = checkinTime },
            new EventAttendance { EventId = _testEvent.Id, MemberId = _testMember2.Id, CheckInTime = checkinTime, AttendanceStatus = AttendanceStatus.Present, AttendedAt = checkinTime, CreatedAt = checkinTime }
        };
        _context.EventAttendances.AddRange(attendances);
        await _context.SaveChangesAsync();

        // Assert - Both check-ins recorded
        var allAttendances = await _context.EventAttendances
            .Where(a => a.EventId == _testEvent.Id)
            .ToListAsync();

        allAttendances.Should().HaveCount(2);
        allAttendances.Should().AllSatisfy(a =>
        {
            a.CheckInTime.Should().NotBeNull();
            a.AttendanceStatus.Should().Be(AttendanceStatus.Present);
        });
    }

    [Test]
    public async Task EventCheckin_TracksCapacity_CountsAttendees()
    {
        // Arrange - Event with max capacity 2
        _testEvent.MaxCapacity = 2;
        _context.Events.Update(_testEvent);
        await _context.SaveChangesAsync();

        // Act - Two members check in
        var attendances = new List<EventAttendance>
        {
            new EventAttendance { EventId = _testEvent.Id, MemberId = _testMember1.Id, CheckInTime = DateTime.UtcNow, AttendanceStatus = AttendanceStatus.Present, AttendedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow },
            new EventAttendance { EventId = _testEvent.Id, MemberId = _testMember2.Id, CheckInTime = DateTime.UtcNow, AttendanceStatus = AttendanceStatus.Present, AttendedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow }
        };
        _context.EventAttendances.AddRange(attendances);
        await _context.SaveChangesAsync();

        // Assert - Count attendees vs capacity
        var attendeeCount = await _context.EventAttendances
            .Where(a => a.EventId == _testEvent.Id)
            .CountAsync();

        var eventWithCapacity = await _context.Events
            .FirstAsync(e => e.Id == _testEvent.Id);

        attendeeCount.Should().Be(2);
        eventWithCapacity.MaxCapacity.Should().Be(2);
        attendeeCount.Should().BeLessOrEqualTo(eventWithCapacity.MaxCapacity!.Value);
    }

    [Test]
    public async Task EventCheckin_CheckInAndCheckOut_RecordsBothTimes()
    {
        // Arrange - Member with RSVP
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember1.Id,
            Status = RsvpStatus.Confirmed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Check in, then check out
        var checkInTime = DateTime.UtcNow;
        var attendance = new EventAttendance
        {
            EventId = _testEvent.Id,
            MemberId = _testMember1.Id,
            CheckInTime = checkInTime,
            AttendanceStatus = AttendanceStatus.Present,
            AttendedAt = checkInTime,
            CreatedAt = checkInTime
        };
        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();

        // Check out 2 hours later
        var checkOutTime = checkInTime.AddHours(2);
        attendance.CheckOutTime = checkOutTime;
        _context.EventAttendances.Update(attendance);
        await _context.SaveChangesAsync();

        // Assert - Both times recorded
        var savedAttendance = await _context.EventAttendances
            .FirstAsync(a => a.EventId == _testEvent.Id && a.MemberId == _testMember1.Id);

        savedAttendance.CheckInTime.Should().NotBeNull();
        savedAttendance.CheckOutTime.Should().NotBeNull();
        savedAttendance.CheckOutTime.Should().BeAfter(savedAttendance.CheckInTime!.Value);
    }

    [Test]
    public async Task EventCheckin_WithoutRsvp_StillAllowsAttendance()
    {
        // Arrange - No RSVP exists
        // Act - Member checks in without prior RSVP (walk-in)
        var attendance = new EventAttendance
        {
            EventId = _testEvent.Id,
            MemberId = _testMember1.Id,
            CheckInTime = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();

        // Assert - Walk-in attendance recorded
        var savedAttendance = await _context.EventAttendances
            .FirstOrDefaultAsync(a => a.EventId == _testEvent.Id && a.MemberId == _testMember1.Id);

        savedAttendance.Should().NotBeNull();
        savedAttendance!.CheckInTime.Should().NotBeNull();
        savedAttendance.AttendanceStatus.Should().Be(AttendanceStatus.Present);

        // Verify no RSVP exists
        var rsvpExists = await _context.EventRsvps
            .AnyAsync(r => r.EventId == _testEvent.Id && r.MemberId == _testMember1.Id);
        rsvpExists.Should().BeFalse();
    }

    #endregion

    #region Live RSVP Analytics Tests

    [Test]
    public async Task LiveAnalytics_RsvpCreation_UpdatesEventRsvpCount()
    {
        // Arrange - Event with no RSVPs
        // Act - Create 3 RSVPs
        var rsvps = new List<EventRsvp>
        {
            new EventRsvp { EventId = _testEvent.Id, MemberId = _testMember1.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EventRsvp { EventId = _testEvent.Id, MemberId = _testMember2.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Assert - Count RSVPs
        var rsvpCount = await _context.EventRsvps
            .Where(r => r.EventId == _testEvent.Id)
            .CountAsync();

        rsvpCount.Should().Be(2);
    }

    [Test]
    public async Task LiveAnalytics_RsvpToAttendance_TracksConversionRate()
    {
        // Arrange - 3 RSVPs
        var member3 = new Member
        {
            ClubId = _testClub.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Member 3",
            Email = "member3@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member3);
        await _context.SaveChangesAsync();

        var rsvps = new List<EventRsvp>
        {
            new EventRsvp { EventId = _testEvent.Id, MemberId = _testMember1.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EventRsvp { EventId = _testEvent.Id, MemberId = _testMember2.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EventRsvp { EventId = _testEvent.Id, MemberId = member3.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Act - Only 2 members actually attend
        var attendances = new List<EventAttendance>
        {
            new EventAttendance { EventId = _testEvent.Id, MemberId = _testMember1.Id, CheckInTime = DateTime.UtcNow, AttendanceStatus = AttendanceStatus.Present, AttendedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow },
            new EventAttendance { EventId = _testEvent.Id, MemberId = _testMember2.Id, CheckInTime = DateTime.UtcNow, AttendanceStatus = AttendanceStatus.Present, AttendedAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow }
        };
        _context.EventAttendances.AddRange(attendances);
        await _context.SaveChangesAsync();

        // Assert - Calculate conversion rate
        var rsvpCount = await _context.EventRsvps
            .Where(r => r.EventId == _testEvent.Id)
            .CountAsync();

        var attendanceCount = await _context.EventAttendances
            .Where(a => a.EventId == _testEvent.Id)
            .CountAsync();

        var conversionRate = (decimal)attendanceCount / rsvpCount * 100;

        rsvpCount.Should().Be(3);
        attendanceCount.Should().Be(2);
        conversionRate.Should().BeApproximately(66.67m, 0.01m);
    }

    [Test]
    public async Task LiveAnalytics_RsvpStatusDistribution_TracksResponses()
    {
        // Arrange - RSVPs with different statuses
        var rsvps = new List<EventRsvp>
        {
            new EventRsvp { EventId = _testEvent.Id, MemberId = _testMember1.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EventRsvp { EventId = _testEvent.Id, MemberId = _testMember2.Id, Status = RsvpStatus.Declined, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Act - Query RSVP distribution
        var confirmedCount = await _context.EventRsvps
            .Where(r => r.EventId == _testEvent.Id && r.Status == RsvpStatus.Confirmed)
            .CountAsync();

        var declinedCount = await _context.EventRsvps
            .Where(r => r.EventId == _testEvent.Id && r.Status == RsvpStatus.Declined)
            .CountAsync();

        var totalCount = await _context.EventRsvps
            .Where(r => r.EventId == _testEvent.Id)
            .CountAsync();

        // Assert - Distribution calculated correctly
        confirmedCount.Should().Be(1);
        declinedCount.Should().Be(1);
        totalCount.Should().Be(2);
    }

    #endregion

    #region Engagement Score Tracking Tests

    [Test]
    public async Task EngagementScore_NewMember_StartsWithZeroScore()
    {
        // Arrange & Act - Create new engagement score
        var engagementScore = new MemberEventEngagementScores
        {
            MemberId = _testMember1.Id,
            TotalEventsAttended = 0,
            EventAttendanceRate = 0,
            AverageEventEngagementScore = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CalculatedAt = DateTime.UtcNow
        };
        _context.MemberEventEngagementScores.Add(engagementScore);
        await _context.SaveChangesAsync();

        // Assert - Verify initial state
        var saved = await _context.MemberEventEngagementScores
            .FirstAsync(s => s.MemberId == _testMember1.Id);

        saved.TotalEventsAttended.Should().Be(0);
        saved.EventAttendanceRate.Should().Be(0);
        saved.AverageEventEngagementScore.Should().Be(0);
    }

    [Test]
    public async Task EngagementScore_AfterRsvpAndCheckin_IncrementsAttendance()
    {
        // Arrange - Create engagement score
        var engagementScore = new MemberEventEngagementScores
        {
            MemberId = _testMember1.Id,
            TotalEventsAttended = 0,
            EventAttendanceRate = 0,
            AverageEventEngagementScore = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CalculatedAt = DateTime.UtcNow
        };
        _context.MemberEventEngagementScores.Add(engagementScore);
        await _context.SaveChangesAsync();

        // Act - Member RSVPs and attends event
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember1.Id,
            Status = RsvpStatus.Confirmed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);

        var attendance = new EventAttendance
        {
            EventId = _testEvent.Id,
            MemberId = _testMember1.Id,
            CheckInTime = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _context.EventAttendances.Add(attendance);
        await _context.SaveChangesAsync();

        // Update engagement score
        engagementScore.TotalEventsAttended = 1;
        engagementScore.EventAttendanceRate = 100; // 1/1 RSVPs attended
        engagementScore.AverageEventEngagementScore = 75;
        engagementScore.UpdatedAt = DateTime.UtcNow;
        engagementScore.CalculatedAt = DateTime.UtcNow;
        _context.MemberEventEngagementScores.Update(engagementScore);
        await _context.SaveChangesAsync();

        // Assert
        var updated = await _context.MemberEventEngagementScores
            .FirstAsync(s => s.MemberId == _testMember1.Id);

        updated.TotalEventsAttended.Should().Be(1);
        updated.EventAttendanceRate.Should().Be(100);
        updated.AverageEventEngagementScore.Should().BeGreaterThan(0);
    }

    [Test]
    public async Task EngagementScore_CompareMembers_RanksByEngagement()
    {
        // Arrange - Create engagement scores for multiple members
        var scores = new List<MemberEventEngagementScores>
        {
            new MemberEventEngagementScores
            {
                MemberId = _testMember1.Id,
                TotalEventsAttended = 5,
                AverageEventEngagementScore = 85.5m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CalculatedAt = DateTime.UtcNow
            },
            new MemberEventEngagementScores
            {
                MemberId = _testMember2.Id,
                TotalEventsAttended = 2,
                AverageEventEngagementScore = 60.0m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CalculatedAt = DateTime.UtcNow
            }
        };
        _context.MemberEventEngagementScores.AddRange(scores);
        await _context.SaveChangesAsync();

        // Act - Query top engaged members
        var topMembers = await _context.MemberEventEngagementScores
            .OrderByDescending(s => s.AverageEventEngagementScore)
            .Take(2)
            .ToListAsync();

        // Assert - Correct ranking
        topMembers.Should().HaveCount(2);
        topMembers[0].MemberId.Should().Be(_testMember1.Id);
        topMembers[0].AverageEventEngagementScore.Should().Be(85.5m);
        topMembers[1].MemberId.Should().Be(_testMember2.Id);
        topMembers[1].AverageEventEngagementScore.Should().Be(60.0m);
    }

    #endregion

    #region Real-Time Updates Integration Tests

    [Test]
    public async Task RealTimeUpdates_EventCapacityChange_UpdatesInDatabase()
    {
        // Arrange - Event with initial capacity
        var initialCapacity = _testEvent.MaxCapacity;

        // Act - Update capacity in real-time
        _testEvent.MaxCapacity = 150;
        _testEvent.UpdatedAt = DateTime.UtcNow;
        _context.Events.Update(_testEvent);
        await _context.SaveChangesAsync();

        // Assert - Capacity updated
        var updated = await _context.Events.FirstAsync(e => e.Id == _testEvent.Id);
        updated.MaxCapacity.Should().Be(150);
        updated.MaxCapacity.Should().NotBe(initialCapacity);
        updated.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task RealTimeUpdates_RsvpCancellation_UpdatesStatus()
    {
        // Arrange - Confirmed RSVP
        var rsvp = new EventRsvp
        {
            EventId = _testEvent.Id,
            MemberId = _testMember1.Id,
            Status = RsvpStatus.Confirmed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Act - Cancel RSVP
        rsvp.Status = RsvpStatus.Cancelled;
        rsvp.UpdatedAt = DateTime.UtcNow;
        _context.EventRsvps.Update(rsvp);
        await _context.SaveChangesAsync();

        // Assert - Status updated
        var updated = await _context.EventRsvps
            .FirstAsync(r => r.EventId == _testEvent.Id && r.MemberId == _testMember1.Id);

        updated.Status.Should().Be(RsvpStatus.Cancelled);
        updated.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task RealTimeUpdates_MemberLastActiveTime_TracksEngagement()
    {
        // Arrange - Member with initial last active time
        var initialTime = _testMember1.UpdatedAt;
        await Task.Delay(10); // Small delay to ensure different timestamps

        // Act - Update last active time (simulating real-time activity)
        _testMember1.UpdatedAt = DateTime.UtcNow;
        _context.Members.Update(_testMember1);
        await _context.SaveChangesAsync();

        // Assert - Last active time updated
        var updated = await _context.Members.FirstAsync(m => m.Id == _testMember1.Id);
        updated.UpdatedAt.Should().BeAfter(initialTime);
        updated.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    #endregion
}
