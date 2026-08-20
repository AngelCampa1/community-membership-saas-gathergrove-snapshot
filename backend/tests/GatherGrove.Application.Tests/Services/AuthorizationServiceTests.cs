using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using FluentAssertions;
using System.Security.Claims;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Comprehensive tests for AuthorizationService.
/// This is a CRITICAL security service that controls access to all resources.
///
/// Test categories:
/// - CanAccessResourceAsync: resource-specific access control
/// - HasPermissionAsync: permission-based access control
/// - CanExportDataAsync: data export permissions
/// - GetUserClaimsAsync: claims generation
/// - GetUserExportQuotaAsync: quota management
/// </summary>
[TestFixture]
public class AuthorizationServiceTests
{
    private GatherGroveDbContext _context;
    private Mock<ILogger<AuthorizationService>> _mockLogger;
    private AuthorizationService _service;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<AuthorizationService>>();
        _service = new AuthorizationService(_context, _mockLogger.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    #region CanAccessResourceAsync Tests

    [Test]
    public async Task CanAccessResourceAsync_NonExistentUser_ReturnsFalse()
    {
        var result = await _service.CanAccessResourceAsync(999, "club", 1);
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessResourceAsync_InactiveUser_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser(isActive: false);

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "club", 1);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessResourceAsync_UnknownResourceType_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "unknown", 1);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessResourceAsync_ClubAdmin_CanAccessClub()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "club", club.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessResourceAsync_ClubMember_CanAccessClub()
    {
        // Arrange
        var user = await CreateUser(email: "member@test.com");
        var club = await CreateClub();
        await CreateMember(club.Id, "member@test.com", status: "Active");

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "club", club.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessResourceAsync_InactiveMember_CannotAccessClub()
    {
        // Arrange
        var user = await CreateUser(email: "inactive@test.com");
        var club = await CreateClub();
        await CreateMember(club.Id, "inactive@test.com", status: "Inactive");

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "club", club.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessResourceAsync_UserNotInClub_CannotAccessClub()
    {
        // Arrange
        var user = await CreateUser(email: "outsider@test.com");
        var club = await CreateClub();

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "club", club.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessResourceAsync_UserCanAccessOwnMemberRecord()
    {
        // Arrange
        var user = await CreateUser(email: "self@test.com");
        var club = await CreateClub();
        var member = await CreateMember(club.Id, "self@test.com");

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "member", member.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessResourceAsync_AdminCanAccessAnyClubMember()
    {
        // Arrange
        var adminUser = await CreateUser(email: "admin@test.com");
        var club = await CreateClub();
        await MakeUserClubAdmin(adminUser.Id, club.Id);
        var member = await CreateMember(club.Id, "other@test.com");

        // Act
        var result = await _service.CanAccessResourceAsync(adminUser.Id, "member", member.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessResourceAsync_NonAdminCannotAccessOtherMember()
    {
        // Arrange
        var user = await CreateUser(email: "user@test.com");
        var club = await CreateClub();
        var otherMember = await CreateMember(club.Id, "other@test.com");

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "member", otherMember.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessResourceAsync_AdminCanAccessClubEvent()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);
        var eventEntity = await CreateEvent(club.Id);

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "event", eventEntity.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessResourceAsync_MemberCanAccessClubEvent()
    {
        // Arrange
        var user = await CreateUser(email: "member@test.com");
        var club = await CreateClub();
        await CreateMember(club.Id, "member@test.com", status: "Active");
        var eventEntity = await CreateEvent(club.Id);

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "event", eventEntity.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanAccessResourceAsync_NonMemberCannotAccessEvent()
    {
        // Arrange
        var user = await CreateUser(email: "outsider@test.com");
        var club = await CreateClub();
        var eventEntity = await CreateEvent(club.Id);

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "event", eventEntity.Id);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessResourceAsync_CaseInsensitiveResourceType()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act & Assert
        (await _service.CanAccessResourceAsync(user.Id, "CLUB", club.Id)).Should().BeTrue();
        (await _service.CanAccessResourceAsync(user.Id, "Club", club.Id)).Should().BeTrue();
        (await _service.CanAccessResourceAsync(user.Id, "club", club.Id)).Should().BeTrue();
    }

    #endregion

    #region HasPermissionAsync Tests

    [Test]
    public async Task HasPermissionAsync_NonExistentUser_ReturnsFalse()
    {
        var result = await _service.HasPermissionAsync(999, "read");
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasPermissionAsync_InactiveUser_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser(isActive: false);

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "read");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasPermissionAsync_ActiveUser_CanRead()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "read");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasPermissionAsync_ActiveUser_CanExportData()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "export_data");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasPermissionAsync_Admin_HasAdminPermission()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "admin");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasPermissionAsync_NonAdmin_NoAdminPermission()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "admin");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasPermissionAsync_Admin_HasFinancialDataPermission()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "financial_data");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasPermissionAsync_NonAdmin_NoFinancialDataPermission()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "financial_data");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasPermissionAsync_UnknownPermission_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "unknown_permission");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task HasPermissionAsync_CaseInsensitive()
    {
        // Arrange
        var user = await CreateUser();

        // Act & Assert
        (await _service.HasPermissionAsync(user.Id, "READ")).Should().BeTrue();
        (await _service.HasPermissionAsync(user.Id, "Read")).Should().BeTrue();
        (await _service.HasPermissionAsync(user.Id, "EXPORT_DATA")).Should().BeTrue();
    }

    #endregion

    #region CanExportDataAsync Tests

    [Test]
    public async Task CanExportDataAsync_UserWithoutClubAccess_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();

        // Act
        var result = await _service.CanExportDataAsync(user.Id, club.Id, "memberdata");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanExportDataAsync_MemberCanExportMemberData()
    {
        // Arrange
        var user = await CreateUser(email: "member@test.com");
        var club = await CreateClub();
        await CreateMember(club.Id, "member@test.com", status: "Active");

        // Act
        var result = await _service.CanExportDataAsync(user.Id, club.Id, "memberdata");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanExportDataAsync_MemberCanExportEventData()
    {
        // Arrange
        var user = await CreateUser(email: "member@test.com");
        var club = await CreateClub();
        await CreateMember(club.Id, "member@test.com", status: "Active");

        // Act
        var result = await _service.CanExportDataAsync(user.Id, club.Id, "eventdata");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanExportDataAsync_MemberCannotExportFinancialData()
    {
        // Arrange
        var user = await CreateUser(email: "member@test.com");
        var club = await CreateClub();
        await CreateMember(club.Id, "member@test.com", status: "Active");

        // Act
        var result = await _service.CanExportDataAsync(user.Id, club.Id, "financialdata");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanExportDataAsync_AdminCanExportFinancialData()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var result = await _service.CanExportDataAsync(user.Id, club.Id, "financialdata");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task CanExportDataAsync_UnknownDataType_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var result = await _service.CanExportDataAsync(user.Id, club.Id, "unknowndata");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanExportDataAsync_CaseInsensitiveDataType()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act & Assert
        (await _service.CanExportDataAsync(user.Id, club.Id, "MEMBERDATA")).Should().BeTrue();
        (await _service.CanExportDataAsync(user.Id, club.Id, "MemberData")).Should().BeTrue();
        (await _service.CanExportDataAsync(user.Id, club.Id, "FINANCIALDATA")).Should().BeTrue();
    }

    #endregion

    #region GetUserClaimsAsync Tests

    [Test]
    public async Task GetUserClaimsAsync_NonExistentUser_ReturnsEmptyClaims()
    {
        // Act
        var principal = await _service.GetUserClaimsAsync(999);

        // Assert
        principal.Identity.Should().NotBeNull();
        principal.Claims.Should().BeEmpty();
    }

    [Test]
    public async Task GetUserClaimsAsync_RegularUser_HasBasicClaims()
    {
        // Arrange
        var user = await CreateUser(email: "user@test.com", fullName: "Test User");

        // Act
        var principal = await _service.GetUserClaimsAsync(user.Id);

        // Assert
        principal.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == user.Id.ToString());
        principal.Claims.Should().Contain(c => c.Type == ClaimTypes.Email && c.Value == "user@test.com");
        principal.Claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == "Test User");
        principal.Claims.Should().Contain(c => c.Type == "account_status" && c.Value == "Active");
    }

    [Test]
    public async Task GetUserClaimsAsync_InactiveUser_HasInactiveStatus()
    {
        // Arrange
        var user = await CreateUser(isActive: false);

        // Act
        var principal = await _service.GetUserClaimsAsync(user.Id);

        // Assert
        principal.Claims.Should().Contain(c => c.Type == "account_status" && c.Value == "Inactive");
    }

    [Test]
    public async Task GetUserClaimsAsync_AdminUser_HasAdminClaims()
    {
        // Arrange
        var user = await CreateUser(email: "admin@test.com");
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var principal = await _service.GetUserClaimsAsync(user.Id);

        // Assert
        principal.Claims.Should().Contain(c => c.Type == "role" && c.Value == "Admin");
        principal.Claims.Should().Contain(c => c.Type == "club_id" && c.Value == club.Id.ToString());
        principal.Claims.Should().Contain(c => c.Type == "permissions" && c.Value == "READ,EXPORT,FINANCIAL_DATA");
    }

    [Test]
    public async Task GetUserClaimsAsync_MemberUser_HasMemberClaims()
    {
        // Arrange
        var user = await CreateUser(email: "member@test.com");
        var club = await CreateClub();
        await CreateMember(club.Id, "member@test.com", status: "Active");

        // Act
        var principal = await _service.GetUserClaimsAsync(user.Id);

        // Assert
        principal.Claims.Should().Contain(c => c.Type == "role" && c.Value == "Member");
        principal.Claims.Should().Contain(c => c.Type == "club_id" && c.Value == club.Id.ToString());
        principal.Claims.Should().Contain(c => c.Type == "permissions" && c.Value == "READ,EXPORT");
        principal.Claims.Should().Contain(c => c.Type == "membership_status" && c.Value == "Active");
    }

    [Test]
    public async Task GetUserClaimsAsync_MultipleClubMemberships_HasAllClaims()
    {
        // Arrange
        var user = await CreateUser(email: "multi@test.com");
        var club1 = await CreateClub("Club 1");
        var club2 = await CreateClub("Club 2");
        await CreateMember(club1.Id, "multi@test.com", status: "Active");
        await CreateMember(club2.Id, "multi@test.com", status: "Active");

        // Act
        var principal = await _service.GetUserClaimsAsync(user.Id);

        // Assert
        var clubIdClaims = principal.Claims.Where(c => c.Type == "club_id").ToList();
        clubIdClaims.Should().HaveCount(2);
        clubIdClaims.Should().Contain(c => c.Value == club1.Id.ToString());
        clubIdClaims.Should().Contain(c => c.Value == club2.Id.ToString());
    }

    [Test]
    public async Task GetUserClaimsAsync_AdminAndMember_OnlyAdminClaimsForSameClub()
    {
        // Arrange - user is admin of club, so shouldn't also have member claims for same club
        var user = await CreateUser(email: "adminmember@test.com");
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);
        await CreateMember(club.Id, "adminmember@test.com", status: "Active");

        // Act
        var principal = await _service.GetUserClaimsAsync(user.Id);

        // Assert - should have Admin role, not both Admin and Member for same club
        var roleClaims = principal.Claims.Where(c => c.Type == "role").ToList();
        roleClaims.Should().Contain(c => c.Value == "Admin");
        // Member role shouldn't be added for the same club where user is admin
    }

    #endregion

    #region GetUserExportQuotaAsync Tests

    [Test]
    public async Task GetUserExportQuotaAsync_AdminUser_Returns1000()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var quota = await _service.GetUserExportQuotaAsync(user.Id);

        // Assert
        quota.Should().Be(1000);
    }

    [Test]
    public async Task GetUserExportQuotaAsync_RegularUser_Returns100()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var quota = await _service.GetUserExportQuotaAsync(user.Id);

        // Assert
        quota.Should().Be(100);
    }

    [Test]
    public async Task GetUserExportQuotaAsync_NonExistentUser_Returns100()
    {
        // Non-existent user still gets regular quota (not admin)
        var quota = await _service.GetUserExportQuotaAsync(999);
        quota.Should().Be(100);
    }

    #endregion

    #region Logging Tests

    [Test]
    public async Task CanAccessResourceAsync_LogsDebugMessage()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();

        // Act
        await _service.CanAccessResourceAsync(user.Id, "club", club.Id);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Checking if user")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region Exception Handling Tests - Critical for 95%+ Coverage

    [Test]
    public async Task CanAccessResourceAsync_DisposedContext_ReturnsFalseAndLogsError()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await _context.DisposeAsync(); // Dispose context to trigger exception

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "club", club.Id);

        // Assert
        result.Should().BeFalse();
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error checking resource access")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task HasPermissionAsync_DisposedContext_ReturnsFalseAndLogsError()
    {
        // Arrange
        var user = await CreateUser();
        await _context.DisposeAsync(); // Dispose context to trigger exception

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "read");

        // Assert
        result.Should().BeFalse();
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error checking permission")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task CanExportDataAsync_DisposedContext_ReturnsFalseAndLogsError()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);
        await _context.DisposeAsync(); // Dispose context to trigger exception

        // Act
        var result = await _service.CanExportDataAsync(user.Id, club.Id, "memberdata");

        // Assert
        result.Should().BeFalse();
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error checking export permissions")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GetUserClaimsAsync_DisposedContext_ReturnsEmptyClaimsPrincipalAndLogsError()
    {
        // Arrange
        var user = await CreateUser();
        await _context.DisposeAsync(); // Dispose context to trigger exception

        // Act
        var result = await _service.GetUserClaimsAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result.Identity.Should().NotBeNull();
        result.Identity!.IsAuthenticated.Should().BeFalse();
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error getting claims")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GetUserExportQuotaAsync_DisposedContext_ReturnsFallbackQuotaAndLogsError()
    {
        // Arrange
        var user = await CreateUser();
        await _context.DisposeAsync(); // Dispose context to trigger exception

        // Act
        var result = await _service.GetUserExportQuotaAsync(user.Id);

        // Assert
        result.Should().Be(10); // Conservative fallback quota
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error getting export quota")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task GetUserExportQuotaAsync_AdminUser_ReturnsHigherQuota()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var result = await _service.GetUserExportQuotaAsync(user.Id);

        // Assert
        result.Should().Be(1000); // Admin quota
    }

    [Test]
    public async Task GetUserExportQuotaAsync_RegularUser_ReturnsStandardQuota()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.GetUserExportQuotaAsync(user.Id);

        // Assert
        result.Should().Be(100); // Regular member quota
    }

    [Test]
    public async Task HasPermissionAsync_ExportDataPermission_ReturnsTrue()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "export_data");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasPermissionAsync_ReadPermission_ReturnsTrue()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "read");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasPermissionAsync_FinancialDataPermission_AdminUser_ReturnsTrue()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "financial_data");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task HasPermissionAsync_FinancialDataPermission_RegularUser_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.HasPermissionAsync(user.Id, "financial_data");

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Helper Methods

    private async Task<User> CreateUser(string email = "test@example.com", bool isActive = true, string? fullName = null)
    {
        var user = new User
        {
            Email = email,
            FullName = fullName ?? "Test User",
            IsActive = isActive,
            PasswordHash = "hashed",
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    private async Task<Club> CreateClub(string name = "Test Club")
    {
        var club = new Club
        {
            Name = name,
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    private async Task MakeUserClubAdmin(int userId, int clubId)
    {
        var clubAdmin = new ClubAdmin
        {
            UserId = userId,
            ClubId = clubId,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(clubAdmin);
        await _context.SaveChangesAsync();
    }

    private async Task<Member> CreateMember(int clubId, string email, string status = "Active")
    {
        var member = new Member
        {
            ClubId = clubId,
            Email = email,
            FirstName = "Test",
            LastName = "Member",
            Status = status,
            CreatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();
        return member;
    }

    private async Task<Event> CreateEvent(int clubId)
    {
        var eventEntity = new Event
        {
            ClubId = clubId,
            Name = "Test Event",
            EventDateTime = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        };
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();
        return eventEntity;
    }

    #endregion

    #region Additional Edge Cases for 95%+ Coverage

    [Test]
    public async Task CanAccessResourceAsync_EventWithAdminAndMemberClubs_CanAccess()
    {
        // Arrange
        var user = await CreateUser(email: "hybrid@test.com");
        var club1 = await CreateClub("Club 1");
        var club2 = await CreateClub("Club 2");

        // User is admin of club1 and member of club2
        await MakeUserClubAdmin(user.Id, club1.Id);
        await CreateMember(club2.Id, "hybrid@test.com", status: "Active");

        // Create events in both clubs
        var event1 = await CreateEvent(club1.Id);
        var event2 = await CreateEvent(club2.Id);

        // Act & Assert
        (await _service.CanAccessResourceAsync(user.Id, "event", event1.Id)).Should().BeTrue();
        (await _service.CanAccessResourceAsync(user.Id, "event", event2.Id)).Should().BeTrue();
    }

    [Test]
    public async Task CanAccessResourceAsync_MixedCaseResourceType_EventWorks()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);
        var eventEntity = await CreateEvent(club.Id);

        // Act & Assert
        (await _service.CanAccessResourceAsync(user.Id, "EVENT", eventEntity.Id)).Should().BeTrue();
        (await _service.CanAccessResourceAsync(user.Id, "Event", eventEntity.Id)).Should().BeTrue();
    }

    [Test]
    public async Task CanAccessResourceAsync_MixedCaseResourceType_MemberWorks()
    {
        // Arrange
        var user = await CreateUser(email: "self@test.com");
        var club = await CreateClub();
        var member = await CreateMember(club.Id, "self@test.com");

        // Act & Assert
        (await _service.CanAccessResourceAsync(user.Id, "MEMBER", member.Id)).Should().BeTrue();
        (await _service.CanAccessResourceAsync(user.Id, "Member", member.Id)).Should().BeTrue();
    }


    [Test]
    public async Task GetUserClaimsAsync_InactiveMember_NotIncludedInClaims()
    {
        // Arrange
        var user = await CreateUser(email: "inactive@test.com");
        var club = await CreateClub();
        await CreateMember(club.Id, "inactive@test.com", status: "Inactive");

        // Act
        var principal = await _service.GetUserClaimsAsync(user.Id);

        // Assert - Inactive members shouldn't have club_id claims
        var clubIdClaims = principal.Claims.Where(c => c.Type == "club_id").ToList();
        clubIdClaims.Should().BeEmpty();
    }

    [Test]
    public async Task GetUserClaimsAsync_AdminOfMultipleClubs_HasAllAdminClaims()
    {
        // Arrange
        var user = await CreateUser(email: "superadmin@test.com");
        var club1 = await CreateClub("Club A");
        var club2 = await CreateClub("Club B");
        var club3 = await CreateClub("Club C");
        await MakeUserClubAdmin(user.Id, club1.Id);
        await MakeUserClubAdmin(user.Id, club2.Id);
        await MakeUserClubAdmin(user.Id, club3.Id);

        // Act
        var principal = await _service.GetUserClaimsAsync(user.Id);

        // Assert
        var roleClaims = principal.Claims.Where(c => c.Type == "role" && c.Value == "Admin").ToList();
        roleClaims.Should().HaveCount(3);

        var clubIdClaims = principal.Claims.Where(c => c.Type == "club_id").Select(c => int.Parse(c.Value)).ToList();
        clubIdClaims.Should().Contain(club1.Id);
        clubIdClaims.Should().Contain(club2.Id);
        clubIdClaims.Should().Contain(club3.Id);
    }

    [Test]
    public async Task HasPermissionAsync_CaseSensitivityCheck_AllPermissions()
    {
        // Arrange
        var adminUser = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(adminUser.Id, club.Id);

        // Act & Assert - Admin permissions
        (await _service.HasPermissionAsync(adminUser.Id, "ADMIN")).Should().BeTrue();
        (await _service.HasPermissionAsync(adminUser.Id, "Admin")).Should().BeTrue();
        (await _service.HasPermissionAsync(adminUser.Id, "FINANCIAL_DATA")).Should().BeTrue();
        (await _service.HasPermissionAsync(adminUser.Id, "Financial_Data")).Should().BeTrue();
    }

    [Test]
    public async Task CanExportDataAsync_AdminOfDifferentClub_CannotExportFinancialData()
    {
        // Arrange
        var user = await CreateUser();
        var club1 = await CreateClub("Club 1");
        var club2 = await CreateClub("Club 2");
        await MakeUserClubAdmin(user.Id, club1.Id);

        // Act - Try to export from club2 where user is not admin
        var result = await _service.CanExportDataAsync(user.Id, club2.Id, "financialdata");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanExportDataAsync_EmptyStringDataType_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        var result = await _service.CanExportDataAsync(user.Id, club.Id, "");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task GetUserExportQuotaAsync_MultiClubAdmin_StillGets1000()
    {
        // Arrange
        var user = await CreateUser();
        var club1 = await CreateClub("Club 1");
        var club2 = await CreateClub("Club 2");
        await MakeUserClubAdmin(user.Id, club1.Id);
        await MakeUserClubAdmin(user.Id, club2.Id);

        // Act
        var quota = await _service.GetUserExportQuotaAsync(user.Id);

        // Assert
        quota.Should().Be(1000);
    }

    [Test]
    public async Task CanExportDataAsync_LogsDebugMessage()
    {
        // Arrange
        var user = await CreateUser();
        var club = await CreateClub();
        await MakeUserClubAdmin(user.Id, club.Id);

        // Act
        await _service.CanExportDataAsync(user.Id, club.Id, "memberdata");

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("can export")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task CanAccessResourceAsync_NonExistentMember_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "member", 999999);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public async Task CanAccessResourceAsync_NonExistentEvent_ReturnsFalse()
    {
        // Arrange
        var user = await CreateUser();

        // Act
        var result = await _service.CanAccessResourceAsync(user.Id, "event", 999999);

        // Assert
        result.Should().BeFalse();
    }

    #endregion
}
