using NUnit.Framework;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs.Communications;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace GatherGrove.Application.Tests.Services
{
    [TestFixture]
    public class CommunicationsServiceTests
    {
        private GatherGroveDbContext _context;
        private CommunicationsService _communicationsService;
        private Mock<IEmailService> _mockEmailService;
        private Mock<ILogger<CommunicationsService>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new GatherGroveDbContext(options);
            _mockEmailService = new Mock<IEmailService>();
            _mockLogger = new Mock<ILogger<CommunicationsService>>();

            _communicationsService = new CommunicationsService(
                _context,
                _mockEmailService.Object,
                _mockLogger.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        private async Task<Club> CreateTestClub(string tier = "Sprout")
        {
            var club = new Club
            {
                Name = "Test Club",
                Tier = tier,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = 1
            };

            _context.Clubs.Add(club);
            await _context.SaveChangesAsync();
            return club;
        }

        private async Task<List<Member>> CreateTestMembers(int clubId, int count = 3)
        {
            var members = new List<Member>();
            for (int i = 1; i <= count; i++)
            {
                var member = new Member
                {
                    FullName = $"Member {i}",
                    Email = $"member{i}@test.com",
                    ClubId = clubId,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    MembershipTypeId = 1
                };
                members.Add(member);
            }

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();
            return members;
        }

        private async Task CreateEmailUsage(int clubId, DateTime usageMonth, int emailsSent)
        {
            var usage = new ClubEmailUsage
            {
                ClubId = clubId,
                UsageMonth = usageMonth,
                AdminEmailsSentCount = emailsSent,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ClubEmailUsage.Add(usage);
            await _context.SaveChangesAsync();
        }

        private async Task<User> CreateTestUser(int userId = 1, string fullName = "Test User", string email = "testuser@test.com")
        {
            var user = new User
            {
                Id = userId,
                FullName = fullName,
                Email = email,
                PasswordHash = "hashedpassword",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        [Test]
        public async Task SendBulkEmailAsync_SproutTier_WithinLimit_SendsSuccessfully()
        {
            // Arrange
            var club = await CreateTestClub("Sprout");
            var members = await CreateTestMembers(club.Id, 3);
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.RecipientCount, Is.EqualTo(3));

            // Verify email service was called for each member
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                "Test Club",
                "Test Subject",
                "Test message"), Times.Exactly(3));

            // Verify communication was logged
            var log = await _context.CommunicationsLogs
                .FirstAsync(l => l.ClubId == club.Id);
            Assert.That(log.CommunicationType, Is.EqualTo("Email"));
            Assert.That(log.RecipientCount, Is.EqualTo(3));
            Assert.That(log.Subject, Is.EqualTo("Test Subject"));
            Assert.That(log.SentByUserId, Is.EqualTo(1));
        }

        [Test]
        public async Task SendBulkEmailAsync_GrowTier_WithinLimit_SendsSuccessfully()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            var members = await CreateTestMembers(club.Id, 5);
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.RecipientCount, Is.EqualTo(5));

            // Verify email service was called for each member
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                "Test Club",
                "Test Subject",
                "Test message"), Times.Exactly(5));
        }

        [Test]
        public async Task SendBulkEmailAsync_SproutTier_ExceedsLimit_ReturnsFailure()
        {
            // Arrange - Updated: "Sprout" renamed to "Seed" with limit 1000
            var club = await CreateTestClub("Seed");
            var members = await CreateTestMembers(club.Id, 3);

            // Create existing usage that would exceed limit (1000 is the Seed limit)
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            await CreateEmailUsage(club.Id, currentMonth, 998);

            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Contains.Substring("exceed your monthly allowance"));
            Assert.That(result.Message, Contains.Substring("1000"));

            // Verify email service was NOT called
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task SendBulkEmailAsync_OnlyActiveMembers_FiltersCorrectly()
        {
            // Arrange
            var club = await CreateTestClub("Sprout");

            // Create mix of active and inactive members
            var activeMembers = await CreateTestMembers(club.Id, 2);
            var inactiveMember = new Member
            {
                FullName = "Inactive Member",
                Email = "inactive@test.com",
                ClubId = club.Id,
                Status = "Inactive",
                CreatedAt = DateTime.UtcNow,
                MembershipTypeId = 1
            };

            _context.Members.Add(inactiveMember);
            await _context.SaveChangesAsync();

            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.RecipientCount, Is.EqualTo(2)); // Only active members

            // Verify email service was called only twice (not for inactive member)
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Exactly(2));
        }

        [Test]
        public async Task SendBulkEmailAsync_ClubNotFound_ReturnsFailure()
        {
            // Arrange
            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(999, 1, request);

            // Assert
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("Club not found"));
        }

        [Test]
        public async Task SendBulkEmailAsync_NoActiveMembers_ReturnsFailure()
        {
            // Arrange
            var club = await CreateTestClub("Sprout");
            // Don't create any members

            var request = new SendBulkEmailRequest
            {
                Subject = "Test Subject",
                Body = "Test message"
            };

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Is.EqualTo("No active members found to send email to"));
        }

        [Test]
        public async Task GetEmailUsageStatsAsync_SproutTier_ReturnsCorrectStats()
        {
            // Arrange - Updated: "Sprout" renamed to "Seed" with limit 1000
            var club = await CreateTestClub("Seed");
            var members = await CreateTestMembers(club.Id, 5);
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            await CreateEmailUsage(club.Id, currentMonth, 75);

            // Act
            var result = await _communicationsService.GetEmailUsageStatsAsync(club.Id);

            // Assert
            Assert.That(result.ClubTier, Is.EqualTo("Seed"));
            Assert.That(result.EmailsSentThisMonth, Is.EqualTo(75));
            Assert.That(result.MonthlyEmailLimit, Is.EqualTo(1000));
            Assert.That(result.ActiveMemberCount, Is.EqualTo(5));
            Assert.That(result.RemainingEmails, Is.EqualTo(925));
        }

        [Test]
        public async Task GetEmailUsageStatsAsync_GrowTier_ReturnsCorrectStats()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            var members = await CreateTestMembers(club.Id, 10);
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            await CreateEmailUsage(club.Id, currentMonth, 1500);

            // Act
            var result = await _communicationsService.GetEmailUsageStatsAsync(club.Id);

            // Assert
            Assert.That(result.ClubTier, Is.EqualTo("Grow"));
            Assert.That(result.EmailsSentThisMonth, Is.EqualTo(1500));
            Assert.That(result.MonthlyEmailLimit, Is.EqualTo(3000));
            Assert.That(result.ActiveMemberCount, Is.EqualTo(10));
            Assert.That(result.RemainingEmails, Is.EqualTo(1500));
        }

        [Test]
        public async Task GetEmailUsageStatsAsync_NoUsageRecord_ReturnsZeroUsage()
        {
            // Arrange - Updated: "Sprout" renamed to "Seed" with limit 1000
            var club = await CreateTestClub("Seed");
            var members = await CreateTestMembers(club.Id, 3);

            // Act
            var result = await _communicationsService.GetEmailUsageStatsAsync(club.Id);

            // Assert
            Assert.That(result.EmailsSentThisMonth, Is.EqualTo(0));
            Assert.That(result.MonthlyEmailLimit, Is.EqualTo(1000));
            Assert.That(result.ActiveMemberCount, Is.EqualTo(3));
            Assert.That(result.RemainingEmails, Is.EqualTo(1000));
        }

        [Test]
        public async Task GetEmailUsageStatsAsync_ClubNotFound_ThrowsException()
        {
            // Act & Assert
            var exception = Assert.ThrowsAsync<InvalidOperationException>(
                () => _communicationsService.GetEmailUsageStatsAsync(999));

            Assert.That(exception.Message, Contains.Substring("Club not found"));
        }

        [Test]
        public async Task WouldExceedEmailLimitAsync_SproutTier_WithinLimit_ReturnsFalse()
        {
            // Arrange
            var club = await CreateTestClub("Sprout");
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            await CreateEmailUsage(club.Id, currentMonth, 100);

            // Act
            var result = await _communicationsService.WouldExceedEmailLimitAsync(club.Id, 300);

            // Assert
            Assert.That(result, Is.False); // 100 + 300 = 400, which is < 500 limit
        }

        [Test]
        public async Task WouldExceedEmailLimitAsync_SproutTier_ExceedsLimit_ReturnsTrue()
        {
            // Arrange - Updated: "Sprout" renamed to "Seed" with limit 1000
            var club = await CreateTestClub("Seed");
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            await CreateEmailUsage(club.Id, currentMonth, 950);

            // Act
            var result = await _communicationsService.WouldExceedEmailLimitAsync(club.Id, 100);

            // Assert
            Assert.That(result, Is.True); // 950 + 100 = 1050, which is >= 1000 limit
        }

        [Test]
        public async Task WouldExceedEmailLimitAsync_GrowTier_ExceedsLimit_ReturnsTrue()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            await CreateEmailUsage(club.Id, currentMonth, 5000);

            // Act
            var result = await _communicationsService.WouldExceedEmailLimitAsync(club.Id, 5000);

            // Assert
            Assert.That(result, Is.True);
        }

        [Test]
        public async Task WouldExceedEmailLimitAsync_GrowTierExactlyAtLimit_ReturnsFalse()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            await CreateEmailUsage(club.Id, currentMonth, 2999);

            // Act
            var result = await _communicationsService.WouldExceedEmailLimitAsync(club.Id, 1);

            // Assert
            Assert.That(result, Is.False);
        }

        [Test]
        public async Task WouldExceedEmailLimitAsync_ExpandTierExactlyAtLimit_ReturnsFalse()
        {
            // Arrange
            var club = await CreateTestClub("Expand");
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            await CreateEmailUsage(club.Id, currentMonth, 49999);

            // Act
            var result = await _communicationsService.WouldExceedEmailLimitAsync(club.Id, 1);

            // Assert
            Assert.That(result, Is.False);
        }

        #region Email System - Additional Edge Cases (7 tests)

        [Test]
        public async Task SendBulkEmailAsync_WithMemberTypeFilter_OnlyTargetsSpecifiedTypes()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            // Create members with different membership types
            var regularMembers = new List<Member>
            {
                new Member { ClubId = club.Id, Email = "regular1@test.com", FullName = "Regular One", Status = "Active", MembershipTypeId = 1 },
                new Member { ClubId = club.Id, Email = "regular2@test.com", FullName = "Regular Two", Status = "Active", MembershipTypeId = 1 }
            };

            var vipMembers = new List<Member>
            {
                new Member { ClubId = club.Id, Email = "vip1@test.com", FullName = "VIP One", Status = "Active", MembershipTypeId = 2 },
                new Member { ClubId = club.Id, Email = "vip2@test.com", FullName = "VIP Two", Status = "Active", MembershipTypeId = 2 }
            };

            _context.Members.AddRange(regularMembers);
            _context.Members.AddRange(vipMembers);
            await _context.SaveChangesAsync();

            var request = new SendBulkEmailRequest
            {
                Subject = "VIP Only Message",
                Body = "This is for VIP members only",
                MemberTypeIds = new List<int> { 2 } // Only VIP members
            };

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.RecipientCount, Is.EqualTo(2)); // Only 2 VIP members

            // Verify email sent only to VIP members
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                "vip1@test.com",
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Once);

            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                "vip2@test.com",
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Once);

            // Verify regular members did NOT receive email
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                "regular1@test.com",
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task SendBulkEmailAsync_PartialFailure_ReturnsPartialSentStatus()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            var members = new List<Member>
            {
                new Member { ClubId = club.Id, Email = "user1@test.com", FullName = "User One", Status = "Active" },
                new Member { ClubId = club.Id, Email = "user2@test.com", FullName = "User Two", Status = "Active" },
                new Member { ClubId = club.Id, Email = "user3@test.com", FullName = "User Three", Status = "Active" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new SendBulkEmailRequest
            {
                Subject = "Test",
                Body = "Test body"
            };

            // Setup mock to fail on second email
            var callCount = 0;
            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(() =>
                {
                    callCount++;
                    if (callCount == 2)
                    {
                        throw new Exception("Email service temporarily unavailable");
                    }
                    return Task.CompletedTask;
                });

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.True); // Still considered success as some sent
            Assert.That(result.RecipientCount, Is.EqualTo(2)); // Only 2 succeeded

            // Verify communication log shows partial status
            var log = await _context.CommunicationsLogs.FirstAsync();
            Assert.That(log.Status, Is.EqualTo("Partially Sent"));
        }

        [Test]
        public async Task SendBulkEmailAsync_AllFailures_ReturnsFailedStatus()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            var members = new List<Member>
            {
                new Member { ClubId = club.Id, Email = "user1@test.com", FullName = "User One", Status = "Active" },
                new Member { ClubId = club.Id, Email = "user2@test.com", FullName = "User Two", Status = "Active" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new SendBulkEmailRequest
            {
                Subject = "Test",
                Body = "Test body"
            };

            // Setup mock to always fail
            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .ThrowsAsync(new Exception("Email service down"));

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.False);
            Assert.That(result.RecipientCount, Is.EqualTo(0));
            Assert.That(result.Message, Contains.Substring("failed"));

            // Verify communication log shows failed status
            var log = await _context.CommunicationsLogs.FirstAsync();
            Assert.That(log.Status, Is.EqualTo("Failed"));
        }

        [Test]
        public async Task SendBulkEmailAsync_EmptyMemberTypeIds_SendsToAllMembers()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            var members = new List<Member>
            {
                new Member { ClubId = club.Id, Email = "type1@test.com", FullName = "Type 1 Member", Status = "Active", MembershipTypeId = 1 },
                new Member { ClubId = club.Id, Email = "type2@test.com", FullName = "Type 2 Member", Status = "Active", MembershipTypeId = 2 },
                new Member { ClubId = club.Id, Email = "type3@test.com", FullName = "Type 3 Member", Status = "Active", MembershipTypeId = 3 }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new SendBulkEmailRequest
            {
                Subject = "All Members Message",
                Body = "This goes to everyone",
                MemberTypeIds = new List<int>() // Empty list = all members
            };

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(result.RecipientCount, Is.EqualTo(3)); // All 3 members
        }

        [Test]
        public async Task GetEmailUsageStatsAsync_SproutTierNearLimit_CalculatesRemainingCorrectly()
        {
            // Arrange - Updated: "Sprout" renamed to "Seed" with limit 1000
            var club = await CreateTestClub("Seed");
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

            // Create 990 sent emails this month (limit is 1000)
            await CreateEmailUsage(club.Id, currentMonth, 990);

            // Create 10 active members
            for (int i = 1; i <= 10; i++)
            {
                _context.Members.Add(new Member
                {
                    ClubId = club.Id,
                    Email = $"member{i}@test.com",
                    FullName = $"Member {i}",
                    Status = "Active"
                });
            }
            await _context.SaveChangesAsync();

            // Act
            var result = await _communicationsService.GetEmailUsageStatsAsync(club.Id);

            // Assert
            Assert.That(result.EmailsSentThisMonth, Is.EqualTo(990));
            Assert.That(result.MonthlyEmailLimit, Is.EqualTo(1000));
            Assert.That(result.RemainingEmails, Is.EqualTo(10));
            Assert.That(result.WouldExceedLimit, Is.False); // 10 members = 10 emails, which hits the limit exactly
        }

        [Test]
        public async Task GetEmailUsageStatsAsync_SproutTierOverLimit_WouldExceedIsTrue()
        {
            // Arrange - Updated: "Sprout" renamed to "Seed" with limit 1000
            var club = await CreateTestClub("Seed");
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

            // Already at limit
            await CreateEmailUsage(club.Id, currentMonth, 1000);

            // 5 active members
            for (int i = 1; i <= 5; i++)
            {
                _context.Members.Add(new Member
                {
                    ClubId = club.Id,
                    Email = $"member{i}@test.com",
                    FullName = $"Member {i}",
                    Status = "Active"
                });
            }
            await _context.SaveChangesAsync();

            // Act
            var result = await _communicationsService.GetEmailUsageStatsAsync(club.Id);

            // Assert
            Assert.That(result.EmailsSentThisMonth, Is.EqualTo(1000));
            Assert.That(result.RemainingEmails, Is.EqualTo(0));
            Assert.That(result.WouldExceedLimit, Is.True);
        }

        [Test]
        public async Task SendBulkEmailAsync_ConcurrentSending_LimitedToFiveSimultaneous()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            // Create 20 members to test concurrency limits
            for (int i = 1; i <= 20; i++)
            {
                _context.Members.Add(new Member
                {
                    ClubId = club.Id,
                    Email = $"member{i}@test.com",
                    FullName = $"Member {i}",
                    Status = "Active"
                });
            }
            await _context.SaveChangesAsync();

            var request = new SendBulkEmailRequest
            {
                Subject = "Concurrent Test",
                Body = "Testing concurrent sending"
            };

            var concurrentCalls = 0;
            var maxConcurrent = 0;
            var lockObj = new object();

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(async () =>
                {
                    lock (lockObj)
                    {
                        concurrentCalls++;
                        if (concurrentCalls > maxConcurrent)
                        {
                            maxConcurrent = concurrentCalls;
                        }
                    }

                    await Task.Delay(50); // Simulate email sending

                    lock (lockObj)
                    {
                        concurrentCalls--;
                    }
                });

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert
            Assert.That(result.Success, Is.True);
            Assert.That(maxConcurrent, Is.LessThanOrEqualTo(5)); // Should never exceed 5 concurrent sends
        }

        #endregion

        #region Communication History Tests (5 tests)

        [Test]
        public async Task GetCommunicationHistoryAsync_WithPagination_CalculatesCorrectly()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            await CreateTestUser(userId: 1); // Required for Include(c => c.SentByUser)

            // Create 25 communication logs
            for (int i = 1; i <= 25; i++)
            {
                _context.CommunicationsLogs.Add(new CommunicationsLog
                {
                    ClubId = club.Id,
                    CommunicationType = "Email",
                    Status = "Sent",
                    Subject = $"Email {i}",
                    SentAt = DateTime.UtcNow.AddDays(-i),
                    RecipientCount = 1,
                    SentByUserId = 1
                });
            }
            await _context.SaveChangesAsync();

            var request = new GetCommunicationHistoryRequest
            {
                Page = 2,
                PageSize = 10
            };

            // Act
            var result = await _communicationsService.GetCommunicationHistoryAsync(club.Id, request);

            // Assert
            Assert.That(result.Communications.Count, Is.EqualTo(10)); // Page 2: items 11-20
            Assert.That(result.TotalPages, Is.EqualTo(3)); // 25 / 10 = 3 pages
            Assert.That(result.CurrentPage, Is.EqualTo(2));
            Assert.That(result.TotalCount, Is.EqualTo(25));
            Assert.That(result.HasNextPage, Is.True); // Page 3 exists
            Assert.That(result.HasPreviousPage, Is.True); // Page 1 exists
        }

        [Test]
        public async Task GetCommunicationHistoryAsync_WithTypeFilter_ReturnsOnlyMatchingType()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            await CreateTestUser(userId: 1); // Required for Include(c => c.SentByUser)

            // Create different types of communications
            _context.CommunicationsLogs.AddRange(
                new CommunicationsLog { ClubId = club.Id, CommunicationType = "Email", Status = "Sent", SentAt = DateTime.UtcNow, RecipientCount = 1, SentByUserId = 1 },
                new CommunicationsLog { ClubId = club.Id, CommunicationType = "Email", Status = "Sent", SentAt = DateTime.UtcNow, RecipientCount = 1, SentByUserId = 1 },
                new CommunicationsLog { ClubId = club.Id, CommunicationType = "SMS", Status = "Sent", SentAt = DateTime.UtcNow, RecipientCount = 1, SentByUserId = 1 },
                new CommunicationsLog { ClubId = club.Id, CommunicationType = "WhatsApp", Status = "Sent", SentAt = DateTime.UtcNow, RecipientCount = 1, SentByUserId = 1 }
            );
            await _context.SaveChangesAsync();

            var request = new GetCommunicationHistoryRequest
            {
                CommunicationType = "Email"
            };

            // Act
            var result = await _communicationsService.GetCommunicationHistoryAsync(club.Id, request);

            // Assert
            Assert.That(result.Communications.Count, Is.EqualTo(2)); // Only 2 emails
            Assert.That(result.Communications.All(c => c.CommunicationType == "Email"), Is.True);
        }

        [Test]
        public async Task GetCommunicationHistoryAsync_WithDateRange_ReturnsOnlyInRange()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            await CreateTestUser(userId: 1); // Required for Include(c => c.SentByUser)

            var oldLog = new CommunicationsLog
            {
                ClubId = club.Id,
                CommunicationType = "Email",
                Status = "Sent",
                SentAt = DateTime.UtcNow.AddDays(-30), // 30 days ago
                RecipientCount = 1,
                SentByUserId = 1
            };

            var recentLog = new CommunicationsLog
            {
                ClubId = club.Id,
                CommunicationType = "Email",
                Status = "Sent",
                SentAt = DateTime.UtcNow.AddDays(-5), // 5 days ago
                RecipientCount = 1,
                SentByUserId = 1
            };

            _context.CommunicationsLogs.AddRange(oldLog, recentLog);
            await _context.SaveChangesAsync();

            var request = new GetCommunicationHistoryRequest
            {
                StartDate = DateTime.UtcNow.AddDays(-10), // Filter: last 10 days
                EndDate = DateTime.UtcNow
            };

            // Act
            var result = await _communicationsService.GetCommunicationHistoryAsync(club.Id, request);

            // Assert
            Assert.That(result.Communications.Count, Is.EqualTo(1)); // Only recent log
            Assert.That(result.Communications[0].SentAt, Is.GreaterThan(DateTime.UtcNow.AddDays(-10)));
        }

        [Test]
        public async Task GetCommunicationHistoryAsync_EmptyResults_ReturnsEmptyList()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            var request = new GetCommunicationHistoryRequest();

            // Act
            var result = await _communicationsService.GetCommunicationHistoryAsync(club.Id, request);

            // Assert
            Assert.That(result.Communications, Is.Empty);
            Assert.That(result.TotalCount, Is.EqualTo(0));
            Assert.That(result.TotalPages, Is.EqualTo(0));
            Assert.That(result.HasNextPage, Is.False);
            Assert.That(result.HasPreviousPage, Is.False);
        }

        [Test]
        public async Task GetCommunicationHistoryAsync_LastPage_HasNoNextPage()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            await CreateTestUser(userId: 1); // Required for Include(c => c.SentByUser)

            // Create 15 communication logs
            for (int i = 1; i <= 15; i++)
            {
                _context.CommunicationsLogs.Add(new CommunicationsLog
                {
                    ClubId = club.Id,
                    CommunicationType = "Email",
                    Status = "Sent",
                    SentAt = DateTime.UtcNow,
                    RecipientCount = 1,
                    SentByUserId = 1
                });
            }
            await _context.SaveChangesAsync();

            var request = new GetCommunicationHistoryRequest
            {
                Page = 2,
                PageSize = 10
            };

            // Act
            var result = await _communicationsService.GetCommunicationHistoryAsync(club.Id, request);

            // Assert
            Assert.That(result.Communications.Count, Is.EqualTo(5)); // Page 2: items 11-15
            Assert.That(result.TotalPages, Is.EqualTo(2));
            Assert.That(result.HasNextPage, Is.False); // No page 3
            Assert.That(result.HasPreviousPage, Is.True); // Page 1 exists
        }

        #endregion

        #region Engagement Alert Tests (5 tests)

        [Test]
        public async Task SendEngagementAlertAsync_AllAdmins_ReceiveEmail()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            var admin1 = new User { Email = "admin1@test.com", FullName = "Admin One", IsActive = true, CreatedAt = DateTime.UtcNow, PasswordHash = "hash" };
            var admin2 = new User { Email = "admin2@test.com", FullName = "Admin Two", IsActive = true, CreatedAt = DateTime.UtcNow, PasswordHash = "hash" };

            _context.Users.AddRange(admin1, admin2);
            await _context.SaveChangesAsync();

            // Create ClubAdmin relationships (only UserId and ClubId exist)
            _context.ClubAdmins.AddRange(
                new ClubAdmin { ClubId = club.Id, UserId = admin1.Id },
                new ClubAdmin { ClubId = club.Id, UserId = admin2.Id }
            );
            await _context.SaveChangesAsync();

            var engagementData = new List<GatherGrove.Application.DTOs.MemberEngagementResponse>
            {
                new GatherGrove.Application.DTOs.MemberEngagementResponse
                {
                    MemberId = 1,
                    FullName = "At Risk Member",
                    OverallScore = 20.0M,
                    IsAtRisk = true,
                    DaysSinceLastLogin = 60
                }
            };

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _communicationsService.SendEngagementAlertAsync(club.Id, engagementData);

            // Assert
            Assert.That(result, Is.True);

            // Verify email sent to both admins
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                "admin1@test.com",
                "Admin One",
                club.Name,
                "Member Engagement Alert - Action Required",
                It.Is<string>(body => body.Contains("At Risk Member") && body.Contains("60 days since last login"))),
                Times.Once);

            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                "admin2@test.com",
                "Admin Two",
                club.Name,
                "Member Engagement Alert - Action Required",
                It.Is<string>(body => body.Contains("At Risk Member"))),
                Times.Once);
        }

        [Test]
        public async Task SendEngagementAlertAsync_MultipleAtRiskMembers_IncludesAllInEmail()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            var admin = new User { Email = "admin@test.com", FullName = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow, PasswordHash = "hash" };
            _context.Users.Add(admin);
            await _context.SaveChangesAsync();

            _context.ClubAdmins.Add(new ClubAdmin { ClubId = club.Id, UserId = admin.Id });
            await _context.SaveChangesAsync();

            var engagementData = new List<GatherGrove.Application.DTOs.MemberEngagementResponse>
            {
                new GatherGrove.Application.DTOs.MemberEngagementResponse
                {
                    MemberId = 1,
                    FullName = "Member One",
                    OverallScore = 15.0M,
                    IsAtRisk = true,
                    DaysSinceLastLogin = 90
                },
                new GatherGrove.Application.DTOs.MemberEngagementResponse
                {
                    MemberId = 2,
                    FullName = "Member Two",
                    OverallScore = 25.0M,
                    IsAtRisk = true,
                    DaysSinceLastLogin = 45
                }
            };

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _communicationsService.SendEngagementAlertAsync(club.Id, engagementData);

            // Assert
            Assert.That(result, Is.True);

            // Verify email contains both members
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                "admin@test.com",
                "Admin",
                club.Name,
                "Member Engagement Alert - Action Required",
                It.Is<string>(body => body.Contains("Member One") && body.Contains("Member Two"))),
                Times.Once);
        }

        [Test]
        public async Task SendEngagementAlertAsync_NoAdmins_ReturnsFalse()
        {
            // Arrange
            var club = await CreateTestClub("Grow");
            // No admins created

            var engagementData = new List<GatherGrove.Application.DTOs.MemberEngagementResponse>
            {
                new GatherGrove.Application.DTOs.MemberEngagementResponse
                {
                    MemberId = 1,
                    FullName = "At Risk Member",
                    OverallScore = 20.0M,
                    IsAtRisk = true
                }
            };

            // Act
            var result = await _communicationsService.SendEngagementAlertAsync(club.Id, engagementData);

            // Assert
            Assert.That(result, Is.False);

            // Verify email was NOT sent
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task SendEngagementAlertAsync_EmptyEngagementData_ReturnsFalse()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            var admin = new User { Email = "admin@test.com", FullName = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow, PasswordHash = "hash" };
            _context.Users.Add(admin);
            await _context.SaveChangesAsync();

            _context.ClubAdmins.Add(new ClubAdmin { ClubId = club.Id, UserId = admin.Id });
            await _context.SaveChangesAsync();

            var engagementData = new List<GatherGrove.Application.DTOs.MemberEngagementResponse>(); // Empty

            // Act
            var result = await _communicationsService.SendEngagementAlertAsync(club.Id, engagementData);

            // Assert
            Assert.That(result, Is.False);

            // Verify email was NOT sent
            _mockEmailService.Verify(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task SendEngagementAlertAsync_EmailServiceFailure_ReturnsFalse()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            var admin = new User { Email = "admin@test.com", FullName = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow, PasswordHash = "hash" };
            _context.Users.Add(admin);
            await _context.SaveChangesAsync();

            _context.ClubAdmins.Add(new ClubAdmin { ClubId = club.Id, UserId = admin.Id });
            await _context.SaveChangesAsync();

            var engagementData = new List<GatherGrove.Application.DTOs.MemberEngagementResponse>
            {
                new GatherGrove.Application.DTOs.MemberEngagementResponse
                {
                    MemberId = 1,
                    FullName = "At Risk Member",
                    OverallScore = 20.0M,
                    IsAtRisk = true
                }
            };

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .ThrowsAsync(new Exception("Email service down"));

            // Act
            var result = await _communicationsService.SendEngagementAlertAsync(club.Id, engagementData);

            // Assert
            Assert.That(result, Is.False);
        }

        #endregion

        #region Push Notification Tests (5 tests)

        [Test]
        public async Task SendBulkPushNotificationAsync_WithMemberTypeFilter_OnlyTargetsSpecifiedTypes()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            // Regular members (MembershipTypeId = 4)
            var regularMembers = new List<Member>
            {
                new Member { ClubId = club.Id, FullName = "Regular One", Email = "regular1@test.com", Status = "Active", MembershipTypeId = 4 },
                new Member { ClubId = club.Id, FullName = "Regular Two", Email = "regular2@test.com", Status = "Active", MembershipTypeId = 4 }
            };

            // Premium members (MembershipTypeId = 5)
            var premiumMembers = new List<Member>
            {
                new Member { ClubId = club.Id, FullName = "Premium One", Email = "premium1@test.com", Status = "Active", MembershipTypeId = 5 },
                new Member { ClubId = club.Id, FullName = "Premium Two", Email = "premium2@test.com", Status = "Active", MembershipTypeId = 5 },
                new Member { ClubId = club.Id, FullName = "Premium Three", Email = "premium3@test.com", Status = "Active", MembershipTypeId = 5 }
            };

            _context.Members.AddRange(regularMembers);
            _context.Members.AddRange(premiumMembers);
            await _context.SaveChangesAsync();

            var request = new SendPushNotificationRequest
            {
                Title = "Premium Notification",
                Body = "For premium members only",
                MemberTypeIds = new List<int> { 5 } // Only premium members
            };

            // Act
            var result = await _communicationsService.SendBulkPushNotificationAsync(club.Id, 1, request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
            Assert.That(result.UserCount, Is.EqualTo(3)); // Only 3 premium members
            Assert.That(result.DeviceCount, Is.EqualTo(3)); // Simplified implementation uses same count
        }

        [Test]
        public async Task SendBulkPushNotificationAsync_SproutTier_ReturnsFailure()
        {
            // Arrange
            var club = await CreateTestClub("Sprout");

            var members = new List<Member>
            {
                new Member { ClubId = club.Id, FullName = "Member One", Email = "member1@test.com", Status = "Active" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new SendPushNotificationRequest
            {
                Title = "Test Notification",
                Body = "Test message"
            };

            // Act
            var result = await _communicationsService.SendBulkPushNotificationAsync(club.Id, 1, request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Contains.Substring("Grow tier"));
        }

        [Test]
        public async Task SendBulkPushNotificationAsync_SuccessfulSend_LogsCorrectly()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            var members = new List<Member>
            {
                new Member { ClubId = club.Id, FullName = "Member One", Email = "member1@test.com", Status = "Active" },
                new Member { ClubId = club.Id, FullName = "Member Two", Email = "member2@test.com", Status = "Active" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new SendPushNotificationRequest
            {
                Title = "Test Notification",
                Body = "Test message"
            };

            // Act
            var result = await _communicationsService.SendBulkPushNotificationAsync(club.Id, 1, request);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.Success, Is.True);
            Assert.That(result.UserCount, Is.EqualTo(2));

            // Verify communication log created
            var log = await _context.CommunicationsLogs.FirstAsync();
            Assert.That(log.CommunicationType, Is.EqualTo("Push"));
            Assert.That(log.Subject, Is.EqualTo("Test Notification"));
            Assert.That(log.Body, Is.EqualTo("Test message"));
            Assert.That(log.Status, Is.EqualTo("Sent"));
            Assert.That(log.RecipientCount, Is.EqualTo(2));
        }

        [Test]
        public async Task GetPushNotificationUsageStatsAsync_GrowTier_ReturnsCorrectStats()
        {
            // Arrange
            var club = await CreateTestClub("Grow");

            // Create active members
            var members = new List<Member>
            {
                new Member { ClubId = club.Id, FullName = "Member One", Email = "member1@test.com", Status = "Active" },
                new Member { ClubId = club.Id, FullName = "Member Two", Email = "member2@test.com", Status = "Active" },
                new Member { ClubId = club.Id, FullName = "Inactive Member", Email = "inactive@test.com", Status = "Inactive" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            // Act
            var result = await _communicationsService.GetPushNotificationUsageStatsAsync(club.Id);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.ClubTier, Is.EqualTo("Grow"));
            Assert.That(result.TotalActiveMembers, Is.EqualTo(2));
            Assert.That(result.IsGrowTier, Is.True);
            Assert.That(result.CurrentMonth, Is.Not.Null);
        }

        [Test]
        public async Task GetPushNotificationUsageStatsAsync_SproutTier_IsNotGrowTier()
        {
            // Arrange
            var club = await CreateTestClub("Sprout");

            var members = new List<Member>
            {
                new Member { ClubId = club.Id, FullName = "Member One", Email = "member1@test.com", Status = "Active" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            // Act
            var result = await _communicationsService.GetPushNotificationUsageStatsAsync(club.Id);

            // Assert
            Assert.That(result, Is.Not.Null);
            Assert.That(result.ClubTier, Is.EqualTo("Sprout"));
            Assert.That(result.TotalActiveMembers, Is.EqualTo(1));
            Assert.That(result.IsGrowTier, Is.False);
        }

        #endregion

        #region Fix 5: Seed tier email limits (1,000/month, not "Sprout" at 500)

        [Test]
        public async Task SendBulkEmailAsync_SeedTierUnder1000Limit_Succeeds()
        {
            // Arrange - Seed tier club with members well within the 1,000/month limit
            var club = await CreateTestClub("Seed");
            var members = await CreateTestMembers(club.Id, 5);

            _mockEmailService.Setup(x => x.SendBulkEmailAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            var request = new SendBulkEmailRequest
            {
                Subject = "Seed Test",
                Body = "Hello from Seed tier"
            };

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert - should succeed because 5 << 1000
            Assert.That(result.Success, Is.True);
            Assert.That(result.RecipientCount, Is.EqualTo(5));
        }

        [Test]
        public async Task GetEmailUsageStatsAsync_SeedTier_ReturnsLimit1000()
        {
            // Arrange
            var club = await CreateTestClub("Seed");

            // Act
            var result = await _communicationsService.GetEmailUsageStatsAsync(club.Id);

            // Assert - Seed tier must have a limit of 1000, not 500 ("Sprout" limit)
            Assert.That(result.ClubTier, Is.EqualTo("Seed"));
            Assert.That(result.MonthlyEmailLimit, Is.EqualTo(1000),
                "Seed tier must have 1,000 email limit per month (not 500 from old 'Sprout' config)");
        }

        [Test]
        public async Task WouldExceedEmailLimitAsync_SeedTierAt999_ReturnsFalse()
        {
            // Arrange - Seed club that has already sent 999 emails this month
            var club = await CreateTestClub("Seed");

            // Manually insert email usage record of 999
            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            _context.ClubEmailUsage.Add(new GatherGrove.Domain.Entities.ClubEmailUsage
            {
                ClubId = club.Id,
                UsageMonth = currentMonth,
                AdminEmailsSentCount = 999,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Act - trying to send 1 more email (999 + 1 = 1000, exactly at limit)
            var result = await _communicationsService.WouldExceedEmailLimitAsync(club.Id, 1);

            // Assert - 999 + 1 = 1000, which equals the limit but does not exceed it
            Assert.That(result, Is.False, "At exactly 1,000, the send is still allowed");
        }

        [Test]
        public async Task WouldExceedEmailLimitAsync_SeedTierAt500_ReturnsFalse()
        {
            // Arrange - Seed club that has sent 500 emails (old "Sprout" limit)
            var club = await CreateTestClub("Seed");

            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            _context.ClubEmailUsage.Add(new GatherGrove.Domain.Entities.ClubEmailUsage
            {
                ClubId = club.Id,
                UsageMonth = currentMonth,
                AdminEmailsSentCount = 500,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Act - trying to send 1 more email (500 + 1 = 501, under 1000 limit)
            var result = await _communicationsService.WouldExceedEmailLimitAsync(club.Id, 1);

            // Assert - with the fix (limit=1000), 501 is under the limit → false
            // Before the fix (limit=500, tier="Sprout"), this would also be false because
            // the Seed tier didn't match "Sprout" check → the check returned false regardless.
            // After fix: Seed tier IS checked and limit is 1000 → 501 < 1000 → false
            Assert.That(result, Is.False,
                "Seed tier at 500 emails should NOT exceed the 1,000 monthly limit");
        }

        [Test]
        public async Task SendBulkEmailAsync_SeedTierAt999_BlocksWhenTryingToSendMoreThan1Remaining()
        {
            // Arrange - Seed tier club at 999 emails, 10 members = would exceed 1000
            var club = await CreateTestClub("Seed");
            await CreateTestMembers(club.Id, 10);

            var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            _context.ClubEmailUsage.Add(new GatherGrove.Domain.Entities.ClubEmailUsage
            {
                ClubId = club.Id,
                UsageMonth = currentMonth,
                AdminEmailsSentCount = 999,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var request = new SendBulkEmailRequest
            {
                Subject = "Over Limit",
                Body = "Should be blocked"
            };

            // Act
            var result = await _communicationsService.SendBulkEmailAsync(club.Id, 1, request);

            // Assert - 999 + 10 recipients >= 1000 → should be blocked
            Assert.That(result.Success, Is.False);
            Assert.That(result.Message, Does.Contain("1000").Or.Contain("monthly allowance").Or.Contain("limit"),
                "Error message should reference the 1,000 Seed tier email limit");
        }

        #endregion
    }
}
