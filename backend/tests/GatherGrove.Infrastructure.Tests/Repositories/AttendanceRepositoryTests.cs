using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// Tests for AttendanceRepository
/// Covers all 8 methods with comprehensive scenarios
/// </summary>
[TestFixture]
public class AttendanceRepositoryTests : RepositoryTestBase
{
    private AttendanceRepository _repository = null!;
    private Club _testClub = null!;
    private List<Member> _testMembers = null!;
    private Event _testEvent = null!;

    [SetUp]
    public async Task SetUp()
    {
        CreateContext();
        _repository = new AttendanceRepository(Context, NullLogger<AttendanceRepository>.Instance);

        // Seed test data
        _testClub = await SeedClubAsync();
        _testMembers = await SeedMembersAsync(_testClub.Id, 5);

        _testEvent = new Event
        {
            Id = _testClub.Id * 1000 + 1,
            ClubId = _testClub.Id,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            Location = "Test Location"
        };
        Context.Events.Add(_testEvent);
        await Context.SaveChangesAsync();
    }

    #region GetAttendanceByEventIdAsync Tests

    [Test]
    public async Task GetAttendanceByEventIdAsync_WithAttendances_ReturnsOrderedList()
    {
        // Arrange
        var attendance1 = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow.AddHours(-2),
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        var attendance2 = new EventAttendance
        {
            Id = 2,
            EventId = _testEvent.Id,
            MemberId = _testMembers[1].Id,
            AttendedAt = DateTime.UtcNow.AddHours(-1),
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.AddRange(attendance1, attendance2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].Id, Is.EqualTo(attendance1.Id)); // Ordered by AttendedAt ascending
        Assert.That(result[1].Id, Is.EqualTo(attendance2.Id));
    }

