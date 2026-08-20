using System;
using System.Globalization;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class AuthServiceMembershipCardTests
{
    private GatherGroveDbContext _context;
    private Mock<IConfiguration> _mockConfiguration;
    private Mock<ILogger<AuthService>> _mockLogger;
    private Mock<ILoginAttemptService> _mockLoginAttemptService;
    private Mock<IEmailService> _mockEmailService;
    private AuthService _authService;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);

        // Mock configuration
        _mockConfiguration = new Mock<IConfiguration>();
        var mockJwtSection = new Mock<IConfigurationSection>();

        mockJwtSection.Setup(x => x["SecretKey"]).Returns("test-secret-key-for-jwt-token-generation-testing");
        mockJwtSection.Setup(x => x["Issuer"]).Returns("TestIssuer");
        mockJwtSection.Setup(x => x["Audience"]).Returns("TestAudience");
        mockJwtSection.Setup(x => x["ExpiryMinutes"]).Returns("60");

        _mockConfiguration.Setup(x => x.GetSection("JwtSettings")).Returns(mockJwtSection.Object);

        // Mock logger
        _mockLogger = new Mock<ILogger<AuthService>>();

        // Mock login attempt service
        _mockLoginAttemptService = new Mock<ILoginAttemptService>();
        _mockLoginAttemptService.Setup(x => x.IsAccountLockedAsync(It.IsAny<string>())).ReturnsAsync(false);
        _mockLoginAttemptService.Setup(x => x.RecordFailedAttemptAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
        _mockLoginAttemptService.Setup(x => x.RecordSuccessfulLoginAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        // Mock email service
        _mockEmailService = new Mock<IEmailService>();
        _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>())).ReturnsAsync(true);

        _authService = new AuthService(_context, _mockConfiguration.Object, _mockLogger.Object, _mockLoginAttemptService.Object, _mockEmailService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(Club club, MembershipType membershipType, Member member)> CreateTestMemberData()
    {
        // Create club
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Create membership type
        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Individual",
            Description = "Individual membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        // Create member
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddYears(-1),
            DuesPaidUntil = DateTime.UtcNow.AddMonths(6),
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        return (club, membershipType, member);
    }

    [Test]
    public async Task GetMembershipCardAsync_WithValidMember_ReturnsMembershipCard()
    {
        // Arrange
        var (club, membershipType, member) = await CreateTestMemberData();
        const string userEmail = "john.doe@example.com";

        // Act
        var result = await _authService.GetMembershipCardAsync(userEmail);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo("John Doe"));
        Assert.That(result.MembershipTypeName, Is.EqualTo("Individual"));

        // Verify QR code format
        var expectedQrPrefix = $"GATHERGROVE_{member.Id}_{club.Id}_";
        Assert.That(result.QrCodeData, Does.StartWith(expectedQrPrefix));

        // Verify expiry date format (ISO 8601)
        Assert.That(result.MembershipExpiresAt, Does.Match(@"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z"));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithNonExistentMember_ThrowsArgumentException()
    {
        // Arrange
        await CreateTestMemberData(); // Create some data but use different email
        const string userEmail = "nonexistent@example.com";

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _authService.GetMembershipCardAsync(userEmail));

        Assert.That(exception.Message, Does.Contain("No membership found for email: nonexistent@example.com"));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithValidMemberAndMembershipType_ReturnsCorrectData()
    {
        // Arrange
        var (club, membershipType, member) = await CreateTestMemberData();
        const string userEmail = "john.doe@example.com";

        // Act
        var result = await _authService.GetMembershipCardAsync(userEmail);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo("John Doe"));
        Assert.That(result.MembershipTypeName, Is.EqualTo("Individual"));

        // Verify QR code format includes correct IDs
        var expectedQrPrefix = $"GATHERGROVE_{member.Id}_{club.Id}_";
        Assert.That(result.QrCodeData, Does.StartWith(expectedQrPrefix));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithMemberWithoutDuesPaidUntil_ReturnsExpiredDate()
    {
        // Arrange
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Individual",
            Description = "Individual membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Bob Smith",
            Email = "bob.smith@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddYears(-1),
            DuesPaidUntil = null, // No dues paid
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        const string userEmail = "bob.smith@example.com";

        // Act
        var result = await _authService.GetMembershipCardAsync(userEmail);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo("Bob Smith"));
        Assert.That(result.MembershipTypeName, Is.EqualTo("Individual"));

        // Should have expired date (fixed expired date for members with no dues info)
        var expiryDate = DateTime.Parse(result.MembershipExpiresAt, null, DateTimeStyles.RoundtripKind);
        var expectedDate = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        Assert.That(expiryDate.Date, Is.EqualTo(expectedDate.Date));
    }

    [Test]
    public async Task GetMembershipCardAsync_QrCodeFormat_IsCorrect()
    {
        // Arrange
        var (club, membershipType, member) = await CreateTestMemberData();
        const string userEmail = "john.doe@example.com";

        // Act
        var result = await _authService.GetMembershipCardAsync(userEmail);

        // Assert
        var expiryDate = member.DuesPaidUntil!.Value;
        var expectedQrCode = $"GATHERGROVE_{member.Id}_{club.Id}_{expiryDate:yyyyMMdd}";
        Assert.That(result.QrCodeData, Is.EqualTo(expectedQrCode));
    }

    [Test]
    public async Task GetMembershipCardAsync_LogsCorrectInformation()
    {
        // Arrange
        var (club, membershipType, member) = await CreateTestMemberData();
        const string userEmail = "john.doe@example.com";

        // Act
        await _authService.GetMembershipCardAsync(userEmail);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Getting membership card data for user: {userEmail}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains($"Membership card data generated successfully for user: {userEmail}")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #region Extended Edge Case Tests

    [Test]
    public async Task GetMembershipCardAsync_WithExpiredDues_ReturnsCorrectExpiryDate()
    {
        // Arrange
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Gold",
            Description = "Gold membership",
            DuesAmount = 100.00m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        // Create member with expired dues
        var expiredDate = DateTime.UtcNow.AddMonths(-3);
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Expired Member",
            Email = "expired@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddYears(-2),
            DuesPaidUntil = expiredDate,
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetMembershipCardAsync("expired@example.com");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo("Expired Member"));
        Assert.That(result.MembershipTypeName, Is.EqualTo("Gold"));

        // Verify the expired date is still returned
        var expiryDate = DateTime.Parse(result.MembershipExpiresAt, null, DateTimeStyles.RoundtripKind);
        Assert.That(expiryDate.Date, Is.EqualTo(expiredDate.Date));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithFutureDues_ReturnsCorrectExpiryDate()
    {
        // Arrange
        var club = new Club
        {
            Name = "Premium Club",
            Tier = "Enterprise",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Lifetime",
            Description = "Lifetime membership",
            DuesAmount = 1000.00m,
            DuesFrequency = "OneTime",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        // Create member with far future dues
        var futureDate = DateTime.UtcNow.AddYears(10);
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Lifetime Member",
            Email = "lifetime@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            DuesPaidUntil = futureDate,
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetMembershipCardAsync("lifetime@example.com");

        // Assert
        Assert.That(result, Is.Not.Null);
        var expiryDate = DateTime.Parse(result.MembershipExpiresAt, null, DateTimeStyles.RoundtripKind);
        Assert.That(expiryDate.Date, Is.EqualTo(futureDate.Date));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithDifferentMembershipTypes_ReturnsCorrectType()
    {
        // Arrange - Create club with multiple membership types
        var club = new Club
        {
            Name = "Multi-Tier Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var bronzeType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Bronze",
            Description = "Bronze membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var silverType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Silver",
            Description = "Silver membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var platinumType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Platinum",
            Description = "Platinum membership",
            DuesAmount = 200.00m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.AddRange(bronzeType, silverType, platinumType);
        await _context.SaveChangesAsync();

        // Create members with different types
        var bronzeMember = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = bronzeType.Id,
            FullName = "Bronze User",
            Email = "bronze@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            DuesPaidUntil = DateTime.UtcNow.AddMonths(1),
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var platinumMember = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = platinumType.Id,
            FullName = "Platinum User",
            Email = "platinum@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            DuesPaidUntil = DateTime.UtcNow.AddYears(1),
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(bronzeMember, platinumMember);
        await _context.SaveChangesAsync();

        // Act & Assert - Bronze member
        var bronzeResult = await _authService.GetMembershipCardAsync("bronze@example.com");
        Assert.That(bronzeResult.MembershipTypeName, Is.EqualTo("Bronze"));

        // Act & Assert - Platinum member
        var platinumResult = await _authService.GetMembershipCardAsync("platinum@example.com");
        Assert.That(platinumResult.MembershipTypeName, Is.EqualTo("Platinum"));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithDifferentCaseEmail_ThrowsArgumentException()
    {
        // Arrange
        var (club, membershipType, member) = await CreateTestMemberData();

        // Act & Assert - Email lookup is case-sensitive, different case throws exception
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _authService.GetMembershipCardAsync("JOHN.DOE@EXAMPLE.COM"));

        Assert.That(exception.Message, Does.Contain("No membership found for email"));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithEmptyEmail_ThrowsArgumentException()
    {
        // Arrange
        await CreateTestMemberData();

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _authService.GetMembershipCardAsync(""));

        Assert.That(exception.Message, Does.Contain("No membership found"));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithNullEmail_ThrowsArgumentException()
    {
        // Arrange
        await CreateTestMemberData();

        // Act & Assert
        var exception = Assert.ThrowsAsync<ArgumentException>(
            () => _authService.GetMembershipCardAsync(null!));

        Assert.That(exception, Is.Not.Null);
    }

    [Test]
    public async Task GetMembershipCardAsync_QrCodeIncludesClubId()
    {
        // Arrange
        var club = new Club
        {
            Name = "Special Sports Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Standard",
            Description = "Standard membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Club Member",
            Email = "clubmember@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            DuesPaidUntil = DateTime.UtcNow.AddMonths(6),
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetMembershipCardAsync("clubmember@example.com");

        // Assert - QR code contains club ID in format GATHERGROVE_memberId_clubId_expiryDate
        Assert.That(result, Is.Not.Null);
        Assert.That(result.QrCodeData, Does.Contain($"_{club.Id}_"));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithInactiveMember_StillReturnsMembershipCard()
    {
        // Arrange
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Standard",
            Description = "Standard membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Inactive Member",
            Email = "inactive@example.com",
            Status = "Inactive",  // Inactive status
            JoinDate = DateTime.UtcNow.AddYears(-2),
            DuesPaidUntil = DateTime.UtcNow.AddMonths(-6),  // Expired dues
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - The card is still returned for display purposes (inactive members still have cards)
        var result = await _authService.GetMembershipCardAsync("inactive@example.com");

        // Assert - Card is returned with member info regardless of status
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo("Inactive Member"));
        Assert.That(result.MembershipTypeName, Is.EqualTo("Standard"));
        Assert.That(result.QrCodeData, Does.StartWith("GATHERGROVE_"));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithLongTimeMember_ReturnsValidCard()
    {
        // Arrange - Member who joined several years ago
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Standard",
            Description = "Standard membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        var joinDate = new DateTime(2020, 5, 15, 0, 0, 0, DateTimeKind.Utc);
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Veteran Member",
            Email = "veteran@example.com",
            Status = "Active",
            JoinDate = joinDate,
            DuesPaidUntil = DateTime.UtcNow.AddYears(1),
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetMembershipCardAsync("veteran@example.com");

        // Assert - Long-time members get valid cards with current data
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo("Veteran Member"));
        Assert.That(result.MembershipTypeName, Is.EqualTo("Standard"));
        // Expiry date should be in the future
        var expiryDate = DateTime.Parse(result.MembershipExpiresAt, null, DateTimeStyles.RoundtripKind);
        Assert.That(expiryDate, Is.GreaterThan(DateTime.UtcNow));
    }

    [Test]
    public async Task GetMembershipCardAsync_WithSpecialCharactersInName_ReturnsCorrectly()
    {
        // Arrange
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        var membershipType = new MembershipType
        {
            ClubId = club.Id,
            Name = "Standard",
            Description = "Standard membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Annual",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "José María O'Connor-Smith",  // Special characters
            Email = "jose@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            DuesPaidUntil = DateTime.UtcNow.AddYears(1),
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _authService.GetMembershipCardAsync("jose@example.com");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo("José María O'Connor-Smith"));
    }

    [Test]
    public async Task GetMembershipCardAsync_MemberIdIncludedInQrCode()
    {
        // Arrange
        var (club, membershipType, member) = await CreateTestMemberData();

        // Act
        var result = await _authService.GetMembershipCardAsync("john.doe@example.com");

        // Assert - QR code contains member ID in format GATHERGROVE_memberId_clubId_expiryDate
        Assert.That(result.QrCodeData, Does.Contain($"_{member.Id}_"));
        Assert.That(result.QrCodeData, Does.StartWith($"GATHERGROVE_{member.Id}_"));
    }

    #endregion
}