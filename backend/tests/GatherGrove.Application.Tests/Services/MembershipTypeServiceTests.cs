using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class MembershipTypeServiceTests
{
    private GatherGroveDbContext _context;
    private MembershipTypeService _membershipTypeService;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database with unique name for each test
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _membershipTypeService = new MembershipTypeService(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region CreateMembershipTypeAsync Tests

    [Test]
    public async Task CreateMembershipTypeAsync_ValidRequest_ReturnsCreatedMembershipType()
    {
        // Arrange
        var club = await CreateTestClub();
        var request = new CreateMembershipTypeRequest
        {
            Name = "Individual",
            Description = "Standard individual membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly"
        };

        // Act
        var result = await _membershipTypeService.CreateMembershipTypeAsync(club.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Name, Is.EqualTo(request.Name));
        Assert.That(result.Description, Is.EqualTo(request.Description));
        Assert.That(result.DuesAmount, Is.EqualTo(request.DuesAmount));
        Assert.That(result.DuesFrequency, Is.EqualTo(request.DuesFrequency));
        Assert.That(result.ClubId, Is.EqualTo(club.Id));
        Assert.That(result.IsActive, Is.True);
        Assert.That(result.CreatedAt, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));
        Assert.That(result.UpdatedAt, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));

        // Verify it was saved to database
        var saved = await _context.MembershipTypes.FindAsync(result.Id);
        Assert.That(saved, Is.Not.Null);
        Assert.That(saved.Name, Is.EqualTo(request.Name));
    }

    [Test]
    public async Task CreateMembershipTypeAsync_NonExistentClub_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateMembershipTypeRequest
        {
            Name = "Individual",
            Description = "Standard individual membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _membershipTypeService.CreateMembershipTypeAsync(999, request));

        Assert.That(ex.Message, Does.Contain("Club with ID 999 not found"));
        Assert.That(ex.ParamName, Is.EqualTo("clubId"));
    }

    [Test]
    public async Task CreateMembershipTypeAsync_DuplicateName_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();

        // Create first membership type
        var existingType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Individual",
            Description = "Existing membership",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(existingType);
        await _context.SaveChangesAsync();

        var request = new CreateMembershipTypeRequest
        {
            Name = "Individual", // Same name
            Description = "New membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _membershipTypeService.CreateMembershipTypeAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("A membership type with the name 'Individual' already exists"));
    }

    [Test]
    public async Task CreateMembershipTypeAsync_DifferentClubsSameName_Succeeds()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");

        // Create membership type in first club
        var request1 = new CreateMembershipTypeRequest
        {
            Name = "Individual",
            Description = "Club 1 membership",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly"
        };
        await _membershipTypeService.CreateMembershipTypeAsync(club1.Id, request1);

        // Create membership type with same name in second club
        var request2 = new CreateMembershipTypeRequest
        {
            Name = "Individual", // Same name, different club
            Description = "Club 2 membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Quarterly"
        };

        // Act
        var result = await _membershipTypeService.CreateMembershipTypeAsync(club2.Id, request2);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Name, Is.EqualTo("Individual"));
        Assert.That(result.ClubId, Is.EqualTo(club2.Id));
    }

    #endregion

    #region GetMembershipTypesByClubAsync Tests

    [Test]
    public async Task GetMembershipTypesByClubAsync_ExistingClubWithTypes_ReturnsOrderedTypes()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipTypes = new[]
        {
            new MembershipType
            {
                ClubId = club.Id,
                Name = "Zeta",
                Description = "Last alphabetically",
                DuesAmount = 30.00m,
                DuesFrequency = "Monthly",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new MembershipType
            {
                ClubId = club.Id,
                Name = "Alpha",
                Description = "First alphabetically",
                DuesAmount = 20.00m,
                DuesFrequency = "Annually",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new MembershipType
            {
                ClubId = club.Id,
                Name = "Beta",
                Description = "Middle alphabetically",
                DuesAmount = 25.00m,
                DuesFrequency = "Quarterly",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.MembershipTypes.AddRange(membershipTypes);
        await _context.SaveChangesAsync();

        // Act
        var result = await _membershipTypeService.GetMembershipTypesByClubAsync(club.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(3));
        Assert.That(result[0].Name, Is.EqualTo("Alpha"));
        Assert.That(result[1].Name, Is.EqualTo("Beta"));
        Assert.That(result[2].Name, Is.EqualTo("Zeta"));

        // Verify all properties are mapped correctly
        var alphaType = result[0];
        Assert.That(alphaType.ClubId, Is.EqualTo(club.Id));
        Assert.That(alphaType.Description, Is.EqualTo("First alphabetically"));
        Assert.That(alphaType.DuesAmount, Is.EqualTo(20.00m));
        Assert.That(alphaType.DuesFrequency, Is.EqualTo("Annually"));
        Assert.That(alphaType.IsActive, Is.True);
    }

    [Test]
    public async Task GetMembershipTypesByClubAsync_EmptyClub_ReturnsEmptyList()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _membershipTypeService.GetMembershipTypesByClubAsync(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(0));
    }

    [Test]
    public async Task GetMembershipTypesByClubAsync_NonExistentClub_ReturnsEmptyList()
    {
        // Act
        var result = await _membershipTypeService.GetMembershipTypesByClubAsync(999);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(0));
    }

    [Test]
    public async Task GetMembershipTypesByClubAsync_OnlyReturnsTypesForSpecificClub()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");

        // Add membership types to both clubs
        var club1Type = new MembershipType
        {
            ClubId = club1.Id,
            Name = "Club1 Individual",
            Description = "For club 1",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club2Type = new MembershipType
        {
            ClubId = club2.Id,
            Name = "Club2 Individual",
            Description = "For club 2",
            DuesAmount = 25.00m,
            DuesFrequency = "Quarterly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.AddRange(club1Type, club2Type);
        await _context.SaveChangesAsync();

        // Act
        var club1Result = await _membershipTypeService.GetMembershipTypesByClubAsync(club1.Id);
        var club2Result = await _membershipTypeService.GetMembershipTypesByClubAsync(club2.Id);

        // Assert
        Assert.That(club1Result, Has.Count.EqualTo(1));
        Assert.That(club1Result[0].Name, Is.EqualTo("Club1 Individual"));
        Assert.That(club1Result[0].ClubId, Is.EqualTo(club1.Id));

        Assert.That(club2Result, Has.Count.EqualTo(1));
        Assert.That(club2Result[0].Name, Is.EqualTo("Club2 Individual"));
        Assert.That(club2Result[0].ClubId, Is.EqualTo(club2.Id));
    }

    #endregion

    #region GetMembershipTypeByIdAsync Tests

    [Test]
    public async Task GetMembershipTypeByIdAsync_ExistingType_ReturnsType()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Premium",
            Description = "Premium membership with all benefits",
            DuesAmount = 50.00m,
            DuesFrequency = "Annually",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        // Act
        var result = await _membershipTypeService.GetMembershipTypeByIdAsync(club.Id, membershipType.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(membershipType.Id));
        Assert.That(result.Name, Is.EqualTo(membershipType.Name));
        Assert.That(result.Description, Is.EqualTo(membershipType.Description));
        Assert.That(result.DuesAmount, Is.EqualTo(membershipType.DuesAmount));
        Assert.That(result.DuesFrequency, Is.EqualTo(membershipType.DuesFrequency));
        Assert.That(result.ClubId, Is.EqualTo(club.Id));
    }

    [Test]
    public async Task GetMembershipTypeByIdAsync_NonExistentType_ReturnsNull()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _membershipTypeService.GetMembershipTypeByIdAsync(club.Id, 999);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMembershipTypeByIdAsync_TypeFromDifferentClub_ReturnsNull()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");

        var membershipType = new MembershipType
        {
            ClubId = club1.Id,
            Name = "Club1 Type",
            Description = "For club 1 only",
            DuesAmount = 30.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        // Act - Try to access from different club
        var result = await _membershipTypeService.GetMembershipTypeByIdAsync(club2.Id, membershipType.Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMembershipTypeByIdAsync_NonExistentClub_ReturnsNull()
    {
        // Act
        var result = await _membershipTypeService.GetMembershipTypeByIdAsync(999, 999);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region UpdateMembershipTypeAsync Tests

    [Test]
    public async Task UpdateMembershipTypeAsync_ValidRequest_ReturnsUpdatedMembershipType()
    {
        // Arrange
        var club = await CreateTestClub();
        var originalType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Original Name",
            Description = "Original description",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        };
        _context.MembershipTypes.Add(originalType);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateMembershipTypeRequest
        {
            Name = "Updated Name",
            DuesAmount = 30.00m
        };

        // Act
        var result = await _membershipTypeService.UpdateMembershipTypeAsync(club.Id, originalType.Id, updateRequest);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(originalType.Id));
        Assert.That(result.Name, Is.EqualTo("Updated Name"));
        Assert.That(result.DuesAmount, Is.EqualTo(30.00m));
        Assert.That(result.Description, Is.EqualTo("Original description")); // Should remain unchanged
        Assert.That(result.DuesFrequency, Is.EqualTo("Monthly")); // Should remain unchanged
        Assert.That(result.ClubId, Is.EqualTo(club.Id));
        Assert.That(result.CreatedAt, Is.EqualTo(originalType.CreatedAt));
        Assert.That(result.UpdatedAt, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));

        // Verify it was updated in database
        var updated = await _context.MembershipTypes.FindAsync(originalType.Id);
        Assert.That(updated, Is.Not.Null);
        Assert.That(updated.Name, Is.EqualTo("Updated Name"));
        Assert.That(updated.DuesAmount, Is.EqualTo(30.00m));
    }

    [Test]
    public async Task UpdateMembershipTypeAsync_NonExistentType_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();
        var updateRequest = new UpdateMembershipTypeRequest
        {
            Name = "Updated Name",
            DuesAmount = 30.00m
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _membershipTypeService.UpdateMembershipTypeAsync(club.Id, 999, updateRequest));

        Assert.That(ex.Message, Does.Contain("Membership type with ID 999 not found in club"));
    }

    [Test]
    public async Task UpdateMembershipTypeAsync_TypeFromDifferentClub_ThrowsArgumentException()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");

        var membershipType = new MembershipType
        {
            ClubId = club1.Id,
            Name = "Club1 Type",
            Description = "Belongs to club 1",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateMembershipTypeRequest
        {
            Name = "Updated Name",
            DuesAmount = 30.00m
        };

        // Act & Assert - try to update using club2's ID
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _membershipTypeService.UpdateMembershipTypeAsync(club2.Id, membershipType.Id, updateRequest));

        Assert.That(ex.Message, Does.Contain($"Membership type with ID {membershipType.Id} not found in club {club2.Id}"));
    }

    [Test]
    public async Task UpdateMembershipTypeAsync_DuplicateName_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();

        var existingType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Existing Name",
            Description = "Existing type",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var typeToUpdate = new MembershipType
        {
            ClubId = club.Id,
            Name = "Original Name",
            Description = "Type to update",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.AddRange(existingType, typeToUpdate);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateMembershipTypeRequest
        {
            Name = "Existing Name", // Conflicts with existing type
            DuesAmount = 30.00m
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _membershipTypeService.UpdateMembershipTypeAsync(club.Id, typeToUpdate.Id, updateRequest));

        Assert.That(ex.Message, Does.Contain("A membership type with the name 'Existing Name' already exists"));
    }

    [Test]
    public async Task UpdateMembershipTypeAsync_SameNameSameType_Succeeds()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Current Name",
            Description = "Description",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        var updateRequest = new UpdateMembershipTypeRequest
        {
            Name = "Current Name", // Same name as current
            DuesAmount = 30.00m
        };

        // Act
        var result = await _membershipTypeService.UpdateMembershipTypeAsync(club.Id, membershipType.Id, updateRequest);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Name, Is.EqualTo("Current Name"));
        Assert.That(result.DuesAmount, Is.EqualTo(30.00m));
    }

    #endregion

    #region DeleteMembershipTypeAsync Tests

    [Test]
    public async Task DeleteMembershipTypeAsync_ValidType_ReturnsTrue()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "To Delete",
            Description = "Will be deleted",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        // Act
        var result = await _membershipTypeService.DeleteMembershipTypeAsync(club.Id, membershipType.Id);

        // Assert
        Assert.That(result, Is.True);

        // Verify it was deleted from database
        var deleted = await _context.MembershipTypes.FindAsync(membershipType.Id);
        Assert.That(deleted, Is.Null);
    }

    [Test]
    public async Task DeleteMembershipTypeAsync_NonExistentType_ReturnsFalse()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _membershipTypeService.DeleteMembershipTypeAsync(club.Id, 999);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task DeleteMembershipTypeAsync_TypeFromDifferentClub_ReturnsFalse()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");

        var membershipType = new MembershipType
        {
            ClubId = club1.Id,
            Name = "Club1 Type",
            Description = "Belongs to club 1",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        // Act - try to delete using club2's ID
        var result = await _membershipTypeService.DeleteMembershipTypeAsync(club2.Id, membershipType.Id);

        // Assert
        Assert.That(result, Is.False);

        // Verify it was NOT deleted from database
        var notDeleted = await _context.MembershipTypes.FindAsync(membershipType.Id);
        Assert.That(notDeleted, Is.Not.Null);
    }

    [Test]
    public async Task DeleteMembershipTypeAsync_TypeAssignedToMembers_ThrowsInvalidOperationException()
    {
        // Arrange
        var club = await CreateTestClub();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Assigned Type",
            Description = "Has members",
            DuesAmount = 20.00m,
            DuesFrequency = "Monthly",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        // Create a member assigned to this membership type
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Test Member",
            Email = "member@test.com",
            JoinDate = DateTime.UtcNow,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _membershipTypeService.DeleteMembershipTypeAsync(club.Id, membershipType.Id));

        Assert.That(ex.Message, Does.Contain("Cannot delete membership type because it is assigned to 1 member. Please reassign these members to a different membership type before deletion."));

        // Verify it was NOT deleted from database
        var notDeleted = await _context.MembershipTypes.FindAsync(membershipType.Id);
        Assert.That(notDeleted, Is.Not.Null);
    }

    #endregion

    #region Helper Methods

    private async Task<Club> CreateTestClub(string name = "Test Club")
    {
        var club = new Club
        {
            Name = name,
            CreatedAt = DateTime.UtcNow,
            Tier = "Sprout"
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    #endregion
}