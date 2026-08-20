using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class MemberDirectorySettingsServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<ILogger<MemberDirectorySettingsService>> _mockLogger;
    private MemberDirectorySettingsService _service;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<MemberDirectorySettingsService>>();
        _service = new MemberDirectorySettingsService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User user, Club club, Member member)> CreateTestUserClubAndMember(
        bool directoryEnabled = true,
        string[]? allowedFields = null,
        bool memberListed = false,
        string[]? memberVisibleFields = null)
    {
        allowedFields ??= new[] { "email", "phoneNumber" };
        memberVisibleFields ??= Array.Empty<string>();

        var user = new User
        {
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            IsDirectoryEnabled = directoryEnabled,
            DirectoryAllowedSharableFields = string.Join(",", allowedFields),
            CreatedByUserId = 1
        };

        var member = new Member
        {
            FullName = user.FullName,
            Email = user.Email,
            Club = club,
            MembershipTypeId = 1,
            IsListedInDirectory = memberListed,
            DirectoryVisibleFields = memberVisibleFields.Any() ? string.Join(",", memberVisibleFields) : null
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        return (user, club, member);
    }

    [Test]
    public async Task GetMemberDirectorySettingsAsync_ValidUser_ReturnsSettings()
    {
        // Arrange
        var (user, club, member) = await CreateTestUserClubAndMember(
            directoryEnabled: true,
            allowedFields: new[] { "email", "phoneNumber" },
            memberListed: true,
            memberVisibleFields: new[] { "email" }
        );

        // Act
        var result = await _service.GetMemberDirectorySettingsAsync(user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubDirectoryEnabled, Is.True);
        Assert.That(result.AdminAllowedSharableFields, Is.EqualTo(new[] { "email", "phoneNumber" }));
        Assert.That(result.IsListed, Is.True);
        Assert.That(result.VisibleFields, Is.EqualTo(new[] { "email" }));
    }

    [Test]
    public async Task GetMemberDirectorySettingsAsync_DirectoryDisabled_ReturnsDisabledSettings()
    {
        // Arrange
        var (user, club, member) = await CreateTestUserClubAndMember(
            directoryEnabled: false
        );

        // Act
        var result = await _service.GetMemberDirectorySettingsAsync(user.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.ClubDirectoryEnabled, Is.False);
        Assert.That(result.AdminAllowedSharableFields, Is.Empty);
        Assert.That(result.IsListed, Is.False);
        Assert.That(result.VisibleFields, Is.Empty);
    }

    [Test]
    public async Task GetMemberDirectorySettingsAsync_UserNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetMemberDirectorySettingsAsync(999));

        Assert.That(ex.Message, Does.Contain("User not found"));
    }

    [Test]
    public async Task GetMemberDirectorySettingsAsync_MemberNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var user = new User
        {
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.GetMemberDirectorySettingsAsync(user.Id));

        Assert.That(ex.Message, Does.Contain("Member record not found"));
    }

    [Test]
    public async Task UpdateMemberDirectorySettingsAsync_ValidRequest_UpdatesSettings()
    {
        // Arrange
        var (user, club, member) = await CreateTestUserClubAndMember(
            directoryEnabled: true,
            allowedFields: new[] { "email", "phoneNumber" }
        );

        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email", "phoneNumber" }
        };

        // Act
        var result = await _service.UpdateMemberDirectorySettingsAsync(user.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.IsListed, Is.True);
        Assert.That(result.VisibleFields, Is.EqualTo(new[] { "email", "phoneNumber" }));

        // Verify database was updated
        var updatedMember = await _context.Members.FirstAsync(m => m.Id == member.Id);
        Assert.That(updatedMember.IsListedInDirectory, Is.True);
        Assert.That(updatedMember.DirectoryVisibleFields, Is.EqualTo("email,phoneNumber"));
    }

    [Test]
    public async Task UpdateMemberDirectorySettingsAsync_DirectoryDisabled_ThrowsInvalidOperationException()
    {
        // Arrange
        var (user, club, member) = await CreateTestUserClubAndMember(
            directoryEnabled: false
        );

        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email" }
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateMemberDirectorySettingsAsync(user.Id, request));

        Assert.That(ex.Message, Does.Contain("directory is currently disabled"));
    }

    [Test]
    public async Task UpdateMemberDirectorySettingsAsync_InvalidFields_ThrowsArgumentException()
    {
        // Arrange
        var (user, club, member) = await CreateTestUserClubAndMember(
            directoryEnabled: true,
            allowedFields: new[] { "email" } // Only email allowed
        );

        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email", "phoneNumber" } // phoneNumber not allowed
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdateMemberDirectorySettingsAsync(user.Id, request));

        Assert.That(ex.Message, Does.Contain("not allowed by your club admin"));
        Assert.That(ex.Message, Does.Contain("phoneNumber"));
    }

    [Test]
    public async Task UpdateMemberDirectorySettingsAsync_EmptyVisibleFields_ClearsFields()
    {
        // Arrange
        var (user, club, member) = await CreateTestUserClubAndMember(
            directoryEnabled: true,
            memberListed: true,
            memberVisibleFields: new[] { "email" }
        );

        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = false,
            VisibleFields = Array.Empty<string>()
        };

        // Act
        var result = await _service.UpdateMemberDirectorySettingsAsync(user.Id, request);

        // Assert
        Assert.That(result.IsListed, Is.False);
        Assert.That(result.VisibleFields, Is.Empty);

        // Verify database was updated
        var updatedMember = await _context.Members.FirstAsync(m => m.Id == member.Id);
        Assert.That(updatedMember.IsListedInDirectory, Is.False);
        Assert.That(updatedMember.DirectoryVisibleFields, Is.Null);
    }

    [Test]
    public async Task UpdateMemberDirectorySettingsAsync_UserNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email" }
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdateMemberDirectorySettingsAsync(999, request));

        Assert.That(ex.Message, Does.Contain("User not found"));
    }

    [Test]
    public async Task UpdateMemberDirectorySettingsAsync_MemberNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var user = new User
        {
            FullName = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberDirectorySettingsRequest
        {
            IsListed = true,
            VisibleFields = new[] { "email" }
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateMemberDirectorySettingsAsync(user.Id, request));

        Assert.That(ex.Message, Does.Contain("Member record not found"));
    }
}