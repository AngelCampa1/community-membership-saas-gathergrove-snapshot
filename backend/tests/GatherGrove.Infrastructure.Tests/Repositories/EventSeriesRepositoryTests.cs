using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;

namespace GatherGrove.Infrastructure.Tests.Repositories;

/// <summary>
/// Tests for EventSeriesRepository
/// Covers all 7 methods with comprehensive soft delete filtering scenarios
/// </summary>
[TestFixture]
public class EventSeriesRepositoryTests : RepositoryTestBase
{
    private EventSeriesRepository _repository = null!;
    private Club _testClub = null!;

    [SetUp]
    public async Task SetUp()
    {
        CreateContext();
        _repository = new EventSeriesRepository(Context, NullLogger<EventSeriesRepository>.Instance);

        // Seed test data
        _testClub = await SeedClubAsync();
    }

    #region CreateAsync Tests

    [Test]
    public async Task CreateAsync_ValidSeries_CreatesAndReturnsSeries()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            ClubId = _testClub.Id,
            Name = "Weekly Meetup",
            Description = "Recurring weekly meetup",
            RecurrencePattern = "Weekly",
            RecurrenceInterval = 1,
            StartDate = DateTime.UtcNow.AddDays(7),
            EventTemplate = new EventTemplate
            {
                Name = "Weekly Meetup {SeriesNumber}",
                Location = "Conference Room",
                Duration = TimeSpan.FromHours(2)
            }
        };

        // Act
        var result = await _repository.CreateAsync(eventSeries);

        // Assert
        Assert.That(result.Id, Is.GreaterThan(0));
        Assert.That(result.Name, Is.EqualTo("Weekly Meetup"));
        Assert.That(result.ClubId, Is.EqualTo(_testClub.Id));
    }

    [Test]
    public async Task CreateAsync_SetsTimestamps()
    {
        // Arrange
        var beforeCreate = DateTime.UtcNow.AddSeconds(-1);
        var eventSeries = new EventSeries
        {
            ClubId = _testClub.Id,
            Name = "Monthly Event",
            Description = "Monthly event series",
            RecurrencePattern = "Monthly",
            StartDate = DateTime.UtcNow.AddDays(30)
        };

        // Act
        var result = await _repository.CreateAsync(eventSeries);
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
    public async Task GetByIdAsync_SeriesExists_ReturnsSeriesWithNavigationProperties()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Weekly Meetup",
            Description = "Recurring weekly meetup",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.Add(eventSeries);

        var generatedEvent = new Event
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Generated Event 1",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            Location = "Test Location",
            EventSeriesId = eventSeries.Id
        };
        Context.Events.Add(generatedEvent);
        await Context.SaveChangesAsync();
        Context.ChangeTracker.Clear();

        // Act
        var result = await _repository.GetByIdAsync(eventSeries.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(eventSeries.Id));
        Assert.That(result.Club, Is.Not.Null); // Include(es => es.Club)
        Assert.That(result.GeneratedEvents, Is.Not.Empty); // Include(es => es.GeneratedEvents)
    }

    [Test]
    public async Task GetByIdAsync_DeletedSeries_ReturnsNull()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Deleted Series",
            Description = "This series is deleted",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsDeleted = true, // Soft deleted
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.Add(eventSeries);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(eventSeries.Id);

        // Assert
        Assert.That(result, Is.Null); // Filters out IsDeleted=true
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

    #region GetByClubIdAsync Tests

    [Test]
    public async Task GetByClubIdAsync_WithSeries_ReturnsOrderedDescendingByCreatedAt()
    {
        // Arrange
        var series1 = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "First Series",
            Description = "Created earlier",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            UpdatedAt = DateTime.UtcNow.AddDays(-2)
        };
        var series2 = new EventSeries
        {
            Id = 2,
            ClubId = _testClub.Id,
            Name = "Second Series",
            Description = "Created later",
            RecurrencePattern = "Monthly",
            StartDate = DateTime.UtcNow,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.EventSeries.AddRange(series1, series2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].Id, Is.EqualTo(series2.Id)); // Most recent first (descending)
        Assert.That(result[1].Id, Is.EqualTo(series1.Id));
    }

    [Test]
    public async Task GetByClubIdAsync_FiltersDeletedSeries()
    {
        // Arrange
        var activeSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Active Series",
            Description = "Not deleted",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var deletedSeries = new EventSeries
        {
            Id = 2,
            ClubId = _testClub.Id,
            Name = "Deleted Series",
            Description = "Soft deleted",
            RecurrencePattern = "Monthly",
            StartDate = DateTime.UtcNow,
            IsDeleted = true, // Soft deleted
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.AddRange(activeSeries, deletedSeries);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Id, Is.EqualTo(activeSeries.Id)); // Only non-deleted
    }

    [Test]
    public async Task GetByClubIdAsync_NoSeries_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region UpdateAsync Tests

    [Test]
    public async Task UpdateAsync_ValidSeries_UpdatesAndReturnsSeries()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Original Name",
            Description = "Original description",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.EventSeries.Add(eventSeries);
        await Context.SaveChangesAsync();

        eventSeries.Name = "Updated Name";
        eventSeries.Description = "Updated description";

        // Act
        var result = await _repository.UpdateAsync(eventSeries);

        // Assert
        Assert.That(result.Name, Is.EqualTo("Updated Name"));
        Assert.That(result.Description, Is.EqualTo("Updated description"));
    }

    [Test]
    public async Task UpdateAsync_UpdatesTimestamp()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Event Series",
            Description = "Description",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        Context.EventSeries.Add(eventSeries);
        await Context.SaveChangesAsync();

        var originalUpdatedAt = eventSeries.UpdatedAt;
        await Task.Delay(10); // Ensure time difference

        eventSeries.Name = "Updated Name";

        // Act
        var beforeUpdate = DateTime.UtcNow.AddSeconds(-1);
        var result = await _repository.UpdateAsync(eventSeries);
        var afterUpdate = DateTime.UtcNow.AddSeconds(1);

        // Assert
        Assert.That(result.UpdatedAt, Is.GreaterThan(originalUpdatedAt));
        Assert.That(result.UpdatedAt, Is.GreaterThan(beforeUpdate));
        Assert.That(result.UpdatedAt, Is.LessThan(afterUpdate));
    }

    #endregion

    #region DeleteAsync Tests

    [Test]
    public async Task DeleteAsync_SeriesExists_SoftDeletesSeries()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Series to Delete",
            Description = "Description",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.Add(eventSeries);
        await Context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(eventSeries.Id);

        // Assert
        var deleted = await Context.EventSeries.FindAsync(eventSeries.Id);
        Assert.That(deleted, Is.Not.Null); // Still exists in database
        Assert.That(deleted!.IsDeleted, Is.True); // But marked as deleted (soft delete)
        Assert.That(deleted.IsActive, Is.False); // And marked as inactive
    }

    [Test]
    public async Task DeleteAsync_SetsBothIsDeletedAndIsActive()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Series to Delete",
            Description = "Description",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.Add(eventSeries);
        await Context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(eventSeries.Id);

        // Assert
        var result = await Context.EventSeries.FindAsync(eventSeries.Id);
        Assert.That(result!.IsDeleted, Is.True);
        Assert.That(result.IsActive, Is.False);
    }

    [Test]
    public async Task DeleteAsync_SeriesNotFound_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () => await _repository.DeleteAsync(999));
    }

    #endregion

    #region GetActiveByClubIdAsync Tests

    [Test]
    public async Task GetActiveByClubIdAsync_FiltersActiveAndNotDeleted()
    {
        // Arrange
        var activeSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Active Series",
            Description = "Active and not deleted",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var inactiveSeries = new EventSeries
        {
            Id = 2,
            ClubId = _testClub.Id,
            Name = "Inactive Series",
            Description = "Not active",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsActive = false, // Inactive
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var deletedSeries = new EventSeries
        {
            Id = 3,
            ClubId = _testClub.Id,
            Name = "Deleted Series",
            Description = "Deleted",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsActive = true,
            IsDeleted = true, // Deleted
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.AddRange(activeSeries, inactiveSeries, deletedSeries);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetActiveByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Id, Is.EqualTo(activeSeries.Id)); // Only active and not deleted
    }

    [Test]
    public async Task GetActiveByClubIdAsync_FiltersDeleted()
    {
        // Arrange
        var deletedButActive = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Deleted but Active",
            Description = "IsActive=true but IsDeleted=true",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsActive = true,
            IsDeleted = true, // Should be filtered out
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.Add(deletedButActive);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetActiveByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Empty); // IsDeleted=true series are filtered out
    }

    [Test]
    public async Task GetActiveByClubIdAsync_OrdersByStartDateDescending()
    {
        // Arrange
        var series1 = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Earlier Series",
            Description = "Starts earlier",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow.AddDays(7),
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var series2 = new EventSeries
        {
            Id = 2,
            ClubId = _testClub.Id,
            Name = "Later Series",
            Description = "Starts later",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow.AddDays(14),
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.AddRange(series1, series2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetActiveByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));
        Assert.That(result[0].Id, Is.EqualTo(series2.Id)); // Later start date first (descending)
        Assert.That(result[1].Id, Is.EqualTo(series1.Id));
    }

    [Test]
    public async Task GetActiveByClubIdAsync_NoActiveSeries_ReturnsEmptyList()
    {
        // Arrange - only inactive or deleted series
        var inactiveSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Inactive Series",
            Description = "Not active",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsActive = false,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.Add(inactiveSeries);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetActiveByClubIdAsync(_testClub.Id);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region ExistsAsync Tests

    [Test]
    public async Task ExistsAsync_SeriesExists_ReturnsTrue()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Existing Series",
            Description = "This series exists",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.Add(eventSeries);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.ExistsAsync(eventSeries.Id);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public async Task ExistsAsync_DeletedSeries_ReturnsFalse()
    {
        // Arrange
        var eventSeries = new EventSeries
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Deleted Series",
            Description = "This series is deleted",
            RecurrencePattern = "Weekly",
            StartDate = DateTime.UtcNow,
            IsDeleted = true, // Soft deleted
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.EventSeries.Add(eventSeries);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.ExistsAsync(eventSeries.Id);

        // Assert
        Assert.That(result, Is.False); // Deleted series do not "exist"
    }

    [Test]
    public async Task ExistsAsync_SeriesNotFound_ReturnsFalse()
    {
        // Act
        var result = await _repository.ExistsAsync(999);

        // Assert
        Assert.That(result, Is.False);
    }

    #endregion
}
