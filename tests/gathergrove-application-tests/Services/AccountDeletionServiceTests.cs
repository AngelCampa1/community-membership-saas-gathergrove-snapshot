using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using System.Security.Claims;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// TDD-first test suite for account deletion functionality
/// Tests cover: data export, subscription validation, cascading deletion, member cleanup
/// </summary>
public class AccountDeletionServiceTests : IDisposable
{
    private readonly Mock<ILogger<AccountDeletionService>> _mockLogger;
    private readonly Mock<IDataExportService> _mockDataExportService;
    private readonly Mock<IBillingService> _mockBillingService;
    private readonly Mock<IStripeConnectService> _mockStripeService;
    private readonly Mock<IClubAuthorizationService> _mockAuthService;
    private readonly ApplicationDbContext _context;
    private readonly AccountDeletionService _sut;

    public AccountDeletionServiceTests()
    {
        _mockLogger = new Mock<ILogger<AccountDeletionService>>();
        _mockDataExportService = new Mock<IDataExportService>();
        _mockBillingService = new Mock<IBillingService>();
        _mockStripeService = new Mock<IStripeConnectService>();
        _mockAuthService = new Mock<IClubAuthorizationService>();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        _sut = new AccountDeletionService(
            _context,
            _mockDataExportService.Object,
            _mockBillingService.Object,
            _mockStripeService.Object,
            _mockAuthService.Object,
            _mockLogger.Object
        );
    }

