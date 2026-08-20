using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Core.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Services
{
    [TestFixture]
    public class BulkOperationsServiceTests
    {
        private Mock<ILogger<BulkOperationsService>> _mockLogger;
        private Mock<ITierValidationService> _mockTierValidation;
        private BulkOperationsService _service;
        private DbContextOptions<ApplicationDbContext> _dbOptions;
        private ApplicationDbContext _context;

        [SetUp]
        public void SetUp()
        {
            _mockLogger = new Mock<ILogger<BulkOperationsService>>();
            _mockTierValidation = new Mock<ITierValidationService>();

            // Setup in-memory database for testing
            _dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(_dbOptions);

            // Setup default tier validation to pass
            _mockTierValidation
                .Setup(x => x.ValidateUnlimitedTierAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _service = new BulkOperationsService(
                _context,
                _mockLogger.Object,
                _mockTierValidation.Object
            );
        }

        [TearDown]
        public void TearDown()
        {
            _context?.Dispose();
        }

        #region Tier Validation Tests

        [Test]
        public async Task BulkUpdateMembersAsync_ValidatesUnlimitedTier()
        {
            // Arrange
            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { 1, 2, 3 },
                Updates = new Dictionary<string, object> { { "Status", "Active" } }
            };

            // Act & Assert
            await _service.BulkUpdateMembersAsync(request);

            _mockTierValidation.Verify(
                x => x.ValidateUnlimitedTierAsync(1),
                Times.Once
            );
        }

        [Test]
        public void BulkUpdateMembersAsync_ThrowsWhenTierValidationFails()
        {
            // Arrange
            _mockTierValidation
                .Setup(x => x.ValidateUnlimitedTierAsync(It.IsAny<int>()))
                .ThrowsAsync(new UnauthorizedAccessException("Unlimited tier required"));

            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { 1, 2, 3 },
                Updates = new Dictionary<string, object> { { "Status", "Active" } }
            };

            // Act & Assert
            Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _service.BulkUpdateMembersAsync(request)
            );
        }

        #endregion

        #region Bulk Update Members Tests

        [Test]
        public async Task BulkUpdateMembersAsync_ValidRequest_UpdatesAllMembers()
        {
            // Arrange
            var members = new List<Member>
            {
                new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com", Status = "Inactive" },
                new Member { ClubId = 1, FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", Status = "Inactive" },
                new Member { ClubId = 1, FirstName = "Bob", LastName = "Johnson", Email = "bob@example.com", Status = "Inactive" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = members.Select(m => m.Id).ToList(),
                Updates = new Dictionary<string, object>
                {
                    { "Status", "Active" },
                    { "Notes", "Bulk updated" }
                },
                UpdatedByUserId = 1
            };

            // Act
            var result = await _service.BulkUpdateMembersAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(3, result.ProcessedCount);
            Assert.AreEqual(3, result.SuccessCount);
            Assert.AreEqual(0, result.FailedCount);

            // Verify updates were applied
            var updatedMembers = await _context.Members.Where(m => members.Select(mem => mem.Id).Contains(m.Id)).ToListAsync();
            Assert.IsTrue(updatedMembers.All(m => m.Status == "Active"));
        }

        [Test]
        public async Task BulkUpdateMembersAsync_PartialFailure_ReturnsCorrectCounts()
        {
            // Arrange
            var members = new List<Member>
            {
                new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com", Status = "Active" },
                new Member { ClubId = 1, FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", Status = "Active" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { members[0].Id, 999 }, // Include non-existent member
                Updates = new Dictionary<string, object> { { "Status", "Inactive" } },
                UpdatedByUserId = 1
            };

            // Act
            var result = await _service.BulkUpdateMembersAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.ProcessedCount);
            Assert.AreEqual(1, result.SuccessCount);
            Assert.AreEqual(1, result.FailedCount);
            Assert.AreEqual(1, result.Errors.Count);
        }

        [Test]
        public void BulkUpdateMembersAsync_EmptyMemberIds_ThrowsArgumentException()
        {
            // Arrange
            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int>(), // Empty list
                Updates = new Dictionary<string, object> { { "Status", "Active" } },
                UpdatedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(
                () => _service.BulkUpdateMembersAsync(request)
            );
        }

        [Test]
        public void BulkUpdateMembersAsync_TooManyMembers_ThrowsArgumentException()
        {
            // Arrange
            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = Enumerable.Range(1, 10001).ToList(), // Exceed max limit
                Updates = new Dictionary<string, object> { { "Status", "Active" } },
                UpdatedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(
                () => _service.BulkUpdateMembersAsync(request)
            );
        }

        #endregion

        #region Bulk Add Tags Tests

        [Test]
        public async Task BulkAddTagsAsync_ValidRequest_AddsTagsToMembers()
        {
            // Arrange
            var members = new List<Member>
            {
                new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com" },
                new Member { ClubId = 1, FirstName = "Jane", LastName = "Smith", Email = "jane@example.com" }
            };

            var tags = new List<Tag>
            {
                new Tag { ClubId = 1, Name = "VIP", Color = "#FF0000" },
                new Tag { ClubId = 1, Name = "Active", Color = "#00FF00" }
            };

            _context.Members.AddRange(members);
            _context.Tags.AddRange(tags);
            await _context.SaveChangesAsync();

            var request = new BulkAddTagsRequest
            {
                ClubId = 1,
                MemberIds = members.Select(m => m.Id).ToList(),
                TagIds = tags.Select(t => t.Id).ToList(),
                AddedByUserId = 1
            };

            // Act
            var result = await _service.BulkAddTagsAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.ProcessedMemberCount);
            Assert.AreEqual(4, result.TagAssignmentsCreated); // 2 members * 2 tags

            // Verify tag assignments were created
            var assignments = await _context.TagAssignments.CountAsync();
            Assert.AreEqual(4, assignments);
        }

        [Test]
        public async Task BulkAddTagsAsync_DuplicateAssignments_SkipsDuplicates()
        {
            // Arrange
            var member = new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com" };
            var tag = new Tag { ClubId = 1, Name = "VIP", Color = "#FF0000" };

            _context.Members.Add(member);
            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();

            // Add existing assignment
            _context.TagAssignments.Add(new TagAssignment
            {
                MemberId = member.Id,
                TagId = tag.Id,
                AssignedByUserId = 1,
                AssignedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var request = new BulkAddTagsRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { member.Id },
                TagIds = new List<int> { tag.Id },
                AddedByUserId = 1
            };

            // Act
            var result = await _service.BulkAddTagsAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.ProcessedMemberCount);
            Assert.AreEqual(0, result.TagAssignmentsCreated); // No new assignments
            Assert.AreEqual(1, result.DuplicatesSkipped);
        }

        #endregion

        #region Bulk Remove Tags Tests

        [Test]
        public async Task BulkRemoveTagsAsync_ValidRequest_RemovesTagsFromMembers()
        {
            // Arrange
            var member = new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com" };
            var tag = new Tag { ClubId = 1, Name = "VIP", Color = "#FF0000" };

            _context.Members.Add(member);
            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();

            _context.TagAssignments.Add(new TagAssignment
            {
                MemberId = member.Id,
                TagId = tag.Id,
                AssignedByUserId = 1,
                AssignedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var request = new BulkRemoveTagsRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { member.Id },
                TagIds = new List<int> { tag.Id },
                RemovedByUserId = 1
            };

            // Act
            var result = await _service.BulkRemoveTagsAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.ProcessedMemberCount);
            Assert.AreEqual(1, result.TagAssignmentsRemoved);

            // Verify assignment was removed
            var assignments = await _context.TagAssignments.CountAsync();
            Assert.AreEqual(0, assignments);
        }

        #endregion

        #region Bulk Delete Members Tests

        [Test]
        public async Task BulkDeleteMembersAsync_ValidRequest_SoftDeletesMembers()
        {
            // Arrange
            var members = new List<Member>
            {
                new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com", Status = "Active" },
                new Member { ClubId = 1, FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", Status = "Active" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new BulkDeleteMembersRequest
            {
                ClubId = 1,
                MemberIds = members.Select(m => m.Id).ToList(),
                DeletedByUserId = 1,
                Reason = "Bulk deletion test"
            };

            // Act
            var result = await _service.BulkDeleteMembersAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.ProcessedCount);
            Assert.AreEqual(2, result.SuccessCount);

            // Verify members are soft deleted
            var deletedMembers = await _context.Members.Where(m => members.Select(mem => mem.Id).Contains(m.Id)).ToListAsync();
            Assert.IsTrue(deletedMembers.All(m => m.IsDeleted));
        }

        [Test]
        public async Task BulkDeleteMembersAsync_WithDependencies_HandlesGracefully()
        {
            // Arrange
            var member = new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com" };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            // Add dependencies (events, payments, etc.)
            _context.Events.Add(new Event
            {
                ClubId = 1,
                Title = "Test Event",
                Description = "Test",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddHours(2),
                CreatedByUserId = member.Id
            });
            await _context.SaveChangesAsync();

            var request = new BulkDeleteMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { member.Id },
                DeletedByUserId = 1,
                Reason = "Test deletion with dependencies"
            };

            // Act
            var result = await _service.BulkDeleteMembersAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.ProcessedCount);
            Assert.AreEqual(1, result.SuccessCount);

            // Member should be soft deleted despite having dependencies
            var deletedMember = await _context.Members.FindAsync(member.Id);
            Assert.IsTrue(deletedMember.IsDeleted);
        }

        #endregion

        #region Performance Tests

        [Test]
        public async Task BulkUpdateMembersAsync_LargeDataset_CompletesInReasonableTime()
        {
            // Arrange - Create 10,000 test members
            var largeDatasetSize = 10000;
            var members = new List<Member>();

            for (int i = 0; i < largeDatasetSize; i++)
            {
                members.Add(new Member
                {
                    ClubId = 1,
                    FirstName = $"Member{i}",
                    LastName = "Test",
                    Email = $"member{i}@example.com",
                    Status = "Inactive"
                });
            }

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = members.Select(m => m.Id).ToList(),
                Updates = new Dictionary<string, object> { { "Status", "Active" } },
                UpdatedByUserId = 1
            };

            var startTime = DateTime.UtcNow;

            // Act
            var result = await _service.BulkUpdateMembersAsync(request);

            // Assert
            var duration = DateTime.UtcNow - startTime;
            Assert.IsNotNull(result);
            Assert.AreEqual(largeDatasetSize, result.SuccessCount);
            Assert.Less(duration.TotalSeconds, 30.0, "Bulk update of 10k members should complete under 30 seconds");
        }

        [Test]
        public async Task BulkAddTagsAsync_LargeDataset_HandlesMemoryEfficiently()
        {
            // Arrange
            var memberCount = 5000;
            var tagCount = 10;

            var members = new List<Member>();
            for (int i = 0; i < memberCount; i++)
            {
                members.Add(new Member
                {
                    ClubId = 1,
                    FirstName = $"Member{i}",
                    LastName = "Test",
                    Email = $"member{i}@example.com"
                });
            }

            var tags = new List<Tag>();
            for (int i = 0; i < tagCount; i++)
            {
                tags.Add(new Tag
                {
                    ClubId = 1,
                    Name = $"Tag{i}",
                    Color = $"#FF00{i:X2}"
                });
            }

            _context.Members.AddRange(members);
            _context.Tags.AddRange(tags);
            await _context.SaveChangesAsync();

            var request = new BulkAddTagsRequest
            {
                ClubId = 1,
                MemberIds = members.Select(m => m.Id).ToList(),
                TagIds = tags.Select(t => t.Id).ToList(),
                AddedByUserId = 1
            };

            var initialMemory = GC.GetTotalMemory(true);

            // Act
            var result = await _service.BulkAddTagsAsync(request);

            // Assert
            var finalMemory = GC.GetTotalMemory(true);
            var memoryIncrease = finalMemory - initialMemory;

            Assert.IsNotNull(result);
            Assert.AreEqual(memberCount * tagCount, result.TagAssignmentsCreated);
            Assert.Less(memoryIncrease, 100 * 1024 * 1024, "Memory increase should be less than 100MB for bulk tag operations");
        }

        #endregion

        #region Batch Processing Tests

        [Test]
        public async Task BulkUpdateMembersAsync_ProcessesInBatches_ForLargeDatasets()
        {
            // Arrange
            var largeDatasetSize = 2500; // Should trigger batch processing
            var members = new List<Member>();

            for (int i = 0; i < largeDatasetSize; i++)
            {
                members.Add(new Member
                {
                    ClubId = 1,
                    FirstName = $"Member{i}",
                    LastName = "Test",
                    Email = $"member{i}@example.com",
                    Status = "Inactive"
                });
            }

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = members.Select(m => m.Id).ToList(),
                Updates = new Dictionary<string, object> { { "Status", "Active" } },
                UpdatedByUserId = 1
            };

            // Act
            var result = await _service.BulkUpdateMembersAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(largeDatasetSize, result.SuccessCount);
            Assert.IsTrue(result.BatchesProcessed > 1, "Large dataset should be processed in multiple batches");
        }

        #endregion

        #region Error Handling Tests

        [Test]
        public async Task BulkUpdateMembersAsync_DatabaseError_HandlesGracefully()
        {
            // Arrange
            var member = new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com" };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { member.Id },
                Updates = new Dictionary<string, object> { { "InvalidColumn", "Value" } }, // Invalid column
                UpdatedByUserId = 1
            };

            // Act & Assert
            var result = await _service.BulkUpdateMembersAsync(request);
            
            // Should handle error gracefully and report failed updates
            Assert.IsNotNull(result);
            Assert.AreEqual(0, result.SuccessCount);
            Assert.AreEqual(1, result.FailedCount);
            Assert.IsTrue(result.Errors.Any());
        }

        [Test]
        public async Task BulkDeleteMembersAsync_ConcurrentModification_HandlesConflicts()
        {
            // Arrange
            var member = new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com" };
            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            var request = new BulkDeleteMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { member.Id },
                DeletedByUserId = 1,
                Reason = "Test concurrent modification"
            };

            // Simulate concurrent modification
            using (var concurrentContext = new ApplicationDbContext(_dbOptions))
            {
                var concurrentMember = await concurrentContext.Members.FindAsync(member.Id);
                concurrentMember.Status = "Modified";
                await concurrentContext.SaveChangesAsync();
            }

            // Act
            var result = await _service.BulkDeleteMembersAsync(request);

            // Assert
            Assert.IsNotNull(result);
            // Should still succeed despite concurrent modification
            Assert.AreEqual(1, result.SuccessCount);
        }

        #endregion

        #region Validation Tests

        [Test]
        public void BulkUpdateMembersAsync_InvalidUpdates_ThrowsValidationException()
        {
            // Arrange
            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { 1 },
                Updates = new Dictionary<string, object>(), // Empty updates
                UpdatedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(
                () => _service.BulkUpdateMembersAsync(request)
            );
        }

        [Test]
        public void BulkAddTagsAsync_EmptyTagIds_ThrowsArgumentException()
        {
            // Arrange
            var request = new BulkAddTagsRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { 1 },
                TagIds = new List<int>(), // Empty tag IDs
                AddedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(
                () => _service.BulkAddTagsAsync(request)
            );
        }

        [Test]
        public void BulkDeleteMembersAsync_EmptyReason_ThrowsArgumentException()
        {
            // Arrange
            var request = new BulkDeleteMembersRequest
            {
                ClubId = 1,
                MemberIds = new List<int> { 1 },
                DeletedByUserId = 1,
                Reason = "" // Empty reason
            };

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(
                () => _service.BulkDeleteMembersAsync(request)
            );
        }

        #endregion

        #region Transaction and Consistency Tests

        [Test]
        public async Task BulkUpdateMembersAsync_PartialFailure_RollsBackBatch()
        {
            // Arrange
            var members = new List<Member>
            {
                new Member { ClubId = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com", Status = "Active" },
                new Member { ClubId = 1, FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", Status = "Active" }
            };

            _context.Members.AddRange(members);
            await _context.SaveChangesAsync();

            var request = new BulkUpdateMembersRequest
            {
                ClubId = 1,
                MemberIds = members.Select(m => m.Id).ToList(),
                Updates = new Dictionary<string, object> { { "Status", "Invalid_Status_That_Causes_Error" } },
                UpdatedByUserId = 1
            };

            // Act
            var result = await _service.BulkUpdateMembersAsync(request);

            // Assert - All or nothing within each batch
            Assert.IsNotNull(result);
            
            // Verify no partial updates occurred
            var membersAfterUpdate = await _context.Members.Where(m => members.Select(mem => mem.Id).Contains(m.Id)).ToListAsync();
            Assert.IsTrue(membersAfterUpdate.All(m => m.Status == "Active"), "No partial updates should occur on batch failure");
        }

        #endregion
    }
}