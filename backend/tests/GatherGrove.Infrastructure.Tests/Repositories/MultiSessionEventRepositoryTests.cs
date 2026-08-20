using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;
using System.Reflection;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// Tests for MultiSessionEventRepository
/// Covers all 9 methods with comprehensive scenarios including complex progress analytics
/// </summary>
[TestFixture]
public class MultiSessionEventRepositoryTests : RepositoryTestBase
{
    private MultiSessionEventRepository _repository = null!;
    private Club _testClub = null!;
    private List<Member> _testMembers = null!;

    [SetUp]
    public async Task SetUp()
    {
        CreateContext();
        _repository = new MultiSessionEventRepository(Context, NullLogger<MultiSessionEventRepository>.Instance);

        // Seed test data
        _testClub = await SeedClubAsync();
        _testMembers = await SeedMembersAsync(_testClub.Id, 3);
    }

    #region CreateAsync Tests

    [Test]
    public async Task CreateAsync_ValidEvent_CreatesAndReturnsEvent()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "A multi-session workshop",
            Location = "Conference Room",
            MaxCapacity = 20,
            RegistrationRequired = true
        };

        // Act
        var result = await _repository.CreateAsync(multiSessionEvent);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.Name, Is.EqualTo("Workshop Series"));
        Assert.That(result.ClubId, Is.EqualTo(_testClub.Id));
    }

    [Test]
    public async Task CreateAsync_SetsTimestamps()
    {
        // Arrange
        var beforeCreate = DateTime.UtcNow.AddSeconds(-1);
        var multiSessionEvent = new MultiSessionEvent
        {
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description"
        };

        // Act
        var result = await _repository.CreateAsync(multiSessionEvent);
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
    public async Task GetByIdAsync_EventExists_ReturnsEventWithNavigationProperties()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);

        var registration = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.MultiSessionEventRegistrations.Add(registration);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetByIdAsync(multiSessionEvent.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(multiSessionEvent.Id));
        Assert.That(result.Club, Is.Not.Null); // Include(mse => mse.Club)
        Assert.That(result.Registrations, Is.Not.Empty); // Include(mse => mse.Registrations)
    }

    [Test]
    public async Task GetByIdAsync_EventNotFound_ReturnsNull()
    {
        // Act
        var result = await _repository.GetByIdAsync(999);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByIdAsync_ExceptionThrown_ReturnsNull()
    {
        // Arrange - dispose context to force an exception
        Context.Dispose();

        // Act
        var result = await _repository.GetByIdAsync(1);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region GetByIdWithSessionsAsync Tests

    [Test]
    public async Task GetByIdWithSessionsAsync_EventExists_ReturnsWithDeepNavigationProperties()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);

        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);

        var eventRegistration = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.MultiSessionEventRegistrations.Add(eventRegistration);

        var sessionRegistration = new EventSessionRegistration
        {
            Id = 1,
            SessionId = session.Id,
            MultiSessionEventRegistrationId = eventRegistration.Id,
            RegisteredAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.EventSessionRegistrations.Add(sessionRegistration);

        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetByIdWithSessionsAsync(multiSessionEvent.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Club, Is.Not.Null); // Include(mse => mse.Club)
        Assert.That(result.Sessions, Is.Not.Empty); // Include(mse => mse.Sessions)
        Assert.That(result.Sessions.First().SessionRegistrations, Is.Not.Empty); // ThenInclude(s => s.SessionRegistrations)
        Assert.That(result.Registrations, Is.Not.Empty); // Include(mse => mse.Registrations)
        Assert.That(result.Registrations.First().Member, Is.Not.Null); // ThenInclude(r => r.Member)
    }

    [Test]
    public async Task GetByIdWithSessionsAsync_EventNotFound_ReturnsNull()
    {
        // Act
        var result = await _repository.GetByIdWithSessionsAsync(999);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByIdWithSessionsAsync_ExceptionThrown_ReturnsNull()
    {
        // Arrange - dispose context to force an exception
        Context.Dispose();

        // Act
        var result = await _repository.GetByIdWithSessionsAsync(1);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region GetByClubIdAsync Tests

    [Test]
    public async Task GetByClubIdAsync_WithEvents_ReturnsOrderedDescendingByCreatedAt()
    {
        // Arrange
        var event1 = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "First Event",
            Description = "Created earlier",
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-2)
        };
        var event2 = new MultiSessionEvent
        {
            Id = 2,
            ClubId = _testClub.Id,
            Name = "Second Event",
            Description = "Created later",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.MultiSessionEvents.AddRange(event1, event2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].Id, Is.EqualTo(event2.Id)); // Most recent first (descending)
        Assert.That(result[1].Id, Is.EqualTo(event1.Id));
    }

    [Test]
    public async Task GetByClubIdAsync_NoEvents_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetByClubIdAsync_IncludesNavigationProperties()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);

        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
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
        var result = await _repository.GetByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Sessions, Is.Not.Empty); // Include(mse => mse.Sessions)
        Assert.That(result[0].Registrations, Is.Not.Null); // Include(mse => mse.Registrations)
    }

    #endregion

    #region UpdateAsync Tests

    [Test]
    public async Task UpdateAsync_ValidEvent_UpdatesAndReturnsEvent()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Original Name",
            Description = "Original description",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);
        await Context.SaveChangesAsync();

        multiSessionEvent.Name = "Updated Name";
        multiSessionEvent.Description = "Updated description";

        // Act
        var result = await _repository.UpdateAsync(multiSessionEvent);

        // Assert
        Assert.That(result.Name, Is.EqualTo("Updated Name"));
        Assert.That(result.Description, Is.EqualTo("Updated description"));
    }

    [Test]
    public async Task UpdateAsync_UpdatesTimestamp()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Event Name",
            Description = "Description",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);
        await Context.SaveChangesAsync();

        var originalUpdatedAt = multiSessionEvent.UpdatedAt;
        await Task.Delay(10); // Ensure time difference

        multiSessionEvent.Name = "Updated Name";

        // Act
        var beforeUpdate = DateTime.UtcNow.AddSeconds(-1);
        var result = await _repository.UpdateAsync(multiSessionEvent);
        var afterUpdate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        Assert.That(result.UpdatedAt, Is.GreaterThan(originalUpdatedAt));
        Assert.That(result.UpdatedAt, Is.GreaterThan(beforeUpdate));
        Assert.That(result.UpdatedAt, Is.LessThan(afterUpdate));
    }

    #endregion

    #region DeleteAsync Tests

    [Test]
    public async Task DeleteAsync_EventExists_SoftDeletesEvent()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Event to Delete",
            Description = "Description",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);
        await Context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(multiSessionEvent.Id);

        // Assert
        var deleted = await Context.MultiSessionEvents.FindAsync(multiSessionEvent.Id);
        Assert.That(deleted, Is.Not.Null); // Still exists in database
        Assert.That(deleted!.IsActive, Is.False); // But marked as inactive (soft delete)
    }

    [Test]
    public async Task DeleteAsync_SetsIsActiveToFalse()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Event to Delete",
            Description = "Description",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);
        await Context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(multiSessionEvent.Id);

        // Assert
        var result = await Context.MultiSessionEvents.FindAsync(multiSessionEvent.Id);
        Assert.That(result!.IsActive, Is.False);
    }

    [Test]
    public async Task DeleteAsync_EventNotFound_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () => await _repository.DeleteAsync(999));
    }

    #endregion

    #region CreateRegistrationAsync Tests

    [Test]
    public async Task CreateRegistrationAsync_ValidRegistration_CreatesAndReturnsRegistration()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);
        await Context.SaveChangesAsync();

        var registration = new MultiSessionEventRegistration
        {
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            Status = RegistrationStatus.Confirmed
        };

        // Act
        var result = await _repository.CreateRegistrationAsync(registration);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.MultiSessionEventId, Is.EqualTo(multiSessionEvent.Id));
        Assert.That(result.MemberId, Is.EqualTo(_testMembers[0].Id));
    }

    [Test]
    public async Task CreateRegistrationAsync_SetsTimestamps()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);
        await Context.SaveChangesAsync();

        var beforeCreate = DateTime.UtcNow.AddSeconds(-1);
        var registration = new MultiSessionEventRegistration
        {
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            Status = RegistrationStatus.Confirmed
        };

        // Act
        var result = await _repository.CreateRegistrationAsync(registration);
        var afterCreate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        Assert.That(result.CreatedAt, Is.GreaterThan(beforeCreate));
        Assert.That(result.CreatedAt, Is.LessThan(afterCreate));
        Assert.That(result.RegisteredAt, Is.GreaterThan(beforeCreate));
        Assert.That(result.RegisteredAt, Is.LessThan(afterCreate));
    }

    #endregion

    #region GetMemberProgressAsync Tests

    [Test]
    public async Task GetMemberProgressAsync_CompleteProgress_ReturnsCorrectData()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);

        var session1 = new EventSession
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            IsMandatory = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var session2 = new EventSession
        {
            Id = 2,
            MultiSessionEventId = multiSessionEvent.Id,
            SessionNumber = 2,
            Name = "Session 2",
            Description = "Second session",
            StartDateTime = DateTime.UtcNow.AddDays(14),
            EndDateTime = DateTime.UtcNow.AddDays(14).AddHours(2),
            IsMandatory = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.AddRange(session1, session2);

        var registration = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed,
            PaymentStatus = PaymentStatus.Paid
        };
        Context.MultiSessionEventRegistrations.Add(registration);

        // Attended both sessions
        var attendance1 = new EventSessionAttendance
        {
            Id = 1,
            SessionId = session1.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow
        };
        var attendance2 = new EventSessionAttendance
        {
            Id = 2,
            SessionId = session2.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow
        };
        Context.EventSessionAttendances.AddRange(attendance1, attendance2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMemberProgressAsync(multiSessionEvent.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Not.Null);

        // Use reflection to access anonymous type properties
        var resultType = result!.GetType();
        var memberId = (int)resultType.GetProperty("MemberId")!.GetValue(result)!;
        var totalSessions = (int)resultType.GetProperty("TotalSessions")!.GetValue(result)!;
        var attendedSessions = (int)resultType.GetProperty("AttendedSessions")!.GetValue(result)!;
        var completionPercentage = (decimal)resultType.GetProperty("CompletionPercentage")!.GetValue(result)!;
        var isEligibleForCompletion = (bool)resultType.GetProperty("IsEligibleForCompletion")!.GetValue(result)!;
        var paymentStatus = (string)resultType.GetProperty("PaymentStatus")!.GetValue(result)!;

        Assert.That(memberId, Is.EqualTo(_testMembers[0].Id));
        Assert.That(totalSessions, Is.EqualTo(2));
        Assert.That(attendedSessions, Is.EqualTo(2));
        Assert.That(completionPercentage, Is.EqualTo(100.0m));
        Assert.That(isEligibleForCompletion, Is.True);
        Assert.That(paymentStatus, Is.EqualTo("Paid"));
    }

    [Test]
    public async Task GetMemberProgressAsync_PartialProgress_ReturnsCorrectPercentage()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);

        var session1 = new EventSession
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            IsMandatory = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var session2 = new EventSession
        {
            Id = 2,
            MultiSessionEventId = multiSessionEvent.Id,
            SessionNumber = 2,
            Name = "Session 2",
            Description = "Second session",
            StartDateTime = DateTime.UtcNow.AddDays(14),
            EndDateTime = DateTime.UtcNow.AddDays(14).AddHours(2),
            IsMandatory = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.AddRange(session1, session2);

        var registration = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed,
            PaymentStatus = PaymentStatus.Pending
        };
        Context.MultiSessionEventRegistrations.Add(registration);

        // Attended only first session
        var attendance1 = new EventSessionAttendance
        {
            Id = 1,
            SessionId = session1.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow
        };
        Context.EventSessionAttendances.Add(attendance1);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMemberProgressAsync(multiSessionEvent.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Not.Null);

        var resultType = result!.GetType();
        var attendedSessions = (int)resultType.GetProperty("AttendedSessions")!.GetValue(result)!;
        var completionPercentage = (decimal)resultType.GetProperty("CompletionPercentage")!.GetValue(result)!;

        Assert.That(attendedSessions, Is.EqualTo(1));
        Assert.That(completionPercentage, Is.EqualTo(50.0m)); // 1 of 2 sessions = 50%
    }

    [Test]
    public async Task GetMemberProgressAsync_EventNotFound_ReturnsNull()
    {
        // Act
        var result = await _repository.GetMemberProgressAsync(999, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMemberProgressAsync_MandatorySessions_TracksEligibility()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);

        var session1 = new EventSession
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            IsMandatory = true, // Mandatory
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var session2 = new EventSession
        {
            Id = 2,
            MultiSessionEventId = multiSessionEvent.Id,
            SessionNumber = 2,
            Name = "Session 2",
            Description = "Second session",
            StartDateTime = DateTime.UtcNow.AddDays(14),
            EndDateTime = DateTime.UtcNow.AddDays(14).AddHours(2),
            IsMandatory = false, // Optional
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.AddRange(session1, session2);

        var registration = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed,
            PaymentStatus = PaymentStatus.Paid
        };
        Context.MultiSessionEventRegistrations.Add(registration);

        // Attended only mandatory session
        var attendance1 = new EventSessionAttendance
        {
            Id = 1,
            SessionId = session1.Id,
            MemberId = _testMembers[0].Id,
            AttendedAt = DateTime.UtcNow
        };
        Context.EventSessionAttendances.Add(attendance1);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMemberProgressAsync(multiSessionEvent.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Not.Null);

        var resultType = result!.GetType();
        var mandatorySessionsCompleted = (int)resultType.GetProperty("MandatorySessionsCompleted")!.GetValue(result)!;
        var totalMandatorySessions = (int)resultType.GetProperty("TotalMandatorySessions")!.GetValue(result)!;
        var isEligibleForCompletion = (bool)resultType.GetProperty("IsEligibleForCompletion")!.GetValue(result)!;

        Assert.That(mandatorySessionsCompleted, Is.EqualTo(1));
        Assert.That(totalMandatorySessions, Is.EqualTo(1));
        Assert.That(isEligibleForCompletion, Is.True); // Attended all mandatory sessions
    }

    #endregion

    #region GetRegistrationsAsync Tests

    [Test]
    public async Task GetRegistrationsAsync_WithRegistrations_ReturnsOrderedList()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);

        var registration1 = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow.AddDays(-2),
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        var registration2 = new MultiSessionEventRegistration
        {
            Id = 2,
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[1].Id,
            RegisteredAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.MultiSessionEventRegistrations.AddRange(registration1, registration2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetRegistrationsAsync(multiSessionEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].Id, Is.EqualTo(registration1.Id)); // Ordered by RegisteredAt ascending
        Assert.That(result[1].Id, Is.EqualTo(registration2.Id));
    }

    [Test]
    public async Task GetRegistrationsAsync_NoRegistrations_ReturnsEmptyList()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetRegistrationsAsync(multiSessionEvent.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetRegistrationsAsync_IncludesNavigationProperties()
    {
        // Arrange
        var multiSessionEvent = new MultiSessionEvent
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Workshop Series",
            Description = "Test description",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.MultiSessionEvents.Add(multiSessionEvent);

        var session = new EventSession
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            SessionNumber = 1,
            Name = "Session 1",
            Description = "First session",
            StartDateTime = DateTime.UtcNow.AddDays(7),
            EndDateTime = DateTime.UtcNow.AddDays(7).AddHours(2),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSessions.Add(session);

        var eventRegistration = new MultiSessionEventRegistration
        {
            Id = 1,
            MultiSessionEventId = multiSessionEvent.Id,
            MemberId = _testMembers[0].Id,
            RegisteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.MultiSessionEventRegistrations.Add(eventRegistration);

        var sessionRegistration = new EventSessionRegistration
        {
            Id = 1,
            SessionId = session.Id,
            MultiSessionEventRegistrationId = eventRegistration.Id,
            RegisteredAt = DateTime.UtcNow,
            Status = RegistrationStatus.Confirmed
        };
        Context.EventSessionRegistrations.Add(sessionRegistration);

        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetRegistrationsAsync(multiSessionEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Member, Is.Not.Null); // Include(r => r.Member)
        Assert.That(result[0].Member.FullName, Is.EqualTo(_testMembers[0].FullName));
        Assert.That(result[0].SessionRegistrations, Is.Not.Empty); // Include(r => r.SessionRegistrations)
        Assert.That(result[0].SessionRegistrations.First().Session, Is.Not.Null); // ThenInclude(sr => sr.Session)
    }

    #endregion
}