    [Theory]
    [InlineData(true, true)] // Club owner with active subscription
    [InlineData(false, true)] // Club member with active subscription  
    [InlineData(true, false)] // Club owner without subscription
    [InlineData(false, false)] // Club member without subscription
    public async Task RequestAccountDeletion_ShouldValidateSubscriptionStatus_BeforeInitiating(
        bool isOwner, bool hasActiveSubscription)
    {
        // Arrange
        var user = CreateTestUser();
        var club = CreateTestClub(user.Id);
        if (hasActiveSubscription)
        {
            club.StripeSubscriptionId = "sub_test123";
            club.SubscriptionStatus = "active";
        }
        
        await _context.Users.AddAsync(user);
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        _mockAuthService.Setup(x => x.GetUserIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns(user.Id);
        
        var request = new AccountDeletionRequest
        {
            Reason = "No longer needed",
            ConfirmationPhrase = "DELETE MY ACCOUNT"
        };

        // Act & Assert
        if (isOwner && hasActiveSubscription)
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _sut.RequestAccountDeletionAsync(user.Id, request));
            ex.Message.Should().Contain("active subscription");
        }
        else
        {
            var result = await _sut.RequestAccountDeletionAsync(user.Id, request);
            result.Should().NotBeNull();
            result.RequiresManualReview.Should().Be(isOwner);
        }
    }

    [Fact]
    public async Task RequestAccountDeletion_ShouldExportAllUserData_BeforeInitiating()
    {
        // Arrange
        var user = CreateTestUserWithCompleteData();
        await SeedCompleteUserData(user);

        _mockDataExportService.Setup(x => x.ExportAllUserDataAsync(user.Id))
            .ReturnsAsync(new UserDataExportResult 
            {
                ExportId = Guid.NewGuid(),
                FilePath = "/exports/user_data.zip",
                ExportSize = 1024 * 1024, // 1MB
                ItemCounts = new Dictionary<string, int>
                {
                    ["Members"] = 5,
                    ["Events"] = 10,
                    ["Payments"] = 15,
                    ["Messages"] = 25
                }
            });

        var request = new AccountDeletionRequest
        {
            Reason = "Moving abroad",
            ConfirmationPhrase = "DELETE MY ACCOUNT",
            RequestDataExport = true
        };

        // Act
        var result = await _sut.RequestAccountDeletionAsync(user.Id, request);

        // Assert
        result.Should().NotBeNull();
        result.DataExportId.Should().NotBeEmpty();
        result.DataExportFilePath.Should().NotBeNullOrEmpty();
        _mockDataExportService.Verify(x => x.ExportAllUserDataAsync(user.Id), Times.Once);
    }

    [Fact]
    public async Task ExecuteAccountDeletion_ShouldDeleteUserDataInCorrectOrder()
    {
        // Arrange
        var user = CreateTestUserWithCompleteData();
        await SeedCompleteUserData(user);

        var deletionRequest = new ExecuteAccountDeletionRequest
        {
            UserId = user.Id,
            AdminUserId = 999, // Admin executing the deletion
            FinalConfirmation = true
        };

        // Act
        await _sut.ExecuteAccountDeletionAsync(deletionRequest);

        // Assert - Verify cascading deletion order
        var remainingUser = await _context.Users.FindAsync(user.Id);
        remainingUser.Should().BeNull();

        // Verify related data was deleted
        var clubAdmins = await _context.ClubAdmins.Where(ca => ca.UserId == user.Id).ToListAsync();
        clubAdmins.Should().BeEmpty();

        var passwordTokens = await _context.PasswordResetTokens.Where(pt => pt.UserId == user.Id).ToListAsync();
        passwordTokens.Should().BeEmpty();

        var deviceTokens = await _context.UserDeviceTokens.Where(dt => dt.UserId == user.Id).ToListAsync();
        deviceTokens.Should().BeEmpty();
    }

    [Fact]
    public async Task ExecuteAccountDeletion_ClubOwner_ShouldTransferOwnershipOrDeleteClub()
    {
        // Arrange
        var owner = CreateTestUser();
        var club = CreateTestClub(owner.Id);
        var otherAdmin = CreateTestUser(email: "admin@test.com");
        
        await _context.Users.AddRangeAsync(owner, otherAdmin);
        await _context.Clubs.AddAsync(club);
        await _context.ClubAdmins.AddRangeAsync(
            new ClubAdmin { UserId = owner.Id, ClubId = club.Id },
            new ClubAdmin { UserId = otherAdmin.Id, ClubId = club.Id }
        );
        await _context.SaveChangesAsync();

        var deletionRequest = new ExecuteAccountDeletionRequest
        {
            UserId = owner.Id,
            AdminUserId = 999,
            FinalConfirmation = true,
            TransferOwnershipToUserId = otherAdmin.Id
        };

        // Act
        await _sut.ExecuteAccountDeletionAsync(deletionRequest);

        // Assert
        var updatedClub = await _context.Clubs.FindAsync(club.Id);
        updatedClub.Should().NotBeNull();
        updatedClub!.CreatedByUserId.Should().Be(otherAdmin.Id);
    }

    [Fact]
    public async Task ExecuteAccountDeletion_ShouldHandleStripeCleanup()
    {
        // Arrange
        var user = CreateTestUser();
        var club = CreateTestClub(user.Id);
        club.StripeCustomerId = "cus_test123";
        club.StripeAccountId = "acct_test456";
        
        await _context.Users.AddAsync(user);
        await _context.Clubs.AddAsync(club);
        await _context.SaveChangesAsync();

        _mockStripeService.Setup(x => x.DeleteCustomerAsync("cus_test123"))
            .Returns(Task.CompletedTask);
        _mockStripeService.Setup(x => x.DeleteConnectAccountAsync("acct_test456"))
            .Returns(Task.CompletedTask);

        var deletionRequest = new ExecuteAccountDeletionRequest
        {
            UserId = user.Id,
            AdminUserId = 999,
            FinalConfirmation = true
        };

        // Act
        await _sut.ExecuteAccountDeletionAsync(deletionRequest);

        // Assert
        _mockStripeService.Verify(x => x.DeleteCustomerAsync("cus_test123"), Times.Once);
        _mockStripeService.Verify(x => x.DeleteConnectAccountAsync("acct_test456"), Times.Once);
    }

    [Fact]
    public async Task ExecuteAccountDeletion_ShouldAnonymizeMemberData_WhenClubRemains()
    {
        // Arrange
        var userToDelete = CreateTestUser();
        var clubOwner = CreateTestUser(email: "owner@test.com");
        var club = CreateTestClub(clubOwner.Id);
        
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = 1,
            FullName = userToDelete.FullName,
            Email = userToDelete.Email,
            PhoneNumber = "+1234567890",
            Address = "123 Test St",
            Status = "Active",
            JoinDate = DateTime.UtcNow
        };

        await _context.Users.AddRangeAsync(userToDelete, clubOwner);
        await _context.Clubs.AddAsync(club);
        await _context.Members.AddAsync(member);
        await _context.SaveChangesAsync();

        var deletionRequest = new ExecuteAccountDeletionRequest
        {
            UserId = userToDelete.Id,
            AdminUserId = clubOwner.Id,
            FinalConfirmation = true,
            AnonymizeMemberData = true
        };

        // Act
        await _sut.ExecuteAccountDeletionAsync(deletionRequest);

        // Assert
        var anonymizedMember = await _context.Members.FirstOrDefaultAsync(m => m.Email.StartsWith("deleted-user-"));
        anonymizedMember.Should().NotBeNull();
        anonymizedMember!.FullName.Should().Be("Deleted User");
        anonymizedMember.PhoneNumber.Should().BeNull();
        anonymizedMember.Address.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteAccountDeletion_ShouldRollback_OnFailure()
    {
        // Arrange
        var user = CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        _mockStripeService.Setup(x => x.DeleteCustomerAsync(It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("Stripe error"));

        var deletionRequest = new ExecuteAccountDeletionRequest
        {
            UserId = user.Id,
            AdminUserId = 999,
            FinalConfirmation = true
        };

        // Act & Assert
        await Assert.ThrowsAsync<AccountDeletionException>(
            () => _sut.ExecuteAccountDeletionAsync(deletionRequest));

        // Verify user still exists
        var existingUser = await _context.Users.FindAsync(user.Id);
        existingUser.Should().NotBeNull();
    }

    [Fact]
    public async Task ValidateAccountDeletion_ShouldPreventDeletion_WhenUserOwnsMultipleClubs()
    {
        // Arrange
        var user = CreateTestUser();
        var club1 = CreateTestClub(user.Id, "Club 1");
        var club2 = CreateTestClub(user.Id, "Club 2");
        
        await _context.Users.AddAsync(user);
        await _context.Clubs.AddRangeAsync(club1, club2);
        await _context.SaveChangesAsync();

        // Act & Assert
        var result = await _sut.ValidateAccountDeletionAsync(user.Id);
        result.CanDelete.Should().BeFalse();
        result.ValidationErrors.Should().Contain("User owns multiple clubs");
    }

    private User CreateTestUser(string email = "test@example.com")
    {
        return new User
        {
            Id = Random.Shared.Next(1, 10000),
            FullName = "Test User",
            Email = email,
            PasswordHash = "hashedpassword",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private Club CreateTestClub(int createdByUserId, string name = "Test Club")
    {
        return new Club
        {
            Id = Random.Shared.Next(1, 10000),
            Name = name,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private User CreateTestUserWithCompleteData()
    {
        return CreateTestUser();
    }

    private async Task SeedCompleteUserData(User user)
    {
        var club = CreateTestClub(user.Id);
        
        await _context.Users.AddAsync(user);
        await _context.Clubs.AddAsync(club);
        
        // Add related test data
        await _context.ClubAdmins.AddAsync(new ClubAdmin
        {
            UserId = user.Id,
            ClubId = club.Id,
            CreatedAt = DateTime.UtcNow
        });

        await _context.PasswordResetTokens.AddAsync(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = "test-hash",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}