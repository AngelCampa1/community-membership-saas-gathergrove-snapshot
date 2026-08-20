using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using GatherGrove.Application.DTOs.Locations;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class MemberTransferServiceTests
{
    private GatherGroveDbContext _context = null!;
    private MemberTransferService _service = null!;
    private Mock<ILogger<MemberTransferService>> _mockLogger = null!;

    private int _testClubId;
    private int _testLocation1Id;
    private int _testLocation2Id;
    private int _testMemberId;
    private int _testAdminUserId;
    private int _testLocationAdminUserId;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _mockLogger = new Mock<ILogger<MemberTransferService>>();
        _service = new MemberTransferService(_context, _mockLogger.Object);

        SetupTestData();
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    private void SetupTestData()
    {
        // Create test club
        var club = new Club
        {
            Name = "Test Club",
            Tier = "Enterprise",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);
        _context.SaveChanges();
        _testClubId = club.Id;

        // Create test users
        var adminUser = new User
        {
            FullName = "Club Admin",
            Email = "admin@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var locationAdminUser = new User
        {
            FullName = "Location Admin",
            Email = "locationadmin@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(adminUser, locationAdminUser);
        _context.SaveChanges();
        _testAdminUserId = adminUser.Id;
        _testLocationAdminUserId = locationAdminUser.Id;

        // Create club admin
        var clubAdmin = new ClubAdmin
        {
            ClubId = _testClubId,
            UserId = _testAdminUserId,
            CreatedAt = DateTime.UtcNow
        };
        _context.ClubAdmins.Add(clubAdmin);

        // Create test locations
        var location1 = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Location 1",
            Address = "123 Test St",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var location2 = new ClubLocation
        {
            ParentClubId = _testClubId,
            LocationName = "Location 2",
            Address = "456 Test Ave",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.ClubLocations.AddRange(location1, location2);
        _context.SaveChanges();
        _testLocation1Id = location1.Id;
        _testLocation2Id = location2.Id;

        // Create location admin for location 2
        var locationAdmin = new LocationAdmin
        {
            LocationId = _testLocation2Id,
            UserId = _testLocationAdminUserId,
            PermissionLevel = LocationPermissionLevel.LocationAdmin
        };
        _context.LocationAdmins.Add(locationAdmin);

        // Create test membership type
        var membershipType = new MembershipType
        {
            ClubId = _testClubId,
            Name = "Standard",
            Description = "Standard membership",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.MembershipTypes.Add(membershipType);
        _context.SaveChanges();

        // Create test member at location 1
        var member = new Member
        {
            ClubId = _testClubId,
            MembershipTypeId = membershipType.Id,
            LocationId = _testLocation1Id,
            FullName = "Test Member",
            Email = "member@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddMonths(-6),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(member);
        _context.SaveChanges();
        _testMemberId = member.Id;
    }

    #region RequestTransferAsync Tests

    [Test]
    public async Task RequestTransferAsync_ValidRequest_CreatesTransfer()
    {
        // Arrange
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = _testLocation2Id,
            TransferReason = "Relocation"
        };

        // Act
        var result = await _service.RequestTransferAsync(_testMemberId, _testAdminUserId, request);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Status, Is.EqualTo(MemberTransferStatus.Pending));
        Assert.That(result.ToLocationId, Is.EqualTo(_testLocation2Id));
    }

    [Test]
    public async Task RequestTransferAsync_ValidRequest_SavesTransferToDatabase()
    {
        // Arrange
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = _testLocation2Id,
            TransferReason = "Job change"
        };

        // Act
        await _service.RequestTransferAsync(_testMemberId, _testAdminUserId, request);

        // Assert
        var savedTransfer = await _context.MemberTransfers.FirstOrDefaultAsync();
        Assert.That(savedTransfer, Is.Not.Null);
        Assert.That(savedTransfer!.MemberId, Is.EqualTo(_testMemberId));
        Assert.That(savedTransfer.TransferReason, Is.EqualTo("Job change"));
    }

    [Test]
    public void RequestTransferAsync_MemberNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateMemberTransferRequest { ToLocationId = _testLocation2Id };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.RequestTransferAsync(999, _testAdminUserId, request));
        Assert.That(ex!.Message, Does.Contain("Member 999 not found"));
    }

    [Test]
    public void RequestTransferAsync_MemberNotAtLocation_ThrowsInvalidOperationException()
    {
        // Arrange - Create member without location
        var memberWithoutLocation = new Member
        {
            ClubId = _testClubId,
            MembershipTypeId = _context.MembershipTypes.First().Id,
            LocationId = null,
            FullName = "No Location Member",
            Email = "nolocation@test.com",
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Members.Add(memberWithoutLocation);
        _context.SaveChanges();

        var request = new CreateMemberTransferRequest { ToLocationId = _testLocation2Id };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.RequestTransferAsync(memberWithoutLocation.Id, _testAdminUserId, request));
        Assert.That(ex!.Message, Does.Contain("not assigned to a location"));
    }

    [Test]
    public void RequestTransferAsync_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange - User with no admin permissions
        var unauthorizedUser = new User
        {
            FullName = "Regular User",
            Email = "regular@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(unauthorizedUser);
        _context.SaveChanges();

        var request = new CreateMemberTransferRequest { ToLocationId = _testLocation2Id };

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.RequestTransferAsync(_testMemberId, unauthorizedUser.Id, request));
        Assert.That(ex!.Message, Does.Contain("do not have permission"));
    }

    [Test]
    public void RequestTransferAsync_TargetLocationNotFound_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateMemberTransferRequest { ToLocationId = 999 };

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.RequestTransferAsync(_testMemberId, _testAdminUserId, request));
        Assert.That(ex!.Message, Does.Contain("Target location 999 not found"));
    }

    [Test]
    public void RequestTransferAsync_SameLocation_ThrowsInvalidOperationException()
    {
        // Arrange - Transfer to same location
        var request = new CreateMemberTransferRequest { ToLocationId = _testLocation1Id };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.RequestTransferAsync(_testMemberId, _testAdminUserId, request));
        Assert.That(ex!.Message, Does.Contain("already at the target location"));
    }

    [Test]
    public async Task RequestTransferAsync_PendingTransferExists_ThrowsInvalidOperationException()
    {
        // Arrange - Create pending transfer
        var pendingTransfer = new MemberTransfer
        {
            MemberId = _testMemberId,
            FromLocationId = _testLocation1Id,
            ToLocationId = _testLocation2Id,
            Status = MemberTransferStatus.Pending,
            RequestedAt = DateTime.UtcNow,
            RequestedBy = _testAdminUserId
        };
        _context.MemberTransfers.Add(pendingTransfer);
        await _context.SaveChangesAsync();

        var request = new CreateMemberTransferRequest { ToLocationId = _testLocation2Id };

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.RequestTransferAsync(_testMemberId, _testAdminUserId, request));
        Assert.That(ex!.Message, Does.Contain("pending transfer request"));
    }

    [Test]
    public async Task RequestTransferAsync_LogsInformation()
    {
        // Arrange
        var request = new CreateMemberTransferRequest
        {
            ToLocationId = _testLocation2Id,
            TransferReason = "Test"
        };

        // Act
        await _service.RequestTransferAsync(_testMemberId, _testAdminUserId, request);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Creating transfer request")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region ApproveTransferAsync Tests

    [Test]
    public async Task ApproveTransferAsync_ValidTransfer_ApprovedAndExecuted()
    {
        // Arrange
        var transfer = await CreatePendingTransfer();
        var approveRequest = new ApproveTransferRequest { ApprovalNotes = "Approved" };

        // Act
        var result = await _service.ApproveTransferAsync(transfer.Id, _testAdminUserId, approveRequest);

        // Assert
        Assert.That(result.Status, Is.EqualTo(MemberTransferStatus.Approved));
        Assert.That(result.ApprovedBy, Is.EqualTo(_testAdminUserId));
    }

    [Test]
    public async Task ApproveTransferAsync_ValidTransfer_UpdatesMemberLocation()
    {
        // Arrange
        var transfer = await CreatePendingTransfer();
        var approveRequest = new ApproveTransferRequest { ApprovalNotes = "Moving member" };

        // Act
        await _service.ApproveTransferAsync(transfer.Id, _testAdminUserId, approveRequest);

        // Assert
        var member = await _context.Members.FindAsync(_testMemberId);
        Assert.That(member!.LocationId, Is.EqualTo(_testLocation2Id));
    }

    [Test]
    public void ApproveTransferAsync_TransferNotFound_ThrowsArgumentException()
    {
        // Arrange
        var approveRequest = new ApproveTransferRequest();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.ApproveTransferAsync(999, _testAdminUserId, approveRequest));
        Assert.That(ex!.Message, Does.Contain("Transfer 999 not found"));
    }

    [Test]
    public async Task ApproveTransferAsync_AlreadyApproved_ThrowsInvalidOperationException()
    {
        // Arrange
        var transfer = await CreatePendingTransfer();
        transfer.Status = MemberTransferStatus.Approved;
        await _context.SaveChangesAsync();

        var approveRequest = new ApproveTransferRequest();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.ApproveTransferAsync(transfer.Id, _testAdminUserId, approveRequest));
        Assert.That(ex!.Message, Does.Contain("already Approved"));
    }

    [Test]
    public async Task ApproveTransferAsync_LogsInformation()
    {
        // Arrange
        var transfer = await CreatePendingTransfer();
        var approveRequest = new ApproveTransferRequest();

        // Act
        await _service.ApproveTransferAsync(transfer.Id, _testAdminUserId, approveRequest);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Approving transfer")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region DenyTransferAsync Tests

    [Test]
    public async Task DenyTransferAsync_ValidTransfer_DeniesTransfer()
    {
        // Arrange
        var transfer = await CreatePendingTransfer();
        var denyRequest = new DenyTransferRequest { DenialReason = "Not enough capacity" };

        // Act
        var result = await _service.DenyTransferAsync(transfer.Id, _testAdminUserId, denyRequest);

        // Assert
        Assert.That(result.Status, Is.EqualTo(MemberTransferStatus.Denied));
        Assert.That(result.ApprovalNotes, Is.EqualTo("Not enough capacity"));
    }

    [Test]
    public async Task DenyTransferAsync_ValidTransfer_DoesNotChangeMemberLocation()
    {
        // Arrange
        var transfer = await CreatePendingTransfer();
        var originalLocationId = (await _context.Members.FindAsync(_testMemberId))!.LocationId;
        var denyRequest = new DenyTransferRequest { DenialReason = "Denied" };

        // Act
        await _service.DenyTransferAsync(transfer.Id, _testAdminUserId, denyRequest);

        // Assert
        var member = await _context.Members.FindAsync(_testMemberId);
        Assert.That(member!.LocationId, Is.EqualTo(originalLocationId));
    }

    [Test]
    public void DenyTransferAsync_TransferNotFound_ThrowsArgumentException()
    {
        // Arrange
        var denyRequest = new DenyTransferRequest();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.DenyTransferAsync(999, _testAdminUserId, denyRequest));
        Assert.That(ex!.Message, Does.Contain("Transfer 999 not found"));
    }

    [Test]
    public async Task DenyTransferAsync_AlreadyDenied_ThrowsInvalidOperationException()
    {
        // Arrange
        var transfer = await CreatePendingTransfer();
        transfer.Status = MemberTransferStatus.Denied;
        await _context.SaveChangesAsync();

        var denyRequest = new DenyTransferRequest();

        // Act & Assert
        var ex = Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.DenyTransferAsync(transfer.Id, _testAdminUserId, denyRequest));
        Assert.That(ex!.Message, Does.Contain("already Denied"));
    }

    #endregion

    #region GetPendingTransfersAsync Tests

    [Test]
    public async Task GetPendingTransfersAsync_WithPendingTransfers_ReturnsTransfers()
    {
        // Arrange
        await CreatePendingTransfer();

        // Act
        var results = await _service.GetPendingTransfersAsync(_testLocation2Id, _testAdminUserId);

        // Assert
        Assert.That(results.Count, Is.EqualTo(1));
        Assert.That(results[0].Status, Is.EqualTo(MemberTransferStatus.Pending));
    }

    [Test]
    public async Task GetPendingTransfersAsync_NoPendingTransfers_ReturnsEmptyList()
    {
        // Act
        var results = await _service.GetPendingTransfersAsync(_testLocation2Id, _testAdminUserId);

        // Assert
        Assert.That(results, Is.Empty);
    }

    [Test]
    public void GetPendingTransfersAsync_LocationNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.GetPendingTransfersAsync(999, _testAdminUserId));
        Assert.That(ex!.Message, Does.Contain("Location 999 not found"));
    }

    [Test]
    public void GetPendingTransfersAsync_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var unauthorizedUser = new User
        {
            FullName = "Regular User",
            Email = "regular2@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(unauthorizedUser);
        _context.SaveChanges();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.GetPendingTransfersAsync(_testLocation2Id, unauthorizedUser.Id));
        Assert.That(ex!.Message, Does.Contain("do not have permission"));
    }

    #endregion

    #region GetTransferHistoryAsync Tests

    [Test]
    public async Task GetTransferHistoryAsync_WithHistory_ReturnsTransfers()
    {
        // Arrange
        await CreatePendingTransfer();

        // Act
        var results = await _service.GetTransferHistoryAsync(_testMemberId, _testAdminUserId);

        // Assert
        Assert.That(results.Count, Is.EqualTo(1));
    }

    [Test]
    public async Task GetTransferHistoryAsync_NoHistory_ReturnsEmptyList()
    {
        // Act
        var results = await _service.GetTransferHistoryAsync(_testMemberId, _testAdminUserId);

        // Assert
        Assert.That(results, Is.Empty);
    }

    [Test]
    public void GetTransferHistoryAsync_MemberNotFound_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.GetTransferHistoryAsync(999, _testAdminUserId));
        Assert.That(ex!.Message, Does.Contain("Member 999 not found"));
    }

    [Test]
    public void GetTransferHistoryAsync_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var unauthorizedUser = new User
        {
            FullName = "Regular User",
            Email = "regular3@test.com",
            PasswordHash = "hash",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(unauthorizedUser);
        _context.SaveChanges();

        // Act & Assert
        var ex = Assert.ThrowsAsync<UnauthorizedAccessException>(
            async () => await _service.GetTransferHistoryAsync(_testMemberId, unauthorizedUser.Id));
        Assert.That(ex!.Message, Does.Contain("do not have permission"));
    }

    #endregion

    #region Helper Methods

    private async Task<MemberTransfer> CreatePendingTransfer()
    {
        var transfer = new MemberTransfer
        {
            MemberId = _testMemberId,
            FromLocationId = _testLocation1Id,
            ToLocationId = _testLocation2Id,
            TransferReason = "Test transfer",
            Status = MemberTransferStatus.Pending,
            RequestedAt = DateTime.UtcNow,
            RequestedBy = _testAdminUserId
        };
        _context.MemberTransfers.Add(transfer);
        await _context.SaveChangesAsync();
        return transfer;
    }

    #endregion
}
