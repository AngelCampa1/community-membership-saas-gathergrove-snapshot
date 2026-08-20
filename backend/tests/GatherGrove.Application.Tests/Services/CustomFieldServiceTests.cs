using NUnit.Framework;
using Moq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class CustomFieldServiceTests
{
    private GatherGroveDbContext _context;
    private CustomFieldService _customFieldService;
    private Mock<ILogger<CustomFieldService>> _mockLogger;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<CustomFieldService>>();
        _customFieldService = new CustomFieldService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User user, Club club)> CreateTestUserAndClub(string tier = "Grow")
    {
        var user = new User
        {
            FullName = "Admin User",
            Email = "admin@testclub.com",
            PasswordHash = "hashedpassword",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = tier
        };

        var clubAdmin = new ClubAdmin
        {
            User = user,
            Club = club
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        return (user, club);
    }

    [Test]
    public async Task GetCustomFieldsAsync_WithValidAdmin_ReturnsCustomFields()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var customField1 = new ClubCustomField
        {
            ClubId = club.Id,
            FieldLabel = "Emergency Contact",
            FieldType = "Text",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        var customField2 = new ClubCustomField
        {
            ClubId = club.Id,
            FieldLabel = "Allergies",
            FieldType = "Text",
            CreatedAt = DateTime.UtcNow
        };

        _context.ClubCustomFields.AddRange(customField1, customField2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _customFieldService.GetCustomFieldsAsync(club.Id, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        var customFields = result.ToList();
        Assert.That(customFields, Has.Count.EqualTo(2));
        Assert.That(customFields[0].FieldLabel, Is.EqualTo("Emergency Contact")); // Should be ordered by CreatedAt
        Assert.That(customFields[1].FieldLabel, Is.EqualTo("Allergies"));
    }

    [Test]
    public async Task GetCustomFieldsAsync_WithUnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var unauthorizedUser = new User
        {
            FullName = "Unauthorized User",
            Email = "unauthorized@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(unauthorizedUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _customFieldService.GetCustomFieldsAsync(club.Id, unauthorizedUser.Id));

        Assert.That(ex.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task GetCustomFieldByIdAsync_WithValidId_ReturnsCustomField()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var customField = new ClubCustomField
        {
            ClubId = club.Id,
            FieldLabel = "Emergency Contact",
            FieldType = "Text",
            CreatedAt = DateTime.UtcNow
        };

        _context.ClubCustomFields.Add(customField);
        await _context.SaveChangesAsync();

        // Act
        var result = await _customFieldService.GetCustomFieldByIdAsync(club.Id, customField.CustomFieldId, user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.CustomFieldId, Is.EqualTo(customField.CustomFieldId));
        Assert.That(result.FieldLabel, Is.EqualTo("Emergency Contact"));
        Assert.That(result.FieldType, Is.EqualTo("Text"));
    }

    [Test]
    public async Task GetCustomFieldByIdAsync_WithInvalidId_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _customFieldService.GetCustomFieldByIdAsync(club.Id, 999, user.Id));

        Assert.That(ex.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task CreateCustomFieldAsync_WithValidRequest_CreatesCustomField()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };

        // Act
        var result = await _customFieldService.CreateCustomFieldAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FieldLabel, Is.EqualTo("Emergency Contact"));
        Assert.That(result.FieldType, Is.EqualTo("Text"));
        Assert.That(result.ClubId, Is.EqualTo(club.Id));

        // Verify it was saved to database
        var savedField = await _context.ClubCustomFields.FirstOrDefaultAsync(cf => cf.CustomFieldId == result.CustomFieldId);
        Assert.That(savedField, Is.Not.Null);
        Assert.That(savedField.FieldLabel, Is.EqualTo("Emergency Contact"));
    }

    [Test]
    public async Task CreateCustomFieldAsync_WithDuplicateLabel_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var existingField = new ClubCustomField
        {
            ClubId = club.Id,
            FieldLabel = "Emergency Contact",
            FieldType = "Text",
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubCustomFields.Add(existingField);
        await _context.SaveChangesAsync();

        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact", // Duplicate label
            FieldType = "Text"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _customFieldService.CreateCustomFieldAsync(club.Id, user.Id, request));

        Assert.That(ex.Message, Does.Contain("already exists"));
    }

    [Test]
    public async Task CreateCustomFieldAsync_ExceedsMaxLimit_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Create 10 existing custom fields (the max limit)
        for (int i = 1; i <= 10; i++)
        {
            var field = new ClubCustomField
            {
                ClubId = club.Id,
                FieldLabel = $"Field {i}",
                FieldType = "Text",
                CreatedAt = DateTime.UtcNow
            };
            _context.ClubCustomFields.Add(field);
        }
        await _context.SaveChangesAsync();

        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Field 11", // This would exceed the limit
            FieldType = "Text"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _customFieldService.CreateCustomFieldAsync(club.Id, user.Id, request));

        Assert.That(ex.Message, Does.Contain("Maximum of 10 custom fields"));
    }

    [Test]
    public async Task CreateCustomFieldAsync_WithInvalidClub_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };

        // Act & Assert - Authorization is checked first, so invalid club ID results in UnauthorizedAccessException
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _customFieldService.CreateCustomFieldAsync(999, user.Id, request)); // Invalid club ID

        Assert.That(ex.Message, Does.Contain("not authorized"));
    }

    [Test]
    public async Task UpdateCustomFieldAsync_WithValidRequest_UpdatesCustomField()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var customField = new ClubCustomField
        {
            ClubId = club.Id,
            FieldLabel = "Emergency Contact",
            FieldType = "Text",
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubCustomFields.Add(customField);
        await _context.SaveChangesAsync();

        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact Name", // Updated label
            FieldType = "Text"
        };

        // Act
        var result = await _customFieldService.UpdateCustomFieldAsync(club.Id, customField.CustomFieldId, user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FieldLabel, Is.EqualTo("Emergency Contact Name"));
        Assert.That(result.CustomFieldId, Is.EqualTo(customField.CustomFieldId));

        // Verify it was updated in database
        var updatedField = await _context.ClubCustomFields.FirstOrDefaultAsync(cf => cf.CustomFieldId == customField.CustomFieldId);
        Assert.That(updatedField, Is.Not.Null);
        Assert.That(updatedField.FieldLabel, Is.EqualTo("Emergency Contact Name"));
    }

    [Test]
    public async Task UpdateCustomFieldAsync_WithDuplicateLabel_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var field1 = new ClubCustomField
        {
            ClubId = club.Id,
            FieldLabel = "Emergency Contact",
            FieldType = "Text",
            CreatedAt = DateTime.UtcNow
        };

        var field2 = new ClubCustomField
        {
            ClubId = club.Id,
            FieldLabel = "Allergies",
            FieldType = "Text",
            CreatedAt = DateTime.UtcNow
        };

        _context.ClubCustomFields.AddRange(field1, field2);
        await _context.SaveChangesAsync();

        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact", // Trying to use existing label
            FieldType = "Text"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _customFieldService.UpdateCustomFieldAsync(club.Id, field2.CustomFieldId, user.Id, request));

        Assert.That(ex.Message, Does.Contain("already exists"));
    }

    [Test]
    public async Task UpdateCustomFieldAsync_WithInvalidId_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var request = new UpdateCustomFieldRequest
        {
            FieldLabel = "Updated Label",
            FieldType = "Text"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _customFieldService.UpdateCustomFieldAsync(club.Id, 999, user.Id, request));

        Assert.That(ex.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task DeleteCustomFieldAsync_WithValidId_DeletesCustomField()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var customField = new ClubCustomField
        {
            ClubId = club.Id,
            FieldLabel = "Emergency Contact",
            FieldType = "Text",
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubCustomFields.Add(customField);
        await _context.SaveChangesAsync();

        // Act
        var result = await _customFieldService.DeleteCustomFieldAsync(club.Id, customField.CustomFieldId, user.Id);

        // Assert
        Assert.That(result, Is.True);

        // Verify it was deleted from database
        var deletedField = await _context.ClubCustomFields.FirstOrDefaultAsync(cf => cf.CustomFieldId == customField.CustomFieldId);
        Assert.That(deletedField, Is.Null);
    }

    [Test]
    public async Task DeleteCustomFieldAsync_WithInvalidId_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _customFieldService.DeleteCustomFieldAsync(club.Id, 999, user.Id));

        Assert.That(ex.Message, Does.Contain("not found"));
    }

    [Test]
    public async Task CreateCustomFieldAsync_WithUnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var (user, club) = await CreateTestUserAndClub();

        var unauthorizedUser = new User
        {
            FullName = "Unauthorized User",
            Email = "unauthorized@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(unauthorizedUser);
        await _context.SaveChangesAsync();

        var request = new CreateCustomFieldRequest
        {
            FieldLabel = "Emergency Contact",
            FieldType = "Text"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _customFieldService.CreateCustomFieldAsync(club.Id, unauthorizedUser.Id, request));

        Assert.That(ex.Message, Does.Contain("not authorized"));
    }
}