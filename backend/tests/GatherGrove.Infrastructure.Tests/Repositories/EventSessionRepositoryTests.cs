using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// Tests for EventSessionRepository
/// Covers all 7 methods with comprehensive scenarios including upsert logic
/// </summary>
[TestFixture]
public class EventSessionRepositoryTests : RepositoryTestBase
{
    private EventSessionRepository _repository = null!;
    private Club _testClub = null!;
    private List<Member> _testMembers = null!;
    private MultiSessionEvent _testMultiSessionEvent = null!;

    [SetUp]
    public async Task SetUp()
    {
        CreateContext();
        _repository = new EventSessionRepository(Context, NullLogger<EventSessionRepository>.Instance);

        // Seed test data
        _testClub = await SeedClubAsync();
        _testMembers = await SeedMembersAsync(_testClub.Id, 3);

        _testMultiSessionEvent = new MultiSessionEvent
        {
            Id = _testClub.Id * 1000 + 1,
            ClubId = _testClub.Id,
            Name = "Test Workshop Series",
            Description = "A multi-session workshop",
            Location = "Conference Room",
            MaxCapacity = 20,
            RegistrationRequired = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(_testMultiSessionEvent);
        await Context.SaveChangesAsync();
    }

    #region CreateAsync Tests

    [Test]
    public async Task CreateAsync_ValidSession_CreatesAndReturnsSession()
    {
        // Arrange
        var session = new EventSession
        {
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2)
        };

        // Act
        var result = await _repository.CreateAsync(session);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.Name, Is.EqualTo("Session 1"));
        Assert.That(result.MultiSessionEventId, Is.EqualTo(_testMultiSessionEvent.Id));
    }

    [Test]
    public async Task CreateAsync_SetsTimestamps()
    {
        // Arrange
        var beforeCreate = DateTime.UtcNow.AddSeconds(-1);
        var session = new EventSession
        {
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2)
        };

        // Act
        var result = await _repository.CreateAsync(session);
        var afterCreate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        Assert.That(result.CreatedAt, Is.GreaterThan(beforeCreate));
        Assert.That(result.CreatedAt, Is.LessThan(afterCreate));
        Assert.That(result.UpdatedAt, Is.GreaterThan(beforeCreate));
        Assert.That(result.UpdatedAt, Is.LessThan(afterCreate));
    }

    #endregion

    #region GetByIdAsync Tests

    [Test]
    public async Task GetByIdAsync_SessionExists_ReturnsSessionWithNavigationProperties()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetByIdAsync(session.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(session.Id));
        Assert.That(result.MultiSessionEvent, Is.Not.Null);
        Assert.That(result.MultiSessionEvent.Name, Is.EqualTo(_testMultiSessionEvent.Name));
    }

    [Test]
    public async Task GetByIdAsync_SessionNotFound_ReturnsNull()
    {
        // Act
        var result = await _repository.GetByIdAsync(999);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByIdAsync_IncludesAllNavigationProperties()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);

        // Add a session registration
        var multiEventRegistration = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.MultiSessionEventRegistrations.Add(multiEventRegistration);

        var sessionRegistration = new EventSessionRegistration
        {
            Id = 1,
            SessionId = session.Id,
            MultiSessionEventRegistrationId = multiEventRegistration.Id,
            RegisteredAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.EventSessionRegistrations.Add(sessionRegistration);

        // Add a session attendance
        var attendance = new EventSessionAttendance
        {
            Id = 1,
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow
        };
        Context.EventSessionAttendances.Add(attendance);

        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetByIdAsync(session.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.MultiSessionEvent, Is.Not.Null); // Include(s => s.MultiSessionEvent)
        Assert.That(result.SessionRegistrations, Is.Not.Empty); // Include(s => s.SessionRegistrations)
        Assert.That(result.SessionAttendances, Is.Not.Empty); // Include(s => s.SessionAttendances)
    }

    #endregion

    #region GetByMultiSessionEventIdAsync Tests

    [Test]
    public async Task GetByMultiSessionEventIdAsync_OrdersBySessionNumber()
    {
        // Arrange - create sessions out of order
        var session2 = new EventSession
        {
            Id = 2,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 2,
            Name = "Session 2",
            Description = "Second session",
            StartDateTime = DateTime.UtcNow.AddDays(14),
            EndDateTime = DateTime.UtcNow.AddDays(14).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var session1 = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var session3 = new EventSession
        {
            Id = 3,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 3,
            Name = "Session 3",
            Description = "Third session",
            StartDateTime = DateTime.UtcNow.AddDays(21),
            EndDateTime = DateTime.UtcNow.AddDays(21).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.AddRange(session2, session1, session3); // Add out of order
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByMultiSessionEventIdAsync(_testMultiSessionEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(3));
        Assert.That(result[0].SessionNumber, Is.EqualTo(1)); // Ordered by SessionNumber
        Assert.That(result[1].SessionNumber, Is.EqualTo(2));
        Assert.That(result[2].SessionNumber, Is.EqualTo(3));
    }

    [Test]
    public async Task GetByMultiSessionEventIdAsync_NoSessions_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetByMultiSessionEventIdAsync(_testMultiSessionEvent.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetByMultiSessionEventIdAsync_IncludesNavigationProperties()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);

        var multiEventRegistration = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.MultiSessionEventRegistrations.Add(multiEventRegistration);

        var sessionRegistration = new EventSessionRegistration
        {
            Id = 1,
            SessionId = session.Id,
            MultiSessionEventRegistrationId = multiEventRegistration.Id,
            RegisteredAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.EventSessionRegistrations.Add(sessionRegistration);

        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetByMultiSessionEventIdAsync(_testMultiSessionEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].SessionRegistrations, Is.Not.Empty); // Include(s => s.SessionRegistrations)
        Assert.That(result[0].SessionAttendances, Is.Not.Null); // Include(s => s.SessionAttendances)
    }

    #endregion

    #region UpdateAsync Tests

    [Test]
    public async Task UpdateAsync_ValidSession_UpdatesAndReturnsSession()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.EventSessions.Add(session);
        await Context.SaveChangesAsync();

        session.Name = "Updated Session 1";
        session.Description = "Updated description";

        // Act
        var result = await _repository.UpdateAsync(session);

        // Assert
        Assert.That(result.Name, Is.EqualTo("Updated Session 1"));
        Assert.That(result.Description, Is.EqualTo("Updated description"));
    }

    [Test]
    public async Task UpdateAsync_UpdatesTimestamp()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.EventSessions.Add(session);
        await Context.SaveChangesAsync();

        var originalUpdatedAt = session.UpdatedAt;
        await Task.Delay(10); // Ensure time difference

        session.Name = "Updated Session 1";

        // Act
        var beforeUpdate = DateTime.UtcNow.AddSeconds(-1);
        var result = await _repository.UpdateAsync(session);
        var afterUpdate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        Assert.That(result.UpdatedAt, Is.GreaterThan(originalUpdatedAt));
        Assert.That(result.UpdatedAt, Is.GreaterThan(beforeUpdate));
        Assert.That(result.UpdatedAt, Is.LessThan(afterUpdate));
    }

    #endregion

    #region DeleteAsync Tests

    [Test]
    public async Task DeleteAsync_SessionExists_DeletesSession()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);
        await Context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(session.Id);

        // Assert
        var deleted = await Context.EventSessions.FindAsync(session.Id);
        Assert.That(deleted, Is.Null);
    }

    [Test]
    public async Task DeleteAsync_SessionNotFound_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () => await _repository.DeleteAsync(999));
    }

    #endregion

    #region GetSessionAttendanceAsync Tests

    [Test]
    public async Task GetSessionAttendanceAsync_WithAttendances_ReturnsAllRecords()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);

        var attendance1 = new EventSessionAttendance
        {
            Id = 1,
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow
        };
        var attendance2 = new EventSessionAttendance
        {
            Id = 2,
            SessionId = session.Id,
            MemberId = _testMembers[1].Id,
            AttendedAt = DateTime.UtcNow
        };
        Context.EventSessionAttendances.AddRange(attendance1, attendance2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetSessionAttendanceAsync(session.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
    }

    [Test]
    public async Task GetSessionAttendanceAsync_NoAttendances_ReturnsEmptyList()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetSessionAttendanceAsync(session.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetSessionAttendanceAsync_IncludesNavigationProperties()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);

        var attendance = new EventSessionAttendance
        {
            Id = 1,
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow
        };
        Context.EventSessionAttendances.Add(attendance);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetSessionAttendanceAsync(session.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Member, Is.Not.Null); // Include(a => a.Member)
        Assert.That(result[0].Member.FullName, Is.EqualTo(_testMembers[0].FullName));
        Assert.That(result[0].Session, Is.Not.Null); // Include(a => a.Session)
        Assert.That(result[0].Session.Name, Is.EqualTo(session.Name));
    }

    #endregion

    #region RecordAttendanceAsync Tests (Upsert Logic)

    [Test]
    public async Task RecordAttendanceAsync_NewRecord_CreatesAttendance()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);
        await Context.SaveChangesAsync();

        var attendance = new EventSessionAttendance
        {
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            Notes = "Attended via check-in"
        };

        // Act
        var result = await _repository.RecordAttendanceAsync(attendance);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.SessionId, Is.EqualTo(session.Id));
        Assert.That(result.MemberId, Is.EqualTo(_testMembers[0].Id));
        Assert.That(result.Notes, Is.EqualTo("Attended via check-in"));
    }

    [Test]
    public async Task RecordAttendanceAsync_ExistingRecord_UpdatesAttendance()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);

        var existingAttendance = new EventSessionAttendance
        {
            Id = 1,
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow.AddHours(-1),
            Notes = "Initial check-in"
        };
        Context.EventSessionAttendances.Add(existingAttendance);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        var updatedAttendance = new EventSessionAttendance
        {
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow,
            CheckOutTime = DateTime.UtcNow,
            Notes = "Checked out"
        };

        // Act
        var result = await _repository.RecordAttendanceAsync(updatedAttendance);

        // Assert - should update existing record, not create new one
        var allRecords = await Context.EventSessionAttendances
            .Where(a => a.SessionId == session.Id && a.MemberId == _testMembers[0].Id)
            .ToListAsync();

        Assert.That(allRecords, Has.Count.EqualTo(1)); // Only one record exists (updated, not created)
        Assert.That(result.Id, Is.EqualTo(existingAttendance.Id)); // Same ID
        Assert.That(result.Notes, Is.EqualTo("Checked out")); // Notes updated
        Assert.That(result.CheckOutTime, Is.Not.Null); // CheckOutTime updated
    }

    [Test]
    public async Task RecordAttendanceAsync_NewRecord_SetsDefaultAttendedAt()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);
        await Context.SaveChangesAsync();

        var attendance = new EventSessionAttendance
        {
            SessionId = session.Id,
            MemberId = _testMembers[0].Id
            // AttendedAt not set
        };

        // Act
        var beforeRecord = DateTime.UtcNow.AddSeconds(-1);
        var result = await _repository.RecordAttendanceAsync(attendance);
        var afterRecord = DateTime.UtcNow.AddSeconds(1);

        // Assert - AttendedAt should be set to DateTime.UtcNow
        Assert.That(result.AttendedAt, Is.Not.Null);
        Assert.That(result.AttendedAt!.Value, Is.GreaterThan(beforeRecord));
        Assert.That(result.AttendedAt!.Value, Is.LessThan(afterRecord));
    }

    [Test]
    public async Task RecordAttendanceAsync_ExistingRecord_UpdatesSpecificFields()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);

        var existingAttendance = new EventSessionAttendance
        {
            Id = 1,
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow.AddHours(-2),
            Notes = "Original notes"
        };
        Context.EventSessionAttendances.Add(existingAttendance);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        var newAttendedAt = DateTime.UtcNow.AddHours(-1);
        var updatedAttendance = new EventSessionAttendance
        {
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = newAttendedAt,
            CheckOutTime = DateTime.UtcNow,
            Notes = "Updated notes"
        };

        // Act
        var result = await _repository.RecordAttendanceAsync(updatedAttendance);

        // Assert - verify specific fields were updated
        Assert.That(result.AttendedAt, Is.EqualTo(newAttendedAt));
        Assert.That(result.CheckOutTime, Is.Not.Null);
        Assert.That(result.Notes, Is.EqualTo("Updated notes"));
    }

    [Test]
    public async Task RecordAttendanceAsync_UpsertBehavior_VerifiedByCount()
    {
        // Arrange
        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = _testMultiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);
        await Context.SaveChangesAsync();

        var attendance = new EventSessionAttendance
        {
            SessionId = session.Id,
            MemberId = _testMembers[0].Id
        };

        // Act - call twice with same SessionId and MemberId
        var firstResult = await _repository.RecordAttendanceAsync(attendance);
        Context.ChangeTracker.Clear();

        var secondAttendance = new EventSessionAttendance
        {
            SessionId = session.Id,
            MemberId = _testMembers[0].Id,
            Notes = "Second call"
        };
        var secondResult = await _repository.RecordAttendanceAsync(secondAttendance);

        // Assert - should only have one record (upsert, not insert)
        var totalRecords = await Context.EventSessionAttendances
            .Where(a => a.SessionId == session.Id && a.MemberId == _testMembers[0].Id)
            .CountAsync();

        Assert.That(totalRecords, Is.EqualTo(1)); // Upsert behavior confirmed
        Assert.That(secondResult.Notes, Is.EqualTo("Second call")); // Updated notes
    }

    #endregion
}
