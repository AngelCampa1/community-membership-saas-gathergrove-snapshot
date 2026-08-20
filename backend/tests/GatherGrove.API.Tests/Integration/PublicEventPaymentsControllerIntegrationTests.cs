using GatherGrove.API.Tests.Shared;
using GatherGrove.Application.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using NUnit.Framework;
using FluentAssertions;

namespace GatherGrove.API.Tests.Integration;

[TestFixture]
public class PublicEventPaymentsControllerIntegrationTests : IntegrationTestBase
{
    private int _testClubId;
    private int _testEventId;
    private int _testMembershipTypeId;

    [SetUp]
    public override void SetUp()
    {
        base.SetUp();

        // Create test club with Stripe account
        var club = new GatherGrove.Domain.Entities.Club
        {
            Name = "Test Payment Club",
            Tier = "Grow",
            StripeAccountId = "acct_test123", // Required for payment processing
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
            Name = "Standard Membership",
            Description = "Test membership",
            DuesAmount = 100.00m,
            DuesFrequency = "Yearly",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.MembershipTypes.Add(membershipType);
        _dbContext.SaveChanges();
        _testMembershipTypeId = membershipType.Id;

        // Create paid event
        var paidEvent = new GatherGrove.Domain.Entities.Event
        {
            ClubId = _testClubId,
            Name = "Test Paid Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Test Location",
            Description = "Test event for payment integration tests",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Events.Add(paidEvent);
        _dbContext.SaveChanges();
        _testEventId = paidEvent.Id;
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithValidGuestOnlyRequest_ReturnsOk()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testClubId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            EventId = _testEventId,
            PaymentMethodId = "pm_test123",
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            GuestPhone = "555-1234",
            CreateAccount = false
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/public/events/pay", request);

        // Assert - Debug error if not OK
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Error response: {errorContent}");
            Assert.Fail($"Expected OK but got {response.StatusCode}. Response: {errorContent}");
        }
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<NonMemberEventPaymentResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.ConfirmationNumber.Should().NotBeNullOrEmpty();
        result.MembershipCreated.Should().BeFalse();
        result.AccountCreated.Should().BeFalse();
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithMembershipUpgrade_ReturnsOkWithMembershipInfo()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testClubId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            EventId = _testEventId,
            PaymentMethodId = "pm_test123",
            GuestName = "Jane Smith",
            GuestEmail = "jane@example.com",
            MembershipTypeId = _testMembershipTypeId,
            CreateAccount = false
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/public/events/pay", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<NonMemberEventPaymentResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.MembershipCreated.Should().BeTrue();
        result.MembershipAmount.Should().BeGreaterThan(0);
        result.TotalAmount.Should().BeGreaterThan(result.EventAmount);
        result.MemberId.Should().NotBeNull();
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithAccountCreation_ReturnsOkWithAccountInfo()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testClubId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            EventId = _testEventId,
            PaymentMethodId = "pm_test123",
            GuestName = "Bob Johnson",
            GuestEmail = "bob@example.com",
            CreateAccount = true,
            Password = "SecurePass123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/public/events/pay", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<NonMemberEventPaymentResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.AccountCreated.Should().BeTrue();
        result.MemberId.Should().NotBeNull();
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithAllOptions_ReturnsOkWithAllInfo()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testClubId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            EventId = _testEventId,
            PaymentMethodId = "pm_test123",
            GuestName = "Alice Williams",
            GuestEmail = "alice@example.com",
            MembershipTypeId = _testMembershipTypeId,
            CreateAccount = true,
            Password = "SecurePass123!"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/public/events/pay", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<NonMemberEventPaymentResponse>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.MembershipCreated.Should().BeTrue();
        result.AccountCreated.Should().BeTrue();
        result.MembershipAmount.Should().BeGreaterThan(0);
        result.TotalAmount.Should().BeGreaterThan(result.EventAmount);
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithInvalidEvent_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testClubId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            EventId = 999,
            PaymentMethodId = "pm_test123",
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            CreateAccount = false
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/public/events/pay", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithMissingRequiredFields_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testClubId.ToString(), _testClubId.ToString(), "Admin");
        var request = new
        {
            EventId = _testEventId,
            PaymentMethodId = "pm_test123",
            GuestName = "",
            GuestEmail = "john@example.com",
            CreateAccount = false
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/public/events/pay", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task ProcessNonMemberEventPayment_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var request = new
        {
            EventId = _testEventId,
            PaymentMethodId = "pm_test123",
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            CreateAccount = false
        };

        // Act - Use unauthenticated client
        var response = await _client.PostAsJsonAsync("/api/v1/public/events/pay", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task GetAvailableMembershipTypes_WithValidEvent_ReturnsOk()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testClubId.ToString(), _testClubId.ToString(), "Admin");

        // Act
        var response = await client.GetAsync($"/api/v1/public/events/{_testEventId}/membership-types");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var types = await response.Content.ReadFromJsonAsync<List<MembershipTypeResponse>>();
        types.Should().NotBeNull();
        types!.Count.Should().BeGreaterOrEqualTo(0);
    }

    [Test]
    public async Task GetAvailableMembershipTypes_WithInvalidEvent_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAuthenticatedClient(_testClubId.ToString(), _testClubId.ToString(), "Admin");
        var eventId = 999;

        // Act
        var response = await client.GetAsync($"/api/v1/public/events/{eventId}/membership-types");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task GetAvailableMembershipTypes_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange - Use unauthenticated client
        var response = await _client.GetAsync($"/api/v1/public/events/{_testEventId}/membership-types");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