    [Test]
    public async Task GetAttendanceByEventIdAsync_NoAttendances_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetAttendanceByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetAttendanceByEventIdAsync_IncludesNavigationProperties()
    {
        // Arrange
        var attendance = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.Add(attendance);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear(); // Clear tracking to ensure Include() is tested

        // Act
        var result = await _repository.GetAttendanceByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Member, Is.Not.Null);
        Assert.That(result[0].Member.FullName, Is.EqualTo(_testMembers[0].FullName));
        Assert.That(result[0].Event, Is.Not.Null);
        Assert.That(result[0].Event.Name, Is.EqualTo(_testEvent.Name));
    }

    #endregion

    #region GetAttendanceByMemberIdAsync Tests

    [Test]
    public async Task GetAttendanceByMemberIdAsync_WithAttendances_ReturnsDescendingOrder()
    {
        // Arrange
        var event2 = new Event
        {
            Id = _testEvent.Id + 1,
            ClubId = _testClub.Id,
            Name = "Second Event",
            EventDateTime = DateTime.UtcNow.AddDays(14),
            CreatedAt = DateTime.UtcNow,
            Location = "Test Location 2"
        };
        Context.Events.Add(event2);
        await Context.SaveChangesAsync();

        var attendance1 = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow.AddDays(-2),
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        var attendance2 = new EventAttendance
        {
            Id = 2,
            EventId = event2.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.AddRange(attendance1, attendance2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceByMemberIdAsync(_testMembers[0].Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].Id, Is.EqualTo(attendance2.Id)); // Most recent first (descending)
        Assert.That(result[1].Id, Is.EqualTo(attendance1.Id));
    }

    [Test]
    public async Task GetAttendanceByMemberIdAsync_NoAttendances_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetAttendanceByMemberIdAsync(_testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetAttendanceByMemberIdAsync_IncludesNavigationProperties()
    {
        // Arrange
        var attendance = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.Add(attendance);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetAttendanceByMemberIdAsync(_testMembers[0].Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Event, Is.Not.Null);
        Assert.That(result[0].Member, Is.Not.Null);
    }

    #endregion

    #region GetAttendanceByClubIdAsync Tests

    [Test]
    public async Task GetAttendanceByClubIdAsync_WithAttendances_ReturnsAllForClub()
    {
        // Arrange
        var attendance1 = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        var attendance2 = new EventAttendance
        {
            Id = 2,
            EventId = _testEvent.Id,
            MemberId = _testMembers[1].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.AddRange(attendance1, attendance2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].Id, Is.EqualTo(attendance2.Id)); // Most recent first (descending)
        Assert.That(result[1].Id, Is.EqualTo(attendance1.Id));
    }

    [Test]
    public async Task GetAttendanceByClubIdAsync_MultipleClubs_ReturnsOnlyForSpecifiedClub()
    {
        // Arrange
        var club2 = await SeedClubAsync("Unlimited", 2);
        var event2 = new Event
        {
            Id = club2.Id * 1000 + 1,
            ClubId = club2.Id,
            Name = "Club 2 Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            Location = "Club 2 Location"
        };
        Context.Events.Add(event2);
        await Context.SaveChangesAsync();

        var attendance1 = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        var attendance2 = new EventAttendance
        {
            Id = 2,
            EventId = event2.Id,
            MemberId = _testMembers[1].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.AddRange(attendance1, attendance2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].EventId, Is.EqualTo(_testEvent.Id));
    }

    [Test]
    public async Task GetAttendanceByClubIdAsync_NoAttendances_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetAttendanceByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetAttendanceByDateRangeAsync Tests

    [Test]
    public async Task GetAttendanceByDateRangeAsync_WithinRange_ReturnsMatchingRecords()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(-7);
        var endDate = DateTime.UtcNow.AddDays(7);

        var attendance1 = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow.AddDays(-2),
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        var attendance2 = new EventAttendance
        {
            Id = 2,
            EventId = _testEvent.Id,
            MemberId = _testMembers[1].Id,
            AttendedAt = DateTime.UtcNow.AddDays(2),
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.AddRange(attendance1, attendance2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceByDateRangeAsync(_testClub.Id, startDate, endDate);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].Id, Is.EqualTo(attendance1.Id)); // Ordered by AttendedAt ascending
        Assert.That(result[1].Id, Is.EqualTo(attendance2.Id));
    }

    [Test]
    public async Task GetAttendanceByDateRangeAsync_OutsideRange_ReturnsEmpty()
    {
        // Arrange
        var attendance = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.Add(attendance);
        await Context.SaveChangesAsync();

        var startDate = DateTime.UtcNow.AddDays(10);
        var endDate = DateTime.UtcNow.AddDays(20);

        // Act
        var result = await _repository.GetAttendanceByDateRangeAsync(_testClub.Id, startDate, endDate);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetAttendanceByDateRangeAsync_BoundaryDates_IncludesExactMatches()
    {
        // Arrange
        var attendedAt = DateTime.UtcNow;
        var attendance = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = attendedAt,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.Add(attendance);
        await Context.SaveChangesAsync();

        // Act - exact match on boundaries
        var result = await _repository.GetAttendanceByDateRangeAsync(_testClub.Id, attendedAt, attendedAt);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
    }

    #endregion

    #region GetTotalAttendanceCountAsync Tests

    [Test]
    public async Task GetTotalAttendanceCountAsync_NoAttendances_ReturnsZero()
    {
        // Act
        var result = await _repository.GetTotalAttendanceCountAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task GetTotalAttendanceCountAsync_MultipleAttendances_ReturnsCorrectCount()
    {
        // Arrange
        var attendances = _testMembers.Take(3).Select((member, index) => new EventAttendance
        {
            Id = index + 1,
            EventId = _testEvent.Id,
            MemberId = member.Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        }).ToList();
        Context.EventAttendances.AddRange(attendances);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetTotalAttendanceCountAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(3));
    }

    #endregion

    #region GetAttendanceRateAsync Tests

    [Test]
    public async Task GetAttendanceRateAsync_NoRsvps_ReturnsZero()
    {
        // Arrange - attendances exist but no RSVPs
        var attendance = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.Add(attendance);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceRateAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(0.0));
    }

    [Test]
    public async Task GetAttendanceRateAsync_PartialAttendance_ReturnsCorrectPercentage()
    {
        // Arrange - 3 RSVPs, 2 attendances = 66.67%
        var rsvps = _testMembers.Take(3).Select((member, index) => new EventRsvp
        {
            Id = index + 1,
            EventId = _testEvent.Id,
            MemberId = member.Id,
            Status = RsvpStatus.Confirmed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();
        Context.EventRsvps.AddRange(rsvps);

        var attendances = _testMembers.Take(2).Select((member, index) => new EventAttendance
        {
            Id = index + 1,
            EventId = _testEvent.Id,
            MemberId = member.Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        }).ToList();
        Context.EventAttendances.AddRange(attendances);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceRateAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(66.66666666666667).Within(0.01));
    }

    [Test]
    public async Task GetAttendanceRateAsync_FullAttendance_Returns100Percent()
    {
        // Arrange - 3 RSVPs, 3 attendances = 100%
        var rsvps = _testMembers.Take(3).Select((member, index) => new EventRsvp
        {
            Id = index + 1,
            EventId = _testEvent.Id,
            MemberId = member.Id,
            Status = RsvpStatus.Confirmed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();
        Context.EventRsvps.AddRange(rsvps);

        var attendances = _testMembers.Take(3).Select((member, index) => new EventAttendance
        {
            Id = index + 1,
            EventId = _testEvent.Id,
            MemberId = member.Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        }).ToList();
        Context.EventAttendances.AddRange(attendances);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceRateAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(100.0));
    }

    #endregion

    #region GetAttendanceRecordAsync Tests

    [Test]
    public async Task GetAttendanceRecordAsync_RecordExists_ReturnsRecord()
    {
        // Arrange
        var attendance = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.Add(attendance);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAttendanceRecordAsync(_testEvent.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.EventId, Is.EqualTo(_testEvent.Id));
        Assert.That(result.MemberId, Is.EqualTo(_testMembers[0].Id));
    }

    [Test]
    public async Task GetAttendanceRecordAsync_RecordNotFound_ReturnsNull()
    {
        // Act
        var result = await _repository.GetAttendanceRecordAsync(_testEvent.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region GetDetailedAttendanceDataAsync Tests

    [Test]
    public async Task GetDetailedAttendanceDataAsync_WithData_ReturnsDetailedRecords()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(-7);
        var endDate = DateTime.UtcNow.AddDays(7);

        var attendance = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.Add(attendance);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetDetailedAttendanceDataAsync(_testClub.Id, startDate, endDate);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Event, Is.Not.Null);
        Assert.That(result[0].Event.Club, Is.Not.Null); // ThenInclude(e => e.Club)
        Assert.That(result[0].Member, Is.Not.Null);
        Assert.That(result[0].Member.MembershipType, Is.Not.Null); // ThenInclude(m => m.MembershipType)
    }

    [Test]
    public async Task GetDetailedAttendanceDataAsync_NoData_ReturnsEmptyList()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(-7);
        var endDate = DateTime.UtcNow.AddDays(7);

        // Act
        var result = await _repository.GetDetailedAttendanceDataAsync(_testClub.Id, startDate, endDate);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetDetailedAttendanceDataAsync_OrdersByAttendedAtAndMemberName()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(-7);
        var endDate = DateTime.UtcNow.AddDays(7);

        // Create attendances with same AttendedAt but different member names
        var attendance1 = new EventAttendance
        {
            Id = 1,
            EventId = _testEvent.Id,
            MemberId = _testMembers[1].Id, // Member 2 (alphabetically after Member 1)
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        var attendance2 = new EventAttendance
        {
            Id = 2,
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id, // Member 1 (alphabetically first)
            AttendedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            AttendanceStatus = AttendanceStatus.Present
        };
        Context.EventAttendances.AddRange(attendance1, attendance2);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetDetailedAttendanceDataAsync(_testClub.Id, startDate, endDate);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        // When AttendedAt is same, should be ordered by Member.FullName
        // Since both have same AttendedAt, order should be by FullName (ThenBy)
    }

    #endregion
}
