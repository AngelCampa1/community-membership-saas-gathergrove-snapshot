using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using GatherGrove.API;
using GatherGrove.Application.DTOs;
using GatherGrove.Core.Entities;
using GatherGrove.Infrastructure.Data;

namespace GatherGrove.Application.Tests.Integration
{
    [TestFixture]
    public class MemberSegmentationApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private WebApplicationFactory<Program> _factory;
        private HttpClient _client;
        private ApplicationDbContext _context;

        [OneTimeSetUp]
        public void OneTimeSetUp()
        {
            _factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Remove the app's ApplicationDbContext registration
                        var descriptor = services.SingleOrDefault(
                            d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));

                        if (descriptor != null)
                        {
                            services.Remove(descriptor);
                        }

                        // Add ApplicationDbContext using an in-memory database for testing
                        services.AddDbContext<ApplicationDbContext>(options =>
                        {
                            options.UseInMemoryDatabase("MemberSegmentationTestDb");
                        });

                        // Build the service provider
                        var sp = services.BuildServiceProvider();

                        // Create a scope to obtain a reference to the database context
                        using var scope = sp.CreateScope();
                        var scopedServices = scope.ServiceProvider;
                        var db = scopedServices.GetRequiredService<ApplicationDbContext>();

                        // Ensure the database is created
                        db.Database.EnsureCreated();

