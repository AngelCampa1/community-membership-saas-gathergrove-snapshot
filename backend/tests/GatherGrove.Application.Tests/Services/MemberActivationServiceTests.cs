using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace GatherGrove.Application.Tests.Services
{
    [TestFixture]
    public class MemberActivationServiceTests
    {
        private GatherGroveDbContext _context;
        private Mock<IEmailService> _mockEmailService;
        private Mock<ILogger<MemberActivationService>> _mockLogger;
        private MemberActivationService _memberActivationService;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new GatherGroveDbContext(options);
            _mockEmailService = new Mock<IEmailService>();
            _mockLogger = new Mock<ILogger<MemberActivationService>>();
            _memberActivationService = new MemberActivationService(_context, _mockEmailService.Object, _mockLogger.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task ActivateMemberAccountAsync_ValidTokenAndPassword_ActivatesAccountAndSetsPassword()
        {
            // Arrange
            var activationToken = "valid-token-123";
            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "", // No password set yet
                IsActive = false,
                ActivationToken = activationToken,
                ActivationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new ActivateMemberAccountRequest
            {
                ActivationToken = activationToken,
                NewPassword = "NewPassword123!"
            };

            // Act
            var result = await _memberActivationService.ActivateMemberAccountAsync(request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("Account activated successfully."));

            var updatedUser = await _context.Users.FindAsync(user.Id);
            Assert.That(updatedUser!.IsActive, Is.True);
            Assert.That(updatedUser.ActivationToken, Is.Null);
            Assert.That(updatedUser.ActivationTokenExpiresAt, Is.Null);
            Assert.That(updatedUser.PasswordHash, Is.Not.EqualTo(""));
            Assert.That(BCrypt.Net.BCrypt.Verify("NewPassword123!", updatedUser.PasswordHash), Is.True);
        }

        [Test]
        public async Task ActivateMemberAccountAsync_InvalidToken_ReturnsFailureResponse()
        {
            // Arrange
            var request = new ActivateMemberAccountRequest
            {
                ActivationToken = "invalid-token",
                NewPassword = "Password123!"
            };

            // Act
            var result = await _memberActivationService.ActivateMemberAccountAsync(request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("Invalid activation link. Please request a new activation email."));
        }

        [Test]
        public async Task ActivateMemberAccountAsync_ExpiredToken_ReturnsFailureResponse()
        {
            // Arrange
            var activationToken = "expired-token-123";
            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "",
                IsActive = false,
                ActivationToken = activationToken,
                ActivationTokenExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new ActivateMemberAccountRequest
            {
                ActivationToken = activationToken,
                NewPassword = "Password123!"
            };

            // Act
            var result = await _memberActivationService.ActivateMemberAccountAsync(request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("Activation link has expired. Please request a new activation email."));

            var unchangedUser = await _context.Users.FindAsync(user.Id);
            Assert.That(unchangedUser!.IsActive, Is.False);
        }

        [Test]
        public async Task ActivateMemberAccountAsync_AlreadyActiveUser_ReturnsFailureResponse()
        {
            // Arrange
            var activationToken = "valid-token-123";
            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "existing-hash",
                IsActive = true, // Already active
                ActivationToken = activationToken,
                ActivationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new ActivateMemberAccountRequest
            {
                ActivationToken = activationToken,
                NewPassword = "Password123!"
            };

            // Act
            var result = await _memberActivationService.ActivateMemberAccountAsync(request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("Account is already activated. You can log in with your existing password."));
        }

        [Test]
        public async Task ActivateMemberAccountAsync_WeakPassword_ActivatesWithWeakPassword()
        {
            // Note: The actual implementation doesn't validate password strength,
            // so this test verifies that even weak passwords are accepted
            // Arrange
            var activationToken = "valid-token-123";
            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "",
                IsActive = false,
                ActivationToken = activationToken,
                ActivationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new ActivateMemberAccountRequest
            {
                ActivationToken = activationToken,
                NewPassword = "weak" // Weak password but still accepted
            };

            // Act
            var result = await _memberActivationService.ActivateMemberAccountAsync(request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("Account activated successfully."));
        }

        [Test]
        public async Task CreateDormantMemberAccountAsync_ValidMember_CreatesDormantUserAccount()
        {
            // Arrange
            var club = new Club
            {
                Name = "Test Club",
                Tier = "Sprout",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Clubs.Add(club);
            await _context.SaveChangesAsync();

            var member = new Member
            {
                ClubId = club.Id,
                FullName = "John Doe",
                Email = "john.doe@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MembershipTypeId = 1
            };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            // Act
            var result = await _memberActivationService.CreateDormantMemberAccountAsync(member.Id, club.Id);

            // Assert
            Assert.That(result, Is.True);

            // Verify user account was created
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == member.Email);
            Assert.That(user, Is.Not.Null);
            Assert.That(user!.FullName, Is.EqualTo(member.FullName));
            Assert.That(user.Email, Is.EqualTo(member.Email));
            Assert.That(user.IsActive, Is.False);
            Assert.That(user.ActivationToken, Is.Not.Null);
            Assert.That(user.ActivationTokenExpiresAt, Is.GreaterThan(DateTime.UtcNow));
            Assert.That(user.OnboardingCompleted, Is.False);

            // Verify no email was sent (dormant account)
            _mockEmailService.Verify(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task CreateDormantMemberAccountAsync_MemberNotFound_ReturnsFalse()
        {
            // Arrange
            var club = new Club
            {
                Name = "Test Club",
                Tier = "Sprout",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Clubs.Add(club);
            await _context.SaveChangesAsync();

            // Act
            var result = await _memberActivationService.CreateDormantMemberAccountAsync(999, club.Id);

            // Assert
            Assert.That(result, Is.False);

            // Verify no user account was created
            var users = await _context.Users.ToListAsync();
            Assert.That(users, Is.Empty);
        }

        [Test]
        public async Task CreateDormantMemberAccountAsync_ExistingUserAccount_ReturnsFalse()
        {
            // Arrange
            var club = new Club
            {
                Name = "Test Club",
                Tier = "Sprout",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Clubs.Add(club);

            var existingUser = new User
            {
                FullName = "Existing User",
                Email = "john.doe@example.com",
                PasswordHash = "existing-hash",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(existingUser);

            var member = new Member
            {
                ClubId = club.Id,
                FullName = "John Doe",
                Email = "john.doe@example.com", // Same email as existing user
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MembershipTypeId = 1
            };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            // Act
            var result = await _memberActivationService.CreateDormantMemberAccountAsync(member.Id, club.Id);

            // Assert
            Assert.That(result, Is.False);

            // Verify existing user account was not modified
            var userCount = await _context.Users.CountAsync();
            Assert.That(userCount, Is.EqualTo(1));

            var user = await _context.Users.FirstAsync();
            Assert.That(user.FullName, Is.EqualTo("Existing User"));
            Assert.That(user.IsActive, Is.True);
        }

        [Test]
        public async Task CreateMemberAccountAndSendActivationEmailAsync_SproutTier_SkipsAccountCreation()
        {
            // Arrange
            var club = new Club
            {
                Name = "Test Club",
                Tier = "Sprout", // Sprout tier should skip account creation
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Clubs.Add(club);

            var member = new Member
            {
                ClubId = club.Id,
                FullName = "John Doe",
                Email = "john.doe@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MembershipTypeId = 1
            };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            // Act
            var result = await _memberActivationService.CreateMemberAccountAndSendActivationEmailAsync(member.Id, club.Id);

            // Assert
            Assert.That(result, Is.True); // Returns true as expected behavior

            // Verify no user account was created for Sprout tier
            var users = await _context.Users.ToListAsync();
            Assert.That(users, Is.Empty);

            // Verify no email was sent
            _mockEmailService.Verify(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task CreateMemberAccountAndSendActivationEmailAsync_GrowTier_CreatesAccountAndSendsEmail()
        {
            // Arrange
            var club = new Club
            {
                Name = "Test Club",
                Tier = "Grow", // Grow tier should create account and send email
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Clubs.Add(club);

            var member = new Member
            {
                ClubId = club.Id,
                FullName = "John Doe",
                Email = "john.doe@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MembershipTypeId = 1
            };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            _mockEmailService.Setup(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _memberActivationService.CreateMemberAccountAndSendActivationEmailAsync(member.Id, club.Id);

            // Assert
            Assert.That(result, Is.True);

            // Verify user account was created
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == member.Email);
            Assert.That(user, Is.Not.Null);
            Assert.That(user!.FullName, Is.EqualTo(member.FullName));
            Assert.That(user.Email, Is.EqualTo(member.Email));
            Assert.That(user.IsActive, Is.False);
            Assert.That(user.ActivationToken, Is.Not.Null);

            // Verify activation email was sent
            _mockEmailService.Verify(x => x.SendMemberActivationEmailAsync(
                member.Email,
                member.FullName,
                club.Name,
                It.IsAny<string>()), Times.Once);
        }

        #region GenerateActivationToken Tests

        [Test]
        public void GenerateActivationToken_GeneratesUrlSafeToken()
        {
            // Act
            var (token, expiresAt) = _memberActivationService.GenerateActivationToken();

            // Assert
            Assert.That(token, Is.Not.Null);
            Assert.That(token.Length, Is.GreaterThan(0));

            // Verify token is URL-safe (no +, /, or = characters)
            Assert.That(token, Does.Not.Contain("+"));
            Assert.That(token, Does.Not.Contain("/"));
            Assert.That(token, Does.Not.Contain("="));

            // Verify token contains only valid characters (alphanumeric, -, _)
            Assert.That(token, Does.Match("^[A-Za-z0-9_-]+$"));
        }

        [Test]
        public void GenerateActivationToken_SetsExpiry72HoursInFuture()
        {
            // Act
            var beforeGeneration = DateTime.UtcNow;
            var (token, expiresAt) = _memberActivationService.GenerateActivationToken();
            var afterGeneration = DateTime.UtcNow;

            // Assert
            Assert.That(expiresAt, Is.GreaterThan(beforeGeneration.AddHours(71).AddMinutes(59)));
            Assert.That(expiresAt, Is.LessThan(afterGeneration.AddHours(72).AddMinutes(1)));
        }

        #endregion

        #region ResendActivationEmail Tests

        [Test]
        public async Task ResendActivationEmailAsync_ValidInactiveUser_SendsEmailAndReturnsSuccess()
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

            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "temp-hash",
                IsActive = false,
                ActivationToken = "old-token",
                ActivationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);

            var member = new Member
            {
                ClubId = club.Id,
                FullName = "John Doe",
                Email = "john@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MembershipTypeId = 1
            };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            _mockEmailService.Setup(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _memberActivationService.ResendActivationEmailAsync("john@example.com");

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("A new activation link has been sent to your email address."));

            // Verify new token was generated
            var updatedUser = await _context.Users.FindAsync(user.Id);
            Assert.That(updatedUser!.ActivationToken, Is.Not.EqualTo("old-token"));
            Assert.That(updatedUser.ActivationToken, Is.Not.Null);
            Assert.That(updatedUser.ActivationTokenExpiresAt, Is.GreaterThan(DateTime.UtcNow.AddHours(71)));

            // Verify email was sent
            _mockEmailService.Verify(x => x.SendMemberActivationEmailAsync(
                "john@example.com",
                "John Doe",
                "Test Club",
                It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task ResendActivationEmailAsync_UserNotFound_ReturnsGenericSuccessMessage()
        {
            // Arrange
            var nonExistentEmail = "nonexistent@example.com";

            // Act
            var result = await _memberActivationService.ResendActivationEmailAsync(nonExistentEmail);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("If an account exists with this email, an activation link has been sent."));

            // Verify no email was sent
            _mockEmailService.Verify(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task ResendActivationEmailAsync_AlreadyActiveUser_ReturnsFailureMessage()
        {
            // Arrange
            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "hash",
                IsActive = true, // Already active
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _memberActivationService.ResendActivationEmailAsync("john@example.com");

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("This account is already activated. Please log in with your password."));

            // Verify no email was sent
            _mockEmailService.Verify(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task ResendActivationEmailAsync_MemberNotFound_ReturnsGenericSuccessMessage()
        {
            // Arrange
            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "temp-hash",
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            // Note: No corresponding Member record

            // Act
            var result = await _memberActivationService.ResendActivationEmailAsync("john@example.com");

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
            Assert.That(result.Message, Is.EqualTo("If an account exists with this email, an activation link has been sent."));

            // Verify no email was sent
            _mockEmailService.Verify(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task ResendActivationEmailAsync_SproutTierClub_ReturnsFailureMessage()
        {
            // Arrange
            var club = new Club
            {
                Name = "Test Club",
                Tier = "Sprout", // Sprout tier doesn't support portal access
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Clubs.Add(club);

            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "temp-hash",
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);

            var member = new Member
            {
                ClubId = club.Id,
                FullName = "John Doe",
                Email = "john@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MembershipTypeId = 1
            };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            // Act
            var result = await _memberActivationService.ResendActivationEmailAsync("john@example.com");

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("Your club tier does not support member portal access."));

            // Verify no email was sent
            _mockEmailService.Verify(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task ResendActivationEmailAsync_EmailServiceThrowsException_ReturnsFailureMessage()
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

            var user = new User
            {
                FullName = "John Doe",
                Email = "john@example.com",
                PasswordHash = "temp-hash",
                IsActive = false,
                ActivationToken = "old-token",
                ActivationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);

            var member = new Member
            {
                ClubId = club.Id,
                FullName = "John Doe",
                Email = "john@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MembershipTypeId = 1
            };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            _mockEmailService.Setup(x => x.SendMemberActivationEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .ThrowsAsync(new Exception("Email service unavailable"));

            // Act
            var result = await _memberActivationService.ResendActivationEmailAsync("john@example.com");

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("An error occurred while sending the activation email. Please try again."));
        }

        #endregion
    }
}