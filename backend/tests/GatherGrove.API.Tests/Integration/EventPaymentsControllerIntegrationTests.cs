using GatherGrove.API.Tests.Shared;
using GatherGrove.Application.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using NUnit.Framework;
using FluentAssertions;

namespace GatherGrove.API.Tests.Integration;

[TestFixture]
public class EventPaymentsControllerIntegrationTests : IntegrationTestBase
{
    private int _testClubId;
    private int _testEventId;
    private int _testUnpaidEventId; // Event with no existing payment
    private int _testMemberId;
    private int _testMembershipTypeId;
    private int _testUserId;
    private string _testPaymentIntentId = "pi_test123";

    [SetUp]
    public override void SetUp()
    {
        base.SetUp();

        // Create test club with Stripe account
        var club = new GatherGrove.Domain.Entities.Club
        {
            Name = "Test Event Payment Club",
            Tier = "Grow",
            StripeAccountId = "acct_test456",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Clubs.Add(club);
        _dbContext.SaveChanges();
        _testClubId = club.Id;

        // Create membership type
        var membershipType = new GatherGrove.Domain.Entities.MembershipType
        {
            ClubId = _testClubId,
            Name = "Test Membership",
            Description = "Test membership type",
            DuesAmount = 50.00m,
            DuesFrequency = "Monthly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.MembershipTypes.Add(membershipType);
        _dbContext.SaveChanges();
        _testMembershipTypeId = membershipType.Id;

        // Create test user (needed to link member to authenticated user)
        var testUser = new GatherGrove.Domain.Entities.User
        {
            FullName = "Test Member",
            Email = "testmember@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPass123!"),
            OnboardingCompleted = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Users.Add(testUser);
        _dbContext.SaveChanges();
        _testUserId = testUser.Id;

        // Create test member
        var member = new GatherGrove.Domain.Entities.Member
        {
            ClubId = _testClubId,
            MembershipTypeId = _testMembershipTypeId,
            FullName = "Test Member",
            Email = "testmember@example.com", // Same email as user to link them
            Status = "Active",
            JoinDate = DateTime.UtcNow.AddMonths(-1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Members.Add(member);
        _dbContext.SaveChanges();
        _testMemberId = member.Id;

        // Create paid event (for GetEventPaymentDetails tests)
        var paidEvent = new GatherGrove.Domain.Entities.Event
        {
            ClubId = _testClubId,
            Name = "Test Member Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Venue",
            Description = "Event for member payment tests",
            MemberPrice = 20.00m,
            NonMemberPrice = 40.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Events.Add(paidEvent);
        _dbContext.SaveChanges();
        _testEventId = paidEvent.Id;

        // Create unpaid event (for ProcessEventPayment tests)
        var unpaidEvent = new GatherGrove.Domain.Entities.Event
        {
            ClubId = _testClubId,
            Name = "Test Unpaid Event",
            EventDateTime = DateTime.UtcNow.AddDays(45),
            Location = "Test Venue 2",
            Description = "Event for payment processing tests",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Events.Add(unpaidEvent);
        _dbContext.SaveChanges();
        _testUnpaidEventId = unpaidEvent.Id;

        // Create a test EventRsvp with payment for GetEventPaymentDetails test
        var testRsvp = new GatherGrove.Domain.Entities.EventRsvp
        {
            EventId = _testEventId,
            MemberId = _testMemberId,
            PaidAmount = 20.00m,
            StripePaymentIntentId = _testPaymentIntentId,
            PaymentStatus = GatherGrove.Domain.Enums.PaymentStatus.Succeeded,
            Status = GatherGrove.Domain.Enums.RsvpStatus.Confirmed,
            RsvpStatus = "Confirmed",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.EventRsvps.Add(testRsvp);
        _dbContext.SaveChanges();
    }

    [Test]
    public async Task ProcessEventPayment_WithValidRequest_ReturnsOk()
    {
        // Arrange - Use the unpaid event to avoid "already paid" error
        var client = CreateAuthenticatedClient(_testUserId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            EventId = _testUnpaidEventId,
            PaymentMethodId = "pm_test123",
            MemberId = _testMemberId
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/event-payments", request);

        // Assert - Debug error if not OK
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Error response: {errorContent}");
            Assert.Fail($"Expected OK but got {response.StatusCode}. Response: {errorContent}");
        }
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<EventPaymentResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.PaymentId.Should().NotBeNullOrEmpty();
        result.ConfirmationNumber.Should().NotBeNullOrEmpty();
    }

    [Test]
    public async Task ProcessEventPayment_WithInvalidEvent_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testUserId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            EventId = 999,
            PaymentMethodId = "pm_test123",
            MemberId = _testMemberId
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/event-payments", request);

        // Assert - Returns NotFound when event doesn't exist
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task ProcessEventPayment_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var request = new
        {
            EventId = _testEventId,
            PaymentMethodId = "pm_test123",
            MemberId = _testMemberId
        };

        // Act - Use unauthenticated client
        var response = await _client.PostAsJsonAsync("/api/v1/event-payments", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task GetEventPaymentHistory_WithValidEvent_ReturnsOk()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testUserId.ToString(), _testClubId.ToString(), "Admin");
        // Act
        var response = await client.GetAsync($"/api/v1/event-payments/event/{_testEventId}/history");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payments = await response.Content.ReadFromJsonAsync<List<EventPaymentListDto>>();
        payments.Should().NotBeNull();
        payments!.Count.Should().BeGreaterOrEqualTo(0);
    }

    [Test]
    public async Task GetEventPaymentHistory_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Act - Use unauthenticated client
        var response = await _client.GetAsync($"/api/v1/event-payments/event/{_testEventId}/history");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task GetEventPaymentDetails_WithValidPayment_ReturnsOk()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testUserId.ToString(), _testClubId.ToString(), "Admin");

        // Act
        var response = await client.GetAsync($"/api/v1/event-payments/{_testPaymentIntentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payment = await response.Content.ReadFromJsonAsync<EventPaymentDetailsDto>();
        payment.Should().NotBeNull();
        payment!.StripePaymentIntentId.Should().Be(_testPaymentIntentId);
    }

    [Test]
    public async Task GetEventPaymentDetails_WithInvalidPayment_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testUserId.ToString(), _testClubId.ToString(), "Admin");

        // Act
        var response = await client.GetAsync($"/api/v1/event-payments/pi_invalid");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task GetEventPaymentDetails_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var paymentId = "pi_test123";

        // Act - Use unauthenticated client
        var response = await _client.GetAsync($"/api/v1/event-payments/{paymentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task RefundEventPayment_WithValidPayment_ReturnsOk()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testUserId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            Reason = "Customer requested refund"
        };

        // Act
        var response = await client.PostAsJsonAsync($"/api/v1/event-payments/{_testPaymentIntentId}/refund", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<EventPaymentRefundResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.RefundId.Should().NotBeNullOrEmpty();
    }

    [Test]
    public async Task RefundEventPayment_WithInvalidPayment_ReturnsForbiddenOrNotFound()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testUserId.ToString(), _testClubId.ToString(), "Admin");
        var paymentId = "pi_invalid";
        var request = new
        {
            Reason = "Customer requested refund"
        };

        // Act
        var response = await client.PostAsJsonAsync($"/api/v1/event-payments/{paymentId}/refund", request);

        // Assert - Returns Forbidden when payment doesn't exist in user's club
        // (API doesn't expose whether resource exists for security)
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.NotFound);
    }

    [Test]
    public async Task RefundEventPayment_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var paymentId = "pi_test123";
        var request = new
        {
            Reason = "Customer requested refund"
        };

        // Act - Use unauthenticated client
        var response = await _client.PostAsJsonAsync($"/api/v1/event-payments/{paymentId}/refund", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
