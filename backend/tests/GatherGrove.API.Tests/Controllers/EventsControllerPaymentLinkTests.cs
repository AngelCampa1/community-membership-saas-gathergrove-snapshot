using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using NUnit.Framework;
using GatherGrove.Infrastructure.Data;
using GatherGrove.Domain.Entities;
using GatherGrove.Application.DTOs;
using System.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using GatherGrove.API.Tests.Shared;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class EventsControllerPaymentLinkTests
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;
    private GatherGroveDbContext _context = null!;
    private string _jwtToken = null!;
    private int _testClubId;
    private int _testUserId;

    [SetUp]
    public void Setup()
    {
        _factory = new TestWebApplicationFactory<Program>();

        // Get DbContext from factory
        var scope = _factory.Services.CreateScope();
        _context = scope.ServiceProvider.GetRequiredService<GatherGroveDbContext>();

        // Seed test data
        SeedTestData();

        // Create authenticated client using test authentication
        _client = _factory.CreateClient();
        _client.WithTestAuth(
            userId: _testUserId,
            clubId: _testClubId,
            isAdmin: true,
            role: "Admin",
            hasUnlimitedTier: false
        );

        // Keep JWT token generation for backward compatibility
        _jwtToken = GenerateJwtToken(_testUserId, _testClubId);
    }

    [TearDown]
    public void TearDown()
    {
        _client.Dispose();
        _context.Dispose();
        _factory.Dispose();
    }

    private void SeedTestData()
    {
        var user = new User
        {
            FullName = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = "hashedpassword",
            OnboardingCompleted = true
        };

        var club = new Club
        {
            Name = "Test Club",
            Tier = "Grow"
        };

        _context.Users.Add(user);
        _context.Clubs.Add(club);
        _context.SaveChanges();

        _testUserId = user.Id;
        _testClubId = club.Id;

        var clubAdmin = new ClubAdmin
        {
            UserId = user.Id,
            ClubId = club.Id
        };

        _context.ClubAdmins.Add(clubAdmin);
        _context.SaveChanges();
    }

    private string GenerateJwtToken(int userId, int clubId)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes("GatherGrove-Test-Secret-Key-For-JWT-Token-Generation-2024-Testing-Environment-Secure");

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim("UserId", userId.ToString()),
                new Claim("ClubId", clubId.ToString()),
                new Claim(ClaimTypes.Email, "admin@test.com")
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    [Test]
    [Category("PaymentLink")]
    public async Task GeneratePaymentLink_ForPaidEvent_ReturnsOkWithValidToken()
    {
        // Arrange - Create a paid event
        var paidEvent = new Event
        {
            ClubId = _testClubId,
            Name = "Premium Gala",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Grand Ballroom",
            Description = "Exclusive event",
            MemberPrice = 25.00m,
            NonMemberPrice = 50.00m
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{_testClubId}/events/{paidEvent.Id}/payment-link", null);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var result = await response.Content.ReadFromJsonAsync<PaymentLinkResponse>();
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.PaymentToken, Is.Not.Null.And.Not.Empty);
        Assert.That(result.PaymentLink, Does.Contain("/events/pay/"));
        Assert.That(result.PaymentLink, Does.Contain(result.PaymentToken));
        Assert.That(result.ExpiresAt, Is.EqualTo(paidEvent.EventDateTime).Within(TimeSpan.FromSeconds(1)));
    }

    [Test]
    [Category("PaymentLink")]
    public async Task GeneratePaymentLink_ForFreeEvent_ReturnsBadRequest()
    {
        // Arrange - Create a free event
        var freeEvent = new Event
        {
            ClubId = _testClubId,
            Name = "Community Meetup",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Community Center",
            Description = "Free event",
            MemberPrice = 0m,
            NonMemberPrice = 0m
        };
        _context.Events.Add(freeEvent);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{_testClubId}/events/{freeEvent.Id}/payment-link", null);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

        var error = await response.Content.ReadAsStringAsync();
        Assert.That(error, Does.Contain("free event").IgnoreCase);
    }

    [Test]
    [Category("PaymentLink")]
    public async Task GeneratePaymentLink_ForNonExistentEvent_ReturnsNotFound()
    {
        // Arrange
        var nonExistentEventId = 99999;

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{_testClubId}/events/{nonExistentEventId}/payment-link", null);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Category("PaymentLink")]
    public async Task GeneratePaymentLink_ForOtherClubEvent_ReturnsForbidden()
    {
        // Arrange - Create another club and event
        var otherClub = new Club
        {
            Name = "Other Club",
            Tier = "Sprout"
        };
        _context.Clubs.Add(otherClub);
        await _context.SaveChangesAsync();

        var otherClubEvent = new Event
        {
            ClubId = otherClub.Id,
            Name = "Other Club Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Other Location",
            Description = "Not accessible",
            MemberPrice = 10.00m,
            NonMemberPrice = 20.00m
        };
        _context.Events.Add(otherClubEvent);
        await _context.SaveChangesAsync();

        // Act - Try to generate link for other club's event
        var response = await _client.PostAsync($"/api/v1/clubs/{otherClub.Id}/events/{otherClubEvent.Id}/payment-link", null);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    [Category("PaymentLink")]
    public async Task GeneratePaymentLink_PaymentLinkUrlFormat_IsCorrect()
    {
        // Arrange
        var paidEvent = new Event
        {
            ClubId = _testClubId,
            Name = "Annual Dinner",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Hotel Ballroom",
            Description = "Fundraising dinner",
            MemberPrice = 75.00m,
            NonMemberPrice = 100.00m
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{_testClubId}/events/{paidEvent.Id}/payment-link", null);

        // Assert
        var result = await response.Content.ReadFromJsonAsync<PaymentLinkResponse>();
        Assert.That(result, Is.Not.Null);

        // Verify URL structure
        Assert.That(result!.PaymentLink, Does.Match(@"^https?://[^/]+/events/pay/[A-Za-z0-9_-]+$"));

        // Verify token is URL-safe (base64url encoding)
        Assert.That(result.PaymentToken, Does.Match(@"^[A-Za-z0-9_-]+$"));
        Assert.That(result.PaymentToken, Does.Not.Contain("+"));
        Assert.That(result.PaymentToken, Does.Not.Contain("/"));
        Assert.That(result.PaymentToken, Does.Not.Contain("="));
    }

    [Test]
    [Category("PaymentLink")]
    public async Task GeneratePaymentLink_ExpiresAt_MatchesEventDate()
    {
        // Arrange
        var futureDate = DateTime.UtcNow.AddMonths(3);
        var paidEvent = new Event
        {
            ClubId = _testClubId,
            Name = "Future Conference",
            EventDateTime = futureDate,
            Location = "Convention Center",
            Description = "Major conference",
            MemberPrice = 150.00m,
            NonMemberPrice = 200.00m
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.PostAsync($"/api/v1/clubs/{_testClubId}/events/{paidEvent.Id}/payment-link", null);

        // Assert
        var result = await response.Content.ReadFromJsonAsync<PaymentLinkResponse>();
        Assert.That(result, Is.Not.Null);
        Assert.That(result!.ExpiresAt, Is.EqualTo(futureDate).Within(TimeSpan.FromSeconds(1)));
    }

    [Test]
    [Category("PaymentLink")]
    public async Task GeneratePaymentLink_CalledTwice_RegeneratesNewToken()
    {
        // Arrange
        var paidEvent = new Event
        {
            ClubId = _testClubId,
            Name = "Charity Auction",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Auction House",
            Description = "Annual charity auction",
            MemberPrice = 50.00m,
            NonMemberPrice = 75.00m
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Act - Generate first token
        var response1 = await _client.PostAsync($"/api/v1/clubs/{_testClubId}/events/{paidEvent.Id}/payment-link", null);
        var result1 = await response1.Content.ReadFromJsonAsync<PaymentLinkResponse>();

        // Act - Generate second token
        var response2 = await _client.PostAsync($"/api/v1/clubs/{_testClubId}/events/{paidEvent.Id}/payment-link", null);
        var result2 = await response2.Content.ReadFromJsonAsync<PaymentLinkResponse>();

        // Assert - Tokens should be different
        Assert.That(result1, Is.Not.Null);
        Assert.That(result2, Is.Not.Null);
        Assert.That(result1!.PaymentToken, Is.Not.EqualTo(result2!.PaymentToken));
        Assert.That(result1.PaymentLink, Is.Not.EqualTo(result2.PaymentLink));
    }

    [Test]
    [Category("PaymentLink")]
    public async Task GeneratePaymentLink_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var paidEvent = new Event
        {
            ClubId = _testClubId,
            Name = "Private Event",
            EventDateTime = DateTime.UtcNow.AddDays(30),
            Location = "Private Venue",
            MemberPrice = 100.00m,
            NonMemberPrice = 150.00m
        };
        _context.Events.Add(paidEvent);
        await _context.SaveChangesAsync();

        // Remove authentication header
        var unauthenticatedClient = _factory.CreateClient();

        // Act
        var response = await unauthenticatedClient.PostAsync($"/api/v1/clubs/{_testClubId}/events/{paidEvent.Id}/payment-link", null);

        // Assert
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
