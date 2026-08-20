using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class MemberInviteCodeServiceTests
{
    private GatherGroveDbContext _context;
    private MemberInviteCodeService _service;
    private Mock<IConfiguration> _mockConfiguration;
    private Mock<IAuthService> _mockAuthService;
    private Mock<IUrlService> _mockUrlService;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockConfiguration = new Mock<IConfiguration>();
        _mockAuthService = new Mock<IAuthService>();
        _mockUrlService = new Mock<IUrlService>();

        _mockConfiguration.Setup(c => c["ClientUrl"]).Returns("https://gathergrove.club");

        // Setup URL service mock
        _mockUrlService.Setup(x => x.GenerateJoinUrl(It.IsAny<string>()))
            .Returns<string>(code => $"https://gathergrove.club/join/{code}");

        _service = new MemberInviteCodeService(_context, _mockConfiguration.Object, _mockAuthService.Object, _mockUrlService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region Helper Methods

    private async Task<(User user, Club club, MembershipType membershipType)> CreateTestClubWithAdmin(string tier = "Grow")
    {
        var user = new User
        {
            FullName = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = "hash",
            IsActive = true,
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = tier,
            CreatedAt = DateTime.UtcNow
        };

        var membershipType = new MembershipType
        {
            Club = club,
            Name = "Regular Member",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            Description = "Standard membership",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var clubAdmin = new ClubAdmin
        {
            User = user,
            Club = club,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        _context.MembershipTypes.Add(membershipType);
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();

        return (user, club, membershipType);
    }

    #endregion

    #region CreateInviteCodeAsync Tests

    [Test]
    public async Task CreateInviteCodeAsync_WithValidRequest_ShouldCreateInviteCode()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();
        var request = new CreateMemberInviteCodeRequest
        {
            Name = "Event Registration",
            Description = "Code for annual meeting",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            IsActive = true
        };

        // Act
        var result = await _service.CreateInviteCodeAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data.Name, Is.EqualTo("Event Registration"));
        Assert.That(result.Data.Code, Is.Not.Empty);
        Assert.That(result.Data.Code.Length, Is.EqualTo(8));
        Assert.That(result.Data.JoinUrl, Does.Contain($"/join/{result.Data.Code}"));
        Assert.That(result.Data.CurrentUses, Is.EqualTo(0));
        Assert.That(result.Data.IsActive, Is.True);
    }

    [Test]
    public async Task CreateInviteCodeAsync_WithNonAdminUser_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();
        var nonAdminUser = new User
        {
            FullName = "Regular User",
            Email = "user@test.com",
            PasswordHash = "hash",
            IsActive = true
        };
        _context.Users.Add(nonAdminUser);
        await _context.SaveChangesAsync();

        var request = new CreateMemberInviteCodeRequest
        {
            Name = "Test Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        // Act
        var result = await _service.CreateInviteCodeAsync(club.Id, nonAdminUser.Id, request);

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("must be an admin"));
    }

    [Test]
    public async Task CreateInviteCodeAsync_WithInvalidMembershipType_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();
        var request = new CreateMemberInviteCodeRequest
        {
            Name = "Test Code",
            MembershipTypeId = 999, // Non-existent
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        // Act
        var result = await _service.CreateInviteCodeAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("Invalid membership type"));
    }

    [Test]
    public async Task CreateInviteCodeAsync_ShouldGenerateUniqueCode()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();
        var request = new CreateMemberInviteCodeRequest
        {
            Name = "Test Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        // Act
        var result1 = await _service.CreateInviteCodeAsync(club.Id, user.Id, request);
        var result2 = await _service.CreateInviteCodeAsync(club.Id, user.Id, request);

        // Assert
        Assert.That(result1.Success, Is.True);
        Assert.That(result2.Success, Is.True);
        Assert.That(result1.Data.Code, Is.Not.EqualTo(result2.Data.Code));
    }

    #endregion

    #region GetClubInviteCodesAsync Tests

    [Test]
    public async Task GetClubInviteCodesAsync_WithValidAdmin_ShouldReturnInviteCodes()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "TEST1234",
            Name = "Test Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CurrentUses = 5,
            MaxUses = 100,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetClubInviteCodesAsync(club.Id, user.Id);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.Data, Is.Not.Empty);
        Assert.That(result.Data.First().Code, Is.EqualTo("TEST1234"));
        Assert.That(result.Data.First().CurrentUses, Is.EqualTo(5));
    }

    [Test]
    public async Task GetClubInviteCodesAsync_WithNonAdmin_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();
        var nonAdminUser = new User
        {
            FullName = "Regular User",
            Email = "user@test.com",
            PasswordHash = "hash"
        };
        _context.Users.Add(nonAdminUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetClubInviteCodesAsync(club.Id, nonAdminUser.Id);

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("must be an admin"));
    }

    #endregion

    #region ValidateInviteCodeAsync Tests

    [Test]
    public async Task ValidateInviteCodeAsync_WithValidCode_ShouldReturnValid()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "VALID123",
            Name = "Valid Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ValidateInviteCodeAsync("VALID123");

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data.Code, Is.EqualTo("VALID123"));
    }

    [Test]
    public async Task ValidateInviteCodeAsync_WithInactiveCode_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "INACTIVE1",
            Name = "Inactive Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = false, // Inactive
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ValidateInviteCodeAsync("INACTIVE1");

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("deactivated"));
    }

    [Test]
    public async Task ValidateInviteCodeAsync_WithExpiredCode_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "EXPIRED1",
            Name = "Expired Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(-1), // Expired
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ValidateInviteCodeAsync("EXPIRED1");

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("expired"));
    }

    [Test]
    public async Task ValidateInviteCodeAsync_WithMaxUsesReached_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "MAXED123",
            Name = "Maxed Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 5,
            CurrentUses = 5, // At limit
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ValidateInviteCodeAsync("MAXED123");

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("maximum usage limit"));
    }

    [Test]
    public async Task ValidateInviteCodeAsync_WithNonExistentCode_ShouldReturnError()
    {
        // Act
        var result = await _service.ValidateInviteCodeAsync("NOTFOUND");

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("Invalid invite code"));
    }

    #endregion

    #region RegisterMemberWithInviteCodeAsync Tests

    [Test]
    public async Task RegisterMemberWithInviteCodeAsync_WithValidRequest_ShouldRegisterMember()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "REG12345",
            Name = "Registration Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        var request = new RegisterWithInviteCodeRequest
        {
            InviteCode = "REG12345",
            FullName = "New Member",
            Email = "newmember@test.com",
            Password = "Password123!",
            PhoneNumber = "555-0123",
            HasSmsConsent = true
        };

        _mockAuthService.Setup(x => x.RegisterAsync(It.IsAny<RegisterRequest>(), false))
            .ReturnsAsync((true, "User created successfully."));

        // Act
        var result = await _service.RegisterMemberWithInviteCodeAsync(request);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data.FullName, Is.EqualTo("New Member"));
        Assert.That(result.Data.Email, Is.EqualTo("newmember@test.com"));
        Assert.That(result.Data.ClubId, Is.EqualTo(club.Id));
        Assert.That(result.Data.MembershipTypeId, Is.EqualTo(membershipType.Id));

        // Verify invite code usage incremented
        var updatedCode = await _context.MemberInviteCodes.FindAsync(inviteCode.Id);
        Assert.That(updatedCode.CurrentUses, Is.EqualTo(1));
    }

    [Test]
    public async Task RegisterMemberWithInviteCodeAsync_WithInvalidCode_ShouldReturnError()
    {
        // Arrange
        var request = new RegisterWithInviteCodeRequest
        {
            InviteCode = "INVALID1",
            FullName = "New Member",
            Email = "newmember@test.com",
            Password = "Password123!"
        };

        // Act
        var result = await _service.RegisterMemberWithInviteCodeAsync(request);

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("Invalid invite code"));
    }

    [Test]
    public async Task RegisterMemberWithInviteCodeAsync_WithExistingMember_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "EXISTS12",
            Name = "Registration Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        var existingMember = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Existing Member",
            Email = "existing@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MemberInviteCodes.Add(inviteCode);
        _context.Members.Add(existingMember);
        await _context.SaveChangesAsync();

        var request = new RegisterWithInviteCodeRequest
        {
            InviteCode = "EXISTS12",
            FullName = "New Member",
            Email = "existing@test.com", // Same email
            Password = "Password123!"
        };

        // Act
        var result = await _service.RegisterMemberWithInviteCodeAsync(request);

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("member with this email already exists"));
    }

    [Test]
    public async Task RegisterMemberWithInviteCodeAsync_WithUserCreationFailure_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "FAIL1234",
            Name = "Registration Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        var request = new RegisterWithInviteCodeRequest
        {
            InviteCode = "FAIL1234",
            FullName = "New Member",
            Email = "newmember@test.com",
            Password = "Password123!"
        };

        _mockAuthService.Setup(x => x.RegisterAsync(It.IsAny<RegisterRequest>(), false))
            .ReturnsAsync((false, "User creation failed"));

        // Act
        var result = await _service.RegisterMemberWithInviteCodeAsync(request);

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Is.EqualTo("User creation failed"));
    }

    #endregion

    #region ToggleInviteCodeStatusAsync Tests

    [Test]
    public async Task ToggleInviteCodeStatusAsync_WithValidCode_ShouldToggleStatus()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "TOGGLE12",
            Name = "Toggle Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ToggleInviteCodeStatusAsync(inviteCode.Id, club.Id, user.Id);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Does.Contain("deactivated"));

        var updatedCode = await _context.MemberInviteCodes.FindAsync(inviteCode.Id);
        Assert.That(updatedCode.IsActive, Is.False);
    }

    [Test]
    public async Task ToggleInviteCodeStatusAsync_WithNonAdmin_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();
        var nonAdminUser = new User
        {
            FullName = "Regular User",
            Email = "user@test.com",
            PasswordHash = "hash"
        };
        _context.Users.Add(nonAdminUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ToggleInviteCodeStatusAsync(1, club.Id, nonAdminUser.Id);

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("must be an admin"));
    }

    #endregion

    #region DeleteInviteCodeAsync Tests

    [Test]
    public async Task DeleteInviteCodeAsync_WithValidCode_ShouldDeleteCode()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        var inviteCode = new MemberInviteCode
        {
            ClubId = club.Id,
            Code = "DELETE12",
            Name = "Delete Code",
            MembershipTypeId = membershipType.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            MaxUses = 100,
            CurrentUses = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = user.Id
        };

        _context.MemberInviteCodes.Add(inviteCode);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DeleteInviteCodeAsync(inviteCode.Id, club.Id, user.Id);

        // Assert
        Assert.That(result.Success, Is.True);
        Assert.That(result.Message, Does.Contain("deleted successfully"));

        var deletedCode = await _context.MemberInviteCodes.FindAsync(inviteCode.Id);
        Assert.That(deletedCode, Is.Null);
    }

    [Test]
    public async Task DeleteInviteCodeAsync_WithNonExistentCode_ShouldReturnError()
    {
        // Arrange
        var (user, club, membershipType) = await CreateTestClubWithAdmin();

        // Act
        var result = await _service.DeleteInviteCodeAsync(999, club.Id, user.Id);

        // Assert
        Assert.That(result.Success, Is.False);
        Assert.That(result.Message, Does.Contain("not found"));
    }

    #endregion
}