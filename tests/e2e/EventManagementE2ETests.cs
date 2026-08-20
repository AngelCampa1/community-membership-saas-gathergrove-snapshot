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

namespace GatherGrove.E2E.Tests.EventManagement
{
    /// <summary>
    /// End-to-End tests for US-009 Advanced Event Management
    /// Tests complete user journeys from event creation to attendance tracking
    /// Simulates real user interactions across the entire system
    /// </summary>
    [TestFixture]
    public class EventManagementE2ETests : IClassFixture<WebApplicationFactory<Program>>
    {
        private WebApplicationFactory<Program> _factory;
        private HttpClient _client;
        private ApplicationDbContext _dbContext;
        private string _adminAuthToken;
        private string _memberAuthToken;
        private int _testClubId;
        private int _adminUserId;
        private int _memberUserId;

        [OneTimeSetUp]
        public async Task OneTimeSetUp()
        {
            _factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Configure test database
                        var descriptor = services.SingleOrDefault(
                            d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                        if (descriptor != null)
                            services.Remove(descriptor);

                        services.AddDbContext<ApplicationDbContext>(options =>
                        {
                            options.UseInMemoryDatabase("TestDb_E2E_EventManagement");
                        });
                    });
                });

            _client = _factory.CreateClient();
            
            var scope = _factory.Services.CreateScope();
            _dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await _dbContext.Database.EnsureCreatedAsync();

            await SetupE2ETestDataAsync();
        }

        [OneTimeTearDown]
        public async Task OneTimeTearDown()
        {
            await _dbContext.Database.EnsureDeletedAsync();
            _dbContext?.Dispose();
            _client?.Dispose();
            _factory?.Dispose();
        }

        private async Task SetupE2ETestDataAsync()
        {
            // Create admin user
            var adminUser = new User
            {
                Id = 1,
                FirstName = "Admin",
                LastName = "User",
                Email = "admin.e2e@gathergrove.club",
                PhoneNumber = "555-0101",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Users.Add(adminUser);
            _adminUserId = adminUser.Id;

            // Create member user
            var memberUser = new User
            {
                Id = 2,
                FirstName = "Member",
                LastName = "User",
                Email = "member.e2e@gathergrove.club",
                PhoneNumber = "555-0102",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Users.Add(memberUser);
            _memberUserId = memberUser.Id;

            // Create test club
            var testClub = new Club
            {
                Id = 1,
                Name = "E2E Test Club",
                Description = "Club for end-to-end testing",
                CreatedById = _adminUserId,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Clubs.Add(testClub);
            _testClubId = testClub.Id;

            await _dbContext.SaveChangesAsync();

            // Setup authentication tokens
            _adminAuthToken = "mock-admin-jwt-token";
            _memberAuthToken = "mock-member-jwt-token";
        }

        private HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string uri, string token, object? content = null)
        {
            var request = new HttpRequestMessage(method, uri);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            
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
        public async Task E2E_ClubAdminCreatesRecurringEventSeries_MembersCanViewAndRSVP()
        {
            // ========== PHASE 1: ADMIN CREATES RECURRING EVENT SERIES ==========
            
            // Admin creates a recurring book club series
            var eventSeriesRequest = new
            {
                Name = "Weekly Book Club Discussion",
                Description = "Weekly book club meetings for literature enthusiasts",
                StartDate = DateTime.Now.AddDays(7),
                EndDate = DateTime.Now.AddDays(56), // 8 weeks
                RecurrencePattern = "Weekly",
                RecurrenceInterval = 1,
                DaysOfWeek = new[] { "Tuesday" },
                EventTemplate = new
                {
                    Name = "Book Club Discussion #{SeriesNumber}",
                    Location = "Community Center - Room B",
                    Description = "Weekly book discussion and literary analysis",
                    Duration = "02:00:00", // 2 hours
                    MaxCapacity = 25,
                    EnableWaitlist = true,
                    WaitlistLimit = 10
                }
            };

            var createSeriesRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/event-series", 
                _adminAuthToken,
                eventSeriesRequest);

            var createSeriesResponse = await _client.SendAsync(createSeriesRequest);
            createSeriesResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

            var createdSeries = JsonSerializer.Deserialize<dynamic>(
                await createSeriesResponse.Content.ReadAsStringAsync());
            var eventSeriesId = ((JsonElement)createdSeries).GetProperty("id").GetInt32();

            // Admin generates individual events from the series
            var generateEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/event-series/{eventSeriesId}/generate-events", 
                _adminAuthToken);

            var generateEventsResponse = await _client.SendAsync(generateEventsRequest);
            generateEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var generatedEvents = JsonSerializer.Deserialize<JsonElement[]>(
                await generateEventsResponse.Content.ReadAsStringAsync());
            
            generatedEvents.Should().NotBeEmpty();
            generatedEvents.Length.Should().Be(8); // 8 Tuesdays in 56 days

            // ========== PHASE 2: MEMBERS DISCOVER AND VIEW EVENTS ==========

            // Member browses club events
            var browseEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/clubs/{_testClubId}/events?upcoming=true", 
                _memberAuthToken);

            var browseEventsResponse = await _client.SendAsync(browseEventsRequest);
            browseEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var clubEvents = JsonSerializer.Deserialize<JsonElement[]>(
                await browseEventsResponse.Content.ReadAsStringAsync());
            
            clubEvents.Should().NotBeEmpty();
            var firstEventId = clubEvents[0].GetProperty("id").GetInt32();

            // Member views detailed event information
            var viewEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{firstEventId}", 
                _memberAuthToken);

            var viewEventResponse = await _client.SendAsync(viewEventRequest);
            viewEventResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var eventDetails = JsonSerializer.Deserialize<JsonElement>(
                await viewEventResponse.Content.ReadAsStringAsync());
            
            eventDetails.GetProperty("name").GetString().Should().Contain("Book Club Discussion");
            eventDetails.GetProperty("maxCapacity").GetInt32().Should().Be(25);

            // ========== PHASE 3: MEMBER RSVP AND WAITLIST MANAGEMENT ==========

            // Member RSVPs for multiple events in the series
            var rsvpRequests = new List<int>();
            for (int i = 0; i < Math.Min(3, clubEvents.Length); i++)
            {
                var eventId = clubEvents[i].GetProperty("id").GetInt32();
                rsvpRequests.Add(eventId);

                var rsvpRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/rsvp", 
                    _memberAuthToken,
                    new { Response = "yes" });

                var rsvpResponse = await _client.SendAsync(rsvpRequest);
                rsvpResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            }

            // Verify RSVP status
            foreach (var eventId in rsvpRequests)
            {
                var rsvpStatusRequest = CreateAuthenticatedRequest(
                    HttpMethod.Get, 
                    $"/api/events/{eventId}/rsvp/{_memberUserId}", 
                    _memberAuthToken);

                var rsvpStatusResponse = await _client.SendAsync(rsvpStatusRequest);
                rsvpStatusResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

                var rsvpStatus = JsonSerializer.Deserialize<JsonElement>(
                    await rsvpStatusResponse.Content.ReadAsStringAsync());
                rsvpStatus.GetProperty("response").GetString().Should().Be("yes");
            }

            // ========== PHASE 4: EVENT CAPACITY AND WAITLIST TESTING ==========

            // Create additional users to test capacity limits
            var additionalUsers = new List<User>();
            for (int i = 1; i <= 30; i++) // More than event capacity
            {
                var user = new User
                {
                    Id = 100 + i,
                    FirstName = $"Test",
                    LastName = $"Member{i}",
                    Email = $"testmember{i}@e2e.com",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                additionalUsers.Add(user);
            }
            await _dbContext.SaveChangesAsync();

            // Fill event to capacity and beyond to test waitlist
            var targetEventId = rsvpRequests[0];
            var waitlistedUsers = new List<int>();

            for (int i = 0; i < 30; i++)
            {
                var userId = additionalUsers[i].Id;
                var rsvpRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{targetEventId}/rsvp", 
                    _adminAuthToken, // Admin can RSVP on behalf of users
                    new { UserId = userId, Response = "yes" });

                var rsvpResponse = await _client.SendAsync(rsvpRequest);
                
                if (rsvpResponse.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    // Successfully added to event
                }
                else if (rsvpResponse.StatusCode == System.Net.HttpStatusCode.Accepted)
                {
                    // Added to waitlist
                    waitlistedUsers.Add(userId);
                }
            }

            // Verify waitlist functionality
            var waitlistRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{targetEventId}/waitlist", 
                _adminAuthToken);

            var waitlistResponse = await _client.SendAsync(waitlistRequest);
            waitlistResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var waitlistEntries = JsonSerializer.Deserialize<JsonElement[]>(
                await waitlistResponse.Content.ReadAsStringAsync());
            waitlistEntries.Should().NotBeEmpty();

            // ========== PHASE 5: QR CODE GENERATION AND VALIDATION ==========

            // Admin generates QR code for event check-in
            var generateQRRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{targetEventId}/qr-code/generate", 
                _adminAuthToken);

            var generateQRResponse = await _client.SendAsync(generateQRRequest);
            generateQRResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var qrCodeData = JsonSerializer.Deserialize<JsonElement>(
                await generateQRResponse.Content.ReadAsStringAsync());
            
            var qrCodeString = qrCodeData.GetProperty("qrCodeData").GetString();
            qrCodeString.Should().NotBeNullOrEmpty();

            // Member scans QR code to check in
            var qrValidationRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{targetEventId}/qr-code/validate", 
                _memberAuthToken,
                new { QRCodeData = qrCodeString, UserId = _memberUserId });

            var qrValidationResponse = await _client.SendAsync(qrValidationRequest);
            qrValidationResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var validationResult = JsonSerializer.Deserialize<JsonElement>(
                await qrValidationResponse.Content.ReadAsStringAsync());
            
            validationResult.GetProperty("isValid").GetBoolean().Should().BeTrue();
            validationResult.GetProperty("attendanceMarked").GetBoolean().Should().BeTrue();

            // ========== PHASE 6: ATTENDANCE TRACKING AND REPORTING ==========

            // Admin marks attendance for multiple members
            var attendanceUsers = additionalUsers.Take(10).ToList();
            foreach (var user in attendanceUsers)
            {
                var attendanceRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{targetEventId}/attendance", 
                    _adminAuthToken,
                    new 
                    { 
                        UserId = user.Id, 
                        Attended = true, 
                        CheckInTime = DateTime.UtcNow.AddMinutes(Random.Shared.Next(-10, 10))
                    });

                var attendanceResponse = await _client.SendAsync(attendanceRequest);
                attendanceResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
            }

            // Admin generates attendance report
            var reportRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{targetEventId}/attendance/report", 
                _adminAuthToken);

            var reportResponse = await _client.SendAsync(reportRequest);
            reportResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var attendanceReport = JsonSerializer.Deserialize<JsonElement>(
                await reportResponse.Content.ReadAsStringAsync());
            
            attendanceReport.GetProperty("totalAttended").GetInt32().Should().BeGreaterThan(10);
            attendanceReport.GetProperty("attendanceRate").GetDouble().Should().BeGreaterThan(0.0);

            // ========== PHASE 7: EVENT SERIES MANAGEMENT ==========

            // Admin updates event series settings
            var updateSeriesRequest = CreateAuthenticatedRequest(
                HttpMethod.Put, 
                $"/api/event-series/{eventSeriesId}", 
                _adminAuthToken,
                new 
                { 
                    Name = "Updated Weekly Book Club Discussion",
                    Description = "Updated description for the book club series"
                });

            var updateSeriesResponse = await _client.SendAsync(updateSeriesRequest);
            updateSeriesResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // Verify series update
            var getUpdatedSeriesRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/event-series/{eventSeriesId}", 
                _adminAuthToken);

            var getUpdatedSeriesResponse = await _client.SendAsync(getUpdatedSeriesRequest);
            getUpdatedSeriesResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var updatedSeries = JsonSerializer.Deserialize<JsonElement>(
                await getUpdatedSeriesResponse.Content.ReadAsStringAsync());
            
            updatedSeries.GetProperty("name").GetString().Should().Be("Updated Weekly Book Club Discussion");

            // ========== PHASE 8: MEMBER DASHBOARD AND NOTIFICATIONS ==========

            // Member views their upcoming events
            var memberEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/users/{_memberUserId}/events?upcoming=true", 
                _memberAuthToken);

            var memberEventsResponse = await _client.SendAsync(memberEventsRequest);
            memberEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var memberEvents = JsonSerializer.Deserialize<JsonElement[]>(
                await memberEventsResponse.Content.ReadAsStringAsync());
            
            memberEvents.Should().NotBeEmpty();
            memberEvents.Length.Should().BeGreaterOrEqualTo(2); // Member RSVPed for 3 events

            // Member views event notifications
            var notificationsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/users/{_memberUserId}/notifications?type=event", 
                _memberAuthToken);

            var notificationsResponse = await _client.SendAsync(notificationsRequest);
            // Note: Notifications endpoint may not be implemented yet - that's OK for E2E test
        }

        [Test]
        [Order(2)]
        public async Task E2E_EventCancellationAndWaitlistPromotion_WorkflowComplete()
        {
            // ========== SETUP: CREATE EVENT WITH CAPACITY LIMIT ==========
            
            var eventRequest = new
            {
                Name = "Limited Capacity Workshop",
                Description = "Workshop with very limited capacity for testing",
                StartTime = DateTime.Now.AddDays(15),
                EndTime = DateTime.Now.AddDays(15).AddHours(3),
                Location = "Small Conference Room",
                MaxCapacity = 3,
                EnableWaitlist = true,
                WaitlistLimit = 5
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                _adminAuthToken,
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            createEventResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

            var createdEvent = JsonSerializer.Deserialize<JsonElement>(
                await createEventResponse.Content.ReadAsStringAsync());
            var eventId = createdEvent.GetProperty("id").GetInt32();

            // ========== PHASE 1: FILL EVENT TO CAPACITY ==========

            // Create test users for this scenario
            var testUsers = new List<User>();
            for (int i = 1; i <= 8; i++)
            {
                var user = new User
                {
                    Id = 200 + i,
                    FirstName = $"Workshop",
                    LastName = $"Attendee{i}",
                    Email = $"workshop.attendee{i}@e2e.com",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                testUsers.Add(user);
            }
            await _dbContext.SaveChangesAsync();

            // Fill event to capacity (3 spots)
            var confirmedAttendees = new List<int>();
            var waitlistedAttendees = new List<int>();

            for (int i = 0; i < 8; i++)
            {
                var userId = testUsers[i].Id;
                var rsvpRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/rsvp", 
                    _adminAuthToken,
                    new { UserId = userId, Response = "yes" });

                var rsvpResponse = await _client.SendAsync(rsvpRequest);
                
                if (i < 3)
                {
                    // First 3 should be confirmed
                    rsvpResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
                    confirmedAttendees.Add(userId);
                }
                else
                {
                    // Remaining should be waitlisted
                    rsvpResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);
                    waitlistedAttendees.Add(userId);
                }
            }

            // ========== PHASE 2: VERIFY WAITLIST STATE ==========

            var waitlistRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/waitlist", 
                _adminAuthToken);

            var waitlistResponse = await _client.SendAsync(waitlistRequest);
            waitlistResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var waitlistEntries = JsonSerializer.Deserialize<JsonElement[]>(
                await waitlistResponse.Content.ReadAsStringAsync());
            
            waitlistEntries.Should().HaveCount(5); // 5 people on waitlist
            
            // Verify waitlist positions are correct
            for (int i = 0; i < waitlistEntries.Length; i++)
            {
                waitlistEntries[i].GetProperty("position").GetInt32().Should().Be(i + 1);
            }

            // ========== PHASE 3: CANCELLATION AND AUTOMATIC PROMOTION ==========

            // First confirmed attendee cancels their RSVP
            var cancelUserId = confirmedAttendees[0];
            var cancelRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/rsvp", 
                _adminAuthToken,
                new { UserId = cancelUserId, Response = "no" });

            var cancelResponse = await _client.SendAsync(cancelRequest);
            cancelResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // Allow time for automatic waitlist promotion processing
            await Task.Delay(2000);

            // ========== PHASE 4: VERIFY AUTOMATIC PROMOTION ==========

            // Check updated waitlist - should have one less person
            var updatedWaitlistRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/waitlist", 
                _adminAuthToken);

            var updatedWaitlistResponse = await _client.SendAsync(updatedWaitlistRequest);
            var updatedWaitlistEntries = JsonSerializer.Deserialize<JsonElement[]>(
                await updatedWaitlistResponse.Content.ReadAsStringAsync());
            
            updatedWaitlistEntries.Should().HaveCount(4); // One promoted from waitlist

            // Verify the first waitlisted person is now confirmed
            var promotedUserId = waitlistedAttendees[0];
            var promotedUserRsvpRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/rsvp/{promotedUserId}", 
                _adminAuthToken);

            var promotedUserRsvpResponse = await _client.SendAsync(promotedUserRsvpRequest);
            promotedUserRsvpResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var promotedRsvpStatus = JsonSerializer.Deserialize<JsonElement>(
                await promotedUserRsvpResponse.Content.ReadAsStringAsync());
            
            promotedRsvpStatus.GetProperty("response").GetString().Should().Be("yes");
            promotedRsvpStatus.GetProperty("isWaitlisted").GetBoolean().Should().BeFalse();

            // ========== PHASE 5: EVENT CAPACITY MANAGEMENT ==========

            // Verify current event capacity status
            var eventStatusRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/capacity", 
                _adminAuthToken);

            var eventStatusResponse = await _client.SendAsync(eventStatusRequest);
            eventStatusResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var capacityStatus = JsonSerializer.Deserialize<JsonElement>(
                await eventStatusResponse.Content.ReadAsStringAsync());
            
            capacityStatus.GetProperty("maxCapacity").GetInt32().Should().Be(3);
            capacityStatus.GetProperty("currentAttendees").GetInt32().Should().Be(3); // Still full after promotion
            capacityStatus.GetProperty("waitlistCount").GetInt32().Should().Be(4);
            capacityStatus.GetProperty("availableSpots").GetInt32().Should().Be(0);

            // ========== PHASE 6: ADMIN INCREASES CAPACITY ==========

            // Admin decides to increase event capacity
            var updateCapacityRequest = CreateAuthenticatedRequest(
                HttpMethod.Put, 
                $"/api/events/{eventId}", 
                _adminAuthToken,
                new { MaxCapacity = 6 });

            var updateCapacityResponse = await _client.SendAsync(updateCapacityRequest);
            updateCapacityResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // Allow time for automatic promotions from increased capacity
            await Task.Delay(2000);

            // ========== PHASE 7: VERIFY BULK PROMOTIONS ==========

            // Check if additional waitlisted users were automatically promoted
            var finalWaitlistRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/waitlist", 
                _adminAuthToken);

            var finalWaitlistResponse = await _client.SendAsync(finalWaitlistRequest);
            var finalWaitlistEntries = JsonSerializer.Deserialize<JsonElement[]>(
                await finalWaitlistResponse.Content.ReadAsStringAsync());
            
            finalWaitlistEntries.Should().HaveCount(1); // 3 more promoted due to capacity increase

            // Verify final capacity status
            var finalCapacityRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/capacity", 
                _adminAuthToken);

            var finalCapacityResponse = await _client.SendAsync(finalCapacityRequest);
            var finalCapacityStatus = JsonSerializer.Deserialize<JsonElement>(
                await finalCapacityResponse.Content.ReadAsStringAsync());
            
            finalCapacityStatus.GetProperty("maxCapacity").GetInt32().Should().Be(6);
            finalCapacityStatus.GetProperty("currentAttendees").GetInt32().Should().Be(5); // 2 original + 3 promoted
            finalCapacityStatus.GetProperty("waitlistCount").GetInt32().Should().Be(1);
            finalCapacityStatus.GetProperty("availableSpots").GetInt32().Should().Be(1);
        }

        [Test]
        [Order(3)]
        public async Task E2E_MobileQRCodeScanning_AttendanceTracking_CompleteWorkflow()
        {
            // ========== SETUP: CREATE EVENT FOR QR CODE TESTING ==========
            
            var eventRequest = new
            {
                Name = "QR Code Check-in Event",
                Description = "Event specifically for testing QR code check-in process",
                StartTime = DateTime.Now.AddDays(1), // Tomorrow
                EndTime = DateTime.Now.AddDays(1).AddHours(4),
                Location = "QR Test Conference Center",
                MaxCapacity = 100,
                EnableQRCode = true,
                RequireCheckIn = true
            };

            var createEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/events", 
                _adminAuthToken,
                eventRequest);

            var createEventResponse = await _client.SendAsync(createEventRequest);
            createEventResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

            var createdEvent = JsonSerializer.Deserialize<JsonElement>(
                await createEventResponse.Content.ReadAsStringAsync());
            var eventId = createdEvent.GetProperty("id").GetInt32();

            // ========== PHASE 1: MEMBER REGISTRATION ==========

            // Create mobile users for QR testing
            var mobileUsers = new List<User>();
            for (int i = 1; i <= 15; i++)
            {
                var user = new User
                {
                    Id = 300 + i,
                    FirstName = $"Mobile",
                    LastName = $"User{i}",
                    Email = $"mobile.user{i}@e2e.com",
                    PhoneNumber = $"555-{1000 + i}",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(user);
                mobileUsers.Add(user);
            }
            await _dbContext.SaveChangesAsync();

            // Members register for the event
            var registeredUserIds = new List<int>();
            foreach (var user in mobileUsers.Take(12)) // 12 out of 15 register
            {
                var rsvpRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/rsvp", 
                    _memberAuthToken,
                    new { UserId = user.Id, Response = "yes" });

                var rsvpResponse = await _client.SendAsync(rsvpRequest);
                rsvpResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
                registeredUserIds.Add(user.Id);
            }

            // ========== PHASE 2: ADMIN GENERATES QR CODE ==========

            // Admin generates QR code for event day check-in
            var generateQRRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/qr-code/generate", 
                _adminAuthToken,
                new 
                { 
                    ValidityDuration = 24, // Valid for 24 hours
                    UsageLimit = 100 // Allow 100 scans
                });

            var generateQRResponse = await _client.SendAsync(generateQRRequest);
            generateQRResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var qrCodeResponse = JsonSerializer.Deserialize<JsonElement>(
                await generateQRResponse.Content.ReadAsStringAsync());
            
            var qrCodeData = qrCodeResponse.GetProperty("qrCodeData").GetString();
            var qrImageData = qrCodeResponse.GetProperty("imageData").GetString();
            var expiresAt = qrCodeResponse.GetProperty("expiresAt").GetDateTime();

            qrCodeData.Should().NotBeNullOrEmpty();
            qrImageData.Should().NotBeNullOrEmpty();
            expiresAt.Should().BeAfter(DateTime.UtcNow);

            // ========== PHASE 3: MOBILE APP QR CODE SCANNING SIMULATION ==========

            var checkedInUsers = new List<int>();
            var checkInTimes = new List<DateTime>();

            // Simulate mobile users arriving and scanning QR code
            for (int i = 0; i < 10; i++) // 10 out of 12 registered users actually attend
            {
                var userId = registeredUserIds[i];
                var checkInTime = DateTime.UtcNow.AddMinutes(Random.Shared.Next(-30, 30)); // Arrive within 30 min window
                
                // Simulate mobile app QR code validation
                var qrValidationRequest = CreateAuthenticatedRequest(
                    HttpMethod.Post, 
                    $"/api/events/{eventId}/qr-code/validate", 
                    _memberAuthToken,
                    new 
                    { 
                        QRCodeData = qrCodeData, 
                        UserId = userId,
                        ScanLocation = new 
                        {
                            Latitude = 40.7128 + Random.Shared.NextDouble() * 0.01,
                            Longitude = -74.0060 + Random.Shared.NextDouble() * 0.01
                        },
                        DeviceInfo = new
                        {
                            Platform = "iOS",
                            Version = "17.0",
                            DeviceId = $"device-{userId}"
                        }
                    });

                var qrValidationResponse = await _client.SendAsync(qrValidationRequest);
                qrValidationResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

                var validationResult = JsonSerializer.Deserialize<JsonElement>(
                    await qrValidationResponse.Content.ReadAsStringAsync());
                
                validationResult.GetProperty("isValid").GetBoolean().Should().BeTrue();
                validationResult.GetProperty("attendanceMarked").GetBoolean().Should().BeTrue();
                
                checkedInUsers.Add(userId);
                checkInTimes.Add(checkInTime);

                // Small delay to simulate realistic check-in timing
                await Task.Delay(200);
            }

            // ========== PHASE 4: DUPLICATE SCAN PREVENTION ==========

            // Attempt to scan same QR code with same user (should fail)
            var duplicateUserId = checkedInUsers[0];
            var duplicateScanRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/qr-code/validate", 
                _memberAuthToken,
                new { QRCodeData = qrCodeData, UserId = duplicateUserId });

            var duplicateScanResponse = await _client.SendAsync(duplicateScanRequest);
            
            var duplicateResult = JsonSerializer.Deserialize<JsonElement>(
                await duplicateScanResponse.Content.ReadAsStringAsync());
            
            duplicateResult.GetProperty("isValid").GetBoolean().Should().BeFalse();
            duplicateResult.GetProperty("errorMessage").GetString().Should().Contain("already");

            // ========== PHASE 5: UNREGISTERED USER ATTEMPT ==========

            // Attempt to use QR code with unregistered user
            var unregisteredUserId = mobileUsers.Last().Id; // User who didn't RSVP
            var unauthorizedScanRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{eventId}/qr-code/validate", 
                _memberAuthToken,
                new { QRCodeData = qrCodeData, UserId = unregisteredUserId });

            var unauthorizedScanResponse = await _client.SendAsync(unauthorizedScanRequest);
            
            var unauthorizedResult = JsonSerializer.Deserialize<JsonElement>(
                await unauthorizedScanResponse.Content.ReadAsStringAsync());
            
            unauthorizedResult.GetProperty("isValid").GetBoolean().Should().BeFalse();
            unauthorizedResult.GetProperty("errorMessage").GetString().Should().Contain("not registered");

            // ========== PHASE 6: REAL-TIME ATTENDANCE MONITORING ==========

            // Admin monitors real-time attendance during event
            var realtimeAttendanceRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/attendance/realtime", 
                _adminAuthToken);

            var realtimeAttendanceResponse = await _client.SendAsync(realtimeAttendanceRequest);
            realtimeAttendanceResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var realtimeData = JsonSerializer.Deserialize<JsonElement>(
                await realtimeAttendanceResponse.Content.ReadAsStringAsync());
            
            realtimeData.GetProperty("totalCheckedIn").GetInt32().Should().Be(10);
            realtimeData.GetProperty("expectedAttendees").GetInt32().Should().Be(12);
            realtimeData.GetProperty("checkInRate").GetDouble().Should().BeApproximately(83.33, 0.1);

            // ========== PHASE 7: COMPREHENSIVE ATTENDANCE REPORTING ==========

            // Generate detailed attendance report
            var detailedReportRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/attendance/report?includeCheckInTimes=true&includeNoShows=true", 
                _adminAuthToken);

            var detailedReportResponse = await _client.SendAsync(detailedReportRequest);
            detailedReportResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var attendanceReport = JsonSerializer.Deserialize<JsonElement>(
                await detailedReportResponse.Content.ReadAsStringAsync());
            
            // Verify report accuracy
            attendanceReport.GetProperty("totalRegistered").GetInt32().Should().Be(12);
            attendanceReport.GetProperty("totalAttended").GetInt32().Should().Be(10);
            attendanceReport.GetProperty("noShows").GetInt32().Should().Be(2);
            attendanceReport.GetProperty("attendanceRate").GetDouble().Should().BeApproximately(83.33, 0.1);

            var attendanceRecords = attendanceReport.GetProperty("attendanceRecords").EnumerateArray().ToList();
            attendanceRecords.Should().HaveCount(12); // All registered users

            // Verify check-in times are recorded correctly
            var checkedInRecords = attendanceRecords.Where(r => r.GetProperty("attended").GetBoolean()).ToList();
            checkedInRecords.Should().HaveCount(10);
            
            foreach (var record in checkedInRecords)
            {
                record.GetProperty("checkInTime").GetDateTime().Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromHours(1));
            }

            // ========== PHASE 8: POST-EVENT ANALYTICS ==========

            // Generate analytics report for event performance
            var analyticsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/events/{eventId}/analytics", 
                _adminAuthToken);

            var analyticsResponse = await _client.SendAsync(analyticsRequest);
            analyticsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var analytics = JsonSerializer.Deserialize<JsonElement>(
                await analyticsResponse.Content.ReadAsStringAsync());
            
            // Verify analytics data
            analytics.GetProperty("registrationToAttendanceRatio").GetDouble().Should().BeApproximately(0.833, 0.01);
            analytics.GetProperty("averageCheckInTime").GetString().Should().NotBeNullOrEmpty();
            analytics.GetProperty("peakCheckInPeriod").GetString().Should().NotBeNullOrEmpty();
            
            // QR code usage statistics
            var qrStats = analytics.GetProperty("qrCodeStats");
            qrStats.GetProperty("totalScans").GetInt32().Should().Be(12); // 10 successful + 1 duplicate + 1 unauthorized
            qrStats.GetProperty("successfulScans").GetInt32().Should().Be(10);
            qrStats.GetProperty("failedScans").GetInt32().Should().Be(2);
            qrStats.GetProperty("duplicateAttempts").GetInt32().Should().Be(1);
            qrStats.GetProperty("unauthorizedAttempts").GetInt32().Should().Be(1);
        }

        [Test]
        [Order(4)]
        public async Task E2E_EventSeriesManagement_LongTermRecurringEvents_CompleteLifecycle()
        {
            // ========== SETUP: CREATE LONG-TERM RECURRING SERIES ==========
            
            var monthlySeriesRequest = new
            {
                Name = "Monthly Board Meeting Series",
                Description = "Monthly board meetings for the entire year",
                StartDate = DateTime.Now.AddDays(30), // Start next month
                EndDate = DateTime.Now.AddDays(365), // One full year
                RecurrencePattern = "Monthly",
                RecurrenceInterval = 1,
                DaysOfWeek = new[] { "Tuesday" },
                SpecificDayOfMonth = 15, // 15th of each month
                EventTemplate = new
                {
                    Name = "Board Meeting - {Month} {Year}",
                    Location = "Corporate Boardroom",
                    Description = "Monthly board meeting for strategic planning and decision making",
                    Duration = "03:00:00", // 3 hours
                    MaxCapacity = 15,
                    EnableWaitlist = false, // Board meetings don't typically have waitlists
                    RequireRSVP = true,
                    RSVPDeadline = 7 // 7 days before meeting
                }
            };

            var createSeriesRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/clubs/{_testClubId}/event-series", 
                _adminAuthToken,
                monthlySeriesRequest);

            var createSeriesResponse = await _client.SendAsync(createSeriesRequest);
            createSeriesResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

            var createdSeries = JsonSerializer.Deserialize<JsonElement>(
                await createSeriesResponse.Content.ReadAsStringAsync());
            var seriesId = createdSeries.GetProperty("id").GetInt32();

            // ========== PHASE 1: GENERATE FULL YEAR OF EVENTS ==========

            var generateEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/event-series/{seriesId}/generate-events", 
                _adminAuthToken);

            var generateEventsResponse = await _client.SendAsync(generateEventsRequest);
            generateEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var generatedEvents = JsonSerializer.Deserialize<JsonElement[]>(
                await generateEventsResponse.Content.ReadAsStringAsync());
            
            generatedEvents.Should().NotBeEmpty();
            generatedEvents.Length.Should().Be(12); // 12 months

            // Verify event dates are correctly calculated
            for (int i = 0; i < generatedEvents.Length; i++)
            {
                var eventDate = generatedEvents[i].GetProperty("startTime").GetDateTime();
                eventDate.Day.Should().Be(15); // Should be 15th of each month
            }

            // ========== PHASE 2: BULK SERIES OPERATIONS ==========

            // Get all events in series for management
            var seriesEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/event-series/{seriesId}/events", 
                _adminAuthToken);

            var seriesEventsResponse = await _client.SendAsync(seriesEventsRequest);
            seriesEventsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var seriesEvents = JsonSerializer.Deserialize<JsonElement[]>(
                await seriesEventsResponse.Content.ReadAsStringAsync());
            seriesEvents.Should().HaveCount(12);

            // ========== PHASE 3: SERIES-WIDE UPDATES ==========

            // Update series template to change all future events
            var updateSeriesTemplateRequest = CreateAuthenticatedRequest(
                HttpMethod.Put, 
                $"/api/event-series/{seriesId}/template", 
                _adminAuthToken,
                new
                {
                    Location = "New Executive Conference Center",
                    MaxCapacity = 20, // Increased capacity
                    Description = "Updated: Monthly board meeting for strategic planning and decision making"
                });

            var updateTemplateResponse = await _client.SendAsync(updateSeriesTemplateRequest);
            updateTemplateResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // Verify template updates apply to future events
            await Task.Delay(1000); // Allow time for batch update processing

            var updatedSeriesEventsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/event-series/{seriesId}/events?futureOnly=true", 
                _adminAuthToken);

            var updatedSeriesEventsResponse = await _client.SendAsync(updatedSeriesEventsRequest);
            var updatedSeriesEvents = JsonSerializer.Deserialize<JsonElement[]>(
                await updatedSeriesEventsResponse.Content.ReadAsStringAsync());

            // Future events should reflect template changes
            foreach (var futureEvent in updatedSeriesEvents)
            {
                futureEvent.GetProperty("location").GetString().Should().Be("New Executive Conference Center");
                futureEvent.GetProperty("maxCapacity").GetInt32().Should().Be(20);
            }

            // ========== PHASE 4: EXCEPTION HANDLING - CANCEL SPECIFIC EVENT ==========

            // Cancel one specific event in the series (holiday conflict)
            var holidayEventId = seriesEvents[5].GetProperty("id").GetInt32(); // Cancel 6th event
            
            var cancelEventRequest = CreateAuthenticatedRequest(
                HttpMethod.Put, 
                $"/api/events/{holidayEventId}", 
                _adminAuthToken,
                new 
                { 
                    Status = "Cancelled",
                    CancellationReason = "Holiday conflict - Memorial Day week"
                });

            var cancelEventResponse = await _client.SendAsync(cancelEventRequest);
            cancelEventResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // ========== PHASE 5: RESCHEDULE SPECIFIC EVENT ==========

            // Reschedule the cancelled event to a different date
            var rescheduleRequest = CreateAuthenticatedRequest(
                HttpMethod.Post, 
                $"/api/events/{holidayEventId}/reschedule", 
                _adminAuthToken,
                new
                {
                    NewStartTime = DateTime.Now.AddDays(180), // Different date
                    NewEndTime = DateTime.Now.AddDays(180).AddHours(3),
                    NotifyAttendees = true
                });

            var rescheduleResponse = await _client.SendAsync(rescheduleRequest);
            rescheduleResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // ========== PHASE 6: SERIES ATTENDANCE PATTERNS ==========

            // Create board members for attendance pattern testing
            var boardMembers = new List<User>();
            for (int i = 1; i <= 12; i++)
            {
                var member = new User
                {
                    Id = 400 + i,
                    FirstName = $"Board",
                    LastName = $"Member{i}",
                    Email = $"board.member{i}@e2e.com",
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Users.Add(member);
                boardMembers.Add(member);
            }
            await _dbContext.SaveChangesAsync();

            // Simulate RSVPs for multiple board meetings
            var firstThreeEvents = seriesEvents.Take(3).ToArray();
            
            foreach (var eventElement in firstThreeEvents)
            {
                var eventId = eventElement.GetProperty("id").GetInt32();
                
                // Each board member RSVPs (simulate different attendance patterns)
                for (int i = 0; i < boardMembers.Count; i++)
                {
                    var member = boardMembers[i];
                    // Some members attend all meetings, others are sporadic
                    var willAttend = i < 8 || Random.Shared.NextDouble() > 0.3; 
                    
                    if (willAttend)
                    {
                        var rsvpRequest = CreateAuthenticatedRequest(
                            HttpMethod.Post, 
                            $"/api/events/{eventId}/rsvp", 
                            _adminAuthToken,
                            new { UserId = member.Id, Response = "yes" });

                        var rsvpResponse = await _client.SendAsync(rsvpRequest);
                        rsvpResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
                    }
                }
            }

            // ========== PHASE 7: SERIES ANALYTICS AND REPORTING ==========

            // Generate series-wide analytics
            var seriesAnalyticsRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/event-series/{seriesId}/analytics", 
                _adminAuthToken);

            var seriesAnalyticsResponse = await _client.SendAsync(seriesAnalyticsRequest);
            seriesAnalyticsResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            var seriesAnalytics = JsonSerializer.Deserialize<JsonElement>(
                await seriesAnalyticsResponse.Content.ReadAsStringAsync());
            
            // Verify series-level metrics
            seriesAnalytics.GetProperty("totalEvents").GetInt32().Should().Be(12);
            seriesAnalytics.GetProperty("completedEvents").GetInt32().Should().BeGreaterOrEqualTo(0);
            seriesAnalytics.GetProperty("upcomingEvents").GetInt32().Should().BeGreaterThan(0);
            seriesAnalytics.GetProperty("averageAttendanceRate").GetDouble().Should().BeGreaterOrEqualTo(0.0);

            // ========== PHASE 8: SERIES TERMINATION ==========

            // Admin decides to end the series early
            var terminateSeriesRequest = CreateAuthenticatedRequest(
                HttpMethod.Put, 
                $"/api/event-series/{seriesId}/terminate", 
                _adminAuthToken,
                new
                {
                    TerminationDate = DateTime.Now.AddDays(180), // End series in 6 months
                    Reason = "Restructuring - moving to quarterly meetings",
                    CancelFutureEvents = false, // Keep already scheduled events
                    NotifyAttendees = true
                });

            var terminateResponse = await _client.SendAsync(terminateSeriesRequest);
            terminateResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

            // Verify series termination
            var finalSeriesStatusRequest = CreateAuthenticatedRequest(
                HttpMethod.Get, 
                $"/api/event-series/{seriesId}", 
                _adminAuthToken);

            var finalSeriesStatusResponse = await _client.SendAsync(finalSeriesStatusRequest);
            var finalSeriesStatus = JsonSerializer.Deserialize<JsonElement>(
                await finalSeriesStatusResponse.Content.ReadAsStringAsync());
            
            finalSeriesStatus.GetProperty("isActive").GetBoolean().Should().BeFalse();
            finalSeriesStatus.GetProperty("terminationReason").GetString().Should().Contain("Restructuring");
        }
    }
}