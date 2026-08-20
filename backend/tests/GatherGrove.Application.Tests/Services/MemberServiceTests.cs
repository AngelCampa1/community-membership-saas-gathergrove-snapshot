using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Moq;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class MemberServiceTests : IDisposable
{
    private GatherGroveDbContext _context;
    private MemberService _memberService;
    private Mock<ILogger<MemberService>> _mockLogger;
    private Mock<IMemberActivationService> _mockMemberActivationService;
    private Mock<IConfiguration> _mockConfiguration;
    private Mock<IPaymentService> _mockPaymentService;

    [SetUp]
    public void SetUp()
    {
        // Create in-memory database with unique name for each test
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<MemberService>>();
        _mockMemberActivationService = new Mock<IMemberActivationService>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockPaymentService = new Mock<IPaymentService>();
        _memberService = new MemberService(_context, _mockMemberActivationService.Object, _mockLogger.Object, _mockConfiguration.Object, _mockPaymentService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }

    #region CreateMemberAsync Tests

    [Test]
    public async Task CreateMemberAsync_ValidRequest_ReturnsCreatedMember()
    {
        // Arrange
        var club = await CreateTestClub("Test Club", "Grow");
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            PhoneNumber = "(555) 123-4567",
            Address = "123 Main St, Anytown, ST 12345",
            JoinDate = DateTime.Today,
            HasSmsConsent = true
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo(request.FullName));
        Assert.That(result.Email, Is.EqualTo(request.Email));
        Assert.That(result.PhoneNumber, Is.EqualTo(request.PhoneNumber));
        Assert.That(result.Address, Is.EqualTo(request.Address));
        Assert.That(result.MembershipTypeId, Is.EqualTo(request.MembershipTypeId));
        Assert.That(result.MembershipTypeName, Is.EqualTo(membershipType.Name));
        Assert.That(result.ClubId, Is.EqualTo(club.Id));
        Assert.That(result.Status, Is.EqualTo("Active"));
        Assert.That(result.JoinDate, Is.EqualTo(request.JoinDate));
        Assert.That(result.DuesPaidUntil, Is.Null);
        Assert.That(result.HasSmsConsent, Is.False);
        Assert.That(result.CreatedAt, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));
        Assert.That(result.UpdatedAt, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));

        // Verify it was saved to database
        var saved = await _context.Members.FindAsync(result.Id);
        Assert.That(saved, Is.Not.Null);
        Assert.That(saved.FullName, Is.EqualTo(request.FullName));
        Assert.That(saved.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task CreateMemberAsync_NoJoinDateProvided_UsesTodaysDate()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "Jane Doe",
            Email = "jane.doe@example.com",
            JoinDate = null // No join date provided
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result.JoinDate.Date, Is.EqualTo(DateTime.UtcNow.Date));
    }

    [Test]
    public async Task CreateMemberAsync_NonExistentClub_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateMemberRequest
        {
            MembershipTypeId = 1,
            FullName = "John Smith",
            Email = "john.smith@example.com"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _memberService.CreateMemberAsync(999, request));

        Assert.That(ex.Message, Does.Contain("Club with ID 999 not found"));
        Assert.That(ex.ParamName, Is.EqualTo("clubId"));
    }

    [Test]
    public async Task CreateMemberAsync_NonExistentMembershipType_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();
        var request = new CreateMemberRequest
        {
            MembershipTypeId = 999,
            FullName = "John Smith",
            Email = "john.smith@example.com"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _memberService.CreateMemberAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("Membership type with ID 999 not found in this club"));
    }

    [Test]
    public async Task CreateMemberAsync_MembershipTypeFromDifferentClub_ThrowsArgumentException()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");
        var membershipType = await CreateTestMembershipType(club1.Id);

        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id, // From club1
            FullName = "John Smith",
            Email = "john.smith@example.com"
        };

        // Act & Assert - Try to create member in club2 with club1's membership type
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _memberService.CreateMemberAsync(club2.Id, request));

        Assert.That(ex.Message, Does.Contain($"Membership type with ID {membershipType.Id} not found in this club"));
    }

    [Test]
    public async Task CreateMemberAsync_DuplicateEmail_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);

        // Create first member
        var existingMember = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Existing Member",
            Email = "duplicate@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(existingMember);
        await _context.SaveChangesAsync();

        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "New Member",
            Email = "duplicate@example.com" // Same email
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _memberService.CreateMemberAsync(club.Id, request));

        Assert.That(ex.Message, Does.Contain("A member with the email 'duplicate@example.com' already exists in this club"));
    }

    [Test]
    public async Task CreateMemberAsync_DifferentClubsSameEmail_Succeeds()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");
        var membershipType1 = await CreateTestMembershipType(club1.Id);
        var membershipType2 = await CreateTestMembershipType(club2.Id);

        // Create member in first club
        var request1 = new CreateMemberRequest
        {
            MembershipTypeId = membershipType1.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com"
        };
        await _memberService.CreateMemberAsync(club1.Id, request1);

        // Create member with same email in second club
        var request2 = new CreateMemberRequest
        {
            MembershipTypeId = membershipType2.Id,
            FullName = "John Smith Jr.",
            Email = "john.smith@example.com" // Same email, different club
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club2.Id, request2);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Email, Is.EqualTo("john.smith@example.com"));
        Assert.That(result.ClubId, Is.EqualTo(club2.Id));
    }

    [Test]
    public async Task CreateMemberAsync_ExpandTierAtMemberCap_ThrowsInvalidOperationException()
    {
        // Arrange
        var club = await CreateTestClub("Expand Club", "Expand");
        var membershipType = await CreateTestMembershipType(club.Id);
        var members = Enumerable.Range(1, 2000).Select(i => new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = $"Member {i}",
            Email = $"member{i}@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        _context.Members.AddRange(members);
        await _context.SaveChangesAsync();

        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "Over Cap Member",
            Email = "over.cap@example.com"
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _memberService.CreateMemberAsync(club.Id, request));

        Assert.That(ex!.Message, Does.Contain("Expand allows up to 2,000 active members"));
    }

    [Test]
    public async Task CreateMemberAsync_WithSmsConsentTrue_DisablesSmsConsent()
    {
        // Arrange
        var club = await CreateTestClub("SMS Test Club", "Grow");
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "SMS Consent Member",
            Email = "sms.consent@example.com",
            PhoneNumber = "(555) 123-4567",
            HasSmsConsent = true
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result.HasSmsConsent, Is.False);

        // Verify in database
        var saved = await _context.Members.FindAsync(result.Id);
        Assert.That(saved.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task CreateMemberAsync_WithSmsConsentFalse_SetsSmsConsentCorrectly()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "No SMS Consent Member",
            Email = "no.sms.consent@example.com",
            HasSmsConsent = false
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result.HasSmsConsent, Is.False);

        // Verify in database
        var saved = await _context.Members.FindAsync(result.Id);
        Assert.That(saved.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task CreateMemberAsync_DefaultSmsConsent_SetsToFalse()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "Default Consent Member",
            Email = "default.consent@example.com"
            // HasSmsConsent not explicitly set, should default to false
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result.HasSmsConsent, Is.False);

        // Verify in database
        var saved = await _context.Members.FindAsync(result.Id);
        Assert.That(saved.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task CreateMemberAsync_SproutTierWithSmsConsentTrue_DisablesSmsConsent()
    {
        // Arrange
        var club = await CreateTestClub("Sprout Club", "Sprout"); // Sprout tier
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "SMS Test Member",
            Email = "sms.test@example.com",
            HasSmsConsent = true
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task CreateMemberAsync_SproutTierWithSmsConsentFalse_Succeeds()
    {
        // Arrange
        var club = await CreateTestClub("Sprout Club", "Sprout"); // Sprout tier
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "No SMS Member",
            Email = "no.sms@example.com",
            HasSmsConsent = false // Should be allowed
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result.HasSmsConsent, Is.False);

        // Verify in database
        var saved = await _context.Members.FindAsync(result.Id);
        Assert.That(saved.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task CreateMemberAsync_GrowTierWithSmsConsentTrue_DisablesSmsConsent()
    {
        // Arrange
        var club = await CreateTestClub("Grow Club", "Grow"); // Grow tier
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "SMS Enabled Member",
            Email = "sms.enabled@example.com",
            HasSmsConsent = true
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result.HasSmsConsent, Is.False);

        // Verify in database
        var saved = await _context.Members.FindAsync(result.Id);
        Assert.That(saved.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task CreateMemberAsync_SproutTier_CreatesUserAccountWithoutActivationEmail()
    {
        // Arrange
        var club = await CreateTestClub("Sprout Club", "Sprout"); // Sprout tier
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "Sprout Member",
            Email = "sprout.member@example.com",
            HasSmsConsent = false
        };

        // Setup mock to return success for dormant account creation
        _mockMemberActivationService
            .Setup(x => x.CreateDormantMemberAccountAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo(request.FullName));
        Assert.That(result.Email, Is.EqualTo(request.Email));

        // Verify dormant account creation was called
        _mockMemberActivationService.Verify(x => x.CreateDormantMemberAccountAsync(result.Id, club.Id), Times.Once);

        // Verify activation email was NOT called
        _mockMemberActivationService.Verify(x => x.CreateMemberAccountAndSendActivationEmailAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task CreateMemberAsync_GrowTier_CreatesUserAccountWithActivationEmail()
    {
        // Arrange
        var club = await CreateTestClub("Grow Club", "Grow"); // Grow tier
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "Grow Member",
            Email = "grow.member@example.com",
            HasSmsConsent = false
        };

        // Setup mock to return success for account creation with email
        _mockMemberActivationService
            .Setup(x => x.CreateMemberAccountAndSendActivationEmailAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo(request.FullName));
        Assert.That(result.Email, Is.EqualTo(request.Email));

        // Verify activation email was called
        _mockMemberActivationService.Verify(x => x.CreateMemberAccountAndSendActivationEmailAsync(result.Id, club.Id), Times.Once);

        // Verify dormant account creation was NOT called
        _mockMemberActivationService.Verify(x => x.CreateDormantMemberAccountAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task CreateMemberAsync_UnknownTier_CreatesNoUserAccount()
    {
        // Arrange
        var club = await CreateTestClub("Unknown Club", "Unknown"); // Unknown tier
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "Unknown Tier Member",
            Email = "unknown.member@example.com",
            HasSmsConsent = false
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo(request.FullName));
        Assert.That(result.Email, Is.EqualTo(request.Email));

        // Verify no user account creation methods were called
        _mockMemberActivationService.Verify(x => x.CreateDormantMemberAccountAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        _mockMemberActivationService.Verify(x => x.CreateMemberAccountAndSendActivationEmailAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    #region Fix 6: Seed tier member creation uses dormant account (same as Sprout)

    [Test]
    public async Task CreateMemberAsync_SeedTier_CreatesDormantAccountWithoutActivationEmail()
    {
        // Arrange - Seed tier club (not "Sprout", not "Grow")
        var club = await CreateTestClub("Seed Club", "Seed");
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "Seed Member",
            Email = "seed.member@example.com",
            HasSmsConsent = false
        };

        _mockMemberActivationService
            .Setup(x => x.CreateDormantMemberAccountAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert - member is created
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo(request.FullName));
        Assert.That(result.Email, Is.EqualTo(request.Email));

        // Verify dormant account creation WAS called (Seed tier = dormant, like Sprout)
        _mockMemberActivationService.Verify(
            x => x.CreateDormantMemberAccountAsync(result.Id, club.Id),
            Times.Once,
            "Seed tier must create a dormant member account (no activation email)");

        // Verify full activation email was NOT sent for Seed tier
        _mockMemberActivationService.Verify(
            x => x.CreateMemberAccountAndSendActivationEmailAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never,
            "Seed tier must NOT send activation email on member creation");
    }

    [Test]
    public async Task CreateMemberAsync_SeedTier_MemberIsSavedToDatabase()
    {
        // Arrange
        var club = await CreateTestClub("Seed Club 2", "Seed");
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "Another Seed Member",
            Email = "another.seed@example.com",
            HasSmsConsent = false
        };

        _mockMemberActivationService
            .Setup(x => x.CreateDormantMemberAccountAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert - member is persisted in DB
        var saved = await _context.Members.FindAsync(result.Id);
        Assert.That(saved, Is.Not.Null, "Seed tier member must be persisted to DB");
        Assert.That(saved!.FullName, Is.EqualTo(request.FullName));
        Assert.That(saved.Status, Is.EqualTo("Active"));
    }

    [Test]
    public async Task CreateMemberAsync_SeedTierWithSmsConsentTrue_DisablesSmsConsent()
    {
        // Arrange
        var club = await CreateTestClub("Seed SMS Club", "Seed");
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new CreateMemberRequest
        {
            MembershipTypeId = membershipType.Id,
            FullName = "SMS Seed Member",
            Email = "sms.seed@example.com",
            HasSmsConsent = true
        };

        // Act
        var result = await _memberService.CreateMemberAsync(club.Id, request);

        // Assert
        Assert.That(result.HasSmsConsent, Is.False);
    }

    #endregion

    #endregion

    #region GetMembersByClubAsync Tests

    [Test]
    public async Task GetMembersByClubAsync_ExistingClubWithMembers_ReturnsOrderedMembers()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var members = new[]
        {
            new Member
            {
                ClubId = club.Id,
                MembershipTypeId = membershipType.Id,
                FullName = "Zoe Wilson",
                Email = "zoe@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                HasSmsConsent = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Member
            {
                ClubId = club.Id,
                MembershipTypeId = membershipType.Id,
                FullName = "Alice Johnson",
                Email = "alice@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow,
                HasSmsConsent = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Member
            {
                ClubId = club.Id,
                MembershipTypeId = membershipType.Id,
                FullName = "Bob Smith",
                Email = "bob@example.com",
                Status = "Inactive",
                JoinDate = DateTime.UtcNow,
                HasSmsConsent = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.Members.AddRange(members);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberService.GetMembersByClubAsync(club.Id);

        // Assert
        Assert.That(result, Has.Count.EqualTo(3));
        Assert.That(result[0].FullName, Is.EqualTo("Alice Johnson"));
        Assert.That(result[1].FullName, Is.EqualTo("Bob Smith"));
        Assert.That(result[2].FullName, Is.EqualTo("Zoe Wilson"));

        // Verify all properties are mapped correctly
        var aliceMember = result[0];
        Assert.That(aliceMember.ClubId, Is.EqualTo(club.Id));
        Assert.That(aliceMember.MembershipTypeId, Is.EqualTo(membershipType.Id));
        Assert.That(aliceMember.MembershipTypeName, Is.EqualTo(membershipType.Name));
        Assert.That(aliceMember.Email, Is.EqualTo("alice@example.com"));
        Assert.That(aliceMember.Status, Is.EqualTo("Active"));
    }

    [Test]
    public async Task GetMembersByClubAsync_EmptyClub_ReturnsEmptyList()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _memberService.GetMembersByClubAsync(club.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(0));
    }

    [Test]
    public async Task GetMembersByClubAsync_NonExistentClub_ReturnsEmptyList()
    {
        // Act
        var result = await _memberService.GetMembersByClubAsync(999);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(0));
    }

    [Test]
    public async Task GetMembersByClubAsync_OnlyReturnsMembersForSpecificClub()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");
        var membershipType1 = await CreateTestMembershipType(club1.Id);
        var membershipType2 = await CreateTestMembershipType(club2.Id);

        // Add members to both clubs
        var club1Member = new Member
        {
            ClubId = club1.Id,
            MembershipTypeId = membershipType1.Id,
            FullName = "Club1 Member",
            Email = "club1@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var club2Member = new Member
        {
            ClubId = club2.Id,
            MembershipTypeId = membershipType2.Id,
            FullName = "Club2 Member",
            Email = "club2@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(club1Member, club2Member);
        await _context.SaveChangesAsync();

        // Act
        var club1Result = await _memberService.GetMembersByClubAsync(club1.Id);
        var club2Result = await _memberService.GetMembersByClubAsync(club2.Id);

        // Assert
        Assert.That(club1Result, Has.Count.EqualTo(1));
        Assert.That(club1Result[0].FullName, Is.EqualTo("Club1 Member"));
        Assert.That(club1Result[0].ClubId, Is.EqualTo(club1.Id));

        Assert.That(club2Result, Has.Count.EqualTo(1));
        Assert.That(club2Result[0].FullName, Is.EqualTo("Club2 Member"));
        Assert.That(club2Result[0].ClubId, Is.EqualTo(club2.Id));
    }

    #endregion

    #region GetMemberByIdAsync Tests

    [Test]
    public async Task GetMemberByIdAsync_ExistingMember_ReturnsMember()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Premium Member",
            Email = "premium@example.com",
            PhoneNumber = "(555) 987-6543",
            Address = "456 Oak Ave, Somewhere, ST 67890",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            DuesPaidUntil = DateTime.UtcNow.AddMonths(1),
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberService.GetMemberByIdAsync(club.Id, member.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(member.Id));
        Assert.That(result.FullName, Is.EqualTo(member.FullName));
        Assert.That(result.Email, Is.EqualTo(member.Email));
        Assert.That(result.PhoneNumber, Is.EqualTo(member.PhoneNumber));
        Assert.That(result.Address, Is.EqualTo(member.Address));
        Assert.That(result.MembershipTypeId, Is.EqualTo(membershipType.Id));
        Assert.That(result.MembershipTypeName, Is.EqualTo(membershipType.Name));
        Assert.That(result.ClubId, Is.EqualTo(club.Id));
        Assert.That(result.Status, Is.EqualTo(member.Status));
        Assert.That(result.JoinDate, Is.EqualTo(member.JoinDate));
        Assert.That(result.DuesPaidUntil, Is.EqualTo(member.DuesPaidUntil));
        Assert.That(result.HasSmsConsent, Is.EqualTo(member.HasSmsConsent));
    }

    [Test]
    public async Task GetMemberByIdAsync_NonExistentMember_ReturnsNull()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _memberService.GetMemberByIdAsync(club.Id, 999);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMemberByIdAsync_MemberFromDifferentClub_ReturnsNull()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");
        var membershipType = await CreateTestMembershipType(club1.Id);

        var member = new Member
        {
            ClubId = club1.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Club1 Member",
            Email = "club1@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Try to access from different club
        var result = await _memberService.GetMemberByIdAsync(club2.Id, member.Id);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMemberByIdAsync_NonExistentClub_ReturnsNull()
    {
        // Act
        var result = await _memberService.GetMemberByIdAsync(999, 999);

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region GetPaginatedMembersAsync Tests - Story 14

    [Test]
    public async Task GetPaginatedMembersAsync_WithValidClubId_ReturnsAllActiveMembers()
    {
        // Arrange
        var (club, membershipType) = await SetupTestClubAndMembershipType();

        // Create test members
        var member1 = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Alice Johnson",
            Email = "alice@example.com",
            PhoneNumber = "555-0001",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member2 = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Bob Smith",
            Email = "bob@example.com",
            PhoneNumber = "555-0002",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member3 = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Charlie Brown",
            Email = "charlie@example.com",
            PhoneNumber = "555-0003",
            Status = "Archived", // This should be excluded
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(member1, member2, member3);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberService.GetPaginatedMembersAsync(club.Id, null, 1, 25);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalCount, Is.EqualTo(2)); // Only active members
        Assert.That(result.Members.Count, Is.EqualTo(2));
        Assert.That(result.CurrentPage, Is.EqualTo(1));
        Assert.That(result.PageSize, Is.EqualTo(25));
        Assert.That(result.TotalPages, Is.EqualTo(1));
        Assert.That(result.HasPrevious, Is.False);
        Assert.That(result.HasNext, Is.False);
        Assert.That(result.Search, Is.Null);

        // Verify only active members are returned
        Assert.That(result.Members.All(m => m.Status == "Active"), Is.True);

        // Verify members are ordered by full name
        Assert.That(result.Members[0].FullName, Is.EqualTo("Alice Johnson"));
        Assert.That(result.Members[1].FullName, Is.EqualTo("Bob Smith"));
    }

    [Test]
    public async Task GetPaginatedMembersAsync_WithSearchTerm_ReturnsFilteredMembers()
    {
        // Arrange
        var (club, membershipType) = await SetupTestClubAndMembershipType();

        var member1 = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Alice Johnson",
            Email = "alice@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member2 = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Bob Smith",
            Email = "bob@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member3 = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Charlie Brown",
            Email = "charlie@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(member1, member2, member3);
        await _context.SaveChangesAsync();

        // Act - Search by name
        var resultByName = await _memberService.GetPaginatedMembersAsync(club.Id, "alice", 1, 25);

        // Assert - Name search
        Assert.That(resultByName, Is.Not.Null);
        Assert.That(resultByName.TotalCount, Is.EqualTo(1));
        Assert.That(resultByName.Members.Count, Is.EqualTo(1));
        Assert.That(resultByName.Members[0].FullName, Is.EqualTo("Alice Johnson"));
        Assert.That(resultByName.Search, Is.EqualTo("alice"));

        // Act - Search by email
        var resultByEmail = await _memberService.GetPaginatedMembersAsync(club.Id, "test.com", 1, 25);

        // Assert - Email search
        Assert.That(resultByEmail, Is.Not.Null);
        Assert.That(resultByEmail.TotalCount, Is.EqualTo(1));
        Assert.That(resultByEmail.Members.Count, Is.EqualTo(1));
        Assert.That(resultByEmail.Members[0].FullName, Is.EqualTo("Charlie Brown"));
    }

    [Test]
    public async Task GetPaginatedMembersAsync_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var (club, membershipType) = await SetupTestClubAndMembershipType();

        // Create 6 members to test pagination
        var members = new List<Member>();
        for (int i = 1; i <= 6; i++)
        {
            members.Add(new Member
            {
                ClubId = club.Id,
                MembershipTypeId = membershipType.Id,
                FullName = $"Member {i:D2}", // D2 ensures proper sorting (01, 02, etc.)
                Email = $"member{i}@example.com",
                Status = "Active",
                JoinDate = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        _context.Members.AddRange(members);
        await _context.SaveChangesAsync();

        // Act - Get first page (3 items per page)
        var page1 = await _memberService.GetPaginatedMembersAsync(club.Id, null, 1, 3);

        // Assert - First page
        Assert.That(page1, Is.Not.Null);
        Assert.That(page1.TotalCount, Is.EqualTo(6));
        Assert.That(page1.Members.Count, Is.EqualTo(3));
        Assert.That(page1.CurrentPage, Is.EqualTo(1));
        Assert.That(page1.PageSize, Is.EqualTo(3));
        Assert.That(page1.TotalPages, Is.EqualTo(2));
        Assert.That(page1.HasPrevious, Is.False);
        Assert.That(page1.HasNext, Is.True);

        // Act - Get second page
        var page2 = await _memberService.GetPaginatedMembersAsync(club.Id, null, 2, 3);

        // Assert - Second page
        Assert.That(page2, Is.Not.Null);
        Assert.That(page2.TotalCount, Is.EqualTo(6));
        Assert.That(page2.Members.Count, Is.EqualTo(3));
        Assert.That(page2.CurrentPage, Is.EqualTo(2));
        Assert.That(page2.PageSize, Is.EqualTo(3));
        Assert.That(page2.TotalPages, Is.EqualTo(2));
        Assert.That(page2.HasPrevious, Is.True);
        Assert.That(page2.HasNext, Is.False);

        // Verify different members on each page
        Assert.That(page1.Members[0].Id, Is.Not.EqualTo(page2.Members[0].Id));
    }

    [Test]
    public async Task GetPaginatedMembersAsync_WithInvalidPageNumber_CorrectsBounds()
    {
        // Arrange
        var (club, membershipType) = await SetupTestClubAndMembershipType();

        // Act - Test page less than 1
        var result1 = await _memberService.GetPaginatedMembersAsync(club.Id, null, 0, 25);

        // Assert - Should correct to page 1
        Assert.That(result1.CurrentPage, Is.EqualTo(1));

        // Act - Test negative page
        var result2 = await _memberService.GetPaginatedMembersAsync(club.Id, null, -5, 25);

        // Assert - Should correct to page 1
        Assert.That(result2.CurrentPage, Is.EqualTo(1));
    }

    [Test]
    public async Task GetPaginatedMembersAsync_WithInvalidPageSize_CorrectsBounds()
    {
        // Arrange
        var (club, membershipType) = await SetupTestClubAndMembershipType();

        // Act - Test page size less than 1
        var result1 = await _memberService.GetPaginatedMembersAsync(club.Id, null, 1, 0);

        // Assert - Should correct to default 25
        Assert.That(result1.PageSize, Is.EqualTo(25));

        // Act - Test negative page size
        var result2 = await _memberService.GetPaginatedMembersAsync(club.Id, null, 1, -10);

        // Assert - Should correct to default 25
        Assert.That(result2.PageSize, Is.EqualTo(25));

        // Act - Test page size too large
        var result3 = await _memberService.GetPaginatedMembersAsync(club.Id, null, 1, 150);

        // Assert - Should cap at 100
        Assert.That(result3.PageSize, Is.EqualTo(100));
    }

    [Test]
    public async Task GetPaginatedMembersAsync_WithEmptySearchTerm_IgnoresSearch()
    {
        // Arrange
        var (club, membershipType) = await SetupTestClubAndMembershipType();

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Test Member",
            Email = "test@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Test empty string and whitespace
        var result1 = await _memberService.GetPaginatedMembersAsync(club.Id, "", 1, 25);
        var result2 = await _memberService.GetPaginatedMembersAsync(club.Id, "   ", 1, 25);

        // Assert - Should return all members and not set search term
        Assert.That(result1.TotalCount, Is.EqualTo(1));
        Assert.That(result2.TotalCount, Is.EqualTo(1));
        Assert.That(result1.Search, Is.Null);
        Assert.That(result2.Search, Is.Null);
    }

    [Test]
    public async Task GetPaginatedMembersAsync_WithNoMatches_ReturnsEmptyResult()
    {
        // Arrange
        var (club, membershipType) = await SetupTestClubAndMembershipType();

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Test Member",
            Email = "test@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberService.GetPaginatedMembersAsync(club.Id, "nonexistent", 1, 25);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.TotalCount, Is.EqualTo(0));
        Assert.That(result.Members, Is.Empty);
        Assert.That(result.TotalPages, Is.EqualTo(0));
        Assert.That(result.HasPrevious, Is.False);
        Assert.That(result.HasNext, Is.False);
        Assert.That(result.Search, Is.EqualTo("nonexistent"));
    }

    [Test]
    public async Task GetPaginatedMembersAsync_CaseInsensitiveSearch_ReturnsMatches()
    {
        // Arrange
        var (club, membershipType) = await SetupTestClubAndMembershipType();

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Alice Johnson",
            Email = "Alice.Johnson@Example.Com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Test various case combinations
        var result1 = await _memberService.GetPaginatedMembersAsync(club.Id, "ALICE", 1, 25);
        var result2 = await _memberService.GetPaginatedMembersAsync(club.Id, "johnson", 1, 25);
        var result3 = await _memberService.GetPaginatedMembersAsync(club.Id, "EXAMPLE.COM", 1, 25);

        // Assert
        Assert.That(result1.TotalCount, Is.EqualTo(1));
        Assert.That(result2.TotalCount, Is.EqualTo(1));
        Assert.That(result3.TotalCount, Is.EqualTo(1));
    }

    #endregion

    #region UpdateMemberAsync Tests

    [Test]
    public async Task UpdateMemberAsync_ValidRequest_ReturnsUpdatedMember()
    {
        // Arrange
        var club = await CreateTestClub("Test Club", "Grow");
        var membershipType1 = await CreateTestMembershipType(club.Id, "Individual");
        var membershipType2 = await CreateTestMembershipType(club.Id, "Family");

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType1.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            PhoneNumber = "(555) 123-4567",
            Address = "123 Main St",
            Status = "Active",
            JoinDate = DateTime.Today.AddDays(-30),
            HasSmsConsent = false,
            CreatedAt = DateTime.UtcNow.AddDays(-30),
            UpdatedAt = DateTime.UtcNow.AddDays(-30)
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "John M. Smith",
            Email = "john.m.smith@example.com",
            PhoneNumber = "(555) 987-6543",
            Address = "456 Oak Ave",
            MembershipTypeId = membershipType2.Id,
            HasSmsConsent = true
        };

        // Act
        var result = await _memberService.UpdateMemberAsync(club.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(member.Id));
        Assert.That(result.FullName, Is.EqualTo(request.FullName));
        Assert.That(result.Email, Is.EqualTo(request.Email));
        Assert.That(result.PhoneNumber, Is.EqualTo(request.PhoneNumber));
        Assert.That(result.Address, Is.EqualTo(request.Address));
        Assert.That(result.MembershipTypeId, Is.EqualTo(request.MembershipTypeId));
        Assert.That(result.MembershipTypeName, Is.EqualTo(membershipType2.Name));
        Assert.That(result.HasSmsConsent, Is.False);
        Assert.That(result.ClubId, Is.EqualTo(club.Id));
        Assert.That(result.Status, Is.EqualTo("Active")); // Should remain unchanged
        Assert.That(result.JoinDate, Is.EqualTo(member.JoinDate)); // Should remain unchanged
        Assert.That(result.CreatedAt, Is.EqualTo(member.CreatedAt)); // Should remain unchanged
        Assert.That(result.UpdatedAt, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));

        // Verify it was updated in database
        var updated = await _context.Members.FindAsync(member.Id);
        Assert.That(updated, Is.Not.Null);
        Assert.That(updated.FullName, Is.EqualTo(request.FullName));
        Assert.That(updated.Email, Is.EqualTo(request.Email));
        Assert.That(updated.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task UpdateMemberAsync_NonExistentMember_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var request = new UpdateMemberRequest
        {
            FullName = "John Smith",
            Email = "john.smith@example.com",
            MembershipTypeId = membershipType.Id,
            HasSmsConsent = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _memberService.UpdateMemberAsync(club.Id, 999, request));

        Assert.That(ex.Message, Does.Contain("Member with ID 999 not found in club"));
    }

    [Test]
    public async Task UpdateMemberAsync_MemberFromDifferentClub_ThrowsArgumentException()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");
        var membershipType1 = await CreateTestMembershipType(club1.Id);
        var membershipType2 = await CreateTestMembershipType(club2.Id);

        var member = new Member
        {
            ClubId = club1.Id,
            MembershipTypeId = membershipType1.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "John Updated",
            Email = "john.updated@example.com",
            MembershipTypeId = membershipType2.Id,
            HasSmsConsent = false
        };

        // Act & Assert - Try to update club1 member from club2
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _memberService.UpdateMemberAsync(club2.Id, member.Id, request));

        Assert.That(ex.Message, Does.Contain($"Member with ID {member.Id} not found in club {club2.Id}"));
    }

    [Test]
    public async Task UpdateMemberAsync_NonExistentMembershipType_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "John Updated",
            Email = "john.updated@example.com",
            MembershipTypeId = 999, // Non-existent membership type
            HasSmsConsent = false
        };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _memberService.UpdateMemberAsync(club.Id, member.Id, request));

        Assert.That(ex.Message, Does.Contain("Membership type with ID 999 not found in this club"));
    }

    [Test]
    public async Task UpdateMemberAsync_DuplicateEmailWithOtherMember_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);

        // Create two members
        var member1 = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member2 = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Jane Doe",
            Email = "jane.doe@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.AddRange(member1, member2);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "Jane Updated",
            Email = "john.smith@example.com", // Try to use member1's email
            MembershipTypeId = membershipType.Id,
            HasSmsConsent = false
        };

        // Act & Assert - Try to update member2 with member1's email
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _memberService.UpdateMemberAsync(club.Id, member2.Id, request));

        Assert.That(ex.Message, Does.Contain("A member with the email 'john.smith@example.com' already exists in this club"));
    }

    [Test]
    public async Task UpdateMemberAsync_SameEmailForSameMember_Succeeds()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "John Updated",
            Email = "john.smith@example.com", // Same email as before
            MembershipTypeId = membershipType.Id,
            HasSmsConsent = false
        };

        // Act
        var result = await _memberService.UpdateMemberAsync(club.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.FullName, Is.EqualTo("John Updated"));
        Assert.That(result.Email, Is.EqualTo("john.smith@example.com"));
    }

    [Test]
    public async Task UpdateMemberAsync_SproutTierWithSmsConsentTrue_DisablesSmsConsent()
    {
        // Arrange
        var club = await CreateTestClub("Test Club", "Sprout"); // Sprout tier
        var membershipType = await CreateTestMembershipType(club.Id);

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            HasSmsConsent = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "John Updated",
            Email = "john.updated@example.com",
            MembershipTypeId = membershipType.Id,
            HasSmsConsent = true
        };

        // Act
        var result = await _memberService.UpdateMemberAsync(club.Id, member.Id, request);

        // Assert
        Assert.That(result.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task UpdateMemberAsync_SproutTierWithSmsConsentFalse_Succeeds()
    {
        // Arrange
        var club = await CreateTestClub("Test Club", "Sprout"); // Sprout tier
        var membershipType = await CreateTestMembershipType(club.Id);

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            HasSmsConsent = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "John Updated",
            Email = "john.updated@example.com",
            MembershipTypeId = membershipType.Id,
            HasSmsConsent = false // Allowed for Sprout tier
        };

        // Act
        var result = await _memberService.UpdateMemberAsync(club.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task UpdateMemberAsync_GrowTierWithSmsConsentTrue_DisablesSmsConsent()
    {
        // Arrange
        var club = await CreateTestClub("Test Club", "Grow"); // Grow tier
        var membershipType = await CreateTestMembershipType(club.Id);

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            Status = "Active",
            JoinDate = DateTime.Today,
            HasSmsConsent = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "John Updated",
            Email = "john.updated@example.com",
            MembershipTypeId = membershipType.Id,
            HasSmsConsent = true
        };

        // Act
        var result = await _memberService.UpdateMemberAsync(club.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.HasSmsConsent, Is.False);
    }

    [Test]
    public async Task UpdateMemberAsync_WithNullOptionalFields_UpdatesCorrectly()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);

        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            PhoneNumber = "(555) 123-4567",
            Address = "123 Main St",
            Status = "Active",
            JoinDate = DateTime.Today,
            HasSmsConsent = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberRequest
        {
            FullName = "John Updated",
            Email = "john.updated@example.com",
            PhoneNumber = null, // Clear phone number
            Address = null, // Clear address
            MembershipTypeId = membershipType.Id,
            HasSmsConsent = false
        };

        // Act
        var result = await _memberService.UpdateMemberAsync(club.Id, member.Id, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.PhoneNumber, Is.Null);
        Assert.That(result.Address, Is.Null);

        // Verify in database
        var updated = await _context.Members.FindAsync(member.Id);
        Assert.That(updated.PhoneNumber, Is.Null);
        Assert.That(updated.Address, Is.Null);
    }

    #endregion

    #region UpdateMemberStatusAsync Tests

    [Test]
    public async Task UpdateMemberStatusAsync_ValidRequest_UpdatesStatusSuccessfully()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberService.UpdateMemberStatusAsync(club.Id, member.Id, "Archived");

        // Assert
        Assert.That(result.Status, Is.EqualTo("Archived"));
        Assert.That(result.FullName, Is.EqualTo(member.FullName));
        Assert.That(result.Email, Is.EqualTo(member.Email));

        // Verify database update
        var updatedMember = await _context.Members.FindAsync(member.Id);
        Assert.That(updatedMember!.Status, Is.EqualTo("Archived"));
        Assert.That(updatedMember.UpdatedAt, Is.EqualTo(DateTime.UtcNow).Within(TimeSpan.FromSeconds(5)));
    }

    [Test]
    public async Task UpdateMemberStatusAsync_NonExistentMember_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _memberService.UpdateMemberStatusAsync(club.Id, 999, "Archived"));

        Assert.That(ex.Message, Does.Contain("Member not found"));
    }

    [Test]
    public async Task UpdateMemberStatusAsync_InvalidStatus_ThrowsArgumentException()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _memberService.UpdateMemberStatusAsync(club.Id, member.Id, "InvalidStatus"));

        Assert.That(ex.Message, Does.Contain("Invalid status"));
        Assert.That(ex.Message, Does.Contain("Valid statuses are: Active, Archived, Inactive, Suspended"));
    }

    [Test]
    public async Task UpdateMemberStatusAsync_MemberFromDifferentClub_ThrowsArgumentException()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");
        var membershipType = await CreateTestMembershipType(club1.Id);
        var member = new Member
        {
            ClubId = club1.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act & Assert - Try to update member from club1 using club2's ID
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _memberService.UpdateMemberStatusAsync(club2.Id, member.Id, "Archived"));

        Assert.That(ex.Message, Does.Contain("Member not found"));
    }

    #endregion

    #region GetMemberByEmailAsync Tests

    [Test]
    public async Task GetMemberByEmailAsync_ExistingMember_ReturnsMember()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "John Smith",
            Email = "john.smith@example.com",
            PhoneNumber = "(555) 123-4567",
            Address = "123 Main St, Anytown, ST 12345",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            DuesPaidUntil = DateTime.UtcNow.AddMonths(6),
            HasSmsConsent = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberService.GetMemberByEmailAsync(club.Id, "john.smith@example.com");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(member.Id));
        Assert.That(result.FullName, Is.EqualTo(member.FullName));
        Assert.That(result.Email, Is.EqualTo(member.Email));
        Assert.That(result.PhoneNumber, Is.EqualTo(member.PhoneNumber));
        Assert.That(result.Address, Is.EqualTo(member.Address));
        Assert.That(result.MembershipTypeId, Is.EqualTo(membershipType.Id));
        Assert.That(result.MembershipTypeName, Is.EqualTo(membershipType.Name));
        Assert.That(result.ClubId, Is.EqualTo(club.Id));
        Assert.That(result.Status, Is.EqualTo(member.Status));
        Assert.That(result.JoinDate, Is.EqualTo(member.JoinDate));
        Assert.That(result.DuesPaidUntil, Is.EqualTo(member.DuesPaidUntil));
        Assert.That(result.HasSmsConsent, Is.EqualTo(member.HasSmsConsent));
    }

    [Test]
    public async Task GetMemberByEmailAsync_CaseInsensitive_ReturnsMember()
    {
        // Arrange
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        var member = new Member
        {
            ClubId = club.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Jane Doe",
            Email = "jane.doe@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.Date,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Test with different cases
        var result1 = await _memberService.GetMemberByEmailAsync(club.Id, "JANE.DOE@EXAMPLE.COM");
        var result2 = await _memberService.GetMemberByEmailAsync(club.Id, "Jane.Doe@Example.Com");

        // Assert
        Assert.That(result1, Is.Not.Null);
        Assert.That(result1.Email, Is.EqualTo("jane.doe@example.com"));
        Assert.That(result2, Is.Not.Null);
        Assert.That(result2.Email, Is.EqualTo("jane.doe@example.com"));
    }

    [Test]
    public async Task GetMemberByEmailAsync_NonExistentEmail_ReturnsNull()
    {
        // Arrange
        var club = await CreateTestClub();

        // Act
        var result = await _memberService.GetMemberByEmailAsync(club.Id, "nonexistent@example.com");

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMemberByEmailAsync_WrongClub_ReturnsNull()
    {
        // Arrange
        var club1 = await CreateTestClub("Club 1");
        var club2 = await CreateTestClub("Club 2");
        var membershipType = await CreateTestMembershipType(club1.Id);

        var member = new Member
        {
            ClubId = club1.Id,
            MembershipTypeId = membershipType.Id,
            FullName = "Test Member",
            Email = "test@example.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Members.Add(member);
        await _context.SaveChangesAsync();

        // Act - Try to find member from wrong club
        var result = await _memberService.GetMemberByEmailAsync(club2.Id, "test@example.com");

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task GetMemberByEmailAsync_NonExistentClub_ReturnsNull()
    {
        // Act
        var result = await _memberService.GetMemberByEmailAsync(999, "test@example.com");

        // Assert
        Assert.That(result, Is.Null);
    }

    #endregion

    #region Helper Methods

    private async Task<Club> CreateTestClub(string name = "Test Club", string tier = "Sprout")
    {
        var club = new Club
        {
            Name = name,
            Tier = tier,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();
        return club;
    }

    private async Task<MembershipType> CreateTestMembershipType(int clubId, string name = "Test Membership")
    {
        var membershipType = new MembershipType
        {
            ClubId = clubId,
            Name = name,
            DuesAmount = 25.00m,
            DuesFrequency = "Annual",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MembershipTypes.Add(membershipType);
        await _context.SaveChangesAsync();
        return membershipType;
    }

    private async Task<(Club club, MembershipType membershipType)> SetupTestClubAndMembershipType()
    {
        var club = await CreateTestClub();
        var membershipType = await CreateTestMembershipType(club.Id);
        return (club, membershipType);
    }

    #endregion
}
