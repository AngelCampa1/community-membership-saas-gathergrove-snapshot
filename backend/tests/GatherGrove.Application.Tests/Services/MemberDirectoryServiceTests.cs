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
public class MemberDirectoryServiceTests
{
    private GatherGroveDbContext _context = null!;
    private MemberService _memberService = null!;
    private Mock<IMemberActivationService> _mockMemberActivationService = null!;
    private Mock<ILogger<MemberService>> _mockLogger = null!;
    private Mock<IConfiguration> _mockConfiguration = null!;
    private Mock<IPaymentService> _mockPaymentService = null!;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockMemberActivationService = new Mock<IMemberActivationService>();
        _mockLogger = new Mock<ILogger<MemberService>>();
        _mockConfiguration = new Mock<IConfiguration>();
        _mockPaymentService = new Mock<IPaymentService>();
        _memberService = new MemberService(_context, _mockMemberActivationService.Object, _mockLogger.Object, _mockConfiguration.Object, _mockPaymentService.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private async Task<(User requestingUser, Club club, Member requestingMember, List<Member> otherMembers)> CreateTestDataAsync()
    {
        // Create club with directory enabled
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow",
            IsDirectoryEnabled = true,
            DirectoryAllowedSharableFields = "email,phoneNumber,membershipType,joinDate"
        };
        _context.Clubs.Add(club);

        // Create membership type
        var membershipType = new MembershipType
        {
            Club = club,
            Name = "Regular",
            Description = "Regular membership",
            DuesAmount = 25.00m,
            DuesFrequency = "Monthly",
            IsActive = true
        };
        _context.MembershipTypes.Add(membershipType);

        // Create requesting user
        var requestingUser = new User
        {
            FullName = "John Requesting",
            Email = "john@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(requestingUser);

        // Create requesting member (opted in)
        var requestingMember = new Member
        {
            Club = club,
            MembershipType = membershipType,
            FullName = requestingUser.FullName,
            Email = requestingUser.Email,
            PhoneNumber = "(555) 123-1111",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddMonths(-6),
            IsListedInDirectory = true,
            DirectoryVisibleFields = "email,phoneNumber"
        };
        _context.Members.Add(requestingMember);

        // Create club admin
        var clubAdmin = new ClubAdmin
        {
            User = requestingUser,
            Club = club
        };
        _context.ClubAdmins.Add(clubAdmin);

        // Create other members with various privacy settings
        var otherMembers = new List<Member>
        {
            // Member opted in with all fields visible
            new Member
            {
                Club = club,
                MembershipType = membershipType,
                FullName = "Alice Visible",
                Email = "alice@test.com",
                PhoneNumber = "(555) 123-2222",
                Address = "123 Main St",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddMonths(-3),
                IsListedInDirectory = true,
                DirectoryVisibleFields = "email,phoneNumber,membershipType,joinDate"
            },
            // Member opted in with limited fields
            new Member
            {
                Club = club,
                MembershipType = membershipType,
                FullName = "Bob Limited",
                Email = "bob@test.com",
                PhoneNumber = "(555) 123-3333",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddMonths(-1),
                IsListedInDirectory = true,
                DirectoryVisibleFields = "email"
            },
            // Member not opted in (should not appear)
            new Member
            {
                Club = club,
                MembershipType = membershipType,
                FullName = "Charlie Hidden",
                Email = "charlie@test.com",
                PhoneNumber = "(555) 123-4444",
                Status = "Active",
                JoinDate = DateTime.UtcNow.AddMonths(-2),
                IsListedInDirectory = false,
                DirectoryVisibleFields = null
            },
            // Inactive member (should not appear)
            new Member
            {
                Club = club,
                MembershipType = membershipType,
                FullName = "David Inactive",
                Email = "david@test.com",
                Status = "Archived",
                JoinDate = DateTime.UtcNow.AddMonths(-4),
                IsListedInDirectory = true,
                DirectoryVisibleFields = "email"
            }
        };

        _context.Members.AddRange(otherMembers);
        await _context.SaveChangesAsync();

        return (requestingUser, club, requestingMember, otherMembers);
    }

    [Test]
    public async Task GetMemberDirectoryAsync_ValidRequest_ReturnsDirectoryMembers()
    {
        // Arrange
        var (requestingUser, club, _, _) = await CreateTestDataAsync();

        // Act
        var result = await _memberService.GetMemberDirectoryAsync(club.Id, requestingUser.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Members.Count, Is.EqualTo(3)); // Requesting member + Alice + Bob (Charlie not opted in, David inactive)
        Assert.That(result.TotalMembers, Is.EqualTo(3));
        Assert.That(result.CurrentPage, Is.EqualTo(1));
        Assert.That(result.TotalPages, Is.EqualTo(1));

        // Check that members are returned with correct privacy settings
        var aliceEntry = result.Members.First(m => m.FullName == "Alice Visible");
        Assert.That(aliceEntry.Email, Is.EqualTo("alice@test.com"));
        Assert.That(aliceEntry.PhoneNumber, Is.EqualTo("(555) 123-2222"));
        Assert.That(aliceEntry.MembershipTypeName, Is.EqualTo("Regular"));
        Assert.That(aliceEntry.JoinDate, Is.Not.Null);

        var bobEntry = result.Members.First(m => m.FullName == "Bob Limited");
        Assert.That(bobEntry.Email, Is.EqualTo("bob@test.com"));
        Assert.That(bobEntry.PhoneNumber, Is.Null); // Not in visible fields
        Assert.That(bobEntry.MembershipTypeName, Is.Null); // Not in visible fields
        Assert.That(bobEntry.JoinDate, Is.Null); // Not in visible fields
    }

    [Test]
    public async Task GetMemberDirectoryAsync_WithSearch_FiltersResults()
    {
        // Arrange
        var (requestingUser, club, _, _) = await CreateTestDataAsync();

        // Act
        var result = await _memberService.GetMemberDirectoryAsync(club.Id, requestingUser.Id, "Alice");

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Members.Count, Is.EqualTo(1));
        Assert.That(result.Members[0].FullName, Is.EqualTo("Alice Visible"));
    }

