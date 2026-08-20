using NUnit.Framework;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Diagnostics;
using FluentAssertions;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using System.Collections.Concurrent;

namespace GatherGrove.Performance.Tests.EventManagement
{
    /// <summary>
    /// Performance tests for US-009 Advanced Event Management
    /// Tests system performance under various load conditions
    /// Validates scalability, response times, and resource utilization
    /// </summary>
    [TestFixture]
    public class EventManagementPerformanceTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private WebApplicationFactory<Program> _factory;
        private HttpClient _client;
        private ApplicationDbContext _dbContext;
        private string _authToken;
        private int _testClubId;
        private int _testUserId;

        // Performance benchmarks
        private const int ACCEPTABLE_RESPONSE_TIME_MS = 1000; // 1 second
        private const int BULK_OPERATION_TIMEOUT_MS = 10000; // 10 seconds
        private const int CONCURRENT_USERS = 50;
        private const int LARGE_EVENT_CAPACITY = 10000;
        private const int STRESS_TEST_ITERATIONS = 100;

        [OneTimeSetUp]
        public async Task OneTimeSetUp()
        {
            _factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        var descriptor = services.SingleOrDefault(
                            d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                        if (descriptor != null)
                            services.Remove(descriptor);

                        // Use SQL Server in-memory for better performance testing
                        services.AddDbContext<ApplicationDbContext>(options =>
                        {
                            options.UseInMemoryDatabase("TestDb_Performance_EventManagement");
                            options.EnableSensitiveDataLogging(false); // Disable for performance
                            options.EnableServiceProviderCaching(true);
                        });
                    });
                });

            _client = _factory.CreateClient();
            _client.Timeout = TimeSpan.FromSeconds(30); // Increase timeout for performance tests
            
            var scope = _factory.Services.CreateScope();
            _dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await _dbContext.Database.EnsureCreatedAsync();

            await SetupPerformanceTestDataAsync();
        }

        [OneTimeTearDown]
        public async Task OneTimeTearDown()
        {
            await _dbContext.Database.EnsureDeletedAsync();
            _dbContext?.Dispose();
            _client?.Dispose();
            _factory?.Dispose();
        }

        private async Task SetupPerformanceTestDataAsync()
        {
            // Create test user
            var testUser = new User
            {
                Id = 1,
                FirstName = "Performance",
                LastName = "Test",
                Email = "performance.test@gathergrove.club",
                PhoneNumber = "555-0999",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Users.Add(testUser);
            _testUserId = testUser.Id;

            // Create test club
            var testClub = new Club
            {
                Id = 1,
                Name = "Performance Test Club",
                Description = "Club for performance testing",
                CreatedById = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Clubs.Add(testClub);
            _testClubId = testClub.Id;

            await _dbContext.SaveChangesAsync();
            _authToken = "mock-performance-jwt-token";
        }

        private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string uri, object? content = null)
        {
            var request = new HttpRequestMessage(method, uri);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _authToken);
            
            if (content != null)
            {
                request.Content = new StringContent(
                    JsonSerializer.Serialize(content),
                    Encoding.UTF8,
                    "application/json");
            }

            return request;
        }

        [Test]
        [Category("Performance")]
        public async Task Performance_EventCreation_ShouldHandleHighVolumeQuickly()
        {
            // Arrange
            const int eventCount = 1000;
            var stopwatch = Stopwatch.StartNew();
            var createdEventIds = new List<int>();

            // Act - Create events in batches for better performance
            var batchSize = 50;
            var batches = Enumerable.Range(0, eventCount / batchSize);

            foreach (var batchIndex in batches)
            {
                var batchTasks = new List<Task<HttpResponseMessage>>();
                
                for (int i = 0; i < batchSize; i++)
                {
                    var eventIndex = batchIndex * batchSize + i;
                    var eventRequest = new
                    {
                        Name = $"Performance Test Event {eventIndex}",
                        Description = $"Load testing event number {eventIndex}",
                        StartTime = DateTime.Now.AddDays(eventIndex % 30 + 1),
                        EndTime = DateTime.Now.AddDays(eventIndex % 30 + 1).AddHours(2),
                        Location = $"Venue {eventIndex % 10}",
                        MaxCapacity = 100
                    };

                    var request = CreateAuthenticatedRequest(
                        HttpMethod.Post, 
                        $"/api/clubs/{_testClubId}/events", 
                        eventRequest);

                    batchTasks.Add(_client.SendAsync(request));
                }

                var batchResponses = await Task.WhenAll(batchTasks);
                
                foreach (var response in batchResponses)
                {
                    response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
                    var eventData = JsonSerializer.Deserialize<JsonElement>(
                        await response.Content.ReadAsStringAsync());
                    createdEventIds.Add(eventData.GetProperty("id").GetInt32());
                }

                // Small delay between batches to avoid overwhelming the system
                await Task.Delay(100);
            }

            stopwatch.Stop();

            // Assert
            createdEventIds.Should().HaveCount(eventCount);
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(60000); // Less than 1 minute
            
            // Calculate events per second
            var eventsPerSecond = eventCount / (stopwatch.ElapsedMilliseconds / 1000.0);
            eventsPerSecond.Should().BeGreaterThan(15); // At least 15 events per second

            TestContext.WriteLine($"Created {eventCount} events in {stopwatch.ElapsedMilliseconds}ms");
            TestContext.WriteLine($"Performance: {eventsPerSecond:F2} events per second");
        }

        [Test]
        [Category("Performance")]
        public async Task Performance_EventRetrieval_ShouldHandleLargeDatasetsPagination()
        {
            // Arrange - Create large number of events
            const int totalEvents = 5000;
            await CreateBulkEventsAsync(totalEvents);

            // Test different page sizes for optimal performance
            var pageSizes = new[] { 10, 25, 50, 100, 250 };
            var performanceResults = new Dictionary<int, long>();

            foreach (var pageSize in pageSizes)
            {
                var stopwatch = Stopwatch.StartNew();
                
                // Act - Retrieve first page
                var request = CreateAuthenticatedRequest(
                    HttpMethod.Get, 
                    $"/api/clubs/{_testClubId}/events?page=1&pageSize={pageSize}");

                var response = await _client.SendAsync(request);
                
                stopwatch.Stop();

                // Assert
                response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
                stopwatch.ElapsedMilliseconds.Should().BeLessThan(ACCEPTABLE_RESPONSE_TIME_MS);

                var events = JsonSerializer.Deserialize<JsonElement>(
                    await response.Content.ReadAsStringAsync());
                
                var items = events.GetProperty("items").EnumerateArray().ToList();
                items.Should().HaveCount(pageSize);

                performanceResults[pageSize] = stopwatch.ElapsedMilliseconds;
                
                TestContext.WriteLine($"Page size {pageSize}: {stopwatch.ElapsedMilliseconds}ms");
            }

            // Verify that reasonable page sizes perform well
            performanceResults[50].Should().BeLessThan(500); // 50 items should load in < 500ms
            performanceResults[100].Should().BeLessThan(800); // 100 items should load in < 800ms
        }

        [Test]
        [Category("Performance")]
        public async Task Performance_ConcurrentRSVPs_ShouldHandleHighConcurrency()
        {
            // Arrange - Create event with large capacity
            var eventRequest = new
            {
                Name = "High Concurrency Test Event",
                Description = "Event for testing concurrent RSVP performance",
                StartTime = DateTime.Now.AddDays(10),
                EndTime = DateTime.Now.AddDays(10).AddHours(3),
                Location = "Large Convention Center",
                MaxCapacity = LARGE_EVENT_CAPACITY
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            var createdEvent = JsonSerializer.Deserialize<JsonElement>(
                await createEventResponse.Content.ReadAsStringAsync());
            var eventId = createdEvent.GetProperty("id").GetInt32();

            // Create test users for concurrent RSVPs
            var testUsers = new List<User>();
            for (int i = 1; i <= CONCURRENT_USERS * 20; i++) // Extra users for testing
            {
                var user = new User
                {
                    Id = 1000 + i,
                    FirstName = $"Concurrent",
                    LastName = $"User{i}",
                    Email = $"concurrent.user{i}@perf.test",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                testUsers.Add(user);
            }
            await _dbContext.SaveChangesAsync();

            // Act - Simulate concurrent RSVPs
            var stopwatch = Stopwatch.StartNew();
            var concurrentTasks = new List<Task<HttpResponseMessage>>();
            var successfulRSVPs = new ConcurrentBag<int>();
            var failedRSVPs = new ConcurrentBag<string>();

            for (int i = 0; i < CONCURRENT_USERS; i++)
            {
                var userId = testUsers[i].Id;
                var task = Task.Run(async () =>
                {
                    try
                    {
                        var rsvpRequest = CreateAuthenticatedRequest(
                            HttpMethod.Post, 
                            $"/api/events/{eventId}/rsvp", 
                            new { UserId = userId, Response = "yes" });

                        var response = await _client.SendAsync(rsvpRequest);
                        
                        if (response.IsSuccessStatusCode)
                        {
                            successfulRSVPs.Add(userId);
                        }
                        else
                        {
                            failedRSVPs.Add($"User {userId}: {response.StatusCode}");
                        }

                        return response;
                    }
                    catch (Exception ex)
                    {
                        failedRSVPs.Add($"User {userId}: Exception - {ex.Message}");
                        return new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError);
                    }
                });

                concurrentTasks.Add(task);
            }

            await Task.WhenAll(concurrentTasks);
            stopwatch.Stop();

            // Assert
            successfulRSVPs.Count.Should().BeGreaterThan(CONCURRENT_USERS * 0.95); // At least 95% success rate
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(BULK_OPERATION_TIMEOUT_MS);

            var rsvpsPerSecond = successfulRSVPs.Count / (stopwatch.ElapsedMilliseconds / 1000.0);
            rsvpsPerSecond.Should().BeGreaterThan(10); // At least 10 RSVPs per second

            TestContext.WriteLine($"Concurrent RSVPs: {successfulRSVPs.Count} successful, {failedRSVPs.Count} failed");
            TestContext.WriteLine($"Performance: {rsvpsPerSecond:F2} RSVPs per second");
            TestContext.WriteLine($"Total time: {stopwatch.ElapsedMilliseconds}ms");

            if (failedRSVPs.Count > 0)
            {
                TestContext.WriteLine("Failed RSVPs:");
                foreach (var failure in failedRSVPs.Take(10)) // Show first 10 failures
                {
                    TestContext.WriteLine($"  {failure}");
                }
            }
        }

        [Test]
        [Category("Performance")]
        public async Task Performance_WaitlistManagement_ShouldHandleLargeWaitlists()
        {
            // Arrange - Create event with small capacity but large waitlist
            var eventRequest = new
            {
                Name = "Waitlist Performance Test Event",
                Description = "Event for testing waitlist performance",
                StartTime = DateTime.Now.AddDays(15),
                EndTime = DateTime.Now.AddDays(15).AddHours(2),
                Location = "Small Venue",
                MaxCapacity = 10, // Very small capacity
                EnableWaitlist = true,
                WaitlistLimit = 1000 // Large waitlist
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            var createdEvent = JsonSerializer.Deserialize<JsonElement>(
                await createEventResponse.Content.ReadAsStringAsync());
            var eventId = createdEvent.GetProperty("id").GetInt32();

            // Create large number of users for waitlist testing
            var waitlistUsers = new List<User>();
            for (int i = 1; i <= 500; i++)
            {
                var user = new User
                {
                    Id = 2000 + i,
                    FirstName = $"Waitlist",
                    LastName = $"User{i}",
                    Email = $"waitlist.user{i}@perf.test",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                waitlistUsers.Add(user);
            }
            await _dbContext.SaveChangesAsync();

            // Act 1 - Fill event to capacity and create large waitlist
            var stopwatch = Stopwatch.StartNew();

            // First, fill to capacity
            for (int i = 0; i < 10; i++)
            {
                var rsvpRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/rsvp", 
                    new { UserId = waitlistUsers[i].Id, Response = "yes" });

                var response = await _client.SendAsync(rsvpRequest);
                response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            }

            // Then, add users to waitlist
            var waitlistTasks = new List<Task<HttpResponseMessage>>();
            for (int i = 10; i < 250; i++) // Add 240 users to waitlist
            {
                var userId = waitlistUsers[i].Id;
                var task = Task.Run(async () =>
                {
                    var waitlistRequest = CreateAuthenticatedRequest(
                        HttpMethod.Post, 
                        $"/api/events/{eventId}/rsvp", 
                        new { UserId = userId, Response = "yes" });

                    return await _client.SendAsync(waitlistRequest);
                });

                waitlistTasks.Add(task);
            }

            var waitlistResponses = await Task.WhenAll(waitlistTasks);
            stopwatch.Stop();

            // Assert waitlist creation performance
            var successfulWaitlistAdditions = waitlistResponses.Count(r => r.StatusCode == System.Net.HttpStatusCode.Accepted);
            successfulWaitlistAdditions.Should().BeGreaterThan(200);
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(15000); // Less than 15 seconds

            TestContext.WriteLine($"Waitlist creation: {successfulWaitlistAdditions} additions in {stopwatch.ElapsedMilliseconds}ms");

            // Act 2 - Test waitlist retrieval performance
            var retrievalStopwatch = Stopwatch.StartNew();

            var getWaitlistRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/waitlist");

            var getWaitlistResponse = await _client.SendAsync(getWaitlistRequest);
            
            retrievalStopwatch.Stop();

            // Assert waitlist retrieval performance
            getWaitlistResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            retrievalStopwatch.ElapsedMilliseconds.Should().BeLessThan(2000); // Less than 2 seconds

            var waitlistEntries = JsonSerializer.Deserialize<JsonElement[]>(
                await getWaitlistResponse.Content.ReadAsStringAsync());
            
            waitlistEntries.Should().NotBeEmpty();
            waitlistEntries.Length.Should().BeGreaterThan(200);

            TestContext.WriteLine($"Waitlist retrieval: {waitlistEntries.Length} entries in {retrievalStopwatch.ElapsedMilliseconds}ms");

            // Act 3 - Test waitlist promotion performance
            var promotionStopwatch = Stopwatch.StartNew();

            // Cancel first attendee to trigger promotions
            var cancelRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/rsvp", 
                new { UserId = waitlistUsers[0].Id, Response = "no" });

            var cancelResponse = await _client.SendAsync(cancelRequest);
            
            // Allow time for automatic promotion processing
            await Task.Delay(2000);
            
            promotionStopwatch.Stop();

            // Assert promotion performance
            cancelResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            promotionStopwatch.ElapsedMilliseconds.Should().BeLessThan(5000); // Less than 5 seconds

            TestContext.WriteLine($"Waitlist promotion processing: {promotionStopwatch.ElapsedMilliseconds}ms");
        }

        [Test]
        [Category("Performance")]
        public async Task Performance_QRCodeOperations_ShouldHandleHighVolume()
        {
            // Arrange - Create event for QR code performance testing
            var eventRequest = new
            {
                Name = "QR Code Performance Test Event",
                Description = "Event for testing QR code generation and validation performance",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(4),
                Location = "QR Performance Test Venue",
                MaxCapacity = 5000,
                EnableQRCode = true
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            var createdEvent = JsonSerializer.Deserialize<JsonElement>(
                await createEventResponse.Content.ReadAsStringAsync());
            var eventId = createdEvent.GetProperty("id").GetInt32();

            // Act 1 - Test QR code generation performance
            var generationStopwatch = Stopwatch.StartNew();
            var qrCodeGenerationTasks = new List<Task<HttpResponseMessage>>();

            // Generate multiple QR codes concurrently
            for (int i = 0; i < 10; i++)
            {
                var task = Task.Run(async () =>
                {
                    var generateQRRequest = CreateAuthenticatedRequest(
                        HttpMethod.Post, 
                        $"/api/events/{eventId}/qr-code/generate");

                    return await _client.SendAsync(generateQRRequest);
                });

                qrCodeGenerationTasks.Add(task);
            }

            var generationResponses = await Task.WhenAll(qrCodeGenerationTasks);
            generationStopwatch.Stop();

            // Assert QR generation performance
            generationResponses.Should().AllSatisfy(r => r.StatusCode.Should().Be(System.Net.HttpStatusCode.OK));
            generationStopwatch.ElapsedMilliseconds.Should().BeLessThan(5000); // Less than 5 seconds

            var qrCodes = new List<string>();
            foreach (var response in generationResponses)
            {
                var qrData = JsonSerializer.Deserialize<JsonElement>(
                    await response.Content.ReadAsStringAsync());
                qrCodes.Add(qrData.GetProperty("qrCodeData").GetString());
            }

            TestContext.WriteLine($"QR code generation: {qrCodes.Count} codes in {generationStopwatch.ElapsedMilliseconds}ms");

            // Act 2 - Test QR code validation performance with concurrent scans
            var validationStopwatch = Stopwatch.StartNew();
            var validationTasks = new List<Task<HttpResponseMessage>>();

            // Create users for validation testing
            var scanUsers = new List<User>();
            for (int i = 1; i <= 100; i++)
            {
                var user = new User
                {
                    Id = 3000 + i,
                    FirstName = $"Scanner",
                    LastName = $"User{i}",
                    Email = $"scanner.user{i}@perf.test",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                scanUsers.Add(user);
            }
            await _dbContext.SaveChangesAsync();

            // Simulate concurrent QR code validations
            var qrCodeToUse = qrCodes[0]; // Use first generated QR code
            for (int i = 0; i < 50; i++) // 50 concurrent validations
            {
                var userId = scanUsers[i].Id;
                var task = Task.Run(async () =>
                {
                    var validateRequest = CreateAuthenticatedRequest(
                        HttpMethod.Post, 
                        $"/api/events/{eventId}/qr-code/validate", 
                        new { QRCodeData = qrCodeToUse, UserId = userId });

                    return await _client.SendAsync(validateRequest);
                });

                validationTasks.Add(task);
            }

            var validationResponses = await Task.WhenAll(validationTasks);
            validationStopwatch.Stop();

            // Assert QR validation performance
            var successfulValidations = validationResponses.Count(r => r.IsSuccessStatusCode);
            successfulValidations.Should().BeGreaterThan(40); // Most should succeed
            validationStopwatch.ElapsedMilliseconds.Should().BeLessThan(8000); // Less than 8 seconds

            var validationsPerSecond = successfulValidations / (validationStopwatch.ElapsedMilliseconds / 1000.0);
            validationsPerSecond.Should().BeGreaterThan(5); // At least 5 validations per second

            TestContext.WriteLine($"QR validation: {successfulValidations} validations in {validationStopwatch.ElapsedMilliseconds}ms");
            TestContext.WriteLine($"Performance: {validationsPerSecond:F2} validations per second");
        }

        [Test]
        [Category("Performance")]
        public async Task Performance_EventSeriesGeneration_ShouldHandleLargeRecurringSeries()
        {
            // Arrange - Create very long-term recurring series
            var largeSeriesRequest = new
            {
                Name = "Large Performance Test Series",
                Description = "Very large recurring series for performance testing",
                StartDate = DateTime.Now.AddDays(1),
                EndDate = DateTime.Now.AddDays(730), // 2 years
                RecurrencePattern = "Daily",
                RecurrenceInterval = 1,
                EventTemplate = new
                {
                    Name = "Daily Event #{SeriesNumber}",
                    Location = "Performance Test Venue",
                    Description = "Daily performance test event",
                    Duration = "01:00:00", // 1 hour
                    MaxCapacity = 50
                }
            };

            var createSeriesRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/event-series", 
                largeSeriesRequest);

            var createSeriesResponse = await _client.SendAsync(createSeriesRequest);
            createSeriesResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

            var createdSeries = JsonSerializer.Deserialize<JsonElement>(
                await createSeriesResponse.Content.ReadAsStringAsync());
            var seriesId = createdSeries.GetProperty("id").GetInt32();

            // Act - Generate large number of events
            var stopwatch = Stopwatch.StartNew();

            var generateEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/event-series/{seriesId}/generate-events");

            var generateEventsResponse = await _client.SendAsync(generateEventsRequest);
            
            stopwatch.Stop();

            // Assert
            generateEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(30000); // Less than 30 seconds

            var generatedEvents = JsonSerializer.Deserialize<JsonElement[]>(
                await generateEventsResponse.Content.ReadAsStringAsync());
            
            generatedEvents.Should().NotBeEmpty();
            generatedEvents.Length.Should().BeGreaterThan(700); // Should generate ~730 daily events

            var eventsPerSecond = generatedEvents.Length / (stopwatch.ElapsedMilliseconds / 1000.0);
            eventsPerSecond.Should().BeGreaterThan(20); // At least 20 events per second

            TestContext.WriteLine($"Event series generation: {generatedEvents.Length} events in {stopwatch.ElapsedMilliseconds}ms");
            TestContext.WriteLine($"Performance: {eventsPerSecond:F2} events per second");

            // Test series retrieval performance
            var retrievalStopwatch = Stopwatch.StartNew();

            var getSeriesEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/event-series/{seriesId}/events?page=1&pageSize=100");

            var getSeriesEventsResponse = await _client.SendAsync(getSeriesEventsRequest);
            
            retrievalStopwatch.Stop();

            getSeriesEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            retrievalStopwatch.ElapsedMilliseconds.Should().BeLessThan(2000); // Less than 2 seconds

            TestContext.WriteLine($"Series events retrieval (first 100): {retrievalStopwatch.ElapsedMilliseconds}ms");
        }

        [Test]
        [Category("Performance")]
        public async Task Performance_DatabaseOperations_ShouldOptimizeQueries()
        {
            // Arrange - Create complex event data scenario
            await CreateBulkEventsAsync(2000);
            await CreateBulkUsersAsync(5000);

            // Act & Assert - Test various database-heavy operations
            var operationResults = new Dictionary<string, long>();

            // Test 1: Complex event search with filters
            var searchStopwatch = Stopwatch.StartNew();
            var searchRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/clubs/{_testClubId}/events?upcoming=true&location=Venue&capacity=100&page=1&pageSize=50");

            var searchResponse = await _client.SendAsync(searchRequest);
            searchStopwatch.Stop();

            searchResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            operationResults["Complex Search"] = searchStopwatch.ElapsedMilliseconds;

            // Test 2: Event aggregation queries
            var aggregationStopwatch = Stopwatch.StartNew();
            var statsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/clubs/{_testClubId}/events/statistics");

            var statsResponse = await _client.SendAsync(statsRequest);
            aggregationStopwatch.Stop();

            statsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            operationResults["Aggregation Queries"] = aggregationStopwatch.ElapsedMilliseconds;

            // Test 3: User event history queries
            var historyStopwatch = Stopwatch.StartNew();
            var historyRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/users/{_testUserId}/events/history?page=1&pageSize=50");

            var historyResponse = await _client.SendAsync(historyRequest);
            historyStopwatch.Stop();

            historyResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            operationResults["User History"] = historyStopwatch.ElapsedMilliseconds;

            // Assert all operations meet performance criteria
            foreach (var operation in operationResults)
            {
                operation.Value.Should().BeLessThan(ACCEPTABLE_RESPONSE_TIME_MS, 
                    $"{operation.Key} should complete within acceptable time");
                
                TestContext.WriteLine($"{operation.Key}: {operation.Value}ms");
            }
        }

        [Test]
        [Category("Performance")]
        public async Task Performance_MemoryUsage_ShouldStayWithinLimits()
        {
            // Arrange
            var initialMemory = GC.GetTotalMemory(true);
            
            // Act - Perform memory-intensive operations
            await CreateBulkEventsAsync(1000);
            
            // Simulate processing large event lists
            for (int i = 0; i < 10; i++)
            {
                var request = CreateAuthenticatedRequest(
                    HttpMethod.Get, 
                    $"/api/clubs/{_testClubId}/events?page={i + 1}&pageSize=100");

                var response = await _client.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();
                
                // Force garbage collection after each iteration
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();
            }

            var finalMemory = GC.GetTotalMemory(true);

            // Assert
            var memoryIncrease = finalMemory - initialMemory;
            var memoryIncreaseMB = memoryIncrease / 1024.0 / 1024.0;

            // Memory increase should be reasonable (less than 100MB for this test)
            memoryIncreaseMB.Should().BeLessThan(100, 
                "Memory usage should not increase excessively during bulk operations");

            TestContext.WriteLine($"Initial Memory: {initialMemory / 1024.0 / 1024.0:F2} MB");
            TestContext.WriteLine($"Final Memory: {finalMemory / 1024.0 / 1024.0:F2} MB");
            TestContext.WriteLine($"Memory Increase: {memoryIncreaseMB:F2} MB");
        }

        #region Helper Methods

        private async Task CreateBulkEventsAsync(int count)
        {
            var events = new List<Event>();
            for (int i = 1; i <= count; i++)
            {
                var eventEntity = new Event
                {
                    Id = 10000 + i,
                    ClubId = _testClubId,
                    Name = $"Bulk Event {i}",
                    Description = $"Performance test event {i}",
                    StartTime = DateTime.Now.AddDays(i % 30 + 1),
                    EndTime = DateTime.Now.AddDays(i % 30 + 1).AddHours(2),
                    Location = $"Venue {i % 10}",
                    MaxCapacity = 100,
                    CreatedAt = DateTime.UtcNow,
                    CreatedById = _testUserId
                };
                events.Add(eventEntity);
            }

            _dbContext.Events.AddRange(events);
            await _dbContext.SaveChangesAsync();
        }

        private async Task CreateBulkUsersAsync(int count)
        {
            var users = new List<User>();
            for (int i = 1; i <= count; i++)
            {
                var user = new User
                {
                    Id = 50000 + i,
                    FirstName = $"Bulk",
                    LastName = $"User{i}",
                    Email = $"bulk.user{i}@perf.test",
                    CreatedAt = DateTime.UtcNow
                };
                users.Add(user);
            }

            _dbContext.Users.AddRange(users);
            await _dbContext.SaveChangesAsync();
        }

        #endregion
    }
}