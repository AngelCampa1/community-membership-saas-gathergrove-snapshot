using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class LocationMigrationServiceTests
{
    private GatherGroveDbContext _context = null!;
    private ILogger<LocationMigrationService> _logger = null!;
    private LocationMigrationService _service = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _logger = NullLogger<LocationMigrationService>.Instance;
        _service = new LocationMigrationService(_context, _logger);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region MigrateExistingClubsToLocationsAsync Tests

    [Test]
    public async Task MigrateExistingClubsToLocationsAsync_ClubWithoutLocation_CreatesMainLocation()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        // Act
        await _service.MigrateExistingClubsToLocationsAsync();

        // Assert
        var locations = await _context.ClubLocations.ToListAsync();
        Assert.That(locations, Has.Count.EqualTo(1));
        Assert.That(locations[0].ParentClubId, Is.EqualTo(1));
        Assert.That(locations[0].LocationName, Is.EqualTo("Main Location"));
        Assert.That(locations[0].LocationCode, Is.EqualTo("MAIN"));
        Assert.That(locations[0].IsActive, Is.True);
    }

    [Test]
    public async Task MigrateExistingClubsToLocationsAsync_ClubWithExistingMainLocation_SkipsClub()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        await _context.Clubs.AddAsync(club);

        var existingLocation = new ClubLocation
        {
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };
        await _context.ClubLocations.AddAsync(existingLocation);
        await _context.SaveChangesAsync();

        // Act
        await _service.MigrateExistingClubsToLocationsAsync();

        // Assert
        var locations = await _context.ClubLocations.ToListAsync();
        Assert.That(locations, Has.Count.EqualTo(1)); // No new location created
    }

    [Test]
    public async Task MigrateExistingClubsToLocationsAsync_MultipleClubs_CreatesMainLocationForEach()
    {
        // Arrange
        var clubs = new List<Club>
        {
            new Club { Id = 1, Name = "Club 1" },
            new Club { Id = 2, Name = "Club 2" },
            new Club { Id = 3, Name = "Club 3" }
        };
        await _context.Clubs.AddRangeAsync(clubs);
        await _context.SaveChangesAsync();

        // Act
        await _service.MigrateExistingClubsToLocationsAsync();

        // Assert
        var locations = await _context.ClubLocations.ToListAsync();
        Assert.That(locations, Has.Count.EqualTo(3));
        Assert.That(locations.All(l => l.LocationCode == "MAIN"), Is.True);
        Assert.That(locations.Select(l => l.ParentClubId), Is.EquivalentTo(new[] { 1, 2, 3 }));
    }

    [Test]
    public async Task MigrateExistingClubsToLocationsAsync_NoClubs_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
            await _service.MigrateExistingClubsToLocationsAsync());

        var locations = await _context.ClubLocations.ToListAsync();
        Assert.That(locations, Is.Empty);
    }

    [Test]
    public async Task MigrateExistingClubsToLocationsAsync_CreatesLocationBranding()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        // Act
        await _service.MigrateExistingClubsToLocationsAsync();

        // Assert
        var brandings = await _context.LocationBrandings.ToListAsync();
        Assert.That(brandings, Has.Count.EqualTo(1));
    }

    #endregion

    #region PromoteClubAdminsToSuperAdminsAsync Tests

    [Test]
    public async Task PromoteClubAdminsToSuperAdminsAsync_ClubAdminWithMainLocation_CreatesLocationAdmin()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var user = new User { Id = 1, Email = "admin@test.com" };
        var clubAdmin = new ClubAdmin { ClubId = 1, UserId = 1, Club = club };
        var mainLocation = new ClubLocation
        {
            Id = 100,
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };

        await _context.Clubs.AddAsync(club);
        await _context.Users.AddAsync(user);
        await _context.ClubAdmins.AddAsync(clubAdmin);
        await _context.ClubLocations.AddAsync(mainLocation);
        await _context.SaveChangesAsync();

        // Act
        await _service.PromoteClubAdminsToSuperAdminsAsync();

        // Assert
        var locationAdmins = await _context.LocationAdmins.ToListAsync();
        Assert.That(locationAdmins, Has.Count.EqualTo(1));
        Assert.That(locationAdmins[0].LocationId, Is.EqualTo(100));
        Assert.That(locationAdmins[0].UserId, Is.EqualTo(1));
        Assert.That(locationAdmins[0].PermissionLevel, Is.EqualTo(LocationPermissionLevel.SuperAdmin));
    }

    [Test]
    public async Task PromoteClubAdminsToSuperAdminsAsync_ClubAdminWithNoMainLocation_SkipsAdmin()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var user = new User { Id = 1, Email = "admin@test.com" };
        var clubAdmin = new ClubAdmin { ClubId = 1, UserId = 1, Club = club };

        await _context.Clubs.AddAsync(club);
        await _context.Users.AddAsync(user);
        await _context.ClubAdmins.AddAsync(clubAdmin);
        await _context.SaveChangesAsync();
        // No main location exists

        // Act
        await _service.PromoteClubAdminsToSuperAdminsAsync();

        // Assert
        var locationAdmins = await _context.LocationAdmins.ToListAsync();
        Assert.That(locationAdmins, Is.Empty);
    }

    [Test]
    public async Task PromoteClubAdminsToSuperAdminsAsync_ExistingLocationAdmin_SkipsPromotion()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var user = new User { Id = 1, Email = "admin@test.com" };
        var clubAdmin = new ClubAdmin { ClubId = 1, UserId = 1, Club = club };
        var mainLocation = new ClubLocation
        {
            Id = 100,
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };
        var existingLocationAdmin = new LocationAdmin
        {
            LocationId = 100,
            UserId = 1,
            PermissionLevel = LocationPermissionLevel.SuperAdmin,
            AssignedAt = DateTime.UtcNow
        };

        await _context.Clubs.AddAsync(club);
        await _context.Users.AddAsync(user);
        await _context.ClubAdmins.AddAsync(clubAdmin);
        await _context.ClubLocations.AddAsync(mainLocation);
        await _context.LocationAdmins.AddAsync(existingLocationAdmin);
        await _context.SaveChangesAsync();

        // Act
        await _service.PromoteClubAdminsToSuperAdminsAsync();

        // Assert
        var locationAdmins = await _context.LocationAdmins.ToListAsync();
        Assert.That(locationAdmins, Has.Count.EqualTo(1)); // No new admin created
    }

    [Test]
    public async Task PromoteClubAdminsToSuperAdminsAsync_NoClubAdmins_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
            await _service.PromoteClubAdminsToSuperAdminsAsync());

        var locationAdmins = await _context.LocationAdmins.ToListAsync();
        Assert.That(locationAdmins, Is.Empty);
    }

    #endregion

    #region AssignExistingMembersToMainLocationAsync Tests

    [Test]
    public async Task AssignExistingMembersToMainLocationAsync_MemberWithoutLocation_AssignsMainLocation()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var member = new Member
        {
            Id = 10,
            ClubId = 1,
            FullName = "Test Member",
            Email = "member@test.com",
            LocationId = null // No location assigned
        };
        var mainLocation = new ClubLocation
        {
            Id = 100,
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };

        await _context.Clubs.AddAsync(club);
        await _context.Members.AddAsync(member);
        await _context.ClubLocations.AddAsync(mainLocation);
        await _context.SaveChangesAsync();

        // Act
        await _service.AssignExistingMembersToMainLocationAsync();

        // Assert
        var updatedMember = await _context.Members.FindAsync(10);
        Assert.That(updatedMember!.LocationId, Is.EqualTo(100));
    }

    [Test]
    public async Task AssignExistingMembersToMainLocationAsync_MemberWithLocation_SkipsMember()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var existingLocation = new ClubLocation
        {
            Id = 50,
            ParentClubId = 1,
            LocationName = "Existing Location",
            LocationCode = "EXIST",
            IsActive = true
        };
        var mainLocation = new ClubLocation
        {
            Id = 100,
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };
        var member = new Member
        {
            Id = 10,
            ClubId = 1,
            FullName = "Test Member",
            Email = "member@test.com",
            LocationId = 50 // Already has a location
        };

        await _context.Clubs.AddAsync(club);
        await _context.ClubLocations.AddRangeAsync(existingLocation, mainLocation);
        await _context.Members.AddAsync(member);
        await _context.SaveChangesAsync();

        // Act
        await _service.AssignExistingMembersToMainLocationAsync();

        // Assert
        var updatedMember = await _context.Members.FindAsync(10);
        Assert.That(updatedMember!.LocationId, Is.EqualTo(50)); // Unchanged
    }

    [Test]
    public async Task AssignExistingMembersToMainLocationAsync_MemberWithNoMainLocation_SkipsMember()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var member = new Member
        {
            Id = 10,
            ClubId = 1,
            FullName = "Test Member",
            Email = "member@test.com",
            LocationId = null
        };
        // No main location exists for this club

        await _context.Clubs.AddAsync(club);
        await _context.Members.AddAsync(member);
        await _context.SaveChangesAsync();

        // Act
        await _service.AssignExistingMembersToMainLocationAsync();

        // Assert
        var updatedMember = await _context.Members.FindAsync(10);
        Assert.That(updatedMember!.LocationId, Is.Null); // Still null
    }

    [Test]
    public async Task AssignExistingMembersToMainLocationAsync_MultipleMembers_AssignsAll()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var members = new List<Member>
        {
            new Member { Id = 10, ClubId = 1, FullName = "Member 1", Email = "m1@test.com", LocationId = null },
            new Member { Id = 11, ClubId = 1, FullName = "Member 2", Email = "m2@test.com", LocationId = null },
            new Member { Id = 12, ClubId = 1, FullName = "Member 3", Email = "m3@test.com", LocationId = null }
        };
        var mainLocation = new ClubLocation
        {
            Id = 100,
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };

        await _context.Clubs.AddAsync(club);
        await _context.Members.AddRangeAsync(members);
        await _context.ClubLocations.AddAsync(mainLocation);
        await _context.SaveChangesAsync();

        // Act
        await _service.AssignExistingMembersToMainLocationAsync();

        // Assert
        var updatedMembers = await _context.Members.ToListAsync();
        Assert.That(updatedMembers.All(m => m.LocationId == 100), Is.True);
    }

    [Test]
    public async Task AssignExistingMembersToMainLocationAsync_NoMembers_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
            await _service.AssignExistingMembersToMainLocationAsync());
    }

    #endregion

    #region AssignExistingEventsToMainLocationAsync Tests

    [Test]
    public async Task AssignExistingEventsToMainLocationAsync_EventWithoutLocation_AssignsMainLocation()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var eventEntity = new Event
        {
            Id = 10,
            ClubId = 1,
            Name = "Test Event",
            LocationId = null
        };
        var mainLocation = new ClubLocation
        {
            Id = 100,
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };

        await _context.Clubs.AddAsync(club);
        await _context.Events.AddAsync(eventEntity);
        await _context.ClubLocations.AddAsync(mainLocation);
        await _context.SaveChangesAsync();

        // Act
        await _service.AssignExistingEventsToMainLocationAsync();

        // Assert
        var updatedEvent = await _context.Events.FindAsync(10);
        Assert.That(updatedEvent!.LocationId, Is.EqualTo(100));
    }

    [Test]
    public async Task AssignExistingEventsToMainLocationAsync_EventWithLocation_SkipsEvent()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var existingLocation = new ClubLocation
        {
            Id = 50,
            ParentClubId = 1,
            LocationName = "Existing Location",
            LocationCode = "EXIST",
            IsActive = true
        };
        var mainLocation = new ClubLocation
        {
            Id = 100,
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };
        var eventEntity = new Event
        {
            Id = 10,
            ClubId = 1,
            Name = "Test Event",
            LocationId = 50 // Already has a location
        };

        await _context.Clubs.AddAsync(club);
        await _context.ClubLocations.AddRangeAsync(existingLocation, mainLocation);
        await _context.Events.AddAsync(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        await _service.AssignExistingEventsToMainLocationAsync();

        // Assert
        var updatedEvent = await _context.Events.FindAsync(10);
        Assert.That(updatedEvent!.LocationId, Is.EqualTo(50)); // Unchanged
    }

    [Test]
    public async Task AssignExistingEventsToMainLocationAsync_EventWithNoMainLocation_SkipsEvent()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var eventEntity = new Event
        {
            Id = 10,
            ClubId = 1,
            Name = "Test Event",
            LocationId = null
        };
        // No main location exists

        await _context.Clubs.AddAsync(club);
        await _context.Events.AddAsync(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        await _service.AssignExistingEventsToMainLocationAsync();

        // Assert
        var updatedEvent = await _context.Events.FindAsync(10);
        Assert.That(updatedEvent!.LocationId, Is.Null);
    }

    [Test]
    public async Task AssignExistingEventsToMainLocationAsync_MultipleEvents_AssignsAll()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var events = new List<Event>
        {
            new Event { Id = 10, ClubId = 1, Name = "Event 1", LocationId = null },
            new Event { Id = 11, ClubId = 1, Name = "Event 2", LocationId = null },
            new Event { Id = 12, ClubId = 1, Name = "Event 3", LocationId = null }
        };
        var mainLocation = new ClubLocation
        {
            Id = 100,
            ParentClubId = 1,
            LocationName = "Main Location",
            LocationCode = "MAIN",
            IsActive = true
        };

        await _context.Clubs.AddAsync(club);
        await _context.Events.AddRangeAsync(events);
        await _context.ClubLocations.AddAsync(mainLocation);
        await _context.SaveChangesAsync();

        // Act
        await _service.AssignExistingEventsToMainLocationAsync();

        // Assert
        var updatedEvents = await _context.Events.ToListAsync();
        Assert.That(updatedEvents.All(e => e.LocationId == 100), Is.True);
    }

    [Test]
    public async Task AssignExistingEventsToMainLocationAsync_NoEvents_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
            await _service.AssignExistingEventsToMainLocationAsync());
    }

    #endregion

    #region RunCompleteMigrationAsync Tests

    [Test]
    public async Task RunCompleteMigrationAsync_ExecutesAllMigrationSteps()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        var user = new User { Id = 1, Email = "admin@test.com" };
        var clubAdmin = new ClubAdmin { ClubId = 1, UserId = 1, Club = club };

        await _context.Clubs.AddAsync(club);
        await _context.Users.AddAsync(user);
        await _context.ClubAdmins.AddAsync(clubAdmin);
        await _context.SaveChangesAsync();

        // Also add a member and event without locations
        var member = new Member { Id = 10, ClubId = 1, FullName = "Test Member", Email = "m@test.com", LocationId = null };
        var eventEntity = new Event { Id = 20, ClubId = 1, Name = "Test Event", LocationId = null };
        await _context.Members.AddAsync(member);
        await _context.Events.AddAsync(eventEntity);
        await _context.SaveChangesAsync();

        // Act
        await _service.RunCompleteMigrationAsync();

        // Assert - verify all steps were executed
        var locations = await _context.ClubLocations.ToListAsync();
        Assert.That(locations, Has.Count.EqualTo(1));
        Assert.That(locations[0].LocationCode, Is.EqualTo("MAIN"));

        var locationAdmins = await _context.LocationAdmins.ToListAsync();
        Assert.That(locationAdmins, Has.Count.EqualTo(1));

        var updatedMember = await _context.Members.FindAsync(10);
        Assert.That(updatedMember!.LocationId, Is.Not.Null);

        var updatedEvent = await _context.Events.FindAsync(20);
        Assert.That(updatedEvent!.LocationId, Is.Not.Null);
    }

    [Test]
    public async Task RunCompleteMigrationAsync_EmptyDatabase_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
            await _service.RunCompleteMigrationAsync());
    }

    [Test]
    public async Task RunCompleteMigrationAsync_AlreadyMigrated_IsIdempotent()
    {
        // Arrange
        var club = new Club { Id = 1, Name = "Test Club" };
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        // Act - run migration twice
        await _service.RunCompleteMigrationAsync();
        await _service.RunCompleteMigrationAsync();

        // Assert - should still have only one main location
        var locations = await _context.ClubLocations.ToListAsync();
        Assert.That(locations, Has.Count.EqualTo(1));
    }

    #endregion

    #region Multi-Club Migration Tests

    [Test]
    public async Task Migration_MultipleClubsWithSeparateData_MigrateSeparately()
    {
        // Arrange
        var club1 = new Club { Id = 1, Name = "Club 1" };
        var club2 = new Club { Id = 2, Name = "Club 2" };
        var user1 = new User { Id = 1, Email = "user1@test.com" };
        var user2 = new User { Id = 2, Email = "user2@test.com" };

        await _context.Clubs.AddRangeAsync(club1, club2);
        await _context.Users.AddRangeAsync(user1, user2);

        var clubAdmin1 = new ClubAdmin { ClubId = 1, UserId = 1, Club = club1 };
        var clubAdmin2 = new ClubAdmin { ClubId = 2, UserId = 2, Club = club2 };
        await _context.ClubAdmins.AddRangeAsync(clubAdmin1, clubAdmin2);

        var member1 = new Member { Id = 10, ClubId = 1, FullName = "Member 1", Email = "m1@test.com", LocationId = null };
        var member2 = new Member { Id = 11, ClubId = 2, FullName = "Member 2", Email = "m2@test.com", LocationId = null };
        await _context.Members.AddRangeAsync(member1, member2);

        var event1 = new Event { Id = 20, ClubId = 1, Name = "Event 1", LocationId = null };
        var event2 = new Event { Id = 21, ClubId = 2, Name = "Event 2", LocationId = null };
        await _context.Events.AddRangeAsync(event1, event2);

        await _context.SaveChangesAsync();

        // Act
        await _service.RunCompleteMigrationAsync();

        // Assert
        var locations = await _context.ClubLocations.ToListAsync();
        Assert.That(locations, Has.Count.EqualTo(2));

        var location1 = locations.First(l => l.ParentClubId == 1);
        var location2 = locations.First(l => l.ParentClubId == 2);

        var updatedMember1 = await _context.Members.FindAsync(10);
        var updatedMember2 = await _context.Members.FindAsync(11);
        Assert.That(updatedMember1!.LocationId, Is.EqualTo(location1.Id));
        Assert.That(updatedMember2!.LocationId, Is.EqualTo(location2.Id));

        var updatedEvent1 = await _context.Events.FindAsync(20);
        var updatedEvent2 = await _context.Events.FindAsync(21);
        Assert.That(updatedEvent1!.LocationId, Is.EqualTo(location1.Id));
        Assert.That(updatedEvent2!.LocationId, Is.EqualTo(location2.Id));
    }

    #endregion
}