                        // Seed the database with test data
                        SeedDatabase(db);
                    });
                });

            _client = _factory.CreateClient();
        }

        [OneTimeTearDown]
        public void OneTimeTearDown()
        {
            _client?.Dispose();
            _factory?.Dispose();
        }

        [SetUp]
        public async Task SetUp()
        {
            using var scope = _factory.Services.CreateScope();
            _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Setup authentication for unlimited tier
            await SetupAuthenticationAsync();
        }

        private static void SeedDatabase(ApplicationDbContext context)
        {
            // Add test club
            var club = new Club
            {
                Name = "Test Club",
                Description = "Test club for integration tests",
                CreatedAt = DateTime.UtcNow
            };
            context.Clubs.Add(club);
            context.SaveChanges();

            // Add test user with unlimited tier
            var user = new User
            {
                ClubId = club.Id,
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);

            // Add test members
            var members = new List<Member>
            {
                new Member
                {
                    ClubId = club.Id,
                    FirstName = "John",
                    LastName = "Doe",
                    Email = "john@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow.AddDays(-100)
                },
                new Member
                {
                    ClubId = club.Id,
                    FirstName = "Jane",
                    LastName = "Smith",
                    Email = "jane@example.com",
                    Status = "Active",
                    JoinDate = DateTime.UtcNow.AddDays(-50)
                },
                new Member
                {
                    ClubId = club.Id,
                    FirstName = "Bob",
                    LastName = "Johnson",
                    Email = "bob@example.com",
                    Status = "Inactive",
                    JoinDate = DateTime.UtcNow.AddDays(-200)
                }
            };
            context.Members.AddRange(members);

            // Add test billing record for unlimited tier
            var billing = new BillingRecord
            {
                ClubId = club.Id,
                CurrentTier = "Unlimited",
                IsActive = true,
                NextBillingDate = DateTime.UtcNow.AddMonths(1),
                CreatedAt = DateTime.UtcNow
            };
            context.BillingRecords.Add(billing);

            context.SaveChanges();
        }

        private async Task SetupAuthenticationAsync()
        {
            // Setup authentication token for unlimited tier user
            var loginRequest = new
            {
                Email = "test@example.com",
                Password = "TestPassword123!"
            };

            var loginContent = new StringContent(
                JsonSerializer.Serialize(loginRequest),
                Encoding.UTF8,
                "application/json");

            // Note: In a real test, you would mock the authentication
            // For this example, we'll set a test authorization header
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token-unlimited-tier");
        }

        #region Create Segment Tests

        [Test]
        public async Task CreateSegment_ValidRequest_ReturnsCreatedSegment()
        {
            // Arrange
            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Active Members Test",
                Description = "Test segment for active members",
                FilterCriteria = new SegmentFilterCriteria
                {
                    StatusFilter = new StringFilter
                    {
                        Operator = StringOperator.Equals,
                        Value = "Active"
                    }
                },
                CreatedByUserId = 1
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/clubs/1/segments", content);

            // Assert
            Assert.AreEqual(HttpStatusCode.Created, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var segment = JsonSerializer.Deserialize<MemberSegmentResponse>(responseContent);

            Assert.IsNotNull(segment);
            Assert.AreEqual("Active Members Test", segment.Name);
            Assert.AreEqual(1, segment.ClubId);
            Assert.IsTrue(segment.Id > 0);
        }

        [Test]
        public async Task CreateSegment_InvalidFilterCriteria_ReturnsBadRequest()
        {
            // Arrange
            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Invalid Test Segment",
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

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/clubs/1/segments", content);

            // Assert
            Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Test]
        public async Task CreateSegment_UnauthorizedTier_ReturnsForbidden()
        {
            // Arrange
            _client.DefaultRequestHeaders.Remove("Authorization");
            _client.DefaultRequestHeaders.Add("Authorization", "Bearer test-token-premium-tier");

            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Unauthorized Test",
                FilterCriteria = new SegmentFilterCriteria(),
                CreatedByUserId = 1
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/clubs/1/segments", content);

            // Assert
            Assert.AreEqual(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion

        #region Get Segments Tests

        [Test]
        public async Task GetSegments_ValidRequest_ReturnsSegmentList()
        {
            // Arrange
            // First create a segment
            await CreateTestSegmentAsync();

            // Act
            var response = await _client.GetAsync("/api/clubs/1/segments");

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var segments = JsonSerializer.Deserialize<List<MemberSegmentResponse>>(responseContent);

            Assert.IsNotNull(segments);
            Assert.IsTrue(segments.Count > 0);
        }

        [Test]
        public async Task GetSegments_WithQueryParameters_ReturnsFilteredResults()
        {
            // Arrange
            await CreateTestSegmentAsync();

            // Act
            var response = await _client.GetAsync("/api/clubs/1/segments?includeInactive=false&sortBy=name&sortOrder=asc");

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var segments = JsonSerializer.Deserialize<List<MemberSegmentResponse>>(responseContent);

            Assert.IsNotNull(segments);
        }

        #endregion

        #region Update Segment Tests

        [Test]
        public async Task UpdateSegment_ValidRequest_ReturnsUpdatedSegment()
        {
            // Arrange
            var segmentId = await CreateTestSegmentAsync();

            var updateRequest = new UpdateSegmentRequest
            {
                SegmentId = segmentId,
                Name = "Updated Segment Name",
                Description = "Updated description",
                FilterCriteria = new SegmentFilterCriteria
                {
                    StatusFilter = new StringFilter
                    {
                        Operator = StringOperator.Equals,
                        Value = "Active"
                    }
                },
                UpdatedByUserId = 1
            };

            var content = new StringContent(
                JsonSerializer.Serialize(updateRequest),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PutAsync($"/api/clubs/1/segments/{segmentId}", content);

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var segment = JsonSerializer.Deserialize<MemberSegmentResponse>(responseContent);

            Assert.IsNotNull(segment);
            Assert.AreEqual("Updated Segment Name", segment.Name);
        }

        [Test]
        public async Task UpdateSegment_NonExistentSegment_ReturnsNotFound()
        {
            // Arrange
            var updateRequest = new UpdateSegmentRequest
            {
                SegmentId = 999,
                Name = "Non-existent",
                FilterCriteria = new SegmentFilterCriteria(),
                UpdatedByUserId = 1
            };

            var content = new StringContent(
                JsonSerializer.Serialize(updateRequest),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PutAsync("/api/clubs/1/segments/999", content);

            // Assert
            Assert.AreEqual(HttpStatusCode.NotFound, response.StatusCode);
        }

        #endregion

        #region Delete Segment Tests

        [Test]
        public async Task DeleteSegment_ValidRequest_ReturnsSuccess()
        {
            // Arrange
            var segmentId = await CreateTestSegmentAsync();

            // Act
            var response = await _client.DeleteAsync($"/api/clubs/1/segments/{segmentId}");

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);

            Assert.IsTrue(result.ContainsKey("success"));
        }

        #endregion

        #region Get Segment Members Tests

        [Test]
        public async Task GetSegmentMembers_ValidRequest_ReturnsMembers()
        {
            // Arrange
            var segmentId = await CreateTestSegmentAsync();

            // Simulate segment calculation by adding members to segment
            await AddMembersToSegmentAsync(segmentId);

            // Act
            var response = await _client.GetAsync($"/api/clubs/1/segments/{segmentId}/members?page=1&pageSize=25");

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<SegmentMembersResult>(responseContent);

            Assert.IsNotNull(result);
            Assert.IsTrue(result.TotalCount >= 0);
            Assert.IsNotNull(result.Members);
        }

        [Test]
        public async Task GetSegmentMembers_WithPagination_ReturnsPagedResults()
        {
            // Arrange
            var segmentId = await CreateTestSegmentAsync();
            await AddMembersToSegmentAsync(segmentId);

            // Act
            var response = await _client.GetAsync($"/api/clubs/1/segments/{segmentId}/members?page=1&pageSize=2");

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<SegmentMembersResult>(responseContent);

            Assert.IsNotNull(result);
            Assert.AreEqual(1, result.CurrentPage);
            Assert.AreEqual(2, result.PageSize);
        }

        #endregion

        #region Preview Segment Tests

        [Test]
        public async Task PreviewSegment_ValidRequest_ReturnsPreview()
        {
            // Arrange
            var previewRequest = new
            {
                FilterCriteria = new SegmentFilterCriteria
                {
                    StatusFilter = new StringFilter
                    {
                        Operator = StringOperator.Equals,
                        Value = "Active"
                    }
                },
                Page = 1,
                PageSize = 25
            };

            var content = new StringContent(
                JsonSerializer.Serialize(previewRequest),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/clubs/1/segments/preview", content);

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<FilterExecutionResult>(responseContent);

            Assert.IsNotNull(result);
            Assert.IsTrue(result.TotalCount >= 0);
        }

        #endregion

        #region Refresh Segment Counts Tests

        [Test]
        public async Task RefreshSegmentCounts_ValidRequest_ReturnsRefreshResult()
        {
            // Arrange
            await CreateTestSegmentAsync();

            // Act
            var response = await _client.PostAsync("/api/clubs/1/segments/refresh-counts", null);

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);

            Assert.IsNotNull(result);
            Assert.IsTrue(result.ContainsKey("segmentsUpdated"));
        }

        #endregion

        #region Analytics Tests

        [Test]
        public async Task GetSegmentAnalytics_ValidRequest_ReturnsAnalytics()
        {
            // Arrange
            await CreateTestSegmentAsync();

            // Act
            var response = await _client.GetAsync("/api/clubs/1/segments/analytics");

            // Assert
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);

            var responseContent = await response.Content.ReadAsStringAsync();
            var analytics = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);

            Assert.IsNotNull(analytics);
            Assert.IsTrue(analytics.ContainsKey("totalSegments"));
        }

        #endregion

        #region Performance Tests

        [Test]
        public async Task CreateSegment_PerformanceTest_CompletesWithin5Seconds()
        {
            // Arrange
            var startTime = DateTime.UtcNow;

            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Performance Test Segment",
                FilterCriteria = new SegmentFilterCriteria
                {
                    StatusFilter = new StringFilter
                    {
                        Operator = StringOperator.Equals,
                        Value = "Active"
                    }
                },
                CreatedByUserId = 1
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/clubs/1/segments", content);

            // Assert
            var duration = DateTime.UtcNow - startTime;
            Assert.AreEqual(HttpStatusCode.Created, response.StatusCode);
            Assert.Less(duration.TotalSeconds, 5.0, "Segment creation should complete within 5 seconds");
        }

        [Test]
        public async Task GetSegments_PerformanceTest_CompletesWithin2Seconds()
        {
            // Arrange
            await CreateTestSegmentAsync();
            var startTime = DateTime.UtcNow;

            // Act
            var response = await _client.GetAsync("/api/clubs/1/segments");

            // Assert
            var duration = DateTime.UtcNow - startTime;
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
            Assert.Less(duration.TotalSeconds, 2.0, "Segment query should complete within 2 seconds");
        }

        #endregion

        #region Error Handling Tests

        [Test]
        public async Task CreateSegment_InvalidClubId_ReturnsNotFound()
        {
            // Arrange
            var request = new CreateSegmentRequest
            {
                ClubId = 999,
                Name = "Test Segment",
                FilterCriteria = new SegmentFilterCriteria(),
                CreatedByUserId = 1
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync("/api/clubs/999/segments", content);

            // Assert
            Assert.AreEqual(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Test]
        public async Task GetSegments_InvalidClubId_ReturnsNotFound()
        {
            // Act
            var response = await _client.GetAsync("/api/clubs/999/segments");

            // Assert
            Assert.AreEqual(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Test]
        public async Task CreateSegment_MalformedRequest_ReturnsBadRequest()
        {
            // Arrange
            var invalidJson = "{ invalid json }";
            var content = new StringContent(invalidJson, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/clubs/1/segments", content);

            // Assert
            Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
        }

        #endregion

        #region Concurrent Access Tests

        [Test]
        public async Task CreateSegment_ConcurrentRequests_HandlesCorrectly()
        {
            // Arrange
            var tasks = new List<Task<HttpResponseMessage>>();

            for (int i = 0; i < 5; i++)
            {
                var request = new CreateSegmentRequest
                {
                    ClubId = 1,
                    Name = $"Concurrent Segment {i}",
                    FilterCriteria = new SegmentFilterCriteria
                    {
                        StatusFilter = new StringFilter
                        {
                            Operator = StringOperator.Equals,
                            Value = "Active"
                        }
                    },
                    CreatedByUserId = 1
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(request),
                    Encoding.UTF8,
                    "application/json");

                tasks.Add(_client.PostAsync("/api/clubs/1/segments", content));
            }

            // Act
            var responses = await Task.WhenAll(tasks);

            // Assert
            var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
            Assert.AreEqual(5, successCount, "All concurrent requests should succeed");
        }

        #endregion

        #region Helper Methods

        private async Task<int> CreateTestSegmentAsync()
        {
            var request = new CreateSegmentRequest
            {
                ClubId = 1,
                Name = "Test Segment",
                Description = "Integration test segment",
                FilterCriteria = new SegmentFilterCriteria
                {
                    StatusFilter = new StringFilter
                    {
                        Operator = StringOperator.Equals,
                        Value = "Active"
                    }
                },
                CreatedByUserId = 1
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            var response = await _client.PostAsync("/api/clubs/1/segments", content);
            var responseContent = await response.Content.ReadAsStringAsync();
            var segment = JsonSerializer.Deserialize<MemberSegmentResponse>(responseContent);

            return segment.Id;
        }

        private async Task AddMembersToSegmentAsync(int segmentId)
        {
            // Simulate adding members to segment cache
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var members = await context.Members.Where(m => m.ClubId == 1).ToListAsync();
            var segmentMembers = members.Select(m => new SegmentMember
            {
                SegmentId = segmentId,
                MemberId = m.Id,
                AddedAt = DateTime.UtcNow
            }).ToList();

            context.SegmentMembers.AddRange(segmentMembers);
            await context.SaveChangesAsync();
        }

        #endregion
    }
}