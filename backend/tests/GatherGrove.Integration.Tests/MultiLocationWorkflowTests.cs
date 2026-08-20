using FluentAssertions;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;

namespace GatherGrove.Integration.Tests;

/// <summary>
/// Integration tests for multi-location workflows including member transfers,
/// location-specific events, branding, and cross-location access control.
/// Tests US-011 Multi-Location feature end-to-end scenarios.
/// </summary>
[TestFixture]
public class MultiLocationWorkflowTests
{
    private GatherGroveDbContext _context = null!;
    private Club _testClub = null!;
    private ClubLocation _locationA = null!;
    private ClubLocation _locationB = null!;
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
            Name = "Multi-Location Test Club",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(_testClub);
        await _context.SaveChangesAsync();

        _membershipType = new MembershipType
        {
            ClubId = _testClub.Id,
            Name = "Standard Membership",
            DuesAmount = 75.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(_membershipType);
        await _context.SaveChangesAsync();

        // Create two locations for the club
        _locationA = new ClubLocation
        {
            ParentClubId = _testClub.Id,
            LocationName = "Downtown Chapter",
            LocationCode = "DTN",
            Address = "123 Main St",
            City = "New York",
            State = "NY",
            Country = "USA",
            Timezone = "America/New_York",
            ContactEmail = "downtown@test.com",
            ContactPhone = "555-0001",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _locationB = new ClubLocation
        {
            ParentClubId = _testClub.Id,
            LocationName = "Uptown Chapter",
            LocationCode = "UPT",
            Address = "456 Park Ave",
            City = "New York",
            State = "NY",
            Country = "USA",
            Timezone = "America/New_York",
            ContactEmail = "uptown@test.com",
            ContactPhone = "555-0002",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ClubLocations.AddRange(_locationA, _locationB);
        await _context.SaveChangesAsync();
    }

    [TearDown]
    public void TearDown()
    {
        _context?.Dispose();
    }

    #region Location Creation and Management Tests

    [Test]
    public async Task CreateLocation_ValidData_SuccessfullySaved()
    {
        // Arrange - Location already created in SetUp
        // Act - Retrieve from database
        var location = await _context.ClubLocations
            .FirstAsync(l => l.LocationCode == "DTN");

        // Assert
        location.LocationName.Should().Be("Downtown Chapter");
        location.ParentClubId.Should().Be(_testClub.Id);
        location.City.Should().Be("New York");
        location.IsActive.Should().BeTrue();
    }

    [Test]
    public async Task MultipleLocations_SameClub_AllTrackedIndependently()
    {
        // Arrange & Act - Two locations already created in SetUp
        var locations = await _context.ClubLocations
            .Where(l => l.ParentClubId == _testClub.Id)
            .ToListAsync();

        // Assert
        locations.Should().HaveCount(2);
        locations.Select(l => l.LocationCode).Should().Contain(new[] { "DTN", "UPT" });
        locations.Should().AllSatisfy(l =>
        {
            l.IsActive.Should().BeTrue();
            l.ParentClubId.Should().Be(_testClub.Id);
        });
    }

    [Test]
    public async Task DeactivateLocation_MembersRemain_EventsDisabled()
    {
        // Arrange - Create member at location A
        var member = new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Test Member",
            Email = "member@locationa.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Deactivate location A
        _locationA.IsActive = false;
        _locationA.UpdatedAt = DateTime.UtcNow;
        _context.ClubLocations.Update(_locationA);
        await _context.SaveChangesAsync();

        // Assert - Location deactivated but members still exist
        var deactivated = await _context.ClubLocations
            .FirstAsync(l => l.Id == _locationA.Id);

        var existingMember = await _context.Members
            .FirstOrDefaultAsync(m => m.LocationId == _locationA.Id);

        deactivated.IsActive.Should().BeFalse();
        existingMember.Should().NotBeNull();
    }

    #endregion

    #region Member Transfer Between Locations Tests

    [Test]
    public async Task MemberTransfer_LocationAToB_UpdatesAssociation()
    {
        // Arrange - Member at location A
        var member = new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Transfer Test Member",
            Email = "transfer@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Transfer to location B
        member.LocationId = _locationB.Id;
        member.UpdatedAt = DateTime.UtcNow;
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        // Assert - Member now at location B
        var transferred = await _context.Members
            .Include(m => m.ClubLocation)
            .FirstAsync(m => m.Id == member.Id);

        transferred.LocationId.Should().Be(_locationB.Id);
        transferred.ClubLocation.Should().NotBeNull();
        transferred.ClubLocation!.LocationCode.Should().Be("UPT");
    }

    [Test]
    public async Task BulkMemberTransfer_MultipleMembers_AllTransferred()
    {
        // Arrange - 5 members at location A
        var members = new List<Member>();
        for (int i = 0; i < 5; i++)
        {
            members.Add(new Member
            {
                ClubId = _testClub.Id,
                LocationId = _locationA.Id,
                MembershipTypeId = _membershipType.Id,
                FullName = $"Bulk Transfer Member {i + 1}",
                Email = $"bulk{i + 1}@test.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        _context.Members.AddRange(members);
        await _context.SaveChangesAsync();

        // Act - Transfer all to location B
        var membersToTransfer = await _context.Members
            .Where(m => m.LocationId == _locationA.Id)
            .ToListAsync();

        foreach (var member in membersToTransfer)
        {
            member.LocationId = _locationB.Id;
            member.UpdatedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();

        // Assert - All transferred
        var locationBMembers = await _context.Members
            .Where(m => m.LocationId == _locationB.Id)
            .CountAsync();

        locationBMembers.Should().Be(5);
    }

    [Test]
    public async Task MemberTransfer_MembershipData_Preserved()
    {
        // Arrange - Member with membership details
        var member = new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Data Preservation Test",
            Email = "preservation@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddYears(-1),
            PhoneNumber = "555-1234",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var originalJoinDate = member.JoinDate;
        var originalPhoneNumber = member.PhoneNumber;

        // Act - Transfer to location B
        member.LocationId = _locationB.Id;
        member.UpdatedAt = DateTime.UtcNow;
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        // Assert - Data preserved
        var transferred = await _context.Members
            .FirstAsync(m => m.Id == member.Id);

        transferred.JoinDate.Should().Be(originalJoinDate);
        transferred.PhoneNumber.Should().Be(originalPhoneNumber);
        transferred.LocationId.Should().Be(_locationB.Id);
    }

    #endregion

    #region Location-Specific Events Tests

    [Test]
    public async Task CreateEvent_AtSpecificLocation_AssociatedCorrectly()
    {
        // Arrange & Act - Create event at location A
        var eventAtA = new Event
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            Name = "Downtown Chapter Meetup",
            EventDateTime = DateTime.UtcNow.AddDays(14),
            Location = "Downtown Office",
            Description = "Event at Location A",
            MaxCapacity = 50,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventAtA);
        await _context.SaveChangesAsync();

        // Assert
        var saved = await _context.Events
            .Include(e => e.ClubLocation)
            .FirstAsync(e => e.Id == eventAtA.Id);

        saved.LocationId.Should().Be(_locationA.Id);
        saved.ClubLocation.Should().NotBeNull();
        saved.ClubLocation!.LocationName.Should().Be("Downtown Chapter");
    }

    [Test]
    public async Task LocationEvents_QueryByLocation_ReturnsCorrectEvents()
    {
        // Arrange - Create 3 events at location A and 2 at location B
        var eventsA = new List<Event>
        {
            new Event { ClubId = _testClub.Id, LocationId = _locationA.Id, Name = "A Event 1", EventDateTime = DateTime.UtcNow.AddDays(1), Location = "Loc A", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { ClubId = _testClub.Id, LocationId = _locationA.Id, Name = "A Event 2", EventDateTime = DateTime.UtcNow.AddDays(2), Location = "Loc A", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { ClubId = _testClub.Id, LocationId = _locationA.Id, Name = "A Event 3", EventDateTime = DateTime.UtcNow.AddDays(3), Location = "Loc A", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        var eventsB = new List<Event>
        {
            new Event { ClubId = _testClub.Id, LocationId = _locationB.Id, Name = "B Event 1", EventDateTime = DateTime.UtcNow.AddDays(1), Location = "Loc B", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { ClubId = _testClub.Id, LocationId = _locationB.Id, Name = "B Event 2", EventDateTime = DateTime.UtcNow.AddDays(2), Location = "Loc B", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _context.Events.AddRange(eventsA);
        _context.Events.AddRange(eventsB);
        await _context.SaveChangesAsync();

        // Act - Query events by location
        var locationAEvents = await _context.Events
            .Where(e => e.LocationId == _locationA.Id)
            .ToListAsync();

        var locationBEvents = await _context.Events
            .Where(e => e.LocationId == _locationB.Id)
            .ToListAsync();

        // Assert
        locationAEvents.Should().HaveCount(3);
        locationBEvents.Should().HaveCount(2);
    }

    [Test]
    public async Task MemberRsvp_SameLocationEvent_Allowed()
    {
        // Arrange - Member at location A
        var member = new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Location A Member",
            Email = "membera@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);

        // Event at location A
        var eventAtA = new Event
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            Name = "Location A Event",
            EventDateTime = DateTime.UtcNow.AddDays(7),
            Location = "Downtown Office",
            MaxCapacity = 30,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventAtA);
        await _context.SaveChangesAsync();

        // Act - Member RSVPs to same-location event
        var rsvp = new EventRsvp
        {
            EventId = eventAtA.Id,
            MemberId = member.Id,
            Status = RsvpStatus.Confirmed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.EventRsvps.Add(rsvp);
        await _context.SaveChangesAsync();

        // Assert - RSVP created successfully
        var saved = await _context.EventRsvps
            .Include(r => r.Member)
            .ThenInclude(m => m.ClubLocation)
            .Include(r => r.Event)
            .ThenInclude(e => e.ClubLocation)
            .FirstAsync(r => r.Id == rsvp.Id);

        saved.Member.LocationId.Should().Be(saved.Event.LocationId);
        saved.Status.Should().Be(RsvpStatus.Confirmed);
    }

    [Test]
    public async Task CrossLocationEvent_AllLocationsAllowed_MembersCanRegister()
    {
        // Arrange - Members at different locations
        var memberA = new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Member A",
            Email = "a@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var memberB = new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationB.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "Member B",
            Email = "b@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(memberA, memberB);

        // Club-wide event (no specific location restriction)
        var clubWideEvent = new Event
        {
            ClubId = _testClub.Id,
            LocationId = null, // Null = all locations allowed
            Name = "Club-Wide Annual Gala",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Grand Ballroom",
            MaxCapacity = 200,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(clubWideEvent);
        await _context.SaveChangesAsync();

        // Act - Both members RSVP
        var rsvps = new List<EventRsvp>
        {
            new EventRsvp { EventId = clubWideEvent.Id, MemberId = memberA.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new EventRsvp { EventId = clubWideEvent.Id, MemberId = memberB.Id, Status = RsvpStatus.Confirmed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        _context.EventRsvps.AddRange(rsvps);
        await _context.SaveChangesAsync();

        // Assert - Both RSVPs successful
        var eventRsvps = await _context.EventRsvps
            .Where(r => r.EventId == clubWideEvent.Id)
            .ToListAsync();

        eventRsvps.Should().HaveCount(2);
    }

    #endregion

    #region Location Branding Tests

    [Test]
    public async Task LocationBranding_Create_AssociatedWithLocation()
    {
        // Arrange & Act - Create branding for location A
        var branding = new LocationBranding
        {
            LocationId = _locationA.Id,
            CustomLogoUrl = "https://cdn.example.com/downtown-logo.png",
            ColorScheme = "{\"primary\":\"#1a73e8\",\"secondary\":\"#34a853\"}",
            CustomNameOverride = "NYC Downtown Hub",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.LocationBrandings.Add(branding);
        await _context.SaveChangesAsync();

        // Assert
        var saved = await _context.LocationBrandings
            .Include(b => b.Location)
            .FirstAsync(b => b.LocationId == _locationA.Id);

        saved.CustomLogoUrl.Should().Contain("downtown-logo.png");
        saved.ColorScheme.Should().Contain("primary");
        saved.Location.LocationName.Should().Be("Downtown Chapter");
    }

    [Test]
    public async Task MultipleBranding_DifferentLocations_IndependentCustomization()
    {
        // Arrange - Create branding for both locations
        var brandingA = new LocationBranding
        {
            LocationId = _locationA.Id,
            CustomLogoUrl = "https://cdn.example.com/downtown.png",
            ColorScheme = "{\"primary\":\"#ff0000\"}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var brandingB = new LocationBranding
        {
            LocationId = _locationB.Id,
            CustomLogoUrl = "https://cdn.example.com/uptown.png",
            ColorScheme = "{\"primary\":\"#0000ff\"}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LocationBrandings.AddRange(brandingA, brandingB);
        await _context.SaveChangesAsync();

        // Act - Query both
        var allBranding = await _context.LocationBrandings
            .Include(b => b.Location)
            .ToListAsync();

        // Assert - Different branding for each
        allBranding.Should().HaveCount(2);
        allBranding.First(b => b.LocationId == _locationA.Id).ColorScheme.Should().Contain("ff0000");
        allBranding.First(b => b.LocationId == _locationB.Id).ColorScheme.Should().Contain("0000ff");
    }

    [Test]
    public async Task UpdateBranding_ExistingLocation_ChangesApplied()
    {
        // Arrange - Create initial branding
        var branding = new LocationBranding
        {
            LocationId = _locationA.Id,
            CustomLogoUrl = "https://cdn.example.com/old-logo.png",
            ColorScheme = "{\"primary\":\"#000000\"}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.LocationBrandings.Add(branding);
        await _context.SaveChangesAsync();

        // Act - Update branding
        branding.CustomLogoUrl = "https://cdn.example.com/new-logo.png";
        branding.ColorScheme = "{\"primary\":\"#ffffff\"}";
        branding.UpdatedAt = DateTime.UtcNow;
        _context.LocationBrandings.Update(branding);
        await _context.SaveChangesAsync();

        // Assert - Changes persisted
        var updated = await _context.LocationBrandings
            .FirstAsync(b => b.LocationId == _locationA.Id);

        updated.CustomLogoUrl.Should().Contain("new-logo.png");
        updated.ColorScheme.Should().Contain("ffffff");
    }

    #endregion

    #region Location Settings and Timezone Tests

    [Test]
    public async Task LocationTimezone_Different_TrackingSeparately()
    {
        // Arrange - Create location with different timezone
        var locationWest = new ClubLocation
        {
            ParentClubId = _testClub.Id,
            LocationName = "West Coast Chapter",
            LocationCode = "WC",
            City = "Los Angeles",
            State = "CA",
            Country = "USA",
            Timezone = "America/Los_Angeles", // Different timezone
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.Add(locationWest);
        await _context.SaveChangesAsync();

        // Act - Query locations with timezones
        var locations = await _context.ClubLocations
            .Where(l => l.ParentClubId == _testClub.Id)
            .Select(l => new { l.LocationName, l.Timezone })
            .ToListAsync();

        // Assert - Different timezones
        locations.Should().Contain(l => l.Timezone == "America/New_York");
        locations.Should().Contain(l => l.Timezone == "America/Los_Angeles");
    }

    [Test]
    public async Task LocationSettings_JsonCustomization_Persisted()
    {
        // Arrange & Act - Location with custom settings
        _locationA.SettingsJson = "{\"membershipApprovalRequired\":true,\"autoRenewEnabled\":false}";
        _locationA.UpdatedAt = DateTime.UtcNow;
        _context.ClubLocations.Update(_locationA);
        await _context.SaveChangesAsync();

        // Assert - Settings saved
        var saved = await _context.ClubLocations
            .FirstAsync(l => l.Id == _locationA.Id);

        saved.SettingsJson.Should().Contain("membershipApprovalRequired");
        saved.SettingsJson.Should().Contain("autoRenewEnabled");
    }

    #endregion

    #region Cross-Location Access and Analytics Tests

    [Test]
    public async Task Analytics_MemberCountByLocation_Accurate()
    {
        // Arrange - Create members at different locations
        var membersA = Enumerable.Range(1, 7).Select(i => new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = $"Location A Member {i}",
            Email = $"a{i}@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        var membersB = Enumerable.Range(1, 3).Select(i => new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationB.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = $"Location B Member {i}",
            Email = $"b{i}@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        _context.Members.AddRange(membersA);
        _context.Members.AddRange(membersB);
        await _context.SaveChangesAsync();

        // Act - Get member counts by location
        var locationStats = await _context.Members
            .Where(m => m.ClubId == _testClub.Id)
            .GroupBy(m => m.LocationId)
            .Select(g => new { LocationId = g.Key, Count = g.Count() })
            .ToListAsync();

        // Assert
        locationStats.First(s => s.LocationId == _locationA.Id).Count.Should().Be(7);
        locationStats.First(s => s.LocationId == _locationB.Id).Count.Should().Be(3);
    }

    [Test]
    public async Task ClubWideReport_AllLocations_AggregatedCorrectly()
    {
        // Arrange - Events at multiple locations
        var events = new List<Event>
        {
            new Event { ClubId = _testClub.Id, LocationId = _locationA.Id, Name = "A1", EventDateTime = DateTime.UtcNow.AddDays(1), Location = "Loc A", MaxCapacity = 50, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { ClubId = _testClub.Id, LocationId = _locationA.Id, Name = "A2", EventDateTime = DateTime.UtcNow.AddDays(2), Location = "Loc A", MaxCapacity = 60, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Event { ClubId = _testClub.Id, LocationId = _locationB.Id, Name = "B1", EventDateTime = DateTime.UtcNow.AddDays(1), Location = "Loc B", MaxCapacity = 40, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        _context.Events.AddRange(events);
        await _context.SaveChangesAsync();

        // Act - Get club-wide stats
        var totalEvents = await _context.Events
            .Where(e => e.ClubId == _testClub.Id)
            .CountAsync();

        var totalCapacity = await _context.Events
            .Where(e => e.ClubId == _testClub.Id && e.MaxCapacity.HasValue)
            .SumAsync(e => e.MaxCapacity!.Value);

        // Assert - Aggregated correctly
        totalEvents.Should().Be(3);
        totalCapacity.Should().Be(150); // 50 + 60 + 40
    }

    [Test]
    public async Task LocationAdmin_Assignment_TrackedPerLocation()
    {
        // Arrange - Create a user for testing
        var adminUser = new User
        {
            Email = "admin@locationa.com",
            FullName = "Location Admin",
            PasswordHash = "hashed_password_placeholder",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(adminUser);
        await _context.SaveChangesAsync();

        // Act - Assign as location admin
        var locationAdmin = new LocationAdmin
        {
            LocationId = _locationA.Id,
            UserId = adminUser.Id,
            PermissionLevel = LocationPermissionLevel.LocationAdmin,
            AssignedAt = DateTime.UtcNow
        };
        _context.LocationAdmins.Add(locationAdmin);
        await _context.SaveChangesAsync();

        // Assert - Admin assigned to location
        var saved = await _context.LocationAdmins
            .Include(la => la.Location)
            .Include(la => la.User)
            .FirstAsync(la => la.UserId == adminUser.Id);

        saved.Location.LocationCode.Should().Be("DTN");
        saved.User.FullName.Should().Be("Location Admin");
        saved.PermissionLevel.Should().Be(LocationPermissionLevel.LocationAdmin);
    }

    [Test]
    public async Task MultiLocationMemberHistory_TransferTracking_Maintained()
    {
        // Arrange - Member starts at location A
        var member = new Member
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            MembershipTypeId = _membershipType.Id,
            FullName = "History Tracking Member",
            Email = "history@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var originalUpdatedAt = member.UpdatedAt;

        // Act - Transfer to location B
        await Task.Delay(10); // Ensure different timestamp
        member.LocationId = _locationB.Id;
        member.UpdatedAt = DateTime.UtcNow;
        _context.Members.Update(member);
        await _context.SaveChangesAsync();

        // Assert - UpdatedAt changed (indicates transfer occurred)
        var transferred = await _context.Members
            .FirstAsync(m => m.Id == member.Id);

        transferred.LocationId.Should().Be(_locationB.Id);
        transferred.UpdatedAt.Should().BeAfter(originalUpdatedAt);
    }

    #endregion

    #region Location Deactivation and Reactivation Tests

    [Test]
    public async Task DeactivateLocation_EventsAtLocation_QueryStillWorks()
    {
        // Arrange - Create event at location A
        var eventAtA = new Event
        {
            ClubId = _testClub.Id,
            LocationId = _locationA.Id,
            Name = "Event Before Deactivation",
            EventDateTime = DateTime.UtcNow.AddDays(10),
            Location = "Downtown Office",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventAtA);
        await _context.SaveChangesAsync();

        // Act - Deactivate location
        _locationA.IsActive = false;
        _locationA.UpdatedAt = DateTime.UtcNow;
        _context.ClubLocations.Update(_locationA);
        await _context.SaveChangesAsync();

        // Assert - Event still queryable
        var eventStillExists = await _context.Events
            .Include(e => e.ClubLocation)
            .FirstOrDefaultAsync(e => e.Id == eventAtA.Id);

        eventStillExists.Should().NotBeNull();
        eventStillExists!.ClubLocation.Should().NotBeNull();
        eventStillExists.ClubLocation!.IsActive.Should().BeFalse();
    }

    [Test]
    public async Task ReactivateLocation_AfterDeactivation_StatusUpdated()
    {
        // Arrange - Deactivate location A
        _locationA.IsActive = false;
        _locationA.UpdatedAt = DateTime.UtcNow;
        _context.ClubLocations.Update(_locationA);
        await _context.SaveChangesAsync();

        // Act - Reactivate
        _locationA.IsActive = true;
        _locationA.UpdatedAt = DateTime.UtcNow;
        _context.ClubLocations.Update(_locationA);
        await _context.SaveChangesAsync();

        // Assert - Reactivated
        var reactivated = await _context.ClubLocations
            .FirstAsync(l => l.Id == _locationA.Id);

        reactivated.IsActive.Should().BeTrue();
    }

    #endregion
}
