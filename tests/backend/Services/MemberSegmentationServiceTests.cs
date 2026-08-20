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
using GatherGrove.Infrastructure.Services;

namespace GatherGrove.Application.Tests.Services
{
    [TestFixture]
    public class MemberSegmentationServiceTests
    {
        private Mock<ILogger<MemberSegmentationService>> _mockLogger;
        private Mock<ApplicationDbContext> _mockContext;
        private Mock<ITierValidationService> _mockTierValidation;
        private Mock<IBillingService> _mockBillingService;
        private MemberSegmentationService _service;
        private DbContextOptions<ApplicationDbContext> _dbOptions;

        [SetUp]
        public void SetUp()
        {
            _mockLogger = new Mock<ILogger<MemberSegmentationService>>();
            _mockTierValidation = new Mock<ITierValidationService>();
            _mockBillingService = new Mock<IBillingService>();

            // Setup in-memory database for testing
            _dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockContext = new Mock<ApplicationDbContext>(_dbOptions);

            // Setup default tier validation to pass
            _mockTierValidation
                .Setup(x => x.ValidateUnlimitedTierAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            _service = new MemberSegmentationService(
                _mockContext.Object,
                _mockLogger.Object,
                _mockTierValidation.Object,
                _mockBillingService.Object
            );
        }

        [TearDown]
        public void TearDown()
        {
            _mockContext?.Object?.Dispose();
        }

        #region Tier Validation Tests

        [Test]
        public async Task CreateSegmentAsync_ValidatesUnlimitedTier()
        {
            // Arrange
            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Test Segment",
                FilterCriteria = new SegmentFilterCriteria(),
                CreatedByUserId = 1
            };

            // Act & Assert
            await _service.CreateSegmentAsync(request);

            _mockTierValidation.Verify(
                x => x.ValidateUnlimitedTierAsync(1),
                Times.Once
            );
        }

        [Test]
        public void CreateSegmentAsync_ThrowsWhenTierValidationFails()
        {
            // Arrange
            _mockTierValidation
                .Setup(x => x.ValidateUnlimitedTierAsync(It.IsAny<int>()))
                .ThrowsAsync(new UnauthorizedAccessException("Unlimited tier required"));

            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Test Segment",
                FilterCriteria = new SegmentFilterCriteria(),
                CreatedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _service.CreateSegmentAsync(request)
            );
        }

        #endregion

        #region Create Segment Tests

