using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class CrossLocationReportingServiceTests
{
    private GatherGroveDbContext _context = null!;
    private ILogger<CrossLocationReportingService> _logger = null!;
    private CrossLocationReportingService _service = null!;
    private int _testClubId;
    private int _testUserId;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _logger = NullLogger<CrossLocationReportingService>.Instance;

        SetupTestData();

        _service = new CrossLocationReportingService(_context, _logger);
    }

    private void SetupTestData()
    {
        var club = new Club
        {
            Name = "Test Club",
            CreatedAt = DateTime.UtcNow,
            Tier = "Unlimited" // Required for cross-location reporting
        };
        _context.Clubs.Add(club);
        _context.SaveChanges();
        _testClubId = club.Id;

        var user = new User
        {
            Email = "admin@testclub.com",
            PasswordHash = "hash",
            FullName = "Admin User",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.SaveChanges();
        _testUserId = user.Id;

        // Make user a club admin
        var clubAdmin = new ClubAdmin
        {
            ClubId = _testClubId,
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(clubAdmin);
        _context.SaveChanges();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region GetConsolidatedDashboardAsync Tests

    [Test]
    public async Task GetConsolidatedDashboardAsync_ValidAccess_ReturnsDashboard()
    {
        // Arrange - Add locations
        var location1 = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Main Office",
            LocationCode = "MO001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        var location2 = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Branch Office",
            LocationCode = "BO001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.AddRange(location1, location2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubId, Is.EqualTo(_testClubId));
        Assert.That(result.ClubName, Is.EqualTo("Test Club"));
        Assert.That(result.Locations, Has.Count.EqualTo(2));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_UnauthorizedUser_ThrowsException()
    {
        // Arrange - Create user without admin access
        var otherUser = new User
        {
            Email = "other@test.com",
            PasswordHash = "hash",
            FullName = "Other User",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(otherUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetConsolidatedDashboardAsync(_testClubId, otherUser.Id));

        Assert.That(ex.Message, Does.Contain("permission"));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_ClubNotFound_ThrowsUnauthorized()
    {
        // Note: The service checks authorization before checking if club exists
        // so a non-existent club ID will return unauthorized (no admin record)
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            await _service.GetConsolidatedDashboardAsync(99999, _testUserId));

        Assert.That(ex.Message, Does.Contain("permission"));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_NonUnlimitedTier_ThrowsInvalidOperationException()
    {
        // Arrange - Create a non-Unlimited tier club
        var basicClub = new Club
        {
            Name = "Basic Club",
            CreatedAt = DateTime.UtcNow,
            Tier = "Sprout"
        };
        _context.Clubs.Add(basicClub);
        await _context.SaveChangesAsync();

        // Make user admin of basic club
        var clubAdmin = new ClubAdmin
        {
            ClubId = basicClub.Id,
            UserId = _testUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await _service.GetConsolidatedDashboardAsync(basicClub.Id, _testUserId));

        Assert.That(ex.Message, Does.Contain("Expand tier"));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_CountsActiveMembers()
    {
        // Arrange
        var location = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Test Location",
            LocationCode = "TL001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.Add(location);
        await _context.SaveChangesAsync();

        // Add active and inactive members
        for (int i = 0; i < 5; i++)
        {
            _context.Members.Add(new Member
            {
                ClubId = _testClubId,
                LocationId = location.Id,
                Email = $"active{i}@test.com",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            });
        }
        for (int i = 0; i < 3; i++)
        {
            _context.Members.Add(new Member
            {
                ClubId = _testClubId,
                LocationId = location.Id,
                Email = $"inactive{i}@test.com",
                Status = "Inactive",
                CreatedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.TotalMembers, Is.EqualTo(5));
        Assert.That(result.Locations[0].ActiveMembers, Is.EqualTo(5));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_CountsUpcomingEvents()
    {
        // Arrange
        var location = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Test Location",
            LocationCode = "TL001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.Add(location);
        await _context.SaveChangesAsync();

        // Add upcoming and past events
        for (int i = 0; i < 4; i++)
        {
            _context.Events.Add(new Event
            {
                ClubId = _testClubId,
                LocationId = location.Id,
                Title = $"Future Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(i + 1),
                CreatedAt = DateTime.UtcNow
            });
        }
        for (int i = 0; i < 2; i++)
        {
            _context.Events.Add(new Event
            {
                ClubId = _testClubId,
                LocationId = location.Id,
                Title = $"Past Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(-i - 1),
                CreatedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.TotalEvents, Is.EqualTo(4));
        Assert.That(result.Locations[0].UpcomingEvents, Is.EqualTo(4));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_CountsActiveLocations()
    {
        // Arrange
        _context.ClubLocations.AddRange(
            new ClubLocation
            {
                ParentClubId = _testClubId,
                LocationName = "Active Location 1",
                LocationCode = "AL001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new ClubLocation
            {
                ParentClubId = _testClubId,
                LocationName = "Active Location 2",
                LocationCode = "AL002",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new ClubLocation
            {
                ParentClubId = _testClubId,
                LocationName = "Inactive Location",
                LocationCode = "IL001",
                IsActive = false,
                CreatedAt = DateTime.UtcNow
            }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.Locations, Has.Count.EqualTo(3));
        Assert.That(result.TotalActiveLocations, Is.EqualTo(2));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_NoLocations_ReturnsEmptyList()
    {
        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.Locations, Is.Empty);
        Assert.That(result.TotalMembers, Is.EqualTo(0));
        Assert.That(result.TotalEvents, Is.EqualTo(0));
        Assert.That(result.TotalActiveLocations, Is.EqualTo(0));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_MultipleLocations_AggregatesCorrectly()
    {
        // Arrange
        var location1 = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Location 1",
            LocationCode = "L001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        var location2 = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Location 2",
            LocationCode = "L002",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.AddRange(location1, location2);
        await _context.SaveChangesAsync();

        // Add members to both locations
        for (int i = 0; i < 10; i++)
        {
            _context.Members.Add(new Member
            {
                ClubId = _testClubId,
                LocationId = location1.Id,
                Email = $"loc1member{i}@test.com",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            });
        }
        for (int i = 0; i < 15; i++)
        {
            _context.Members.Add(new Member
            {
                ClubId = _testClubId,
                LocationId = location2.Id,
                Email = $"loc2member{i}@test.com",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Add events to both locations
        for (int i = 0; i < 3; i++)
        {
            _context.Events.Add(new Event
            {
                ClubId = _testClubId,
                LocationId = location1.Id,
                Title = $"Loc1 Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow
            });
        }
        for (int i = 0; i < 5; i++)
        {
            _context.Events.Add(new Event
            {
                ClubId = _testClubId,
                LocationId = location2.Id,
                Title = $"Loc2 Event {i}",
                EventDateTime = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.TotalMembers, Is.EqualTo(25));
        Assert.That(result.TotalEvents, Is.EqualTo(8));
        Assert.That(result.TotalActiveLocations, Is.EqualTo(2));

        var loc1Summary = result.Locations.First(l => l.LocationName == "Location 1");
        Assert.That(loc1Summary.ActiveMembers, Is.EqualTo(10));
        Assert.That(loc1Summary.UpcomingEvents, Is.EqualTo(3));

        var loc2Summary = result.Locations.First(l => l.LocationName == "Location 2");
        Assert.That(loc2Summary.ActiveMembers, Is.EqualTo(15));
        Assert.That(loc2Summary.UpcomingEvents, Is.EqualTo(5));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_MapsLocationDetails()
    {
        // Arrange
        var location = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Detailed Location",
            LocationCode = "DL001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.Add(location);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.Locations, Has.Count.EqualTo(1));
        var summary = result.Locations[0];
        Assert.That(summary.Id, Is.EqualTo(location.Id));
        Assert.That(summary.LocationName, Is.EqualTo("Detailed Location"));
        Assert.That(summary.LocationCode, Is.EqualTo("DL001"));
        Assert.That(summary.IsActive, Is.True);
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_OnlyCountsLocationMembers()
    {
        // Arrange
        var location = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Test Location",
            LocationCode = "TL001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.Add(location);
        await _context.SaveChangesAsync();

        // Add members with and without location
        _context.Members.Add(new Member
        {
            ClubId = _testClubId,
            LocationId = location.Id,
            Email = "locmember@test.com",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        });
        _context.Members.Add(new Member
        {
            ClubId = _testClubId,
            LocationId = null, // No location assigned
            Email = "nolocmember@test.com",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.TotalMembers, Is.EqualTo(1)); // Only the location member
        Assert.That(result.Locations[0].ActiveMembers, Is.EqualTo(1));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_OnlyCountsLocationEvents()
    {
        // Arrange
        var location = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Test Location",
            LocationCode = "TL001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.Add(location);
        await _context.SaveChangesAsync();

        // Add events with and without location
        _context.Events.Add(new Event
        {
            ClubId = _testClubId,
            LocationId = location.Id,
            Title = "Location Event",
            EventDateTime = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        });
        _context.Events.Add(new Event
        {
            ClubId = _testClubId,
            LocationId = null, // No location assigned
            Title = "Club Event",
            EventDateTime = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.TotalEvents, Is.EqualTo(1)); // Only the location event
        Assert.That(result.Locations[0].UpcomingEvents, Is.EqualTo(1));
    }

    [Test]
    public async Task GetConsolidatedDashboardAsync_DoesNotCountOtherClubLocations()
    {
        // Arrange
        var otherClub = new Club
        {
            Name = "Other Club",
            CreatedAt = DateTime.UtcNow,
            Tier = "Unlimited"
        };
        _context.Clubs.Add(otherClub);
        await _context.SaveChangesAsync();

        // Add location to our club
        _context.ClubLocations.Add(new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Our Location",
            LocationCode = "OL001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        // Add location to other club
        _context.ClubLocations.Add(new ClubLocation
        {
            ParentClubId = otherClub.Id,
            LocationName = "Other Location",
            LocationCode = "OT001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetConsolidatedDashboardAsync(_testClubId, _testUserId);

        // Assert
        Assert.That(result.Locations, Has.Count.EqualTo(1));
        Assert.That(result.Locations[0].LocationName, Is.EqualTo("Our Location"));
    }

    #endregion
}
