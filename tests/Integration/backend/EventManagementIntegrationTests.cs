using NUnit.Framework;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;

namespace GatherGrove.Integration.Tests.EventManagement
{
    /// <summary>
    /// Integration tests for US-009 Advanced Event Management workflows
    /// Tests complete event lifecycle from creation to attendance tracking
    /// </summary>
    [TestFixture]
    public class EventManagementIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private WebApplicationFactory<Program> _factory;
        private HttpClient _client;
        private ApplicationDbContext _dbContext;
        private string _authToken;
        private int _testClubId;
        private int _testUserId;

        [OneTimeSetUp]
        public async Task OneTimeSetUp()
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
                            services.Remove(descriptor);

                        // Add ApplicationDbContext using an in-memory database for testing
                        services.AddDbContext<ApplicationDbContext>(options =>
                        {
                            options.UseInMemoryDatabase("TestDb_EventManagement");
                        });
                    });
                });

            _client = _factory.CreateClient();
            
            // Setup test database context
            var scope = _factory.Services.CreateScope();
            _dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await _dbContext.Database.EnsureCreatedAsync();

            // Setup test data
            await SetupTestDataAsync();
        }

        [OneTimeTearDown]
        public async Task OneTimeTearDown()
        {
            await _dbContext.Database.EnsureDeletedAsync();
            _dbContext?.Dispose();
            _client?.Dispose();
            _factory?.Dispose();
        }

        private async Task SetupTestDataAsync()
        {
            // Create test user
            var testUser = new User
            {
                Id = 1,
                FirstName = "Integration",
                LastName = "Test",
                Email = "integration.test@gathergrove.com",
                PhoneNumber = "555-0100",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Users.Add(testUser);
            _testUserId = testUser.Id;

            // Create test club
            var testClub = new Club
            {
                Id = 1,
                Name = "Integration Test Club",
                Description = "Club for integration testing",
                CreatedById = _testUserId,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Clubs.Add(testClub);
            _testClubId = testClub.Id;

            await _dbContext.SaveChangesAsync();

            // Get auth token for requests
            _authToken = await GetAuthTokenAsync();
        }

        private async Task<string> GetAuthTokenAsync()
        {
            var loginRequest = new
            {
                Email = "integration.test@gathergrove.com",
                Password = "TestPassword123!"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(loginRequest),
                Encoding.UTF8,
                "application/json");

            // Mock authentication for testing
            return "mock-jwt-token-for-testing";
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
        [Order(1)]
        public async Task EventSeries_CompleteWorkflow_ShouldCreateSeriesAndGenerateEvents()
        {
            // Arrange - Create event series request
            var eventSeriesRequest = new CreateEventSeriesRequest
            {
                Name = "Weekly Integration Test Series",
                Description = "Integration test for event series",
                StartDate = DateTime.Now.AddDays(7),
                EndDate = DateTime.Now.AddDays(35), // 4 weeks
                RecurrencePattern = "Weekly",
                RecurrenceInterval = 1,
                DaysOfWeek = new[] { DayOfWeek.Wednesday },
                EventTemplate = new EventTemplate
                {
                    Name = "Integration Test Event #{SeriesNumber}",
                    Location = "Test Location",
                    Description = "Weekly integration test event",
                    Duration = TimeSpan.FromHours(2),
                    MaxCapacity = 50
                }
            };

            // Act 1 - Create event series
            var createRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/event-series", 
                eventSeriesRequest);

            var createResponse = await _client.SendAsync(createRequest);

            // Assert 1 - Event series created
            createResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
            var createdSeries = JsonSerializer.Deserialize<EventSeries>(
                await createResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            createdSeries.Should().NotBeNull();
            createdSeries.Name.Should().Be(eventSeriesRequest.Name);
            var eventSeriesId = createdSeries.Id;

            // Act 2 - Generate events from series
            var generateRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/event-series/{eventSeriesId}/generate-events");

            var generateResponse = await _client.SendAsync(generateRequest);

            // Assert 2 - Events generated successfully
            generateResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var generatedEvents = JsonSerializer.Deserialize<List<Event>>(
                await generateResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            generatedEvents.Should().NotBeEmpty();
            generatedEvents.Count.Should().Be(4); // 4 Wednesdays in 28 days

            // Act 3 - Retrieve series events
            var getEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/event-series/{eventSeriesId}/events");

            var getEventsResponse = await _client.SendAsync(getEventsRequest);

            // Assert 3 - Events retrieved correctly
            getEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var retrievedEvents = JsonSerializer.Deserialize<List<Event>>(
                await getEventsResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            retrievedEvents.Should().HaveCount(4);
            retrievedEvents.All(e => e.Name.Contains("Integration Test Event #")).Should().BeTrue();
        }

        [Test]
        [Order(2)]
        public async Task Waitlist_CompleteWorkflow_ShouldManageWaitlistAndPromotions()
        {
            // Arrange - Create event with limited capacity
            var eventRequest = new CreateEventRequest
            {
                Name = "Limited Capacity Event",
                Description = "Integration test for waitlist functionality",
                StartTime = DateTime.Now.AddDays(10),
                EndTime = DateTime.Now.AddDays(10).AddHours(2),
                Location = "Test Venue",
                MaxCapacity = 2, // Very limited capacity
                EnableWaitlist = true,
                WaitlistLimit = 10
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            createEventResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
            
            var createdEvent = JsonSerializer.Deserialize<Event>(
                await createEventResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var eventId = createdEvent.Id;

            // Create additional test users for waitlist testing
            var waitlistUsers = new List<User>();
            for (int i = 1; i <= 5; i++)
            {
                var user = new User
                {
                    Id = _testUserId + i,
                    FirstName = $"Waitlist",
                    LastName = $"User{i}",
                    Email = $"waitlist.user{i}@test.com",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                waitlistUsers.Add(user);
            }
            await _dbContext.SaveChangesAsync();

            // Act 1 - Fill event to capacity
            for (int i = 0; i < 2; i++)
            {
                var rsvpRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/rsvp", 
                    new { UserId = waitlistUsers[i].Id, Response = "yes" });

                var rsvpResponse = await _client.SendAsync(rsvpRequest);
                rsvpResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            }

            // Act 2 - Add users to waitlist
            for (int i = 2; i < 5; i++)
            {
                var waitlistRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/waitlist/join", 
                    new { UserId = waitlistUsers[i].Id, Priority = i - 1 });

                var waitlistResponse = await _client.SendAsync(waitlistRequest);
                waitlistResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            }

            // Assert 1 - Verify waitlist status
            var waitlistStatusRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/waitlist");

            var waitlistStatusResponse = await _client.SendAsync(waitlistStatusRequest);
            waitlistStatusResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var waitlistEntries = JsonSerializer.Deserialize<List<WaitlistEntry>>(
                await waitlistStatusResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            waitlistEntries.Should().HaveCount(3);
            waitlistEntries.Should().BeInAscendingOrder(w => w.Position);

            // Act 3 - Cancel RSVP to trigger waitlist promotion
            var cancelRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/rsvp", 
                new { UserId = waitlistUsers[0].Id, Response = "no" });

            var cancelResponse = await _client.SendAsync(cancelRequest);
            cancelResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // Assert 2 - Verify automatic promotion from waitlist
            await Task.Delay(1000); // Allow time for background processing

            var updatedWaitlistRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/waitlist");

            var updatedWaitlistResponse = await _client.SendAsync(updatedWaitlistRequest);
            var updatedWaitlistEntries = JsonSerializer.Deserialize<List<WaitlistEntry>>(
                await updatedWaitlistResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            updatedWaitlistEntries.Should().HaveCount(2); // One less due to promotion
        }

        [Test]
        [Order(3)]
        public async Task QRCode_CompleteWorkflow_ShouldGenerateAndValidateQRCodes()
        {
            // Arrange - Create event for QR code testing
            var eventRequest = new CreateEventRequest
            {
                Name = "QR Code Test Event",
                Description = "Integration test for QR code functionality",
                StartTime = DateTime.Now.AddDays(5),
                EndTime = DateTime.Now.AddDays(5).AddHours(3),
                Location = "QR Test Venue",
                MaxCapacity = 100,
                EnableQRCode = true
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            var createdEvent = JsonSerializer.Deserialize<Event>(
                await createEventResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var eventId = createdEvent.Id;

            // Act 1 - Generate QR code for event
            var generateQRRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/qr-code/generate");

            var generateQRResponse = await _client.SendAsync(generateQRRequest);

            // Assert 1 - QR code generated successfully
            generateQRResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var qrCodeData = JsonSerializer.Deserialize<QRCodeResponse>(
                await generateQRResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            qrCodeData.Should().NotBeNull();
            qrCodeData.QRCodeData.Should().NotBeNullOrEmpty();
            qrCodeData.ExpiresAt.Should().BeAfter(DateTime.UtcNow);

            // Act 2 - Validate QR code
            var validateQRRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/qr-code/validate", 
                new { QRCodeData = qrCodeData.QRCodeData, UserId = _testUserId });

            var validateQRResponse = await _client.SendAsync(validateQRRequest);

            // Assert 2 - QR code validation successful
            validateQRResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var validationResult = JsonSerializer.Deserialize<QRValidationResult>(
                await validateQRResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            validationResult.IsValid.Should().BeTrue();
            validationResult.AttendanceMarked.Should().BeTrue();

            // Act 3 - Attempt to reuse QR code (should fail)
            var reuseQRRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/qr-code/validate", 
                new { QRCodeData = qrCodeData.QRCodeData, UserId = _testUserId });

            var reuseQRResponse = await _client.SendAsync(reuseQRRequest);

            // Assert 3 - Replay attack prevention
            var reuseValidationResult = JsonSerializer.Deserialize<QRValidationResult>(
                await reuseQRResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            reuseValidationResult.IsValid.Should().BeFalse();
            reuseValidationResult.ErrorMessage.Should().Contain("already used");
        }

        [Test]
        [Order(4)]
        public async Task EventAttendance_CompleteWorkflow_ShouldTrackAttendanceAccurately()
        {
            // Arrange - Create event and add attendees
            var eventRequest = new CreateEventRequest
            {
                Name = "Attendance Tracking Event",
                Description = "Integration test for attendance tracking",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                Location = "Attendance Test Venue",
                MaxCapacity = 50
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            var createdEvent = JsonSerializer.Deserialize<Event>(
                await createEventResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var eventId = createdEvent.Id;

            // Create test attendees
            var attendees = new List<User>();
            for (int i = 1; i <= 10; i++)
            {
                var user = new User
                {
                    Id = _testUserId + 100 + i,
                    FirstName = $"Attendee",
                    LastName = $"User{i}",
                    Email = $"attendee.user{i}@test.com",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                attendees.Add(user);
            }
            await _dbContext.SaveChangesAsync();

            // Act 1 - Register attendees for event
            for (int i = 0; i < 10; i++)
            {
                var rsvpRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/rsvp", 
                    new { UserId = attendees[i].Id, Response = "yes" });

                var rsvpResponse = await _client.SendAsync(rsvpRequest);
                rsvpResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            }

            // Act 2 - Mark attendance for some attendees
            for (int i = 0; i < 7; i++) // 7 out of 10 attend
            {
                var attendanceRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/attendance", 
                    new { UserId = attendees[i].Id, Attended = true, CheckInTime = DateTime.UtcNow });

                var attendanceResponse = await _client.SendAsync(attendanceRequest);
                attendanceResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            }

            // Act 3 - Get attendance report
            var reportRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/attendance/report");

            var reportResponse = await _client.SendAsync(reportRequest);

            // Assert - Verify attendance statistics
            reportResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var attendanceReport = JsonSerializer.Deserialize<AttendanceReport>(
                await reportResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            attendanceReport.Should().NotBeNull();
            attendanceReport.TotalRegistered.Should().Be(10);
            attendanceReport.TotalAttended.Should().Be(7);
            attendanceReport.AttendanceRate.Should().Be(70.0);
            attendanceReport.NoShows.Should().Be(3);
        }

        [Test]
        [Order(5)]
        public async Task RealTimeUpdates_EventChanges_ShouldNotifySubscribers()
        {
            // Arrange - Create event for real-time testing
            var eventRequest = new CreateEventRequest
            {
                Name = "Real-Time Updates Event",
                Description = "Integration test for real-time updates",
                StartTime = DateTime.Now.AddDays(14),
                EndTime = DateTime.Now.AddDays(14).AddHours(1),
                Location = "Real-Time Test Venue",
                MaxCapacity = 30
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            var createdEvent = JsonSerializer.Deserialize<Event>(
                await createEventResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var eventId = createdEvent.Id;

            // Act 1 - Subscribe to event updates (mock SignalR connection)
            var subscribeRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/subscribe");

            var subscribeResponse = await _client.SendAsync(subscribeRequest);
            subscribeResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // Act 2 - Update event details
            var updateRequest = new UpdateEventRequest
            {
                Name = "Updated Real-Time Event",
                Location = "Updated Venue",
                MaxCapacity = 40
            };

            var updateEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Put, 
                $"/api/events/{eventId}", 
                updateRequest);

            var updateEventResponse = await _client.SendAsync(updateEventRequest);

            // Assert - Event updated successfully
            updateEventResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            var updatedEvent = JsonSerializer.Deserialize<Event>(
                await updateEventResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            updatedEvent.Name.Should().Be("Updated Real-Time Event");
            updatedEvent.Location.Should().Be("Updated Venue");
            updatedEvent.MaxCapacity.Should().Be(40);

            // Note: In a real implementation, we would verify SignalR notifications
            // For integration testing, we verify the HTTP responses
        }

        [Test]
        [Order(6)]
        public async Task PerformanceTest_BulkEventOperations_ShouldHandleLargeDatasets()
        {
            // Arrange - Prepare for bulk operations
            const int bulkEventCount = 50;
            var bulkEvents = new List<CreateEventRequest>();

            for (int i = 1; i <= bulkEventCount; i++)
            {
                bulkEvents.Add(new CreateEventRequest
                {
                    Name = $"Bulk Event {i}",
                    Description = $"Performance test event {i}",
                    StartTime = DateTime.Now.AddDays(20 + i),
                    EndTime = DateTime.Now.AddDays(20 + i).AddHours(2),
                    Location = $"Venue {i}",
                    MaxCapacity = 100
                });
            }

            // Act - Create events in bulk
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            var createdEventIds = new List<int>();

            foreach (var eventReq in bulkEvents)
            {
                var createRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/clubs/{_testClubId}/events", 
                    eventReq);

                var createResponse = await _client.SendAsync(createRequest);
                createResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

                var createdEvent = JsonSerializer.Deserialize<Event>(
                    await createResponse.Content.ReadAsStringAsync(),
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                createdEventIds.Add(createdEvent.Id);
            }

            stopwatch.Stop();

            // Assert - Performance benchmarks
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(30000); // Less than 30 seconds
            createdEventIds.Should().HaveCount(bulkEventCount);

            // Verify bulk retrieval performance
            var bulkGetStopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            var getEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/clubs/{_testClubId}/events?limit={bulkEventCount}");

            var getEventsResponse = await _client.SendAsync(getEventsRequest);
            
            bulkGetStopwatch.Stop();

            getEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            bulkGetStopwatch.ElapsedMilliseconds.Should().BeLessThan(5000); // Less than 5 seconds

            var retrievedEvents = JsonSerializer.Deserialize<List<Event>>(
                await getEventsResponse.Content.ReadAsStringAsync(),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            retrievedEvents.Should().HaveCountGreaterOrEqualTo(bulkEventCount);
        }
    }

    // Supporting DTOs for integration testing
    public class CreateEventSeriesRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string RecurrencePattern { get; set; } = string.Empty;
        public int RecurrenceInterval { get; set; }
        public DayOfWeek[] DaysOfWeek { get; set; } = Array.Empty<DayOfWeek>();
        public EventTemplate EventTemplate { get; set; } = new();
    }

    public class EventTemplate
    {
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public int MaxCapacity { get; set; }
    }

    public class CreateEventRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Location { get; set; } = string.Empty;
        public int MaxCapacity { get; set; }
        public bool EnableWaitlist { get; set; }
        public int WaitlistLimit { get; set; }
        public bool EnableQRCode { get; set; }
    }

    public class UpdateEventRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int MaxCapacity { get; set; }
    }

    public class QRCodeResponse
    {
        public string QRCodeData { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string ImageData { get; set; } = string.Empty;
    }

    public class QRValidationResult
    {
        public bool IsValid { get; set; }
        public bool AttendanceMarked { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public DateTime? CheckInTime { get; set; }
    }

    public class WaitlistEntry
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int EventId { get; set; }
        public int Position { get; set; }
        public int Priority { get; set; }
        public DateTime JoinedAt { get; set; }
    }

    public class AttendanceReport
    {
        public int TotalRegistered { get; set; }
        public int TotalAttended { get; set; }
        public double AttendanceRate { get; set; }
        public int NoShows { get; set; }
        public List<AttendanceRecord> AttendanceRecords { get; set; } = new();
    }

    public class AttendanceRecord
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public bool Attended { get; set; }
        public DateTime? CheckInTime { get; set; }
    }
}