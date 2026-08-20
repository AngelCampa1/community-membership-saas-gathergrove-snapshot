using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;
using GatherGrove.Domain.Entities;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// Comprehensive tests for WaitlistRepository
/// Tests complex waitlist position management and reordering logic
/// CRITICAL: Tests position reordering algorithms that prevent data corruption
/// </summary>
public class WaitlistRepositoryTests : RepositoryTestBase
{
    private WaitlistRepository _repository = null!;
    private Event _testEvent = null!;
    private List<Member> _testMembers = null!;

    [SetUp]
    public async Task Setup()
    {
        // Create a fresh database context for each test to ensure isolation
        CreateContext();
        _repository = new WaitlistRepository(Context, NullLogger<WaitlistRepository>.Instance);

        // Create test data
        var club = await SeedClubAsync();
        _testEvent = (await SeedEventsAsync(club.Id, 1))[0];
        _testMembers = await SeedMembersAsync(club.Id, 10);
    }

    [TearDown]
    public void TearDown()
    {
        // Dispose the context after each test
        Context?.Dispose();
    }

    #region CreateAsync Tests (5 tests)

    [Test]
    public async Task CreateAsync_ValidEntry_CreatesAndReturnsWaitlistEntry()
    {
        // Arrange
        var entry = new EventWaitlist
        {
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            Position = 1,
            Priority = WaitlistPriority.Normal
        };

        // Act
        var result = await _repository.CreateAsync(entry);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.EventId, Is.EqualTo(_testEvent.Id));
        Assert.That(result.MemberId, Is.EqualTo(_testMembers[0].Id));
        Assert.That(result.Position, Is.EqualTo(1));
        Assert.That(result.CreatedAt, Is.Not.EqualTo(default(DateTime)));
        Assert.That(result.UpdatedAt, Is.Not.EqualTo(default(DateTime)));
    }

    [Test]
    public async Task CreateAsync_SetsCreatedAtAndUpdatedAt()
    {
        // Arrange
        var beforeCreate = DateTime.UtcNow.AddSeconds(-1);
        var entry = new EventWaitlist
        {
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            Position = 1,
            Priority = WaitlistPriority.Normal
        };

        // Act
        var result = await _repository.CreateAsync(entry);
        var afterCreate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        Assert.That(result.CreatedAt, Is.GreaterThan(beforeCreate));
        Assert.That(result.CreatedAt, Is.LessThan(afterCreate));
        Assert.That(result.UpdatedAt, Is.GreaterThan(beforeCreate));
        Assert.That(result.UpdatedAt, Is.LessThan(afterCreate));
    }

    [Test]
    public async Task CreateAsync_WithDifferentPriorities_CreatesCorrectly()
    {
        // Arrange
        var highPriorityEntry = new EventWaitlist
        {
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            Position = 1,
            Priority = WaitlistPriority.High
        };

        // Act
        var result = await _repository.CreateAsync(highPriorityEntry);

        // Assert
        Assert.That(result.Priority, Is.EqualTo(WaitlistPriority.High));
    }

    [Test]
    public async Task CreateAsync_WithNotes_SavesNotes()
    {
        // Arrange
        var entry = new EventWaitlist
        {
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            Position = 1,
            Priority = WaitlistPriority.Normal,
            Notes = "VIP member"
        };

        // Act
        var result = await _repository.CreateAsync(entry);

        // Assert
        Assert.That(result.Notes, Is.EqualTo("VIP member"));
    }

    [Test]
    public async Task CreateAsync_MultipleEntries_AssignsDifferentIds()
    {
        // Arrange
        var entry1 = new EventWaitlist
        {
            EventId = _testEvent.Id,
            MemberId = _testMembers[0].Id,
            Position = 1,
            Priority = WaitlistPriority.Normal
        };
        var entry2 = new EventWaitlist
        {
            EventId = _testEvent.Id,
            MemberId = _testMembers[1].Id,
            Position = 2,
            Priority = WaitlistPriority.Normal
        };

        // Act
        var result1 = await _repository.CreateAsync(entry1);
        var result2 = await _repository.CreateAsync(entry2);

        // Assert
        Assert.That(result1.Id, Is.Not.EqualTo(result2.Id));
    }

    #endregion

    #region GetByEventIdAsync Tests (6 tests)

    [Test]
    public async Task GetByEventIdAsync_WithEntries_ReturnsOrderedByPosition()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);

        // Act
        var result = await _repository.GetByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(3));
        Assert.That(result[0].Position, Is.EqualTo(1));
        Assert.That(result[1].Position, Is.EqualTo(2));
        Assert.That(result[2].Position, Is.EqualTo(3));
    }

    [Test]
    public async Task GetByEventIdAsync_NoEntries_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task GetByEventIdAsync_IncludesEventNavigationProperty()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        var result = await _repository.GetByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result[0].Event, Is.Not.Null);
        Assert.That(result[0].Event.Id, Is.EqualTo(_testEvent.Id));
    }

    [Test]
    public async Task GetByEventIdAsync_IncludesMemberNavigationProperty()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        var result = await _repository.GetByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result[0].Member, Is.Not.Null);
        Assert.That(result[0].Member.Id, Is.EqualTo(_testMembers[0].Id));
    }

    [Test]
    public async Task GetByEventIdAsync_MultipleEvents_ReturnsOnlySpecifiedEvent()
    {
        // Arrange
        var event2 = new Event { Id = _testEvent.Id + 100, ClubId = _testEvent.ClubId, Name = "Second Test Event", EventDateTime = DateTime.UtcNow.AddDays(14), CreatedAt = DateTime.UtcNow, Location = "Test Location" };
        Context.Events.Add(event2);
        await Context.SaveChangesAsync();
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(event2.Id, _testMembers[1].Id, position: 1);

        // Act
        var result = await _repository.GetByEventIdAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].EventId, Is.EqualTo(_testEvent.Id));
    }

    [Test]
    public async Task GetByEventIdAsync_InvalidEventId_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetByEventIdAsync(999);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetByEventAndMemberAsync Tests (5 tests)

    [Test]
    public async Task GetByEventAndMemberAsync_ExistingEntry_ReturnsEntry()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        var result = await _repository.GetByEventAndMemberAsync(_testEvent.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.EventId, Is.EqualTo(_testEvent.Id));
        Assert.That(result.MemberId, Is.EqualTo(_testMembers[0].Id));
    }

    [Test]
    public async Task GetByEventAndMemberAsync_NonExistingEntry_ReturnsNull()
    {
        // Act
        var result = await _repository.GetByEventAndMemberAsync(_testEvent.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByEventAndMemberAsync_IncludesNavigationProperties()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        var result = await _repository.GetByEventAndMemberAsync(_testEvent.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result!.Event, Is.Not.Null);
        Assert.That(result.Member, Is.Not.Null);
    }

    [Test]
    public async Task GetByEventAndMemberAsync_WrongEvent_ReturnsNull()
    {
        // Arrange
        var event2 = new Event { Id = _testEvent.Id + 100, ClubId = _testEvent.ClubId, Name = "Second Test Event", EventDateTime = DateTime.UtcNow.AddDays(14), CreatedAt = DateTime.UtcNow, Location = "Test Location" };
        Context.Events.Add(event2);
        await Context.SaveChangesAsync();
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        var result = await _repository.GetByEventAndMemberAsync(event2.Id, _testMembers[0].Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetByEventAndMemberAsync_WrongMember_ReturnsNull()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        var result = await _repository.GetByEventAndMemberAsync(_testEvent.Id, _testMembers[1].Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region DeleteAsync Tests (8 tests)

    [Test]
    public async Task DeleteAsync_ExistingEntry_DeletesSuccessfully()
    {
        // Arrange
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        await _repository.DeleteAsync(entry.Id);

        // Assert
        var result = await _repository.GetByEventAndMemberAsync(_testEvent.Id, _testMembers[0].Id);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task DeleteAsync_NonExistingEntry_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () => await _repository.DeleteAsync(999));
    }

    [Test]
    public async Task DeleteAsync_ReordersRemainingEntries()
    {
        // Arrange - create entries at positions 1, 2, 3
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        var entry2 = await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act - delete entry at position 2
        await _repository.DeleteAsync(entry2.Id);

        // Assert - positions should now be 1, 2 (previously 3 shifted down)
        var remaining = await _repository.GetByEventIdAsync(_testEvent.Id);
        Assert.That(remaining, Has.Count.EqualTo(2));
        Assert.That(remaining[0].Position, Is.EqualTo(1));
        Assert.That(remaining[1].Position, Is.EqualTo(2)); // Was position 3, now 2
    }

    [Test]
    public async Task DeleteAsync_FirstPosition_ReordersCorrectly()
    {
        // Arrange
        var entry1 = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act
        await _repository.DeleteAsync(entry1.Id);

        // Assert
        var remaining = await _repository.GetByEventIdAsync(_testEvent.Id);
        Assert.That(remaining, Has.Count.EqualTo(2));
        Assert.That(remaining[0].Position, Is.EqualTo(1)); // Was position 2
        Assert.That(remaining[1].Position, Is.EqualTo(2)); // Was position 3
    }

    [Test]
    public async Task DeleteAsync_LastPosition_NoReordering()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        var entry3 = await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act
        await _repository.DeleteAsync(entry3.Id);

        // Assert
        var remaining = await _repository.GetByEventIdAsync(_testEvent.Id);
        Assert.That(remaining, Has.Count.EqualTo(2));
        Assert.That(remaining[0].Position, Is.EqualTo(1));
        Assert.That(remaining[1].Position, Is.EqualTo(2));
    }

    [Test]
    public async Task DeleteAsync_UpdatesUpdatedAtForReorderedEntries()
    {
        // Arrange
        var beforeDelete = DateTime.UtcNow.AddSeconds(-1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        var entry2 = await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act
        await _repository.DeleteAsync(entry2.Id);
        var afterDelete = DateTime.UtcNow.AddSeconds(1);

        // Assert
        var remaining = await _repository.GetByEventIdAsync(_testEvent.Id);
        // Position 3 became position 2, so UpdatedAt should be updated
        Assert.That(remaining[1].UpdatedAt, Is.GreaterThan(beforeDelete));
        Assert.That(remaining[1].UpdatedAt, Is.LessThan(afterDelete));
    }

    [Test]
    public async Task DeleteAsync_MultipleEvents_OnlyReordersAffectedEvent()
    {
        // Arrange
        var event2 = new Event { Id = _testEvent.Id + 100, ClubId = _testEvent.ClubId, Name = "Second Test Event", EventDateTime = DateTime.UtcNow.AddDays(14), CreatedAt = DateTime.UtcNow, Location = "Test Location" };
        Context.Events.Add(event2);
        await Context.SaveChangesAsync();
        var entry1 = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(event2.Id, _testMembers[2].Id, position: 1);
        await CreateWaitlistEntry(event2.Id, _testMembers[3].Id, position: 2);

        // Act
        await _repository.DeleteAsync(entry1.Id);

        // Assert
        var event1Remaining = await _repository.GetByEventIdAsync(_testEvent.Id);
        var event2Remaining = await _repository.GetByEventIdAsync(event2.Id);

        Assert.That(event1Remaining, Has.Count.EqualTo(1));
        Assert.That(event1Remaining[0].Position, Is.EqualTo(1)); // Was position 2
        Assert.That(event2Remaining, Has.Count.EqualTo(2)); // Unchanged
        Assert.That(event2Remaining[0].Position, Is.EqualTo(1));
        Assert.That(event2Remaining[1].Position, Is.EqualTo(2));
    }

    [Test]
    public async Task DeleteAsync_OnlyEntry_DeletesWithoutError()
    {
        // Arrange
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        await _repository.DeleteAsync(entry.Id);

        // Assert
        var remaining = await _repository.GetByEventIdAsync(_testEvent.Id);
        Assert.That(remaining, Is.Empty);
    }

    #endregion

    #region GetNextPositionAsync Tests (5 tests)

    [Test]
    public async Task GetNextPositionAsync_EmptyWaitlist_ReturnsOne()
    {
        // Act
        var result = await _repository.GetNextPositionAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(1));
    }

    [Test]
    public async Task GetNextPositionAsync_WithEntries_ReturnsMaxPlusOne()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act
        var result = await _repository.GetNextPositionAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(4));
    }

    [Test]
    public async Task GetNextPositionAsync_AfterDeletion_ReturnsCorrectPosition()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);

        // Act
        var result = await _repository.GetNextPositionAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(3));
    }

    [Test]
    public async Task GetNextPositionAsync_NonContiguousPositions_ReturnsMaxPlusOne()
    {
        // Arrange - positions 1, 3, 5 (gaps don't matter)
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 3);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 5);

        // Act
        var result = await _repository.GetNextPositionAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(6));
    }

    [Test]
    public async Task GetNextPositionAsync_InvalidEventId_ReturnsOne()
    {
        // Act
        var result = await _repository.GetNextPositionAsync(999);

        // Assert
        Assert.That(result, Is.EqualTo(1));
    }

    #endregion

    #region GetNextPositionForPriorityAsync Tests (8 tests)

    [Test]
    public async Task GetNextPositionForPriorityAsync_EmptyWaitlist_ReturnsOne()
    {
        // Act
        var result = await _repository.GetNextPositionForPriorityAsync(_testEvent.Id, WaitlistPriority.Normal);

        // Assert
        Assert.That(result, Is.EqualTo(1));
    }

    [Test]
    public async Task GetNextPositionForPriorityAsync_HigherPriorityExists_InsertsAfterHigherPriority()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1, priority: WaitlistPriority.VIP);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2, priority: WaitlistPriority.High);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3, priority: WaitlistPriority.Normal);

        // Act - add new High priority entry
        var result = await _repository.GetNextPositionForPriorityAsync(_testEvent.Id, WaitlistPriority.High);

        // Assert
        Assert.That(result, Is.EqualTo(3)); // After position 2 (last High priority)
    }

    [Test]
    public async Task GetNextPositionForPriorityAsync_SamePriorityExists_InsertsAfterSamePriority()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1, priority: WaitlistPriority.Normal);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2, priority: WaitlistPriority.Normal);

        // Act
        var result = await _repository.GetNextPositionForPriorityAsync(_testEvent.Id, WaitlistPriority.Normal);

        // Assert
        Assert.That(result, Is.EqualTo(3)); // After position 2
    }

    [Test]
    public async Task GetNextPositionForPriorityAsync_LowerPriorityOnly_InsertsAtEnd()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1, priority: WaitlistPriority.Low);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2, priority: WaitlistPriority.Low);

        // Act
        var result = await _repository.GetNextPositionForPriorityAsync(_testEvent.Id, WaitlistPriority.Normal);

        // Assert
        Assert.That(result, Is.EqualTo(3)); // At the end
    }

    [Test]
    public async Task GetNextPositionForPriorityAsync_VIPPriority_InsertsFirst()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1, priority: WaitlistPriority.Normal);

        // Act
        var result = await _repository.GetNextPositionForPriorityAsync(_testEvent.Id, WaitlistPriority.VIP);

        // Assert
        Assert.That(result, Is.EqualTo(2)); // At the end since no VIP exists
    }

    [Test]
    public async Task GetNextPositionForPriorityAsync_MultipleVIPs_InsertsAfterLastVIP()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1, priority: WaitlistPriority.VIP);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2, priority: WaitlistPriority.VIP);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3, priority: WaitlistPriority.Normal);

        // Act
        var result = await _repository.GetNextPositionForPriorityAsync(_testEvent.Id, WaitlistPriority.VIP);

        // Assert
        Assert.That(result, Is.EqualTo(3)); // After position 2 (last VIP)
    }

    [Test]
    public async Task GetNextPositionForPriorityAsync_LowPriority_InsertsAtEnd()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1, priority: WaitlistPriority.VIP);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2, priority: WaitlistPriority.Normal);

        // Act
        var result = await _repository.GetNextPositionForPriorityAsync(_testEvent.Id, WaitlistPriority.Low);

        // Assert
        Assert.That(result, Is.EqualTo(3));
    }

    [Test]
    public async Task GetNextPositionForPriorityAsync_InvalidEventId_ReturnsOne()
    {
        // Act
        var result = await _repository.GetNextPositionForPriorityAsync(999, WaitlistPriority.Normal);

        // Assert
        Assert.That(result, Is.EqualTo(1));
    }

    #endregion

    #region ReorderPositionsAsync Tests (5 tests)

    [Test]
    public async Task ReorderPositionsAsync_MiddleDeletion_ShiftsLaterPositionsDown()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[3].Id, position: 4);

        // Act - simulate deletion at position 2
        await _repository.ReorderPositionsAsync(_testEvent.Id, deletedPosition: 2);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        // Position 1 unchanged, positions 3 and 4 should become 2 and 3
        var position3Entry = entries.FirstOrDefault(e => e.MemberId == _testMembers[2].Id);
        var position4Entry = entries.FirstOrDefault(e => e.MemberId == _testMembers[3].Id);

        Assert.That(position3Entry!.Position, Is.EqualTo(2)); // Was 3
        Assert.That(position4Entry!.Position, Is.EqualTo(3)); // Was 4
    }

    [Test]
    public async Task ReorderPositionsAsync_FirstDeletion_ShiftsAllDown()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act
        await _repository.ReorderPositionsAsync(_testEvent.Id, deletedPosition: 1);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        var entry2 = entries.FirstOrDefault(e => e.MemberId == _testMembers[1].Id);
        var entry3 = entries.FirstOrDefault(e => e.MemberId == _testMembers[2].Id);

        Assert.That(entry2!.Position, Is.EqualTo(1)); // Was 2
        Assert.That(entry3!.Position, Is.EqualTo(2)); // Was 3
    }

    [Test]
    public async Task ReorderPositionsAsync_LastDeletion_NoChanges()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act
        await _repository.ReorderPositionsAsync(_testEvent.Id, deletedPosition: 3);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        Assert.That(entries[0].Position, Is.EqualTo(1));
        Assert.That(entries[1].Position, Is.EqualTo(2));
        Assert.That(entries[2].Position, Is.EqualTo(3));
    }

    [Test]
    public async Task ReorderPositionsAsync_UpdatesUpdatedAt()
    {
        // Arrange
        var beforeReorder = DateTime.UtcNow.AddSeconds(-1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act
        await _repository.ReorderPositionsAsync(_testEvent.Id, deletedPosition: 2);
        var afterReorder = DateTime.UtcNow.AddSeconds(1);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        var reorderedEntry = entries.FirstOrDefault(e => e.MemberId == _testMembers[2].Id);

        Assert.That(reorderedEntry!.UpdatedAt, Is.GreaterThan(beforeReorder));
        Assert.That(reorderedEntry.UpdatedAt, Is.LessThan(afterReorder));
    }

    [Test]
    public async Task ReorderPositionsAsync_NoAffectedEntries_DoesNotThrow()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
            await _repository.ReorderPositionsAsync(_testEvent.Id, deletedPosition: 1));
    }

    #endregion

    #region UpdatePositionAsync Tests (4 tests)

    [Test]
    public async Task UpdatePositionAsync_ValidEntry_UpdatesPosition()
    {
        // Arrange
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        await _repository.UpdatePositionAsync(entry.Id, newPosition: 2);

        // Assert
        var updated = await Context.EventWaitlists.FindAsync(entry.Id);
        Assert.That(updated!.Position, Is.EqualTo(2));
    }

    [Test]
    public async Task UpdatePositionAsync_UpdatesUpdatedAt()
    {
        // Arrange
        var beforeUpdate = DateTime.UtcNow.AddSeconds(-1);
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        await _repository.UpdatePositionAsync(entry.Id, newPosition: 2);
        var afterUpdate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        var updated = await Context.EventWaitlists.FindAsync(entry.Id);
        Assert.That(updated!.UpdatedAt, Is.GreaterThan(beforeUpdate));
        Assert.That(updated.UpdatedAt, Is.LessThan(afterUpdate));
    }

    [Test]
    public async Task UpdatePositionAsync_NonExistingEntry_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
            await _repository.UpdatePositionAsync(999, newPosition: 1));
    }

    [Test]
    public async Task UpdatePositionAsync_SamePosition_StillUpdatesUpdatedAt()
    {
        // Arrange
        var beforeUpdate = DateTime.UtcNow.AddSeconds(-1);
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);

        // Act
        await _repository.UpdatePositionAsync(entry.Id, newPosition: 1);
        var afterUpdate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        var updated = await Context.EventWaitlists.FindAsync(entry.Id);
        Assert.That(updated!.UpdatedAt, Is.GreaterThan(beforeUpdate));
        Assert.That(updated.UpdatedAt, Is.LessThan(afterUpdate));
    }

    #endregion

    #region ReorderAfterPositionChangeAsync Tests (8 tests)

    [Test]
    public async Task ReorderAfterPositionChangeAsync_MovingUp_ShiftsEntriesDown()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act - move from position 3 to position 1 (moving up)
        await _repository.ReorderAfterPositionChangeAsync(_testEvent.Id, oldPosition: 3, newPosition: 1);

        // Assert - entries at 1 and 2 should shift down to 2 and 3
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        var entry1 = entries.FirstOrDefault(e => e.MemberId == _testMembers[0].Id);
        var entry2 = entries.FirstOrDefault(e => e.MemberId == _testMembers[1].Id);

        Assert.That(entry1!.Position, Is.EqualTo(2)); // Was 1, shifted down
        Assert.That(entry2!.Position, Is.EqualTo(3)); // Was 2, shifted down
    }

    [Test]
    public async Task ReorderAfterPositionChangeAsync_MovingDown_ShiftsEntriesUp()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act - move from position 1 to position 3 (moving down)
        await _repository.ReorderAfterPositionChangeAsync(_testEvent.Id, oldPosition: 1, newPosition: 3);

        // Assert - entries at 2 and 3 should shift up to 1 and 2
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        var entry2 = entries.FirstOrDefault(e => e.MemberId == _testMembers[1].Id);
        var entry3 = entries.FirstOrDefault(e => e.MemberId == _testMembers[2].Id);

        Assert.That(entry2!.Position, Is.EqualTo(1)); // Was 2, shifted up
        Assert.That(entry3!.Position, Is.EqualTo(2)); // Was 3, shifted up
    }

    [Test]
    public async Task ReorderAfterPositionChangeAsync_SamePosition_NoChanges()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);

        // Act
        await _repository.ReorderAfterPositionChangeAsync(_testEvent.Id, oldPosition: 1, newPosition: 1);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        Assert.That(entries[0].Position, Is.EqualTo(1));
        Assert.That(entries[1].Position, Is.EqualTo(2));
    }

    [Test]
    public async Task ReorderAfterPositionChangeAsync_UpdatesUpdatedAt()
    {
        // Arrange
        var beforeReorder = DateTime.UtcNow.AddSeconds(-1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);

        // Act
        await _repository.ReorderAfterPositionChangeAsync(_testEvent.Id, oldPosition: 2, newPosition: 1);
        var afterReorder = DateTime.UtcNow.AddSeconds(1);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        var reorderedEntry = entries.FirstOrDefault(e => e.MemberId == _testMembers[0].Id);

        Assert.That(reorderedEntry!.UpdatedAt, Is.GreaterThan(beforeReorder));
        Assert.That(reorderedEntry.UpdatedAt, Is.LessThan(afterReorder));
    }

    [Test]
    public async Task ReorderAfterPositionChangeAsync_MovingUpByOne_ShiftsOneEntry()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);

        // Act - move from position 2 to position 1
        await _repository.ReorderAfterPositionChangeAsync(_testEvent.Id, oldPosition: 2, newPosition: 1);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        var entry1 = entries.FirstOrDefault(e => e.MemberId == _testMembers[0].Id);
        Assert.That(entry1!.Position, Is.EqualTo(2)); // Was 1, shifted down
    }

    [Test]
    public async Task ReorderAfterPositionChangeAsync_MovingDownByOne_ShiftsOneEntry()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);

        // Act - move from position 1 to position 2
        await _repository.ReorderAfterPositionChangeAsync(_testEvent.Id, oldPosition: 1, newPosition: 2);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        var entry2 = entries.FirstOrDefault(e => e.MemberId == _testMembers[1].Id);
        Assert.That(entry2!.Position, Is.EqualTo(1)); // Was 2, shifted up
    }

    [Test]
    public async Task ReorderAfterPositionChangeAsync_LargeGap_OnlyAffectsEntriesBetween()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[3].Id, position: 4);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[4].Id, position: 5);

        // Act - move from position 5 to position 2
        await _repository.ReorderAfterPositionChangeAsync(_testEvent.Id, oldPosition: 5, newPosition: 2);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        var entry1 = entries.FirstOrDefault(e => e.MemberId == _testMembers[0].Id);
        var entry2 = entries.FirstOrDefault(e => e.MemberId == _testMembers[1].Id);
        var entry3 = entries.FirstOrDefault(e => e.MemberId == _testMembers[2].Id);
        var entry4 = entries.FirstOrDefault(e => e.MemberId == _testMembers[3].Id);

        Assert.That(entry1!.Position, Is.EqualTo(1)); // Unchanged
        Assert.That(entry2!.Position, Is.EqualTo(3)); // Was 2, shifted down
        Assert.That(entry3!.Position, Is.EqualTo(4)); // Was 3, shifted down
        Assert.That(entry4!.Position, Is.EqualTo(5)); // Was 4, shifted down
    }

    [Test]
    public async Task ReorderAfterPositionChangeAsync_NoEntriesBetween_NoChanges()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 5);

        // Act
        await _repository.ReorderAfterPositionChangeAsync(_testEvent.Id, oldPosition: 5, newPosition: 10);

        // Assert
        var entries = await _repository.GetByEventIdAsync(_testEvent.Id);
        Assert.That(entries[0].Position, Is.EqualTo(1));
        Assert.That(entries[1].Position, Is.EqualTo(5));
    }

    #endregion

    #region GetTotalWaitlistCountAsync Tests (4 tests)

    [Test]
    public async Task GetTotalWaitlistCountAsync_EmptyWaitlist_ReturnsZero()
    {
        // Act
        var result = await _repository.GetTotalWaitlistCountAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    [Test]
    public async Task GetTotalWaitlistCountAsync_WithEntries_ReturnsCorrectCount()
    {
        // Arrange
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[2].Id, position: 3);

        // Act
        var result = await _repository.GetTotalWaitlistCountAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(3));
    }

    [Test]
    public async Task GetTotalWaitlistCountAsync_MultipleEvents_OnlyCountsSpecifiedEvent()
    {
        // Arrange
        var event2 = new Event { Id = _testEvent.Id + 100, ClubId = _testEvent.ClubId, Name = "Second Test Event", EventDateTime = DateTime.UtcNow.AddDays(14), CreatedAt = DateTime.UtcNow, Location = "Test Location" };
        Context.Events.Add(event2);
        await Context.SaveChangesAsync();
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        await CreateWaitlistEntry(_testEvent.Id, _testMembers[1].Id, position: 2);
        await CreateWaitlistEntry(event2.Id, _testMembers[2].Id, position: 1);

        // Act
        var result = await _repository.GetTotalWaitlistCountAsync(_testEvent.Id);

        // Assert
        Assert.That(result, Is.EqualTo(2));
    }

    [Test]
    public async Task GetTotalWaitlistCountAsync_InvalidEventId_ReturnsZero()
    {
        // Act
        var result = await _repository.GetTotalWaitlistCountAsync(999);

        // Assert
        Assert.That(result, Is.EqualTo(0));
    }

    #endregion

    #region UpdateAsync Tests (4 tests)

    [Test]
    public async Task UpdateAsync_ValidEntry_UpdatesSuccessfully()
    {
        // Arrange
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        entry.Notes = "Updated notes";
        entry.NotificationSent = true;

        // Act
        var result = await _repository.UpdateAsync(entry);

        // Assert
        Assert.That(result.Notes, Is.EqualTo("Updated notes"));
        Assert.That(result.NotificationSent, Is.True);
    }

    [Test]
    public async Task UpdateAsync_UpdatesUpdatedAt()
    {
        // Arrange
        var beforeUpdate = DateTime.UtcNow.AddSeconds(-1);
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        entry.Notes = "Test";

        // Act
        var result = await _repository.UpdateAsync(entry);
        var afterUpdate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        Assert.That(result.UpdatedAt, Is.GreaterThan(beforeUpdate));
        Assert.That(result.UpdatedAt, Is.LessThan(afterUpdate));
    }

    [Test]
    public async Task UpdateAsync_ChangePriority_UpdatesCorrectly()
    {
        // Arrange
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1, priority: WaitlistPriority.Normal);
        entry.Priority = WaitlistPriority.High;

        // Act
        var result = await _repository.UpdateAsync(entry);

        // Assert
        Assert.That(result.Priority, Is.EqualTo(WaitlistPriority.High));
    }

    [Test]
    public async Task UpdateAsync_ChangeNotificationSent_UpdatesCorrectly()
    {
        // Arrange
        var entry = await CreateWaitlistEntry(_testEvent.Id, _testMembers[0].Id, position: 1);
        Assert.That(entry.NotificationSent, Is.False); // Default

        entry.NotificationSent = true;

        // Act
        var result = await _repository.UpdateAsync(entry);

        // Assert
        Assert.That(result.NotificationSent, Is.True);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Helper method to create a waitlist entry
    /// </summary>
    private async Task<EventWaitlist> CreateWaitlistEntry(
        int eventId,
        int memberId,
        int position,
        WaitlistPriority priority = WaitlistPriority.Normal)
    {
        var entry = new EventWaitlist
        {
            EventId = eventId,
            MemberId = memberId,
            Position = position,
            Priority = priority,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        Context.EventWaitlists.Add(entry);
        await Context.SaveChangesAsync();
        return entry;
    }

    #endregion
}