        [Test]
        public async Task CreateSegmentAsync_ValidRequest_ReturnsSegmentResponse()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Active Members",
                Description = "All active members",
                FilterCriteria = new SegmentFilterCriteria
                {
                    StatusFilter = new StringFilter { Operator = StringOperator.Equals, Value = "Active" }
                },
                CreatedByUserId = 1
            };

            // Act
            var result = await service.CreateSegmentAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("Active Members", result.Name);
            Assert.AreEqual("All active members", result.Description);
            Assert.AreEqual(1, result.ClubId);
            Assert.IsTrue(result.Id > 0);
            Assert.IsTrue(result.IsActive);
        }

        [Test]
        public void CreateSegmentAsync_InvalidFilterCriteria_ThrowsValidationException()
        {
            // Arrange
            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Test Segment",
                FilterCriteria = new SegmentFilterCriteria
                {
                    AgeFilter = new NumericFilter
                    {
                        Operator = NumericOperator.Between,
                        Value = 65,
                        EndValue = 18 // Invalid: min > max
                    }
                },
                CreatedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<ValidationException>(
                () => _service.CreateSegmentAsync(request)
            );
        }

        [Test]
        public void CreateSegmentAsync_DuplicateName_ThrowsValidationException()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            // Add existing segment
            context.MemberSegments.Add(new MemberSegment
            {
                ClubId = 1,
                Name = "Existing Segment",
                FilterCriteriaJson = "{}",
                IsActive = true,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            });
            context.SaveChanges();

            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Existing Segment", // Duplicate name
                FilterCriteria = new SegmentFilterCriteria(),
                CreatedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<ValidationException>(
                () => service.CreateSegmentAsync(request)
            );
        }

        #endregion

        #region Update Segment Tests

        [Test]
        public async Task UpdateSegmentAsync_ValidRequest_ReturnsUpdatedSegment()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var existingSegment = new MemberSegment
            {
                ClubId = 1,
                Name = "Original Name",
                Description = "Original Description",
                FilterCriteriaJson = "{}",
                IsActive = true,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            };
            context.MemberSegments.Add(existingSegment);
            context.SaveChanges();

            var updateRequest = new UpdateSegmentRequest
            {
                SegmentId = existingSegment.Id,
                Name = "Updated Name",
                Description = "Updated Description",
                FilterCriteria = new SegmentFilterCriteria
                {
                    StatusFilter = new StringFilter { Operator = StringOperator.Equals, Value = "Active" }
                },
                IsActive = false,
                UpdatedByUserId = 2
            };

            // Act
            var result = await service.UpdateSegmentAsync(updateRequest);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual("Updated Name", result.Name);
            Assert.AreEqual("Updated Description", result.Description);
            Assert.IsFalse(result.IsActive);
        }

        [Test]
        public void UpdateSegmentAsync_NonExistentSegment_ThrowsNotFoundException()
        {
            // Arrange
            var request = new UpdateSegmentRequest
            {
                SegmentId = 999, // Non-existent
                Name = "Updated Name",
                FilterCriteria = new SegmentFilterCriteria(),
                UpdatedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<NotFoundException>(
                () => _service.UpdateSegmentAsync(request)
            );
        }

        #endregion

        #region Delete Segment Tests

        [Test]
        public async Task DeleteSegmentAsync_ValidSegment_SetsInactiveAndReturnsSuccess()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var segment = new MemberSegment
            {
                ClubId = 1,
                Name = "Test Segment",
                FilterCriteriaJson = "{}",
                IsActive = true,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            };
            context.MemberSegments.Add(segment);
            context.SaveChanges();

            // Act
            var result = await service.DeleteSegmentAsync(1, segment.Id);

            // Assert
            Assert.IsTrue(result);
            
            // Verify segment is soft deleted (set to inactive)
            var deletedSegment = await context.MemberSegments.FindAsync(segment.Id);
            Assert.IsFalse(deletedSegment.IsActive);
        }

        [Test]
        public void DeleteSegmentAsync_NonExistentSegment_ThrowsNotFoundException()
        {
            // Arrange & Act & Assert
            Assert.ThrowsAsync<NotFoundException>(
                () => _service.DeleteSegmentAsync(1, 999)
            );
        }

        #endregion

        #region Get Segments Tests

        [Test]
        public async Task GetSegmentsAsync_ValidClub_ReturnsSegments()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var segments = new List<MemberSegment>
            {
                new MemberSegment
                {
                    ClubId = 1,
                    Name = "Active Members",
                    FilterCriteriaJson = "{}",
                    IsActive = true,
                    CreatedByUserId = 1,
                    CreatedAt = DateTime.UtcNow,
                    MemberCount = 100
                },
                new MemberSegment
                {
                    ClubId = 1,
                    Name = "Inactive Members",
                    FilterCriteriaJson = "{}",
                    IsActive = false,
                    CreatedByUserId = 1,
                    CreatedAt = DateTime.UtcNow,
                    MemberCount = 25
                }
            };

            context.MemberSegments.AddRange(segments);
            context.SaveChanges();

            // Act
            var result = await service.GetSegmentsAsync(1, includeInactive: false);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.Count); // Only active segments
            Assert.AreEqual("Active Members", result.First().Name);
        }

        [Test]
        public async Task GetSegmentsAsync_IncludeInactive_ReturnsAllSegments()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var segments = new List<MemberSegment>
            {
                new MemberSegment
                {
                    ClubId = 1,
                    Name = "Active Members",
                    FilterCriteriaJson = "{}",
                    IsActive = true,
                    CreatedByUserId = 1,
                    CreatedAt = DateTime.UtcNow
                },
                new MemberSegment
                {
                    ClubId = 1,
                    Name = "Inactive Members",
                    FilterCriteriaJson = "{}",
                    IsActive = false,
                    CreatedByUserId = 1,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.MemberSegments.AddRange(segments);
            context.SaveChanges();

            // Act
            var result = await service.GetSegmentsAsync(1, includeInactive: true);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.Count); // Both active and inactive segments
        }

        #endregion

        #region Get Segment Members Tests

        [Test]
        public async Task GetSegmentMembersAsync_ValidSegment_ReturnsMembers()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var segment = new MemberSegment
            {
                ClubId = 1,
                Name = "Test Segment",
                FilterCriteriaJson = "{}",
                IsActive = true,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            };
            context.MemberSegments.Add(segment);

            var members = new List<Member>
            {
                new Member
                {
                    ClubId = 1,
                    FirstName = "John",
                    LastName = "Doe",
                    Email = "john@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow
                },
                new Member
                {
                    ClubId = 1,
                    FirstName = "Jane",
                    LastName = "Smith",
                    Email = "jane@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow
                }
            };
            context.Members.AddRange(members);
            context.SaveChanges();

            // Add members to segment cache
            var segmentMembers = members.Select(m => new SegmentMember
            {
                SegmentId = segment.Id,
                MemberId = m.Id,
                AddedAt = DateTime.UtcNow
            }).ToList();
            context.SegmentMembers.AddRange(segmentMembers);
            context.SaveChanges();

            var request = new GetSegmentMembersRequest
            {
                SegmentId = segment.Id,
                Page = 1,
                PageSize = 20
            };

            // Act
            var result = await service.GetSegmentMembersAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.TotalCount);
            Assert.AreEqual(2, result.Members.Count);
            Assert.AreEqual("John Doe", result.Members.First().MemberName);
        }

        [Test]
        public async Task GetSegmentMembersAsync_WithPagination_ReturnsPagedResults()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var segment = new MemberSegment
            {
                ClubId = 1,
                Name = "Test Segment",
                FilterCriteriaJson = "{}",
                IsActive = true,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            };
            context.MemberSegments.Add(segment);

            // Create 15 test members
            var members = Enumerable.Range(1, 15)
                .Select(i => new Member
                {
                    ClubId = 1,
                    FirstName = $"Member",
                    LastName = $"{i}",
                    Email = $"member{i}@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow
                }).ToList();

            context.Members.AddRange(members);
            context.SaveChanges();

            var segmentMembers = members.Select(m => new SegmentMember
            {
                SegmentId = segment.Id,
                MemberId = m.Id,
                AddedAt = DateTime.UtcNow
            }).ToList();
            context.SegmentMembers.AddRange(segmentMembers);
            context.SaveChanges();

            var request = new GetSegmentMembersRequest
            {
                SegmentId = segment.Id,
                Page = 2,
                PageSize = 10
            };

            // Act
            var result = await service.GetSegmentMembersAsync(request);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(15, result.TotalCount);
            Assert.AreEqual(5, result.Members.Count); // Second page should have 5 members
            Assert.AreEqual(2, result.CurrentPage);
            Assert.AreEqual(2, result.TotalPages);
        }

        #endregion

        #region Filter Execution Tests

        [Test]
        public async Task ExecuteFilterAsync_SimpleStatusFilter_ReturnsMatchingMembers()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var members = new List<Member>
            {
                new Member
                {
                    ClubId = 1,
                    FirstName = "Active",
                    LastName = "Member1",
                    Email = "active1@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow
                },
                new Member
                {
                    ClubId = 1,
                    FirstName = "Inactive",
                    LastName = "Member1",
                    Email = "inactive1@example.com",
                    Status = "Inactive",
                    JoinDate = DateTime.UtcNow
                }
            };
            context.Members.AddRange(members);
            context.SaveChanges();

            var filterCriteria = new SegmentFilterCriteria
            {
                StatusFilter = new StringFilter
                {
                    Operator = StringOperator.Equals,
                    Value = "Active"
                }
            };

            // Act
            var result = await service.ExecuteFilterAsync(1, filterCriteria, 1, 20);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.TotalCount);
            Assert.AreEqual("Active Member1", result.Members.First().MemberName);
        }

        [Test]
        public async Task ExecuteFilterAsync_DateRangeFilter_ReturnsMatchingMembers()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var members = new List<Member>
            {
                new Member
                {
                    ClubId = 1,
                    FirstName = "Recent",
                    LastName = "Member",
                    Email = "recent@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow.AddDays(-30)
                },
                new Member
                {
                    ClubId = 1,
                    FirstName = "Old",
                    LastName = "Member",
                    Email = "old@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow.AddDays(-365)
                }
            };
            context.Members.AddRange(members);
            context.SaveChanges();

            var filterCriteria = new SegmentFilterCriteria
            {
                JoinDateFilter = new DateRangeFilter
                {
                    Operator = DateOperator.GreaterThan,
                    Value = DateTime.UtcNow.AddDays(-60)
                }
            };

            // Act
            var result = await service.ExecuteFilterAsync(1, filterCriteria, 1, 20);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.TotalCount);
            Assert.AreEqual("Recent Member", result.Members.First().MemberName);
        }

        [Test]
        public async Task ExecuteFilterAsync_ComplexFilter_ReturnsMatchingMembers()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var membershipType = new MembershipType
            {
                ClubId = 1,
                Name = "Premium",
                Cost = 100
            };
            context.MembershipTypes.Add(membershipType);
            context.SaveChanges();

            var members = new List<Member>
            {
                new Member
                {
                    ClubId = 1,
                    FirstName = "Premium",
                    LastName = "Active",
                    Email = "premium@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow.AddDays(-30),
                    MembershipTypeId = membershipType.Id
                },
                new Member
                {
                    ClubId = 1,
                    FirstName = "Regular",
                    LastName = "Active",
                    Email = "regular@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow.AddDays(-30)
                }
            };
            context.Members.AddRange(members);
            context.SaveChanges();

            var filterCriteria = new SegmentFilterCriteria
            {
                StatusFilter = new StringFilter
                {
                    Operator = StringOperator.Equals,
                    Value = "Active"
                },
                MembershipTypeFilter = new ListFilter
                {
                    Operator = ListOperator.In,
                    Values = new List<string> { membershipType.Id.ToString() }
                },
                LogicalOperator = LogicalOperator.And
            };

            // Act
            var result = await service.ExecuteFilterAsync(1, filterCriteria, 1, 20);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.TotalCount);
            Assert.AreEqual("Premium Active", result.Members.First().MemberName);
        }

        #endregion

        #region Performance Tests

        [Test]
        public async Task CreateSegmentAsync_PerformanceTest_CompletesUnder5Seconds()
        {
            // Arrange
            var startTime = DateTime.UtcNow;
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Performance Test Segment",
                FilterCriteria = new SegmentFilterCriteria
                {
                    StatusFilter = new StringFilter { Operator = StringOperator.Equals, Value = "Active" }
                },
                CreatedByUserId = 1
            };

            // Act
            var result = await service.CreateSegmentAsync(request);

            // Assert
            var duration = DateTime.UtcNow - startTime;
            Assert.IsNotNull(result);
            Assert.Less(duration.TotalSeconds, 5.0, "Segment creation should complete under 5 seconds");
        }

        [Test]
        public async Task GetSegmentMembersAsync_PerformanceTest_CompletesUnder2Seconds()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var segment = new MemberSegment
            {
                ClubId = 1,
                Name = "Performance Test",
                FilterCriteriaJson = "{}",
                IsActive = true,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            };
            context.MemberSegments.Add(segment);
            context.SaveChanges();

            var request = new GetSegmentMembersRequest
            {
                SegmentId = segment.Id,
                Page = 1,
                PageSize = 100
            };

            var startTime = DateTime.UtcNow;

            // Act
            var result = await service.GetSegmentMembersAsync(request);

            // Assert
            var duration = DateTime.UtcNow - startTime;
            Assert.IsNotNull(result);
            Assert.Less(duration.TotalSeconds, 2.0, "Segment query should complete under 2 seconds");
        }

        #endregion

        #region Bulk Operations Tests

        [Test]
        public async Task RefreshAllSegmentsAsync_ValidClub_UpdatesAllSegments()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            var segments = new List<MemberSegment>
            {
                new MemberSegment
                {
                    ClubId = 1,
                    Name = "Segment 1",
                    FilterCriteriaJson = "{\"StatusFilter\":{\"Operator\":0,\"Value\":\"Active\"}}",
                    IsActive = true,
                    CreatedByUserId = 1,
                    CreatedAt = DateTime.UtcNow,
                    LastCalculated = DateTime.UtcNow.AddHours(-1)
                },
                new MemberSegment
                {
                    ClubId = 1,
                    Name = "Segment 2",
                    FilterCriteriaJson = "{\"StatusFilter\":{\"Operator\":0,\"Value\":\"Inactive\"}}",
                    IsActive = true,
                    CreatedByUserId = 1,
                    CreatedAt = DateTime.UtcNow,
                    LastCalculated = DateTime.UtcNow.AddHours(-2)
                }
            };

            context.MemberSegments.AddRange(segments);
            context.SaveChanges();

            // Act
            var result = await service.RefreshAllSegmentsAsync(1);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(2, result.ProcessedSegments);
            Assert.IsTrue(result.TotalDurationMs > 0);
        }

        #endregion

        #region Edge Cases

        [Test]
        public void ExecuteFilterAsync_NullFilterCriteria_ThrowsArgumentNullException()
        {
            // Arrange & Act & Assert
            Assert.ThrowsAsync<ArgumentNullException>(
                () => _service.ExecuteFilterAsync(1, null, 1, 20)
            );
        }

        [Test]
        public void GetSegmentMembersAsync_InvalidPageSize_ThrowsArgumentException()
        {
            // Arrange
            var request = new GetSegmentMembersRequest
            {
                SegmentId = 1,
                Page = 1,
                PageSize = 0 // Invalid page size
            };

            // Act & Assert
            Assert.ThrowsAsync<ArgumentException>(
                () => _service.GetSegmentMembersAsync(request)
            );
        }

        [Test]
        public void CreateSegmentAsync_EmptyName_ThrowsValidationException()
        {
            // Arrange
            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "", // Empty name
                FilterCriteria = new SegmentFilterCriteria(),
                CreatedByUserId = 1
            };

            // Act & Assert
            Assert.ThrowsAsync<ValidationException>(
                () => _service.CreateSegmentAsync(request)
            );
        }

        #endregion

        #region Memory and Resource Management

        [Test]
        public async Task ExecuteFilterAsync_LargeDataset_HandlesMemoryEfficiently()
        {
            // Arrange
            using var context = new ApplicationDbContext(_dbOptions);
            var service = new MemberSegmentationService(context, _mockLogger.Object, _mockTierValidation.Object, _mockBillingService.Object);

            // Create a large dataset simulation
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
                    Status = i % 2 == 0 ? "Active" : "Inactive",
                    JoinDate = DateTime.UtcNow.AddDays(-i)
                });
            }

            context.Members.AddRange(members);
            context.SaveChanges();

            var filterCriteria = new SegmentFilterCriteria
            {
                StatusFilter = new StringFilter
                {
                    Operator = StringOperator.Equals,
                    Value = "Active"
                }
            };

            var initialMemory = GC.GetTotalMemory(true);

            // Act
            var result = await service.ExecuteFilterAsync(1, filterCriteria, 1, 100);

            // Assert
            var finalMemory = GC.GetTotalMemory(true);
            var memoryIncrease = finalMemory - initialMemory;

            Assert.IsNotNull(result);
            Assert.AreEqual(5000, result.TotalCount); // Half should be active
            Assert.Less(memoryIncrease, 50 * 1024 * 1024, "Memory increase should be less than 50MB for large dataset");
        }

        #endregion
    }
}