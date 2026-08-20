using System.Security.Claims;
using System.Text.Json;
using GatherGrove.API.Middleware;
using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace GatherGrove.API.Tests.Middleware;

[TestFixture]
public class BillingAccessMiddlewareTests
{
    private GatherGroveDbContext _context = null!;
    private Mock<RequestDelegate> _nextMock = null!;
    private BillingAccessMiddleware _middleware = null!;
    private DefaultHttpContext _httpContext = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new GatherGroveDbContext(options);
        _nextMock = new Mock<RequestDelegate>();
        _middleware = new BillingAccessMiddleware(
            _nextMock.Object,
            Mock.Of<ILogger<BillingAccessMiddleware>>());

        _httpContext = new DefaultHttpContext();
        _httpContext.Response.Body = new MemoryStream();
        _httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim("ClubId", "42") },
            "TestAuth"));
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task InvokeAsync_WithExpiredTrial_BlocksProtectedApiEndpoint()
    {
        // Arrange
        _httpContext.Request.Path = "/api/events";
        _context.Clubs.Add(new Club
        {
            Id = 42,
            Name = "Expired Trial Club",
            Tier = "Grow",
            SubscriptionStatus = "trialing",
            TrialExpiresAt = DateTime.UtcNow.AddDays(-1)
        });
        await _context.SaveChangesAsync();

        // Act
        await _middleware.InvokeAsync(_httpContext, _context);

        // Assert
        Assert.That(_httpContext.Response.StatusCode, Is.EqualTo(StatusCodes.Status402PaymentRequired));
        _nextMock.Verify(next => next(It.IsAny<HttpContext>()), Times.Never);

        _httpContext.Response.Body.Position = 0;
        var body = await new StreamReader(_httpContext.Response.Body).ReadToEndAsync();
        using var json = JsonDocument.Parse(body);
        Assert.That(json.RootElement.GetProperty("code").GetString(), Is.EqualTo("billing_required"));
    }

    [Test]
    public async Task InvokeAsync_WithExpiredTrial_AllowsBillingPortalEndpoint()
    {
        // Arrange
        _httpContext.Request.Path = "/api/v1/billing/customer-portal-session";
        _context.Clubs.Add(new Club
        {
            Id = 42,
            Name = "Expired Trial Club",
            Tier = "Grow",
            SubscriptionStatus = "trialing",
            TrialExpiresAt = DateTime.UtcNow.AddDays(-1)
        });
        await _context.SaveChangesAsync();

        // Act
        await _middleware.InvokeAsync(_httpContext, _context);

        // Assert
        _nextMock.Verify(next => next(_httpContext), Times.Once);
    }

    [Test]
    public async Task InvokeAsync_WithExpiredTrial_BlocksBillingHistoryPrefixLookalike()
    {
        // Arrange
        _httpContext.Request.Path = "/api/v1/billing-history";
        _context.Clubs.Add(new Club
        {
            Id = 42,
            Name = "Expired Trial Club",
            Tier = "Grow",
            SubscriptionStatus = "trialing",
            TrialExpiresAt = DateTime.UtcNow.AddDays(-1)
        });
        await _context.SaveChangesAsync();

        // Act
        await _middleware.InvokeAsync(_httpContext, _context);

        // Assert
        Assert.That(_httpContext.Response.StatusCode, Is.EqualTo(StatusCodes.Status402PaymentRequired));
        _nextMock.Verify(next => next(It.IsAny<HttpContext>()), Times.Never);
    }

    [Test]
    public async Task InvokeAsync_WithExpiredTrialAndNoClubClaim_BlocksClubScopedPath()
    {
        // Arrange
        _httpContext.Request.Path = "/api/v1/clubs/42/dashboard/summary";
        _httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(Array.Empty<Claim>(), "TestAuth"));
        _context.Clubs.Add(new Club
        {
            Id = 42,
            Name = "Expired Trial Club",
            Tier = "Grow",
            SubscriptionStatus = "trialing",
            TrialExpiresAt = DateTime.UtcNow.AddDays(-1)
        });
        await _context.SaveChangesAsync();

        // Act
        await _middleware.InvokeAsync(_httpContext, _context);

        // Assert
        Assert.That(_httpContext.Response.StatusCode, Is.EqualTo(StatusCodes.Status402PaymentRequired));
        _nextMock.Verify(next => next(It.IsAny<HttpContext>()), Times.Never);
    }

    [Test]
    public async Task InvokeAsync_WithActiveTrial_AllowsProtectedApiEndpoint()
    {
        // Arrange
        _httpContext.Request.Path = "/api/events";
        _context.Clubs.Add(new Club
        {
            Id = 42,
            Name = "Active Trial Club",
            Tier = "Grow",
            SubscriptionStatus = "trialing",
            TrialExpiresAt = DateTime.UtcNow.AddDays(10)
        });
        await _context.SaveChangesAsync();

        // Act
        await _middleware.InvokeAsync(_httpContext, _context);

        // Assert
        _nextMock.Verify(next => next(_httpContext), Times.Once);
    }
}