    [Test]
    public async Task GetMemberDirectoryAsync_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var (requestingUser, club, _, _) = await CreateTestDataAsync();

        // Act
        var result = await _memberService.GetMemberDirectoryAsync(club.Id, requestingUser.Id, null, 1, 2);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Members.Count, Is.EqualTo(2)); // First 2 members
        Assert.That(result.CurrentPage, Is.EqualTo(1));
        Assert.That(result.TotalPages, Is.EqualTo(2)); // 3 total members, 2 per page
        Assert.That(result.HasNextPage, Is.True);
        Assert.That(result.HasPreviousPage, Is.False);
    }

    [Test]
    public async Task GetMemberDirectoryAsync_DirectoryDisabled_ThrowsInvalidOperationException()
    {
        // Arrange
        var (requestingUser, club, _, _) = await CreateTestDataAsync();
        club.IsDirectoryEnabled = false;
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _memberService.GetMemberDirectoryAsync(club.Id, requestingUser.Id));

        Assert.That(ex.Message, Does.Contain("directory is disabled"));
    }

    [Test]
    public async Task GetMemberDirectoryAsync_RequestingMemberNotOptedIn_ThrowsInvalidOperationException()
    {
        // Arrange
        var (_, club, _, _) = await CreateTestDataAsync();

        // Create a non-admin user and member who is not opted in
        var nonAdminUser = new User
        {
            FullName = "Non Admin User",
            Email = "nonadmin@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(nonAdminUser);

        var membershipType = await _context.MembershipTypes.FirstAsync();
        var nonAdminMember = new Member
        {
            Club = club,
            MembershipType = membershipType,
            FullName = nonAdminUser.FullName,
            Email = nonAdminUser.Email,
            PhoneNumber = "(555) 123-9999",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddMonths(-1),
            IsListedInDirectory = false, // Not opted in
            DirectoryVisibleFields = null
        };
        _context.Members.Add(nonAdminMember);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _memberService.GetMemberDirectoryAsync(club.Id, nonAdminUser.Id));

        Assert.That(ex.Message, Does.Contain("opt in to the member directory"));
    }

    [Test]
    public async Task GetMemberDirectoryAsync_AdminUserNotOptedIn_AllowsAccess()
    {
        // Arrange
        var (requestingUser, club, requestingMember, _) = await CreateTestDataAsync();
        // Admin member is not opted in but should still have access
        requestingMember.IsListedInDirectory = false;
        await _context.SaveChangesAsync();

        // Act - Should not throw exception for admin users
        var result = await _memberService.GetMemberDirectoryAsync(club.Id, requestingUser.Id);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Members, Is.Not.Null);
        // Should only show opted-in members (not including the admin who isn't opted in)
        Assert.That(result.Members.Count, Is.EqualTo(2)); // Alice and Bob from test data
    }

    [Test]
    public async Task GetMemberDirectoryAsync_UserNotFound_ThrowsArgumentException()
    {
        // Arrange
        var (_, club, _, _) = await CreateTestDataAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            () => _memberService.GetMemberDirectoryAsync(club.Id, 999));

        Assert.That(ex.Message, Does.Contain("Requesting user not found"));
    }

    [Test]
    public async Task GetMemberDirectoryAsync_UserNotMemberOfClub_ThrowsInvalidOperationException()
    {
        // Arrange
        var (_, club, _, _) = await CreateTestDataAsync();

        // Create user not in this club
        var otherUser = new User
        {
            FullName = "Other User",
            Email = "other@test.com",
            PasswordHash = "hash",
            OnboardingCompleted = true
        };
        _context.Users.Add(otherUser);
        await _context.SaveChangesAsync();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            () => _memberService.GetMemberDirectoryAsync(club.Id, otherUser.Id));

        Assert.That(ex.Message, Does.Contain("not a member of this club"));
    }

    [Test]
    public async Task GetMemberDirectoryAsync_OnlyReturnsActiveMembers()
    {
        // Arrange
        var (requestingUser, club, _, _) = await CreateTestDataAsync();

        // Act
        var result = await _memberService.GetMemberDirectoryAsync(club.Id, requestingUser.Id);

        // Assert
        var memberNames = result.Members.Select(m => m.FullName).ToList();
        Assert.That(memberNames, Does.Not.Contain("David Inactive")); // Archived member should not appear
    }

    [Test]
    public async Task GetMemberDirectoryAsync_RespectsAdminAllowedFields()
    {
        // Arrange
        var (requestingUser, club, _, _) = await CreateTestDataAsync();

        // Admin only allows email and phone
        club.DirectoryAllowedSharableFields = "email,phoneNumber";
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberService.GetMemberDirectoryAsync(club.Id, requestingUser.Id);

        // Assert
        var aliceEntry = result.Members.First(m => m.FullName == "Alice Visible");
        Assert.That(aliceEntry.Email, Is.EqualTo("alice@test.com")); // Allowed and member chose
        Assert.That(aliceEntry.PhoneNumber, Is.EqualTo("(555) 123-2222")); // Allowed and member chose
        Assert.That(aliceEntry.MembershipTypeName, Is.Null); // Member chose but admin doesn't allow
        Assert.That(aliceEntry.JoinDate, Is.Null); // Member chose but admin doesn't allow
    }

    [Test]
    public async Task GetMemberDirectoryAsync_NoAllowedFields_OnlyShowsNames()
    {
        // Arrange
        var (requestingUser, club, _, _) = await CreateTestDataAsync();

        // Admin allows no fields
        club.DirectoryAllowedSharableFields = "";
        await _context.SaveChangesAsync();

        // Act
        var result = await _memberService.GetMemberDirectoryAsync(club.Id, requestingUser.Id);

        // Assert
        var aliceEntry = result.Members.First(m => m.FullName == "Alice Visible");
        Assert.That(aliceEntry.FullName, Is.EqualTo("Alice Visible")); // Name always visible
        Assert.That(aliceEntry.Email, Is.Null);
        Assert.That(aliceEntry.PhoneNumber, Is.Null);
        Assert.That(aliceEntry.MembershipTypeName, Is.Null);
        Assert.That(aliceEntry.JoinDate, Is.Null);
    }
}