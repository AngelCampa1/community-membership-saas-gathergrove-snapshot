using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace GatherGrove.Tests.Application.Services;

/// <summary>
/// Comprehensive test suite for BulkOperationsService
/// Tests batch operations on members including tag assignments, updates, and exports
/// </summary>
public class BulkOperationsServiceTests : IDisposable
{
    private readonly GatherGroveDbContext _context;
    private readonly Mock<ILogger<BulkOperationsService>> _loggerMock;
    private readonly BulkOperationsService _service;

    public BulkOperationsServiceTests()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _loggerMock = new Mock<ILogger<BulkOperationsService>>();
        _service = new BulkOperationsService(_context, _loggerMock.Object);

        SeedTestData();
    }

    [Fact]
    public async Task CreateBulkOperationAsync_ValidRequest_ShouldCreateOperation()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;
        var request = new CreateBulkOperationRequest
        {
            OperationType = "ADD_TAGS",
            MemberIds = new List<int> { 1, 2 },
            Parameters = new Dictionary<string, object>
            {
                { "tagIds", new List<int> { 1, 2 } }
            }
        };

        // Act
        var result = await _service.CreateBulkOperationAsync(clubId, userId, request);

        // Assert
        result.Should().NotBeNull();
        result.OperationType.Should().Be(request.OperationType);
        result.Status.Should().Be("PENDING");
        result.TotalRecords.Should().Be(request.MemberIds.Count);
    }

    [Fact]
    public async Task GetBulkOperationsAsync_ValidClubId_ShouldReturnOperations()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetBulkOperationsAsync(clubId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(o => o.ClubId == clubId).Should().BeTrue();
    }

    [Fact]
    public async Task GetBulkOperationByIdAsync_ValidOperationId_ShouldReturnOperation()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetBulkOperationByIdAsync(clubId, operationId, userId);

        // Assert
        result.Should().NotBeNull();
        result.OperationId.Should().Be(operationId);
        result.ClubId.Should().Be(clubId);
    }

    [Fact]
    public async Task ExecuteBulkAddTagsAsync_ValidRequest_ShouldAssignTags()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;
        var memberIds = new List<int> { 1, 2 };
        var tagIds = new List<int> { 1, 2 };

        // Act
        var result = await _service.ExecuteBulkAddTagsAsync(clubId, operationId, memberIds, tagIds, userId);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("COMPLETED");
        result.ProcessedRecords.Should().Be(memberIds.Count);
        result.SuccessfulRecords.Should().Be(memberIds.Count);

        // Verify tag assignments exist
        var assignments = await _context.MemberTagAssignments
            .Where(a => memberIds.Contains(a.MemberId) && tagIds.Contains(a.TagId) && a.IsActive)
            .CountAsync();
        assignments.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task ExecuteBulkRemoveTagsAsync_ValidRequest_ShouldRemoveTags()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;
        var memberIds = new List<int> { 1 };
        var tagIds = new List<int> { 1 }; // This member has this tag from test data

        // Act
        var result = await _service.ExecuteBulkRemoveTagsAsync(clubId, operationId, memberIds, tagIds, userId);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("COMPLETED");
        result.ProcessedRecords.Should().Be(memberIds.Count);

        // Verify tag assignments are deactivated
        var activeAssignments = await _context.MemberTagAssignments
            .Where(a => memberIds.Contains(a.MemberId) && tagIds.Contains(a.TagId) && a.IsActive)
            .CountAsync();
        activeAssignments.Should().Be(0);
    }

    [Fact]
    public async Task ExecuteBulkUpdateCustomFieldsAsync_ValidRequest_ShouldUpdateFields()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;
        var memberIds = new List<int> { 1, 2 };
        var customFieldUpdates = new Dictionary<int, string>
        {
            { 1, "Updated Value" }
        };

        // Act
        var result = await _service.ExecuteBulkUpdateCustomFieldsAsync(clubId, operationId, memberIds, customFieldUpdates, userId);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("COMPLETED");
        result.ProcessedRecords.Should().Be(memberIds.Count);

        // Verify custom field values are updated/created
        var fieldValues = await _context.MemberCustomFieldValues
            .Where(v => memberIds.Contains(v.MemberId) && v.CustomFieldId == 1)
            .ToListAsync();
        fieldValues.Should().NotBeEmpty();
        fieldValues.All(v => v.Value == "Updated Value").Should().BeTrue();
    }

    [Fact]
    public async Task ExecuteBulkExportMembersAsync_ValidRequest_ShouldCreateExportData()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;
        var memberIds = new List<int> { 1, 2 };
        var exportFormat = "CSV";
        var includeFields = new List<string> { "FullName", "Email", "MembershipType" };

        // Act
        var result = await _service.ExecuteBulkExportMembersAsync(clubId, operationId, memberIds, exportFormat, includeFields, userId);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("COMPLETED");
        result.ProcessedRecords.Should().Be(memberIds.Count);
        result.ExportData.Should().NotBeNull();
        result.ExportData.Should().Contain("FullName"); // CSV header
    }

    [Fact]
    public async Task ExecuteBulkDeleteMembersAsync_ValidRequest_ShouldSoftDeleteMembers()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;
        var memberIds = new List<int> { 2 }; // Delete member 2 to avoid affecting other tests

        // Act
        var result = await _service.ExecuteBulkDeleteMembersAsync(clubId, operationId, memberIds, userId);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("COMPLETED");
        result.ProcessedRecords.Should().Be(memberIds.Count);

        // Verify members are soft deleted
        var deletedMembers = await _context.Members
            .Where(m => memberIds.Contains(m.Id))
            .ToListAsync();
        deletedMembers.All(m => !m.IsActive).Should().BeTrue();
    }

    [Fact]
    public async Task ExecuteBulkUpdateMembershipTypeAsync_ValidRequest_ShouldUpdateMembershipTypes()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;
        var memberIds = new List<int> { 1, 2 };
        const int newMembershipTypeId = 2; // Assuming we have this membership type

        // Create new membership type for test
        var newMembershipType = new MembershipType
        {
            Id = 2,
            ClubId = 1,
            TypeName = "Premium",
            MembershipFee = 100.0m
        };
        _context.MembershipTypes.Add(newMembershipType);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ExecuteBulkUpdateMembershipTypeAsync(clubId, operationId, memberIds, newMembershipTypeId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("COMPLETED");
        result.ProcessedRecords.Should().Be(memberIds.Count);

        // Verify membership types are updated
        var updatedMembers = await _context.Members
            .Where(m => memberIds.Contains(m.Id))
            .ToListAsync();
        updatedMembers.All(m => m.MembershipTypeId == newMembershipTypeId).Should().BeTrue();
    }

    [Fact]
    public async Task GetBulkOperationProgressAsync_ValidOperationId_ShouldReturnProgress()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetBulkOperationProgressAsync(clubId, operationId, userId);

        // Assert
        result.Should().NotBeNull();
        result.OperationId.Should().Be(operationId);
        result.ProgressPercentage.Should().BeInRange(0, 100);
    }

    [Fact]
    public async Task CancelBulkOperationAsync_PendingOperation_ShouldCancel()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 1;
        const int userId = 1;

        // Act
        var result = await _service.CancelBulkOperationAsync(clubId, operationId, userId);

        // Assert
        result.Should().BeTrue();

        // Verify operation status is cancelled
        var operation = await _context.BulkOperations.FindAsync(operationId);
        operation.Should().NotBeNull();
        operation.Status.Should().Be("CANCELLED");
    }

    [Fact]
    public async Task CancelBulkOperationAsync_CompletedOperation_ShouldThrowException()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 2; // Completed operation from test data
        const int userId = 1;

        // Act & Assert
        await _service.Invoking(s => s.CancelBulkOperationAsync(clubId, operationId, userId))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*cannot be cancelled*");
    }

    [Fact]
    public async Task RetryBulkOperationAsync_FailedOperation_ShouldRetry()
    {
        // Arrange
        const int clubId = 1;
        const int operationId = 3; // Failed operation from test data
        const int userId = 1;

        // Act
        var result = await _service.RetryBulkOperationAsync(clubId, operationId, userId);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("PENDING");
        result.RetryCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetBulkOperationHistoryAsync_ValidClubId_ShouldReturnHistory()
    {
        // Arrange
        const int clubId = 1;
        const int userId = 1;

        // Act
        var result = await _service.GetBulkOperationHistoryAsync(clubId, userId, 30); // Last 30 days

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterThan(0);
        result.All(o => o.ClubId == clubId).Should().BeTrue();
    }

    private void SeedTestData()
    {
        // Create test club
        var club = new Club
        {
            Id = 1,
            ClubName = "Test Club",
            CreatedAt = DateTime.UtcNow
        };
        _context.Clubs.Add(club);

        // Create test user
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            FullName = "Test User"
        };
        _context.Users.Add(user);

        // Create test membership type
        var membershipType = new MembershipType
        {
            Id = 1,
            ClubId = 1,
            TypeName = "Standard",
            MembershipFee = 50.0m
        };
        _context.MembershipTypes.Add(membershipType);

        // Create test members
        var member1 = new Member
        {
            Id = 1,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Test Member 1",
            Email = "member1@example.com",
            IsActive = true
        };
        var member2 = new Member
        {
            Id = 2,
            ClubId = 1,
            MembershipTypeId = 1,
            FullName = "Test Member 2",
            Email = "member2@example.com",
            IsActive = true
        };
        _context.Members.AddRange(member1, member2);

        // Create test tags
        var tag1 = new MemberTag
        {
            Id = 1,
            ClubId = 1,
            Name = "VIP Member",
            Description = "High-value member",
            Color = "#FF0000",
            CreatedByUserId = 1
        };
        var tag2 = new MemberTag
        {
            Id = 2,
            ClubId = 1,
            Name = "Active",
            Description = "Active member",
            Color = "#00FF00",
            CreatedByUserId = 1
        };
        _context.MemberTags.AddRange(tag1, tag2);

        // Create test custom field
        var customField = new MemberCustomField
        {
            Id = 1,
            ClubId = 1,
            FieldName = "Test Field",
            FieldType = "Text",
            CreatedBy = 1
        };
        _context.MemberCustomFields.Add(customField);

        // Create test tag assignment
        var assignment = new MemberTagAssignment
        {
            Id = 1,
            MemberId = 1,
            TagId = 1,
            AssignedByUserId = 1,
            AssignedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.MemberTagAssignments.Add(assignment);

        // Create test bulk operations
        var operation1 = new BulkOperation
        {
            Id = 1,
            ClubId = 1,
            OperationType = "ADD_TAGS",
            Status = "PENDING",
            InitiatedBy = 1,
            TotalRecords = 2
        };
        var operation2 = new BulkOperation
        {
            Id = 2,
            ClubId = 1,
            OperationType = "REMOVE_TAGS",
            Status = "COMPLETED",
            InitiatedBy = 1,
            TotalRecords = 1,
            ProcessedRecords = 1,
            SuccessfulRecords = 1
        };
        var operation3 = new BulkOperation
        {
            Id = 3,
            ClubId = 1,
            OperationType = "UPDATE_CUSTOM_FIELDS",
            Status = "FAILED",
            InitiatedBy = 1,
            TotalRecords = 2,
            ProcessedRecords = 1,
            FailedRecords = 1,
            ErrorMessage = "Test error"
        };
        _context.BulkOperations.AddRange(operation1, operation2, operation3);

        // Create club admin relationship
        var clubAdmin = new ClubAdmin
        {
            ClubId = 1,
            UserId = 1
        };
        _context.ClubAdmins.Add(clubAdmin);

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}